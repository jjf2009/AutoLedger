# Sync Module (`services/sync/`)

Supabase is a **one-way backup mirror**, not a database the app reads from. Local SQLite (see
`database.md`) is always the source of truth; this module only ever pushes local rows up, never
pulls remote rows down. This is a deliberate simplification for a single-device shop — there is
no multi-device sync and therefore no conflict resolution to build.

## Why Supabase, and why one-way

The father's phone won't always have good wifi, and the app must work perfectly offline —
that's the entire point of moving off Google Sheets to local SQLite. But a single phone is also
a single point of failure for the shop's transaction history, so a backup matters. A one-way
push, done opportunistically when online, gives that safety net without adding any network
dependency to the actual billing/inventory flows.

## What gets synced

- `bills` (only where `status = 'finalized'` — drafts are never pushed, there's nothing worth
  backing up in an incomplete bill).
- `bill_items` for those finalized bills.
- `inventory_parts`.
- `inventory_transactions` optionally, if a full remote audit trail is wanted — not required for
  V1, add if useful.

Each Supabase table mirrors the SQLite shape, reusing the client-generated UUID as primary key so
pushes are idempotent (safe to retry, safe to push the same row twice).

## How it works

- `services/sync/supabase.ts` exports `pushPendingChanges()`:
  1. Query local rows where `is_synced = 0` (see `database.md` for the flag).
  2. Upsert them to Supabase via `@supabase/supabase-js` (`.upsert(rows, { onConflict: 'id' })`).
  3. On success, set `is_synced = 1` locally for the pushed rows.
  4. On failure, do nothing further — the rows stay `is_synced = 0` and get retried next time.
- Trigger points for calling `pushPendingChanges()`:
  - App foreground / cold start.
  - Immediately after a bill is finalized (best-effort — don't block the print or the UI on it).
  - A manual "Sync now" button somewhere unobtrusive (e.g. Inventory or Reports screen), for
    peace of mind when the father knows he's on wifi.
- **Never** block, spinner, or alert the user over a sync failure — offline is the expected
  normal state for this app, not an error condition. Log to console for developer debugging only.

## Auth / secrets

- A single Supabase anon key is enough — this is a backup mirror for one shop, not a
  multi-tenant system. No login screen, no per-user rows.
- Store in `.env`: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Lock down the Supabase table's row-level security to accept writes from the anon key but not
  expose read access publicly, since bill data is business-sensitive even if there's no login.

## Explicitly out of scope

- Pulling data back down from Supabase into the app (no restore flow, no multi-device sync).
- Conflict resolution (last-write-wins, timestamps, merge logic) — not needed without a pull
  path.
- Real-time sync/live updates — this is a periodic backup push, not a live-sync system.
