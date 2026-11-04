/* app.js: Momenturies como app instalable (iPhone y Android).
   - Enlaza el manifiesto y los iconos, y activa sw.js (carga rápida y funciona con mala cobertura).
   - En el móvil, fuera de la app, avisa de que se puede instalar. Android: botón directo. iPhone: los dos pasos de Safari.
   - Dentro de la app (html.en-app): barra inferior con lo que más se usa. En el personalizador no sale.
   ?instalar en la URL vuelve a enseñar el aviso aunque se haya cerrado. */
(function () {
  var d = document, html = d.documentElement, CLAVE = 'mm_app_aviso', DIAS = 7;
  var enPreview = location.pathname.indexOf('/vista-cambios') === 0;
  var base = enPreview ? '/vista-cambios/' : '/';
  var leer = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };
  var poner = function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} };
  var tag = function (n, a) { var e = d.createElement(n); for (var k in a) e.setAttribute(k, a[k]); d.head.appendChild(e); };

  tag('link', { rel: 'manifest', href: base + 'manifest.webmanifest' });
  tag('link', { rel: 'apple-touch-icon', href: base + 'fotos/app-180.png' });
  tag('meta', { name: 'theme-color', content: '#f6f1ea' });
  tag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  tag('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  tag('meta', { name: 'apple-mobile-web-app-title', content: 'Momenturies' });
  tag('meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'default' });

  if ('serviceWorker' in navigator && !enPreview && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(function () {});

  var dentro = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  var movil = window.matchMedia && matchMedia('(max-width:820px)').matches && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  var editor = function () { return !!d.getElementById('editor'); };
  var css = function (t) { var s = d.createElement('style'); s.textContent = t; d.head.appendChild(s); };

  /* ── dentro de la app ── */
  function barra() {
    if (editor()) return;
    html.classList.add('en-app');
    css('html.en-app body{padding-bottom:calc(66px + env(safe-area-inset-bottom))}'
      + '.mm-tabs{position:fixed;left:0;right:0;bottom:0;z-index:1400;display:grid;grid-template-columns:repeat(5,1fr);background:rgba(255,255,255,.96);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border-top:1px solid #e6e0d7;padding-bottom:env(safe-area-inset-bottom)}'
      + '.mm-tabs a,.mm-tabs button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:62px;border:0;background:none;color:#5b5650;font:600 10.5px Inter,-apple-system,Arial,sans-serif;text-decoration:none;cursor:pointer;-webkit-tap-highlight-color:transparent}'
      + '.mm-tabs .on{color:#0d0d0d}.mm-tabs .crear{color:#c2613a}.mm-tabs svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}');
    var ic = {
      inicio: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
      crear: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
      paredes: '<rect x="3" y="3" width="8" height="10" rx="1"/><rect x="13" y="3" width="8" height="6" rx="1"/><rect x="13" y="11" width="8" height="10" rx="1"/><rect x="3" y="15" width="8" height="6" rx="1"/>',
      cuenta: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      carrito: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/>'
    };
    var p = location.pathname.replace(/^.*\//, '') || 'index.html', on = function (x) { return p === x ? ' class="on"' : ''; };
    var b = d.createElement('nav'); b.className = 'mm-tabs'; b.setAttribute('aria-label', 'Menú de la app');
    b.innerHTML = '<a href="/"' + on('index.html') + '><svg viewBox="0 0 24 24">' + ic.inicio + '</svg>Inicio</a>'
      + '<a href="/cuadro.html?retomar=1" class="crear"><svg viewBox="0 0 24 24">' + ic.crear + '</svg>Crear</a>'
      + '<a href="/paredes.html"' + on('paredes.html') + '><svg viewBox="0 0 24 24">' + ic.paredes + '</svg>Paredes</a>'
      + '<a href="/cuenta.html"' + on('cuenta.html') + '><svg viewBox="0 0 24 24">' + ic.cuenta + '</svg>Cuenta</a>'
      + '<button type="button" id="mmTabCarrito"><svg viewBox="0 0 24 24">' + ic.carrito + '</svg>Carrito</button>';
    d.body.appendChild(b);
    d.getElementById('mmTabCarrito').onclick = function () { var c = d.querySelector('[aria-label="Carrito"]'); if (c) c.click(); else location.href = '/'; };
  }

  /* ── aviso de instalar ── */
  var promptAndroid = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); promptAndroid = e; });
  window.addEventListener('appinstalled', function () { poner(CLAVE, String(Date.now() + 3650 * 864e5)); var a = d.getElementById('mmApp'); if (a) a.remove(); });

  function aviso() {
    if (d.getElementById('mmApp')) return;
    var ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    var interno = /Instagram|FBAN|FBAV|TikTok/.test(ua);
    var compartir = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 15V3M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
    var cuerpo = interno ? '<p class="p">Abre esta página en ' + (ios ? 'Safari' : 'Chrome') + ' para instalarla: toca los tres puntos y «Abrir en el navegador».</p>'
      : promptAndroid ? '<button type="button" class="ok" id="mmAppOk">Instalar gratis</button>'
      : ios ? '<ol><li>Toca ' + compartir + ' <b>Compartir</b>, abajo en Safari.</li><li>Elige <b>Añadir a pantalla de inicio</b>.</li></ol>'
      : '<ol><li>Abre el menú ⋮ del navegador.</li><li>Elige <b>Instalar aplicación</b> o <b>Añadir a pantalla de inicio</b>.</li></ol>';
    css('#mmApp{position:fixed;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:1600;background:#fff;border-radius:18px;padding:16px;box-shadow:0 16px 44px rgba(0,0,0,.26);font:14px/1.45 Inter,-apple-system,Arial,sans-serif;color:#0d0d0d;animation:mmAppIn .35s ease}'
      + '@keyframes mmAppIn{from{opacity:0;transform:translateY(16px)}}'
      + '#mmApp .t{display:flex;gap:12px;align-items:center;padding-right:24px}#mmApp img{width:48px;height:48px;border-radius:11px;flex:none}'
      + '#mmApp b.n{display:block;font-size:15.5px}#mmApp span{color:#5b5650;font-size:13px}'
      + '#mmApp ol{margin:12px 0 0;padding:0 0 0 20px}#mmApp li{margin:3px 0}#mmApp .p{margin:12px 0 0}'
      + '#mmApp .ok{display:block;width:100%;height:46px;margin-top:12px;border:0;border-radius:999px;background:#0d0d0d;color:#fff;font:700 15px Inter,-apple-system,Arial,sans-serif;cursor:pointer}'
      + '#mmApp .x{position:absolute;right:6px;top:6px;width:36px;height:36px;border:0;background:none;color:#8a8279;font-size:20px;cursor:pointer}');
    var a = d.createElement('div'); a.id = 'mmApp'; a.setAttribute('role', 'dialog'); a.setAttribute('aria-label', 'Instalar la app');
    a.innerHTML = '<button type="button" class="x" aria-label="Cerrar">×</button><div class="t"><img src="' + base + 'fotos/app-192.png" alt=""/><div><b class="n">Instala la app de Momenturies</b><span>Más rápida, a pantalla completa y con tu diseño siempre guardado.</span></div></div>' + cuerpo;
    d.body.appendChild(a);
    a.querySelector('.x').onclick = function () { poner(CLAVE, String(Date.now() + DIAS * 864e5)); a.remove(); };
    var ok = d.getElementById('mmAppOk');
    if (ok) ok.onclick = function () { promptAndroid.prompt(); promptAndroid.userChoice.then(function () { promptAndroid = null; a.remove(); poner(CLAVE, String(Date.now() + DIAS * 864e5)); }); };
  }
  /* espera a que se conteste el aviso de cookies y a que el personalizador no esté abierto */
  function cuandoLibre(n) {
    var editorAbierto = editor() && getComputedStyle(d.getElementById('editor')).display !== 'none';
    var cookies = [].some.call(d.querySelectorAll('button'), function (b) { return b.offsetParent !== null && /^Rechazar$/.test((b.textContent || '').trim()); });
    if (editorAbierto || cookies) { if (n > 0) setTimeout(function () { cuandoLibre(n - 1); }, 2000); return; }
    aviso();
  }
  function arranca() {
    if (dentro) { barra(); return; }
    var forzar = /[?&]instalar\b/.test(location.search);
    if (!movil && !forzar) return;
    if (!forzar && +(leer(CLAVE) || 0) > Date.now()) return;
    setTimeout(function () { cuandoLibre(90); }, forzar ? 300 : 3500);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', arranca); else arranca();
})();
