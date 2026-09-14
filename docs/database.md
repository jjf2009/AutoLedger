# Database (`services/db/`)

AutoLedger's local SQLite database (`expo-sqlite`) is the **sole source of truth**. It works
fully offline; Supabase (see `sync.md`) is a one-way backup mirror pushed to when online, never
read back from.

## Setup

- Use `expo-sqlite`'s async API: `openDatabaseAsync`, `execAsync`, `runAsync`, `getAllAsync`.
- `services/db/index.ts` opens a single shared database instance and runs migrations on startup.
- Track schema version with `PRAGMA user_version`. On startup, read the current version, run any
  migration scripts newer than it in order, then bump `user_version`. Never mutate a shipped
  migration — add a new one.
- `services/db/schema.ts` holds the `CREATE TABLE IF NOT EXISTS` statements for a fresh install
  and the migration functions for upgrading an existing install.

## Schema

```sql
CREATE TABLE IF NOT EXISTS inventory_parts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  category TEXT,                            -- simple text tag, nullable
  cost_price REAL NOT NULL,
  sale_price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_archived INTEGER NOT NULL DEFAULT 0,   -- soft delete: keeps old bills resolvable
  is_synced INTEGER NOT NULL DEFAULT 0      -- pushed to Supabase yet?
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  part_id TEXT NOT NULL REFERENCES inventory_parts(id) ON DELETE CASCADE,
  quantity_delta INTEGER NOT NULL,          -- +N restock, -N sold/adjusted
  reason TEXT NOT NULL,                     -- 'restock' | 'sale' | 'adjustment'
  bill_id TEXT REFERENCES bills(id) ON DELETE SET NULL, -- set when reason = 'sale'
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY NOT NULL,
  bike_number TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',     -- 'draft' | 'finalized'
  created_at TEXT NOT NULL,
  finalized_at TEXT,                         -- set when status -> finalized
  is_synced INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bill_items (
  id TEXT PRIMARY KEY NOT NULL,
  bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  part_id TEXT REFERENCES inventory_parts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,       -- snapshot, survives later part edits/deletes
  cost_price REAL,          -- snapshot, nullable (labor has no cost)
  sale_price REAL NOT NULL, -- snapshot, what was charged
  quantity INTEGER NOT NULL DEFAULT 1,
  is_labor INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_part_id ON inventory_transactions(part_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_part_id ON bill_items(part_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
```

## Design rules to preserve

- **`bill_items` snapshots data.** `name`, `cost_price`, `sale_price` are copied onto the row at
  bill-item-creation time, not looked up live via `part_id`. This means a finalized bill (and any
  report built from it) never silently changes if a part is later renamed, repriced, or archived.
  `part_id` stays only as an optional back-reference for navigation (e.g. "view this part"),
  never as the source of truth for what a past bill charged.
- **`part_id` is nullable** to represent free-text labor line items that aren't linked to
  inventory at all (`is_labor = 1`).
- **Finalizing a bill is one transaction**: update `bills.status` to `'finalized'` and
  `finalized_at`, insert one `inventory_transactions` row per inventory-linked item
  (`quantity_delta = -quantity`, `reason = 'sale'`, `bill_id` set), and decrement
  `inventory_parts.quantity` for each. All of this must commit or roll back together — a crash
  mid-save must never leave stock decremented without a saved bill, or vice versa.
- **Restocking a part** (from the inventory edit screen) inserts one `inventory_transactions`
  row (`quantity_delta = +N`, `reason = 'restock'`, `bill_id = NULL`) and increments
  `inventory_parts.quantity`, also in one transaction.
- **`is_synced`** on `bills` and `inventory_parts` is how the sync module (`sync.md`) finds rows
  to push to Supabase. It is not read by anything else — never gate app behavior on it beyond
  sync bookkeeping.
- No `parts` history/versioning table beyond `inventory_transactions`, no `customers`/`suppliers`
  table, no multi-currency, no soft-delete on `bills`. These were deliberately left out —
  don't add them without a real, stated need.

## What lives where

| File | Responsibility |
|---|---|
| `services/db/schema.ts` | `CREATE TABLE` statements, migrations, `PRAGMA user_version` gate |
| `services/db/index.ts` | Opens/exports the shared database instance |
| `services/db/inventory.ts` | `getParts()`, `getPart(id)`, `createPart()`, `updatePart()`, `restockPart()`, `archivePart()`, `getPartHistory(id)` |
| `services/db/bills.ts` | `createDraftBill()`, `updateDraftBill()`, `finalizeBill()` (the stock-decrement transaction), `getDraftBills()`, `getBillById()` |

UI components never issue raw SQL — they call functions from `services/db/*`.
