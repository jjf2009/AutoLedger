You are an expert React Native and Expo engineer helping me build AutoLedger.
Write clean, simple, maintainable code. Prioritize clarity over unnecessary abstraction.
Think like a pragmatic senior mobile developer who values shipping over perfect architecture.

---

## Project Overview
We are building AutoLedger V1.0, a mobile utility to replace physical pen-and-paper billing
AND stock tracking for a single, independent bike-repair garage.

It does exactly these things, no more:
1. Tracks bike-part inventory (add/edit/restock/archive parts, category tag, cost vs sale price, low-stock warning, a simple stock-change history).
2. Bills a customer: bike number + a dynamic list of items (inventory parts or free-text labor), auto-calculates the total.
3. Lets a bill be saved as a **draft** and finished later — stock is only affected when a bill is finalized.
4. Prints a receipt via a small Bluetooth ESC/POS thermal printer when a bill is finalized.
5. Shows one simple read-only Reports screen (stock value, revenue/profit per part).
6. Backs up data to Supabase when the shop has wifi.

Keep the implementation simple, readable, and highly optimized for fast, one-handed data entry
by a mechanic. There is no login, no multi-tenancy, no backend server we run ourselves.

See `docs/` for one file per module (database, inventory, billing, reports, printer, sync) with
schema and interface details — read the relevant doc before touching that module.

---

## Tech Stack (Modern Expo)
- **Expo (SDK 56+)**
- **React Native**
- **TypeScript**
- **Expo Router** (File-based routing, Tabs for Billing / Inventory / Reports)
- **NativeWind v4+** (using `global.css`)
- **expo-sqlite** — the local, offline-first database and sole source of truth
- **Supabase** (`@supabase/supabase-js`) — one-way backup mirror only, pushed when online
- **A maintained ESC/POS Bluetooth printer library** (see `docs/printer.md` for the chosen
  library and rationale) — driving a real BLE thermal printer

**CRITICAL RULE:** Printing now requires a real Bluetooth ESC/POS library and therefore a
custom dev client / EAS build — **Expo Go no longer works** for this project once the printer
module is wired in. Do not try to force printer work into Expo Go.

Do not use deprecated React Navigation setups. Rely strictly on Expo Router.
Do not introduce new major libraries unless there is a strong reason. Do not use complex state
management like Redux or Zustand. Use React `useState`/`useReducer`.

---

## Development Philosophy
1. Read this file, and the relevant `docs/*.md` file, first.
2. Keep screens to exactly what's in the Architecture section below — resist adding more.
3. Avoid overengineering. Do not build our own backend server. Do not build Auth.
   Do not add barcode scanning, suppliers, multi-device sync, or a full
   incoming/outgoing/transfer documents module — these were deliberately scoped out.
4. Prefer readable code over clever code.
5. Refactor only when repetition appears.
6. Build order matters: inventory is the foundation. When extending the app, keep inventory
   correct and tested before adding billing/reporting features on top of it.

---

## Architecture
Use this exact, minimal folder structure:

```
app/
  _layout.tsx                 <-- Tabs: Billing, Inventory, Reports
  index.tsx                   <-- Billing screen (draft list + start new bill)
  bill/[id].tsx                 <-- Bill entry/edit screen (draft or finalize)
  inventory/
    index.tsx                   <-- Inventory list, filter by category, low-stock indicator
    add.tsx                      <-- Add part screen
    [id]/edit.tsx                 <-- Edit part + restock action
    [id]/history.tsx              <-- Per-part stock-change history
    [id]/delete.tsx                <-- Delete (archive) confirmation
  reports/
    index.tsx                    <-- Stock value + revenue/profit per part
components/                     <-- UI components (BigButton, ItemRow, PartCard, etc.)
services/
  db/
    schema.ts, index.ts, bills.ts, inventory.ts   <-- SQLite: schema, migrations, queries
  printer/
    types.ts, escposAdapter.ts, index.ts          <-- BLE ESC/POS printing, swappable adapter
  sync/
    supabase.ts                                    <-- one-way backup push
types/
docs/                          <-- one markdown file per module, read before editing that module
assets/
```

**services/** holds all isolated external/native connections (DB, printer, sync). Do not mix
DB queries or printer/BLE calls directly inside UI components — go through `services/`.

---

## UI Rules (The "Greasy Hands" Principle)
- Build for a greasy, busy garage environment.
- Touch targets must be MASSIVE. ALL buttons and inputs MUST be at least 64px tall. No tiny icons.
- Keyboard Optimization: Ensure `KeyboardAvoidingView` works flawlessly. Number inputs must use `keyboardType="numeric"`.
- Theme: Dark Mode ONLY. Background is `bg-neutral-900` (#121212) to hide screen smudges. Text must be stark white or high-contrast bright accents.

---

## Styling Rules (NativeWind v4)
Use NativeWind classes for all styling. Do not use `StyleSheet` unless absolutely necessary (e.g., `KeyboardAvoidingView` behavior props, Platform-specific shadows, or runtime animated values).

---

## State Management & Data
- **Local SQLite (`expo-sqlite`) is the sole source of truth**, always offline-capable. See `docs/database.md` for the full schema.
- **Supabase is a one-way backup mirror only** — push rows up when online, never read them back down. No conflict resolution, no auth beyond a single anon key. See `docs/sync.md`.
- Do not reintroduce Google Sheets or any always-on network dependency in the core billing/inventory save path. If a push to Supabase fails, retry later silently — never block or alert on a backup failure.
- Bill drafts do not touch inventory stock. Stock only changes (and logs a history row) when a bill is finalized, or when a part is explicitly restocked. See `docs/billing.md` and `docs/inventory.md`.

---

## Printing Logic (BLE ESC/POS)
- All printing goes through the `Printer` interface in `services/printer/types.ts` — never call the underlying BLE library directly from UI code, so the library can be swapped without touching screens.
- See `docs/printer.md` for the chosen library, pairing flow, and ESC/POS formatting approach.
- Always surface connect/print failures via a clear `Alert` — never fail silently, since this is the actual receipt handed to a customer.

---

## TypeScript
- Strict mode.
- No `any`.
- Define exact interfaces per `types/index.ts`: `InventoryPart`, `InventoryTransaction`, `Bill`, `BillItem`, `DraftBillItem`. Store prices as `number` in the DB layer; only form/draft state may hold prices as editable strings.

---

## Secrets
- Store the Supabase project URL and anon key in `.env`, accessed via `process.env.EXPO_PUBLIC_SUPABASE_URL` / `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY`.

---

## Final Reminder
Before generating any code:
- Read this file, and the relevant `docs/*.md` file for the module you're touching.
- Remember the scope is: Inventory + Billing (with drafts) + Reports + BLE printing + Supabase backup — nothing more.
- Aggressively push back if I ask you to build a login system, multi-tenancy, a backend server we host ourselves, barcode scanning, a supplier/customer CRM, or a full incoming/outgoing/transfer documents module — these were explicitly scoped out.
