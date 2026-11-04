/* seguimiento.js: analítica propia de Momenturies (los datos van al Vestuario, pestaña «Usuarios») y notificaciones.
   · Sin aceptar la analítica: solo se suma 1 a la página vista, sin identificar a nadie ni guardar nada en el navegador.
   · Aceptada: visitante anónimo (mm_v), páginas, clics en botones y enlaces, scroll, tiempo y pasos del personalizador.
     Nunca se manda lo que el cliente escribe, ni fotos, ni la IP.
   · ?noseguir=1 en la URL excluye este navegador (para vosotros). */
(function () {
  var API = 'https://staff.momenturies.com/t', VAPID = 'BD6YK3TgvtrOi_v6KtCwOQxyIgwOU9n8wPDStgwOMZUfGOIWrLYjvee_xh9I-1gdSjjGFlxsJhMNzIUahF-d7V0';
  var activo = /(^|\.)momenturies\.com$/.test(location.hostname) && location.pathname.indexOf('/vista-cambios') !== 0;
  var ls = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } };
  if (/[?&]noseguir=1/.test(location.search)) ls('mm_noseguir', '1');
  if (ls('mm_noseguir')) activo = false;
  var uid = function () { return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2)); };
  var cola = [], ok = false, v = null, s = null, origen = null, paginaYa = false;
  var path = location.pathname.replace(/\.html$/, '') || '/';
  var envia = function (cuerpo, url) {
    var t = JSON.stringify(cuerpo);
    try { if (navigator.sendBeacon && navigator.sendBeacon(API + (url || '/e'), new Blob([t], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(API + (url || '/e'), { method: 'POST', body: t, keepalive: true, headers: { 'content-type': 'text/plain' }, mode: 'cors' }); } catch (e) {}
  };
  function vuelca() { if (!ok || !cola.length) return; envia({ v: v, s: s, o: origen, ev: cola.splice(0, 60) }); }
  function ev(t, d) { if (!ok) return; cola.push({ t: t, n: Date.now(), p: path, d: d }); if (cola.length >= 40) vuelca(); }

  function deDonde() {
    var q = new URLSearchParams(location.search), u = q.get('utm_source');
    if (u) return u + (q.get('utm_campaign') ? ' / ' + q.get('utm_campaign') : '');
    if (q.get('fbclid')) return 'meta (anuncio)';
    if (q.get('gclid')) return 'google (anuncio)';
    try { var r = document.referrer && new URL(document.referrer).hostname; if (r && !/momenturies\.com$/.test(r)) return r.replace(/^www\./, ''); } catch (e) {}
    return null;
  }
  function etiqueta(el) {
    var t = (el.getAttribute('aria-label') || el.innerText || el.title || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    return (el.id ? '#' + el.id + ' ' : '') + (t || el.className || el.tagName);
  }
  function arranca() {
    if (ok || !activo) return;
    v = ls('mm_v'); if (!v) { v = uid(); ls('mm_v', v); }
    try {
      s = sessionStorage.getItem('mm_s'); origen = sessionStorage.getItem('mm_o');
      if (!s) { s = uid(); sessionStorage.setItem('mm_s', s); origen = deDonde(); if (origen) sessionStorage.setItem('mm_o', origen); }
    } catch (e) { s = s || uid(); }
    ok = true;
    if (!paginaYa) { paginaYa = true; ev('pagina', document.title.slice(0, 60)); }
    if (/\/(cuadro|sobremesa|iman)$/.test(path)) ev('editor');
    var hito = 0, ini = Date.now();
    addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - innerHeight; if (h < 200) return;
      var p = Math.floor((scrollY / h) * 4) * 25;
      if (p > hito) { hito = p; ev('scroll', p + ' %'); }
    }, { passive: true });
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('a,button,[role=button],summary');
      if (el) ev('clic', etiqueta(el));
    }, true);
    addEventListener('error', function (e) { ev('error', String(e.message || 'error').slice(0, 120) + ' @' + String(e.filename || '').split('/').pop() + ':' + e.lineno); });
    setInterval(vuelca, 5000);
    var fin = function () { if (document.visibilityState === 'hidden') { ev('tiempo', Math.round((Date.now() - ini) / 1000) + ' s'); vuelca(); } };
    document.addEventListener('visibilitychange', fin);
    addEventListener('pagehide', vuelca);
  }

  /* ── notificaciones ── */
  var estadoActual = null;
  var soporta = function () { return activo && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; };
  function claveBin() { var b = atob(VAPID.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, function (c) { return c.charCodeAt(0); }); }
  function alta() {
    return Notification.requestPermission().then(function (p) {
      if (p !== 'granted') { ls('mm_push_no', String(Date.now())); return; }
      return navigator.serviceWorker.register('/sw.js').then(function () { return navigator.serviceWorker.ready; })
        .then(function (r) { return r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveBin() }); })
        .then(function (sub) {
          var yo = ls('mm_v'); if (!yo) { yo = uid(); ls('mm_v', yo); }
          var e = estadoActual || {};
          envia({ endpoint: sub.endpoint, v: yo, estado: e.e, resumen: e.r, url: e.u }, '/push');
          ls('mm_push', '1'); ev('aviso_si');
        });
    }).catch(function () {});
  }
  var banner = null;
  function invita() {
    if (banner || !soporta() || Notification.permission !== 'default' || ls('mm_push') ) return;
    var no = +ls('mm_push_no') || 0; if (Date.now() - no < 60 * 864e5) return;
    banner = document.createElement('div');
    banner.setAttribute('role', 'dialog');
    banner.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;max-width:360px;margin:0 auto;z-index:2147483000;background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.25);padding:14px 16px;font:14px/1.4 Inter,system-ui,sans-serif;color:#1a1a1a';
    banner.innerHTML = '<b style="display:block;margin-bottom:2px">¿Te avisamos si se te queda a medias?</b><span style="color:#6b6560">Tu diseño queda guardado. Solo un recordatorio, sin más.</span><div style="display:flex;gap:8px;margin-top:10px"><button type="button" data-si style="flex:1;border:0;border-radius:999px;background:#1a1a1a;color:#fff;padding:9px;font:600 13px inherit;cursor:pointer">Sí, avisadme</button><button type="button" data-no style="border:0;background:none;color:#6b6560;padding:9px 10px;font:600 13px inherit;cursor:pointer">Ahora no</button></div>';
    banner.querySelector('[data-si]').onclick = function () { banner.remove(); alta(); };
    banner.querySelector('[data-no]').onclick = function () { banner.remove(); ls('mm_push_no', String(Date.now())); ev('aviso_no'); };
    document.body.appendChild(banner);
  }

  /* API para las páginas */
  window.mmEvento = function (t, d) { ev(t, d); };
  /* estado = editor | carrito | checkout: dónde se ha quedado, para el recordatorio */
  window.mmEstado = function (e, r, u) {
    var nuevo = { e: e, r: r, u: u || (location.pathname + '?' + (e === 'editor' ? 'retomar=1' : 'carrito=1')) };
    var igual = estadoActual && estadoActual.e === nuevo.e && estadoActual.r === nuevo.r;
    estadoActual = nuevo;
    if (!igual) { if (ok) ev('estado', nuevo); else if (ls('mm_push') && ls('mm_v')) envia({ v: ls('mm_v'), s: 'push', ev: [{ t: 'estado', n: Date.now(), p: path, d: nuevo }] }); }
    if (e === 'carrito') invita(); else if (e === 'editor') setTimeout(invita, 25000);
  };
  window.mmVisitante = function () { return ok || ls('mm_push') ? ls('mm_v') : null; };

  window.mmSeguimiento = {
    activar: arranca,
    anonimo: function () { if (activo && !ok) envia({ a: 1, p: path }); }
  };
})();
