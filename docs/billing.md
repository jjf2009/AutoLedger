# Billing Module

Billing is built on top of the inventory module (see `inventory.md`) and is the second thing
built, after inventory is solid. A bill can be started, saved as a draft, and finished later —
stock is untouched until the bill is finalized.

## Screens

```
app/
  index.tsx        -- Billing tab home: list of draft bills + "New Bill" button
  bill/[id].tsx      -- bill entry/edit form (works for both a new draft and resuming an existing one)
```

There is no separate "new bill" screen — `bill/[id].tsx` with `id === 'new'` creates a draft on
first save, then navigates to `bill/<uuid>` so subsequent edits update the same row.

## Bill lifecycle

1. **Draft.** Bike number + a dynamic list of line items (see below). Saving at this stage only
   writes to `bills`/`bill_items` — no inventory effect at all. A mechanic can start a bill,
   leave for another job, and come back to it later from the draft list on the Billing tab.
2. **Finalize.** When the mechanic taps "Finalize & Print":
   - Validate: bike number present, at least one item, and — for inventory-linked items — enough
     stock available for the requested quantity (block or clearly warn on overselling, don't
     allow it to go silently negative).
   - In one SQLite transaction: set `bills.status = 'finalized'` and `finalized_at`, insert an
     `inventory_transactions` row per inventory-linked item (`reason = 'sale'`, `bill_id` set),
     and decrement each part's `quantity`.
   - After the transaction commits, hand the bill off to the printer (see `printer.md`).
   - A finalized bill is not editable afterward — it's a historical record now that stock and
     any report has been affected by it.

## Line items

Each row in the bill editor is one of two kinds:

- **Inventory-linked**: picked via `PartPickerSheet` from active (non-archived) inventory parts.
  Selecting a part pre-fills `name` and `sale_price` from the current part data (editable per
  line, e.g. a one-off discount), and sets `part_id`. Quantity defaults to 1, adjustable.
- **Free-text labor**: `is_labor = 1`, `part_id = NULL`, `cost_price = NULL`. The mechanic types
  a name (e.g. "Brake adjustment") and a price directly.

`ItemRow` (existing component from V0.1) is extended to support both modes rather than being
replaced — keep the existing dynamic-array-of-rows UX (add row / remove row) intact.

## Draft form state vs DB state

While editing, item prices are natural to hold as editable strings (matching V0.1's
`BillItem { price: string }` pattern) so the input doesn't fight the keyboard. Convert to
numbers only when writing to SQLite. Use a `DraftBillItem` type for this in-progress form shape,
distinct from the `BillItem` type that mirrors the `bill_items` table (numeric prices).

## What lives where

| File | Responsibility |
|---|---|
| `services/db/bills.ts` | `createDraftBill()`, `updateDraftBill()`, `finalizeBill()` (the transaction described above), `getDraftBills()`, `getBillById()` |
| `app/index.tsx` | Draft list (`DraftBillCard` per row) + "New Bill" entry point |
| `app/bill/[id].tsx` | The form: bike number, item rows, total, Save Draft / Finalize & Print |
| `components/PartPickerSheet.tsx` | Modal to search/pick an active inventory part into a line item |

## Explicitly out of scope

- Editing a finalized bill (create a new bill instead — this preserves the historical record and
  matches how real invoicing works).
- Partial payments, discounts as a first-class field, taxes/GST line items — add only if asked.
- Customer records — the bike number is the only identifier, as in V0.1.
