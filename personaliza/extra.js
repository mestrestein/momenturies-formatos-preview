/* personaliza/extra.js — los diseños personalizados nuevos (17-oct-2026):
   luna · cielo y mapa · dos cielos · lunas de un mes o un año · constelación del signo · onda de voz ·
   coordenadas · mapa de viajes. Todos se dibujan en canvas a cualquier tamaño (3600 × 4800 = 30 × 40 cm a 300 ppp).
   Necesita comun.js; los de cielo/Luna, cielo.js (+ cielo-datos.js); el de mapa, mapa.js; el de viajes, mundo-datos.js;
   el del signo, signos-datos.js. */
(function () {
  var P = window.MOM_P, D2R = Math.PI / 180;

  /* temas claros/oscuros para los diseños sin cielo (coordenadas, viajes, onda) */
  var LISOS = {
    blanco:   { name: 'Blanco',     bg: '#ffffff', fg: '#151515', soft: '#7a7a7a', accent: '#c2613a', land: '#151515' },
    crema:    { name: 'Crema',      bg: '#f4ede1', fg: '#2b2420', soft: '#8a7d70', accent: '#c2613a', land: '#2b2420' },
    negro:    { name: 'Negro',      bg: '#111111', fg: '#f2ede3', soft: '#8d8a84', accent: '#e3b04b', land: '#f2ede3' },
    noche:    { name: 'Noche',      bg: '#101c30', fg: '#f2ede3', soft: '#8e98aa', accent: '#e9c46a', land: '#e9e2d0' },
    salvia:   { name: 'Salvia',     bg: '#eef0e7', fg: '#2f4a3b', soft: '#7d8c80', accent: '#c4623f', land: '#2f4a3b' },
    terracota:{ name: 'Terracota',  bg: '#f3e6d8', fg: '#7d3a22', soft: '#b08a75', accent: '#2f5d6b', land: '#9c4a2b' },
    rosa:     { name: 'Rosa',       bg: '#f7e8e4', fg: '#5a2d3c', soft: '#a88690', accent: '#d64545', land: '#5a2d3c' },
  };
  function sky() { return window.MOM_CIELO; }

  function text3(ctx, W, H, o, y, T) { P.textBlock(ctx, W, H, { title: o.title, line2: o.line2, line3: o.line3, font: o.font, y: y, color: T.text || T.fg, soft: T.soft }); }
  function smallCaps(ctx, txt, x, y, px, color, sp, w) { if (!txt) return; ctx.font = P.subFont(px, w || 600); ctx.fillStyle = color; ctx.textAlign = 'center'; P.spaced(ctx, txt.toUpperCase(), x, y, px * (sp == null ? 0.25 : sp)); }
  function rng(seed) { var a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function sprinkle(ctx, W, H, n, color, R, box) {   // estrellitas de fondo
    box = box || [0, 0, W, H];
    for (var i = 0; i < n; i++) { var x = box[0] + R() * (box[2] - box[0]), y = box[1] + R() * (box[3] - box[1]), r = W * (0.0006 + R() * 0.0016); ctx.globalAlpha = 0.35 + R() * 0.6; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  function isDark(hex) { var n = parseInt(hex.slice(1), 16); return ((n >> 16 & 255) * 0.3 + (n >> 8 & 255) * 0.59 + (n & 255) * 0.11) < 110; }

  /* ── 1 · LA LUNA DE VUESTRA NOCHE ── */
  function luna(ctx, W, H, o) {
    var C = sky(), T = C.themes[o.theme] || C.themes.medianoche, J = C.jd(o.utc), mo = C.moon(J);
    if (o.lat < 0) mo = Object.assign({}, mo, { waxing: !mo.waxing });   // en el hemisferio sur se ve al revés
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    var cx = W / 2, cy = H * 0.39, R = W * 0.4;
    if (!isDark(T.bg)) { ctx.fillStyle = T.disk; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); }
    ctx.save(); if (!isDark(T.bg)) { ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip(); }
    sprinkle(ctx, W, H, 260, T.star, rng(7), isDark(T.bg) ? [0, 0, W, H * 0.74] : [cx - R, cy - R, cx + R, cy + R]);
    ctx.restore();
    C.drawMoon(ctx, cx, cy, W * 0.29, mo, 0.18);
    if (!isDark(T.bg)) { ctx.strokeStyle = T.ring; ctx.lineWidth = W / 3600 * 7; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); }
    var pct = Math.round(mo.frac * 100);
    text3(ctx, W, H, { title: o.title, line2: o.line2, line3: o.line3 === null ? '' : (C.faseNombre(mo) + ' · ' + pct + ' % iluminada' + (o.line3 ? ' · ' + o.line3 : '')), font: o.font }, H * 0.84, T);
    ctx.restore();
  }

  /* ── 2 · CIELO Y MAPA ── */
  function mapTheme(T) {   // los colores del mapa salen del tema del cielo
    return { bg: T.bg, land: T.disk, water: shade(T.disk, isDark(T.disk) ? 1.35 : 0.88), park: shade(T.disk, isDark(T.disk) ? 1.15 : 0.95), road: T.star, minor: T.star, rail: T.line, frame: T.ring };
  }
  function shade(hex, k) { var n = parseInt(hex.slice(1), 16), r = Math.min(255, Math.round((n >> 16 & 255) * k)), g = Math.min(255, Math.round((n >> 8 & 255) * k)), b = Math.min(255, Math.round((n & 255) * k)); return 'rgb(' + r + ',' + g + ',' + b + ')'; }
  function cieloMapa(ctx, W, H, o) {
    var C = sky(), T = C.themes[o.theme] || C.themes.medianoche;
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    var R = W * 0.235;
    C.sky(ctx, W, W / 2, H * 0.245, R, o, T);
    if (o.data) {
      var r = { x: W / 2 - R, y: H * 0.585 - R, w: 2 * R, h: 2 * R };
      MOM_MAPA.mapIn(ctx, W, r, { data: o.data, shape: 'circulo', pin: o.pin, parks: true, lineK: 0.8 }, mapTheme(T));
    }
    text3(ctx, W, H, o, H * 0.85, T);
    ctx.restore();
  }

  /* ── 3 · DOS CIELOS ── */
  function dosCielos(ctx, W, H, o) {
    var C = sky(), T = C.themes[o.theme] || C.themes.medianoche;
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    var R = W * 0.205, y = H * 0.33;
    [o.a, o.b].forEach(function (s, i) {
      var x = W * (i ? 0.735 : 0.265);
      C.sky(ctx, W, x, y, R, Object.assign({}, s, { lines: o.lines, moon: o.moon, grid: false }), T);
      smallCaps(ctx, s.label, x, y + R + W * 0.07, W * 0.02, T.text, 0.18, 700);
      smallCaps(ctx, s.when, x, y + R + W * 0.105, W * 0.015, T.soft, 0.22, 500);
      smallCaps(ctx, s.where, x, y + R + W * 0.135, W * 0.013, T.soft, 0.22, 400);
    });
    // un trazo que une los dos cielos
    ctx.strokeStyle = T.ring; ctx.lineWidth = W / 3600 * 3; ctx.setLineDash([W * 0.006, W * 0.008]);
    ctx.beginPath(); ctx.moveTo(W * 0.265 + R * 1.06, y); ctx.lineTo(W * 0.735 - R * 1.06, y); ctx.stroke(); ctx.setLineDash([]);
    text3(ctx, W, H, o, H * 0.82, T);
    ctx.restore();
  }

  /* ── 4 · LAS LUNAS DE UN MES O DE UN AÑO ── */
  var MES_CORTO = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  function moonAt(y, m, d) { var C = sky(); return C.moon(C.jd(Date.UTC(y, m, d, 21, 0))); }   // a las 21 h UTC (noche en Europa)
  function fases(ctx, W, H, o) {
    var C = sky(), T = C.themes[o.theme] || C.themes.medianoche;
    var p = (o.fecha || P.hoy()).split('-').map(Number), Y = p[0], M = p[1] - 1, Dd = p[2];
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    var mark = function (x, y, r) { ctx.strokeStyle = T.ring; ctx.lineWidth = Math.max(2, r * 0.12); ctx.beginPath(); ctx.arc(x, y, r * 1.38, 0, Math.PI * 2); ctx.stroke(); };
    if (o.modo === 'mes') {
      smallCaps(ctx, P.MESES[M] + ' ' + Y, W / 2, H * 0.1, W * 0.032, T.text, 0.3, 600);
      var first = (new Date(Date.UTC(Y, M, 1)).getUTCDay() + 6) % 7, days = new Date(Date.UTC(Y, M + 1, 0)).getUTCDate();
      var x0 = W * 0.1, cw = W * 0.8 / 7, y0 = H * 0.2, ch = H * 0.1, r = Math.min(cw, ch) * 0.34;
      ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(function (d, i) { smallCaps(ctx, d, x0 + cw * (i + 0.5), y0 - ch * 0.15, W * 0.014, T.soft, 0, 600); });
      for (var d = 1; d <= days; d++) {
        var k = first + d - 1, cx = x0 + cw * (k % 7 + 0.5), cy = y0 + ch * (Math.floor(k / 7) + 0.42);
        C.drawMoon(ctx, cx, cy, r, moonAt(Y, M, d), 0);
        if (d === Dd) mark(cx, cy, r);
        ctx.fillStyle = d === Dd ? T.text : T.soft; ctx.font = P.subFont(W * 0.012, d === Dd ? 700 : 500); ctx.textAlign = 'center'; ctx.fillText(String(d), cx, cy + r + W * 0.02);
      }
      text3(ctx, W, H, o, H * 0.86, T);
    } else {
      smallCaps(ctx, String(Y), W / 2, H * 0.085, W * 0.034, T.text, 0.5, 600);
      var gx0 = W * 0.12, gx1 = W * 0.95, gy0 = H * 0.13, gy1 = H * 0.75, cw2 = (gx1 - gx0) / 31, ch2 = (gy1 - gy0) / 12, r2 = Math.min(cw2, ch2) * 0.4;
      for (var m = 0; m < 12; m++) {
        var cyy = gy0 + ch2 * (m + 0.5);
        ctx.fillStyle = T.soft; ctx.font = P.subFont(W * 0.012, 600); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(MES_CORTO[m], gx0 - W * 0.014, cyy);
        var dm = new Date(Date.UTC(Y, m + 1, 0)).getUTCDate();
        for (var dd = 1; dd <= dm; dd++) {
          var cxx = gx0 + cw2 * (dd - 0.5);
          C.drawMoon(ctx, cxx, cyy, r2, moonAt(Y, m, dd), 0);
          if (m === M && dd === Dd) mark(cxx, cyy, r2);
        }
      }
      ctx.textBaseline = 'alphabetic';
      text3(ctx, W, H, o, H * 0.84, T);
    }
    ctx.restore();
  }

  /* ── 5 · VUESTRA CONSTELACIÓN (signo del zodiaco) ── */
  var SIGNOS = [
    ['Ari', 'Aries', [3, 21], [4, 19]], ['Tau', 'Tauro', [4, 20], [5, 20]], ['Gem', 'Géminis', [5, 21], [6, 20]], ['Cnc', 'Cáncer', [6, 21], [7, 22]],
    ['Leo', 'Leo', [7, 23], [8, 22]], ['Vir', 'Virgo', [8, 23], [9, 22]], ['Lib', 'Libra', [9, 23], [10, 22]], ['Sco', 'Escorpio', [10, 23], [11, 21]],
    ['Sgr', 'Sagitario', [11, 22], [12, 21]], ['Cap', 'Capricornio', [12, 22], [1, 19]], ['Aqr', 'Acuario', [1, 20], [2, 18]], ['Psc', 'Piscis', [2, 19], [3, 20]]];
  function signoDe(fecha) {
    if (!fecha) return 'Leo';
    var p = fecha.split('-').map(Number), m = p[1], d = p[2], v = m * 100 + d;
    for (var i = 0; i < SIGNOS.length; i++) { var a = SIGNOS[i][2][0] * 100 + SIGNOS[i][2][1], b = SIGNOS[i][3][0] * 100 + SIGNOS[i][3][1]; if (a <= b ? (v >= a && v <= b) : (v >= a || v <= b)) return SIGNOS[i][0]; }
    return 'Leo';
  }
  function signo(ctx, W, H, o) {
    var C = sky(), T = C.themes[o.theme] || C.themes.medianoche, id = o.signo || 'Leo', L = (window.MOMENTURIES_SIGNOS || {})[id] || [];
    var S = SIGNOS.filter(function (s) { return s[0] === id; })[0];
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    // centro y proyección gnomónica
    var pts = []; L.forEach(function (seg) { seg.forEach(function (p) { pts.push(p); }); });
    var ra0 = 0, x = 0, y = 0; pts.forEach(function (p) { x += Math.cos(p[0] * D2R); y += Math.sin(p[0] * D2R); }); ra0 = Math.atan2(y, x) / D2R;
    var de0 = pts.reduce(function (s, p) { return s + p[1]; }, 0) / (pts.length || 1);
    var gn = function (ra, de) {
      var a = (ra - ra0) * D2R, d = de * D2R, d0 = de0 * D2R, c = Math.sin(d0) * Math.sin(d) + Math.cos(d0) * Math.cos(d) * Math.cos(a);
      if (c <= 0.2) return null;
      return [-(Math.cos(d) * Math.sin(a)) / c, (Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a)) / c];
    };
    var P2 = pts.map(function (p) { return gn(p[0], p[1]); }).filter(Boolean);
    var minx = Math.min.apply(null, P2.map(function (q) { return q[0]; })), maxx = Math.max.apply(null, P2.map(function (q) { return q[0]; }));
    var miny = Math.min.apply(null, P2.map(function (q) { return q[1]; })), maxy = Math.max.apply(null, P2.map(function (q) { return q[1]; }));
    var bw = W * 0.74, bh = H * 0.5, sc = Math.min(bw / (maxx - minx || 1), bh / (maxy - miny || 1)), cx = W / 2, cy = H * 0.37;
    var X = function (q) { return cx + (q[0] - (minx + maxx) / 2) * sc; }, Yy = function (q) { return cy - (q[1] - (miny + maxy) / 2) * sc; };
    var lw = W / 3600;
    // estrellas de fondo del catálogo alrededor de la constelación
    var st = C.datos ? C.datos.S : (window.MOMENTURIES_CIELO || {}).S || [];
    for (var i = 0; i < st.length; i += 3) {
      var q = gn(st[i], st[i + 1]); if (!q) continue;
      var sx = X(q), sy = Yy(q); if (sx < W * 0.04 || sx > W * 0.96 || sy < H * 0.04 || sy > H * 0.7) continue;
      var r = W * 0.00055 * Math.pow(Math.max(0.35, 6.4 - st[i + 2]), 1.25);
      ctx.globalAlpha = 0.45; ctx.fillStyle = T.star; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // líneas y estrellas de la constelación
    ctx.strokeStyle = T.ring; ctx.lineWidth = 4.5 * lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    L.forEach(function (seg) { ctx.beginPath(); var st0 = false; seg.forEach(function (p) { var q = gn(p[0], p[1]); if (!q) return; if (!st0) { ctx.moveTo(X(q), Yy(q)); st0 = true; } else ctx.lineTo(X(q), Yy(q)); }); ctx.stroke(); });
    var seen = {};
    pts.forEach(function (p) {
      var k = p[0].toFixed(2) + p[1].toFixed(2); if (seen[k]) return; seen[k] = 1;
      var q = gn(p[0], p[1]); if (!q) return; var sx = X(q), sy = Yy(q);
      var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.022); g.addColorStop(0, T.star); g.addColorStop(0.2, T.star); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.45; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, W * 0.022, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = T.star; ctx.beginPath(); ctx.arc(sx, sy, W * 0.0065, 0, Math.PI * 2); ctx.fill();
    });
    // nombre del signo y fechas
    ctx.fillStyle = T.text; ctx.textAlign = 'center';
    var name = (S ? S[1] : id).toUpperCase(), px = W * 0.1; ctx.font = '400 ' + px + 'px "Bebas Neue", Oswald, Impact, sans-serif'; P.spaced(ctx, name, W / 2, H * 0.78, px * 0.12);
    if (S) smallCaps(ctx, S[2][1] + ' de ' + P.MESES[S[2][0] - 1] + ' — ' + S[3][1] + ' de ' + P.MESES[S[3][0] - 1], W / 2, H * 0.815, W * 0.016, T.soft, 0.3, 500);
    if (o.title) { var F = P.FONTS[o.font] || P.FONTS.elegante, tp = W * 0.05 * F.k; ctx.font = F.title(tp); ctx.fillStyle = T.text; ctx.fillText(F.caps ? o.title.toUpperCase() : o.title, W / 2, H * 0.885); }
    if (o.line2) smallCaps(ctx, o.line2, W / 2, H * 0.925, W * 0.017, T.soft, 0.28, 500);
    ctx.restore();
  }

  /* ── 6 · LA ONDA DE VUESTRA VOZ ── */
  function ondaDemo() {   // forma de voz inventada para que la vista previa no salga vacía
    var R = rng(11), a = []; for (var i = 0; i < 240; i++) { var t = i / 240, env = Math.pow(Math.sin(Math.PI * t), 0.6) * (0.55 + 0.45 * Math.sin(t * 19) * Math.sin(t * 7)); a.push(Math.max(0.04, Math.abs(env) * (0.6 + R() * 0.4))); } return a;
  }
  function onda(ctx, W, H, o) {
    var T = LISOS[o.theme] || LISOS.blanco, pk = o.picos && o.picos.length ? o.picos : ondaDemo();
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    var cy = H * 0.4, x0 = W * 0.1, x1 = W * 0.9, amp = H * 0.17, n = pk.length;
    var grad = ctx.createLinearGradient(x0, 0, x1, 0); grad.addColorStop(0, T.fg); grad.addColorStop(1, o.degradado ? T.accent : T.fg);
    ctx.fillStyle = grad; ctx.strokeStyle = grad;
    if (o.estilo === 'circulo') {
      var r0 = W * 0.2, cxx = W / 2, cyy = H * 0.38;
      for (var i = 0; i < n; i++) {
        var a = i / n * Math.PI * 2 - Math.PI / 2, len = W * 0.17 * pk[i];
        ctx.lineWidth = Math.max(2, (2 * Math.PI * r0 / n) * 0.55); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cxx + Math.cos(a) * r0, cyy + Math.sin(a) * r0); ctx.lineTo(cxx + Math.cos(a) * (r0 + len), cyy + Math.sin(a) * (r0 + len)); ctx.stroke();
      }
    } else if (o.estilo === 'linea') {
      ctx.lineWidth = W * 0.003; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (var j = 0; j < n; j++) { var xx = x0 + (x1 - x0) * j / (n - 1); ctx.lineTo(xx, cy - pk[j] * amp * (j % 2 ? 1 : -1)); }
      ctx.stroke();
      ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy); ctx.lineWidth = W * 0.0012; ctx.stroke(); ctx.globalAlpha = 1;
    } else {
      var bw = (x1 - x0) / n;
      for (var k = 0; k < n; k++) {
        var h = Math.max(W * 0.004, pk[k] * amp), bx = x0 + k * bw + bw * 0.18, w = bw * 0.64;
        rrect(ctx, bx, cy - h, w, 2 * h, Math.min(w / 2, h));
      }
    }
    text3(ctx, W, H, o, H * 0.78, { text: T.fg, soft: T.soft });
    ctx.restore();
  }
  function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fill(); }
  /* audio → picos normalizados (RMS por tramo) */
  function audioPicos(arrayBuffer, n) {
    var AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
    return new Promise(function (res, rej) { ac.decodeAudioData(arrayBuffer, res, rej); }).then(function (buf) {
      var d = buf.getChannelData(0), step = Math.floor(d.length / n), out = [];
      for (var i = 0; i < n; i++) { var s = 0; for (var j = i * step; j < (i + 1) * step; j += 4) s += d[j] * d[j]; out.push(Math.sqrt(s / (step / 4))); }
      var mx = Math.max.apply(null, out) || 1; ac.close && ac.close();
      return out.map(function (v) { return Math.max(0.03, Math.pow(v / mx, 0.8)); });
    });
  }

  /* ── 7 · COORDENADAS ── */
  function coordenadas(ctx, W, H, o) {
    var T = LISOS[o.theme] || LISOS.crema, lat = P.dms(o.lat, 'N', 'S'), lon = P.dms(o.lon, 'E', 'O');
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    var F = P.FONTS[o.font] || P.FONTS.moderna, fit = function (txt, px, maxW, fn) { ctx.font = fn(px); while (ctx.measureText(txt).width > maxW && px > 10) { px *= 0.95; ctx.font = fn(px); } return px; };
    ctx.fillStyle = T.fg; ctx.textAlign = 'center';
    if (o.estilo === 'marco') {
      var m = W * 0.09; ctx.strokeStyle = T.fg; ctx.lineWidth = W * 0.0025; ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
      ctx.lineWidth = W * 0.0012; ctx.strokeRect(m + W * 0.018, m + W * 0.018, W - 2 * m - W * 0.036, H - 2 * m - W * 0.036);
      // rosa de los vientos sencilla
      var cx = W / 2, cy = H * 0.3, s = W * 0.09;
      ctx.fillStyle = T.accent; ctx.beginPath(); ctx.moveTo(cx, cy - s); ctx.lineTo(cx + s * 0.18, cy); ctx.lineTo(cx, cy + s); ctx.lineTo(cx - s * 0.18, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = T.fg; ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx, cy - s * 0.18); ctx.lineTo(cx + s, cy); ctx.lineTo(cx, cy + s * 0.18); ctx.closePath(); ctx.fill();
      smallCaps(ctx, 'N', cx, cy - s - W * 0.02, W * 0.02, T.fg, 0, 700);
      var px = fit(lat, W * 0.075, W * 0.72, function (p) { return '600 ' + p + 'px Montserrat, Inter, sans-serif'; }); ctx.fillStyle = T.fg; ctx.fillText(lat, W / 2, H * 0.53);
      ctx.font = '600 ' + px + 'px Montserrat, Inter, sans-serif'; ctx.fillText(lon, W / 2, H * 0.53 + px * 1.25);
      text3(ctx, W, H, { title: o.title, line2: o.line2, line3: '', font: o.font }, H * 0.76, { text: T.fg, soft: T.soft });
    } else if (o.estilo === 'linea') {
      text3(ctx, W, H, { title: o.title, line2: '', line3: '', font: o.font }, H * 0.45, { text: T.fg, soft: T.soft });
      ctx.fillStyle = T.accent; ctx.fillRect(W * 0.42, H * 0.49, W * 0.16, W * 0.004);
      smallCaps(ctx, lat + '   ·   ' + lon, W / 2, H * 0.55, W * 0.022, T.fg, 0.12, 600);
      if (o.line2) smallCaps(ctx, o.line2, W / 2, H * 0.6, W * 0.017, T.soft, 0.3, 500);
    } else {   // apilado: las coordenadas enormes
      var big = function (p) { return '400 ' + p + 'px "Bebas Neue", Oswald, Impact, sans-serif'; };
      var p1 = fit(lat.replace(/ /g, ''), W * 0.2, W * 0.84, big), p2 = fit(lon.replace(/ /g, ''), W * 0.2, W * 0.84, big), pp = Math.min(p1, p2);
      ctx.font = big(pp); ctx.fillStyle = T.fg;
      ctx.fillText(lat.replace(/ /g, ''), W / 2, H * 0.36); ctx.fillText(lon.replace(/ /g, ''), W / 2, H * 0.36 + pp * 1.02);
      text3(ctx, W, H, { title: o.title, line2: o.line2, line3: '', font: o.font }, H * 0.74, { text: T.fg, soft: T.soft });
    }
    ctx.restore();
  }

  /* ── 8 · MAPA DE VIAJES (de un año o de una época) ── */
  function equalEarth(lon, lat) {
    var A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2;
    var t = Math.asin(M * Math.sin(lat * D2R)), t2 = t * t, t6 = t2 * t2 * t2;
    return [2 * Math.sqrt(3) * lon * D2R * Math.cos(t) / (3 * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2))), t * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))];
  }
  function viajes(ctx, W, H, o) {
    var T = LISOS[o.theme] || LISOS.crema, MD = window.MOMENTURIES_MUNDO || { P: [], D: [] };
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    // el mapa del mundo en una franja (latitudes -58 a 84)
    var b0 = equalEarth(-180, 84), b1 = equalEarth(180, -58), mw = W * 0.9, sc = mw / (b1[0] - b0[0]), mh = (b0[1] - b1[1]) * sc;
    var ox = W * 0.05, oy = H * 0.37 - mh / 2;
    var X = function (lon, lat) { var q = equalEarth(lon, lat); return [ox + (q[0] - b0[0]) * sc, oy + (b0[1] - q[1]) * sc]; };
    if (o.estilo === 'siluetas') {
      ctx.fillStyle = T.land; ctx.globalAlpha = isDark(T.bg) ? 0.85 : 0.9;
      MD.P.forEach(function (poly) {
        var lo = poly.map(function (p) { return p[0]; }); if (Math.max.apply(null, lo) - Math.min.apply(null, lo) > 300) return;   // cruza el meridiano 180
        ctx.beginPath(); poly.forEach(function (p, i) { var q = X(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.closePath(); ctx.fill(); });
      ctx.globalAlpha = 1;
    } else {
      var rr = W * 0.0021 * (MD.paso || 1.6) / 1.6;
      ctx.fillStyle = T.land; ctx.globalAlpha = 0.55;
      MD.D.forEach(function (p) { var q = X(p[0], p[1]); ctx.beginPath(); ctx.arc(q[0], q[1], rr, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1;
    }
    var pl = o.lugares || [];
    if (o.ruta && pl.length > 1) {
      ctx.strokeStyle = T.accent; ctx.lineWidth = W * 0.0018; ctx.setLineDash([W * 0.005, W * 0.004]);
      ctx.beginPath(); pl.forEach(function (l, i) { var q = X(l.lon, l.lat); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); ctx.setLineDash([]);
    }
    pl.forEach(function (l) {
      var q = X(l.lon, l.lat), r = W * 0.0075;
      ctx.fillStyle = T.bg; ctx.beginPath(); ctx.arc(q[0], q[1], r * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = T.accent; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.fill();
      if (o.nombres) { ctx.font = P.subFont(W * 0.0115, 600); ctx.fillStyle = T.fg; ctx.textAlign = 'left'; ctx.fillText(l.name, q[0] + r * 1.8, q[1] + r * 0.6); }
    });
    var paises = {}; pl.forEach(function (l) { if (l.country) paises[l.country] = 1; });
    var nP = Object.keys(paises).length, cuenta = pl.length ? (nP ? nP + (nP === 1 ? ' país' : ' países') + ' · ' : '') + pl.length + (pl.length === 1 ? ' lugar' : ' lugares') : '';
    text3(ctx, W, H, { title: o.title, line2: o.line2, line3: o.cuenta === false ? '' : cuenta, font: o.font }, H * 0.75, { text: T.fg, soft: T.soft });
    ctx.restore();
  }

  window.MOM_EXTRA = { LISOS: LISOS, SIGNOS: SIGNOS, signoDe: signoDe, luna: luna, cieloMapa: cieloMapa, dosCielos: dosCielos, fases: fases, signo: signo, onda: onda, audioPicos: audioPicos, coordenadas: coordenadas, viajes: viajes };
})();
