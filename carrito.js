/* carrito.js — el carrito y «Mi cuenta» de la cabecera, en todas las páginas (16-oct-2026).
   El carrito de Momenturies es el diseño que el cliente está montando en el editor: editor.js lo
   guarda en IndexedDB (base «momenturies», almacén «handoff», clave «design») con un «resumen» de
   piezas y precios. Aquí solo se lee ese resumen; para pagar o seguir se vuelve al editor
   (cuadro.html?carrito=1 / ?retomar=1), o se abre directamente si la página ya lo tiene cargado. */
(function () {
  var ENVIO_GRATIS = 60;
  var DB = 'momenturies', STORE = 'handoff', KEY = 'design', TTL = 30 * 24 * 3600e3;

  function leer() {
    return new Promise(function (res) {
      if (!window.indexedDB) return res(null);
      try {
        var r = indexedDB.open(DB, 1);
        r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
        r.onerror = function () { res(null); };
        r.onsuccess = function () {
          var db = r.result;
          try {
            var q = db.transaction(STORE, 'readonly').objectStore(STORE).get(KEY);
            q.onsuccess = function () { db.close(); res(q.result || null); };
            q.onerror = function () { db.close(); res(null); };
          } catch (e) { db.close(); res(null); }
        };
      } catch (e) { res(null); }
    });
  }
  function borrar(saved) {
    return new Promise(function (res) {
      var r = indexedDB.open(DB, 1);
      r.onsuccess = function () {
        var db = r.result, t = db.transaction(STORE, 'readwrite'), s = t.objectStore(STORE);
        (saved && saved.items || []).forEach(function (it) { if (it.photo) s.delete(it.photo); });
        s.delete(KEY);
        t.oncomplete = function () { db.close(); res(); };
        t.onerror = function () { db.close(); res(); };
      };
      r.onerror = function () { res(); };
    });
  }

  var eur = function (n) { return (n || 0).toFixed(2).replace('.', ',') + ' €'; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var css = '' +
    '.mc-veil{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998;opacity:0;pointer-events:none;transition:opacity .3s}' +
    '.mc-veil.open{opacity:1;pointer-events:auto}' +
    '.mc{position:fixed;top:0;right:0;bottom:0;width:min(420px,100vw);background:#fff;z-index:9999;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);font-family:Inter,"Helvetica Neue",Arial,sans-serif;color:#0d0d0d;box-shadow:-20px 0 60px rgba(0,0,0,.15)}' +
    '.mc.open{transform:none}' +
    '.mc-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid #eee}' +
    '.mc-head b{font-family:Georgia,serif;font-size:22px}' +
    '.mc-head b small{font-family:Inter,Arial,sans-serif;font-size:13px;color:#888;font-weight:500;margin-left:6px}' +
    '.mc-x{width:38px;height:38px;border-radius:50%;border:1px solid #e5e5e5;background:#fff;cursor:pointer;font-size:18px;line-height:1}' +
    '.mc-body{flex:1;overflow-y:auto;padding:8px 22px}' +
    '.mc-envio{margin:14px 0 6px;font-size:13px;color:#555}' +
    '.mc-envio b{color:#0d0d0d}' +
    '.mc-envio i{display:block;height:5px;border-radius:5px;background:#eee;margin-top:8px;overflow:hidden}' +
    '.mc-envio i u{display:block;height:100%;background:#2f6f4f;border-radius:5px;transition:width .5s}' +
    '.mc-pared{margin:12px 0 4px;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;font-weight:800;color:#888}' +
    '.mc-l{display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid #f0f0f0}' +
    '.mc-l .t{width:64px;height:64px;border-radius:8px;background:#f2efe9 center/cover;box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}' +
    '.mc-l b{display:block;font:700 15px Inter,Arial,sans-serif;color:#0d0d0d}' +
    '.mc-l span{font-size:13px;color:#888}' +
    '.mc-l em{font-style:normal;font-weight:700;font-size:15px;white-space:nowrap}' +
    '.mc-aviso{margin:14px 0;background:#fdf6e9;border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.45;color:#6b4e16}' +
    '.mc-foot{border-top:1px solid #eee;padding:18px 22px 22px}' +
    '.mc-fila{display:flex;justify-content:space-between;font-size:14px;color:#555;margin-bottom:8px}' +
    '.mc-fila.dto{color:#2f6f4f;font-weight:600}' +
    '.mc-fila.tot{font-size:18px;color:#0d0d0d;font-weight:800;margin:12px 0 16px}' +
    '.mc-btn{display:block;width:100%;text-align:center;background:#0d0d0d;color:#fff;border:0;border-radius:999px;padding:16px;font:700 15px Inter,Arial,sans-serif;cursor:pointer;text-decoration:none}' +
    '.mc-btn:hover{background:#333}' +
    '.mc-btn.o{background:#fff;color:#0d0d0d;box-shadow:inset 0 0 0 1.5px #0d0d0d;margin-top:10px}' +
    '.mc-mini{display:flex;justify-content:space-between;margin-top:14px;font-size:12px;color:#888}' +
    '.mc-mini button{background:none;border:0;font:inherit;color:#888;text-decoration:underline;cursor:pointer;padding:0}' +
    '.mc-vacio{text-align:center;padding:40px 6px 10px}' +
    '.mc-vacio .ico{width:84px;height:84px;margin:0 auto 18px;border-radius:50%;background:#f4f1ec;display:flex;align-items:center;justify-content:center}' +
    '.mc-vacio b{display:block;font-family:Georgia,serif;font-size:24px;margin-bottom:8px}' +
    '.mc-vacio p{color:#777;font-size:15px;line-height:1.5;margin:0 0 24px}' +
    '.mc-ideas{margin-top:28px;text-align:left}' +
    '.mc-ideas small{display:block;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:800;color:#999;margin-bottom:10px}' +
    '.mc-ideas a{display:flex;align-items:center;gap:12px;padding:10px;border-radius:12px;text-decoration:none;color:#0d0d0d;transition:background .2s}' +
    '.mc-ideas a:hover{background:#f7f5f2}' +
    '.mc-ideas a i{width:48px;height:48px;border-radius:8px;background:#eee center/cover;flex-shrink:0}' +
    '.mc-ideas a b{font:700 14px Inter,Arial,sans-serif;color:#0d0d0d;display:block}' +
    '.mc-ideas a span{font-size:12px;color:#888}' +
    '.mc-badge{position:absolute;top:2px;right:0;min-width:17px;height:17px;border-radius:9px;background:#c2613a;color:#fff;font:800 10px/17px Inter,Arial,sans-serif;text-align:center;padding:0 4px;pointer-events:none}';

  var veil, panel, saved = null;

  function montar() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    veil = document.createElement('div'); veil.className = 'mc-veil';
    panel = document.createElement('aside'); panel.className = 'mc'; panel.setAttribute('aria-label', 'Carrito'); panel.setAttribute('role', 'dialog');
    document.body.appendChild(veil); document.body.appendChild(panel);
    veil.addEventListener('click', cerrar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(); });
  }
  function cerrar() { veil.classList.remove('open'); panel.classList.remove('open'); document.documentElement.style.overflow = ''; }

  function vacio() {
    return '<div class="mc-head"><b>Tu carrito</b><button class="mc-x" type="button" aria-label="Cerrar">×</button></div>' +
      '<div class="mc-body"><div class="mc-vacio">' +
      '<div class="ico"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#b9ad9b" stroke-width="1.6" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>' +
      '<b>Tu carrito está vacío</b><p>Sube una foto del móvil y en dos minutos tienes tu cuadro en aluminio, listo para colgar sin agujeros.</p>' +
      '<a class="mc-btn" href="cuadro.html">Crear mi cuadro →</a>' +
      '<div class="mc-ideas"><small>O empieza por aquí</small>' +
      '<a href="paredes.html"><i style="background-image:url(fotos/combis/combi-galeria.webp)"></i><span><b>Paredes de ensueño</b>Composiciones listas, con hasta un -20 %</span></a>' +
      '<a href="ficha-sobremesa.html"><i style="background-image:url(fotos/producto-sobremesa.jpg)"></i><span><b>Sobremesa</b>Con peana de bambú · desde 28,99 €</span></a>' +
      '<a href="ficha-iman.html"><i style="background-image:url(fotos/producto-iman-nevera.jpg)"></i><span><b>Imán</b>Para la nevera · 9,99 €</span></a>' +
      '</div></div></div>';
  }

  function lleno(r) {
    var n = r.lineas.length, falta = Math.max(0, ENVIO_GRATIS - r.total);
    var envio = falta > 0
      ? 'Te faltan <b>' + eur(falta) + '</b> para el envío gratis en España'
      : '<b>Envío gratis</b> en España';
    if (r.viejo) return '<div class="mc-head"><b>Tu carrito<small>' + n + (n === 1 ? ' pieza' : ' piezas') + '</small></b><button class="mc-x" type="button" aria-label="Cerrar">×</button></div><div class="mc-body">' +
      r.lineas.map(function (l) { return '<div class="mc-l"><div class="t"' + (l.thumb ? ' style="background-image:url(' + l.thumb + ')"' : '') + '></div><div><b>' + esc(l.nombre) + '</b><span>' + esc(l.medida) + '</span></div><em></em></div>'; }).join('') +
      '</div><div class="mc-foot"><button class="mc-btn" type="button" data-ir="editar">Abrir mi diseño →</button><div class="mc-mini"><span>IVA incluido</span><button type="button" data-ir="vaciar">Vaciar</button></div></div>';
    var html = '<div class="mc-head"><b>Tu carrito<small>' + n + (n === 1 ? ' pieza' : ' piezas') + '</small></b><button class="mc-x" type="button" aria-label="Cerrar">×</button></div>' +
      '<div class="mc-body">' +
      '<div class="mc-envio">' + envio + '<i><u style="width:' + Math.min(100, r.total / ENVIO_GRATIS * 100) + '%"></u></i></div>' +
      (r.pared ? '<div class="mc-pared">Pared «' + esc(r.pared) + '»</div>' : '') +
      r.lineas.map(function (l) {
        return '<div class="mc-l"><div class="t"' + (l.thumb ? ' style="background-image:url(' + l.thumb + ')"' : (l.sinFoto ? ' style="background:#fff;outline:1.5px dashed #cfc6b8;outline-offset:-1.5px"' : '')) + '></div><div><b>' + esc(l.nombre) + '</b><span>' + esc(l.medida) + (l.sinFoto ? ' · <i style="color:#b3412a;font-style:normal">sin foto</i>' : '') + '</span></div><em>' + eur(l.precio) + '</em></div>';
      }).join('') +
      (r.faltan > 0 ? '<div class="mc-aviso">' + (r.faltan === 1 ? 'Falta 1 foto' : 'Faltan ' + r.faltan + ' fotos') + ' para completar la pared. Termínala en el editor para poder pedirla.</div>' : '') +
      '</div><div class="mc-foot">' +
      '<div class="mc-fila"><span>Subtotal</span><span>' + eur(r.bruto) + '</span></div>' +
      (r.dto > 0 ? '<div class="mc-fila dto"><span>Descuento por ' + n + ' piezas (-' + r.pct + ' %)</span><span>-' + eur(r.dto) + '</span></div>' : '') +
      '<div class="mc-fila tot"><span>Total</span><span>' + eur(r.total) + '</span></div>' +
      (r.faltan > 0 ? '' : '<button class="mc-btn" type="button" data-ir="pagar">Ir a pagar →</button>') +
      '<button class="mc-btn' + (r.faltan > 0 ? '' : ' o') + '" type="button" data-ir="editar">' + (r.faltan > 0 ? 'Terminar mi pared →' : 'Seguir editando') + '</button>' +
      '<div class="mc-mini"><span>IVA incluido · envío en el siguiente paso</span><button type="button" data-ir="vaciar">Vaciar</button></div>' +
      '</div>';
    return html;
  }

  /* diseños guardados antes del 16-oct no traen resumen: se enseñan las piezas y se manda al editor */
  function resumenDe(s) {
    if (!s) return null;
    if (s.resumen) return s.resumen;
    var it = (s.items || []).filter(function (i) { return i.photo; });
    return it.length ? { viejo: true, lineas: it.map(function (i) { return { nombre: 'Pieza guardada', medida: 'Ábrela para ver el precio', precio: 0, thumb: i.thumb }; }), bruto: 0, dto: 0, total: 0, pct: 0, faltan: 0 } : null;
  }
  function pintar() {
    var r = resumenDe(saved);
    var ok = r && r.lineas && r.lineas.length;
    panel.innerHTML = ok ? lleno(r) : vacio();
    panel.querySelector('.mc-x').addEventListener('click', cerrar);
    [].forEach.call(panel.querySelectorAll('[data-ir]'), function (b) {
      b.addEventListener('click', function () {
        var ir = b.getAttribute('data-ir'), vivo = window.MOMENTURIES_EDITOR_VIVO;
        if (ir === 'vaciar') {
          borrar(saved).then(function () { saved = null; badge(); if (vivo) location.reload(); else pintar(); });
          return;
        }
        if (vivo && vivo.hay()) { cerrar(); vivo[ir](); return; }
        location.href = 'cuadro.html?' + (ir === 'pagar' ? 'carrito=1' : 'retomar=1');
      });
    });
  }

  function abrir() {
    leer().then(function (s) {
      saved = s && s.at && Date.now() - s.at < TTL ? s : null;
      pintar(); badge();
      veil.classList.add('open'); panel.classList.add('open');
      document.documentElement.style.overflow = 'hidden';
    });
  }

  var botones = [];
  function badge() {
    var rr = resumenDe(saved), n = rr ? rr.lineas.length : 0;
    botones.forEach(function (b) {
      var x = b.querySelector('.mc-badge');
      if (!n) { if (x) x.remove(); return; }
      if (!x) { x = document.createElement('span'); x.className = 'mc-badge'; b.style.position = 'relative'; b.appendChild(x); }
      x.textContent = n;
    });
  }

  function iniciar() {
    montar();
    botones = [].slice.call(document.querySelectorAll('[aria-label="Carrito"]')).filter(function (b) { return b !== panel; });
    botones.forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); abrir(); }); });
    leer().then(function (s) { saved = s && s.at && Date.now() - s.at < TTL ? s : null; badge(); });
    // el editor guarda a los 0,7 s de cada cambio: el contador se pone al día solo
    setInterval(function () { if (!panel.classList.contains('open')) leer().then(function (s) { saved = s && s.at && Date.now() - s.at < TTL ? s : null; badge(); }); }, 4000);
    window.MOMENTURIES_CARRITO = { abrir: abrir };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
