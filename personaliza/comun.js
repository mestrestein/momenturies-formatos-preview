/* personaliza/comun.js — piezas compartidas de cielo.html y mapa.html:
   buscador de lugares (Photon, datos de OpenStreetMap), textos del póster, tipografías y el paso al editor
   (el póster se dibuja a 3600×4800 = 30×40 cm a 300 ppp y entra en cuadro.html como una foto del cliente). */
(function () {
  var P = {};
  P.PRINT_W = 3600; P.PRINT_H = 4800;

  /* ── tipografías del texto ── */
  P.FONTS = {
    elegante:   { name: 'Elegante',   title: function (px) { return 'italic 500 ' + px + 'px "Playfair Display", Georgia, serif'; }, caps: false, k: 1 },
    moderna:    { name: 'Moderna',    title: function (px) { return '600 ' + px + 'px Montserrat, Inter, sans-serif'; }, caps: true, k: 0.82 },
    manuscrita: { name: 'Manuscrita', title: function (px) { return '400 ' + px + 'px "Great Vibes", cursive'; }, caps: false, k: 1.3 }
  };
  P.subFont = function (px, w) { return (w || 500) + ' ' + px + 'px Montserrat, Inter, sans-serif'; };
  P.fontsReady = function () {
    var L = ['italic 500 40px "Playfair Display"', '600 40px Montserrat', '500 40px Montserrat', '400 40px Montserrat', '400 40px "Great Vibes"'];
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(L.map(function (f) { return document.fonts.load(f).catch(function () {}); }));
  };

  /* texto con espaciado entre letras (dibujado a mano: ctx.letterSpacing no está en todos los navegadores) */
  P.spaced = function (ctx, text, x, y, sp) {
    if (!sp) { ctx.fillText(text, x, y); return; }
    var chars = Array.from(text), w = chars.reduce(function (s, c) { return s + ctx.measureText(c).width; }, 0) + sp * (chars.length - 1);
    var al = ctx.textAlign, cx = al === 'center' ? x - w / 2 : al === 'right' ? x - w : x;
    ctx.textAlign = 'left';
    chars.forEach(function (c) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + sp; });
    ctx.textAlign = al;
  };
  P.spacedWidth = function (ctx, text, sp) { var chars = Array.from(text); return chars.reduce(function (s, c) { return s + ctx.measureText(c).width; }, 0) + sp * Math.max(0, chars.length - 1); };

  /* bloque de texto del pie: título (se encoge si no cabe), línea 2 en versalitas y línea 3 (coordenadas) */
  P.textBlock = function (ctx, W, H, o) {
    var F = P.FONTS[o.font] || P.FONTS.elegante, maxW = W * 0.84;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    var title = (o.title || '').trim();
    if (title) {
      if (F.caps) title = title.toUpperCase();
      var px = W * 0.06 * F.k, sp = F.caps ? px * 0.14 : 0;
      ctx.font = F.title(px);
      while (P.spacedWidth(ctx, title, sp) > maxW && px > W * 0.02) { px *= 0.94; sp = F.caps ? px * 0.14 : 0; ctx.font = F.title(px); }
      ctx.fillStyle = o.color; P.spaced(ctx, title, W / 2, o.y, sp);
    }
    if (o.line2) {
      var p2 = W * 0.021; ctx.font = P.subFont(p2, 500);
      var l2 = o.line2.toUpperCase(), s2 = p2 * 0.28;
      while (P.spacedWidth(ctx, l2, s2) > maxW && p2 > W * 0.01) { p2 *= 0.95; s2 = p2 * 0.28; ctx.font = P.subFont(p2, 500); }
      ctx.fillStyle = o.color; P.spaced(ctx, l2, W / 2, o.y + W * 0.065, s2);
    }
    if (o.line3) {
      var p3 = W * 0.016; ctx.font = P.subFont(p3, 400);
      ctx.fillStyle = o.soft || o.color; P.spaced(ctx, o.line3.toUpperCase(), W / 2, o.y + W * 0.105, p3 * 0.3);
    }
  };

  P.coords = function (lat, lon) {
    return Math.abs(lat).toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S') + ' · ' + Math.abs(lon).toFixed(4) + '° ' + (lon >= 0 ? 'E' : 'O');
  };
  P.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ── buscador de lugares (Photon de Komoot sobre OpenStreetMap: sin clave, con CORS) ── */
  P.placeSearch = function (input, list, onPick, opts) {
    opts = opts || {};
    var t = null, ctl = null, items = [], act = -1;
    function label(f) {
      var p = f.properties, a = [p.name, p.city !== p.name ? p.city : null, p.state, p.country].filter(Boolean);
      return { main: a[0] || '', rest: a.slice(1).join(', ') };
    }
    function show() {
      list.innerHTML = items.map(function (f, i) { var l = label(f); return '<button type="button" data-i="' + i + '"' + (i === act ? ' class="act"' : '') + '>' + P.esc(l.main) + '<small>' + P.esc(l.rest) + '</small></button>'; }).join('');
      list.classList.toggle('on', items.length > 0);
    }
    function pick(i) {
      var f = items[i]; if (!f) return;
      var l = label(f), c = f.geometry.coordinates;
      input.value = l.main + (l.rest ? ', ' + l.rest : '');
      items = []; show();
      onPick({ name: l.main, full: input.value, country: f.properties.country || '', city: f.properties.city || l.main, lat: c[1], lon: c[0], extent: f.properties.extent || null, osmKey: f.properties.osm_key, osmValue: f.properties.osm_value });
    }
    input.addEventListener('input', function () {
      clearTimeout(t); var q = input.value.trim();
      if (q.length < 2) { items = []; show(); return; }
      t = setTimeout(function () {
        if (ctl) ctl.abort(); ctl = window.AbortController ? new AbortController() : null;
        var url = 'https://photon.komoot.io/api/?limit=6&q=' + encodeURIComponent(q) + (opts.bias ? '&lat=' + opts.bias[0] + '&lon=' + opts.bias[1] : '');
        fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) { return r.json(); }).then(function (j) { items = (j.features || []); act = -1; show(); }).catch(function () {});
      }, 280);
    });
    input.addEventListener('keydown', function (e) {
      if (!items.length) return;
      if (e.key === 'ArrowDown') { act = Math.min(items.length - 1, act + 1); show(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { act = Math.max(0, act - 1); show(); e.preventDefault(); }
      else if (e.key === 'Enter') { pick(act < 0 ? 0 : act); e.preventDefault(); }
      else if (e.key === 'Escape') { items = []; show(); }
    });
    list.addEventListener('mousedown', function (e) { var b = e.target.closest('button'); if (b) { e.preventDefault(); pick(+b.dataset.i); } });
    input.addEventListener('blur', function () { setTimeout(function () { items = []; show(); }, 150); });
  };

  P.toast = function (m) {
    var t = document.getElementById('pzToast'); if (!t) return;
    t.textContent = m; t.style.display = 'block'; clearTimeout(P.toast.t); P.toast.t = setTimeout(function () { t.style.display = 'none'; }, 4000);
  };

  /* ── al editor: dibuja a tamaño de imprenta y entra como foto del cliente ── */
  P.toEditor = function (btn, txtEl, render, name) {
    var old = txtEl.textContent;
    btn.disabled = true; btn.classList.add('loading'); txtEl.textContent = 'Preparando tu póster en alta resolución…';
    return P.fontsReady().then(function () {
      var c = document.createElement('canvas'); c.width = P.PRINT_W; c.height = P.PRINT_H;
      return Promise.resolve(render(c.getContext('2d'), P.PRINT_W, P.PRINT_H)).then(function () {
        return new Promise(function (res, rej) { c.toBlob(function (b) { b ? res(b) : rej(new Error('canvas')); }, 'image/jpeg', 0.95); });
      });
    }).then(function (b) {
      if (!window.MOMENTURIES_PHOTO) throw new Error('handoff');
      return window.MOMENTURIES_PHOTO.put(new File([b], name + '.jpg', { type: 'image/jpeg' }));
    }).then(function () {
      location.href = 'cuadro.html?foto=1&diseno=' + encodeURIComponent(name);
    }).catch(function () {
      btn.disabled = false; btn.classList.remove('loading'); txtEl.textContent = old;
      P.toast('No hemos podido preparar el póster. Inténtalo otra vez.');
    });
  };

  /* pinta en el canvas de la vista previa con la densidad de la pantalla */
  P.previewCanvas = function (cv) {
    var r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(300, Math.round(r.width * d)), h = Math.round(w * 4 / 3);
    if (cv.width !== w) { cv.width = w; cv.height = h; }
    return cv.getContext('2d');
  };

  window.MOM_P = P;
})();
