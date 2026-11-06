/* personaliza/cielo.js — «El cielo de vuestra noche»: las estrellas tal como estaban sobre un lugar en una fecha y hora.
   Cálculo: tiempo sidéreo local → altura/acimut de cada estrella (J2000; la precesión en unas décadas mueve el cielo
   menos de medio grado, invisible a este tamaño) → proyección estereográfica centrada en el cénit, norte arriba y
   este a la izquierda, como se ve el cielo tumbado mirando hacia arriba. La Luna, con su fase, por fórmulas de baja
   precisión (≈1°). La hora se da en hora local del lugar: la zona horaria sale de las coordenadas (tz-lookup). */
(function () {
  var D2R = Math.PI / 180, DATA = window.MOMENTURIES_CIELO;
  var THEMES = {
    medianoche: { name: 'Medianoche', bg: '#101c30', disk: '#101c30', ring: '#e9e2d0', star: '#ffffff', line: 'rgba(255,255,255,.42)', grid: 'rgba(255,255,255,.13)', text: '#f2ede3', soft: 'rgba(242,237,227,.7)', moonDark: '#26344c' },
    oro:        { name: 'Oro y negro', bg: '#0c0c0d', disk: '#0c0c0d', ring: '#d8bd7f', star: '#f7e9c6', line: 'rgba(216,189,127,.55)', grid: 'rgba(216,189,127,.16)', text: '#e3cb93', soft: 'rgba(227,203,147,.7)', moonDark: '#242018' },
    papel:      { name: 'Papel',       bg: '#f5f0e6', disk: '#15243b', ring: '#15243b', star: '#ffffff', line: 'rgba(255,255,255,.38)', grid: 'rgba(255,255,255,.12)', text: '#15243b', soft: 'rgba(21,36,59,.65)', moonDark: '#2a3a55' },
    rosa:       { name: 'Rosa',        bg: '#f5e6e1', disk: '#3c2940', ring: '#3c2940', star: '#fff3ec', line: 'rgba(255,236,226,.4)', grid: 'rgba(255,236,226,.12)', text: '#3c2940', soft: 'rgba(60,41,64,.65)', moonDark: '#55405a' },
    azul:       { name: 'Azul noche',  bg: '#e8edf2', disk: '#1b2f4f', ring: '#1b2f4f', star: '#ffffff', line: 'rgba(255,255,255,.4)', grid: 'rgba(255,255,255,.12)', text: '#1b2f4f', soft: 'rgba(27,47,79,.65)', moonDark: '#30466b' },
    /* 4-nov: discos de color planos */
    blanco:     { name: 'Blanco',      bg: '#ffffff', disk: '#ffffff', ring: '#1a1a1a', star: '#1a1a1a', line: 'rgba(0,0,0,.5)', grid: 'rgba(0,0,0,.1)', text: '#1a1a1a', soft: 'rgba(26,26,26,.6)', moonDark: '#d8d8d8' },
    pizarra:    { name: 'Pizarra',     bg: '#1c2a38', disk: '#1c2a38', ring: '#b9c7d4', star: '#ffffff', line: 'rgba(185,199,212,.45)', grid: 'rgba(185,199,212,.13)', text: '#e6edf3', soft: 'rgba(230,237,243,.65)', moonDark: '#2c3d4f' },
    menta:      { name: 'Menta',       bg: '#f7f3ec', disk: '#a3d8c6', ring: '#a3d8c6', star: '#1f3a35', line: 'rgba(31,58,53,.42)', grid: 'rgba(31,58,53,.1)', text: '#1f3a35', soft: 'rgba(31,58,53,.65)', moonDark: '#7fb9a6' },
    arena:      { name: 'Arena y agua', bg: '#94c3c4', disk: '#fdf1df', ring: '#fdf1df', star: '#5a4632', line: 'rgba(90,70,50,.38)', grid: 'rgba(90,70,50,.1)', text: '#fdf6ea', soft: 'rgba(253,246,234,.8)', moonDark: '#e5d3bb' },
    carbon:     { name: 'Carbón',      bg: '#2a2a2b', disk: '#2a2a2b', ring: '#8d8d8d', star: '#f4f4f4', line: 'rgba(255,255,255,.34)', grid: 'rgba(255,255,255,.08)', text: '#f0f0f0', soft: 'rgba(240,240,240,.65)', moonDark: '#3a3a3b' },
    grafito:    { name: 'Grafito',     bg: '#f4f4f2', disk: '#2f3336', ring: '#2f3336', star: '#ffffff', line: 'rgba(255,255,255,.36)', grid: 'rgba(255,255,255,.09)', text: '#2f3336', soft: 'rgba(47,51,54,.65)', moonDark: '#43484c' },
    carmin:     { name: 'Carmín',      bg: '#fbfaf8', disk: '#bf0a30', ring: '#bf0a30', star: '#fff4f4', line: 'rgba(255,240,240,.42)', grid: 'rgba(255,240,240,.1)', text: '#7f0720', soft: 'rgba(127,7,32,.65)', moonDark: '#8f0824' },
    ocre:       { name: 'Ocre',        bg: '#f2ead8', disk: '#b4661d', ring: '#b4661d', star: '#fff6e7', line: 'rgba(255,246,231,.42)', grid: 'rgba(255,246,231,.1)', text: '#6f3e10', soft: 'rgba(111,62,16,.68)', moonDark: '#8f5016' }
  };

  /* 4-nov: el cielo a sangre, con un paisaje abajo. Todo dibujado aquí, sin fotos: sirve a cualquier tamaño de impresión */
  var ESCENAS = {
    bosque:  { name: 'Bosque',  sky: ['#05201f', '#0d3a40', '#1f5a66'] },
    montana: { name: 'Montaña', sky: ['#14152a', '#22243f', '#33365b'] },
    cumbres: { name: 'Cumbres', sky: ['#070d1b', '#18223d', '#303c5b'] },
    ciudad:  { name: 'Ciudad',  sky: ['#04182f', '#0a2a4a', '#123a5c'] },
    mar:     { name: 'Mar',     sky: ['#14133f', '#2a2670', '#5b4a9a'] }
  };
  /* 6-nov: Montaña y Cumbres son fotos (Firefly), con el cielo ya fundido a transparente: las estrellas de la fecha se
     ven por encima de los picos. Solo se cargan en cielo.html; si no llegan, se dibuja la montaña de antes */
  var FOTOS = { montana: 'paisaje-montana.webp?v=1', cumbres: 'paisaje-montana-noche.webp?v=1' }, IMG = {};
  var FUNDE = { montana: .33, cumbres: .34 };   // altura (fracción de la foto) donde su cielo empieza a ser visible
  var BASE = ((document.currentScript && document.currentScript.src) || 'personaliza/cielo.js').replace(/cielo\.js(\?.*)?$/, '');
  var fotosReady = !/\/cielo(\.html)?$/.test(location.pathname) ? Promise.resolve() : Promise.all(Object.keys(FOTOS).map(function (k) {
    return new Promise(function (res) { var im = new Image(); im.onload = function () { IMG[k] = im; res(); }; im.onerror = function () { res(); }; im.src = BASE + FOTOS[k]; });
  }));
  var CLARO = 'rgba(255,255,255,';
  Object.keys(ESCENAS).forEach(function (k) {
    var E = ESCENAS[k]; E.escena = k; E.bg = E.sky[0]; E.disk = E.sky[2]; E.ring = 'rgba(0,0,0,0)'; E.star = '#ffffff'; E.line = CLARO + '.3)'; E.grid = CLARO + '.05)';
    E.text = '#ffffff'; E.soft = CLARO + '.72)'; E.moonDark = E.sky[1];
  });
  function azar(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* cresta irregular por subdivisión: lista de alturas de 0 a 1 */
  function cresta(n, rugoso, R) {
    var a = [R(), R()], amp = rugoso;
    for (var i = 0; i < n; i++) { var b = []; for (var j = 0; j < a.length - 1; j++) { b.push(a[j], (a[j] + a[j + 1]) / 2 + (R() - .5) * amp); } b.push(a[a.length - 1]); a = b; amp *= .55; }
    return a;
  }
  function pino(ctx, x, base, h, R) {
    var w = h * .34; ctx.beginPath(); ctx.moveTo(x, base - h);
    for (var i = 1; i <= 7; i++) { var t = i / 7, y = base - h + h * t, an = w * t * (.8 + R() * .3); ctx.lineTo(x + an, y); ctx.lineTo(x + an * .55, y - h * .01); }
    for (var k = 7; k >= 1; k--) { var t2 = k / 7, y2 = base - h + h * t2, an2 = w * t2 * (.8 + R() * .3); ctx.lineTo(x - an2 * .55, y2 - h * .01); ctx.lineTo(x - an2, y2); }
    ctx.closePath(); ctx.fill();
  }
  /* línea quebrada de A a B: lista de puntos con el trazo desplazado a un lado y a otro */
  function quiebro(A, B, veces, amp, R) {
    var a = [A, B];
    for (var i = 0; i < veces; i++) {
      var b = [a[0]];
      for (var j = 0; j < a.length - 1; j++) {
        var P = a[j], Q = a[j + 1], dx = Q[0] - P[0], dy = Q[1] - P[1], d = (R() - .5) * amp;
        b.push([(P[0] + Q[0]) / 2 - dy * d, (P[1] + Q[1]) / 2 + dx * d], Q);
      }
      a = b;
    }
    return a;
  }
  /* un pico: roca, casquete de nieve de borde dentado y la cara derecha en sombra (la luz viene de la izquierda) */
  function pico(ctx, W, H, base, cx, alto, ancho, R, c0, c1, nieve) {
    var S = [W * cx, base - H * alto], w = W * ancho, pie = base + H * .03, L = [S[0] - w, pie], D = [S[0] + w * 1.1, pie], h = pie - S[1], i;
    var izq = quiebro(L, S, 5, .36, R), der = quiebro(S, D, 5, .36, R), silueta = izq.concat(der.slice(1));
    var traza = function (l) { ctx.beginPath(); ctx.moveTo(l[0][0], l[0][1]); for (var k = 1; k < l.length; k++) ctx.lineTo(l[k][0], l[k][1]); ctx.closePath(); };
    traza(silueta); var g = ctx.createLinearGradient(0, S[1], 0, pie); g.addColorStop(0, c0); g.addColorStop(1, c1); ctx.fillStyle = g; ctx.fill();
    ctx.save(); traza(silueta); ctx.clip();
    /* nieve: de la cima a una línea en dientes, más larga por las canales */
    var dientes = [], n = 11, cota = S[1] + h * .5;
    for (i = 0; i <= n; i++) dientes.push([S[0] + w * 1.2 - 2 * w * 1.2 * i / n, cota + (i % 2 ? -1 : 1) * h * (.05 + R() * .11)]);
    traza([[S[0] - w * 1.3, S[1] - H * .01], [S[0] + w * 1.3, S[1] - H * .01]].concat(dientes));
    g = ctx.createLinearGradient(0, S[1], 0, cota + h * .15); g.addColorStop(0, 'rgba(246,248,255,' + nieve + ')'); g.addColorStop(1, 'rgba(196,204,232,' + nieve * .85 + ')'); ctx.fillStyle = g; ctx.fill();
    /* sombra: todo lo que queda a la derecha de la arista */
    var arista = quiebro(S, [S[0] + w * .22, pie], 5, .5, R);
    traza(arista.concat([[S[0] + w * 1.4, pie], [S[0] + w * 1.4, S[1] - H * .01]]));
    ctx.fillStyle = 'rgba(30,37,72,.6)'; ctx.fill();
    ctx.restore();
  }
  function paisaje(ctx, W, H, tipo) {
    var R = azar(7), base = H * .8, i, g;
    if (IMG[tipo]) {
      var im = IMG[tipo], ih = W * im.naturalHeight / im.naturalWidth;
      ctx.drawImage(im, 0, H * .85 - ih, W, ih);
    } else if (tipo === 'bosque') {
      g = ctx.createLinearGradient(0, H * .55, 0, base); g.addColorStop(0, 'rgba(120,190,190,0)'); g.addColorStop(1, 'rgba(150,215,205,.34)'); ctx.fillStyle = g; ctx.fillRect(0, H * .55, W, base - H * .55);
      [['#0c2d30', .1, .062], ['#071a1c', .055, .09], ['#010505', .018, .125]].forEach(function (c) {
        ctx.fillStyle = c[0]; var y = base - H * c[1] * .1 + H * (c[1] < .05 ? .012 : -.012 * (c[1] * 20));
        for (var x = -W * .02; x < W * 1.02; x += W * (.012 + R() * .017)) pino(ctx, x, y + H * .03, H * c[2] * (.6 + R() * .75), R);
        ctx.fillRect(0, y + H * .029, W, H);
      });
    } else if (tipo === 'montana' || tipo === 'cumbres') {
      g = ctx.createLinearGradient(0, H * .56, 0, base); g.addColorStop(0, 'rgba(150,160,200,0)'); g.addColorStop(1, 'rgba(170,180,215,.22)'); ctx.fillStyle = g; ctx.fillRect(0, H * .56, W, base - H * .56);
      var Rm = azar(41);
      [[.08, .115, .17], [.3, .15, .2], [.56, .125, .17], [.8, .16, .21], [1.0, .11, .15]].forEach(function (m) { pico(ctx, W, H, base, m[0], m[1], m[2], Rm, '#4a5478', '#262c47', .62); });
      [[.17, .13, .22], [.47, .2, .27], [.72, .115, .19], [.93, .14, .2]].forEach(function (m) { pico(ctx, W, H, base, m[0], m[1], m[2], Rm, '#39415f', '#12151f', .96); });
      var fr = cresta(7, .8, Rm); ctx.fillStyle = '#06080e'; ctx.beginPath(); ctx.moveTo(0, H * .87); for (i = 0; i < fr.length; i++) ctx.lineTo(W * i / (fr.length - 1), base - H * (.002 + fr[i] * .022)); ctx.lineTo(W, H * .87); ctx.closePath(); ctx.fill();
    } else if (tipo === 'ciudad') {
      g = ctx.createLinearGradient(0, H * .6, 0, base); g.addColorStop(0, 'rgba(90,150,190,0)'); g.addColorStop(.62, 'rgba(255,190,110,.5)'); g.addColorStop(1, 'rgba(255,120,40,.95)'); ctx.fillStyle = g; ctx.fillRect(0, H * .6, W, base - H * .6);
      [['#12263f', .088, .2], ['#0a1626', .062, .3], ['#050b14', .036, .42]].forEach(function (f) {
        for (var x = -W * .02; x < W * 1.02;) {
          var bw = W * (.016 + R() * .034), cen = 1 - Math.abs(x / W - .5) * 1.1, bh = H * f[1] * (.3 + R() * .7) * (.55 + cen * .6), top = base - bh;
          ctx.fillStyle = f[0]; ctx.fillRect(x, top, bw, bh + H * .02);
          if (R() > .78) ctx.fillRect(x + bw * .47, top - H * .012, Math.max(1, W * .0012), H * .012);
          var ve = Math.max(1.5, W * .0034), vw = ve * .5;
          for (var vy = top + ve; vy < base; vy += ve * 1.5) for (var vx = x + ve * .7; vx < x + bw - ve * .7; vx += ve) if (R() < f[2]) { ctx.fillStyle = R() > .25 ? 'rgba(255,200,125,.85)' : 'rgba(255,240,215,.9)'; ctx.fillRect(vx, vy, vw, ve * .7); }
          x += bw * (.82 + R() * .3);
        }
      });
      ctx.fillStyle = '#04060a'; ctx.fillRect(0, base, W, H);
      for (i = 0; i < 2600; i++) {
        var pr = Math.pow(R(), 2.4), yy = base + H * .001 + pr * H * .07, xx = W / 2 + (R() - .5) * W * (1.1 + pr * .6), sz = W * (.0006 + pr * .0016) * (.6 + R());
        ctx.fillStyle = R() > .3 ? 'rgba(255,190,110,' + (.55 + R() * .45) + ')' : 'rgba(255,235,205,.9)';
        ctx.beginPath(); ctx.arc(xx, yy, sz, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      g = ctx.createRadialGradient(W * .62, base, 0, W * .62, base, H * .42); g.addColorStop(0, 'rgba(215,190,235,.5)'); g.addColorStop(1, 'rgba(215,190,235,0)'); ctx.fillStyle = g; ctx.fillRect(0, H * .3, W, base);
      g = ctx.createLinearGradient(0, base, 0, H * .86); g.addColorStop(0, '#3d3a6e'); g.addColorStop(1, '#060612'); ctx.fillStyle = g; ctx.fillRect(0, base, W, H);
      for (i = 0; i < 260; i++) { var yr = base + R() * H * .055, lr = W * (.01 + R() * .06); ctx.fillStyle = 'rgba(205,195,240,' + (.04 + R() * .16) + ')'; ctx.fillRect(R() * W, yr, lr, H * .0008 + R() * H * .0007); }
      /* roca y faro */
      var fx = W * .22, ry = base + H * .006; ctx.fillStyle = '#05050d';
      ctx.beginPath(); ctx.moveTo(-W * .02, ry + H * .02); ctx.lineTo(-W * .02, ry - H * .018); ctx.lineTo(W * .1, ry - H * .022); ctx.lineTo(W * .2, ry - H * .03); ctx.lineTo(W * .3, ry - H * .022); ctx.lineTo(W * .39, ry - H * .004); ctx.lineTo(W * .45, ry + H * .008); ctx.closePath(); ctx.fill();
      var th = H * .1, tw = W * .03;
      ctx.beginPath(); ctx.moveTo(fx - tw, ry - H * .028); ctx.lineTo(fx - tw * .6, ry - th); ctx.lineTo(fx + tw * .6, ry - th); ctx.lineTo(fx + tw, ry - H * .028); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#d8d3e6'; for (var b = 0; b < 2; b++) { var by = ry - H * (.05 + b * .03); ctx.fillRect(fx - tw * (.78 - b * .1), by, tw * 2 * (.78 - b * .1), H * .009); }
      ctx.fillStyle = '#05050d'; ctx.fillRect(fx - tw * .72, ry - th - H * .005, tw * 1.44, H * .005); ctx.fillRect(fx - tw * .42, ry - th - H * .017, tw * .84, H * .012);
      ctx.beginPath(); ctx.moveTo(fx - tw * .55, ry - th - H * .017); ctx.lineTo(fx, ry - th - H * .03); ctx.lineTo(fx + tw * .55, ry - th - H * .017); ctx.fill();
      var lx = fx, ly = ry - th - H * .011; g = ctx.createRadialGradient(lx, ly, 0, lx, ly, W * .05); g.addColorStop(0, 'rgba(255,240,190,1)'); g.addColorStop(.12, 'rgba(255,225,160,.7)'); g.addColorStop(1, 'rgba(255,225,160,0)'); ctx.fillStyle = g; ctx.fillRect(lx - W * .05, ly - W * .05, W * .1, W * .1);
    }
    /* la franja de abajo, para el texto */
    g = ctx.createLinearGradient(0, H * .79, 0, H * .86); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000'); ctx.fillStyle = g; ctx.fillRect(0, H * .79, W, H * .071);
    ctx.fillStyle = '#000'; ctx.fillRect(0, H * .86, W, H * .14);
  }
  function drawEscena(ctx, W, H, o, T) {
    var im = IMG[T.escena], fin = im ? H * .85 - W * im.naturalHeight / im.naturalWidth * (1 - FUNDE[T.escena]) : H * .8;   // con foto, el degradado llega a su color justo donde la foto aparece
    var g = ctx.createLinearGradient(0, 0, 0, fin); g.addColorStop(0, T.sky[0]); g.addColorStop(.55, T.sky[1]); g.addColorStop(1, T.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var b = Object.assign({}, o, { grid: false }), C = Object.assign({}, T, { disk: 'rgba(0,0,0,0)' });
    sky(ctx, W, W / 2, H * .36, W * .86, b, C);
    paisaje(ctx, W, H, T.escena);
    MOM_P.textBlock(ctx, W, H, { title: o.title, line2: o.line2, line3: o.line3, font: o.font, y: H * .885, color: T.text, soft: T.soft });
  }

  function jd(ms) { return ms / 86400000 + 2440587.5; }
  function lst(J, lon) { var d = J - 2451545.0; return (((280.46061837 + 360.98564736629 * d + lon) % 360) + 360) % 360; }
  function altaz(ra, dec, lstDeg, lat) {
    var H = (lstDeg - ra) * D2R, d = dec * D2R, p = lat * D2R;
    var sa = Math.sin(d) * Math.sin(p) + Math.cos(d) * Math.cos(p) * Math.cos(H), alt = Math.asin(Math.max(-1, Math.min(1, sa)));
    var az = Math.atan2(-Math.sin(H) * Math.cos(d), Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.sin(p) * Math.cos(H));
    return [alt / D2R, (az / D2R + 360) % 360];
  }
  function moon(J) {
    var d = J - 2451545.0, L = 218.316 + 13.176396 * d, M = 134.963 + 13.064993 * d, F = 93.272 + 13.229350 * d;
    var lon = (L + 6.289 * Math.sin(M * D2R)) * D2R, lat = 5.128 * Math.sin(F * D2R) * D2R, e = 23.439 * D2R;
    var ra = Math.atan2(Math.sin(lon) * Math.cos(e) - Math.tan(lat) * Math.sin(e), Math.cos(lon));
    var dec = Math.asin(Math.sin(lat) * Math.cos(e) + Math.cos(lat) * Math.sin(e) * Math.sin(lon));
    var g = (357.528 + 0.9856003 * d) * D2R, ls = (280.46 + 0.9856474 * d + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * D2R;
    var el = lon - ls;
    return { ra: (ra / D2R + 360) % 360, dec: dec / D2R, frac: (1 - Math.cos(el)) / 2, waxing: Math.sin(el) > 0, el: el };
  }
  // posición en el póster de un punto del cielo (estereográfica desde el cénit)
  function proj(alt, az, cx, cy, R) {
    var r = R * Math.tan((90 - alt) * D2R / 2), a = az * D2R;
    return [cx - r * Math.sin(a), cy - r * Math.cos(a)];
  }


  /* La Luna como esfera iluminada (16-oct-2026; antes era un disco plano con un corte duro y parecía un icono).
     Superficie: mapa de color real de la NASA (Lunar Reconnaissance Orbiter, dominio público; personaliza/luna-lro.jpg,
     equirectangular, longitud 0 en el centro = cara visible). Por píxel: normal de la esfera → latitud/longitud →
     color del mapa; luz del Sol según la elongación (creciente iluminada por la derecha, como desde el hemisferio
     norte) con reflectancia lunar Lommel-Seeliger (la llena se ve plana, no como una bola) y terminador suave.
     La parte en sombra es casi transparente (luz cenicienta muy tenue): no tapa el cielo como una bola negra. */
  var TEX = null;
  var texReady = new Promise(function (res) {
    var im = new Image();
    im.onload = function () {
      var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      var x = c.getContext('2d'); x.drawImage(im, 0, 0);
      TEX = { w: c.width, h: c.height, d: x.getImageData(0, 0, c.width, c.height).data }; res();
    };
    im.onerror = function () { res(); };
    var base = (document.currentScript && document.currentScript.src) || 'personaliza/cielo.js';
    /* 17-oct · luna.html pinta la Luna en grande: usa la cara visible a 4096 px (lon ±90°, lat ±75°) */
    im.src = base.replace(/cielo\.js(\?.*)?$/, window.MOM_LUNA_HD ? 'luna-cara-4k.jpg' : 'luna-lro.jpg');
  });
  var TEX_HD = !!window.MOM_LUNA_HD;
  function texAt(px, py, nz) {   // color de la superficie en el punto del disco (radio 1)
    if (!TEX) { var g = 0.62 - 0.12 * Math.exp(-((px + 0.3) * (px + 0.3) + (py + 0.2) * (py + 0.2)) * 4); return [g, g, g * 0.97]; }
    var lon = Math.atan2(px, nz), lat = Math.asin(Math.max(-1, Math.min(1, -py)));
    var u, v;
    if (TEX_HD) { u = Math.round((0.5 + lon / Math.PI) * (TEX.w - 1)); v = Math.round((0.5 - lat / (150 * D2R)) * (TEX.h - 1)); }
    else { u = Math.round((0.5 + lon / (2 * Math.PI)) * TEX.w); v = Math.round((0.5 - lat / Math.PI) * TEX.h); }
    u = Math.min(TEX.w - 1, Math.max(0, u)); v = Math.min(TEX.h - 1, Math.max(0, v));
    var k = (v * TEX.w + u) * 4;
    return [TEX.d[k] / 255, TEX.d[k + 1] / 255, TEX.d[k + 2] / 255];
  }
  function drawMoon(ctx, x, y, r, mo, haloK, opaca) {   // haloK: 0 = sin halo (lunas pequeñas en rejilla), 1 = normal; opaca: sombra sólida, para fondos claros o de color
    var el = mo.el, side = mo.waxing ? 1 : -1;
    var Lx = side * Math.abs(Math.sin(el)), Lz = -Math.cos(el);           // dirección del Sol (z hacia nosotros)
    // halo discreto, algo mayor cuanto más llena
    haloK = opaca ? 0 : haloK == null ? 1 : haloK;
    var hr = r * (1 + (0.7 + 1.5 * mo.frac) * haloK), g = ctx.createRadialGradient(x, y, r * 0.95, x, y, hr);
    if (haloK > 0) { g.addColorStop(0, 'rgba(255,248,228,' + ((0.05 + 0.13 * mo.frac) * Math.min(1, haloK)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,248,228,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, hr, 0, Math.PI * 2); ctx.fill(); }
    var N = Math.max(8, Math.ceil(r * 2) + 2), off = document.createElement('canvas'); off.width = off.height = N;
    var oc = off.getContext('2d'), img = oc.createImageData(N, N), d = img.data, c = (N - 1) / 2;
    for (var j = 0; j < N; j++) for (var i = 0; i < N; i++) {
      var px = (i - c) / r, py = (j - c) / r, q = px * px + py * py, k = (j * N + i) * 4;
      var edge = Math.max(0, Math.min(1, (1 - Math.sqrt(q)) * r + 0.5));   // borde suavizado
      if (edge <= 0) { d[k + 3] = 0; continue; }
      var nz = Math.sqrt(Math.max(0, 1 - q)), mu0 = px * Lx + nz * Lz;
      var lit = mu0 > 0 ? 2 * mu0 / (mu0 + Math.max(nz, 0.06)) : 0;           // Lommel-Seeliger
      lit *= Math.min(1, Math.max(0, (mu0 + 0.015) / 0.09));                  // terminador suave
      var t = texAt(px, py, nz), gain = 1.55 * Math.min(1, lit);
      var la = Math.min(1, lit * 1.6), es = opaca ? 1 : 0.16;                             // es: luz cenicienta (opacidad de la sombra)
      var al = Math.max(la, es);
      // color: lado iluminado = mapa con luz cálida; sombra = gris azulado tenue
      var cr = gain * t[0] * 255 * 1.02, cg = gain * t[1] * 255, cb = gain * t[2] * 255 * 0.94;
      var mix = la / al;
      var sr = opaca ? 34 + 42 * t[0] : 150 * t[0], sg = opaca ? 36 + 44 * t[1] : 160 * t[1], sb = opaca ? 42 + 50 * t[2] : 185 * t[2];
      d[k]     = Math.min(255, cr * mix + sr * (1 - mix));
      d[k + 1] = Math.min(255, cg * mix + sg * (1 - mix));
      d[k + 2] = Math.min(255, cb * mix + sb * (1 - mix));
      d[k + 3] = Math.round(255 * al * edge);
    }
    oc.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, x - c, y - c);
  }

  /* el disco del cielo (estrellas, constelaciones, Luna y aros) centrado en (cx, cy) con radio R.
     W = ancho del póster: da el grosor de líneas y el tamaño de estrellas */
  function sky(ctx, W, cx, cy, R, o, T) {
    var J = jd(o.utc), S = lst(J, o.lon), k = R / (W * 0.38);   // k: estrellas proporcionales al disco
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = T.disk; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    var lw = W / 3600 * Math.max(0.6, k);
    if (o.grid) {
      ctx.strokeStyle = T.grid; ctx.lineWidth = 2.2 * lw;
      [30, 60].forEach(function (a) { ctx.beginPath(); ctx.arc(cx, cy, R * Math.tan((90 - a) * D2R / 2), 0, Math.PI * 2); ctx.stroke(); });
      for (var g8 = 0; g8 < 8; g8++) { var p = proj(0, g8 * 45, cx, cy, R); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
    }
    if (o.lines) {
      ctx.strokeStyle = T.line; ctx.lineWidth = 3 * lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      DATA.L.forEach(function (seg) {
        ctx.beginPath(); var started = false;
        for (var i = 0; i < seg.length; i += 2) {
          var aa = altaz(seg[i], seg[i + 1], S, o.lat);
          if (aa[0] < -25) { started = false; continue; }
          var q = proj(aa[0], aa[1], cx, cy, R);
          if (!started) { ctx.moveTo(q[0], q[1]); started = true; } else ctx.lineTo(q[0], q[1]);
        }
        ctx.stroke();
      });
    }
    var st = DATA.S;
    for (var i = 0; i < st.length; i += 3) {
      var a = altaz(st[i], st[i + 1], S, o.lat); if (a[0] < 0) continue;
      var m = st[i + 2], q = proj(a[0], a[1], cx, cy, R);
      var r = 1.05 * lw * Math.pow(Math.max(0.35, 6.4 - m), 1.42) * (W > 2000 ? 1 : 1.25);
      if (m < 1.6) {
        var gg = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 4.5);
        gg.addColorStop(0, T.star); gg.addColorStop(0.25, T.star); gg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 0.35; ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(q[0], q[1], r * 4.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = T.star; ctx.globalAlpha = m > 5 ? 0.7 : 1;
      ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (o.moon) {
      var mo = moon(J), ma = altaz(mo.ra, mo.dec, S, o.lat);
      if (ma[0] > 0) { var mq = proj(ma[0], ma[1], cx, cy, R); drawMoon(ctx, mq[0], mq[1], W * 0.021 * Math.max(0.6, k), mo); }
    }
    ctx.restore();
    ctx.strokeStyle = T.ring; ctx.lineWidth = 7 * lw; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2.5 * lw; ctx.beginPath(); ctx.arc(cx, cy, R * 1.035, 0, Math.PI * 2); ctx.stroke();
    if (o.grid) {
      ctx.fillStyle = T.soft; ctx.font = MOM_P.subFont(W * 0.014 * Math.max(0.7, k), 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [['N', 0], ['E', 90], ['S', 180], ['O', 270]].forEach(function (c) { var p = proj(-4.5, c[1], cx, cy, R); ctx.fillText(c[0], p[0], p[1]); });
    }
    ctx.restore();
  }
  function draw(ctx, W, H, o) {
    var T = ESCENAS[o.theme] || THEMES[o.theme] || THEMES.medianoche;
    ctx.save();
    if (T.escena) { drawEscena(ctx, W, H, o, T); ctx.restore(); return; }
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    sky(ctx, W, W / 2, H * 0.385, W * 0.38, o, T);
    MOM_P.textBlock(ctx, W, H, { title: o.title, line2: o.line2, line3: o.line3, font: o.font, y: H * 0.815, color: T.text, soft: T.soft });
    ctx.restore();
  }
  /* nombre de la fase lunar */
  function faseNombre(mo) {
    var f = mo.frac, w = mo.waxing;
    if (f < 0.03) return 'Luna nueva';
    if (f > 0.97) return 'Luna llena';
    if (Math.abs(f - 0.5) < 0.04) return w ? 'Cuarto creciente' : 'Cuarto menguante';
    return f < 0.5 ? (w ? 'Luna creciente' : 'Luna menguante') : (w ? 'Gibosa creciente' : 'Gibosa menguante');
  }

  /* hora local del lugar → instante UTC (con su horario de verano) */
  function tzOffsetMs(ms, tz) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var p = {}; f.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms;
  }
  function localToUtc(dateStr, timeStr, tz) {
    var d = dateStr.split('-').map(Number), t = (timeStr || '22:00').split(':').map(Number);
    var guess = Date.UTC(d[0], d[1] - 1, d[2], t[0], t[1] || 0);
    if (!tz) return guess;
    try { var u = guess - tzOffsetMs(guess, tz); return guess - tzOffsetMs(u, tz); } catch (e) { return guess; }
  }

  window.MOM_CIELO = { ready: Promise.all([texReady, fotosReady]), drawMoon: drawMoon, sky: sky, faseNombre: faseNombre, draw: draw, themes: THEMES, escenas: ESCENAS, localToUtc: localToUtc, moon: moon, jd: jd };
})();
