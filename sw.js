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

  // Navigationen (Client-Side-Routing, z.B. /lobby/xyz): im Offline-/App-
  // Modus auf die gecachte App-Shell (index.html) zurückfallen. Sonst
  // schlägt jede Navigation ohne Netz fehl, obwohl die Shell gecacht ist.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match('/index.html').then(r => r || caches.match('/'))
      )
    )
    return
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(SHELL_CACHE).then(c => c.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
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
    const { title, body, tag } = event.data
    self.registration.showNotification(title, {
      body,
      icon:     '/icon.svg',
      badge:    '/icon.svg',
      vibrate:  [250, 100, 250],
      tag:      tag || 'shadowping-alert',
      renotify: true,
      silent:   false,
    })
  }
})

// Push-Notifications (für spätere Server-Push-Nachrichten)
self.addEventListener('push', event => {
  const data = event.data?.json() || {}
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
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus()
      }
      return clients.openWindow(event.notification.data?.url || '/')
    })
  )
})
