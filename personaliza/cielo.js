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
    azul:       { name: 'Azul noche',  bg: '#e8edf2', disk: '#1b2f4f', ring: '#1b2f4f', star: '#ffffff', line: 'rgba(255,255,255,.4)', grid: 'rgba(255,255,255,.12)', text: '#1b2f4f', soft: 'rgba(27,47,79,.65)', moonDark: '#30466b' }
  };

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
    return { ra: (ra / D2R + 360) % 360, dec: dec / D2R, frac: (1 - Math.cos(el)) / 2, waxing: Math.sin(el) > 0 };
  }
  // posición en el póster de un punto del cielo (estereográfica desde el cénit)
  function proj(alt, az, cx, cy, R) {
    var r = R * Math.tan((90 - alt) * D2R / 2), a = az * D2R;
    return [cx - r * Math.sin(a), cy - r * Math.cos(a)];
  }

  function draw(ctx, W, H, o) {
    var T = THEMES[o.theme] || THEMES.medianoche, J = jd(o.utc), S = lst(J, o.lon);
    var cx = W / 2, cy = H * 0.385, R = W * 0.38;
    ctx.save();
    ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    // disco del cielo
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = T.disk; ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    var lw = W / 3600;
    if (o.grid) {
      ctx.strokeStyle = T.grid; ctx.lineWidth = 2.2 * lw;
      [30, 60].forEach(function (a) { ctx.beginPath(); ctx.arc(cx, cy, R * Math.tan((90 - a) * D2R / 2), 0, Math.PI * 2); ctx.stroke(); });
      for (var k = 0; k < 8; k++) { var p = proj(0, k * 45, cx, cy, R); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
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
    // estrellas
    var st = DATA.S;
    for (var i = 0; i < st.length; i += 3) {
      var a = altaz(st[i], st[i + 1], S, o.lat); if (a[0] < 0) continue;
      var m = st[i + 2], q = proj(a[0], a[1], cx, cy, R);
      var r = 1.05 * lw * Math.pow(Math.max(0.35, 6.4 - m), 1.42) * (W > 2000 ? 1 : 1.25);
      if (m < 1.6) {
        var g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 4.5);
        g.addColorStop(0, T.star); g.addColorStop(0.25, T.star); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 0.35; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], r * 4.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = T.star; ctx.globalAlpha = m > 5 ? 0.7 : 1;
      ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    // la Luna con su fase, si está sobre el horizonte
    if (o.moon) {
      var mo = moon(J), ma = altaz(mo.ra, mo.dec, S, o.lat);
      if (ma[0] > 0) {
        var mq = proj(ma[0], ma[1], cx, cy, R), mr = W * 0.017;
        ctx.fillStyle = T.moonDark; ctx.beginPath(); ctx.arc(mq[0], mq[1], mr, 0, Math.PI * 2); ctx.fill();
        // parte iluminada: medio disco + elipse del terminador
        var s = mo.waxing ? 1 : -1, k = 1 - 2 * mo.frac;   // k: 1 nueva … -1 llena
        ctx.fillStyle = '#fbf6e6'; ctx.beginPath();
        ctx.arc(mq[0], mq[1], mr, -Math.PI / 2, Math.PI / 2, s < 0);
        ctx.ellipse(mq[0], mq[1], Math.abs(k) * mr, mr, 0, Math.PI / 2, -Math.PI / 2, (k > 0) === (s > 0));
        ctx.fill();
      }
    }
    ctx.restore();
    // aros del disco
    ctx.strokeStyle = T.ring; ctx.lineWidth = 7 * lw; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2.5 * lw; ctx.beginPath(); ctx.arc(cx, cy, R * 1.035, 0, Math.PI * 2); ctx.stroke();
    if (o.grid) {   // puntos cardinales
      ctx.fillStyle = T.soft; ctx.font = MOM_P.subFont(W * 0.014, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      [['N', 0], ['E', 90], ['S', 180], ['O', 270]].forEach(function (c) { var p = proj(-4.5, c[1], cx, cy, R * 1.0); ctx.fillText(c[0], p[0], p[1]); });
    }
    MOM_P.textBlock(ctx, W, H, { title: o.title, line2: o.line2, line3: o.line3, font: o.font, y: H * 0.815, color: T.text, soft: T.soft });
    ctx.restore();
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

  window.MOM_CIELO = { draw: draw, themes: THEMES, localToUtc: localToUtc, moon: moon, jd: jd };
})();
