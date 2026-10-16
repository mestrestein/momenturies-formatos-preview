/* galeria/disenos.js — diseños propios del Estudio Momenturies (generados por código).
   Cada diseño es un SVG vectorial 3:4 (viewBox 1200×1600): la miniatura y el archivo de imprenta
   salen del mismo dibujo, así que se imprime nítido a cualquier talla (se rasteriza a 3600×4800 px
   = 30×40 cm a 300 ppp en MOMENTURIES_DISENOS.toFile).
   Sin texto a propósito: un SVG pintado en canvas no carga fuentes web. */
(function () {
  var W = 1200, H = 1600;

  /* ── utilidades ─────────────────────────────────────────── */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { var a = seed; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function f(n) { return Math.round(n * 10) / 10; }
  function rect(c, x, y, w, h, extra) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + c + '"' + (extra || '') + '/>'; }
  function circle(c, x, y, r, extra) { return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + c + '"' + (extra || '') + '/>'; }
  function path(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function bg(c) { return rect(c, 0, 0, W, H); }
  // curva cerrada suave por puntos (Catmull-Rom → Bézier)
  function smooth(pts) {
    var n = pts.length, d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += 'C' + f(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + f(p2[0]) + ' ' + f(p2[1]);
    }
    return d + 'Z';
  }
  function blob(R, cx, cy, r, k, jit) {
    var pts = [], n = k || 7;
    for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, rr = r * (1 - jit + R() * jit * 2); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    return smooth(pts);
  }
  function svg(body, defs) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' +
      (defs ? '<defs>' + defs + '</defs>' : '') + body + '</svg>';
  }
  // grano de papel muy suave (da textura de lámina impresa)
  function grainDefs(id, o) {
    return '<filter id="' + id + '" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ' + (o || 0.09) + ' 0"/></filter>';
  }
  function grain(id) { return '<rect width="' + W + '" height="' + H + '" filter="url(#' + id + ')"/>'; }

  /* ── familias ───────────────────────────────────────────── */
  var FAM = {};

  // RETRO · Atardecer 70: sol con franjas que se lo comen por abajo + arcos
  FAM.sol70 = function (p, R) {
    var c = p.c, cx = 600, cy = 760, r = 400, s = '';
    var defs = '<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></linearGradient>' +
      '<clipPath id="k"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath>' + grainDefs('n');
    s += bg(c[0]) + circle('url(#g)', cx, cy, r);
    var y = cy + 20, gap = 10;
    var cut = '';
    for (var i = 0; i < 7; i++) { cut += rect(c[0], cx - r - 5, y, 2 * r + 10, gap); y += gap + 52 - i * 5; gap += 9; }
    s += '<g clip-path="url(#k)">' + cut + '</g>';
    for (var j = 0; j < 3; j++) s += rect(c[3], 220, 1250 + j * 46, 760, 14 - j * 3, ' rx="7"');
    return svg(s + grain('n'), defs);
  };

  // RETRO · Arcoíris setentero: bandas en arco desde abajo
  FAM.arcoiris = function (p) {
    var c = p.c, s = bg(c[0]), cx = 600, cy = 1260, band = 96, n = c.length - 1;
    for (var i = 0; i < n; i++) {
      var r = 140 + (n - i) * band;
      s += '<path d="M' + (cx - r) + ' ' + cy + 'A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy + 'L' + (cx + r - band) + ' ' + cy + 'A' + (r - band) + ' ' + (r - band) + ' 0 0 0 ' + (cx - r + band) + ' ' + cy + 'Z" fill="' + c[i + 1] + '"/>';
    }
    s += rect(c[1], 150, cy + 40, 900, 10, ' rx="5"');
    return svg(s + grain('n'), grainDefs('n'));
  };

  // RETRO · Ondas groovy: franjas verticales onduladas
  FAM.ondas = function (p) {
    var c = p.c, s = bg(c[0]), n = 9, wv = W / n, amp = 70, per = 520;
    for (var i = -1; i < n + 1; i++) {
      var x0 = i * wv, d = 'M' + f(x0) + ' -10';
      for (var y = -10; y <= H + 10; y += 20) d += 'L' + f(x0 + Math.sin(y / per * Math.PI * 2) * amp) + ' ' + y;
      for (var y2 = H + 10; y2 >= -10; y2 -= 20) d += 'L' + f(x0 + wv + Math.sin(y2 / per * Math.PI * 2) * amp) + ' ' + y2;
      s += path(d + 'Z', c[1 + ((i + n) % (c.length - 1))]);
    }
    return svg(s + grain('n'), grainDefs('n'));
  };

  // RETRO · Margaritas groovy
  FAM.margaritas = function (p, R) {
    var c = p.c, s = bg(c[0]), placed = [];
    function flower(x, y, r, col, mid, rot) {
      var o = '<g transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(rot) + ')">';
      for (var k = 0; k < 8; k++) o += '<ellipse cx="0" cy="' + f(-r * 0.55) + '" rx="' + f(r * 0.28) + '" ry="' + f(r * 0.5) + '" fill="' + col + '" transform="rotate(' + k * 45 + ')"/>';
      return o + circle(mid, 0, 0, r * 0.3) + '</g>';
    }
    var tries = 0;
    while (placed.length < 22 && tries++ < 3000) {
      var r = placed.length < 4 ? 230 - placed.length * 25 : 60 + R() * 110, x = R() * W, y = R() * H, ok = true;
      for (var i = 0; i < placed.length; i++) { var q = placed[i]; if (Math.hypot(q[0] - x, q[1] - y) < (q[2] + r) * 0.98) { ok = false; break; } }
      if (!ok) continue;
      placed.push([x, y, r]);
      var col = c[1 + (placed.length % (c.length - 2))];
      s += flower(x, y, r, col, c[c.length - 1], R() * 45);
    }
    return svg(s + grain('n'), grainDefs('n'));
  };

  // RETRO · Montañas: cielo a franjas, sol y capas de montaña planas
  FAM.montanas = function (p, R) {
    var c = p.c, s = bg(c[0]);
    for (var i = 0; i < 6; i++) s += rect(c[1], 0, 140 + i * 95, W, 12 + i * 6, ' opacity="' + (0.25 + i * 0.1) + '"');
    s += circle(c[2], 820, 560, 190);
    for (var L = 0; L < 4; L++) {
      var base = 820 + L * 190, amp = 260 - L * 40, d = 'M0 ' + H, x = 0, y = base - R() * amp;
      d += 'L0 ' + f(y);
      while (x < W) { x += 120 + R() * 160; y = base - R() * amp; d += 'L' + f(Math.min(x, W)) + ' ' + f(y); }
      s += path(d + 'L' + W + ' ' + H + 'Z', c[3 + L]);
    }
    return svg(s + grain('n'), grainDefs('n'));
  };

  // RETRO · Mid-century atómico: estrellas, bumeranes y puntos
  FAM.atomico = function (p, R) {
    var c = p.c, s = bg(c[0]);
    for (var i = 0; i < 9; i++) {
      var x = 120 + (i % 3) * 480 + R() * 120 - 60, y = 160 + Math.floor(i / 3) * 560 + R() * 160, rot = R() * 360, col = c[1 + i % 3];
      s += '<path d="M-150 0C-80 -110 80 -110 150 0C90 -40 -90 -40 -150 0Z" fill="' + col + '" transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(rot) + ') scale(' + f(0.9 + R() * 0.6) + ')"/>';
    }
    for (var j = 0; j < 7; j++) {
      var sx = R() * W, sy = R() * H, sr = 40 + R() * 70, g = '<g stroke="' + c[4] + '" stroke-width="5" stroke-linecap="round">';
      for (var k = 0; k < 8; k++) { var a = k / 8 * Math.PI * 2; g += '<line x1="' + f(sx) + '" y1="' + f(sy) + '" x2="' + f(sx + Math.cos(a) * sr) + '" y2="' + f(sy + Math.sin(a) * sr) + '"/>'; }
      s += g + '</g>' + circle(c[4], sx, sy, 9);
    }
    for (var m = 0; m < 26; m++) s += circle(c[1 + m % 3], R() * W, R() * H, 8 + R() * 14);
    return svg(s + grain('n'), grainDefs('n'));
  };

  // RETRO · Rayas de los 70: bandas que suben y giran
  FAM.rayas70 = function (p) {
    var c = p.c, s = bg(c[0]), n = c.length - 1, bw = 80;
    for (var i = 0; i < n; i++) {
      var off = i * bw, x = 260 + off, r = 520 - off;
      var d = 'M' + x + ' ' + H + 'L' + x + ' ' + (420 + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' 420L' + W + ' 420' +
        'L' + W + ' ' + (420 + bw) + 'L' + (x + r) + ' ' + (420 + bw) + 'A' + (r - bw) + ' ' + (r - bw) + ' 0 0 0 ' + (x + bw) + ' ' + (420 + r) + 'L' + (x + bw) + ' ' + H + 'Z';
      s += '<path d="' + d + '" fill="' + c[1 + i] + '" transform="translate(0 ' + (i * bw) + ')"/>';
    }
    return svg(s + grain('n'), grainDefs('n'));
  };

  // MODERNO · Bauhaus: rejilla de formas geométricas
  FAM.bauhaus = function (p, R) {
    var c = p.c, s = bg(c[0]), cols = 3, rows = 4, m = 90, cw = (W - 2 * m) / cols, ch = (H - 2 * m) / rows;
    for (var r = 0; r < rows; r++) for (var q = 0; q < cols; q++) {
      var x = m + q * cw, y = m + r * ch, b = c[1 + Math.floor(R() * (c.length - 1))], fg;
      do { fg = c[Math.floor(R() * c.length)]; } while (fg === b);
      s += rect(b, x, y, cw, ch);
      var t = Math.floor(R() * 5), rot = Math.floor(R() * 4) * 90, cxp = x + cw / 2, cyp = y + ch / 2, rr = Math.min(cw, ch) / 2;
      var g = '<g transform="rotate(' + rot + ' ' + f(cxp) + ' ' + f(cyp) + ')">';
      if (t === 0) g += circle(fg, cxp, cyp, rr * 0.8);
      else if (t === 1) g += path('M' + f(cxp - rr) + ' ' + f(cyp + rr * 0.5) + 'A' + f(rr) + ' ' + f(rr) + ' 0 0 1 ' + f(cxp + rr) + ' ' + f(cyp + rr * 0.5) + 'Z', fg);
      else if (t === 2) g += path('M' + f(cxp - rr) + ' ' + f(cyp - rr) + 'L' + f(cxp + rr) + ' ' + f(cyp - rr) + 'A' + f(2 * rr) + ' ' + f(2 * rr) + ' 0 0 1 ' + f(cxp - rr) + ' ' + f(cyp + rr) + 'Z', fg);
      else if (t === 3) g += path('M' + f(cxp - rr) + ' ' + f(cyp + rr) + 'L' + f(cxp) + ' ' + f(cyp - rr) + 'L' + f(cxp + rr) + ' ' + f(cyp + rr) + 'Z', fg);
      else g += circle(fg, cxp, cyp, rr * 0.8) + circle(b, cxp, cyp, rr * 0.4);
      s += g + '</g>';
    }
    return svg(s + grain('n'), grainDefs('n'));
  };

  // MODERNO · Formas orgánicas (recortes de papel)
  FAM.organico = function (p, R) {
    var c = p.c, s = bg(c[0]);
    var spots = [[300, 380, 300], [860, 520, 260], [520, 960, 330], [930, 1260, 240], [250, 1330, 200]];
    spots.forEach(function (sp, i) { s += path(blob(R, sp[0] + R() * 60 - 30, sp[1] + R() * 60 - 30, sp[2], 6 + Math.floor(R() * 3), 0.32), c[1 + i % (c.length - 1)]); });
    // hojas tipo recorte
    for (var k = 0; k < 4; k++) {
      var x = 150 + R() * 900, y = 150 + R() * 1300, sc = 0.7 + R() * 0.7, rot = R() * 360;
      s += '<path d="M0 -150C70 -90 70 90 0 150C-70 90 -70 -90 0 -150Z" fill="' + c[1 + (k + 2) % (c.length - 1)] + '" transform="translate(' + f(x) + ' ' + f(y) + ') rotate(' + f(rot) + ') scale(' + f(sc) + ')"/>';
    }
    return svg(s + grain('n'), grainDefs('n', 0.1));
  };

  // MODERNO · Suizo: círculo enorme, barras y rejilla de puntos
  FAM.suizo = function (p, R) {
    var c = p.c, s = bg(c[0]);
    s += circle(c[1], 760, 620, 470);
    s += rect(c[2], 110, 980, 980, 70) + rect(c[2], 110, 1080, 640, 70) + rect(c[3], 110, 1180, 360, 70);
    for (var i = 0; i < 8; i++) for (var j = 0; j < 8; j++) s += circle(c[3], 140 + i * 42, 140 + j * 42, 7);
    s += path('M1090 1250L1090 1480L860 1480Z', c[3]);
    return svg(s + grain('n'), grainDefs('n'));
  };

  // MODERNO · Terrazo
  FAM.terrazo = function (p, R) {
    var c = p.c, s = bg(c[0]);
    for (var i = 0; i < 260; i++) {
      var x = R() * W, y = R() * H, big = R() < 0.18, r = big ? 30 + R() * 45 : 6 + R() * 16, n = 5 + Math.floor(R() * 3), pts = [];
      for (var k = 0; k < n; k++) { var a = k / n * Math.PI * 2 + R() * 0.6, rr = r * (0.6 + R() * 0.6); pts.push(f(x + Math.cos(a) * rr) + ',' + f(y + Math.sin(a) * rr)); }
      s += '<polygon points="' + pts.join(' ') + '" fill="' + c[1 + Math.floor(R() * (c.length - 1))] + '"/>';
    }
    return svg(s + grain('n', 0.07), grainDefs('n', 0.07));
  };

  // MODERNO · Memphis: zigzags, triángulos, garabatos y puntos
  FAM.memphis = function (p, R) {
    var c = p.c, s = bg(c[0]), k = 0;
    function col() { return c[1 + (k++ % (c.length - 1))]; }
    for (var i = 0; i < 6; i++) {
      var x = R() * W, y = R() * H, d = 'M' + f(x) + ' ' + f(y), st = 50;
      for (var z = 0; z < 6; z++) d += 'l' + st + ' ' + (z % 2 ? -st : st);
      s += '<path d="' + d + '" fill="none" stroke="' + col() + '" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" transform="rotate(' + f(R() * 360) + ' ' + f(x) + ' ' + f(y) + ')"/>';
    }
    for (var t = 0; t < 7; t++) { var tx = R() * W, ty = R() * H, ts = 50 + R() * 70; s += path('M' + f(tx) + ' ' + f(ty - ts) + 'L' + f(tx + ts) + ' ' + f(ty + ts * 0.7) + 'L' + f(tx - ts) + ' ' + f(ty + ts * 0.7) + 'Z', col(), ' transform="rotate(' + f(R() * 360) + ' ' + f(tx) + ' ' + f(ty) + ')"'); }
    for (var q = 0; q < 6; q++) { var qx = R() * W, qy = R() * H; s += '<path d="M' + f(qx) + ' ' + f(qy) + 'q40 -60 80 0t80 0t80 0" fill="none" stroke="' + col() + '" stroke-width="14" stroke-linecap="round" transform="rotate(' + f(R() * 360) + ' ' + f(qx) + ' ' + f(qy) + ')"/>'; }
    for (var o = 0; o < 5; o++) s += circle('none', R() * W, R() * H, 40 + R() * 50, ' stroke="' + col() + '" stroke-width="14"');
    for (var dd = 0; dd < 60; dd++) s += circle(c[c.length - 1], R() * W, R() * H, 6);
    return svg(s, '');
  };

  // MODERNO · Degradado con grano: manchas de color difuminadas
  FAM.degradado = function (p, R) {
    var c = p.c, s = bg(c[0]);
    var defs = '<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="150"/></filter>' + grainDefs('n', 0.07);
    var g = '<g filter="url(#b)">';
    for (var i = 1; i < c.length; i++) g += circle(c[i], 150 + R() * 900, 150 + R() * 1300, 380 + R() * 200);
    return svg(s + g + '</g>' + grain('n'), defs);
  };

  // MINIMAL · Arcos boho
  FAM.arcos = function (p) {
    var c = p.c, s = bg(c[0]), cx = 600, base = 1300;
    for (var i = 0; i < c.length - 2; i++) {
      var w = 760 - i * 140, top = 420 + i * 120;
      s += path('M' + (cx - w / 2) + ' ' + base + 'L' + (cx - w / 2) + ' ' + (top + w / 2) + 'A' + (w / 2) + ' ' + (w / 2) + ' 0 0 1 ' + (cx + w / 2) + ' ' + (top + w / 2) + 'L' + (cx + w / 2) + ' ' + base + 'Z', c[1 + i]);
    }
    s += circle(c[c.length - 1], 880, 330, 90);
    return svg(s + grain('n'), grainDefs('n'));
  };

  // MINIMAL · Sol y luna
  FAM.sollunda = function (p) {
    var c = p.c, s = bg(c[0]);
    s += circle(c[1], 600, 640, 260);
    s += path('M340 1060A260 260 0 0 0 860 1060Z', c[2]);
    s += rect(c[3], 300, 1100, 600, 8, ' rx="4"');
    return svg(s + grain('n'), grainDefs('n'));
  };

  // MINIMAL · Líneas en flujo
  FAM.lineas = function (p, R) {
    var c = p.c, s = bg(c[0]), ph = R() * 6, g = '<g fill="none" stroke="' + c[1] + '" stroke-width="4" stroke-linecap="round">';
    for (var i = 0; i < 46; i++) {
      var y0 = 200 + i * 26, d = 'M120 ' + y0;
      for (var x = 120; x <= 1080; x += 20) d += 'L' + x + ' ' + f(y0 + Math.sin(x / 260 + ph + i * 0.07) * (60 + i * 3) * Math.sin(Math.PI * (x - 120) / 960));
      g += '<path d="' + d + '"/>';
    }
    return svg(s + g + '</g>' + grain('n'), grainDefs('n'));
  };

  // MINIMAL · Horizonte: sol y mar en dos bandas
  FAM.horizonte = function (p) {
    var c = p.c, s = bg(c[0]);
    s += circle(c[1], 600, 900, 230);
    s += rect(c[2], 0, 900, W, 700);
    for (var i = 0; i < 5; i++) s += rect(c[1], 600 - (180 - i * 32), 950 + i * 55, (180 - i * 32) * 2, 10, ' rx="5" opacity="' + (0.8 - i * 0.12) + '"');
    return svg(s + grain('n'), grainDefs('n'));
  };

  // MINIMAL · Círculos concéntricos desplazados
  FAM.circulos = function (p) {
    var c = p.c, s = bg(c[0]), g = '<g fill="none" stroke-width="5">';
    for (var i = 0; i < 18; i++) g += circle('none', 600 + i * 6, 800 - i * 14, 40 + i * 28, ' stroke="' + c[1 + i % (c.length - 1)] + '"');
    return svg(s + g + '</g>' + grain('n'), grainDefs('n'));
  };

  // MINIMAL · Semitono: rejilla de puntos que crecen
  FAM.puntos = function (p) {
    var c = p.c, s = bg(c[0]), step = 60;
    for (var y = 110; y < H - 80; y += step) for (var x = 120; x < W - 80; x += step) {
      var t = Math.hypot(x - 380, y - 520) / 1250, r = Math.max(2, 25 * (1 - t));
      s += circle(c[1], x, y, r);
    }
    return svg(s + grain('n'), grainDefs('n'));
  };

  /* ── catálogo: familia × paleta ─────────────────────────── */
  var D = [
    ["sol70", "retro", "Atardecer 70", "Seventies Sunset",
      "Un sol enorme cortado en franjas, como en las pegatinas de surf y los pósters de los años 70. Colores cálidos y textura de lámina antigua.",
      "A huge sun sliced into stripes, like 1970s surf stickers and posters. Warm colours with a vintage print texture.",
      [["Mostaza", "Mustard", ["#f3e7d3", "#f2b134", "#d9562b", "#3c2a21"]], ["Rosa coral", "Coral pink", ["#fbe9e2", "#ff9a76", "#e2445c", "#5b2333"]],
       ["Oliva", "Olive", ["#ece6d2", "#d7b541", "#7a8a3a", "#2f3324"]], ["Noche", "Night", ["#1d2340", "#ffc65c", "#ff5f5f", "#f6e7cf"]],
       ["Terracota", "Terracotta", ["#efe2cf", "#e9a15b", "#b8482f", "#2c2420"]]]],
    ["arcoiris", "retro", "Arcoíris setentero", "Seventies Rainbow",
      "Bandas gruesas en arco con la paleta de un salón de 1974: mostaza, naranja, teja y marrón. Alegre sin estridencias.",
      "Thick arched bands in the palette of a 1974 living room: mustard, orange, rust and brown. Cheerful without shouting.",
      [["Clásico", "Classic", ["#f4ead8", "#3d2b1f", "#a0482d", "#e07a2f", "#f0b23d"]], ["Pastel", "Pastel", ["#fbf4ec", "#e8a2a2", "#f2c19b", "#f6dd9c", "#b8d5b8"]],
       ["Bosque", "Forest", ["#efe8d8", "#2e3b2c", "#5d7347", "#c89b3c", "#e8c66f"]], ["Atardecer", "Dusk", ["#2a1f3d", "#ff7a59", "#ffb25b", "#ffd88a", "#fff1d0"]]]],
    ["ondas", "retro", "Ondas groovy", "Groovy Waves",
      "Franjas onduladas de arriba abajo, con el movimiento de un estampado psicodélico pero en clave tranquila. Llena una pared con mucha personalidad.",
      "Wavy stripes running top to bottom, with the movement of a psychedelic print kept calm. Fills a wall with personality.",
      [["Caramelo", "Caramel", ["#000", "#f4e4c9", "#e9a13b", "#c4572e", "#6b2f1e"]], ["Mar", "Sea", ["#000", "#eaf2ef", "#9cc9c1", "#3f8f8b", "#1d4e5a"]],
       ["Chicle", "Bubblegum", ["#000", "#fff0f3", "#ffb3c6", "#ff6f91", "#c13b6b"]], ["Tierra", "Earth", ["#000", "#efe5d5", "#c9a77c", "#8b5e3c", "#4a3326"]]]],
    ["margaritas", "retro", "Margaritas groovy", "Groovy Daisies",
      "Flores de pétalos redondos repartidas como en un papel pintado de los 60. Desenfadado y luminoso, perfecto para dormitorios y habitaciones infantiles.",
      "Round-petalled flowers scattered like 1960s wallpaper. Playful and bright, perfect for bedrooms and kids' rooms.",
      [["Limón", "Lemon", ["#fff6dd", "#f4a259", "#f25c54", "#5b8e7d", "#f7d046"]], ["Lavanda", "Lavender", ["#ede7f6", "#b39ddb", "#ffffff", "#f48fb1", "#ffd54f"]],
       ["Verde menta", "Mint", ["#dff2ea", "#ffffff", "#ff8a65", "#4db6ac", "#ffca28"]], ["Vino", "Wine", ["#5a1e2b", "#f6d6c8", "#f28c6b", "#e8b04b", "#f8e3a3"]]]],
    ["montanas", "retro", "Montañas al sol", "Mountain Sun",
      "Capas de montaña en colores planos bajo un sol grande, como en los carteles de viaje de los años 30. Para quien sueña con la próxima escapada.",
      "Layers of mountains in flat colours under a big sun, like 1930s travel posters. For anyone dreaming of the next getaway.",
      [["Alba", "Dawn", ["#fbe3c8", "#f6a96c", "#f26b38", "#c75b39", "#8c3f3b", "#4f2a3a", "#2a1b2e"]], ["Pinar", "Pine", ["#e6efe6", "#a8c3a0", "#f2c14e", "#7aa37a", "#4f7a5b", "#2f5340", "#1b3329"]],
       ["Glaciar", "Glacier", ["#e8f1f6", "#a9cbe0", "#ffffff", "#8fb3cc", "#5d86a8", "#3a5d80", "#1f3550"]], ["Desierto", "Desert", ["#f8e7cf", "#f3b67a", "#fff1d6", "#e09a5b", "#c46d3c", "#8f4a2c", "#55301f"]]]],
    ["atomico", "retro", "Era atómica", "Atomic Age",
      "Bumeranes, estrellas y puntos del diseño mid-century de los años 50. Un guiño a las cafeterías americanas y los muebles de teca.",
      "Boomerangs, starbursts and dots from 1950s mid-century design. A nod to American diners and teak furniture.",
      [["Teca", "Teak", ["#f2e8d5", "#e3753c", "#2f8f8a", "#e9b44c", "#2b2b2b"]], ["Turquesa", "Turquoise", ["#1f6f78", "#f3c969", "#f08a5d", "#f4ead5", "#f4ead5"]],
       ["Cereza", "Cherry", ["#f6efe3", "#c73e3a", "#2d4b73", "#f2b134", "#1e1e1e"]]]],
    ["rayas70", "retro", "Rayas setenteras", "Seventies Stripes",
      "Cuatro bandas que suben y giran, como las rayas de un coche de rally o una furgoneta de los 70. Muy gráfico y muy retro.",
      "Four bands that rise and curve, like the stripes on a rally car or a 70s camper van. Graphic and very retro.",
      [["Rally", "Rally", ["#f4ead8", "#f0b23d", "#e07a2f", "#c0452c", "#5a2a1e"]], ["Océano", "Ocean", ["#f1ede4", "#9fd3c7", "#4aa3a2", "#2a6f86", "#1d3557"]],
       ["Fresa", "Strawberry", ["#fdf0e8", "#ffc4a3", "#ff8c7a", "#e5536e", "#8e2d56"]], ["Noche", "Night", ["#1b1b2f", "#ffd166", "#f78c6b", "#ef476f", "#9b5de5"]]]],
    ["bauhaus", "moderno", "Bauhaus", "Bauhaus",
      "Una rejilla de círculos, medias lunas y triángulos inspirada en la escuela Bauhaus. Cada combinación es única y queda genial en salones modernos y despachos.",
      "A grid of circles, half-moons and triangles inspired by the Bauhaus school. Every combination is unique and looks great in modern living rooms and offices.",
      [["Primarios", "Primaries", ["#f1ebdf", "#d94032", "#f2b62f", "#2b5aa8", "#1d1d1b"]], ["Tierra", "Earth", ["#efe6d6", "#c4622d", "#e3b04b", "#5d7052", "#2e2a26"]],
       ["Pastel", "Pastel", ["#faf6f0", "#f4b6a6", "#f7d488", "#a8c5da", "#7d8f77"]], ["Azules", "Blues", ["#eef1f4", "#1f3a5f", "#4f7cac", "#c0d6df", "#e07a5f"]],
       ["Noche", "Night", ["#161616", "#e94f37", "#f6c90e", "#3f88c5", "#f4f1ea"]], ["Salvia", "Sage", ["#f2efe6", "#9caf88", "#d8a47f", "#ef8354", "#4f5d75"]]]],
    ["organico", "moderno", "Formas orgánicas", "Organic Shapes",
      "Manchas y hojas que parecen recortadas a tijera, en la línea de los papeles recortados de las vanguardias. Cálido, relajado y muy decorativo.",
      "Blobs and leaves that look cut out with scissors, in the spirit of modernist paper cut-outs. Warm, relaxed and very decorative.",
      [["Arena", "Sand", ["#f3ece1", "#d9a07b", "#a65f3e", "#7c8b6f", "#e3c08d"]], ["Mediterráneo", "Mediterranean", ["#f6f1e7", "#2f5d8a", "#e9b872", "#d36b4f", "#9fc2c7"]],
       ["Rosa y verde", "Pink & green", ["#f8efe9", "#e7a4a0", "#2f5544", "#e9c46a", "#b7c9b0"]], ["Nocturno", "Nocturne", ["#22252b", "#c9a96e", "#e08e6d", "#5f8575", "#ece4d4"]],
       ["Mostaza", "Mustard", ["#efe7d7", "#d9a520", "#3b4a3f", "#c75d3a", "#e9dcc4"]]]],
    ["suizo", "moderno", "Estilo suizo", "Swiss Style",
      "Un círculo enorme, barras y una rejilla de puntos: la geometría limpia del diseño gráfico suizo, sin una sola letra. Ordenado y contundente.",
      "A huge circle, bars and a dot grid: the clean geometry of Swiss graphic design, without a single letter. Orderly and bold.",
      [["Rojo", "Red", ["#efeee9", "#e63b2e", "#1d1d1b", "#1d1d1b"]], ["Azul", "Blue", ["#f2f0ea", "#2d5bd7", "#f2b705", "#141414"]],
       ["Naranja", "Orange", ["#151515", "#ff6b1a", "#f2efe8", "#f2efe8"]], ["Verde", "Green", ["#ede9df", "#2e7d5b", "#e9a23b", "#1c1c1c"]]]],
    ["terrazo", "moderno", "Terrazo", "Terrazzo",
      "El suelo de terrazo de las casas de los abuelos convertido en cuadro: lascas de colores sobre fondo claro. Discreto de lejos, lleno de detalles de cerca.",
      "The terrazzo floors of our grandparents' homes turned into art: coloured chips on a pale ground. Subtle from afar, full of detail up close.",
      [["Clásico", "Classic", ["#f1ede6", "#c86b4a", "#2f4f4f", "#e1b866", "#9aa79b", "#3a3a3a"]], ["Rosa", "Pink", ["#f7ede8", "#e59a8c", "#b85c5c", "#f0c987", "#7d9a8f"]],
       ["Verde", "Green", ["#eef0ea", "#557a63", "#a3b18a", "#d5a253", "#2f3e46"]], ["Oscuro", "Dark", ["#2a2a2a", "#e9e2d0", "#c6744b", "#8faa9a", "#d8b26e"]]]],
    ["memphis", "moderno", "Memphis", "Memphis",
      "Zigzags, triángulos, garabatos y puntos del grupo Memphis de Milán, el diseño más divertido de los años 80. Para paredes con ganas de fiesta.",
      "Zigzags, triangles, squiggles and dots from Milan's Memphis group, the most fun design of the 1980s. For walls that want to party.",
      [["Original", "Original", ["#fdf6ec", "#ff5d73", "#2ec4b6", "#ffbf00", "#3a86ff", "#1b1b1b"]], ["Pastel", "Pastel", ["#f3eefe", "#ffadad", "#9bf6ff", "#fdffb6", "#bdb2ff", "#3a3a3a"]],
       ["Negro", "Black", ["#141414", "#ff4f79", "#21d4b4", "#ffd23f", "#f4f4f4", "#f4f4f4"]]]],
    ["degradado", "moderno", "Degradado de color", "Colour Gradient",
      "Manchas de color difuminadas con un grano finísimo, como una foto desenfocada de un atardecer. Relajante y muy actual; en aluminio el degradado brilla.",
      "Soft blurred colour fields with a fine grain, like an out-of-focus photo of a sunset. Calming and very current; on aluminium the gradient glows.",
      [["Atardecer", "Sunset", ["#ffb38a", "#ff6f61", "#ffd27f", "#c86fc9", "#ff9a8b"]], ["Lavanda", "Lavender", ["#cdb4db", "#ffc8dd", "#a2d2ff", "#bde0fe", "#ffafcc"]],
       ["Océano", "Ocean", ["#0b3c5d", "#1ca3a3", "#79d1c3", "#328cc1", "#d9f2f2"]], ["Melocotón", "Peach", ["#ffe5d9", "#ffcad4", "#f4acb7", "#fec89a", "#ffd7ba"]],
       ["Aurora", "Aurora", ["#0d1b2a", "#2ec4b6", "#7b2cbf", "#3a86ff", "#80ffdb"]]]],
    ["arcos", "minimal", "Arcos", "Arches",
      "Arcos encajados unos dentro de otros en tonos tierra, con un pequeño sol. Minimalismo cálido de estilo boho que combina con madera, lino y plantas.",
      "Nested arches in earthy tones with a little sun. Warm boho minimalism that pairs with wood, linen and plants.",
      [["Terracota", "Terracotta", ["#f3ebe0", "#c9714f", "#e3a97d", "#efcfae", "#c9714f"]], ["Salvia", "Sage", ["#f1efe7", "#8a9a7b", "#b7c0a3", "#dfe2d0", "#d48f6a"]],
       ["Arena", "Sand", ["#f7f1e8", "#b98b6e", "#d6b597", "#ead8c3", "#8c5a3c"]], ["Azul polvo", "Dusty blue", ["#f2f1ee", "#6f8fa6", "#a7bccb", "#d6e0e7", "#e0a96d"]]]],
    ["sollunda", "minimal", "Sol y luna", "Sun & Moon",
      "Un círculo, una media luna y una línea. Lo mínimo para crear calma; funciona solo o en pareja sobre una cómoda o un cabecero.",
      "A circle, a half-moon and a line. The bare minimum to create calm; works alone or as a pair above a dresser or headboard.",
      [["Teja", "Rust", ["#f2ebe1", "#c4623f", "#2f3a3a", "#2f3a3a"]], ["Mostaza", "Mustard", ["#efeae0", "#d9a53c", "#5a6b5b", "#5a6b5b"]],
       ["Rosa", "Pink", ["#f6ece8", "#e7a39a", "#7a4b4b", "#7a4b4b"]], ["Noche", "Night", ["#1f2430", "#e8d8b8", "#c58b66", "#e8d8b8"]]]],
    ["lineas", "minimal", "Líneas en flujo", "Flowing Lines",
      "Decenas de líneas finas que ondulan como el agua o el viento. Un diseño sereno y elegante que gana mucho a gran tamaño.",
      "Dozens of fine lines rippling like water or wind. A calm, elegant design that really comes alive at large sizes.",
      [["Tinta", "Ink", ["#f4f1ea", "#1e2a3a"]], ["Teja", "Rust", ["#f3ece2", "#b5532f"]], ["Oro", "Gold", ["#1a1a1a", "#d4b26a"]], ["Verde", "Green", ["#eef0e9", "#2f5a46"]]]],
    ["horizonte", "minimal", "Horizonte", "Horizon",
      "Un sol que se pone en el mar y su reflejo en franjas. Dos colores y una línea de horizonte: tan sencillo como relajante.",
      "A sun setting into the sea with its striped reflection. Two colours and a horizon line: as simple as it is relaxing.",
      [["Mediterráneo", "Mediterranean", ["#f4e3cf", "#e8643c", "#1f4e6b"]], ["Rosa", "Pink", ["#fde4dc", "#f28c7b", "#6b5b95"]],
       ["Dorado", "Golden", ["#f6ecd6", "#e3a33b", "#3b4d3f"]], ["Noche", "Night", ["#1a2238", "#f4d58d", "#30475e"]]]],
    ["circulos", "minimal", "Círculos", "Circles",
      "Círculos concéntricos desplazados que crean sensación de profundidad, como ondas en un estanque. Óptico, hipnótico y muy limpio.",
      "Offset concentric circles that create a sense of depth, like ripples on a pond. Optical, hypnotic and very clean.",
      [["Coral", "Coral", ["#f6efe7", "#e2674a", "#f2a65a"]], ["Azul", "Blue", ["#eef2f5", "#264653", "#2a9d8f"]], ["Oro", "Gold", ["#171717", "#d6b36a", "#8c7a5b"]]]],
    ["puntos", "minimal", "Semitono", "Halftone",
      "Una rejilla de puntos que crecen y menguan como en las viejas impresiones de periódico. Gráfico y discreto a la vez.",
      "A grid of dots that grow and shrink like old newspaper printing. Graphic and understated at once.",
      [["Negro", "Black", ["#f3f0e9", "#1b1b1b"]], ["Rojo", "Red", ["#f4efe6", "#d7442e"]], ["Azul", "Blue", ["#eef1f6", "#284b9b"]], ["Crema", "Cream", ["#1d1f22", "#efe3c8"]]]],
  ];

  var LIST = [], BY = {};
  D.forEach(function (fam) {
    var key = fam[0];
    fam[6].forEach(function (pal) {
      var id = 'm-' + key + '-' + pal[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
      var d = { id: id, cat: fam[1], fam: key, own: true, t: fam[2] + ' · ' + pal[0], te: fam[3] + ' · ' + pal[1], a: 'Estudio Momenturies', y: '2026',
        d: fam[4], de: fam[5], c: pal[2], max: 'XL', lic: 'Diseño original de Momenturies' };
      // en «Ondas» el primer color no se usa (las franjas cubren todo)
      d.svg = function () { return FAM[key]({ c: pal[2] }, rng(hash(id))); };
      LIST.push(d); BY[id] = d;
    });
  });

  // archivo de imprenta: SVG → canvas 3600×4800 (30×40 cm a 300 ppp) → JPEG de máxima calidad
  function toFile(id, w) {
    var d = BY[id]; if (!d) return Promise.reject(new Error('no existe ' + id));
    var PW = w || 3600, PH = Math.round(PW * 4 / 3);
    var src = d.svg().replace('width="' + W + '" height="' + H + '"', 'width="' + PW + '" height="' + PH + '"');
    var url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
    return new Promise(function (res, rej) {
      var img = new Image();
      img.onload = function () {
        var cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
        cv.getContext('2d').drawImage(img, 0, 0, PW, PH); URL.revokeObjectURL(url);
        cv.toBlob(function (b) { b ? res(new File([b], id + '.jpg', { type: 'image/jpeg' })) : rej(new Error('canvas')); }, 'image/jpeg', 0.95);
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('svg')); };
      img.src = url;
    });
  }

  window.MOMENTURIES_DISENOS = { list: LIST, byId: BY, toFile: toFile };
})();
