/* personaliza/mapa.js — «Vuestro lugar en el mapa»: calles, agua, mar y parques de cualquier sitio, dibujados en
   vectorial a partir de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL: se cita en el póster).
   Datos: teselas vectoriales de OpenFreeMap (gratis, sin clave, uso comercial permitido, servidas por CDN; esquema
   OpenMapTiles). 16-oct-2026: antes se pedían a Overpass, pero los servidores públicos daban 429/502 sin CORS a
   ratos, y eso no sirve para una tienda. Las teselas traen el mar ya como polígono, así que la costa sale exacta.
   Coordenadas en metros alrededor del centro (y hacia el norte): el póster se dibuja a cualquier tamaño. */
(function () {
  var RADIUS = { barrio: 850, ciudad: 2000, comarca: 4500 };   // medio ancho del mapa, en metros
  var ZOOM = { barrio: 14, ciudad: 14, comarca: 13 };         // 14 = máximo de OpenFreeMap (todas las calles)
  var TILEJSON = 'https://tiles.openfreemap.org/planet';
  var THEMES = {
    clasico:   { name: 'Clásico',       bg: '#ffffff', land: '#ffffff', water: '#dcdcdc', park: '#f1f1f1', road: '#151515', minor: '#2b2b2b', rail: '#7a7a7a', text: '#151515', soft: '#6b6b6b', frame: '#151515' },
    noche:     { name: 'Noche',         bg: '#0f1b2c', land: '#0f1b2c', water: '#1b2d47', park: '#13233a', road: '#e8d3a0', minor: '#c9b588', rail: '#6d6650', text: '#e8d3a0', soft: 'rgba(232,211,160,.7)', frame: '#e8d3a0' },
    terracota: { name: 'Terracota',     bg: '#f4eadc', land: '#f4eadc', water: '#cbd8d4', park: '#e8dcc6', road: '#9c4a2b', minor: '#b2694b', rail: '#c09a85', text: '#7d3a22', soft: 'rgba(125,58,34,.7)', frame: '#9c4a2b' },
    mediterraneo: { name: 'Mediterráneo', bg: '#fbf8f1', land: '#fbf8f1', water: '#bfd6e6', park: '#e6ecdc', road: '#1d3a5f', minor: '#36557c', rail: '#8fa3bb', text: '#1d3a5f', soft: 'rgba(29,58,95,.7)', frame: '#1d3a5f' },
    salvia:    { name: 'Salvia',        bg: '#eef0e7', land: '#eef0e7', water: '#c3d2cc', park: '#dfe5d3', road: '#2f4a3b', minor: '#4a6656', rail: '#93a598', text: '#2f4a3b', soft: 'rgba(47,74,59,.7)', frame: '#2f4a3b' },
    negro:     { name: 'Negro',         bg: '#111111', land: '#111111', water: '#262626', park: '#181818', road: '#ffffff', minor: '#d9d9d9', rail: '#777777', text: '#ffffff', soft: 'rgba(255,255,255,.65)', frame: '#ffffff' }
  };
  // ancho de cada clase de vía (OpenMapTiles «transportation») en un póster de 3600 px de ancho
  var ROADW = { motorway: 13, trunk: 13, primary: 10.5, secondary: 8.5, tertiary: 7, minor: 4.2, busway: 4, service: 2.6, track: 1.6, path: 1.7, raceway: 3 };
  var MAJOR = /^(motorway|trunk|primary|secondary|tertiary)$/;

  /* ── geometría del póster ── */
  function mapRect(W, H) { var m = W * 0.07; return { x: m, y: m, w: W - 2 * m, h: H * 0.70 }; }
  var RATIO = (0.70 * 4 / 3) / 0.86;   // alto/ancho del mapa en el póster 3:4

  /* ── lector mínimo de teselas vectoriales (Mapbox Vector Tile = protobuf) ── */
  function Reader(buf) { this.b = buf; this.p = 0; }
  Reader.prototype.varint = function () {
    var b = this.b, r = 0, s = 0, c;
    do { c = b[this.p++]; r += (c & 0x7f) * Math.pow(2, s); s += 7; } while (c >= 0x80);
    return r;
  };
  Reader.prototype.skip = function (wt) { if (wt === 0) this.varint(); else if (wt === 1) this.p += 8; else if (wt === 2) { var l = this.varint(); this.p += l; } else if (wt === 5) this.p += 4; };
  Reader.prototype.bytes = function () { var l = this.varint(), s = this.p; this.p += l; return this.b.subarray(s, s + l); };
  var td = new TextDecoder();
  function readValue(buf) {
    var r = new Reader(buf), v = null;
    while (r.p < buf.length) {
      var t = r.varint(), f = t >> 3, wt = t & 7;
      if (f === 1) v = td.decode(r.bytes());
      else if (f === 2) { v = new DataView(buf.buffer, buf.byteOffset + r.p, 4).getFloat32(0, true); r.p += 4; }
      else if (f === 3) { v = new DataView(buf.buffer, buf.byteOffset + r.p, 8).getFloat64(0, true); r.p += 8; }
      else if (f === 4 || f === 5) v = r.varint();
      else if (f === 6) { var z = r.varint(); v = z % 2 ? -(z + 1) / 2 : z / 2; }
      else if (f === 7) v = !!r.varint();
      else r.skip(wt);
    }
    return v;
  }
  var WANT = { water: 1, waterway: 1, transportation: 1, park: 1, landcover: 1 };
  function decodeTile(buf) {
    var r = new Reader(buf), layers = {};
    while (r.p < buf.length) {
      var t = r.varint();
      if ((t >> 3) !== 3) { r.skip(t & 7); continue; }
      var lb = r.bytes(), lr = new Reader(lb), name = '', keys = [], vals = [], feats = [], ext = 4096;
      while (lr.p < lb.length) {
        var lt = lr.varint(), lf = lt >> 3;
        if (lf === 1) name = td.decode(lr.bytes());
        else if (lf === 2) feats.push(lr.bytes());
        else if (lf === 3) keys.push(td.decode(lr.bytes()));
        else if (lf === 4) vals.push(readValue(lr.bytes()));
        else if (lf === 5) ext = lr.varint();
        else lr.skip(lt & 7);
      }
      if (!WANT[name]) continue;
      layers[name] = feats.map(function (fb) {
        var fr = new Reader(fb), tags = {}, type = 0, geom = null;
        while (fr.p < fb.length) {
          var ft = fr.varint(), ff = ft >> 3;
          if (ff === 2) { var tb = fr.bytes(), trr = new Reader(tb); while (trr.p < tb.length) { var k = trr.varint(), v = trr.varint(); tags[keys[k]] = vals[v]; } }
          else if (ff === 3) type = fr.varint();
          else if (ff === 4) { var gb = fr.bytes(), gr = new Reader(gb); geom = []; while (gr.p < gb.length) geom.push(gr.varint()); }
          else fr.skip(ft & 7);
        }
        return { tags: tags, type: type, geom: geom, ext: ext };
      });
    }
    return layers;
  }
  function zz(v) { return v % 2 ? -(v + 1) / 2 : v / 2; }
  function rings(f) {   // geometría → anillos/líneas en coordenadas de la tesela
    var g = f.geom || [], out = [], cur = null, x = 0, y = 0, i = 0;
    while (i < g.length) {
      var c = g[i++], id = c & 7, n = c >> 3;
      if (id === 1 || id === 2) {
        for (var k = 0; k < n; k++) {
          x += zz(g[i++]); y += zz(g[i++]);
          if (id === 1) { cur = [[x, y]]; out.push(cur); } else if (cur) cur.push([x, y]);
        }
      } else if (id === 7 && cur) cur.push(cur[0].slice());
    }
    return out;
  }

  /* ── descarga de las teselas que cubren el mapa ── */
  var tileUrl = null;
  function getTileUrl() {
    if (tileUrl) return Promise.resolve(tileUrl);
    return fetch(TILEJSON).then(function (r) { return r.json(); }).then(function (j) { return (tileUrl = j.tiles[0]); });
  }
  function fetchData(lat, lon, kind, ratio) {
    var hw = RADIUS[kind] || RADIUS.ciudad, hh = hw * (ratio || RATIO), z = ZOOM[kind] || 14, n = Math.pow(2, z);
    var kx = 111320 * Math.cos(lat * Math.PI / 180), ky = 110540, mx = 1.04;
    var tx = function (lo) { return (lo + 180) / 360 * n; };
    var ty = function (la) { var r = la * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n; };
    var x0 = Math.floor(tx(lon - hw * mx / kx)), x1 = Math.floor(tx(lon + hw * mx / kx));
    var y0 = Math.floor(ty(lat + hh * mx / ky)), y1 = Math.floor(ty(lat - hh * mx / ky));
    var list = [];
    for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) list.push([x, y]);
    return getTileUrl().then(function (u) {
      return Promise.all(list.map(function (t) {
        return fetch(u.replace('{z}', z).replace('{x}', t[0]).replace('{y}', t[1]))
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
          .then(function (ab) { return { x: t[0], y: t[1], layers: decodeTile(new Uint8Array(ab)) }; });
      }));
    }).then(function (tiles) {
      var roads = [], rails = [], rivers = [], water = [], parks = [];
      tiles.forEach(function (tile) {
        var L = tile.layers;
        var P = function (ext) {   // tesela → metros alrededor del centro
          return function (pt) {
            var X = tile.x + pt[0] / ext, Y = tile.y + pt[1] / ext;
            var lo = X / n * 360 - 180, la = Math.atan(Math.sinh(Math.PI * (1 - 2 * Y / n))) * 180 / Math.PI;
            return [(lo - lon) * kx, (la - lat) * ky];
          };
        };
        var poly = function (f) { var p = P(f.ext); return rings(f).map(function (r) { return r.map(p); }); };
        (L.water || []).forEach(function (f) { if (f.type === 3) water.push(poly(f)); });
        (L.waterway || []).forEach(function (f) { if (f.type === 2 && /river|canal/.test(f.tags['class'])) poly(f).forEach(function (r) { rivers.push({ pts: r, w: f.tags['class'] === 'river' ? 9 : 5 }); }); });
        (L.park || []).forEach(function (f) { if (f.type === 3) parks.push(poly(f)); });
        (L.landcover || []).forEach(function (f) { if (f.type === 3 && /grass|wood|forest/.test(f.tags['class'])) parks.push(poly(f)); });
        (L.transportation || []).forEach(function (f) {
          if (f.type !== 2) return;
          var c = f.tags['class'];
          if (c === 'rail' || c === 'transit') { poly(f).forEach(function (r) { rails.push(r); }); return; }
          if (!ROADW[c] || f.tags.brunnel === 'tunnel') return;
          if (kind === 'comarca' && /service|track|path/.test(c)) return;
          poly(f).forEach(function (r) { roads.push({ k: c, pts: r }); });
        });
      });
      return { lat: lat, lon: lon, hw: hw, hh: hh, kind: kind, roads: roads, rails: rails, rivers: rivers, water: water, parks: parks };
    });
  }

  /* ── dibujo ── */
  function heartPath(ctx, cx, cy, s) {   // corazón de ancho ~2s
    ctx.moveTo(cx, cy + s * 0.95);
    ctx.bezierCurveTo(cx - s * 1.25, cy + s * 0.05, cx - s * 1.05, cy - s * 1.0, cx, cy - s * 0.42);
    ctx.bezierCurveTo(cx + s * 1.05, cy - s * 1.0, cx + s * 1.25, cy + s * 0.05, cx, cy + s * 0.95);
    ctx.closePath();
  }
  function shapePath(ctx, r, shape) {
    ctx.beginPath();
    if (shape === 'circulo') { var rr = Math.min(r.w, r.h) / 2; ctx.arc(r.x + r.w / 2, r.y + r.h / 2, rr, 0, Math.PI * 2); }
    else if (shape === 'corazon') { heartPath(ctx, r.x + r.w / 2, r.y + r.h * 0.5, r.w * 0.5); }
    else ctx.rect(r.x, r.y, r.w, r.h);
  }
  /* el mapa dentro del rectángulo r (con su forma) — W da el grosor de las líneas */
  function mapIn(ctx, W, r, o, T) {
    var d = o.data; if (!d) return;
    var sc = r.w / (2 * d.hw), cx = r.x + r.w / 2, cy = r.y + r.h / 2, lw = W / 3600;
    var kf = (d.kind === 'barrio' ? 1.3 : d.kind === 'comarca' ? 0.62 : 1) * (o.lineK || 1);
    var X = function (p) { return cx + p[0] * sc; }, Y = function (p) { return cy - p[1] * sc; };
    var line = function (pts) { ctx.moveTo(X(pts[0]), Y(pts[0])); for (var i = 1; i < pts.length; i++) ctx.lineTo(X(pts[i]), Y(pts[i])); };
    var ring = function (pts) { if (pts.length > 2) { line(pts); ctx.closePath(); } };
    ctx.save(); shapePath(ctx, r, o.shape); ctx.clip();
    ctx.fillStyle = T.land; ctx.fillRect(r.x, r.y, r.w, r.h);
    if (o.parks !== false) { ctx.fillStyle = T.park; d.parks.forEach(function (rs) { ctx.beginPath(); rs.forEach(ring); ctx.fill('evenodd'); }); }
    ctx.fillStyle = T.water; d.water.forEach(function (rs) { ctx.beginPath(); rs.forEach(ring); ctx.fill('evenodd'); });
    ctx.strokeStyle = T.water; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    d.rivers.forEach(function (rv) { ctx.lineWidth = rv.w * lw * kf; ctx.beginPath(); line(rv.pts); ctx.stroke(); });
    ctx.strokeStyle = T.rail; ctx.lineWidth = 2.2 * lw * kf; ctx.setLineDash([9 * lw, 7 * lw]);
    d.rails.forEach(function (p) { ctx.beginPath(); line(p); ctx.stroke(); }); ctx.setLineDash([]);
    [[false, T.minor], [true, T.road]].forEach(function (grp) {
      var byW = {};
      d.roads.forEach(function (rd) { if (MAJOR.test(rd.k) !== grp[0]) return; var w = (ROADW[rd.k] || 2) * kf; (byW[w] = byW[w] || []).push(rd); });
      Object.keys(byW).map(Number).sort(function (a, b) { return a - b; }).forEach(function (w) {
        ctx.strokeStyle = grp[1]; ctx.lineWidth = w * lw; ctx.beginPath(); byW[w].forEach(function (rd) { line(rd.pts); }); ctx.stroke();
      });
    });
    ctx.restore();
    ctx.strokeStyle = T.frame; ctx.lineWidth = (o.shape === 'rect' ? 5 : 6) * lw; shapePath(ctx, r, o.shape); ctx.stroke();
    if (o.pin) {
      var s = W * 0.022; ctx.fillStyle = '#d64545'; ctx.strokeStyle = T.bg; ctx.lineWidth = W * 0.004;
      ctx.beginPath(); heartPath(ctx, cx, cy - s * 0.25, s); ctx.stroke(); ctx.fill();
    }
  }
  function draw(ctx, W, H, o) {
    var T = THEMES[o.theme] || THEMES.clasico, d = o.data, r = mapRect(W, H);
    ctx.save(); ctx.fillStyle = T.bg; ctx.fillRect(0, 0, W, H);
    if (d) {
      mapIn(ctx, W, r, o, T);
      ctx.fillStyle = T.soft; ctx.font = MOM_P.subFont(W * 0.0085, 400); ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('© OpenStreetMap', r.x + r.w, r.y + r.h + W * 0.008);
    }
    MOM_P.textBlock(ctx, W, H, { title: o.title, line2: o.line2, line3: o.line3, font: o.font, y: H * 0.835, color: T.text, soft: T.soft });
    ctx.restore();
  }

  window.MOM_MAPA = { fetch: fetchData, mapIn: mapIn, draw: draw, themes: THEMES, radius: RADIUS };
})();
