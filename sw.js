// ============================================================
//  ShadowPing – Service Worker
//
//  WICHTIG: Dieser Service Worker wird beim Build NICHT durch
//  einen generierten Workbox-SW ersetzt (kein VitePWA-Plugin).
//  Er wird 1:1 nach dist/ kopiert und von main.jsx registriert.
//
//  Kein self.skipWaiting() bei install! Der neue SW wartet bis
//  der Nutzer explizit "Jetzt aktualisieren" antippt. Würde
//  skipWaiting() sofort feuern, würde mitten im Spiel die
//  Seite neu laden – das wäre fatal.
// ============================================================

const SHELL_CACHE = 'shadowping-shell-v1'

// ── Install: App-Shell vorcachen (Offline-Fähigkeit) ────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon.svg',
        '/icon-maskable.svg',
      ]))
      .catch(() => {}) // Fehler nicht fatal machen – SW installiert trotzdem
  )
})

// ── Activate: alte Caches aufräumen + Clients übernehmen ────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// ── Fetch: App-Shell + Assets stale-while-revalidate ─────────
// Nur gleicher Origin (nicht Supabase/Tiles/Nominatim).
// Bei jedem Besuch aktuelle Version nachladen, im Fehlerfall
// (offline) auf die gecachte Version zurückfallen.
self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return

  // Vite-Dateien unter /assets/ tragen einen Content-Hash im Dateinamen.
  // Sie sind unveränderlich: Nach dem ersten Abruf direkt aus dem Cache
  // bedienen, statt bei jedem Seitenbesuch erneut das Netzwerk zu belasten.
  const isHashedAsset = /^\/assets\/.*-[\w-]{8,}\.[^/]+$/.test(url.pathname)
  if (isHashedAsset) {
    const cachePromise = caches.open(SHELL_CACHE)
    const cachedPromise = cachePromise.then(cache => cache.match(req)).catch(() => null)
    const responsePromise = cachedPromise.then(cached => cached || fetch(req))
    const cachePromiseOnMiss = responsePromise.then(response =>
      cachedPromise.then(cached => {
        if (!cached && response && response.status === 200) {
          return cachePromise.then(cache => cache.put(req, response.clone())).catch(() => {})
        }
      })
    )
    event.waitUntil(cachePromiseOnMiss.catch(() => {}))
    event.respondWith(responsePromise)
    return
  }

  // Navigationen (Client-Side-Routing, z.B. /lobby/xyz): im Offline-/App-
  // Modus auf die gecachte App-Shell (index.html) zurückfallen. Sonst
  // schlägt jede Navigation ohne Netz fehl, obwohl die Shell gecacht ist.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.open(SHELL_CACHE).then(cache =>
          cache.match('/index.html').then(r => r || cache.match('/'))
        ).catch(() => undefined)
      )
    )
    return
  }

  // Für nicht-versionierte same-origin GETs bleibt stale-while-revalidate:
  // sofort gecachte Inhalte anzeigen und die Aktualisierung im Hintergrund
  // zuverlässig bis zum Ende der Anfrage speichern.
  const cachePromise = caches.open(SHELL_CACHE)
  const refreshPromise = cachePromise.then(cache =>
    fetch(req).then(res => {
      if (res && res.status === 200) {
        return cache.put(req, res.clone()).catch(() => {}).then(() => res)
      }
      return res
    })
  )
  event.waitUntil(refreshPromise.catch(() => {}))
  event.respondWith(cachePromise.then(async cache => {
    const cached = await cache.match(req)
    if (cached) return cached
    return refreshPromise.catch(() => cached)
  }))
})

// Nachricht vom App-Code empfangen
self.addEventListener('message', event => {
  // Nutzer hat "Jetzt aktualisieren" gedrückt
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }

  // In-App Notification anzeigen
  if (event.data?.type === 'NOTIFY') {
    const { title, body, tag, vibrate, silent } = event.data
    const url = event.data.url || '/'
    event.waitUntil(self.registration.showNotification(title, {
      body,
      icon:     '/icon.svg',
      badge:    '/icon.svg',
      vibrate:  vibrate || [250, 100, 250],
      tag:      tag || 'shadowping-alert',
      renotify: true,
      silent:   Boolean(silent),
      data:     { url },
    }))
  }
})

// Push-Notifications (für spätere Server-Push-Nachrichten)
self.addEventListener('push', event => {
  let data = {}
  try { data = event.data?.json() || {} }
  catch {
    try { data = JSON.parse(event.data?.text() || '{}') } catch {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'ShadowPing', {
      body:     data.body || '',
      icon:     '/icon.svg',
      badge:    '/icon.svg',
      vibrate:  [250, 100, 250],
      tag:      data.tag  || 'shadowping',
      renotify: true,
      silent:   false,
      data:     { url: data.url || '/' },
    })
  )
})

// Klick auf Notification → App öffnen / fokussieren
self.addEventListener('notificationclick', event => {
  event.notification.close()
  let targetUrl = new URL('/', self.location.origin)
  try { targetUrl = new URL(event.notification.data?.url || '/', self.location.origin) } catch {}
  if (targetUrl.origin !== self.location.origin) targetUrl = new URL('/', self.location.origin)
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const sameOrigin = list.filter(client => {
        try { return new URL(client.url).origin === self.location.origin } catch { return false }
      })
      const client = sameOrigin[0]
      if (client) {
        const navigation = typeof client.navigate === 'function'
          ? client.navigate(targetUrl.href).catch(() => client)
          : Promise.resolve(client)
        return navigation.then(focused => focused?.focus?.())
      }
      return clients.openWindow(targetUrl.href)
    })
  )
})
