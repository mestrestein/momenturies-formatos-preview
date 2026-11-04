/* sw.js: notificaciones (carrito o diseño a medias) y, desde el 4-nov, la app: las páginas siempre de la red si hay
   cobertura (si no, la última guardada) y fotos, scripts y estilos desde la caché mientras se actualizan por detrás. */
const CACHE = 'mm-app-1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/vista-cambios') || r.headers.has('range')) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(h => h.put(r, c)); } return res; })
      .catch(async () => (await caches.match(r)) || (await caches.match('/')) || Response.error()));
    return;
  }
  if (!/\.(js|css|webp|jpg|jpeg|png|svg|woff2|glb)$/i.test(u.pathname)) return;
  e.respondWith((async () => {
    const h = await caches.open(CACHE), v = await h.match(r);
    const red = fetch(r).then(res => { if (res.ok) h.put(r, res.clone()); return res; });
    if (v) { e.waitUntil(red.catch(() => {})); return v; }
    return red;
  })());
});
const API = 'https://staff.momenturies.com/t/push/msg';
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let m = { title: 'Momenturies', body: 'Tu diseño sigue guardado.', url: '/cuadro.html?retomar=1' };
    try {
      const s = await self.registration.pushManager.getSubscription();
      const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ endpoint: s && s.endpoint }) });
      if (r.ok) m = await r.json();
    } catch (_) {}
    await self.registration.showNotification(m.title, { body: m.body, data: { url: m.url }, icon: '/fotos/icono-192.png', tag: 'momenturies-aviso' });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow((e.notification.data && e.notification.data.url) || '/'));
});
