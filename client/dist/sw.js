/* GDG on Campus BIT: image & asset cache.
   - Built files (/assets/*, hashed, never change) and gallery photos (/api/gallery/:id/image, immutable): cache first.
   - Fonts, /brand and Cloudinary pictures: show the saved copy instantly, refresh it in the background.
   - Pages (HTML), API data and everything else are NOT touched, so a new deploy is always picked up. */
const VERSION = 'v1'
const FILES = `gdg-files-${VERSION}`
const PICS = `gdg-pics-${VERSION}`
const MAX_PICS = 160

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (![FILES, PICS].includes(k)) await caches.delete(k)
    await self.clients.claim()
  })())
})

const keep = r => r && (r.ok || r.type === 'opaque') // opaque = cross-origin <img> (Cloudinary)

async function trim (cache) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - MAX_PICS; i++) await cache.delete(keys[i]) // oldest first
}

async function cacheFirst (req, name) {
  const cache = await caches.open(name)
  const hit = await cache.match(req, { ignoreVary: true })
  if (hit) return hit
  const res = await fetch(req)
  if (keep(res)) { cache.put(req, res.clone()); if (name === PICS) trim(cache) }
  return res
}

async function staleWhileRevalidate (req, name, event) {
  const cache = await caches.open(name)
  const hit = await cache.match(req, { ignoreVary: true })
  const refresh = fetch(req).then(res => { if (keep(res)) { cache.put(req, res.clone()); if (name === PICS) trim(cache) } return res }).catch(() => hit)
  if (hit) { event.waitUntil(refresh); return hit }
  return refresh
}

self.addEventListener('fetch', event => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  const same = url.origin === self.location.origin

  if (same && url.pathname.startsWith('/assets/')) return event.respondWith(cacheFirst(req, FILES))
  if (same && /^\/api\/gallery\/[a-f\d]{24}\/image$/i.test(url.pathname)) return event.respondWith(cacheFirst(req, PICS))
  if (same && /^\/(fonts|brand)\//.test(url.pathname)) return event.respondWith(staleWhileRevalidate(req, FILES, event))
  if (!same && url.hostname === 'res.cloudinary.com' && req.destination === 'image') return event.respondWith(staleWhileRevalidate(req, PICS, event))
})
