You are an expert React Native and Expo engineer helping me build AutoLedger.
Write clean, simple, maintainable code. Prioritize clarity over unnecessary abstraction. 
Think like a pragmatic senior mobile developer who values shipping over perfect architecture.

---

## Project Overview
We are building AutoLedger V0.1, a bare-metal, single-screen mobile utility to replace physical pen-and-paper billing for a single, independent automotive garage.

The app acts as a highly optimized mobile UI on top of a Google Sheet.
It does exactly ONE thing:
1. Takes a Bike Number.
2. Takes a dynamic list of items (Parts/Labor) & Prices.
3. Auto-calculates the total.
4. Generates an HTML receipt and prints it via native OS dialog (`expo-print`).
5. Saves the transaction to a Google Sheet.

Keep the implementation simple, readable, and highly optimized for fast, one-handed data entry by a mechanic. There is no dashboard. There is no login.

---

## Tech Stack (Modern Expo)
- **Expo (Latest SDK 51+)**
- **React Native**
- **TypeScript**
- **Expo Router** (File-based routing)
- **NativeWind v4+** (using `global.css`)
- **Fetch API** (communicating with Google Sheets)
- **expo-print** (For receipt generation via HTML)

**CRITICAL RULE:** Do NOT use raw Bluetooth libraries (e.g., `react-native-bluetooth-classic`, `react-native-thermal-receipt-printer`). We are strictly using `expo-print` to render HTML strings and trigger the native system print dialog.

Do not use deprecated React Navigation setups. Rely strictly on Expo Router.
Do not introduce new major libraries unless there is a strong reason. Do not use complex state management like Redux or Zustand. Use React `useState`.

---

## Development Philosophy
1. Read this file first.
2. Keep the implementation strictly to ONE screen (`app/index.tsx`). 
3. Avoid overengineering. Do not build a backend. Do not build Auth. Do not build a database schema.
4. Prefer readable code over clever code.
5. Refactor only when repetition appears.

---

## Architecture
Use this exact, minimal folder structure:

app/
  index.tsx       <-- The ONLY screen
  _layout.tsx     <-- Root layout
components/       <-- UI components (BigButton, ItemRow, etc.)
services/
  sheets.ts       <-- Fetch calls to Google Apps Script Web App
  printer.ts      <-- HTML receipt generation & expo-print logic
types/
assets/

**app/index.tsx** holds the main form and dynamic array state (`[{name, price}]`).
**services/** holds isolated external connections. Do not mix API calls inside UI components.

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

## State Management & Data Fetching
- **Google Sheets is the sole database.**
- Use simple `fetch` calls to a Google Apps Script Web App (which proxies to the Sheet) to `POST` rows.
- The payload sent to Sheets must stringify the dynamic items array (e.g., `{ timestamp, bikeNumber, items: JSON.stringify(items), total }`).
- Do not implement offline sync. If the fetch fails, show a simple JS Alert.

---

## Printing Logic (expo-print)
- Construct the receipt as a simple, monospace HTML string inside `services/printer.ts`.
- Keep the HTML styling minimal (no external CSS, simple tables for line items, inline styles).
- Pass the HTML string to `Print.printAsync({ html })`.

---

## TypeScript
- Strict mode.
- No `any`.
- Define exact interfaces for the state: `interface BillItem { id: string; name: string; price: string; }`

---

## Secrets
- Store the Google Apps Script Web App URL in `.env` and access via `process.env.EXPO_PUBLIC_SHEET_URL`.

---

## Final Reminder
Before generating any code:
- Read this file.
- Remember we are building ONE screen. 
- Aggressively push back if I ask you to build dashboards, multi-tenancy, login screens, or relational databases.