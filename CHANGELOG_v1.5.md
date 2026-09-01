# ShadowPing v1.5 – Changelog

## Added

### Per-account, per-lobby device lock
- New `device_id` column on `lobby_players` (run once in Supabase SQL Editor):
  ```sql
  alter table public.lobby_players add column if not exists device_id text;
  ```
- Persistent device ID generated client-side (stored in localStorage, survives reloads).
- On join/create/accept-invite/rematch: the current device's ID is written to `device_id`.
- Legacy rows (NULL `device_id`) are "adopted" by the first device that opens them.
- Guard effects in `Lobby` and `Game`:
  - If `myPlayer.device_id` exists and differs from current device → block screen shown, all background mutations (heartbeat, GPS, battery, beforeunload offline) are disabled.
  - If `myPlayer.device_id` is NULL → current device claims the row via UPDATE.
- Block screen shows localized message (`common.device.other`) with "Back to Dashboard" button.
- All `lobby_players` insert/upsert paths updated: Dashboard (create/join), Lobby (host auto-join), Results (rematch host + joiners), InboxContext (invite accept).

### Display name fix on join
- Removed generic "Spieler" fallback.
- Name resolution order: `profile.username` (trimmed) → `user.email` prefix (trimmed) → empty string (UI shows placeholder).
- `Dashboard`: new `autoName` derived value + `useEffect` that pre-fills `joinName` once profile loads asynchronously.
- `InboxContext`: invite accept uses same resolution (email prefix, no "Spieler").
- All three join entry points (manual code, QR scan, pending-join button) now use `autoName`.

## Changed

- `src/lib/device.js` (new): `getDeviceId()` helper for persistent device identity.
- `src/lib/i18n.jsx`: added `common.device.other` translation (DE/EN).
- `src/pages/Dashboard.jsx`: join/create logic rewritten with device check, race-condition handling (23505 unique constraint), name pre-fill fix.
- `src/pages/Lobby.jsx`: host upsert includes `device_id`; guard effect + blocked state; heartbeat/offline gated by `blocked`.
- `src/pages/Game.jsx`: guard effect + blocked state; GPS/battery/heartbeat/offline gated by `blocked`; early return block screen.
- `src/pages/Results.jsx`: both rematch insert paths include `device_id`.
- `src/context/InboxContext.jsx`: invite accept insert includes `device_id`; name fallback fixed.

## Migration

Run once in Supabase → SQL Editor:
```sql
alter table public.lobby_players add column if not exists device_id text;
```

No further steps required. Existing lobbies work immediately; first device to open adopts the row.