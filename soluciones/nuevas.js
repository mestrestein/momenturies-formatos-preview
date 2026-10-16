/* Interacción de las versiones D y E (16-oct-2026). Cada bloque comprueba que su sección existe. */
(function(){
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const eur = n => n.toFixed(2).replace('.', ',') + ' €';
const TRAMOS = [[4, 20], [3, 15], [2, 10]];
const conDto = (bruto, n) => { const t = TRAMOS.find(t => n >= t[0]); const p = t ? t[1] : 0; return { bruto, total: Math.round((bruto - bruto * p / 100) * 100) / 100, p }; };
const visible = (el, cb) => { if(!('IntersectionObserver' in window)) return cb(); const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ cb(); io.disconnect(); } }), { threshold: .3 }); io.observe(el); };

/* las secciones con data-vivo arrancan su animación al verse */
$$('[data-vivo]').forEach(el => visible(el, () => el.classList.add('vivo')));

/* inclinar con el ratón o el dedo */
function inclinar(el, cb){
  const mover = e => { const r = el.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; cb((p.clientX - r.left) / r.width, (p.clientY - r.top) / r.height); };
  el.addEventListener('pointermove', mover);
  el.addEventListener('pointerleave', () => cb(.5, .5, true));
}

/* 1D · el panel se inclina siguiendo el ratón */
$$('.n1d [data-tilt]').forEach(st => {
  const p = $('.panel', st);
  inclinar(st, (x, y, fuera) => { p.style.setProperty('--ry', fuera ? '-14deg' : ((x - .5) * 34) + 'deg'); p.style.setProperty('--rx', fuera ? '6deg' : (-(y - .5) * 22) + 'deg'); });
});

/* 1E · tocar una foto la cuelga en el siguiente hueco */
(function(){
  const raiz = $('#n1e'); if(!raiz) return;
  const huecos = $$('.h', raiz), botones = $$('.tira button', raiz);
  const PRECIO = h => h.classList.contains('g') ? 69.99 : 34.99;     // 30×40 en el centro, 18×24 alrededor
  const orden = [2, 1, 3, 0, 4];                                        // se llena desde el centro
  let auto = true;
  const pinta = () => {
    const llenos = huecos.filter(h => h.classList.contains('lleno'));
    const c = conDto(llenos.reduce((s, h) => s + PRECIO(h), 0), llenos.length);
    $('.np', raiz).textContent = llenos.length + ' de 5 cuadros' + (c.p ? ' · -' + c.p + ' %' : '');
    $('.tot', raiz).innerHTML = (c.p ? '<s>' + eur(c.bruto) + '</s>' : '') + eur(c.total);
  };
  const colgar = (b, rapido) => {
    const h = orden.map(i => huecos[i]).find(h => !h.classList.contains('lleno')); if(!h) return;
    const img = b.dataset.img; b.classList.add('usada');
    const a = b.getBoundingClientRect(), z = h.getBoundingClientRect();
    if(rapido || !a.width){ h.style.backgroundImage = 'url(' + img + ')'; h.classList.add('lleno'); h.textContent = ''; return pinta(); }
    const v = document.createElement('div'); v.className = 'vuelo';
    Object.assign(v.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', backgroundImage: 'url(' + img + ')' });
    document.body.appendChild(v);
    requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(v.style, { left: z.left + 'px', top: z.top + 'px', width: z.width + 'px', height: z.height + 'px' })));
    setTimeout(() => { h.style.backgroundImage = 'url(' + img + ')'; h.classList.add('lleno'); h.textContent = ''; v.remove(); pinta(); }, 720);
  };
  botones.forEach(b => b.onclick = () => { auto = false; colgar(b); });
  $('.otra', raiz).onclick = () => { auto = false; huecos.forEach(h => { h.classList.remove('lleno'); h.style.backgroundImage = ''; h.textContent = '+'; }); botones.forEach(b => b.classList.remove('usada')); pinta(); };
  // si nadie toca nada, la pared se va llenando sola (2 fotos) para que se entienda
  visible(raiz, () => { let k = 0; const t = setInterval(() => { if(!auto || k >= 2 || !raiz.offsetParent){ clearInterval(t); return; } colgar(botones[k++]); }, 1400); });
  pinta();
})();

/* 2D · el móvil cambia de pantalla según el paso que se lee */
(function(){
  const raiz = $('#n2d'); if(!raiz) return;
  const pasos = $$('.paso[data-k]', raiz), pant = $$('.pant > div', raiz);
  const activa = k => { pasos.forEach(p => p.classList.toggle('on', p.dataset.k == k)); pant.forEach(p => p.classList.toggle('on', p.dataset.k == k)); };
  activa(0);
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting) activa(e.target.dataset.k); }), { rootMargin: '-45% 0px -45% 0px' });
    pasos.forEach(p => io.observe(p));
  }
})();

/* 2E · las cuatro hojas de calendario con fechas reales desde hoy (solo días laborables) */
(function(){
  const linea = $('#n2eLinea'); if(!linea) return;
  const hoy = new Date();
  const mas = (f, n) => { const d = new Date(f); let k = 0; while(k < n){ d.setDate(d.getDate() + 1); if(d.getDay() % 6) k++; } return d; };
  const mes = new Intl.DateTimeFormat('es-ES', { month: 'long' }), sem = new Intl.DateTimeFormat('es-ES', { weekday: 'long' });
  const imp = mas(hoy, 2), llega = mas(imp, 5);
  const D = [
    [hoy, 'Hoy', 'Eliges las fotos, las ves en tu pared y haces el pedido. Dos minutos desde el sofá.', '-3deg'],
    [mas(hoy, 1), 'Imprimimos', 'Revisamos tu archivo, lo imprimimos sobre el aluminio y le ponemos el imán.', '2deg'],
    [imp, 'Sale de aquí', 'Bien protegido, con las bases adhesivas y tu dedicatoria si la pusiste.', '-1deg'],
    [llega, 'Ya está colgado', 'Como muy tarde este día te llega. Pegas la base, acercas el cuadro y listo.', '3deg'],
  ];
  linea.innerHTML = D.map(([f, t, p, r], k) => `<div class="dia${k === 3 ? ' fin' : ''}"><div class="hoja" style="--r:${r}"><div class="mes">${mes.format(f)}</div><div class="num">${f.getDate()}</div><div class="sem">${sem.format(f)}</div></div><b>${t}</b><p>${p}</p></div>`).join('');
})();

/* 3D · una luz sigue al dedo; si nadie lo toca, se mueve sola */
(function(){
  const c = $('#n3dCuadro'); if(!c) return;
  let quieto = true, t = 0;
  const pon = (x, y) => { c.style.setProperty('--x', x * 100 + '%'); c.style.setProperty('--y', y * 100 + '%'); c.style.setProperty('--ang', (90 + x * 90) + 'deg'); };
  inclinar(c, (x, y, fuera) => { quieto = !!fuera; if(!fuera) pon(x, y); });
  const paseo = () => { if(quieto && c.offsetParent){ t += .012; pon(.5 + Math.sin(t) * .38, .4 + Math.sin(t * 1.7) * .25); } requestAnimationFrame(paseo); };
  paseo();
})();

/* 3E · barra papel / aluminio */
$$('#n3eComp').forEach(c => { const r = $('input', c); r.oninput = () => c.style.setProperty('--p', r.value + '%'); });

/* 4E · tarjetas que se inclinan con brillo */
$$('.n4e [data-tilt-card]').forEach(card => inclinar(card, (x, y, fuera) => {
  card.style.setProperty('--ry', fuera ? '0deg' : ((x - .5) * 16) + 'deg');
  card.style.setProperty('--rx', fuera ? '0deg' : (-(y - .5) * 12) + 'deg');
  card.style.setProperty('--gx', x * 100 + '%'); card.style.setProperty('--gy', y * 100 + '%');
}));

/* 5D · martillo o imán */
(function(){
  const raiz = $('#n5d'); if(!raiz) return;
  const pared = $('.pared', raiz), cu = $('.cu', raiz);
  let modo = 'martillo', ag = 0, mov = 0;
  const marcador = () => { $('.nAg', raiz).textContent = ag; $('.nMov', raiz).textContent = mov; $('.mal', raiz).classList.toggle('mal', true); };
  $$('.modo button', raiz).forEach(b => b.onclick = () => { modo = b.dataset.m; $$('.modo button', raiz).forEach(x => x.classList.toggle('on', x === b)); $('.pista', pared).textContent = modo === 'iman' ? 'Ahora con imán: toca la pared' : 'Toca la pared'; });
  pared.onclick = e => {
    const r = pared.getBoundingClientRect();
    const x = Math.min(88, Math.max(12, (e.clientX - r.left) / r.width * 100)), y = Math.min(62, Math.max(18, (e.clientY - r.top) / r.height * 100));
    if(modo === 'martillo'){
      // el clavo se queda donde estaba el cuadro (un poco por encima del centro)
      const h = document.createElement('i'); h.className = 'ag';
      h.style.left = cu.style.left; h.style.top = 'calc(' + cu.style.top + ' - 7%)';
      pared.appendChild(h); ag++;
      pared.classList.remove('golpe'); void pared.offsetWidth; pared.classList.add('golpe');
    }
    cu.style.left = x + '%'; cu.style.top = y + '%'; mov++; marcador();
  };
  $('.reset', raiz).onclick = () => { $$('.ag', pared).forEach(a => a.remove()); ag = mov = 0; cu.style.left = '50%'; cu.style.top = '34%'; marcador(); };
})();

/* 6D · la pared de 15 cambia de tema sola; también se elige */
(function(){
  const raiz = $('#n6d'); if(!raiz) return;
  const F = s => s === '1474552226712' || s === '1491013516836' ? `../fotos/stock/${s}-620x877.webp` : `../fotos/stock/${s}-480x640.webp`;
  const TEMAS = {
    'Día a día': ['1603367563698','1586498024141','1752652011858','1624272864537','1758686254601','1770831208268','1472719674214','1548858806','1606983340126','1655141011386','1738956952892','1557495235','1750076912832','1586498024141','1603367563698'],
    'Verano':    ['1474552226712','1655141011386','1603367563698','1557495235','1738956952892','1474552226712','1750076912832','1548858806','1655141011386','1557495235','1603367563698','1738956952892','1474552226712','1750076912832','1548858806'],
    'Cumpleaños':['1606983340126','1752652011858','1491013516836','1606983340126','1624272864537','1472719674214','1606983340126','1770831208268','1586498024141','1606983340126','1752652011858','1491013516836','1758686254601','1606983340126','1624272864537'],
    'Los peques':['1491013516836','1770831208268','1472719674214','1624272864537','1491013516836','1548858806','1752652011858','1770831208268','1586498024141','1491013516836','1472719674214','1624272864537','1603367563698','1770831208268','1548858806'],
  };
  const nombres = Object.keys(TEMAS), tiles = $$('.tile', raiz), caja = $('.temas', raiz);
  let actual = 0, cara = false, reloj = null;
  caja.innerHTML = nombres.map((n, k) => `<button type="button" data-k="${k}">${n}<u></u></button>`).join('');
  tiles.forEach((t, i) => { $('.a', t).style.backgroundImage = `url(${F(TEMAS[nombres[0]][i])})`; });
  const ir = (k) => {
    actual = k;
    $$('button', caja).forEach(b => { b.classList.remove('on'); void b.offsetWidth; b.classList.toggle('on', +b.dataset.k === k); });
    cara = !cara;
    tiles.forEach((t, i) => {
      $(cara ? '.b' : '.a', t).style.backgroundImage = `url(${F(TEMAS[nombres[k]][i])})`;
      setTimeout(() => t.classList.toggle('vuelta', cara), (i % 5) * 70 + Math.floor(i / 5) * 110);
    });
  };
  const siguiente = () => { if(raiz.offsetParent) ir((actual + 1) % nombres.length); };
  const arrancar = () => { clearInterval(reloj); reloj = setInterval(siguiente, 4500); };
  caja.onclick = e => { const b = e.target.closest('button'); if(!b) return; ir(+b.dataset.k); arrancar(); };
  $$('button', caja)[0].classList.add('on');
  visible(raiz, arrancar);
})();

/* 6E · tocar dos cuadros los intercambia (con animación) */
(function(){
  const raiz = $('#n6e'); if(!raiz) return;
  let sel = null, n = 0;
  $$('.rej button', raiz).forEach(b => b.onclick = () => {
    if(!sel){ sel = b; b.classList.add('sel'); return; }
    if(sel === b){ b.classList.remove('sel'); sel = null; return; }
    const a = sel, ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    a.style.transition = b.style.transition = 'none';
    const ia = a.style.backgroundImage; a.style.backgroundImage = b.style.backgroundImage; b.style.backgroundImage = ia;
    a.style.transform = `translate(${rb.left - ra.left}px,${rb.top - ra.top}px)`; b.style.transform = `translate(${ra.left - rb.left}px,${ra.top - rb.top}px)`;
    requestAnimationFrame(() => requestAnimationFrame(() => { a.style.transition = b.style.transition = ''; a.style.transform = b.style.transform = ''; }));
    a.classList.remove('sel'); sel = null; $('.nCam', raiz).textContent = ++n;
  });
})();

/* 7D · el regalo según tres respuestas */
(function(){
  const raiz = $('#n7d'); if(!raiz) return;
  const P = {
    pareja:  ['quien-pareja',  'tu pareja',     'Para ti, que me aguantas'],
    padres:  ['quien-padres',  'tus padres',    'Gracias por todo, mamá y papá'],
    abuelos: ['quien-abuelos', 'los abuelos',   'Para los mejores abuelos'],
    amigos:  ['quien-amigos',  'tus amigos',    'Por muchos viajes más'],
    hijos:   ['quien-hijos',   'los peques',    'Para que nunca se te olvide'],
    mascota: ['quien-mascota', 'la mascota',    'La que manda en casa'],
  };
  const D = {
    pared:  { nom: ['un cuadro', 'cuadros'], med: '18×24', precio: 34.99, img: null, txt: 'Para colgar sin agujeros, con el imán premium incluido.' },
    mesa:   { nom: ['un sobremesa', 'sobremesas'], med: '10×15', precio: 28.99, img: '../fotos/producto-sobremesa.jpg', txt: 'Con su peana de bambú, listo para la mesita o el escritorio.' },
    nevera: { nom: ['un imán', 'imanes'], med: '7×10', precio: 9.99, img: '../fotos/producto-iman-nevera.jpg', txt: 'Pequeño y con imán detrás, para verlo cada mañana en la nevera.' },
  };
  const NUM = { 1: '', 3: 'tres', 5: 'cinco' };
  const st = { p: 'pareja', d: 'pared', n: '3' };
  const pinta = () => {
    const p = P[st.p], d = D[st.d], n = +st.n;
    const c = conDto(d.precio * n, n);
    const img = $('.img', raiz); img.style.opacity = 0;
    setTimeout(() => { img.style.backgroundImage = `url(${d.img || '../fotos/combis/' + p[0] + '.webp'})`; img.style.opacity = 1; }, 180);
    $('.ded', raiz).textContent = p[2];
    const t = (n === 1 ? d.nom[0] : NUM[n] + ' ' + d.nom[1]) + ' de ' + d.med + ' para ' + p[1];
    $('.tit', raiz).textContent = t.charAt(0).toUpperCase() + t.slice(1);
    $('.txt', raiz).textContent = d.txt + ' Y detrás, su dedicatoria impresa.';
    $('.pr', raiz).innerHTML = (c.p ? '<s>' + eur(c.bruto) + '</s>' : '') + eur(c.total) + (c.p ? ' <span style="font-size:13px;color:var(--green);font-weight:700">-' + c.p + ' %</span>' : '');
  };
  $$('.ops', raiz).forEach(g => g.onclick = e => { const b = e.target.closest('button'); if(!b) return; $$('button', g).forEach(x => x.classList.toggle('on', x === b)); st[g.dataset.q] = b.dataset.v; pinta(); });
  pinta();
})();

/* 7E · las cintas se duplican para que el bucle no tenga corte */
$$('.n7e [data-dup]').forEach(c => { c.innerHTML += c.innerHTML; });

/* 9D y 9E · preguntas */
const PREG = [
  ['¿Cómo se cuelga sin clavos?', 'Cada pedido lleva una base adhesiva que pegas en la pared, sin herramientas. El cuadro tiene un imán detrás y se engancha encima. Sin marcas ni agujeros, y lo recolocas cuando quieras.', '../fotos/producto-hero-pared.jpg'],
  ['¿Vale cualquier foto del móvil?', 'Casi todas. Una foto hecha con el móvil a tamaño completo va bien hasta el tamaño grande. Lo que no funciona son las capturas de pantalla ni las fotos reenviadas por WhatsApp. Si se queda corta, el editor te avisa antes de pagar.', '../fotos/stock/1548858806-480x640.webp'],
  ['¿Cambian los colores al imprimir?', 'El brillo del aluminio realza los colores y el contraste frente al papel mate. Puede haber pequeñas diferencias con tu pantalla, que no está calibrada. Mejor una foto con buena luz natural.', '../fotos/ventajas-brillo.jpg'],
  ['¿Puedo mandarlo directamente como regalo?', 'Sí. Pon la dirección de quien lo recibe y añade una nota en los comentarios del pedido. El precio no aparece dentro del paquete.', '../fotos/combis/quien-abuelos.webp'],
  ['¿Y si llega dañado?', 'Escríbenos a hola@momenturies.com con una foto del problema y lo volvemos a imprimir sin coste. No hace falta devolver el primero.', '../fotos/producto-metalico.jpg'],
  ['¿Puedo añadir una dedicatoria?', 'Sí. En el editor escribes una dedicatoria para el dorso, con la letra que elijas. Es opcional y no cuesta más.', '../fotos/producto-sobremesa.jpg'],
];
(function(){
  const raiz = $('#n9d'); if(!raiz) return;
  const lista = $('.lista', raiz), img = $('.resp .img', raiz);
  lista.innerHTML = PREG.map((q, k) => `<button type="button" data-k="${k}">${q[0]}</button><p class="movil" hidden>${q[1]}</p>`).join('');
  const ir = k => {
    $$('button', lista).forEach(b => b.classList.toggle('on', +b.dataset.k === k));
    $$('.movil', lista).forEach((p, j) => p.hidden = j !== k);
    img.style.opacity = 0;
    setTimeout(() => { img.style.backgroundImage = `url(${PREG[k][2]})`; img.style.opacity = 1; }, 150);
    $('.resp b', raiz).textContent = PREG[k][0]; $('.resp p', raiz).textContent = PREG[k][1];
  };
  lista.onclick = e => { const b = e.target.closest('button'); if(b) ir(+b.dataset.k); };
  ir(0);
})();
(function(){
  const raiz = $('#n9e'); if(!raiz) return;
  const M = [
    ['Hace falta taladro para colgarlo.', 'm', 'Mito', 'Una base adhesiva en la pared y un imán detrás del cuadro. Ni taladro, ni clavos, ni tacos.'],
    ['Si te cansas, se cambia de sitio sin dejar marca.', 'v', 'Verdad', 'El cuadro se despega del imán en un segundo. Lo pones en otra base y queda recto.'],
    ['Cualquier foto del móvil vale.', 'a', 'Casi', 'Las fotos del móvil a tamaño completo, sí. Las capturas y las reenviadas por WhatsApp, no. El editor te avisa antes de pagar.'],
    ['Si llega dañado, te toca pelearte.', 'm', 'Mito', 'Nos mandas una foto a hola@momenturies.com y lo volvemos a imprimir sin coste. No hace falta devolver el primero.'],
    ['Se puede limpiar con agua.', 'v', 'Verdad', 'Con un paño suave un poco húmedo. Al ser aluminio no se ondula, así que aguanta bien en la cocina o el baño.'],
    ['El precio va dentro del paquete del regalo.', 'm', 'Mito', 'Si lo mandas a otra dirección, el precio no aparece dentro. Puedes añadir una nota en los comentarios del pedido.'],
  ];
  const g = $('.g', raiz); let vistas = new Set();
  g.innerHTML = M.map((m, k) => `<button type="button" class="f" data-k="${k}"><div class="del"><b>«${m[0]}»</b><span>Toca para saberlo ↻</span></div><div class="det"><em class="${m[1]}">${m[2].toUpperCase()}</em><p>${m[3]}</p></div></button>`).join('');
  g.onclick = e => { const f = e.target.closest('.f'); if(!f) return; f.classList.toggle('vuelta'); vistas.add(f.dataset.k); $('.nGir', raiz).textContent = vistas.size; };
})();

/* 10D · cuenta atrás al 27 de noviembre (hora de Madrid) y el sobre */
(function(){
  const raiz = $('#n10d'); if(!raiz) return;
  const meta = new Date('2026-11-27T00:00:00+01:00').getTime(), cajas = $$('#n10dReloj b', raiz);
  const tic = () => { let s = Math.max(0, Math.floor((meta - Date.now()) / 1000)); const v = [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]; cajas.forEach((c, k) => c.textContent = String(v[k]).padStart(2, '0')); };
  tic(); setInterval(tic, 1000);
  $('form', raiz).onsubmit = e => { e.preventDefault(); $('.carta', raiz).classList.add('hecho'); };
})();

/* 10E · los 100 huecos; al apuntarse se enciende uno */
(function(){
  const raiz = $('#n10e'); if(!raiz) return;
  const cien = $('.cien', raiz);
  cien.innerHTML = Array.from({ length: 100 }, (_, k) => `<i style="--k:${(k % 10) + Math.floor(k / 10)}" title="Pared nº ${k + 1}">${k + 1}</i>`).join('');
  $('form', raiz).onsubmit = e => {
    e.preventDefault();
    const libres = $$('i:not(.tuyo)', cien); if(!libres.length) return;
    const h = libres[Math.floor(Math.random() * Math.min(libres.length, 30))];
    h.classList.add('tuyo'); $('.tu', raiz).innerHTML = 'La tuya: <b>nº ' + h.textContent + '</b>';
    $('button', e.target).textContent = '¡Guardado!';
  };
})();
})();
