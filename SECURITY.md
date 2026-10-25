# Security and data handling

This document describes behavior visible in the ShadowPing application source used to produce this deployment. It is a technical overview, not a guarantee about the current configuration or retention settings of the hosted services. The deployment repository does not contain the private application source, database schema, Row Level Security (RLS) policies, or provider contracts, so those settings cannot be verified here.

## Report a vulnerability

Please report suspected security issues privately to **gps.shadowping@gmail.com** with the subject `ShadowPing security report`. Include affected versions, steps to reproduce, and impact. Do not include another person's live location, credentials, or other sensitive user data in a report. Please allow the maintainer to investigate before publishing details. No response-time or remediation-time guarantee is currently published.

## Data the app processes

### Account and profile

- Email address and authentication credentials are handled by Supabase Auth. ShadowPing uses Supabase's PKCE sign-in flow and does not store the account password itself.
- The app offers email/password registration and OAuth sign-in buttons. OAuth authentication is handled by the selected provider and Supabase Auth.
- A profile contains a username/display name and a `last_seen` timestamp. The app updates `last_seen` about every 30 seconds while a signed-in session is running so friends can see online status.

### Match and social data

Supabase is used for friends and requests, lobby invitations, lobby names/codes/status/settings, participants and roles, teams, match events, capture-code state, and match results. Participant rows can also contain a generated per-installation `device_id` used to enforce the one-device-per-account lobby rule, online status, and battery level/charging state during a match.

### Location

Location permission is used during an active match. The browser build uses the Geolocation API; the Android wrapper can use its native game-tracking bridge when enabled. A position record can include latitude, longitude, accuracy, heading, speed, timestamp, player ID, and lobby ID.

- `player_positions` is upserted as the current position for a player.
- `location_history` receives additional position samples used by the results/replay view.
- The source contains no automatic deletion or retention job for `location_history`. Its actual retention therefore depends on the live database configuration and any administrative cleanup. Do not assume that location history is removed when a match ends.

The app also sends a typed place-search query to the Nominatim geocoding endpoint when a user searches for a play area. This is separate from the live GPS upload. MapLibre loads map styles and tiles from the configured OpenFreeMap endpoints (with a demo-map fallback); requests for the visible map area go to those providers.

### Device storage and permissions

Browser local storage is used for the Supabase session, language and theme choices, permission-screen state, a pending lobby code, a generated installation ID, and friend-notification deduplication IDs. The service worker's Cache Storage contains app-shell and static asset responses for offline loading. Clearing local app data removes local browser state; it does not delete server-side account, match, or location records.

Camera permission is used to scan capture QR codes. The camera stream is stopped after the scan flow; QR code generation happens in the app. Notification permission is used to display local browser or Android notifications. The source does not register a web push subscription or store a push token, so there is no configured server-push path for delivering notifications after the app has been closed.

## Data flow and providers

- **Cloudflare Pages:** serves the static web build. Requests to the site are handled by the hosting provider; its request logging and retention are governed by the active Cloudflare account settings.
- **Supabase:** handles authentication, database requests, and Realtime updates. The client contains the project's public URL and publishable/anon key as required for a browser app. That key is not a service-role key. Access control must come from the live database's RLS policies and grants; this repository cannot verify them.
- **OAuth provider:** receives the authentication data required for the provider selected by the user.
- **OpenFreeMap / MapLibre and Nominatim:** provide map styles/tiles and typed place search as described above.

No advertising or analytics SDK is present in the application source inspected for this document. This does not describe cookies, logs, or retention controls that may be applied by the hosting, authentication, map, or OAuth providers.

## Retention and deletion

The app overwrites the current-position row but appends match-location history. The source does not define an automatic purge period for location history, game events, or other match records. Retention and cascading deletion on the hosted database cannot be confirmed from this deployment repository.

The Settings screen's **clear local data** action clears browser `localStorage`; it is not an account or database deletion. Account deletion is currently requested by email at **gps.shadowping@gmail.com**. The app source does not implement self-service deletion of the Supabase account or a complete server-side data-erasure workflow. Contact the maintainer for a deletion request and specify the account email and username.

## Security boundaries

- The production JavaScript is public and must be treated as inspectable. Never put service-role keys, OAuth client secrets, or other server secrets in the web build.
- The anon/publishable key is public by design; it does not replace database authorization. RLS, grants, and any server-side functions must enforce user and lobby boundaries.
- Location data is sensitive. Use location access only for gameplay and revoke device permission when it is no longer wanted.
- This repository is generated deployment output. A review of it alone cannot certify the private source, Android package, live database policies, or hosting configuration.
