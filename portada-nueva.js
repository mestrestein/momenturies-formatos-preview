/* portada-nueva.js: lo que se mueve en portada-nueva.html (23-oct-2026).
   Hero en carrusel, el móvil de «Cómo funciona», las 9 estancias, el carrusel de paredes, las cintas de regalo
   y las preguntas. Necesita paredes.js (las paredes de verdad, con sus medidas y precios). */
(function(){
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const eur = n => n.toFixed(2).replace('.', ',') + ' €';
const TRAMOS = [[4, 20], [3, 15], [2, 10]];
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
    if(!quieto && visible) timer = setTimeout(() => ir(i + 1), dur(i));
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
  const FOTOS = ['1738956952892', '1586498024141', '1557495235', '1655141011386'].map(f => S + f + '-480x640.webp');
  const GAL = ['1491013516836-160x160', '1738956952892-480x640', '1438761681033-160x160', '1474552226712-160x160',
    '1586498024141-480x640', '1499714608240-160x160', '1519689373023-160x160', '1557495235-480x640',
    '1502759683299-160x160', '1655141011386-480x640', '1529156069898-160x160', '1544005313-160x160'].map(f => S + f + '.webp');
  const ELEGIDAS = [1, 4, 7, 9];                 // las que se tocan en la galería (son las de FOTOS, en orden)
  /* habitaciones en vertical (entornos2d.js): px por cm y dónde va el borde de abajo de la pared, en px de la foto */
  const ROOMS = [
    { id:'salon-cuero-vert', lab:'Salón', ppc:3.91, ax:475, ay:699 },
    { id:'dormitorio-boucle-vert', lab:'Dormitorio', ppc:4.36, ax:470, ay:615 },
    { id:'cocina-marfil-isla', lab:'Cocina', ppc:4.05, ax:640, ay:630 },
    { id:'escalera-nordica-consola-vert', lab:'Escalera', ppc:5.29, ax:545, ay:645 },
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
    const ppc = r.ppc * 1.3, left = r.ax - w.width * ppc / 2, top = r.ay - w.height * ppc;
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
    { t:'Elige la combinación', ms:4600, run(){
      vista(vSala); piezas.forEach(p => p.classList.remove('fuera'));
      if(roomK){ ponerRoom(0, true); } combiK = 0; colocar();
      lab.textContent = 'Combinación'; $('.cf-info', demo).style.display = 'none';
      const cs = chips(COMBIS.map(w => w.name), 0);
      [1, 2, 3].forEach((k, n) => luego(700 + n * 1250, () => { if(!COMBIS[k]) return; toca(cs[k]); cs.forEach((c, j) => c.classList.toggle('on', j === k)); combiK = k; colocar(); }));
      luego(4300, () => { combiK = 0; cs.forEach((c, j) => c.classList.toggle('on', j === 0)); toca(cs[0]); colocar(); });
    }},
    { t:'Elige el entorno', ms:4600, run(){
      vista(vSala); piezas.forEach(p => p.classList.remove('fuera'));
      combiK = 0; colocar();
      lab.textContent = 'Entorno'; $('.cf-info', demo).style.display = 'none';
      const cs = chips(ROOMS.map(r => r.lab), roomK);
      [1, 2, 3].forEach((k, n) => luego(600 + n * 1300, () => { toca(cs[k]); cs.forEach((c, j) => c.classList.toggle('on', j === k)); ponerRoom(k); colocar(); }));
    }},
    { t:'Añade tu dedicatoria', ms:4400, run(){
      vista(vDed); card.classList.remove('atras'); dedTxt.textContent = '';
      const frase = 'Para mamá,\npor todos los veranos.\n23 · 10 · 2026';
      luego(700, () => card.classList.add('atras'));
      [...frase].forEach((ch, k) => luego(1500 + k * 55, () => { dedTxt.textContent += ch; }));
    }},
    { t:'Listo para colgar', ms:3600, run(){
      vista(vSala); combiK = 0; colocar(); lab.textContent = 'Tu pared'; $('.cf-info', demo).style.display = '';
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
    setTimeout(() => { $('em', tit).textContent = k + 1; $('span', tit).textContent = p.t; tit.classList.remove('cambia'); }, 200);
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

/* ═════ EN TU CASA: 9 estancias (textos de la ficha de Aitor) ═════ */
(function(){
  const tabs = $('#ecTabs'), strip = $('#ecStrip'); if(!tabs) return;
  const ROOMS = [
    ['salon','Salón','El salón, encima del sofá','Es la pared que más se mira de la casa. Una fila de cuadros grandes encima del sofá llena el hueco sin recargar.','<b>Truco:</b> deja unos 20-25 cm entre el respaldo del sofá y el borde de abajo de los cuadros.'],
    ['dormitorio','Dormitorio','Encima del cabecero','Lo primero que ves al despertarte. Tres fotos en fila, con colores suaves, quedan de maravilla.','<b>Truco:</b> que el conjunto no sea más ancho que el cabecero; queda más ordenado.'],
    ['comedor','Comedor','En la pared del comedor','Donde se juntan las comidas largas y las sobremesas. Fotos de familia y de viajes para que salgan solas las historias.','<b>Truco:</b> centra el conjunto con el aparador o la mesa, no con la pared.'],
    ['cocina','Cocina','En la cocina, sin miedo al vapor','El aluminio no se ondula con la humedad, así que la cocina deja de ser zona prohibida para las fotos.','<b>Truco:</b> lejos del fuego directo, y se limpia con un paño húmedo.'],
    ['pasillo','Pasillo','Un pasillo que deja de ser de paso','Una fila de cuadros convierte el pasillo en una pequeña galería. Ideal para contar un viaje en orden.','<b>Truco:</b> cuadros a la altura de los ojos (unos 150 cm al centro) y del mismo tamaño.'],
    ['escalera','Escalera','Junto a la escalera','La pared de la escalera es enorme y casi siempre está vacía. Una cuadrícula de seis la llena con estilo.','<b>Truco:</b> con imán, recolocarlos hasta que queden perfectos es cuestión de segundos.'],
    ['recibidor','Recibidor','El recibidor, lo primero al llegar','Lo que ve quien entra por la puerta. Unas fotos sobre el mueble de la entrada dicen mucho de una casa.','<b>Truco:</b> que el conjunto no sea más ancho que el mueble.'],
    ['despacho','Despacho','En el despacho o el rincón de trabajo','Para las horas delante del ordenador: esa foto que te recuerda por qué trabajas tanto.','<b>Truco:</b> uno grande y dos pequeños encima de la mesa queda limpio y no distrae.'],
    ['terraza','Terraza','En la terraza cubierta','Aguanta la humedad y no se ondula, así que también puede vivir fuera, en una terraza o un porche cubiertos.','<b>Truco:</b> evita el sol directo todo el día y la lluvia; bajo techo, perfecto.'],
  ];
  tabs.innerHTML = ROOMS.map((r, i) => `<button type="button" data-i="${i}">${r[1]}</button>`).join('');
  strip.innerHTML = ROOMS.map((r, i) => `<button type="button" data-i="${i}" style="background-image:url(fotos/pdp/lugar-${r[0]}.jpg)" aria-label="${r[1]}"></button>`).join('');
  const show = i => { const r = ROOMS[i]; $('#ecBig').style.backgroundImage = `url(fotos/pdp/lugar-${r[0]}.jpg)`; $('#ecTit').textContent = r[2]; $('#ecTxt').textContent = r[3]; $('#ecTip').innerHTML = r[4];
    [tabs, strip].forEach(el => [...el.children].forEach((b, j) => b.classList.toggle('on', j === i))); };
  [tabs, strip].forEach(el => el.addEventListener('click', e => { const b = e.target.closest('button'); if(b) show(+b.dataset.i); }));
  show(0);
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

/* ═════ PARA QUIÉN: las cintas se duplican para dar la vuelta sin salto ═════ */
$$('.rg-cinta[data-dup]').forEach(c => { c.innerHTML += c.innerHTML; });

/* ═════ PREGUNTAS ═════ */
(function(){
  const lista = $('#pqLista'); if(!lista) return;
  const FAQ = [
    ['colgar', '¿Cómo funciona el colgado con imán?', 'Cada cuadro trae una lámina que se pega en la pared y un imán que va encima. El cuadro lleva otro imán detrás y se engancha solo. Sin taladro, sin marcas, y lo cambias de sitio cuando quieras.'],
    ['colgar', '¿Puedo cambiar los cuadros de sitio?', 'Sí, para eso está pensado. Despegas el cuadro del imán, lo pones en otro y vuelve a quedar recto. Si quieres mover también la base, la lámina sale sin dejar marca.'],
    ['foto', '¿Vale cualquier foto del móvil?', 'Casi todas. Una foto hecha con el móvil a tamaño completo va bien hasta el tamaño grande. Lo que no funciona son las capturas de pantalla ni las fotos reenviadas por WhatsApp. Si se queda corta, el editor te avisa antes de pagar.'],
    ['foto', '¿Cómo es el acabado?', 'Brillo. La foto se imprime directamente sobre la plancha de aluminio, sin papel de por medio, así que la luz rebota en el metal y le da profundidad. Las fotos con buena luz y contraste son las que más lucen.'],
    ['foto', '¿Puedo añadir una dedicatoria?', 'Sí. En el editor escribes una dedicatoria para el dorso, con la letra que elijas. Es opcional y no cuesta más.'],
    ['pedido', '¿Qué tamaños hay?', 'El cuadro va en tres formatos (cuadrado, clásico y retrato), cada uno en varios tamaños, de 10×10 a 30×40 cm. Aparte están la sobremesa, de 10,2×15,2 a 20,3×25,4, y el imán de 7×10.'],
    ['pedido', '¿Cuánto tarda en llegar?', 'Lo preparamos en 1-2 días laborables. El envío a España suele tardar 3-5 días laborables más; al resto de Europa, algo más. Verás el plazo y el precio exactos antes de pagar.'],
    ['pedido', '¿Puedo enviarlo directamente como regalo?', 'Sí. Pon la dirección de quien lo recibe y añade una nota en los comentarios del pedido. El precio no va dentro del paquete.'],
    ['pedido', '¿Y si llega dañado o con un fallo de impresión?', 'Escríbenos a hola@momenturies.com con una foto del problema y lo volvemos a imprimir sin coste. No hace falta devolver el primero.'],
    ['pedido', '¿Puedo devolver mi pedido?', 'Cada pieza se fabrica con tu foto, así que no tiene derecho de desistimiento (art. 103.c de la Ley de Consumidores). Si llega con un defecto o dañado, lo reimprimimos sin coste: escríbenos en los 14 días siguientes.'],
    ['colgar', '¿Cómo se limpia?', 'Con un paño suave, seco o un poco húmedo. Al ser aluminio no absorbe humedad ni se ondula, así que aguanta bien en la cocina o el baño.'],
  ];
  const pinta = c => { lista.innerHTML = FAQ.filter(f => c === '*' || f[0] === c).map(f => `<details><summary>${f[1]}</summary><p>${f[2]}</p></details>`).join(''); };
  $$('#pqChips button').forEach(b => b.addEventListener('click', () => { $$('#pqChips button').forEach(x => x.classList.toggle('on', x === b)); pinta(b.dataset.c); }));
  pinta('*');
})();
})();
