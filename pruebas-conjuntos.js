/* pruebas-conjuntos.js · 13-nov-2026 · Conjuntos de PRUEBA para pedidos de prueba (vídeos, flujo de impresión).
   No salen en ninguna lista de la web: solo se añaden a MOMENTURIES_WALLS cuando la URL lleva ?pared=T01, T02…
   y solo ese. Se abre con cuadro.html?pared=T01. Va cargado DESPUÉS de paredes.js y ANTES de editor.js.
   Medidas en cm, origen arriba a la izquierda. Para añadir uno: nueva entrada en TESTS con [pieza, x, y]. */
(function(){
  var id = (new URLSearchParams(location.search).get('pared') || '').toUpperCase();
  if(!/^T\d{2}$/.test(id) || !window.MOMENTURIES_WALLS || !window.MOMENTURIES_FORMAT_SIZES) return;

  // pieza → [formato, talla] de la web
  var K = {
    C30: ['cuadrado', 'L'],  C15: ['cuadrado', 'M'],
    R24: ['retrato', 'M'],   // 18×24
    S:   ['clasico', 'S'],   // 10×15
    M:   ['clasico', 'M'],   // 21×29,7  (placa M de Futsides)
    L:   ['clasico', 'L'],   // 25,5×36
    XL:  ['clasico', 'XL']   // 30,5×43,1
  };
  var TESTS = {
    T01: { name: 'Prueba · Todo Futsides',          gap: 5, p: [['M',4.5,6.3],['C15',42.75,21],['L',72.75,0],['C30',0,41],['XL',35,41],['C30',70.5,41]] },
    T02: { name: 'Prueba · XL abajo',               gap: 5, p: [['M',0,6.3],['C30',26,6],['L',61,0],['C15',5.75,41],['XL',25.75,41],['C15',61.25,41]] },
    T03: { name: 'Prueba · Cruz XL',                gap: 8, p: [['C15',0,15],['C30',23,0],['C15',61,15],['S',4.75,38],['XL',22.75,38],['S',61.25,38]] },
    T04: { name: 'Prueba · Pirámide',               gap: 5, p: [['C15',3,9],['R24',32,0],['C15',65.75,9],['M',0,29],['C30',26,29],['L',61,29]] },
    T05: { name: 'Prueba · Diagonal',               gap: 6, p: [['C30',0,0],['R24',36,6],['C15',60,15],['M',0,36],['L',27,36],['C30',58.5,36]] },
    T06: { name: 'Prueba · Columnas, grandes arriba', gap: 5, p: [['C30',0,0],['M',35,0],['C30',61,0],['S',10,35],['C15',38,34.7],['S',71,35]] },
    T07: { name: 'Prueba · Columnas cruzadas',      gap: 5, p: [['S',10,0],['M',35,0],['S',71,0],['C30',0,20],['C15',38,34.7],['C30',61,20]] },
    T08: { name: 'Prueba · Cruz central',           gap: 5, p: [['M',0,7.15],['C30',26,7],['C15',62.5,0],['R24',61,20],['C30',84,7],['L',119,4]] },
    T09: { name: 'Prueba · Horizonte XL',           gap: 5, p: [['C15',0,28.1],['R24',20,19.1],['C30',43,13.1],['XL',78,0],['C30',113.5,13.1],['S',148.5,28.1]] }
  };
  var t = TESTS[id]; if(!t) return;
  if(window.MOMENTURIES_WALLS.some(function(w){ return w.id === id; })) return;

  var SZ = window.MOMENTURIES_FORMAT_SIZES, SI = window.MOMENTURIES_SIZE_INFO || {};
  var CODE = { cuadrado: 'C', clasico: 'K', retrato: 'R' };
  var pieces = [], counts = {}, price = 0, W = 0, H = 0;
  t.p.forEach(function(q){
    var f = K[q[0]][0], s = K[q[0]][1], d = SZ[f][s];
    var pc = { format: f, size: s, orient: 'v', x: q[1], y: q[2], w: d[0], h: d[1] };
    pieces.push(pc);
    counts[CODE[f] + s] = (counts[CODE[f] + s] || 0) + 1;
    price += (SI[f] && SI[f][s] ? SI[f][s].price : 0);
    W = Math.max(W, pc.x + pc.w); H = Math.max(H, pc.y + pc.h);
  });
  W = Math.round(W * 10) / 10; H = Math.round(H * 10) / 10;
  var cat = W <= 65 ? 's' : (W <= 115 ? 'm' : 'l');
  window.MOMENTURIES_WALLS.push({
    id: id, name: t.name, cat: cat,
    room: { s: 'Rincón, recibidor o sobre la cómoda', m: 'Sobre el sofá o la cama', l: 'Pared grande del salón' }[cat],
    note: 'Conjunto de prueba.', soldOut: false, n: pieces.length, width: W, height: H,
    counts: counts, gap: t.gap, price: Math.round(price * 100) / 100, pieces: pieces, best: false, test: true
  });
})();
