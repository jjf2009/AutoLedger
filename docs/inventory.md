# Inventory Module

The inventory module is the foundation of the app — it ships and is fully usable on its own
before billing is built on top of it. It tracks bike parts in stock: what the shop has, what it
paid for each part, what it charges, and a history of every stock change.

## Screens

```
app/inventory/
  index.tsx        -- list of parts, filterable by category, low-stock parts visually flagged
  add.tsx           -- add a new part (name, category, cost price, sale price, starting quantity)
  [id]/edit.tsx      -- edit a part's fields; also where "restock" (add stock) happens
  [id]/history.tsx   -- read-only list of that part's inventory_transactions, newest first
  [id]/delete.tsx    -- confirmation screen; archives the part (soft delete), doesn't hard-delete
```

`[id]/edit.tsx` handling both editing fields and restocking (rather than a separate restock
screen) keeps the screen count down — a "+ Add Stock" action on the edit screen prompts for a
quantity and reason, then calls `restockPart()`.

## Data flow

- All reads/writes go through `services/db/inventory.ts` — never raw SQL from a screen.
- `createPart()` inserts into `inventory_parts` with the given `quantity` as the starting stock;
  it does **not** need an `inventory_transactions` row for the initial creation (there's nothing
  to log a "change" against yet) — only later restocks and sales create transaction rows.
- `restockPart(partId, quantityAdded)` — inserts an `inventory_transactions` row
  (`quantity_delta = +quantityAdded`, `reason = 'restock'`) and increments
  `inventory_parts.quantity`, in one transaction.
- `archivePart(partId)` sets `is_archived = 1`. Archived parts are hidden from the inventory list
  and the billing part-picker, but are never deleted — old bills that reference them by
  `part_id` must still resolve, and their `bill_items` snapshot means the bill displays correctly
  regardless.
- Stock **decrements** are not triggered from this module directly — they happen as part of
  `finalizeBill()` in the billing module (see `billing.md`), which calls into the same
  `inventory_transactions` mechanism from within its own transaction.

## Fields

| Field | Notes |
|---|---|
| `name` | required, free text |
| `category` | optional free-text tag (e.g. "Brakes", "Electrical", "Tyres") — a simple filter on the list screen, not a managed taxonomy. Don't build a separate category CRUD screen. |
| `cost_price` | what the shop paid — used for stock-value and profit reporting |
| `sale_price` | what the customer is charged — used as the default price when picked into a bill (editable per bill line if needed) |
| `quantity` | current stock on hand |
| `low_stock_threshold` | default 3; list screen flags any part at or below this |

## Explicitly out of scope

These appeared in a reference inventory app the user reviewed and were deliberately **not**
adopted for V1 — don't add them without the user asking again:

- Barcode scanning / camera integration.
- Supplier or customer records tied to stock movements.
- A full incoming/outgoing/transfer "documents" workflow (`inventory_transactions` is a plain
  append-only log, not a document system with its own approval/state).
- Multi-store / multi-location inventory.
- Category management screen (hierarchy, colors, icons) — category is just a text field.
