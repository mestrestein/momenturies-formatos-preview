/* Momenturies · aviso de cookies + píxel de Meta (28-oct-2026)
   - El píxel (Pixel | Momenturies | Shopify, 1917299959243159) solo se carga si el visitante acepta la publicidad.
     La elección se guarda en localStorage «mm_cookies» y se puede cambiar con cualquier enlace [data-mm-cookies].
   - Nunca se carga en la vista previa (/vista-cambios) ni fuera de momenturies.com. Para probar: ?fbtest=1 (dura la sesión).
   - Eventos de esta web: PageView, ViewContent, CustomizeProduct, AddToCart, Lead y Contact.
     InitiateCheckout y Purchase los manda Shopify (canal Facebook & Instagram): aquí NO, para no contarlos dos veces.
   - Las páginas llaman a window.mmTrack('Evento', {...}). Sin consentimiento no se manda nada.
   - La elección dura 6 meses; luego se vuelve a preguntar. Textos en inglés si la página está en inglés.
   - GA4: hueco preparado (vacío = sin Google Analytics). Al rellenarlo sale la casilla «Analítica» y va con Consent Mode v2.
   Sustituye al consent.js del commit b4e96b7 (mismo nombre, estaba apagado sin ID).
   - Klaviyo (11-nov-2026): KLAVIYO = clave pública (Site ID, 6 caracteres) y KLAVIYO_LISTA = id de la lista de novedades.
     Vacío = apagado. Su script (cookie __kla_id) va con el permiso de publicidad, igual que el píxel, y recibe
     Viewed Product y Added to Cart. El alta en la lista (formulario «lanzamiento») NO depende de las cookies: la persona
     da su correo a propósito; Klaviyo le manda el correo de confirmación (doble opt-in). */
(function () {
  var PIXEL = '1917299959243159', GA4 = '', CLARITY = '', KEY = 'mm_cookies', VERSION = 1, DURA = 182 * 864e5;
  var KLAVIYO = 'XD3GkM', KLAVIYO_LISTA = 'SUUQzW', KLAVIYO_API = '2024-10-15';
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

  /* Clarity (grabaciones y mapas de calor): solo con la analítica aceptada; se enciende poniendo el id arriba */
  var clarityCargado = false;
  function cargarClarity() {
    if (clarityCargado || !CLARITY || !activo) return;
    clarityCargado = true;
    (function (c, l, a, r, i, t, y) { c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); }; t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i; y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y); })(window, document, 'clarity', 'script', CLARITY);
  }
  /* analítica propia (seguimiento.js): se carga siempre; sin permiso solo cuenta la página, de forma anónima */
  function seguimiento(ana) {
    var run = function () { if (!window.mmSeguimiento) return; if (ana) mmSeguimiento.activar(); else mmSeguimiento.anonimo(); };
    if (window.mmSeguimiento) return run();
    var s = document.createElement('script'); s.src = 'seguimiento.js?v=2'; s.async = true; s.onload = run; document.head.appendChild(s);
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

  /* ═════ KLAVIYO (apagado mientras KLAVIYO esté vacío) ═════ */
  var klCargado = false;
  function kl(accion, a, b) { if (!KLAVIYO || !activo) return; window._learnq = window._learnq || []; window._learnq.push(b === undefined ? [accion, a] : [accion, a, b]); }
  function cargarKlaviyo() {
    if (klCargado || !KLAVIYO || !activo) return;
    klCargado = true;
    var s = document.createElement('script'); s.async = true; s.src = 'https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=' + KLAVIYO; document.head.appendChild(s);
    var vc = verContenido();
    if (vc) kl('track', 'Viewed Product', { ProductName: vc.content_name, ProductID: vc.content_ids[0], Categories: [vc.content_category], Price: vc.value || null, URL: location.href });
  }
  /* los eventos de Meta que Klaviyo también quiere (nombres de Klaviyo/Shopify para que valgan sus plantillas de flujos) */
  function aKlaviyo(evento, d) {
    if (!klCargado) return;
    if (evento === 'AddToCart') kl('track', 'Added to Cart', { $value: d.value, AddedItemProductName: d.content_name || (d.content_ids || []).join(', '),
      AddedItemProductID: (d.content_ids || [])[0], AddedItemQuantity: d.num_items, ItemNames: d.content_ids || [], CheckoutURL: location.href, URL: location.href });
  }
  /* alta en la lista: con la API pública de Klaviyo, sin cookies (la persona escribe su correo y pulsa el botón) */
  function suscribir(email, origen) {
    if (!KLAVIYO || !KLAVIYO_LISTA || !activo || !email) return;
    try {
      fetch('https://a.klaviyo.com/client/subscriptions?company_id=' + KLAVIYO, {
        method: 'POST', keepalive: true,
        headers: { 'content-type': 'application/vnd.api+json', revision: KLAVIYO_API },
        body: JSON.stringify({ data: { type: 'subscription', attributes: { custom_source: origen,
          profile: { data: { type: 'profile', attributes: { email: email, properties: { Idioma: en ? 'en' : 'es' } } } } },
          relationships: { list: { data: { type: 'list', id: KLAVIYO_LISTA } } } } })
      }).catch(function () {});
    } catch (e) {}
    kl('identify', { $email: email });
  }

  /* correo del panel de pago (editor.js): con permiso de publicidad, Klaviyo sabe de quién es el carrito y puede
     mandar el recordatorio si no termina. No lo apunta a la lista (eso solo con el formulario o la casilla de Shopify). */
  window.mmIdentificar = function (email) {
    var c = leer();
    if (!activo || !c || !c.ads || !email) return;
    cargarKlaviyo();
    kl('identify', { $email: email });
  };

  window.mmTrack = function (evento, datos) {
    var c = leer();
    if (!activo || !c || !c.ads) return false;
    if (cargado && window.fbq) fbq('track', evento, datos || {}); else cola.push([evento, datos || {}]);
    aKlaviyo(evento, datos || {});
    return true;
  };

  /* ViewContent según la página: [nombre, id, categoría, precio «desde»] */
  var DISENO = 'Diseños personalizados';
  var PAGINAS = {
    'ficha-cuadro.html': ['Cuadro de aluminio', 'cuadro', 'Cuadros', 19.99],
    'cuadro.html': ['Cuadro de aluminio', 'cuadro', 'Cuadros', 19.99],
    'ficha-sobremesa.html': ['Sobremesa de aluminio', 'sobremesa', 'Sobremesa', 28.99],
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
    if (nombre === 'lanzamiento') {
      mmTrack('Lead', { content_name: 'Aviso de apertura' });
      var em = f.querySelector('input[type="email"]');
      suscribir(em && em.value.trim(), 'Web · aviso de lanzamiento');
    }
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
    p: 'We use the necessary ones so the site and the editor work. If you let us, also analytics, to improve the site, and Meta’s, to know which ads bring you here. Your call.',
    nec: ['Necessary', 'Your design, the cart and the language. The site doesn’t work without them.'],
    ana: ['Analytics', 'See how the site is used (pages, buttons, steps in the editor) to improve it. Never what you write or your photos.'],
    ads: ['Advertising (Meta and Klaviyo)', 'Measure which ads work, show you ours on Facebook and Instagram and, if you gave us your email, remind you of what you left in the cart.'], link: 'Cookie settings'
  } : {
    t: 'Las cookies, en corto', mas: 'Más información', cfg: 'Configurar', guardar: 'Guardar', si: 'Aceptar', no: 'Rechazar', fij: 'Siempre activas',
    p: 'Usamos las necesarias para que la web y el editor funcionen. Si nos dejas, también las de analítica, para mejorar la web, y las de Meta, para saber qué anuncios te traen hasta aquí. Tú decides.',
    nec: ['Necesarias', 'Tu diseño, el carrito y el idioma. Sin ellas la web no funciona.'],
    ana: ['Analítica', 'Ver cómo se usa la web (páginas, botones, pasos del editor) para mejorarla. Nunca lo que escribes ni tus fotos.'],
    ads: ['Publicidad (Meta y Klaviyo)', 'Medir qué anuncios funcionan, enseñarte los nuestros en Facebook e Instagram y, si nos diste tu correo, recordarte lo que dejaste en el carrito.'], link: 'Configurar cookies'
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
        '<div class="op">' + fila(T.nec) + fila(T.ana, 'mmckAna') + fila(T.ads, 'mmckAds') + '</div>' +
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
    aShopify(guardar(ads, ana));
    if (caja) caja.style.display = 'none';
    if (ads) { cargarPixel(); cargarKlaviyo(); }
    if (ana) { cargarGA(); cargarClarity(); seguimiento(true); }
    // si retira un permiso con su script ya cargado, se recarga la página para quitarlo
    if ((!ads && (cargado || klCargado)) || (!ana && gaCargado)) location.reload();
  }
  window.mmCookies = { abrir: function () { abrir(true); } };

  /* ═════ SHOPIFY (11-nov-2026): la elección viaja al checkout ═════
     checkout.momenturies.com no ve el localStorage de la web. Con la API de privacidad de Shopify (modo headless) la
     elección se guarda en la cookie _tracking_consent de .momenturies.com: el checkout ya no vuelve a preguntar y el
     canal Facebook & Instagram manda InitiateCheckout y Purchase solo si aquí se aceptó la publicidad.
     El token (público, de Storefront) lo pone el worker de la web al servir este archivo, como en editor.js y cuenta.js. */
  var SHOPIFY = { storefrontToken: '', checkout: 'checkout.momenturies.com', raiz: 'momenturies.com' }, SHOP_KEY = 'mm_cookies_shop';
  function aShopify(c) {
    if (!activo || prueba || !SHOPIFY.storefrontToken || !c) return;
    try { if (localStorage.getItem(SHOP_KEY) === String(c.t)) return; } catch (e) {}
    var enviar = function () {
      var cp = window.Shopify && window.Shopify.customerPrivacy;
      if (!cp || !cp.setTrackingConsent) return;
      cp.setTrackingConsent({
        marketing: c.ads, analytics: c.ana, preferences: c.ana, sale_of_data: c.ads,
        headlessStorefront: true, checkoutRootDomain: SHOPIFY.checkout, storefrontRootDomain: SHOPIFY.raiz,
        storefrontAccessToken: SHOPIFY.storefrontToken
      }, function (err) { if (!err) try { localStorage.setItem(SHOP_KEY, String(c.t)); } catch (e) {} });
    };
    if (window.Shopify && window.Shopify.customerPrivacy) return enviar();
    var s = document.createElement('script'); s.async = true; s.onload = enviar;
    s.src = 'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js';
    document.head.appendChild(s);
  }

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
    seguimiento(!!(c && c.ana));
    if (!c) return window.top === window ? abrir(false) : undefined;   // 13-nov: dentro de un iframe (3D de la cuenta) el aviso ya sale en la página de fuera
    aShopify(c); // quien eligió antes de esto (o en otra pestaña) también llega al checkout con su elección
    if (c.ads) { cargarPixel(); cargarKlaviyo(); }
    if (c.ana) { cargarGA(); cargarClarity(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicio); else inicio();
})();
