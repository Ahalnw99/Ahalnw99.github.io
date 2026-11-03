/* Loop service worker: caches the app shell only. Everything else (YouTube, fonts, APIs) goes straight to the network and is never cached. */
const CACHE = 'loop-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // YouTube & all third parties: untouched
  const isShell = req.mode === 'navigate' || SHELL.some(p => new URL(p, self.registration.scope).href === url.href.split('#')[0]);
  if (!isShell) return;
  // network first (so updates show up), fall back to cached shell when offline
  e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, cp)); } return r; })
    .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req)));
});
