# Reports Module

One simple, read-only screen. Built after inventory and billing are both solid, since it's
derived entirely from their data — no new tables, no writes.

## Screen

```
app/reports/index.tsx
```

## What it shows

- **Stock value**: `SUM(quantity * cost_price)` across active (non-archived) `inventory_parts` —
  "how much money is sitting on the shelf right now."
- **Revenue / profit per part, over a date range**: from `bill_items` joined to `bills` where
  `bills.status = 'finalized'` and `bills.finalized_at` falls in the selected range. For each
  part (grouped by `bill_items.name`, since that's the snapshot at time of sale):
  - Revenue = `SUM(sale_price * quantity)`
  - Cost = `SUM(cost_price * quantity)` (labor items have `cost_price = NULL`, treat as 0 cost)
  - Profit = Revenue − Cost
- A simple date-range picker (e.g. "This week / This month / All time") is enough — no custom
  calendar range picker unless asked.

## Rules

- **Read-only.** No editing, no export, no PDF/Excel generation in V1.
- **Query `bill_items`, not `inventory_parts`, for historical revenue/cost.** Because
  `bill_items` snapshots price data at sale time, reports stay accurate even after a part's
  current price changes — never join live against `inventory_parts.cost_price`/`sale_price` for
  historical figures.
- Draft bills are excluded entirely (`status = 'finalized'` only) — a draft isn't a real sale
  yet.
- This screen queries; it does not need its own file under `services/db/` — reuse query
  functions from `services/db/bills.ts` and `services/db/inventory.ts`, or add small dedicated
  read-only query functions there if a specific aggregate doesn't exist yet. Don't create a
  separate `services/db/reports.ts` unless the queries genuinely don't fit those files.

## Explicitly out of scope

- PDF/Excel export.
- Charts/graphs — plain numbers and a simple table are enough for V1.
- Per-category rollups, profit-margin percentage badges, comparisons to prior periods — nice
  ideas, but add only if the father actually asks after using the basic version.
