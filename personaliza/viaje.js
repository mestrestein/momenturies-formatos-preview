/* personaliza/viaje.js — «Vuestro cartel de viaje»: cartel retro de cualquier lugar del mundo con vuestro texto.
   Dos maneras (17-oct-2026, a petición de Marc):
   · Ilustrado: los destinos que tenemos dibujados con sus cosas típicas (el Montgó y el castillo de Dénia, Es Vedrà…).
   · Sencillo: cualquier sitio, con un paisaje genérico a elegir (costa, montaña, isla, ciudad, campo, desierto, lago, nieve).
   Se dibuja en un lienzo lógico de 1200 × 1600 escalado al tamaño pedido (3600 × 4800 = 30 × 40 cm a 300 ppp). */
(function () {
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
  var DESTINOS = [
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


  /* ── PAISAJES GENÉRICOS (para cualquier lugar) ── */
  function shadeHex2(hex, k) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return 'rgb(' + Math.round(r * k) + ',' + Math.round(g * k) + ',' + Math.round(b * k) + ')'; }
  function pines(c, x, y, n, h, fill, R) { for (var i = 0; i < n; i++) { var xx = x + i * 46 + R() * 20, hh = h * (0.7 + R() * 0.5); poly(c, [[xx - hh * 0.22, y], [xx + hh * 0.22, y], [xx, y - hh]], fill); } }
  var ESCENAS = {
    costa: { es: 'Costa', draw: function (c, p, R) {
      sun(c, 820, 470, 150, p.sun, p.sky2, 5);
      ridge(c, 820, [[60, 760], [240, 620], [420, 680], [520, 760]], p.land2, 60, 600);
      ridge(c, 840, [[700, 820], [900, 700], [1140, 740]], p.land, 640, 1140);
      sea(c, 820, 1300, p.sea1, p.sea2, 'rgba(255,255,255,.45)', R);
      boat(c, 640, 1000, 1.1, p.paper, '#fffaf0', shadeHex2(p.paper, 0.93));
      palm(c, 1060, 1280, 520, -60, '#4a3322', p.land2); palm(c, 150, 1300, 420, 50, '#4a3322', p.land2);
    } },
    montana: { es: 'Montaña', draw: function (c, p, R) {
      sun(c, 330, 380, 120, p.sun);
      ridge(c, 820, [[60, 640], [220, 460], [380, 560], [560, 330], [760, 520], [940, 400], [1140, 560]], p.mount);
      [[220, 460], [560, 330], [940, 400]].forEach(function (k) { poly(c, [[k[0] - 70, k[1] + 60], [k[0], k[1]], [k[0] + 70, k[1] + 60], [k[0] + 25, k[1] + 48], [k[0] - 25, k[1] + 64]], '#ffffff'); });
      ridge(c, 1000, [[60, 760], [300, 640], [560, 720], [800, 620], [1140, 720]], p.land2);
      rect(c, 0, 960, 1200, 340, p.land);
      pines(c, 70, 1000, 7, 220, p.land2, R); pines(c, 760, 1020, 8, 240, shadeHex2(p.land2, 0.8), R);
      pines(c, 300, 1300, 9, 300, shadeHex2(p.land2, 0.7), R);
    } },
    isla: { es: 'Isla', draw: function (c, p, R) {
      sun(c, 600, 640, 260, p.sun, p.sky2, 6);
      sea(c, 820, 1300, p.sea1, p.sea2, 'rgba(255,255,255,.45)', R);
      c.fillStyle = p.sand; c.beginPath(); c.ellipse(600, 860, 330, 60, 0, Math.PI, 0); c.fill();
      poly(c, [[420, 860], [520, 760], [620, 720], [700, 770], [790, 860]], p.land2);
      palm(c, 500, 830, 360, 60, '#4a3322', p.land2); palm(c, 690, 830, 300, -40, '#4a3322', shadeHex2(p.land2, 0.85));
      boat(c, 980, 1080, 0.7, p.paper, '#fff');
    } },
    ciudad: { es: 'Ciudad', draw: function (c, p, R) {
      sun(c, 600, 560, 230, p.sun);
      var x = 70; while (x < 1140) { var w = 70 + R() * 90, h = 220 + R() * 420, col = R() < 0.5 ? p.city1 : p.city2;
        rect(c, x, 1060 - h, w, h, col);
        for (var yy = 1060 - h + 24; yy < 1040; yy += 36) for (var xx = x + 12; xx < x + w - 16; xx += 24) if (R() < 0.55) rect(c, xx, yy, 10, 16, 'rgba(255,240,200,.55)');
        if (R() < 0.25) rect(c, x + w / 2 - 3, 1060 - h - 60, 6, 60, col);
        x += w + 6; }
      rect(c, 0, 1060, 1200, 240, p.sea2); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = 3;
      for (var k = 0; k < 14; k++) { var y2 = 1090 + k * 14, x2 = R() * 1100; c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 + 70, y2); c.stroke(); }
    } },
    campo: { es: 'Campo', draw: function (c, p, R) {
      sun(c, 880, 380, 130, p.sun);
      c.fillStyle = p.land2; c.beginPath(); c.moveTo(0, 820); c.quadraticCurveTo(350, 640, 760, 760); c.quadraticCurveTo(1000, 820, 1200, 720); c.lineTo(1200, 1300); c.lineTo(0, 1300); c.fill();
      c.fillStyle = p.land; c.beginPath(); c.moveTo(0, 960); c.quadraticCurveTo(500, 820, 1200, 940); c.lineTo(1200, 1300); c.lineTo(0, 1300); c.fill();
      for (var k = 0; k < 9; k++) { c.strokeStyle = 'rgba(0,0,0,.08)'; c.lineWidth = 10; c.beginPath(); c.moveTo(0, 1010 + k * 34); c.quadraticCurveTo(600, 900 + k * 40, 1200, 990 + k * 34); c.stroke(); }
      rect(c, 300, 780, 18, 90, '#4a3322'); circ(c, 309, 760, 70, shadeHex2(p.land2, 0.75));
      rect(c, 760, 720, 120, 80, p.paper); poly(c, [[748, 724], [820, 670], [892, 724]], p.sun);
    } },
    desierto: { es: 'Desierto', draw: function (c, p, R) {
      sun(c, 600, 600, 250, p.sun, p.sky2, 6);
      poly(c, [[60, 900], [60, 700], [200, 700], [230, 640], [330, 640], [360, 900]], p.land2);
      poly(c, [[820, 900], [860, 620], [980, 620], [1000, 680], [1100, 680], [1140, 900]], p.land2);
      c.fillStyle = p.land; c.beginPath(); c.moveTo(0, 940); c.quadraticCurveTo(300, 860, 600, 940); c.quadraticCurveTo(900, 1020, 1200, 900); c.lineTo(1200, 1300); c.lineTo(0, 1300); c.fill();
      c.fillStyle = shadeHex2(p.land, 0.9); c.beginPath(); c.moveTo(0, 1100); c.quadraticCurveTo(500, 980, 1200, 1120); c.lineTo(1200, 1300); c.lineTo(0, 1300); c.fill();
    } },
    lago: { es: 'Lago', draw: function (c, p, R) {
      sun(c, 820, 400, 110, p.sun);
      var M = [[60, 720], [240, 500], [420, 620], [620, 420], [820, 600], [1000, 480], [1140, 620]];
      ridge(c, 800, M, p.mount);
      rect(c, 0, 800, 1200, 500, vgrad(c, 800, 1300, p.sea1, p.sea2));
      c.globalAlpha = 0.3; poly(c, [[0, 800]].concat(M.map(function (q) { return [q[0], 1600 - q[1]]; })).concat([[1200, 800]]), p.mount); c.globalAlpha = 1;
      pines(c, 70, 820, 6, 200, p.land2, R); pines(c, 820, 820, 7, 220, p.land2, R);
      boat(c, 600, 1010, 0.6, p.paper, '#fff');
    } },
    nieve: { es: 'Nieve', draw: function (c, p, R) {
      for (var i = 0; i < 120; i++) circ(c, R() * 1200, R() * 900, 1.5 + R() * 2.5, 'rgba(255,255,255,.8)');
      ridge(c, 860, [[60, 620], [300, 380], [520, 540], [740, 340], [960, 520], [1140, 420]], '#e9eef5');
      ridge(c, 900, [[60, 760], [400, 600], [800, 700], [1140, 620]], '#ffffff');
      rect(c, 0, 880, 1200, 420, '#f4f7fb');
      pines(c, 80, 1000, 8, 230, p.land2, R); pines(c, 700, 1060, 9, 260, shadeHex2(p.land2, 0.8), R);
      rect(c, 480, 900, 200, 120, '#7a3e2a'); poly(c, [[452, 910], [580, 800], [708, 910]], '#ffffff'); rect(c, 530, 940, 44, 40, '#ffd27a');
    } },
  };
  var PALETAS = {
    atardecer: { es: 'Atardecer', paper: '#f4e9d6', ink: '#a23b2a', sky1: '#f4a261', sky2: '#fde4c3', sun: '#e76f51', sea1: '#2a6f97', sea2: '#1d4e6e', land: '#e9c46a', land2: '#5c6f3b', mount: '#8b7d9b', city1: '#5c4b6b', city2: '#8a6f8f', sand: '#efd7a6' },
    mediterraneo: { es: 'Mediterráneo', paper: '#eef3f2', ink: '#1f4e79', sky1: '#9fd3e6', sky2: '#eef7f5', sun: '#f6bd3a', sea1: '#2a9d8f', sea2: '#1f6f8b', land: '#e6cf9c', land2: '#3f7a5a', mount: '#7aa0b8', city1: '#2f5d7c', city2: '#5a87a6', sand: '#f1dfb3' },
    pastel: { es: 'Pastel', paper: '#fbf2ee', ink: '#6d4c6b', sky1: '#f7c6c7', sky2: '#fdeee8', sun: '#ffb4a2', sea1: '#9ccfd8', sea2: '#6fa8b6', land: '#f3d9b1', land2: '#8fb495', mount: '#c3b1d1', city1: '#b5a3c9', city2: '#e6b8c2', sand: '#f6e3c6' },
    bosque: { es: 'Bosque', paper: '#eef0e7', ink: '#2f4a3a', sky1: '#bcd4d1', sky2: '#f0f2e8', sun: '#e9b949', sea1: '#5d8a8a', sea2: '#3d6363', land: '#a9b77e', land2: '#3f6345', mount: '#7c8f8a', city1: '#3f5a4a', city2: '#6b836f', sand: '#e5d6a8' },
    noche: { es: 'Noche', paper: '#16213a', ink: '#f4d58d', sky1: '#1f2f56', sky2: '#4a5d8c', sun: '#f4e3b2', sea1: '#2b4570', sea2: '#16294a', land: '#3a4f6e', land2: '#22324e', mount: '#46597d', city1: '#2a3a5c', city2: '#3c4f75', sand: '#c9b98f' },
    retro: { es: 'Retro', paper: '#f2e8d5', ink: '#264653', sky1: '#e9c46a', sky2: '#f8ecd1', sun: '#e76f51', sea1: '#2a9d8f', sea2: '#264653', land: '#f4a261', land2: '#6a8d4e', mount: '#b5838d', city1: '#264653', city2: '#2a9d8f', sand: '#efd7a6' },
  };
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, ''); }
  var ALIAS = { denia: 'denia', xabia: 'javea', javea: 'javea', alicante: 'alicante', alacant: 'alicante', valencia: 'valencia', mallorca: 'mallorca', palma: 'mallorca', palmademallorca: 'mallorca',
    ibiza: 'ibiza', eivissa: 'ibiza', granada: 'granada', sevilla: 'sevilla', seville: 'sevilla', donostia: 'donostia', sansebastian: 'donostia', donostiasansebastian: 'donostia',
    santorini: 'santorini', thira: 'santorini', paris: 'paris', kioto: 'kioto', kyoto: 'kioto' };
  function destinoDe(nombre) { var k = ALIAS[norm(nombre)]; return k ? DESTINOS.filter(function (d) { return d.id === k; })[0] : null; }

  /* cartel: ilustración arriba y tres líneas de texto abajo (nombre grande, subtítulo y fecha/nombres) */
  function draw(ctx, W, H, o) {
    var dest = o.modo === 'ilustrado' ? destinoDe(o.lugar) : null;
    var p = PALETAS[o.paleta] || PALETAS.atardecer;
    if (dest) p = (o.paleta === 'original' || !PALETAS[o.paleta]) ? Object.assign({}, PALETAS.atardecer, dest.p) : Object.assign({}, dest.p, PALETAS[o.paleta]);
    var c = ctx; c.save(); c.scale(W / 1200, H / 1600);
    var R = rng(hash((o.lugar || '') + (o.escena || '')));
    rect(c, 0, 0, 1200, 1600, p.paper);
    c.save(); c.beginPath(); c.rect(60, 60, 1080, 1140); c.clip();
    rect(c, 0, 0, 1200, 1300, vgrad(c, 60, 900, p.sky1, p.sky2));
    if (dest) dest.scene(c, p, R); else (ESCENAS[o.escena] || ESCENAS.costa).draw(c, p, R);
    c.restore();
    c.fillStyle = p.ink; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    var name = (o.titulo || '').toUpperCase();
    if (name) { var sz = fitFont(c, name, '"Bebas Neue", Oswald, Impact, sans-serif', 400, 210, 1040, 10); spaced(c, name, 600, 1225 + sz * 0.8, 10); }
    c.font = '600 32px Montserrat, Inter, sans-serif';
    if (o.sub) spaced(c, o.sub.toUpperCase(), 600, 1488, 9);
    if (o.extra) { c.font = '500 28px Montserrat, Inter, sans-serif'; c.globalAlpha = 0.8; spaced(c, o.extra.toUpperCase(), 600, 1545, 8); c.globalAlpha = 1; }
    c.restore();
    grainLayer(ctx, W, H, 0.05);
  }
  window.MOM_VIAJE = { draw: draw, escenas: ESCENAS, paletas: PALETAS, destinos: DESTINOS, destinoDe: destinoDe };
})();
