/* portada.js: lo que se mueve en index.html (26-oct-2026), la landing con lo elegido en /finalsolutions.
   Parte de portada-nueva.js. Hero en carrusel, el móvil de «Cómo funciona» (5 pasos), «En tu casa» con 3 estilos
   por estancia, aluminio con puntos, paredes, ¿cuántas fotos?, pruébalo en esta pared, productos, cintas de regalo,
   opiniones y preguntas. Necesita paredes.js (paredes con medidas y precios) y fotos/entornos/entornos.js. */
(function(){
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const eur = n => n.toFixed(2).replace('.', ',') + ' €';
const TRAMOS = [[5, 20], [3, 15], [2, 10]];
const pctDe = n => { const t = TRAMOS.find(t => n >= t[0]); return t ? t[1] : 0; };
const WALLS = window.MOMENTURIES_WALLS || [];
const pared = id => WALLS.find(w => w.id === id);
const neto = w => Math.round(w.price * (1 - pctDe(w.n) / 100) * 100) / 100;
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* los vídeos se cargan y corren solo mientras se ven */
const verVideo = v => { if(!v.src && v.dataset.src) v.src = v.dataset.src; v.play().catch(() => {}); };
const ioVid = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  const v = e.target; if(v.closest('.hx-m') && !v.closest('.hx-m.on')) return;
  e.isIntersecting ? verVideo(v) : v.pause();
}), { threshold:.2 }) : null;
$$('video[data-src]').forEach(v => ioVid ? ioVid.observe(v) : verVideo(v));

/* ═════ HERO EN CARRUSEL ═════ */
(function(){
  const hx = $('#hx'); if(!hx) return;
  const txt = $$('.hx-t', hx), med = $$('.hx-m', hx), nav = $$('.hx-nav button', hx);
  const T = 6500, TV = 11000;                   // la diapositiva del vídeo dura más: se ven varias habitaciones
  let i = 0, timer = 0, visible = true;
  const dur = k => med[k].querySelector('video') ? TV : T;
  function ir(k){
    i = (k + txt.length) % txt.length;
    txt.forEach((t, j) => { t.classList.toggle('on', j === i); t.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
    med.forEach((m, j) => {
      m.classList.toggle('on', j === i);
      const v = m.querySelector('video');
      if(v){ if(j === i){ v.currentTime = 0; verVideo(v); } else v.pause(); }
    });
    nav.forEach((b, j) => { b.classList.remove('on'); b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
    void hx.offsetWidth;                        // reinicia la línea que se llena
    hx.style.setProperty('--hx-t', dur(i) + 'ms');
    nav[i].classList.add('on');
    clearTimeout(timer);
    /* data-parado (lo pone /finalsolutions al probar un ángulo): se queda quieto en esta diapositiva */
    if(!quieto && visible && !hx.dataset.parado) timer = setTimeout(() => ir(i + 1), dur(i));
  }
  nav.forEach((b, k) => b.addEventListener('click', () => ir(k)));
  $$('.hx-arr button', hx).forEach(b => b.addEventListener('click', () => ir(i + +b.dataset.d)));
  /* deslizar con el dedo sobre la imagen */
  let x0 = null;
  $('.hx-media', hx).addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive:true });
  $('.hx-media', hx).addEventListener('touchend', e => { if(x0 === null) return; const d = e.changedTouches[0].clientX - x0; if(Math.abs(d) > 40) ir(i + (d < 0 ? 1 : -1)); x0 = null; });
  /* fuera de pantalla se para */
  if('IntersectionObserver' in window) new IntersectionObserver(es => {
    visible = es[0].isIntersecting; hx.classList.toggle('paused', !visible);
    if(visible) ir(i); else clearTimeout(timer);
  }, { threshold:.3 }).observe(hx);
  ir(0);
})();

/* ═════ CÓMO FUNCIONA: el móvil hace el pedido entero ═════ */
(function(){
  const demo = $('#cfDemo'); if(!demo) return;
  const pant = $('.cf-pant', demo), tit = $('.cf-tit', demo), pasos = $$('#cfPasos li'), dotsEl = $('.cf-dots', demo);
  const vGal = $('.cf-gal', demo), vSala = $('.cf-sala', demo), vDed = $('.cf-ded', demo), vOk = $('.cf-ok', demo);
  const room = $('.cf-room', demo), imgA = $('img.a', room), imgB = $('img.b', room), wallEl = $('.cf-wall', room);
  const lab = $('.cf-panel .lab', demo), nom = $('.cf-panel .nom', demo), det = $('.cf-panel .det', demo), chipsEl = $('.cf-chips', demo);
  const buy = $('.cf-buy', demo), buyPrecio = $('b', buy), tap = $('.cf-tap', demo), card = $('.cf-card', demo), dedTxt = $('.dorso p', demo);

  const S = 'fotos/stock/';
  const FOTOS = ['1752652011858', '1586498024141', '1557495235', '1758686254601'].map(f => S + f + '-480x640.webp');
  const GAL = ['1491013516836-160x160', '1752652011858-480x640', '1438761681033-160x160', '1474552226712-160x160',
    '1586498024141-480x640', '1499714608240-160x160', '1519689373023-160x160', '1557495235-480x640',
    '1502759683299-160x160', '1758686254601-480x640', '1529156069898-160x160', '1544005313-160x160'].map(f => S + f + '.webp');
  const ELEGIDAS = [1, 4, 7, 9];                 // las que se tocan en la galería (son las de FOTOS, en orden)
  /* habitaciones en vertical (entornos2d.js): px por cm y dónde va el borde de abajo de la pared, en px de la foto */
  const ROOMS = [
    { id:'salon-cuero-vert', lab:'Salón', ppc:3.91, ax:475, ay:699, free:[140, 0, 816] },
    { id:'dormitorio-boucle-vert', lab:'Dormitorio', ppc:4.36, ax:470, ay:615, free:[200, 0, 940] },
    { id:'cocina-marfil-isla', lab:'Cocina', ppc:4.05, ax:640, ay:630, free:[424, 0, 796] },
    { id:'comedor-moderno-vert', lab:'Comedor', ppc:4.25, ax:470, ay:711, free:[224, 0, 896] },
  ];
  const FW = 941, CROP_Y = 100, CROP_H = 1050;  // la habitación se ve de y=100 a y=1150 (lo de abajo son muebles)
  const COMBIS = ['W27', 'W20', 'W56', 'W09'].map(pared).filter(Boolean);
  if(COMBIS.length < 2) return;

  /* la galería y las cuatro piezas de la pared */
  const gal = $('.g', vGal);
  gal.innerHTML = GAL.map(src => `<i style="background-image:url(${src})"></i>`).join('');
  const thumbs = $$('i', gal), barra = $('.barra', vGal);
  wallEl.innerHTML = FOTOS.map(f => `<i style="background-image:url(${f})"></i>`).join('');
  const piezas = $$('i', wallEl);
  card.querySelector('.frente').style.backgroundImage = `url(${FOTOS[0]})`;
  $$('.cf-ok .caja i', demo).forEach((c, k) => c.style.backgroundImage = `url(${FOTOS[k]})`);

  let roomK = 0, combiK = 0;
  function colocar(){
    const r = ROOMS[roomK], w = COMBIS[combiK];
    /* un poco más grande que a escala real (x1.3): en una pantalla de móvil tan pequeña, si no, no se ven las fotos */
    /* centrada en el mueble a lo ancho; a lo alto, en el hueco de pared entre lo alto de lo que se ve y el mueble
       (algo por debajo de la mitad). Si no cabe, como antes: justo encima del mueble */
    const ppc = r.ppc * 1.3, W = w.width * ppc, H = w.height * ppc, techo = Math.max(r.free[1], CROP_Y + 40);
    const left = r.ax - W / 2;
    const top = H <= r.ay - techo ? techo + (r.ay - techo - H) * .6 : r.ay - H;
    piezas.forEach((el, k) => {
      const p = w.pieces[k];
      if(!p){ el.style.opacity = 0; return; }
      el.style.opacity = '';
      el.style.left = (left + p.x * ppc) / FW * 100 + '%';
      el.style.top = (top + p.y * ppc - CROP_Y) / CROP_H * 100 + '%';
      el.style.width = p.w * ppc / FW * 100 + '%';
      el.style.height = p.h * ppc / CROP_H * 100 + '%';
    });
    buyPrecio.innerHTML = `${eur(neto(w))}<s>${eur(w.price)}</s>`;
  }
  let capaB = false;
  function ponerRoom(k, sinFundido){
    roomK = k; const src = `fotos/portada-nueva/${ROOMS[k].id}.webp`;
    if(sinFundido){ imgA.src = src; imgB.style.opacity = 0; capaB = false; return; }
    const sig = capaB ? imgA : imgB; sig.src = src;
    sig.onload = () => { imgB.style.opacity = capaB ? 0 : 1; capaB = !capaB; };
  }
  ROOMS.forEach(r => { const im = new Image(); im.src = `fotos/portada-nueva/${r.id}.webp`; });

  function chips(lista, on){ chipsEl.innerHTML = lista.map((t, k) => `<span class="${k === on ? 'on' : ''}">${t}</span>`).join(''); return $$('span', chipsEl); }
  function toca(el){
    const a = el.getBoundingClientRect(), b = pant.getBoundingClientRect(), s = b.width / pant.offsetWidth || 1;
    tap.style.left = (a.left + a.width / 2 - b.left) / s + 'px'; tap.style.top = (a.top + a.height / 2 - b.top) / s + 'px';
    tap.classList.remove('toca'); void tap.offsetWidth; tap.classList.add('toca');
  }
  const vista = v => [vGal, vSala, vDed, vOk].forEach(x => x.classList.toggle('on', x === v));

  /* los seis pasos: cada uno dice cuánto dura y qué hace (las esperas van en una cola que se puede cortar) */
  let cola = [];
  const luego = (ms, fn) => cola.push(setTimeout(fn, ms));
  const parar = () => { cola.forEach(clearTimeout); cola = []; };
  const PASOS = [
    { t:'Elige tus fotos', ms:3800, run(){
      vista(vGal); thumbs.forEach(i => { i.classList.remove('sel'); i.removeAttribute('data-n'); });
      barra.classList.remove('ok'); barra.textContent = 'Elige tus fotos'; gal.scrollTop = 0;
      ELEGIDAS.forEach((g, n) => luego(500 + n * 620, () => { toca(thumbs[g]); thumbs[g].classList.add('sel'); thumbs[g].dataset.n = n + 1;
        barra.textContent = `Continuar · ${n + 1} ${n ? 'fotos' : 'foto'}`; barra.classList.add('ok'); }));
      luego(3300, () => toca(barra));
    }},
    { t:'Mira cómo queda', ms:3200, run(){
      combiK = 0; ponerRoom(0, true); colocar(); vista(vSala);
      lab.textContent = 'Tu pared'; nom.textContent = 'Así queda en tu salón'; det.textContent = '4 fotos · a tamaño real';
      chipsEl.innerHTML = ''; $('.cf-info', demo).style.display = '';
      piezas.forEach(p => p.classList.add('fuera'));
      piezas.forEach((p, k) => luego(350 + k * 260, () => p.classList.remove('fuera')));
    }},
    { t:'Elige la combinación, mira cómo queda en casa', corto:'Combina y míralo en casa', ms:5600, run(){
      vista(vSala); piezas.forEach(p => p.classList.remove('fuera'));
      if(roomK){ ponerRoom(0, true); } combiK = 0; colocar();
      lab.textContent = 'Combinación · ' + ROOMS[0].lab; $('.cf-info', demo).style.display = 'none';
      const cs = chips(COMBIS.map(w => w.name), 0);
      [1, 2, 3].forEach((k, n) => luego(800 + n * 1500, () => { if(!COMBIS[k]) return; toca(cs[k]); cs.forEach((c, j) => c.classList.toggle('on', j === k));
        combiK = k; ponerRoom(k % ROOMS.length); colocar(); lab.textContent = 'Combinación · ' + ROOMS[k % ROOMS.length].lab; }));
    }},
    { t:'Añade tu dedicatoria', ms:4400, run(){
      vista(vDed); card.classList.remove('atras'); dedTxt.textContent = '';
      const frase = 'Para mamá,\npor todos los veranos.\n23 · 10 · 2026';
      luego(700, () => card.classList.add('atras'));
      [...frase].forEach((ch, k) => luego(1500 + k * 55, () => { dedTxt.textContent += ch; }));
    }},
    { t:'Listo para colgar', ms:3600, run(){
      vista(vSala); combiK = 0; if(roomK) ponerRoom(0, true); colocar(); lab.textContent = 'Tu pared'; $('.cf-info', demo).style.display = '';
      nom.textContent = COMBIS[0].name; det.textContent = '4 cuadros · con dedicatoria'; chipsEl.innerHTML = '';
      vOk.classList.remove('on');
      luego(500, () => { toca(buy); buy.classList.add('pulsa'); });
      luego(750, () => buy.classList.remove('pulsa'));
      luego(1000, () => vista(vOk));
    }},
  ];

  /* el título, los puntos y la lista de la izquierda van con el paso */
  dotsEl.innerHTML = PASOS.map((p, k) => `<button type="button" aria-label="Paso ${k + 1}: ${p.t}"></button>`).join('');
  const dots = $$('button', dotsEl);
  let paso = 0, corriendo = false, visible = false;
  function mostrar(k){
    parar(); paso = k; const p = PASOS[k];
    tit.classList.add('cambia');
    setTimeout(() => { $('em', tit).textContent = k + 1; $('span', tit).textContent = p.corto || p.t; tit.classList.remove('cambia'); }, 200);
    demo.style.setProperty('--cf-t', p.ms + 'ms');
    dots.forEach((d, j) => { d.classList.remove('on'); d.classList.toggle('hecho', j < k); });
    void dotsEl.offsetWidth; dots[k].classList.add('on');
    pasos.forEach((li, j) => { li.classList.toggle('on', j === k); li.classList.toggle('hecho', j < k); });
    p.run();
    if(!quieto) luego(p.ms, () => mostrar((k + 1) % PASOS.length));
  }
  const elegir = k => { mostrar(k); };
  dots.forEach((d, k) => d.addEventListener('click', () => elegir(k)));
  pasos.forEach((li, k) => li.addEventListener('click', () => elegir(k)));
  if('IntersectionObserver' in window) new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if(visible && !corriendo){ corriendo = true; mostrar(paso); }
    else if(!visible && corriendo){ corriendo = false; parar(); }
  }, { threshold:.35 }).observe(demo);
  else mostrar(0);
  addEventListener('resize', colocar);
})();

/* ═════ PARED SOBRE UNA HABITACIÓN: la foto vacía de entornos.js y la pared de paredes.js a escala real ═════
   La foto llena la caja (como cover) pero se encuadra en la pared; los cuadros se centran en el hueco libre de pared. */
const ENTORNOS = window.MOMENTURIES_ROOMS || [];
const STOCK = ['1752652011858', '1586498024141', '1557495235', '1758686254601', '1548858806', '1770831208268', '1606983340126'].map(f => `fotos/stock/${f}-480x640.webp`);
function paredEn(caja, roomId, wallId, peque){
  const r = ENTORNOS.find(x => x.id === roomId), w = pared(wallId); if(!r || !w) return;
  caja.innerHTML = `<div class="sala"><img alt="" src="fotos/entornos/${r.id}${peque ? '_thumb' : ''}.jpg"/>${w.pieces.map((p, k) => `<i class="mw" style="background-image:url(${STOCK[k % STOCK.length]})"></i>`).join('')}</div>`;
  const img = $('img', caja), piezas = $$('.mw', caja), ppc = r.pxPerCm;
  const W = w.width * ppc, H = w.height * ppc, techo = Math.max(r.free ? r.free[1] : 0, r.h * .04);
  /* a lo ancho, centrada en el mueble (anchorX); a lo alto, en el hueco entre lo alto y el mueble, algo por debajo de la mitad */
  const left = r.anchorX - W / 2;
  const top = H <= r.anchorBottomY - techo ? techo + (r.anchorBottomY - techo - H) * .6 : r.anchorBottomY - H;
  const cx = left + W / 2, cy = top + H / 2;
  const pinta = () => {
    const bw = caja.clientWidth, bh = caja.clientHeight; if(!bw) return;
    const s = Math.max(bw / r.w, bh / r.h);
    const ox = Math.min(0, Math.max(bw - r.w * s, bw / 2 - cx * s)), oy = Math.min(0, Math.max(bh - r.h * s, bh * .4 - cy * s));
    Object.assign(img.style, { left:ox + 'px', top:oy + 'px', width:r.w * s + 'px', height:r.h * s + 'px' });
    piezas.forEach((el, k) => { const p = w.pieces[k];
      Object.assign(el.style, { left:ox + (left + p.x * ppc) * s + 'px', top:oy + (top + p.y * ppc) * s + 'px', width:p.w * ppc * s + 'px', height:p.h * ppc * s + 'px' }); });
  };
  pinta(); caja._pinta = pinta;
}
addEventListener('resize', () => $$('.ec-big, .ec-estilos .m').forEach(c => c._pinta && c._pinta()));

/* ═════ EN TU CASA: 9 estancias (textos de la ficha de Aitor) y 3 estilos en cada una ═════
   El primer estilo es la foto de Aitor (fotos/pdp/lugar-*.jpg); los otros dos, habitación vacía + pared */
(function(){
  const tabs = $('#ecTabs'), big = $('#ecBig'), est = $('#ecEstilos'); if(!tabs) return;
  const ROOMS = [
    ['salon','Salón','El salón, encima del sofá','Es la pared que más se mira de la casa. Una fila de cuadros grandes encima del sofá llena el hueco sin recargar.','<b>Truco:</b> deja unos 20-25 cm entre el respaldo del sofá y el borde de abajo de los cuadros.',
      ['Rústico', ['Minimalista', 'sofa-lino', 'W27'], ['Moderno', 'sofa-esquinero', 'W28']]],
    ['dormitorio','Dormitorio','Encima del cabecero','Lo primero que ves al despertarte. Tres fotos en fila, con colores suaves, quedan de maravilla.','<b>Truco:</b> que el conjunto no sea más ancho que el cabecero; queda más ordenado.',
      ['Minimalista', ['Rústico', 'dormitorio-mediterraneo', 'W63'], ['Moderno', 'dormitorio-oscuro', 'W22']]],
    ['comedor','Comedor','En la pared del comedor','Donde se juntan las comidas largas y las sobremesas. Fotos de familia y de viajes para que salgan solas las historias.','<b>Truco:</b> centra el conjunto con el aparador o la mesa, no con la pared.',
      ['Rústico', ['Minimalista', 'comedor-moderno', 'W45'], ['Nórdico', 'comedor-midcentury', 'W31']]],
    ['cocina','Cocina','En la cocina, sin miedo al vapor','El aluminio no se ondula con la humedad, así que la cocina deja de ser zona prohibida para las fotos.','<b>Truco:</b> lejos del fuego directo, y se limpia con un paño húmedo.',
      ['Rústico', ['Minimalista', 'cocina-roble-claro', 'W62'], ['Moderno', 'cocina-marmol-negro', 'W56']]],
    ['pasillo','Pasillo','Un pasillo que deja de ser de paso','Una fila de cuadros convierte el pasillo en una pequeña galería. Ideal para contar un viaje en orden.','<b>Truco:</b> cuadros a la altura de los ojos (unos 150 cm al centro) y del mismo tamaño.',
      ['Minimalista', ['Rústico', 'aparador-cestas', 'W46'], ['Moderno', 'aparador-lujo', 'W20']]],
    ['escalera','Escalera','Junto a la escalera','La pared de la escalera es enorme y casi siempre está vacía. Una cuadrícula de seis la llena con estilo.','<b>Truco:</b> con imán, recolocarlos hasta que queden perfectos es cuestión de segundos.',
      ['Nórdico', ['Clásico', 'escalera-clasica-elegante', 'W53'], ['Moderno', 'escalera-moderna-negra', 'W42']]],
    ['recibidor','Recibidor','El recibidor, lo primero al llegar','Lo que ve quien entra por la puerta. Unas fotos sobre el mueble de la entrada dicen mucho de una casa.','<b>Truco:</b> que el conjunto no sea más ancho que el mueble.',
      ['Clásico', ['Rústico', 'aparador-banco', 'W58'], ['Minimalista', 'rincon-banco', 'W21']]],
    ['despacho','Despacho','En el despacho o el rincón de trabajo','Para las horas delante del ordenador: esa foto que te recuerda por qué trabajas tanto.','<b>Truco:</b> uno grande y dos pequeños encima de la mesa queda limpio y no distrae.',
      ['Nórdico', ['Clásico', 'despacho-clasico', 'W57'], ['Moderno', 'despacho-nogal', 'W51']]],
    ['terraza','Terraza','En la terraza cubierta','Aguanta la humedad y no se ondula, así que también puede vivir fuera, en una terraza o un porche cubiertos.','<b>Truco:</b> evita el sol directo todo el día y la lluvia; bajo techo, perfecto.',
      ['Mediterráneo', ['Urbano', 'terraza-urbana2', 'W63'], ['Parisino', 'terraza-parisina', 'W18']]],
  ];
  const nombre = e => Array.isArray(e) ? e[0] : e;
  /* pinta un estilo en una caja: la foto de Aitor tal cual, o la habitación vacía con su pared */
  const pintaEn = (caja, r, e, peque) => { if(Array.isArray(e)) paredEn(caja, e[1], e[2], peque);
    else { caja._pinta = null; caja.innerHTML = `<div class="sala"><div class="foto" style="background-image:url(fotos/pdp/lugar-${r[0]}.jpg)"></div></div>`; } };
  tabs.innerHTML = ROOMS.map((r, i) => `<button type="button" data-i="${i}">${r[1]}</button>`).join('');
  let room = 0;
  const estilo = k => { const r = ROOMS[room]; pintaEn(big, r, r[5][k]); [...est.children].forEach((b, j) => b.classList.toggle('on', j === k)); };
  const show = i => {
    room = i; const r = ROOMS[i];
    $('#ecTit').textContent = r[2]; $('#ecTxt').textContent = r[3]; $('#ecTip').innerHTML = r[4];
    [...tabs.children].forEach((b, j) => b.classList.toggle('on', j === i));
    est.innerHTML = r[5].map((e, k) => `<button type="button" data-k="${k}"><span class="m"></span><span class="l">${nombre(e)}</span></button>`).join('');
    $$('.m', est).forEach((m, k) => pintaEn(m, r, r[5][k], true));
    estilo(0);
  };
  tabs.addEventListener('click', e => { const b = e.target.closest('button'); if(b){ show(+b.dataset.i); b.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' }); } });
  est.addEventListener('click', e => { const b = e.target.closest('button'); if(b) estilo(+b.dataset.k); });
  show(0);
})();

/* ═════ ALUMINIO: los puntos de la foto abren su globo ═════ */
(function(){
  const r = $('#aluminio .al-foto'); if(!r) return;
  const g = $('.globo', r), pts = $$('.pt', r);
  pts.forEach(p => p.onclick = () => {
    const on = p.classList.contains('on');
    pts.forEach(x => x.classList.remove('on'));
    if(on){ g.classList.remove('on'); return; }
    p.classList.add('on');
    const [t, d] = p.dataset.t.split('|');
    $('b', g).textContent = t; $('span', g).textContent = d;
    const x = parseFloat(p.style.left), y = parseFloat(p.style.top);
    g.style.left = (x > 60 ? x - 28 : x + 3) + '%'; g.style.top = (y + 4) + '%';
    g.classList.add('on');
  });
})();

/* ═════ PAREDES DE ENSUEÑO: las que hay en stock, cada una abre el editor con esa pared ═════ */
(function(){
  const riel = $('#pwRiel'); if(!riel) return;
  /* primero las que más lucen de lejos; detrás, el resto de lo que hay en stock */
  const PRIMERO = ['W27', 'W42', 'W21', 'W53', 'W39', 'W25', 'W47', 'W09', 'W20', 'W31', 'W56', 'W28'];
  const orden = w => { const k = PRIMERO.indexOf(w.id); return k < 0 ? 100 + w.n : k; };
  const lista = WALLS.filter(w => !w.soldOut && w.n >= 3).sort((a, b) => orden(a) - orden(b));
  riel.innerHTML = lista.map(w => `<a class="pw-card" href="cuadro.html?pared=${w.id}"><div class="img" style="background-image:url(fotos/paredes/${w.id}-1.webp)"></div><b>${w.name}</b><span>${w.n} cuadros · <s>${eur(w.price)}</s>${eur(neto(w))}<em>-${pctDe(w.n)} %</em></span></a>`).join('');
  $$('.pw-ctrl button').forEach(b => b.addEventListener('click', () => riel.scrollBy({ left: +b.dataset.d * riel.clientWidth * .8, behavior:'smooth' })));
})();


/* ═════ ¿CUÁNTAS FOTOS?: + y − y salen las paredes de ese número (las que hay en stock) ═════ */
(function(){
  const r = $('#cuantas'); if(!r) return;
  const hay = WALLS.filter(w => !w.soldOut);
  const nums = [...new Set(hay.map(w => w.n))].sort((a, b) => a - b);
  let k = Math.max(0, nums.indexOf(4));
  const pinta = () => {
    const n = nums[k]; $('.cu-num b', r).textContent = n;
    const ws = hay.filter(w => w.n === n).slice(0, 6);
    $('.cu-g', r).innerHTML = ws.length ? ws.map(w => `<a class="pw-card" href="cuadro.html?pared=${w.id}"><div class="img" style="background-image:url(fotos/paredes/${w.id}-1.webp)"></div><b>${w.name}</b><span>${w.n} ${w.n > 1 ? 'cuadros' : 'cuadro'}<i class="pz">${pctDe(w.n) ? `<s>${eur(w.price)}</s>` : ''}${eur(neto(w))}${pctDe(w.n) ? `<em>-${pctDe(w.n)} %</em>` : ''}</i></span></a>`).join('')
      : '<p class="vacio">Para ese número aún no hay paredes con existencias.</p>';
  };
  $$('.cu-num button', r).forEach(b => b.onclick = () => { k = Math.max(0, Math.min(nums.length - 1, k + +b.dataset.d)); pinta(); });
  pinta();
})();

/* ═════ PRUÉBALO EN ESTA PARED: tocar una foto la cuelga en el siguiente hueco ═════
   31-oct · Marc: con «+ Tus fotos» el cliente elige de su galería (como mucho, tantas como huecos
   tiene la pared) y se van colgando solas. No se sube nada: se ven en su móvil con URL locales, y
   «Hacer la mía» se las pasa al editor tal cual (photo-handoff), sin volver a pedírselas. */
(function(){
  const raiz = $('#pruebalo'); if(!raiz) return;
  const tira = $('.pe-tira', raiz), mas = $('.pe-mas', raiz);
  const huecos = $$('.h', raiz);
  let botones = $$('.pe-tira button:not(.pe-mas)', raiz);
  botones.forEach(b => b.style.backgroundImage = `url(${b.dataset.img})`);
  const PRECIO = h => h.classList.contains('g') ? 54.99 : 29.99;     // 30×40 en el centro, 18×24 alrededor
  const orden = [2, 1, 3, 0, 4];                                        // se llena desde el centro
  let auto = true, vez = 0;   // vez: cambia al vaciar, y los vuelos que iban de antes ya no cuelgan nada
  const pinta = () => {
    const llenos = huecos.filter(h => h.classList.contains('lleno')), bruto = llenos.reduce((s, h) => s + PRECIO(h), 0), p = pctDe(llenos.length);
    const total = Math.round(bruto * (1 - p / 100) * 100) / 100;
    $('.np', raiz).textContent = llenos.length + ' de 5 cuadros' + (p ? ' · -' + p + ' %' : '');
    $('.tot', raiz).innerHTML = (p ? '<s>' + eur(bruto) + '</s>' : '') + eur(total);
  };
  const colgar = b => {
    const h = orden.map(i => huecos[i]).find(h => !h.classList.contains('lleno') && !h.dataset.r); if(!h) return;
    h.dataset.r = 1;   // reservado mientras vuela la foto: así dos seguidas no van al mismo hueco
    const img = b.dataset.img, mia = vez; b.classList.add('usada');
    const a = b.getBoundingClientRect(), z = h.getBoundingClientRect();
    if(quieto || !a.width){ h.style.backgroundImage = 'url(' + img + ')'; h.classList.add('lleno'); h.textContent = ''; return pinta(); }
    const v = document.createElement('div'); v.className = 'pe-vuelo';
    Object.assign(v.style, { left:a.left + 'px', top:a.top + 'px', width:a.width + 'px', height:a.height + 'px', backgroundImage:'url(' + img + ')' });
    document.body.appendChild(v);
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(v.style, { left:z.left + 'px', top:z.top + 'px', width:z.width + 'px', height:z.height + 'px' })));
    setTimeout(() => { v.remove(); if(mia !== vez) return; h.style.backgroundImage = 'url(' + img + ')'; h.classList.add('lleno'); h.textContent = ''; pinta(); }, 720);
  };
  botones.forEach(b => b.onclick = () => { auto = false; colgar(b); });
  const vaciar = () => { vez++; huecos.forEach(h => { delete h.dataset.r; h.classList.remove('lleno'); h.style.backgroundImage = ''; h.textContent = '+'; }); botones.forEach(b => b.classList.remove('usada')); pinta(); };
  $('.pe-otra', raiz).onclick = () => { auto = false; vaciar(); };

  /* sus fotos: selector de la galería; las que pasen de los huecos se quedan fuera (el navegador no deja poner tope) */
  let mias = [], urls = [];
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*'; input.multiple = true; input.hidden = true;
  raiz.appendChild(input);
  const elegir = () => { auto = false; input.value = ''; input.click(); };
  if(mas) mas.onclick = elegir;
  huecos.forEach(h => h.addEventListener('click', () => { if(!h.classList.contains('lleno')) elegir(); }));
  input.addEventListener('change', () => {
    const fs = [...(input.files || [])].filter(f => /^image\//.test(f.type) || /\.(heic|heif)$/i.test(f.name));
    if(!fs.length) return;
    auto = false;
    urls.forEach(u => URL.revokeObjectURL(u));
    mias = fs.slice(0, huecos.length); urls = mias.map(f => URL.createObjectURL(f));
    botones.forEach(b => b.remove());
    botones = urls.map(u => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mia'; b.setAttribute('aria-label', 'Tu foto');
      b.dataset.img = u; b.style.backgroundImage = 'url(' + u + ')'; b.onclick = () => colgar(b); tira.appendChild(b); return b; });
    let aviso = $('.pe-aviso', raiz);
    if(fs.length > huecos.length){ if(!aviso){ aviso = document.createElement('p'); aviso.className = 'pe-aviso'; tira.after(aviso); }
      aviso.textContent = 'En esta pared caben ' + huecos.length + ': hemos cogido las ' + huecos.length + ' primeras.'; }
    else if(aviso) aviso.remove();
    vaciar();
    const g = vez; botones.forEach((b, i) => setTimeout(() => { if(g === vez) colgar(b); }, quieto ? 0 : 250 + i * 520));
  });
  /* «Hacer la mía» con sus fotos ya elegidas: van directas al editor (va antes que el clic de photo-handoff, que volvería a abrir la galería) */
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('#pruebalo [data-photo-pick]');
    if(!a || !mias.length || !window.MOMENTURIES_PHOTO) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const dest = a.getAttribute('href') || 'cuadro.html'; a.classList.add('is-loading');
    MOMENTURIES_PHOTO.put(mias).then(() => { location.href = dest + (dest.indexOf('?') < 0 ? '?' : '&') + 'foto=1'; }).catch(() => { location.href = dest; });
  }, true);
  /* si nadie toca nada, se cuelgan dos solas para que se entienda */
  if('IntersectionObserver' in window){ const io = new IntersectionObserver(es => { if(!es[0].isIntersecting) return; io.disconnect();
    let k = 0; const t = setInterval(() => { if(!auto || k >= 2){ clearInterval(t); return; } colgar(botones[k++]); }, 1400); }, { threshold:.4 }); io.observe(raiz); }
  pinta();
})();

/* ═════ PRODUCTOS: en PC se inclinan con el ratón; en móvil son un carrusel con sus puntos ═════ */
(function(){
  const g = $('#prG'); if(!g) return;
  $$('[data-tilt-card]', g).forEach(card => {
    const mueve = (x, y, fuera) => { card.style.setProperty('--ry', fuera ? '0deg' : ((x - .5) * 16) + 'deg'); card.style.setProperty('--rx', fuera ? '0deg' : (-(y - .5) * 12) + 'deg');
      card.style.setProperty('--gx', x * 100 + '%'); card.style.setProperty('--gy', y * 100 + '%'); };
    card.addEventListener('pointermove', e => { if(e.pointerType !== 'mouse') return; const r = card.getBoundingClientRect(); mueve((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
    card.addEventListener('pointerleave', () => mueve(.5, .5, true));
  });
  const dots = $$('#prDots i');
  g.addEventListener('scroll', () => { const cs = [...g.children], c = g.scrollLeft + g.clientWidth / 2;
    const k = cs.reduce((m, el, i) => Math.abs(el.offsetLeft + el.offsetWidth / 2 - c) < Math.abs(cs[m].offsetLeft + cs[m].offsetWidth / 2 - c) ? i : m, 0);
    dots.forEach((d, i) => d.classList.toggle('on', i === k)); }, { passive:true });
})();

/* ═════ PARA QUIÉN: las cintas se duplican para dar la vuelta sin salto ═════ */
$$('.rg-cinta[data-dup]').forEach(c => { c.innerHTML += c.innerHTML; });

/* ═════ OPINIONES: SOLO de compras reales. Vacío = se ven los dos huecos de ejemplo, marcados como ejemplo.
   Cada una: { nombre, ciudad, estrellas, texto, producto, fecha, foto } (foto = la de su casa, opcional) ═════ */
const RESENAS = [];
(function(){
  const lista = $('#opLista'); if(!lista || !RESENAS.length) return;
  const n = RESENAS.length, media = RESENAS.reduce((s, r) => s + r.estrellas, 0) / n;
  $('#opNota').textContent = media.toFixed(1).replace('.', ',');
  $('#opEst').textContent = '★★★★★☆☆☆☆☆'.slice(5 - Math.round(media), 10 - Math.round(media));
  $$('#opiniones .bar3 b').forEach((b, i) => { b.style.width = RESENAS.filter(r => r.estrellas === 5 - i).length / n * 100 + '%'; });
  $('#opTxt').textContent = `${n} ${n > 1 ? 'opiniones' : 'opinión'} de compras reales.`;
  const e = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);
  lista.innerHTML = RESENAS.map(r => `<div class="r"><div class="img" style="background-image:url(${e(r.foto || 'fotos/paredes/W27-1.webp')})"></div><div><div class="est">${'★'.repeat(r.estrellas)}${'☆'.repeat(5 - r.estrellas)}</div><b>${e(r.nombre)}${r.ciudad ? ', ' + e(r.ciudad) : ''}</b><p>${e(r.texto)}</p><small>✓ Compra verificada<i>${e(r.producto)} · ${e(r.fecha)}</i></small></div></div>`).join('');
  $('#opAviso').hidden = true;
})();

/* ═════ PREGUNTAS (26-oct): las dudas que también tienen Mixtiles y Metaleks, pero con lo nuestro:
   aluminio HD, colgado con imán sobre lámina, lo ves en tu casa antes de pedirlo, paredes con descuento y dedicatoria ═════ */
(function(){
  const lista = $('#pqLista'); if(!lista) return;
  const FAQ = [
    ['colgar', '¿Estropea la pared?', 'No. No hay que hacer ningún agujero. Primero pegas la lámina protectora, encima va el imán de pared y el cuadro se engancha con el suyo. La lámina cuida la pintura y, el día que la quites, sale sin dejar marca.'],
    ['colgar', '¿De verdad aguanta sin clavos?', 'Sí. La plancha de aluminio pesa poco y el imán la sujeta firme. Aprieta la base contra la pared unos segundos al pegarla y no se mueve. Si un día la quieres en otro sitio, la recolocas.'],
    ['colgar', '¿Puedo cambiar los cuadros de sitio?', 'Sí, está pensado para eso. Despegas el cuadro del imán y lo pones en otro: se queda recto otra vez. Así puedes intercambiar dos fotos o rehacer la pared entera sin agujeros nuevos.'],
    ['colgar', '¿En qué paredes se puede poner?', 'En paredes lisas y limpias: pintura, azulejo, madera lacada o cristal. En gotelé muy marcado o papel pintado la lámina agarra peor; si es tu caso, escríbenos antes de pedir y lo vemos.'],
    ['colgar', '¿Lo puedo poner en la cocina o en el baño?', 'Sí. El aluminio no absorbe humedad ni se ondula como el papel. Evita solo el agua directa y el fuego cerca. Se limpia con un paño suave, seco o un poco húmedo.'],
    ['foto', '¿Vale cualquier foto del móvil?', 'Casi todas. Una foto hecha con el móvil a tamaño completo va bien hasta el tamaño grande. Lo que no funciona son las capturas de pantalla ni las fotos reenviadas por WhatsApp, que llegan comprimidas. Si se queda corta para el tamaño que eliges, el editor te avisa antes de pagar.'],
    ['foto', '¿Puedo ver cómo queda antes de pedirlo?', 'Sí, y es lo que más usáis. En el editor colocas tus fotos en una pared a tamaño real, cambias de habitación o de combinación con un toque y lo giras en 3D. Lo que ves es lo que te llega.'],
    ['foto', '¿Cómo es el acabado? ¿Brilla mucho?', 'Es acabado brillo, en alta definición: la tinta va directa sobre el aluminio, sin papel ni cristal, y por eso los colores tienen esa profundidad. Como toda superficie brillante, frente a una ventana puede dar algún reflejo; en una pared sin luz directa luce más.'],
    ['foto', '¿En qué se diferencia de un lienzo o un póster con marco?', 'No necesita marco ni cristal, no se ondula con la humedad, aguanta golpes y se cuelga con imán en vez de con clavo. Y la foto tiene más color y más nitidez que en papel.'],
    ['pedido', '¿Qué tamaños hay?', 'El cuadro va en tres formatos (cuadrado, clásico y retrato), cada uno en varios tamaños, de 10×10 a 30,5×43,1 cm. Aparte están la sobremesa, de 10,2×15,2 a 20,3×25,4, y el imán para la nevera.'],
    ['pedido', '¿Hay descuento si pido varios?', 'Sí, y se aplica solo: 10 % con dos cuadros, 15 % con tres y 20 % con cuatro o más. Las paredes ya montadas llevan el descuento puesto.'],
    ['pedido', '¿Cuánto tarda en llegar?', 'Lo preparamos en 1-2 días laborables. El envío a España suele tardar 3-5 días laborables más; al resto de Europa, algo más. Verás el plazo y el precio exactos antes de pagar.'],
    ['pedido', '¿Y si llega dañado o con un fallo de impresión?', 'Escríbenos a hola@momenturies.com con una foto del problema en los 14 días siguientes y lo volvemos a imprimir sin coste. No hace falta devolver el primero.'],
    ['pedido', '¿Puedo devolver mi pedido?', 'Cada pieza se fabrica con tu foto, así que no tiene derecho de desistimiento (art. 103.c de la Ley de Consumidores). Si llega con un defecto o dañado, lo reimprimimos sin coste.'],
    ['regalo', '¿Puedo enviarlo directamente como regalo?', 'Sí. Pon la dirección de quien lo recibe y añade una nota en los comentarios del pedido. El precio no va dentro del paquete y llega listo para colgar.'],
    ['regalo', '¿Cómo funciona la dedicatoria?', 'En el editor escribes unas palabras para el dorso y eliges la letra. Va impresa detrás de cada cuadro, así que en una pared de cuatro puedes poner cuatro frases distintas. Es opcional y no cuesta más.'],
  ];
  const pinta = c => { lista.innerHTML = FAQ.filter(f => c === '*' || f[0] === c).map(f => `<details><summary>${f[1]}</summary><p>${f[2]}</p></details>`).join(''); };
  $$('#pqChips button').forEach(b => b.addEventListener('click', () => { $$('#pqChips button').forEach(x => x.classList.toggle('on', x === b)); pinta(b.dataset.c); }));
  pinta('*');
})();
})();

/* ═════ DISEÑOS PERSONALIZADOS (28-oct): flechas del carrusel ═════ */
(() => {
  const riel = document.getElementById('dpRiel'); if(!riel) return;
  document.querySelectorAll('.dp-ctrl button').forEach(b => b.addEventListener('click', () => riel.scrollBy({ left: +b.dataset.d * riel.clientWidth * .8, behavior:'smooth' })));
})();
