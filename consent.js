/* Momenturies · aviso de cookies + píxel de Meta (28-oct-2026)
   - El píxel (Pixel | Momenturies | Shopify, 1917299959243159) solo se carga si el visitante acepta la publicidad.
     La elección se guarda en localStorage «mm_cookies» y se puede cambiar con cualquier enlace [data-mm-cookies].
   - Nunca se carga en la vista previa (/vista-cambios) ni fuera de momenturies.com. Para probar: ?fbtest=1 (dura la sesión).
   - Eventos de esta web: PageView, ViewContent, CustomizeProduct, AddToCart, Lead y Contact.
     InitiateCheckout y Purchase los manda Shopify (canal Facebook & Instagram): aquí NO, para no contarlos dos veces.
   - Las páginas llaman a window.mmTrack('Evento', {...}). Sin consentimiento no se manda nada.
   - La elección dura 6 meses; luego se vuelve a preguntar. Textos en inglés si la página está en inglés.
   - GA4: hueco preparado (vacío = sin Google Analytics). Al rellenarlo sale la casilla «Analítica» y va con Consent Mode v2.
   Sustituye al consent.js del commit b4e96b7 (mismo nombre, estaba apagado sin ID). */
(function () {
  var PIXEL = '1917299959243159', GA4 = '', KEY = 'mm_cookies', VERSION = 1, DURA = 182 * 864e5;
  var path = location.pathname;

  var prueba = /[?&]fbtest=1(&|$)/.test(location.search);
  try {
    if (prueba) sessionStorage.setItem('mm_fbtest', '1');
    prueba = prueba || sessionStorage.getItem('mm_fbtest') === '1';
  } catch (e) {}
  var activo = prueba || (/(^|\.)momenturies\.com$/.test(location.hostname) && path.indexOf('/vista-cambios') !== 0);

  function leer() {
    try { var c = JSON.parse(localStorage.getItem(KEY) || 'null'); return c && c.v === VERSION && Date.now() - c.t < DURA ? c : null; } catch (e) { return null; }
  }
  function guardar(ads, ana) {
    var c = { v: VERSION, ads: !!ads, ana: !!ana, t: Date.now() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    return c;
  }

  /* ═════ GOOGLE ANALYTICS (apagado mientras GA4 esté vacío) ═════ */
  var gaCargado = false;
  if (GA4 && activo) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  }
  function cargarGA() {
    if (gaCargado || !GA4 || !activo) return;
    gaCargado = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4; document.head.appendChild(s);
    gtag('js', new Date()); gtag('config', GA4);
  }

  /* ═════ PÍXEL ═════ */
  var cargado = false, cola = [];
  function cargarPixel() {
    if (cargado || !activo) return;
    cargado = true;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', PIXEL);
    fbq('track', 'PageView');
    var vc = verContenido();
    if (vc) fbq('track', 'ViewContent', vc);
    cola.splice(0).forEach(function (a) { fbq('track', a[0], a[1]); });
  }

  window.mmTrack = function (evento, datos) {
    var c = leer();
    if (!activo || !c || !c.ads) return false;
    if (cargado && window.fbq) fbq('track', evento, datos || {}); else cola.push([evento, datos || {}]);
    return true;
  };

  /* ViewContent según la página: [nombre, id, categoría, precio «desde»] */
  var DISENO = 'Diseños personalizados';
  var PAGINAS = {
    'ficha-cuadro.html': ['Cuadro de aluminio', 'cuadro', 'Cuadros', 19.99],
    'cuadro.html': ['Cuadro de aluminio', 'cuadro', 'Cuadros', 19.99],
    'sobremesa.html': ['Sobremesa de aluminio', 'sobremesa', 'Sobremesa', 28.99],
    'ficha-iman.html': ['Imán de nevera', 'iman', 'Imanes', 9.99],
    'iman.html': ['Imán de nevera', 'iman', 'Imanes', 9.99],
    'colgador-iman.html': ['Colgador de imán', 'colgador', 'Accesorios', 3.99],
    'producto.html': ['Todos los formatos', 'formatos', 'Cuadros', 9.99],
    'paredes.html': ['Paredes de ensueño', 'paredes', 'Cuadros', null],
    'galeria.html': ['Galería de arte', 'galeria', 'Cuadros', null],
    'personalizados.html': ['Diseños personalizados', 'disenos', DISENO, null],
    'cielo.html': ['El cielo de vuestra noche', 'cielo', DISENO, null],
    'cielo-mapa.html': ['Cielo y mapa', 'cielo-mapa', DISENO, null],
    'luna.html': ['La Luna de vuestra noche', 'luna', DISENO, null],
    'mapa.html': ['Vuestro lugar en el mapa', 'mapa', DISENO, null],
    'dos-cielos.html': ['Dos cielos', 'dos-cielos', DISENO, null],
    'viaje.html': ['Cartel de viaje', 'viaje', DISENO, null],
    'onda.html': ['La onda de vuestra voz', 'onda', DISENO, null],
    'mapa-viajes.html': ['Mapa de viajes', 'mapa-viajes', DISENO, null],
    'lunas.html': ['Las lunas de un mes o un año', 'lunas', DISENO, null],
    'coordenadas.html': ['Vuestras coordenadas', 'coordenadas', DISENO, null],
    'constelacion.html': ['Tu constelación', 'constelacion', DISENO, null]
  };
  function verContenido() {
    var p = PAGINAS[path.split('/').pop()];
    if (!p) return null;
    var d = { content_name: p[0], content_ids: [p[1]], content_type: 'product', content_category: p[2] };
    if (p[3]) { d.value = p[3]; d.currency = 'EUR'; }
    return d;
  }

  /* Formularios: el aviso de apertura es un Lead y el de contacto un Contact */
  document.addEventListener('submit', function (e) {
    var f = e.target, nombre = f && f.getAttribute && f.getAttribute('name');
    if (nombre === 'lanzamiento') mmTrack('Lead', { content_name: 'Aviso de apertura' });
    else if (nombre === 'contacto') mmTrack('Contact', {});
  }, true);

  /* ═════ AVISO ═════ */
  var CSS = '.mmck{position:fixed;z-index:2147483000;left:16px;bottom:16px;max-width:430px;background:#fff;color:#1a1a1a;border-radius:16px;' +
    'box-shadow:0 18px 50px rgba(0,0,0,.22);padding:20px 20px 16px;font:14px/1.5 Inter,system-ui,-apple-system,sans-serif}' +
    '.mmck b.t{display:block;font-size:16px;margin-bottom:6px}.mmck p{margin:0 0 14px;color:#444}.mmck a{color:#c2613a}' +
    '.mmck .bs{display:flex;gap:8px}.mmck button{font:600 14px/1 Inter,system-ui,sans-serif;border-radius:999px;cursor:pointer;padding:12px 16px;flex:1;border:1.5px solid #1a1a1a;background:#1a1a1a;color:#fff}' +
    '.mmck button.cf{flex:0 0 auto;background:none;border-color:transparent;color:#1a1a1a;text-decoration:underline;padding:12px 6px}' +
    '.mmck .op{border-top:1px solid #eee;margin:0 0 14px;padding-top:12px;display:none}.mmck.cfg .op{display:block}' +
    '.mmck .row{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;padding:6px 0}.mmck .row span{font-size:13px;color:#555}' +
    '.mmck .row b{display:block;font-size:14px;color:#1a1a1a}.mmck .sw{flex:0 0 auto;width:42px;height:24px;margin-top:2px;accent-color:#c2613a}' +
    '.mmck .fij{flex:0 0 auto;font-size:12px;color:#2e7d32;font-weight:600;margin-top:3px}' +
    '@media(max-width:520px){.mmck{left:10px;right:10px;bottom:10px;max-width:none;padding:18px 16px 14px}}';
  var en = (document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'es').slice(0, 2) === 'en';
  var T = en ? {
    t: 'Cookies, in short', mas: 'More information', cfg: 'Settings', guardar: 'Save', si: 'Accept', no: 'Reject', fij: 'Always on',
    p: 'We use the necessary ones so the site and the editor work. If you let us, also Meta’s, to know which ads bring you here and show you things you’ll like. Your call.',
    nec: ['Necessary', 'Your design, the cart and the language. The site doesn’t work without them.'],
    ana: ['Analytics', 'Count visits to see what works on the site.'],
    ads: ['Advertising (Meta)', 'Measure which ads work and show you ours on Facebook and Instagram.'], link: 'Cookie settings'
  } : {
    t: 'Las cookies, en corto', mas: 'Más información', cfg: 'Configurar', guardar: 'Guardar', si: 'Aceptar', no: 'Rechazar', fij: 'Siempre activas',
    p: 'Usamos las necesarias para que la web y el editor funcionen. Si nos dejas, también las de Meta, para saber qué anuncios te traen hasta aquí y enseñarte cosas que te interesen. Tú decides.',
    nec: ['Necesarias', 'Tu diseño, el carrito y el idioma. Sin ellas la web no funciona.'],
    ana: ['Analítica', 'Contar las visitas para ver qué funciona en la web.'],
    ads: ['Publicidad (Meta)', 'Medir qué anuncios funcionan y enseñarte los nuestros en Facebook e Instagram.'], link: 'Configurar cookies'
  };
  function fila(d, id) {
    return '<div class="row"><div><b>' + d[0] + '</b><span>' + d[1] + '</span></div>' +
      (id ? '<input class="sw" type="checkbox" id="' + id + '" aria-label="' + d[0] + '">' : '<i class="fij">' + T.fij + '</i>') + '</div>';
  }
  var caja = null;
  function abrir(conOpciones) {
    if (!document.body) return;
    if (!caja) {
      var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
      caja = document.createElement('div');
      caja.className = 'mmck';
      caja.setAttribute('role', 'dialog');
      caja.setAttribute('aria-label', T.t);
      caja.innerHTML = '<b class="t">' + T.t + '</b><p>' + T.p + ' <a href="cookies.html">' + T.mas + '</a></p>' +
        '<div class="op">' + fila(T.nec) + (GA4 ? fila(T.ana, 'mmckAna') : '') + fila(T.ads, 'mmckAds') + '</div>' +
        '<div class="bs"><button type="button" data-a="no">' + T.no + '</button><button type="button" data-a="si">' + T.si + '</button>' +
        '<button type="button" class="cf" data-a="cfg">' + T.cfg + '</button></div>';
      caja.addEventListener('click', function (e) {
        var a = e.target.getAttribute && e.target.getAttribute('data-a');
        if (!a) return;
        if (a === 'cfg') {
          if (caja.classList.contains('cfg')) {
            var ana = document.getElementById('mmckAna');
            return elegir(document.getElementById('mmckAds').checked, ana ? ana.checked : false);
          }
          caja.classList.add('cfg');
          e.target.textContent = T.guardar;
          return;
        }
        elegir(a === 'si', a === 'si');
      });
      document.body.appendChild(caja);
    }
    var c = leer(), ana = document.getElementById('mmckAna');
    document.getElementById('mmckAds').checked = !!(c && c.ads);
    if (ana) ana.checked = !!(c && c.ana);
    caja.classList.toggle('cfg', !!conOpciones);
    caja.querySelector('[data-a="cfg"]').textContent = conOpciones ? T.guardar : T.cfg;
    caja.style.display = '';
  }
  function elegir(ads, ana) {
    var antes = leer();
    guardar(ads, ana);
    if (caja) caja.style.display = 'none';
    if (ads) cargarPixel();
    if (ana) cargarGA();
    // si retira un permiso con su script ya cargado, se recarga la página para quitarlo
    if ((!ads && cargado) || (!ana && gaCargado)) location.reload();
  }
  window.mmCookies = { abrir: function () { abrir(true); } };

  function enlaces() {
    // «Configurar cookies» junto a cada enlace a la política de cookies del pie (no en menús), y [data-mm-cookies] / [data-cookies]
    var as = document.querySelectorAll('a[href$="cookies.html"]');
    for (var i = 0; i < as.length; i++) {
      var a = as[i];
      if (a.closest('.mmck,nav,.legal-nav,.menu-body,[class*="menu"]') || a.getAttribute('data-mm-hecho')) continue;
      a.setAttribute('data-mm-hecho', '1');
      var n = document.createElement('a');
      n.href = '#'; n.textContent = T.link; n.setAttribute('data-mm-cookies', '');
      a.parentNode.insertBefore(n, a.nextSibling);
      a.parentNode.insertBefore(document.createTextNode(' · '), n);
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-mm-cookies],[data-cookies]');
      if (t) { e.preventDefault(); abrir(true); }
    });
  }

  function inicio() {
    enlaces();
    var c = leer();
    if (!c) return abrir(false);
    if (c.ads) cargarPixel();
    if (c.ana) cargarGA();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicio); else inicio();
})();
