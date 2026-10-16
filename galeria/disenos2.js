/* galeria/disenos2.js — diseños propios con texto (Estudio Momenturies): carteles de viaje, coches y temporada.
   Se dibujan en canvas (no en SVG) porque llevan tipografías web, que un SVG pintado como imagen no carga.
   Todo se dibuja en un lienzo lógico de 1200 × 1600 (3:4) escalado al tamaño pedido: la miniatura y el archivo de
   imprenta (3600 × 4800 = 30 × 40 cm a 300 ppp) salen del mismo dibujo vectorial.
   Coches: modelos genéricos, sin marcas ni formas reconocibles de ningún fabricante. */
(function () {
  var FONTS = ['400 80px "Bebas Neue"', '600 40px Montserrat', '500 40px Montserrat', 'italic 500 60px "Playfair Display"', '400 60px "Great Vibes"'];
  var ready = (document.fonts && document.fonts.load) ? Promise.all(FONTS.map(function (f) { return document.fonts.load(f).catch(function () {}); })) : Promise.resolve();

  /* ── utilidades de dibujo ── */
  function rng(seed) { var a = seed >>> 0; return function () { a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function poly(c, pts, fill) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); }
  function rect(c, x, y, w, h, fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); }
  function circ(c, x, y, r, fill) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
  function rrect(c, x, y, w, h, r, fill) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fillStyle = fill; c.fill(); }
  function vgrad(c, y0, y1, a, b) { var g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  // sierra: polígono desde el borde izquierdo al derecho por los picos dados
  function ridge(c, baseY, pts, fill, x0, x1) { x0 = x0 == null ? 0 : x0; x1 = x1 == null ? 1200 : x1; poly(c, [[x0, baseY]].concat(pts).concat([[x1, baseY]]), fill); }
  function sun(c, x, y, r, fill, stripeBg, n) {
    circ(c, x, y, r, fill);
    if (stripeBg) { var h = 6; for (var i = 0; i < (n || 5); i++) { var yy = y + r * 0.15 + i * (r * 0.17); rect(c, x - r - 2, yy, 2 * r + 4, h + i * 2.4, stripeBg); } }
  }
  function sea(c, y0, y1, a, b, line, R) {
    rect(c, 0, y0, 1200, y1 - y0, vgrad(c, y0, y1, a, b));
    c.strokeStyle = line; c.lineCap = 'round';
    for (var k = 0; k < 26; k++) {
      var yy = y0 + 20 + Math.pow(k / 26, 1.4) * (y1 - y0 - 30), w = 30 + (yy - y0) / (y1 - y0) * 90, x = R() * 1200;
      c.lineWidth = 2 + (yy - y0) / (y1 - y0) * 4; c.beginPath(); c.moveTo(x, yy); c.quadraticCurveTo(x + w / 2, yy - 6, x + w, yy); c.stroke();
    }
  }
  function boat(c, x, y, s, hull, sail, sail2) {
    poly(c, [[x - 70 * s, y], [x + 80 * s, y], [x + 55 * s, y + 26 * s], [x - 50 * s, y + 26 * s]], hull);
    poly(c, [[x + 2 * s, y - 6 * s], [x + 2 * s, y - 190 * s], [x + 85 * s, y - 6 * s]], sail);
    poly(c, [[x - 6 * s, y - 6 * s], [x - 6 * s, y - 150 * s], [x - 62 * s, y - 6 * s]], sail2 || sail);
    rect(c, x - 2 * s, y - 196 * s, 5 * s, 192 * s, hull);
  }
  function palm(c, x, y, h, lean, trunk, leaf) {
    var tx = x + lean, ty = y - h;
    c.strokeStyle = trunk; c.lineCap = 'round';
    for (var i = 0; i < 14; i++) {   // tronco por anillos
      var t0 = i / 14, t1 = (i + 1) / 14, p0 = qpt(x, y, x + lean * 0.2, y - h * 0.6, tx, ty, t0), p1 = qpt(x, y, x + lean * 0.2, y - h * 0.6, tx, ty, t1);
      c.lineWidth = 22 - i * 0.9; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
    }
    c.fillStyle = leaf;
    [-2.6, -2.05, -1.5, -0.95, -0.4, 0.2, 0.75].forEach(function (a, i) {
      var L = h * (0.42 + (i % 2) * 0.06), ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.65 + L * 0.28;
      c.beginPath(); c.moveTo(tx, ty);
      c.quadraticCurveTo(tx + Math.cos(a - 0.25) * L * 0.6, ty + Math.sin(a - 0.25) * L * 0.5 - 30, ex, ey);
      c.quadraticCurveTo(tx + Math.cos(a + 0.25) * L * 0.55, ty + Math.sin(a + 0.25) * L * 0.5 - 6, tx, ty); c.fill();
    });
  }
  function qpt(x0, y0, x1, y1, x2, y2, t) { var u = 1 - t; return [u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2]; }
  function castle(c, x, y, w, h, fill) {
    rect(c, x, y - h, w, h, fill);
    var n = Math.round(w / 34); for (var i = 0; i < n; i += 2) rect(c, x + i * w / n, y - h - 16, w / n, 16, fill);
    [x - 18, x + w - 22].forEach(function (tx) { rect(c, tx, y - h - 60, 40, h + 60, fill); for (var k = 0; k < 3; k++) rect(c, tx + k * 15, y - h - 74, 10, 14, fill); });
    rect(c, x + w * 0.42, y - h * 0.62, w * 0.14, h * 0.62, 'rgba(0,0,0,.25)');
  }
  function windmill(c, x, y, s, body, cap, blades) {
    poly(c, [[x - 38 * s, y], [x + 38 * s, y], [x + 28 * s, y - 150 * s], [x - 28 * s, y - 150 * s]], body);
    poly(c, [[x - 34 * s, y - 148 * s], [x + 34 * s, y - 148 * s], [x, y - 190 * s]], cap);
    c.save(); c.translate(x, y - 150 * s); c.rotate(0.35); c.fillStyle = blades;
    for (var k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.fillRect(-4 * s, 0, 8 * s, 120 * s); c.fillRect(4 * s, 30 * s, 22 * s, 86 * s); }
    c.restore(); circ(c, x, y - 150 * s, 8 * s, cap);
  }
  function lighthouse(c, x, y, h, a, b, lamp) {
    var w0 = h * 0.16, w1 = h * 0.11, n = 5;
    for (var i = 0; i < n; i++) { var t0 = i / n, t1 = (i + 1) / n; poly(c, [[x - w0 / 2 + (w0 - w1) / 2 * t0, y - h * t0], [x + w0 / 2 - (w0 - w1) / 2 * t0, y - h * t0], [x + w0 / 2 - (w0 - w1) / 2 * t1, y - h * t1], [x - w0 / 2 + (w0 - w1) / 2 * t1, y - h * t1]], i % 2 ? b : a); }
    rect(c, x - w1 * 0.7, y - h - 8, w1 * 1.4, 10, b); rect(c, x - w1 * 0.4, y - h - 52, w1 * 0.8, 44, lamp);
    poly(c, [[x - w1 * 0.55, y - h - 52], [x + w1 * 0.55, y - h - 52], [x, y - h - 82]], b);
    c.fillStyle = 'rgba(255,240,180,.18)'; c.beginPath(); c.moveTo(x, y - h - 30); c.lineTo(x - 420, y - h - 120); c.lineTo(x - 420, y - h + 40); c.closePath(); c.fill();
  }
  function cypress(c, x, y, h, fill) { c.beginPath(); c.moveTo(x, y - h); c.quadraticCurveTo(x + h * 0.14, y - h * 0.5, x + h * 0.06, y); c.lineTo(x - h * 0.06, y); c.quadraticCurveTo(x - h * 0.14, y - h * 0.5, x, y - h); c.fillStyle = fill; c.fill(); }
  function grainLayer(c, W, H, a) {
    if (!grainLayer.pat) { var g = document.createElement('canvas'); g.width = g.height = 256; var x = g.getContext('2d'), d = x.createImageData(256, 256), R = rng(7); for (var i = 0; i < d.data.length; i += 4) { var v = R() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); grainLayer.pat = g; }
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay'; c.fillStyle = c.createPattern(grainLayer.pat, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
  }
  function spaced(c, text, x, y, sp) {
    var ch = Array.from(text), w = ch.reduce(function (s, k) { return s + c.measureText(k).width; }, 0) + sp * (ch.length - 1), cx = x - w / 2;
    c.textAlign = 'left'; ch.forEach(function (k) { c.fillText(k, cx, y); cx += c.measureText(k).width + sp; }); c.textAlign = 'center';
  }
  function fitFont(c, text, family, weight, size, maxW, sp) {
    c.font = weight + ' ' + size + 'px ' + family;
    while (c.measureText(text).width + (sp || 0) * text.length > maxW && size > 20) { size -= 4; c.font = weight + ' ' + size + 'px ' + family; }
    return size;
  }
  /* marco de cartel: ilustración arriba (60..1140 × 60..1240) y franja de texto abajo */
  function posterFrame(c, p, name, sub, draw) {
    rect(c, 0, 0, 1200, 1600, p.paper);
    c.save(); c.beginPath(); c.rect(60, 60, 1080, 1180); c.clip(); draw(c); c.restore();
    c.fillStyle = p.ink; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    var sz = fitFont(c, name, '"Bebas Neue", Oswald, Impact, sans-serif', 400, 230, 1040, 10);
    spaced(c, name, 600, 1240 + 60 + sz * 0.78, 10);
    c.font = '600 34px Montserrat, Inter, sans-serif'; spaced(c, sub, 600, 1540, 9);
  }

  /* ── CARTELES DE VIAJE ── */
  function viaje(def) {
    return function (c, R) {
      var p = def.p;
      posterFrame(c, p, def.name, def.sub, function (c) {
        rect(c, 0, 0, 1200, 1300, vgrad(c, 60, 900, p.sky1, p.sky2));
        def.scene(c, p, R);
      });
    };
  }
  var V = [
    { id: 'denia', name: 'DÉNIA', sub: 'COSTA BLANCA · ESPAÑA', p: { paper: '#f3e9d8', ink: '#1f3b57', sky1: '#f6c58e', sky2: '#fbe6c4', sun: '#e8643c', sea1: '#2b6c8f', sea2: '#1f4e6b', land: '#6d7d4b', land2: '#4f5e37', rock: '#c98a5b', wall: '#e9c493' },
      scene: function (c, p, R) {
        sun(c, 820, 470, 150, p.sun, p.sky2, 5);
        ridge(c, 820, [[60, 760], [200, 640], [330, 520], [470, 470], [640, 480], [760, 560], [880, 650], [1000, 720], [1140, 760]], p.land2);   // el Montgó
        ridge(c, 860, [[60, 840], [260, 700], [360, 680], [470, 720], [560, 800], [700, 830], [1140, 840]], p.rock);
        castle(c, 255, 712, 190, 70, p.wall);
        sea(c, 860, 1300, p.sea1, p.sea2, 'rgba(255,255,255,.45)', R);
        boat(c, 760, 1010, 1.15, '#f3e9d8', '#fffaf0', '#f0d9b5');
        palm(c, 1080, 1260, 520, -60, '#5b3b23', '#2f5a3a'); palm(c, 1000, 1290, 420, -30, '#5b3b23', '#3d6b47');
      } },
    { id: 'javea', name: 'XÀBIA', sub: 'JÁVEA · COSTA BLANCA', p: { paper: '#eef0ea', ink: '#24425e', sky1: '#9fc7e0', sky2: '#e7f1f3', sun: '#f2b84b', sea1: '#2e86ab', sea2: '#1b5b7a', land: '#b8925f', land2: '#8a6a43', mill: '#f4efe4', cap: '#a5643e' },
      scene: function (c, p, R) {
        sun(c, 300, 330, 120, p.sun);
        ridge(c, 760, [[60, 700], [300, 560], [560, 520], [800, 540], [1140, 600]], p.land);
        [380, 540, 700].forEach(function (x, i) { windmill(c, x, 548 - (i === 1 ? 12 : 0), 0.95, p.mill, p.cap, '#5a4632'); });
        ridge(c, 800, [[60, 760], [140, 690], [240, 720], [360, 780]], p.land2, 60, 420);
        sea(c, 780, 1300, p.sea1, p.sea2, 'rgba(255,255,255,.5)', R);
        boat(c, 900, 980, 0.9, '#fff', '#fff', '#e9e3d4'); boat(c, 520, 1120, 0.6, '#fff', '#f6efe1');
      } },
    { id: 'alicante', name: 'ALICANTE', sub: 'LA TERRETA · COSTA BLANCA', p: { paper: '#f6efe3', ink: '#7a2e24', sky1: '#ffb38a', sky2: '#ffe2c6', sun: '#f7d26b', sea1: '#3a7ca5', sea2: '#244f6e', rock: '#c27b4e', rock2: '#9a5a36', wall: '#f0d4a6' },
      scene: function (c, p, R) {
        sun(c, 900, 360, 110, p.sun);
        poly(c, [[180, 900], [300, 640], [380, 520], [470, 470], [560, 540], [640, 700], [760, 900]], p.rock);   // el Benacantil
        poly(c, [[380, 900], [470, 600], [520, 620], [600, 900]], p.rock2);
        castle(c, 395, 520, 160, 60, p.wall);
        rect(c, 0, 880, 1200, 70, '#e8d2ae');
        [110, 260, 860, 1010, 1130].forEach(function (x, i) { palm(c, x, 960, 250 + (i % 2) * 50, (i % 2 ? 30 : -30), '#6b4529', '#2e5d3b'); });
        sea(c, 950, 1300, p.sea1, p.sea2, 'rgba(255,255,255,.45)', R);
      } },
    { id: 'valencia', name: 'VALÈNCIA', sub: "L'HORTA I LA MAR", p: { paper: '#f4ecdc', ink: '#c2491d', sky1: '#8fc1d4', sky2: '#eef3e6', sun: '#f39c33', field: '#6e8b3d', field2: '#577032', wall: '#fbf7ef', roof: '#b88a4a', sea1: '#2f7fa6', sea2: '#205e7f' },
      scene: function (c, p, R) {
        sun(c, 900, 330, 120, p.sun);
        sea(c, 640, 760, p.sea1, p.sea2, 'rgba(255,255,255,.4)', R);
        rect(c, 0, 760, 1200, 540, p.field);
        for (var k = 0; k < 9; k++) { c.fillStyle = k % 2 ? p.field2 : 'rgba(255,255,255,.08)'; c.beginPath(); c.moveTo(600, 760); c.lineTo(-400 + k * 260, 1300); c.lineTo(-270 + k * 260, 1300); c.closePath(); c.fill(); }
        // barraca valenciana
        rect(c, 400, 720, 300, 150, p.wall); poly(c, [[380, 724], [550, 520], [720, 724]], p.roof); rect(c, 520, 770, 60, 100, '#3b6ea5');
        circ(c, 470, 780, 18, '#3b6ea5'); circ(c, 630, 780, 18, '#3b6ea5'); rect(c, 543, 506, 14, 30, p.wall);
        palm(c, 880, 880, 380, 40, '#6b4529', '#2e5d3b');
        // naranjos delante
        for (var t = 0; t < 4; t++) { var tx = 120 + t * 300, ty = 1180; rect(c, tx - 8, ty - 40, 16, 60, '#5b3b23'); circ(c, tx, ty - 100, 90, '#2f5b2e'); for (var o = 0; o < 9; o++) circ(c, tx - 70 + R() * 140, ty - 170 + R() * 130, 13, '#f39c33'); }
      } },
    { id: 'mallorca', name: 'MALLORCA', sub: 'ILLES BALEARS', p: { paper: '#f2f1ec', ink: '#1d3557', sky1: '#bfe0ee', sky2: '#f3f8f6', sun: '#f6c453', cliff: '#c99a6b', cliff2: '#9c7046', sea1: '#2a9d8f', sea2: '#1f6f8b' },
      scene: function (c, p, R) {
        sun(c, 340, 300, 100, p.sun);
        poly(c, [[560, 1300], [640, 760], [760, 640], [900, 600], [1040, 640], [1140, 700], [1140, 1300]], p.cliff);
        poly(c, [[700, 1300], [760, 900], [860, 760], [1000, 720], [1140, 760], [1140, 1300]], p.cliff2);
        lighthouse(c, 940, 618, 330, '#ffffff', '#c0392b', '#ffe9a8');
        sea(c, 780, 1300, p.sea1, p.sea2, 'rgba(255,255,255,.45)', R);
        boat(c, 320, 960, 1, '#fff', '#fff', '#f0eadb');
      } },
    { id: 'ibiza', name: 'EIVISSA', sub: 'ES VEDRÀ AL ATARDECER', p: { paper: '#2b1d3a', ink: '#ffd7a8', sky1: '#ff7a59', sky2: '#ffd27f', sun: '#fff1c1', rock: '#4a2c4f', rock2: '#5e3a5f', sea1: '#e8875e', sea2: '#6b3a5c' },
      scene: function (c, p, R) {
        rect(c, 0, 0, 1200, 900, vgrad(c, 60, 860, '#5b2a59', p.sky1)); rect(c, 0, 600, 1200, 300, vgrad(c, 600, 900, 'rgba(255,122,89,0)', p.sky2));
        sun(c, 600, 760, 210, p.sun, '#ffb77a', 6);
        poly(c, [[560, 900], [640, 640], [700, 520], [760, 560], [830, 700], [930, 900]], p.rock);   // Es Vedrà
        poly(c, [[860, 900], [930, 800], [1000, 900]], p.rock2);
        poly(c, [[60, 900], [60, 760], [200, 800], [330, 900]], p.rock2);
        sea(c, 880, 1300, p.sea1, p.sea2, 'rgba(255,230,190,.5)', R);
      } },
    { id: 'granada', name: 'GRANADA', sub: 'LA ALHAMBRA · SIERRA NEVADA', p: { paper: '#f4ede2', ink: '#7a2f23', sky1: '#9ec3dd', sky2: '#f1ead9', snow: '#ffffff', mount: '#8fa3b8', hill: '#7e8a4a', wall: '#c8673f', wall2: '#a9512f', cyp: '#2d4a2a' },
      scene: function (c, p, R) {
        ridge(c, 700, [[60, 560], [200, 420], [330, 470], [470, 330], [620, 420], [780, 300], [940, 410], [1080, 360], [1140, 420]], p.mount);
        [[200, 420], [470, 330], [780, 300], [1080, 360]].forEach(function (k) { poly(c, [[k[0] - 60, k[1] + 50], [k[0], k[1]], [k[0] + 60, k[1] + 50], [k[0] + 20, k[1] + 40], [k[0] - 20, k[1] + 55]], p.snow); });
        ridge(c, 1000, [[60, 840], [300, 760], [600, 720], [900, 760], [1140, 820]], p.hill);
        rect(c, 280, 640, 640, 110, p.wall);
        [[260, 120], [420, 160], [600, 140], [780, 175], [900, 120]].forEach(function (t) { rect(c, t[0], 750 - t[1], 70, t[1], p.wall2); for (var k = 0; k < 3; k++) rect(c, t[0] + k * 26, 740 - t[1], 18, 12, p.wall2); });
        for (var k = 0; k < 9; k++) rect(c, 300 + k * 70, 628, 30, 14, p.wall);
        for (var i = 0; i < 9; i++) cypress(c, 90 + i * 130 + (i % 2) * 30, 1300, 300 + (i % 3) * 90, p.cyp);
      } },
    { id: 'sevilla', name: 'SEVILLA', sub: 'ANDALUCÍA', p: { paper: '#f7ecd9', ink: '#a8331f', sky1: '#f0a35e', sky2: '#fbe3bd', sun: '#fff1cf', tower: '#d58a52', tower2: '#b56c3b', tree: '#2f5b2e', fruit: '#f28c28' },
      scene: function (c, p, R) {
        sun(c, 600, 560, 260, p.sun);
        var x = 600, b = 1100;   // torre tipo Giralda (silueta genérica)
        rect(c, x - 80, b - 560, 160, 560, p.tower);
        for (var k = 0; k < 6; k++) rect(c, x - 22, b - 520 + k * 80, 44, 40, p.tower2);
        rect(c, x - 64, b - 700, 128, 140, p.tower2); rect(c, x - 46, b - 800, 92, 100, p.tower); rect(c, x - 30, b - 870, 60, 70, p.tower2);
        poly(c, [[x - 26, b - 870], [x + 26, b - 870], [x, b - 950]], p.tower); rect(c, x - 3, b - 1000, 6, 60, p.tower2);
        rect(c, 0, 1080, 1200, 220, '#e8cfa3');
        for (var t = 0; t < 4; t++) { var tx = 150 + t * 300; rect(c, tx - 10, 1140, 20, 120, '#5b3b23'); circ(c, tx, 1070, 110, p.tree); for (var o = 0; o < 10; o++) circ(c, tx - 85 + R() * 170, 1000 + R() * 140, 13, p.fruit); }
      } },
    { id: 'donostia', name: 'DONOSTIA', sub: 'SAN SEBASTIÁN · LA CONCHA', p: { paper: '#eef1ee', ink: '#1f4e5f', sky1: '#a7cbd9', sky2: '#eef4f1', hill: '#4f7a54', hill2: '#3b6142', sand: '#efdcb4', sea1: '#3a8fb0', sea2: '#1f5f7a' },
      scene: function (c, p, R) {
        rect(c, 0, 640, 1200, 660, vgrad(c, 640, 1300, p.sea1, p.sea2));
        ridge(c, 760, [[60, 560], [180, 470], [300, 520], [420, 700]], p.hill, 60, 460);   // Igueldo
        ridge(c, 760, [[760, 700], [900, 540], [1040, 490], [1140, 530]], p.hill2, 720, 1140);   // Urgull
        poly(c, [[500, 720], [560, 630], [640, 615], [710, 720]], p.hill);   // isla de Santa Clara
        c.fillStyle = 'rgba(255,255,255,.45)'; for (var w = 0; w < 4; w++) { c.fillRect(160 + w * 40, 1010 + w * 34, 880 - w * 80, 4); }
        c.fillStyle = p.sand; c.beginPath(); c.moveTo(60, 1300); c.lineTo(60, 1190); c.quadraticCurveTo(600, 1060, 1140, 1190); c.lineTo(1140, 1300); c.closePath(); c.fill();
        c.fillStyle = '#d9c7a0'; c.beginPath(); c.moveTo(60, 1300); c.lineTo(60, 1250); c.quadraticCurveTo(600, 1140, 1140, 1250); c.lineTo(1140, 1300); c.closePath(); c.fill();
        // la barandilla del paseo
        c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.moveTo(60, 1236); c.quadraticCurveTo(600, 1124, 1140, 1236); c.stroke();
        for (var b = 0; b <= 40; b++) { var t = b / 40, q = qpt(60, 1236, 600, 1124, 1140, 1236, t); c.fillStyle = '#ffffff'; c.fillRect(q[0] - 2, q[1], 4, 26); }
        boat(c, 600, 820, 0.7, '#fff', '#fff');
      } },
    { id: 'santorini', name: 'SANTORINI', sub: 'ISLAS CÍCLADAS · GRECIA', p: { paper: '#f3f6f8', ink: '#1f4f8a', sky1: '#9fd0ee', sky2: '#eaf6fb', sun: '#ffd166', white: '#ffffff', blue: '#2d6cdf', sea1: '#2f80c3', sea2: '#1d4f8a', rock: '#c9a27a' },
      scene: function (c, p, R) {
        sun(c, 950, 280, 90, p.sun);
        sea(c, 560, 1300, p.sea1, p.sea2, 'rgba(255,255,255,.4)', R);
        poly(c, [[60, 1300], [60, 640], [500, 700], [720, 880], [820, 1300]], p.rock);
        var H = [[80, 640, 160, 120], [250, 660, 140, 110], [100, 760, 180, 130], [300, 780, 160, 120], [470, 790, 150, 110], [160, 900, 200, 140], [380, 920, 170, 130], [560, 940, 140, 110], [80, 1040, 220, 150], [320, 1060, 200, 140], [540, 1080, 170, 130]];
        H.forEach(function (h, i) { rect(c, h[0], h[1], h[2], h[3], p.white); rect(c, h[0] + h[2] * 0.4, h[1] + h[3] * 0.45, h[2] * 0.18, h[3] * 0.55, i % 3 ? p.blue : '#e2a33a'); rect(c, h[0], h[1] + h[3] - 6, h[2], 6, 'rgba(0,0,0,.08)'); });
        [[330, 660], [210, 900], [460, 1060]].forEach(function (d) { rect(c, d[0] - 50, d[1] - 10, 100, 40, p.white); c.beginPath(); c.arc(d[0], d[1] - 10, 52, Math.PI, 0); c.fillStyle = p.blue; c.fill(); rect(c, d[0] - 4, d[1] - 92, 8, 30, p.white); });
      } },
    { id: 'paris', name: 'PARÍS', sub: 'FRANCIA', p: { paper: '#f4ede4', ink: '#2c3e50', sky1: '#f7a9a8', sky2: '#fde5d4', sun: '#fff3e0', iron: '#3d4b5c', river: '#7fa7c2', bank: '#c7b39a' },
      scene: function (c, p, R) {
        sun(c, 600, 560, 230, p.sun);
        var x = 600, b = 1160, h = 900, I = p.iron;   // silueta de la torre
        c.fillStyle = I; c.beginPath();
        c.moveTo(x - 300, b); c.quadraticCurveTo(x - 150, b - 300, x - 40, b - h * 0.62); c.lineTo(x - 14, b - h * 0.95); c.lineTo(x, b - h);
        c.lineTo(x + 14, b - h * 0.95); c.lineTo(x + 40, b - h * 0.62); c.quadraticCurveTo(x + 150, b - 300, x + 300, b);
        c.lineTo(x + 210, b); c.quadraticCurveTo(x, b - 300, x - 210, b); c.closePath(); c.fill();
        rect(c, x - 175, b - 330, 350, 26, I); rect(c, x - 92, b - h * 0.42, 184, 20, I); rect(c, x - 44, b - h * 0.7, 88, 14, I);
        rect(c, 0, 1160, 1200, 140, p.bank); rect(c, 0, 1190, 1200, 110, p.river);
        c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; for (var k = 0; k < 8; k++) { var yy = 1210 + k * 12, xx = R() * 1100; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 80, yy); c.stroke(); }
      } },
    { id: 'kioto', name: 'KIOTO', sub: 'JAPÓN', p: { paper: '#f6efe6', ink: '#a8322d', sky1: '#f9d3c4', sky2: '#fbefe6', sun: '#d64933', mount: '#5e7690', snow: '#ffffff', pagoda: '#2e2a2a', blossom: '#f2a7b5' },
      scene: function (c, p, R) {
        sun(c, 380, 420, 150, p.sun);
        poly(c, [[60, 1000], [380, 600], [520, 470], [600, 440], [680, 470], [820, 600], [1140, 1000]], p.mount);   // monte genérico
        poly(c, [[520, 470], [600, 440], [680, 470], [650, 520], [620, 495], [590, 530], [560, 500]], p.snow);
        var x = 860, b = 1240;
        for (var k = 0; k < 5; k++) { var w = 300 - k * 46, yy = b - 70 - k * 150; rect(c, x - w * 0.32, yy, w * 0.64, 110, p.pagoda); poly(c, [[x - w / 2 - 30, yy + 10], [x + w / 2 + 30, yy + 10], [x + w * 0.3, yy - 30], [x - w * 0.3, yy - 30]], p.pagoda); }
        rect(c, x - 4, b - 900, 8, 130, p.pagoda);
        for (var i = 0; i < 160; i++) { var a = R() * Math.PI * 2, d = Math.sqrt(R()) * 300; circ(c, 180 + Math.cos(a) * d * 1.2, 1130 + Math.sin(a) * d * 0.6, 8 + R() * 10, R() < 0.5 ? p.blossom : '#f7c7d1'); }
        c.strokeStyle = '#4b3a32'; c.lineWidth = 18; c.beginPath(); c.moveTo(150, 1300); c.quadraticCurveTo(170, 1180, 250, 1120); c.stroke();
      } },
  ];

  /* ── COCHES (genéricos, sin marca) ── */
  function wheel(c, x, y, r, rim, wire) {
    circ(c, x, y, r, '#1c1c1c'); circ(c, x, y, r * 0.72, rim === 'white' ? '#f2f2f2' : '#2a2a2a');
    circ(c, x, y, r * 0.55, wire ? '#c9ccd1' : '#d8dbe0'); circ(c, x, y, r * 0.2, '#8a8f96');
    if (wire) { c.strokeStyle = '#8a8f96'; c.lineWidth = 2; for (var k = 0; k < 16; k++) { var a = k / 16 * Math.PI * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55); c.stroke(); } }
  }
  function car(c, type, x, y, s, col, col2) {
    c.save(); c.translate(x, y); c.scale(s, s);
    var chrome = '#e3e6ea';
    if (type === 'descapotable') {
      c.fillStyle = col; c.beginPath();
      c.moveTo(-420, -40); c.lineTo(-440, -150); c.lineTo(-360, -118); c.lineTo(-150, -112); c.quadraticCurveTo(-60, -100, 20, -118);
      c.lineTo(260, -112); c.quadraticCurveTo(400, -108, 420, -60); c.lineTo(425, -30); c.lineTo(330, -30);
      c.arc(255, -30, 76, 0, Math.PI, true); c.lineTo(-180, -30); c.arc(-260, -30, 78, 0, Math.PI, true); c.closePath(); c.fill();
      rect(c, -420, -84, 820, 10, chrome); rect(c, 400, -50, 34, 22, chrome); rect(c, -440, -50, 30, 22, chrome);
      c.strokeStyle = chrome; c.lineWidth = 9; c.beginPath(); c.moveTo(20, -118); c.lineTo(-40, -205); c.lineTo(-110, -205); c.stroke();
      c.fillStyle = 'rgba(200,230,245,.55)'; poly(c, [[16, -120], [-40, -200], [-104, -200], [-60, -120]], 'rgba(200,230,245,.5)');
      rrect(c, -270, -170, 70, 60, 18, col2); rrect(c, -170, -165, 60, 54, 16, col2);
      circ(c, 408, -88, 14, '#fff6c8');
      wheel(c, 255, -30, 62, 'white'); wheel(c, -260, -30, 62, 'white');
    } else if (type === 'furgoneta') {
      rrect(c, -390, -330, 780, 300, 80, col2); c.save(); c.beginPath(); c.rect(-400, -175, 800, 160); c.clip(); rrect(c, -390, -330, 780, 300, 80, col); c.restore();
      for (var k = 0; k < 4; k++) rrect(c, -300 + k * 150, -300, 120, 90, 18, 'rgba(190,220,235,.85)');
      rrect(c, 290, -300, 80, 100, 22, 'rgba(190,220,235,.85)');
      rect(c, -400, -40, 800, 14, chrome); circ(c, 372, -110, 16, '#fff6c8');
      rrect(c, -330, -372, 640, 34, 17, '#f4d35e'); rect(c, -330, -360, 640, 6, '#e07a5f');
      rect(c, -200, -340, 10, 14, '#555'); rect(c, 190, -340, 10, 14, '#555');
      wheel(c, 250, -30, 60); wheel(c, -250, -30, 60);
    } else if (type === 'rally') {
      c.fillStyle = col; c.beginPath();
      c.moveTo(-340, -40); c.lineTo(-350, -150); c.quadraticCurveTo(-330, -200, -230, -210); c.lineTo(-120, -300); c.lineTo(120, -300); c.lineTo(220, -190);
      c.quadraticCurveTo(330, -180, 350, -130); c.lineTo(355, -40); c.lineTo(290, -40); c.arc(220, -40, 70, 0, Math.PI, true); c.lineTo(-150, -40); c.arc(-220, -40, 70, 0, Math.PI, true); c.closePath(); c.fill();
      poly(c, [[-210, -205], [-112, -288], [-10, -288], [-10, -205]], 'rgba(190,220,235,.85)'); poly(c, [[10, -205], [10, -288], [112, -288], [196, -200]], 'rgba(190,220,235,.85)');
      rect(c, -350, -120, 705, 26, col2); rect(c, -350, -86, 705, 10, col2);
      circ(c, -40, -150, 46, '#fff'); c.fillStyle = '#1c1c1c'; c.font = '700 54px Montserrat, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('7', -40, -148);
      [-60, 0, 60].forEach(function (dx) { circ(c, dx, -322, 18, '#fff6c8'); rect(c, dx - 18, -312, 36, 10, '#222'); });
      circ(c, 340, -110, 14, '#fff6c8'); rect(c, -360, -50, 60, 12, '#222'); rect(c, 300, -50, 60, 12, '#222');
      wheel(c, 220, -40, 58); wheel(c, -220, -40, 58);
    } else {   // gran turismo
      c.fillStyle = col; c.beginPath();
      c.moveTo(-430, -50); c.quadraticCurveTo(-440, -120, -380, -130); c.lineTo(-210, -140); c.quadraticCurveTo(-150, -230, -40, -232); c.quadraticCurveTo(40, -230, 90, -150);
      c.lineTo(330, -130); c.quadraticCurveTo(440, -120, 450, -60); c.lineTo(450, -40); c.lineTo(360, -40); c.arc(290, -40, 66, 0, Math.PI, true); c.lineTo(-220, -40); c.arc(-290, -40, 66, 0, Math.PI, true); c.closePath(); c.fill();
      poly(c, [[-190, -142], [-130, -215], [-50, -218], [-50, -142]], 'rgba(190,220,235,.85)'); poly(c, [[-30, -142], [-30, -218], [30, -214], [74, -150]], 'rgba(190,220,235,.85)');
      rect(c, -440, -95, 890, 8, col2); circ(c, 430, -95, 14, '#fff6c8'); rect(c, 200, -132, 90, 6, chrome);
      wheel(c, 290, -40, 56, null, true); wheel(c, -290, -40, 56, null, true);
    }
    c.restore();
  }
  function cochePoster(def) {
    return function (c, R) {
      var p = def.p;
      posterFrame(c, p, def.name, def.sub, function (c) {
        rect(c, 0, 0, 1200, 1300, vgrad(c, 60, 900, p.sky1, p.sky2));
        sun(c, 600, 640, 330, p.sun, p.sky2, 6);
        if (def.bg === 'desierto') { poly(c, [[60, 900], [60, 700], [200, 700], [230, 640], [330, 640], [360, 900]], p.land2); poly(c, [[820, 900], [860, 620], [980, 620], [1000, 680], [1100, 680], [1140, 900]], p.land2); }
        else if (def.bg === 'montana') ridge(c, 900, [[60, 760], [260, 560], [420, 680], [620, 520], [820, 690], [1000, 560], [1140, 700]], p.land2);
        else { palm(c, 160, 960, 460, 50, '#3b2a1c', p.land2); palm(c, 1060, 960, 520, -60, '#3b2a1c', p.land2); }
        rect(c, 0, 900, 1200, 400, p.land);
        rect(c, 0, 1010, 1200, 150, p.road);
        for (var k = 0; k < 7; k++) rect(c, 70 + k * 180, 1080, 90, 10, p.stripe);
        car(c, def.car, 600, 1050, 1.08, p.car, p.car2);
      });
    };
  }
  var CARS = [
    { id: 'coche-descapotable', car: 'descapotable', bg: 'palmeras', name: 'ROAD TRIP', sub: 'VERANO DEL 59 · COSTA AZUL', p: { paper: '#f4ead8', ink: '#c43d2f', sky1: '#f6a35c', sky2: '#fde3b8', sun: '#ffe9b0', land: '#e7c99a', land2: '#2f4f3a', road: '#3a3a3a', stripe: '#f4ead8', car: '#4fb3b0', car2: '#f4ead8' } },
    { id: 'coche-descapotable-rosa', car: 'descapotable', bg: 'desierto', name: 'RUTA DEL SOL', sub: 'KILÓMETROS Y RADIO A TODO VOLUMEN', p: { paper: '#fbefe7', ink: '#3b2a4a', sky1: '#ff9a8b', sky2: '#ffe0c7', sun: '#fff1d6', land: '#e9b98a', land2: '#c7724c', road: '#4a3f48', stripe: '#fbefe7', car: '#f28aa6', car2: '#fff6ee' } },
    { id: 'coche-furgoneta', car: 'furgoneta', bg: 'palmeras', name: 'SURF TRIP', sub: 'OLAS, ARENA Y CARRETERA', p: { paper: '#eef4f1', ink: '#1f5f7a', sky1: '#7cc6d6', sky2: '#e8f6f3', sun: '#ffd27a', land: '#efd9a7', land2: '#2e6b4f', road: '#3d4246', stripe: '#eef4f1', car: '#e9724c', car2: '#fbf4e6' } },
    { id: 'coche-furgoneta-verde', car: 'furgoneta', bg: 'montana', name: 'CAMPER LIFE', sub: 'CASA ES DONDE APARCAS', p: { paper: '#f2efe4', ink: '#2f4a3a', sky1: '#a8c8d8', sky2: '#f0efe2', sun: '#f4c26b', land: '#9fae7a', land2: '#5e7c5a', road: '#3c3f3a', stripe: '#f2efe4', car: '#6c9a7e', car2: '#f5f0e2' } },
    { id: 'coche-rally', car: 'rally', bg: 'montana', name: 'RALLY 1974', sub: 'TRAMO DE MONTAÑA · CRONO EN MARCHA', p: { paper: '#f3eee6', ink: '#1d3557', sky1: '#f1b45b', sky2: '#fbe6c0', sun: '#fff0cc', land: '#c9a36a', land2: '#8a6a43', road: '#5a4a3a', stripe: '#f3eee6', car: '#f4f1ea', car2: '#1d3557' } },
    { id: 'coche-rally-rojo', car: 'rally', bg: 'desierto', name: 'RALLY RAID', sub: 'POLVO, SOL Y CARRETERA', p: { paper: '#f7ecdf', ink: '#b5331f', sky1: '#e9875c', sky2: '#fbdcb6', sun: '#fff2d6', land: '#e0b47e', land2: '#b8673e', road: '#6a4c35', stripe: '#f7ecdf', car: '#c8382f', car2: '#f7ecdf' } },
    { id: 'coche-gt', car: 'gt', bg: 'montana', name: 'GRAN TURISMO', sub: 'CURVAS DE MONTAÑA · 1965', p: { paper: '#eef0ee', ink: '#1f4d3a', sky1: '#9fc4d8', sky2: '#eef3ef', sun: '#f6d48a', land: '#a8b98a', land2: '#5b7a62', road: '#3a3d3f', stripe: '#eef0ee', car: '#1f6b4f', car2: '#e9e4d6' } },
    { id: 'coche-gt-amarillo', car: 'gt', bg: 'palmeras', name: 'RIVIERA', sub: 'CARRETERA DE LA COSTA · 1963', p: { paper: '#f7f1df', ink: '#2b4d72', sky1: '#8fc2dc', sky2: '#f5f0dc', sun: '#ffe6a3', land: '#efd8a6', land2: '#2f5a43', road: '#3b3e42', stripe: '#f7f1df', car: '#f2c230', car2: '#2b4d72' } },
  ];

  /* ── TEMPORADA: Navidad y San Valentín ── */
  function heart(c, x, y, s, fill) { c.beginPath(); c.moveTo(x, y + s * 0.95); c.bezierCurveTo(x - s * 1.25, y + s * 0.05, x - s * 1.05, y - s, x, y - s * 0.42); c.bezierCurveTo(x + s * 1.05, y - s, x + s * 1.25, y + s * 0.05, x, y + s * 0.95); c.closePath(); c.fillStyle = fill; c.fill(); }
  function tree(c, x, y, s, a, b, star) {
    for (var k = 0; k < 3; k++) poly(c, [[x - (110 - k * 22) * s, y - k * 70 * s], [x + (110 - k * 22) * s, y - k * 70 * s], [x, y - (k * 70 + 130) * s]], k % 2 ? b : a);
    rect(c, x - 14 * s, y, 28 * s, 30 * s, '#6b4a2f');
    if (star) { c.save(); c.translate(x, y - 278 * s); c.fillStyle = star; c.beginPath(); for (var i = 0; i < 10; i++) { var r = i % 2 ? 9 * s : 22 * s, a2 = i / 10 * Math.PI * 2 - Math.PI / 2; c.lineTo(Math.cos(a2) * r, Math.sin(a2) * r); } c.closePath(); c.fill(); c.restore(); }
  }
  function textBlock(c, big, small, color, y, font) {
    c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    var fam = font === 'script' ? '"Great Vibes", cursive' : '"Playfair Display", Georgia, serif', w = font === 'script' ? 400 : 'italic 500';
    fitFont(c, big, fam, w, font === 'script' ? 190 : 130, 1000); c.fillText(big, 600, y);
    if (small) { c.font = '600 32px Montserrat, Inter, sans-serif'; spaced(c, small, 600, y + 90, 10); }
  }
  var SEASON = [
    { id: 'navidad-arboles', cat: 'temporada', t: 'Bosque de Navidad', te: 'Christmas Forest', d: 'Un bosque de abetos de colores con su estrella, en estilo nórdico y sencillo. Para colgar en diciembre y cambiar en enero: con el imán se cambia en un segundo.', de: 'A forest of coloured fir trees with their stars, in a simple Nordic style. Hang it in December and swap it in January: with the magnet it takes a second.',
      draw: function (c, R) {
        rect(c, 0, 0, 1200, 1600, '#f3ede1');
        var cols = [['#2f5d46', '#3f7a5b'], ['#b8433a', '#cf5e4f'], ['#d9a441', '#e7bd62'], ['#24465e', '#33617f']];
        for (var r = 0; r < 3; r++) for (var k = 0; k < 4; k++) { var cc = cols[(r + k) % 4]; tree(c, 200 + k * 266 + (r % 2) * 40, 470 + r * 330, 0.95, cc[0], cc[1], '#e7bd62'); }
        for (var i = 0; i < 70; i++) circ(c, R() * 1200, R() * 1200, 3 + R() * 4, '#d9cfbf');
        textBlock(c, 'Feliz Navidad', 'Y PRÓSPERO AÑO NUEVO', '#2f5d46', 1400);
      } },
    { id: 'navidad-bolas', cat: 'temporada', t: 'Bolas de Navidad', te: 'Christmas Baubles', d: 'Tres bolas de Navidad colgando de sus cintas, con brillos dorados, sobre un verde abeto profundo. Elegante y festivo a la vez.', de: 'Three Christmas baubles hanging from their ribbons, with golden highlights, on a deep fir green. Elegant and festive at once.',
      draw: function (c, R) {
        rect(c, 0, 0, 1200, 1600, '#1f3d31');
        for (var i = 0; i < 120; i++) circ(c, R() * 1200, R() * 1600, 1.5 + R() * 3, 'rgba(255,240,200,' + (0.2 + R() * 0.5).toFixed(2) + ')');
        [[330, 520, 150, '#c8382f'], [620, 700, 175, '#d9a441'], [890, 480, 135, '#2d6c8f']].forEach(function (b) {
          c.strokeStyle = '#e7d5a8'; c.lineWidth = 4; c.beginPath(); c.moveTo(b[0], 0); c.lineTo(b[0], b[1] - b[2] - 30); c.stroke();
          rect(c, b[0] - 26, b[1] - b[2] - 34, 52, 40, '#d9b56b');
          var g = c.createRadialGradient(b[0] - b[2] * 0.35, b[1] - b[2] * 0.35, b[2] * 0.1, b[0], b[1], b[2]); g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, b[3]); g.addColorStop(1, shadeHex(b[3], 0.55));
          circ(c, b[0], b[1], b[2], g);
          c.strokeStyle = 'rgba(255,240,200,.75)'; c.lineWidth = 5; c.beginPath(); c.ellipse(b[0], b[1], b[2] * 0.98, b[2] * 0.22, 0, 0, Math.PI * 2); c.stroke();
        });
        textBlock(c, 'Feliz Navidad', 'DICIEMBRE', '#e7d5a8', 1300);
      } },
    { id: 'navidad-nieve', cat: 'temporada', t: 'Noche de nieve', te: 'Snowy Night', d: 'Una cabaña con la ventana encendida en una colina nevada bajo una noche estrellada. Calor de hogar para las fiestas.', de: 'A cabin with a lit window on a snowy hill under a starry night. Warmth of home for the holidays.',
      draw: function (c, R) {
        rect(c, 0, 0, 1200, 1600, vgrad(c, 0, 1100, '#14213d', '#33507a'));
        for (var i = 0; i < 200; i++) circ(c, R() * 1200, R() * 1000, 1 + R() * 2.5, 'rgba(255,255,255,' + (0.4 + R() * 0.6).toFixed(2) + ')');
        circ(c, 900, 260, 70, '#f4f1de'); circ(c, 930, 245, 66, '#1c2c4d');
        c.fillStyle = '#e9eef5'; c.beginPath(); c.moveTo(0, 1000); c.quadraticCurveTo(400, 780, 1200, 960); c.lineTo(1200, 1600); c.lineTo(0, 1600); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, 1120); c.quadraticCurveTo(700, 960, 1200, 1100); c.lineTo(1200, 1600); c.lineTo(0, 1600); c.fill();
        rect(c, 470, 820, 220, 150, '#7a3e2a'); poly(c, [[440, 830], [580, 700], [720, 830]], '#f4f6fa'); rect(c, 520, 860, 50, 50, '#ffd27a'); rect(c, 610, 880, 46, 90, '#4a2518');
        c.fillStyle = 'rgba(255,210,122,.25)'; c.beginPath(); c.arc(545, 885, 90, 0, Math.PI * 2); c.fill();
        [[220, 990, 0.9], [330, 960, 0.7], [920, 980, 0.95], [1030, 1010, 0.75]].forEach(function (t) { tree(c, t[0], t[1], t[2], '#1f4a3a', '#2a6049'); poly(c, [[t[0] - 60 * t[2], t[1] - 60 * t[2]], [t[0] + 60 * t[2], t[1] - 60 * t[2]], [t[0], t[1] - 130 * t[2]]], 'rgba(255,255,255,.85)'); });
        for (var k = 0; k < 160; k++) circ(c, R() * 1200, R() * 1600, 2 + R() * 4, 'rgba(255,255,255,.85)');
        textBlock(c, 'Noche de paz', 'FELICES FIESTAS', '#1f3354', 1440);
      } },
    { id: 'sanvalentin-corazones', cat: 'temporada', t: 'Lluvia de corazones', te: 'Shower of Hearts', d: 'Corazones de colores en una cuadrícula alegre con un «te quiero» en el centro. Para San Valentín, un aniversario o porque sí.', de: "Colourful hearts in a cheerful grid with a 'te quiero' in the centre. For Valentine's Day, an anniversary or just because.",
      draw: function (c, R) {
        rect(c, 0, 0, 1200, 1600, '#fbeee8');
        var cols = ['#e63946', '#f4a3a8', '#c9184a', '#ff8fab', '#ffb4a2'];
        for (var r = 0; r < 8; r++) for (var k = 0; k < 6; k++) { if (r >= 3 && r <= 4) continue; heart(c, 140 + k * 184, 120 + r * 170, 52, cols[(r * 2 + k) % cols.length]); }
        textBlock(c, 'Te quiero', null, '#9d0208', 850, 'script');
      } },
    { id: 'sanvalentin-contigo', cat: 'temporada', t: 'Contigo', te: 'With You', d: 'Un gran corazón rojo y una palabra: contigo. Minimalista, romántico y perfecto para regalar a tu pareja.', de: "A big red heart and one word: contigo, 'with you'. Minimalist, romantic and perfect as a gift for your partner.",
      draw: function (c, R) {
        rect(c, 0, 0, 1200, 1600, '#f6efe6');
        heart(c, 600, 640, 330, '#d62839');
        heart(c, 600, 640, 300, '#e63946');
        textBlock(c, 'contigo', 'SIEMPRE', '#3a2a2a', 1340, 'script');
      } },
    { id: 'sanvalentin-dos', cat: 'temporada', t: 'Dos corazones', te: 'Two Hearts', d: 'Dos corazones que se cruzan, en rosa y burdeos, sobre fondo crema. Una forma sencilla de decir «tú y yo».', de: "Two overlapping hearts in pink and burgundy on a cream background. A simple way to say 'you and me'.",
      draw: function (c, R) {
        rect(c, 0, 0, 1200, 1600, '#f7efe7');
        c.globalAlpha = 0.92; heart(c, 500, 700, 250, '#f4a3a8'); c.globalAlpha = 0.85; heart(c, 720, 760, 250, '#8f1d2c'); c.globalAlpha = 1;
        textBlock(c, 'Tú y yo', null, '#8f1d2c', 1330);
      } },
  ];
  function shadeHex(hex, k) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')'; }

  /* ── catálogo ── */
  var LIST = [];
  V.forEach(function (v) {
    var cap = v.name.charAt(0) + v.name.slice(1).toLowerCase();
    LIST.push({ id: 'v-' + v.id, cat: 'viajes', own: true, t: 'Cartel de viaje · ' + cap, te: 'Travel poster · ' + cap, a: 'Estudio Momenturies', y: '2026',
      d: 'Un cartel de viaje al estilo de los años 30 y 50: colores planos, sol grande y el nombre del lugar en letras altas. ' + v.sub.charAt(0) + v.sub.slice(1).toLowerCase() + '. Para recordar un viaje o soñar con el siguiente.',
      de: 'A travel poster in the style of the 1930s and 50s: flat colours, a big sun and the name of the place in tall letters. To remember a trip or dream of the next one.', draw: viaje(v) });
  });
  CARS.forEach(function (k) {
    LIST.push({ id: k.id, cat: 'coches', own: true, t: k.name.charAt(0) + k.name.slice(1).toLowerCase(), te: k.name.charAt(0) + k.name.slice(1).toLowerCase(), a: 'Estudio Momenturies', y: '2026',
      d: 'Cartel retro de carretera: un coche clásico de líneas genéricas, sin marca, bajo un sol enorme. ' + k.sub.charAt(0) + k.sub.slice(1).toLowerCase() + '. Para garajes, despachos y amantes del motor.',
      de: 'Retro road poster: a classic car with generic lines, no brand, under a huge sun. For garages, studies and car lovers.', draw: cochePoster(k) });
  });
  SEASON.forEach(function (s) { LIST.push({ id: s.id, cat: s.cat, own: true, t: s.t, te: s.te, a: 'Estudio Momenturies', y: '2026', d: s.d, de: s.de, draw: s.draw }); });
  LIST.forEach(function (it) { it.max = 'XL'; it.lic = 'Diseño original de Momenturies'; });

  function render(it, W) {
    var H = Math.round(W * 4 / 3), cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d'); c.save(); c.scale(W / 1200, H / 1600); it.draw(c, rng(hash(it.id))); c.restore();
    grainLayer(c, W, H, 0.05);
    return cv;
  }
  function thumb(it) { if (!it._th) it._th = render(it, 600).toDataURL('image/jpeg', 0.86); return it._th; }
  function toFile(id) {
    var it = LIST.filter(function (x) { return x.id === id; })[0];
    return ready.then(function () {
      var cv = render(it, 3600);
      return new Promise(function (res, rej) { cv.toBlob(function (b) { b ? res(new File([b], id + '.jpg', { type: 'image/jpeg' })) : rej(new Error('canvas')); }, 'image/jpeg', 0.95); });
    });
  }
  window.MOMENTURIES_DISENOS2 = { list: LIST, ready: ready, thumb: thumb, toFile: toFile };
})();
