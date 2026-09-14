# Printer Module (`services/printer/`)

Printing moves from V0.1's `expo-print` (HTML → OS print dialog) to a real Bluetooth ESC/POS
thermal printer, since that's the hardware the shop is actually buying. This is the
highest-risk, most hardware-dependent part of the app — keep it strictly isolated behind an
interface so the underlying library can be swapped without touching any UI or billing code.

## Why not `expo-print`

`expo-print` only talks to the OS print dialog (AirPrint / network printers). It cannot drive a
BLE ESC/POS thermal printer directly. `expo-print` may be kept temporarily during the migration
as a manual "Print as PDF" fallback (see phasing below), but it is not the primary path in V1.

## Library choice

Two realistic options, chosen based on the actual printer hardware bought:

- **`react-native-esc-pos-printer`** — wraps Epson's official ePOS SDK. Best reliability, has
  TypeScript types, actively maintained — but only works well with genuine Epson TM-series
  hardware.
- **`tp-react-native-bluetooth-printer`** — drives generic ESC/POS clone printers over Bluetooth
  Classic SPP (most cheap thermal printers a small shop would buy are Classic SPP, not BLE GATT,
  despite how they're marketed). Less polished than the Epson SDK — build more defensive
  error handling around it (retry connect, clear "printer not found" messaging).

**Decide which one once the actual printer model is known** — don't guess ahead of the hardware
purchase. Whichever is chosen, it is wrapped by the adapter below and nothing outside
`services/printer/` should import it directly.

## Interface

```typescript
// services/printer/types.ts
export interface PrinterDevice {
  id: string;   // BLE/MAC address
  name: string;
}

export interface ReceiptData {
  bikeNumber: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  timestamp: string;
}

export interface Printer {
  scanForDevices(): Promise<PrinterDevice[]>;
  connect(device: PrinterDevice): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  printReceipt(receipt: ReceiptData): Promise<void>;
}
```

- `services/printer/escposAdapter.ts` — the concrete implementation, translating `ReceiptData`
  into ESC/POS commands (text formatting, line spacing, paper cut) for the chosen library.
- `services/printer/index.ts` — exports a singleton `Printer`. This is the **only** file that
  changes if the underlying library is ever swapped.
- Billing code (`bill/[id].tsx` / `services/db/bills.ts`) calls `printer.printReceipt(...)` and
  nothing else — it never touches BLE APIs or the chosen library directly.

## Pairing / connection

- Persist the last-paired device id (a simple key-value row, or `expo-secure-store`) so the
  father doesn't have to re-pair every session.
- On app start (or first print attempt), try auto-reconnecting to the last device; if that
  fails, show a minimal "Connect Printer" flow: scan → list found devices → tap to connect.
- Always show a clear `Alert` on connect/print failure (printer off, out of range, out of paper
  if the library exposes status) — never fail silently, since this is the receipt a customer
  takes away.

## Build implications

- Any BLE printer library is a native module → **Expo Go stops working** for this project from
  this point on.
- Requires `expo-dev-client` + an EAS custom dev build (`eas build --profile development`).
  `expo start` alone will not pick up a newly added native module — a new dev-client build is
  needed whenever the printer library changes.
- BLE cannot be tested on a simulator/emulator — all printer work needs a real device paired
  with the real printer hardware.
- For distribution, an EAS **internal/preview** build (sideloaded APK or ad-hoc iOS build) is
  sufficient for a single shop's device(s) — no app store listing needed.

## Explicitly out of scope

- Multiple simultaneous printers / printer profiles.
- Printing anything other than the bill receipt (no barcode labels, no inventory reports to
  paper) unless asked.
