# ShadowPing – Build Output

This repository contains the production build of ShadowPing, a free GPS-based multiplayer game. The build is generated with Vite and deployed to Cloudflare Pages at https://shadowping.pages.dev.

## What is ShadowPing?

ShadowPing is a real-time GPS game where players take on the roles of hunters and runners. Hunters track runners in real time using GPS, while runners try to escape. The game supports private lobbies through invite codes and does not include ads or tracking.

You can try it live at https://shadowping.pages.dev or download the Android APK directly from https://shadowping.pages.dev/shadowping.apk.

## Repository contents

This repository only contains the generated build output from Vite. The source code is private and is not included here.

The most relevant files are:

- `assets/` – minified JavaScript and CSS bundles
- `index.html` – the app entry point with PWA and SEO metadata
- `manifest.json` – the PWA manifest
- `sw.js` – the service worker
- `_headers` – Cloudflare Pages headers
- `_redirects` – Cloudflare Pages redirects
- `robots.txt` – crawler rules
- `sitemap.xml` – the sitemap
- `shadowping.apk` – Android app download

## Security notes

The build includes the public Supabase anon key and project URL. This is expected for a client-side Supabase app. Access control is handled through Supabase Row Level Security (RLS), not by hiding the anon key.

No service role key or other private secret is included in this build.

Location data is only used during active games. More details are available on the privacy page: https://shadowping.pages.dev/auth.

## Deployment

This repository is used as the deployment target for Cloudflare Pages. The app is built from a private source repository, and only the generated `dist/` output is pushed here.

Cloudflare Pages deploys the `master` branch to https://shadowping.pages.dev.

## License

The ShadowPing source code is proprietary. This repository only contains build artifacts for hosting.

The open-source libraries used by the app, including React, Supabase, MapLibre and Vite, are covered by their own licenses.

## Links

- Live app: https://shadowping.pages.dev
- Android APK: https://shadowping.pages.dev/shadowping.apk
- Privacy page: https://shadowping.pages.dev/auth