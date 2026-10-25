# Security and data use

This page explains in plain language what ShadowPing processes to provide the game. It describes the app's current behavior; it does not certify the configuration or retention practices of its hosting and service providers.

## Information used by the app

- **Account and profile:** Your email address is used to sign in. Your username and display name identify you to other players. The app also records recent activity so friends can see whether you are online.
- **Game activity:** Lobby participation, roles, teams, invitations, game events, settings, and results are processed to run and review matches. A random installation identifier helps limit an account to one device in a lobby. The app may also share battery level and charging state with lobby participants during a match.
- **Location:** When you join an active match, the app can use your device's location to show players on the map and calculate distances. Other players may see your position according to the lobby's visibility settings. The latest position is refreshed during play, and additional location samples are kept for the match replay/results view. The app has no automatic cleanup period for these samples, so they may remain stored after a match; the service's actual retention settings are not visible in this repository.
- **Camera:** Camera access is optional and is used to scan in-game capture codes. The camera feed is handled on your device and stopped when scanning ends.
- **Notifications:** If you allow them, the app can show game, friend, and lobby alerts on your device. The current app does not register for remote push delivery, so alerts generally require the app to be running and connected.
- **Local app data:** Sign-in state, language and theme choices, permission-screen state, a pending lobby code, a random installation identifier, and notification deduplication data may be stored on your device. The app also caches files needed to load the interface. Clearing local app data does not erase information already sent to the service.

## Services involved

ShadowPing uses Supabase for sign-in, account and game data, and live updates. Cloudflare Pages delivers the website. Map styles and map tiles come from OpenFreeMap, with a demo map as a fallback. When you search for a play area by name, the entered search text is sent to Nominatim. If you choose a social sign-in option, that identity provider and Supabase handle the authentication flow. These providers receive the network information needed to deliver their services; their own privacy and retention terms apply.

No advertising or analytics SDK is included in the app source inspected for this release. This does not rule out technical logs or storage maintained by the hosting, authentication, map, or identity providers.

## Storage, retention, and deletion

The app keeps a current location for live play and stores extra location samples for match results. The app source does not specify when those historical samples or other server-side game records are removed. Exact retention depends on the live service configuration, which is not included in this deployment repository.

The **clear local data** action in Settings clears browser storage on this device; it does not delete your account or server-side game data. Account deletion can be requested by email at **gps.shadowping@gmail.com**. The app currently has no self-service account-deletion flow. Include the email address and username for the account in your request.

## Security

The website and app communicate with their services over HTTPS. Sign-in is handled by Supabase; the app does not store your account password as game data. The browser app necessarily includes public connection information so it can reach its backend. It must not be treated as a private credential. Access to accounts and game data depends on the live service's access controls, which cannot be inspected from this deployment-only repository.

## Report a security issue

Please report suspected vulnerabilities privately to **gps.shadowping@gmail.com** with the subject `ShadowPing security report`. Include the affected app version, steps to reproduce, and likely impact. Do not include another person's live location, credentials, or other sensitive user data. Please give the maintainer time to investigate before publishing details. No response-time guarantee is currently published.
