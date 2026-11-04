/* sw.js: solo para las notificaciones (carrito o diseño a medias). No toca la caché ni las peticiones de la web. */
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
