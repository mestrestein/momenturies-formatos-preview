/* galeria/galeria.js — página galeria.html.
   Junta las obras de dominio público (obras.js) y los diseños del estudio (disenos.js), las filtra
   y, al elegir una, manda la imagen de imprenta al editor como si fuera una foto del cliente
   (photo-handoff.js → cuadro.html?foto=1). Así el resto del flujo (3D, tallas, carrito, imprenta) no cambia. */
(function () {
  var L = function () { return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'es'; };
  var CATS = [
    ['todo', 'Todo', 'All'],
    ['maestros', 'Grandes maestros', 'Old masters'],
    ['impresionismo', 'Impresionismo', 'Impressionism'],
    ['vanguardias', 'Modernismo y vanguardias', 'Modernism'],
    ['japones', 'Grabado japonés', 'Japanese prints'],
    ['carteles', 'Carteles vintage', 'Vintage posters'],
    ['naturaleza', 'Botánica y fauna', 'Botanical & wildlife'],
    ['mapas', 'Mapas y cielos', 'Maps & skies'],
    ['|'],
    ['retro', 'Retro', 'Retro'],
    ['moderno', 'Moderno', 'Modern'],
    ['minimal', 'Minimal', 'Minimal']
  ];
  var CAT = {}; CATS.forEach(function (c) { if (c[1]) CAT[c[0]] = c; });
  var INTRO = {
    maestros: ['Del Renacimiento al Romanticismo: Leonardo, Vermeer, Velázquez, Goya, Friedrich, Turner…', 'From the Renaissance to Romanticism: Leonardo, Vermeer, Velázquez, Goya, Friedrich, Turner…'],
    impresionismo: ['La luz al aire libre: Van Gogh, Monet, Renoir, Degas, Seurat y Sorolla.', 'Light in the open air: Van Gogh, Monet, Renoir, Degas, Seurat and Sorolla.'],
    vanguardias: ['Klimt, Munch, Kandinsky, Mondrian, Klee, Hilma af Klint: el arte que rompió las reglas.', 'Klimt, Munch, Kandinsky, Mondrian, Klee, Hilma af Klint: the art that broke the rules.'],
    japones: ['Hokusai, Hiroshige y los grabados en madera que enamoraron a Van Gogh y a Monet.', 'Hokusai, Hiroshige and the woodblock prints that captivated Van Gogh and Monet.'],
    carteles: ['Art nouveau de Mucha, el Montmartre de Toulouse-Lautrec y los parques nacionales de los años 30.', "Mucha's Art Nouveau, Toulouse-Lautrec's Montmartre and the 1930s national parks."],
    naturaleza: ['Láminas científicas que son pura belleza: Haeckel, Audubon, Redouté, Durero.', 'Scientific plates that are pure beauty: Haeckel, Audubon, Redouté, Dürer.'],
    mapas: ['Atlas celestes, mapas antiguos y la Luna dibujada a mano.', 'Celestial atlases, antique maps and the Moon drawn by hand.'],
    retro: ['Diseños propios con el color y las formas de los años 50, 60 y 70.', 'Our own designs with the colours and shapes of the 50s, 60s and 70s.'],
    moderno: ['Geometría, formas orgánicas y degradados: diseños propios para espacios actuales.', 'Geometry, organic shapes and gradients: our own designs for contemporary spaces.'],
    minimal: ['Pocas formas y mucha calma. Diseños propios que combinan con todo.', 'Few shapes, lots of calm. Our own designs that go with everything.']
  };
  var SIZE_TXT = { XL: '30×40', L: '24×32', M: '18×24' };

  var OBRAS = (window.MOMENTURIES_OBRAS || []).map(function (o) { o.own = false; return o; });
  var DIS = (window.MOMENTURIES_DISENOS || { list: [] }).list;
  var ALL = OBRAS.concat(DIS);
  var svgUrl = {};
  function thumbOf(it) {
    if (!it.own) return it.th;
    if (!svgUrl[it.id]) svgUrl[it.id] = URL.createObjectURL(new Blob([it.svg()], { type: 'image/svg+xml' }));
    return svgUrl[it.id];
  }
  function T(it) { return L() === 'en' ? it.te : it.t; }
  function D(it) { return L() === 'en' ? it.de : it.d; }
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var state = { cat: 'todo', q: '' }, shown = [];

  /* ── portada: las dos puertas ── */
  document.getElementById('nObras').textContent = OBRAS.length + (L() === 'en' ? ' works' : ' obras');
  document.getElementById('nEstudio').textContent = DIS.length + (L() === 'en' ? ' designs' : ' diseños');
  var gw = OBRAS.filter(function (o) { return o.id === 'gran-ola'; })[0] || OBRAS[0];
  if (gw) document.getElementById('doorObras').src = gw.th;
  var dz = DIS.filter(function (d) { return d.id === 'm-sol70-mostaza'; })[0] || DIS[0];
  if (dz) document.getElementById('doorEstudio').src = thumbOf(dz);
  [].forEach.call(document.querySelectorAll('[data-go]'), function (b) {
    b.addEventListener('click', function () {
      setCat(b.dataset.go === 'obras' ? 'todo' : 'retro');
      document.getElementById('bar').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── filtros ── */
  var chips = document.getElementById('chips');
  CATS.forEach(function (c) {
    if (c[0] === '|') { var s = document.createElement('span'); s.className = 'ga-chip-sep'; chips.appendChild(s); return; }
    var b = document.createElement('button'); b.className = 'ga-chip'; b.dataset.cat = c[0];
    b.innerHTML = '<span class="es">' + c[1] + '</span><span class="en">' + c[2] + '</span>';
    b.addEventListener('click', function () { setCat(c[0]); });
    chips.appendChild(b);
  });
  function setCat(c) {
    state.cat = c;
    [].forEach.call(chips.children, function (b) { if (b.dataset) b.setAttribute('aria-pressed', b.dataset.cat === c ? 'true' : 'false'); });
    render(); writeHash();
  }
  var qi = document.getElementById('q'), qt;
  qi.addEventListener('input', function () { clearTimeout(qt); qt = setTimeout(function () { state.q = qi.value; render(); }, 150); });

  /* ── rejilla ── */
  function matches(it) {
    if (state.cat !== 'todo' && it.cat !== state.cat) return false;
    if (!state.q) return true;
    var q = norm(state.q);
    return norm([it.t, it.te, it.a, it.y, it.m, CAT[it.cat] && CAT[it.cat][1]].join(' ')).indexOf(q) >= 0;
  }
  function card(it) {
    var w = it.own ? 3 : it.w, h = it.own ? 4 : it.h;
    return '<button class="ga-card" data-id="' + it.id + '"><div class="ga-frame">' +
      '<img src="' + esc(thumbOf(it)) + '" alt="' + esc(T(it) + ', ' + it.a) + '" loading="lazy" width="' + w + '" height="' + h + '" style="aspect-ratio:' + w + '/' + h + '">' +
      '</div><div class="ga-meta"><b>' + esc(T(it)) + '</b><span>' + esc(it.a) + (it.y && !it.own ? ' · ' + esc(it.y) : '') + '</span></div></button>';
  }
  function render() {
    var lang = L(), html = '', groups = state.cat === 'todo' ? CATS.filter(function (c) { return c[1] && c[0] !== 'todo'; }).map(function (c) { return c[0]; }) : [state.cat];
    shown = [];
    groups.forEach(function (g) {
      var items = ALL.filter(function (it) { return it.cat === g && matches(it); });
      if (!items.length) return;
      shown = shown.concat(items);
      var c = CAT[g];
      html += '<h2 class="ga-section-h">' + (lang === 'en' ? c[2] : c[1]) + '</h2>' +
        '<p class="ga-section-p">' + (INTRO[g] ? INTRO[g][lang === 'en' ? 1 : 0] : '') + '</p>' +
        '<div class="ga-grid">' + items.map(card).join('') + '</div>';
    });
    document.getElementById('sections').innerHTML = html || '<div class="ga-empty">' + (lang === 'en' ? 'Nothing found. Try another artist or word.' : 'No hay resultados. Prueba con otro artista o palabra.') + '</div>';
    document.getElementById('count').textContent = shown.length + (lang === 'en' ? ' pieces' : ' piezas');
  }
  document.getElementById('sections').addEventListener('click', function (e) {
    var b = e.target.closest('.ga-card'); if (b) open(b.dataset.id);
  });

  /* ── ficha ── */
  var modal = document.getElementById('modal'), cur = null;
  var ICON = {
    q: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c2613a" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/></svg>',
    l: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c2613a" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a3 3 0 1 1 0 5"/></svg>',
    m: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c2613a" stroke-width="2" stroke-linecap="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>'
  };
  function open(id) {
    var it = ALL.filter(function (x) { return x.id === id; })[0]; if (!it) return;
    cur = it; var en = L() === 'en';
    var img = document.getElementById('mImg');
    img.src = it.own ? thumbOf(it) : it.th;              // la pequeña ya está en caché: sale al instante
    if (!it.own && it.big) { var hi = new Image(); hi.onload = function () { if (cur === it) img.src = it.big; }; hi.src = it.big; }
    img.alt = T(it);
    var c = CAT[it.cat];
    document.getElementById('mCat').textContent = it.own ? (en ? 'Studio design · ' : 'Diseño del estudio · ') + (en ? c[2] : c[1]) : (en ? c[2] : c[1]);
    document.getElementById('mTitle').textContent = T(it);
    document.getElementById('mBy').textContent = it.a + (it.y && !it.own ? ', ' + it.y : '');
    document.getElementById('mWhere').textContent = it.m || '';
    document.getElementById('mDesc').textContent = D(it);
    var size = SIZE_TXT[it.max] || '30×40', facts = [];
    facts.push(ICON.q + '<span>' + (en ? 'Printed in high resolution up to <b>' + size + ' cm</b> (300 dpi)' : 'Impresión en alta resolución hasta <b>' + size + ' cm</b> (300 ppp)') + (it.own ? (en ? '. Vector design: perfectly sharp at any size.' : '. Diseño vectorial: nítido a cualquier tamaño.') : '') + '</span>');
    facts.push(ICON.m + '<span>' + (en ? 'Ink fused into HD aluminium. Hangs with a magnet, no holes.' : 'Tinta fundida en aluminio HD. Se cuelga con imán, sin agujeros.') + '</span>');
    facts.push(ICON.l + '<span>' + (it.own ? (en ? 'Original design by Momenturies.' : 'Diseño original de Momenturies.') :
      (en ? 'Public domain artwork. ' : 'Obra de dominio público. ') + '<a href="' + esc(it.src) + '" target="_blank" rel="noopener">' + (en ? 'Image source' : 'Origen de la imagen') + '</a>') + '</span>');
    document.getElementById('mFacts').innerHTML = facts.map(function (f) { return '<li>' + f + '</li>'; }).join('');
    document.getElementById('mCtaTxt').textContent = en ? 'Put it on my print' : 'Ponerla en mi cuadro';
    document.getElementById('mNote').textContent = en ? 'You choose the size and see it in 3D before ordering.' : 'Eliges el tamaño y la ves en 3D antes de pedirla.';
    var cta = document.getElementById('mCta'); cta.disabled = false; cta.classList.remove('loading');
    modal.classList.add('open'); document.body.style.overflow = 'hidden';
    writeHash();
  }
  function close() { modal.classList.remove('open'); document.body.style.overflow = ''; cur = null; writeHash(); }
  function step(d) {
    if (!cur) return; var i = shown.indexOf(cur); if (i < 0) i = 0;
    var n = shown[(i + d + shown.length) % shown.length]; if (n) open(n.id);
  }
  document.getElementById('mClose').addEventListener('click', close);
  document.getElementById('mPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('mNext').addEventListener('click', function () { step(1); });
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
  });

  /* ── al editor con la imagen de imprenta ── */
  function toast(m) { var t = document.getElementById('toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(function () { t.style.display = 'none'; }, 3500); }
  function printFile(it) {
    if (it.own) return window.MOMENTURIES_DISENOS.toFile(it.id);
    return fetch(it.print, { mode: 'cors' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.blob();
    }).then(function (b) { return new File([b], it.id + '.jpg', { type: b.type || 'image/jpeg' }); });
  }
  document.getElementById('mCta').addEventListener('click', function () {
    var it = cur, cta = this; if (!it) return;
    var en = L() === 'en';
    cta.disabled = true; cta.classList.add('loading');
    document.getElementById('mCtaTxt').textContent = en ? 'Preparing the high-resolution image…' : 'Preparando la imagen en alta resolución…';
    printFile(it).then(function (file) {
      if (!window.MOMENTURIES_PHOTO) throw new Error('handoff');
      return window.MOMENTURIES_PHOTO.put(file);
    }).then(function () {
      location.href = 'cuadro.html?foto=1&obra=' + encodeURIComponent(it.id);
    }).catch(function () {
      cta.disabled = false; cta.classList.remove('loading');
      document.getElementById('mCtaTxt').textContent = en ? 'Put it on my print' : 'Ponerla en mi cuadro';
      toast(en ? "We couldn't load the image. Please try again." : 'No hemos podido cargar la imagen. Inténtalo otra vez.');
    });
  });

  /* ── enlace directo: galeria.html#cat=retro  ·  galeria.html#obra=noche-estrellada ── */
  function writeHash() {
    var h = cur ? 'obra=' + cur.id : (state.cat !== 'todo' ? 'cat=' + state.cat : '');
    history.replaceState(null, '', h ? '#' + h : location.pathname + location.search);
  }
  var hp = new URLSearchParams(location.hash.slice(1));
  state.cat = CAT[hp.get('cat')] ? hp.get('cat') : 'todo';
  [].forEach.call(chips.children, function (b) { if (b.dataset) b.setAttribute('aria-pressed', b.dataset.cat === state.cat ? 'true' : 'false'); });
  render();
  if (hp.get('obra')) open(hp.get('obra'));
})();
