/* Soluciones · página de producto. Cambiar de versión + la interacción de cada una. */
(function(){
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const eur = n => n.toFixed(2).replace('.', ',') + ' €';
const TRAMOS = [[4, 20], [3, 15], [2, 10]];
const pctDe = n => { const t = TRAMOS.find(t => n >= t[0]); return t ? t[1] : 0; };
const visible = (el, cb) => { if(!('IntersectionObserver' in window)) return cb(); const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ cb(); io.disconnect(); } }), { threshold: .3 }); io.observe(el); };

/* ── barra de versiones (como portada.html); se recuerda en este navegador ── */
const guardar = (k, v) => { try{ localStorage.setItem('sol-producto-' + k, v); }catch(e){} };
const leer = (k) => { try{ return +localStorage.getItem('sol-producto-' + k) || 0; }catch(e){ return 0; } };
const secciones = $$('.sec');
secciones.forEach(sec => {
  const vs = $$(':scope > .var', sec), n = sec.dataset.n;
  const bar = document.createElement('div'); bar.className = 'bar';
  bar.innerHTML = `<span class="n">${n} · ${sec.dataset.t}</span><button type="button" aria-label="Anterior">‹</button><span class="lab"></span><span class="dots">${vs.map(() => '<i></i>').join('')}</span><button type="button" aria-label="Siguiente">›</button>`;
  sec.prepend(bar);
  const qv = new URLSearchParams(location.search).get('v');   // ?v=ABCDE… fuerza una versión por sección
  let i = Math.min(qv && qv[n - 1] ? qv.charCodeAt(n - 1) - 65 : leer(n), vs.length - 1);
  const pintar = () => {
    vs.forEach((v, k) => v.classList.toggle('on', k === i));
    bar.querySelector('.lab').innerHTML = `<b>${String.fromCharCode(65 + i)}</b> · ${vs[i].dataset.l} <span style="opacity:.5">(${i + 1}/${vs.length})</span>`;
    $$('.dots i', bar).forEach((d, k) => d.classList.toggle('on', k === i));
    guardar(n, i);
    vs[i].dispatchEvent(new CustomEvent('visible'));
  };
  sec.mover = d => { i = (i + d + vs.length) % vs.length; pintar(); };
  const [prev, next] = $$('button', bar);
  prev.onclick = () => sec.mover(-1); next.onclick = () => sec.mover(1);
  pintar();
});
document.addEventListener('keydown', e => {
  if(e.target.closest('input,textarea') || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
  const mitad = innerHeight / 2, s = secciones.find(s => { const r = s.getBoundingClientRect(); return r.top <= mitad && r.bottom >= mitad; });
  if(s) s.mover(e.key === 'ArrowRight' ? 1 : -1);
});

$$('[data-vivo]').forEach(el => visible(el, () => el.classList.add('vivo')));
$$('[data-dup]').forEach(c => { c.innerHTML += c.innerHTML; });

/* ── 1 · compra: formatos y tallas con existencias (los mismos precios que la tienda) ── */
const FORMATOS = {
  cuadrado: { nom: 'Cuadrado · 1:1', w: 16, h: 16, tallas: [{ d: '30 × 30 cm', p: 54.99, cm: [30, 30] }] },
  clasico:  { nom: 'Clásico · 2:3',  w: 14, h: 20, tallas: [{ d: '10 × 15 cm', p: 17.99, cm: [10, 15] }] },
  retrato:  { nom: 'Retrato · 3:4',  w: 15, h: 20, tallas: [{ d: '12 × 16 cm', p: 19.99, cm: [12, 16] }, { d: '18 × 24 cm', p: 34.99, cm: [18, 24] }, { d: '30 × 40 cm', p: 69.99, cm: [30, 40] }] },
};
function compra(raiz, alCambiar){
  const st = { f: 'retrato', t: 1 };
  const fBox = $('[data-fmts]', raiz), tBox = $('[data-tallas]', raiz), solo = tBox && tBox.dataset.solo;
  const pinta = () => {
    const F = FORMATOS[st.f], T = F.tallas[st.t];
    if(fBox) fBox.innerHTML = Object.entries(FORMATOS).map(([k, f]) => `<button type="button" class="chip${k === st.f ? ' on' : ''}" data-f="${k}"><span class="fmt-ico" style="width:${f.w}px;height:${f.h}px"></span>${f.nom.split(' · ')[0]}<small>desde ${eur(f.tallas[0].p)}</small></button>`).join('');
    if(tBox) tBox.innerHTML = (solo ? FORMATOS[solo] : F).tallas.map((t, k) => `<button type="button" class="chip${k === st.t ? ' on' : ''}" data-t="${k}">${t.d}<small>${eur(t.p)}</small></button>`).join('');
    $$('[data-precio]', raiz).forEach(p => p.firstChild.nodeValue = eur(T.p));
    $$('[data-med]', raiz).forEach(m => m.textContent = T.d);
    $$('[data-fmt-nom]', raiz).forEach(m => m.textContent = F.nom);
    if(alCambiar) alCambiar(T, F);
  };
  raiz.addEventListener('click', e => {
    const f = e.target.closest('[data-f]'), t = e.target.closest('[data-t]'), c = e.target.closest('[data-colg] .chip');
    if(f){ st.f = f.dataset.f; st.t = st.f === 'retrato' ? 1 : 0; pinta(); }
    if(t){ st.t = +t.dataset.t; pinta(); }
    if(c){ $$('[data-colg] .chip', raiz).forEach(x => x.classList.toggle('on', x === c)); }
  });
  if(solo) st.f = solo;
  pinta();
}
['#p1a', '#p1b'].forEach(s => { const r = $(s); if(r) compra(r); });
(function(){
  const r = $('#p1a'); if(!r) return;
  $$('.mini button', r).forEach(b => b.onclick = () => { $$('.mini button', r).forEach(x => x.classList.toggle('on', x === b)); $('.grande', r).style.backgroundImage = `url(${b.dataset.img})`; });
})();
/* 1C · la foto en el salón, a su tamaño real (salon-lino: 3,45 px por cm sobre 1536 px de ancho) */
(function(){
  const r = $('#p1c'); if(!r) return;
  const sala = $('.sala', r), cu = $('.cu', r), inp = $('input[type=file]', r);
  const escala = T => {
    // la foto de fondo va en «cover»: se calcula cuánto mide un cm en pantalla
    // fondo a «auto 175%» del alto: cada píxel de la foto mide 1,75·alto/1024 en pantalla
    const k = sala.clientHeight * 1.75 / 1024, pxcm = 3.45 * k * 1.15;
    cu.style.width = (T.cm[0] * pxcm) + 'px'; cu.style.height = (T.cm[1] * pxcm) + 'px';
    $('.med', r).textContent = T.d;
  };
  let ultima = FORMATOS.retrato.tallas[1];
  compra(r, T => { ultima = T; escala(T); });
  addEventListener('resize', () => escala(ultima));
  r.closest('.var').addEventListener('visible', () => setTimeout(() => escala(ultima), 50));
  $('.subir', r).onclick = () => inp.click();
  inp.onchange = () => { const f = inp.files[0]; if(f) cu.style.backgroundImage = `url(${URL.createObjectURL(f)})`; };
})();
/* 1E · cuántos */
(function(){
  const r = $('#p1e'); if(!r) return;
  const fotos = ['1738956952892','1586498024141','1557495235','1752652011858','1655141011386','1624272864537'];
  const pinta = n => {
    const bruto = 34.99 * n, pct = pctDe(n), tot = bruto * (1 - pct / 100);
    $('.total s', r).textContent = pct ? eur(bruto) : '';
    $('.total b', r).textContent = eur(tot);
    $('.total span', r).textContent = n > 1 ? eur(tot / n) + ' cada uno' : 'IVA incluido';
    const rej = $('.rej', r);
    rej.style.gridTemplateColumns = `repeat(${n === 4 ? 2 : n},auto)`;
    rej.innerHTML = fotos.slice(0, n).map(f => `<i style="background-image:url(../fotos/stock/${f}-480x640.webp)"></i>`).join('');
  };
  $$('.cuantos button', r).forEach(b => b.onclick = () => { $$('.cuantos button', r).forEach(x => x.classList.toggle('on', x === b)); pinta(+b.dataset.n); });
  pinta(3);
})();

/* ── 3 · pasos ── */
(function(){
  const r = $('#p3a'); if(!r) return;
  const li = $$('li', r), img = $('.img', r); let k = 0, t;
  const ir = j => { k = j; li.forEach((l, i) => { l.classList.remove('on'); void l.offsetWidth; l.classList.toggle('on', i === j); }); img.style.backgroundImage = `url(${li[j].dataset.img})`; clearTimeout(t); t = setTimeout(() => ir((k + 1) % li.length), 4000); };
  li.forEach((l, i) => l.onclick = () => ir(i));
  ir(0);
})();
(function(){
  const r = $('#p3d'); if(!r) return;
  const riel = $('.riel', r);
  $$('.ctrl button', r).forEach(b => b.onclick = () => riel.scrollBy({ left: +b.dataset.d * (riel.firstElementChild.offsetWidth + 20), behavior: 'smooth' }));
})();
(function(){
  const r = $('#p3e'); if(!r) return;
  const v = $('video', r), bs = $$('.caps button', r);
  r.closest('.var').addEventListener('visible', () => { v.preload = 'auto'; v.play().catch(() => {}); });
  bs.forEach((b, k) => b.onclick = () => { if(v.duration) v.currentTime = v.duration * k / bs.length; v.play().catch(() => {}); });
  v.addEventListener('timeupdate', () => {
    if(!v.duration) return;
    const p = v.currentTime / v.duration * bs.length, k = Math.min(bs.length - 1, Math.floor(p));
    bs.forEach((b, j) => b.classList.toggle('on', j === k));
    $('u', bs[k]).style.width = ((p - k) * 100) + '%';
  });
})();

/* ── 4 · cronómetro ── */
(function(){
  const r = $('#p4d'); if(!r) return;
  const seg = $('.seg', r), est = $('.estado', r), ps = $$('.pasos span', r);
  let t0 = 0;
  const vuelta = () => {
    if(!r.offsetParent){ requestAnimationFrame(vuelta); return; }
    if(!t0) t0 = performance.now();
    const s = (performance.now() - t0) / 1000, c = s % 14;
    const v = Math.min(10, c);
    seg.textContent = v < 10 ? v.toFixed(1).replace('.', ',') : '10';
    const paso = c < 4 ? 0 : c < 9 ? 1 : 2;
    ps.forEach((p, i) => p.classList.toggle('on', i <= paso && c < 13.5));
    est.textContent = c < 4 ? 'Pegas la base…' : c < 9 ? 'Acercas el cuadro…' : '¡Colgado!';
    requestAnimationFrame(vuelta);
  };
  vuelta();
})();

/* ── 5 · comparadores ── */
$$('#p5aComp').forEach(c => { const i = $('input', c); i.oninput = () => c.style.setProperty('--p', i.value + '%'); });
(function(){
  const r = $('#p5c'); if(!r) return;
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
(function(){
  const r = $('#p5d'); if(!r) return;
  const esc = $('.esc', r);
  $$('.switch button', r).forEach(b => b.onclick = () => {
    const m = b.dataset.m;
    $$('.switch button', r).forEach(x => x.classList.toggle('on', x === b));
    esc.className = 'esc ' + m;
    $('ul', r).classList.toggle('metal-on', m === 'metal');
    $$('li b', r).forEach(x => x.textContent = m === 'metal' ? x.dataset.a : x.dataset.b);
  });
})();

/* ── 6 · paredes (datos reales de paredes.js, solo las que tienen existencias) ── */
const PAREDES = (window.MOMENTURIES_WALLS || []).filter(w => !w.soldOut);
const precioPared = w => { const p = pctDe(w.n); return { bruto: w.price, total: Math.round(w.price * (1 - p / 100) * 100) / 100, p }; };
const enlace = w => `../cuadro.html?pared=${w.id}`;
const tarjeta = w => { const c = precioPared(w); return `<a class="wcard" href="${enlace(w)}"><div class="img" style="background-image:url(../fotos/paredes/${w.id}-1.webp)"></div><b>${w.name}</b><span>${w.n} cuadros · <s>${eur(c.bruto)}</s>${eur(c.total)}<em>-${c.p} %</em></span></a>`; };
(function(){
  const r = $('#p6a'); if(!r) return;
  const riel = $('.riel', r);
  riel.innerHTML = PAREDES.slice().sort((a, b) => a.n - b.n).filter((w, i) => i % 2 === 0).slice(0, 12).map(tarjeta).join('');
  $$('.ctrl button', r).forEach(b => b.onclick = () => riel.scrollBy({ left: +b.dataset.d * 556, behavior: 'smooth' }));
})();
(function(){
  const r = $('#p6b'); if(!r) return;
  const g = $('.g', r);
  const pinta = h => { g.innerHTML = PAREDES.filter(w => w.cat === h).slice(0, 8).map(tarjeta).join(''); };
  $$('.fil .chip', r).forEach(b => b.onclick = () => { $$('.fil .chip', r).forEach(x => x.classList.toggle('on', x === b)); pinta(b.dataset.h); });
  pinta('s');
})();
(function(){
  const r = $('#p6c'); if(!r) return;
  const sel = ['W21', 'W20', 'W42', 'W25', 'W46', 'W53'].map(id => PAREDES.find(w => w.id === id)).filter(Boolean);
  const lista = $('.lista', r);
  lista.innerHTML = sel.map((w, k) => { const c = precioPared(w); return `<button type="button" data-k="${k}"><i style="background-image:url(../fotos/paredes/${w.id}-1.webp)"></i><span><b>${w.name}</b><span>${w.n} cuadros · ${w.room || ''}</span></span><em>${eur(c.total)}</em></button>`; }).join('');
  const ir = k => {
    const w = sel[k], c = precioPared(w), img = $('.grande .img', r);
    $$('button', lista).forEach(b => b.classList.toggle('on', +b.dataset.k === k));
    img.style.opacity = 0;
    setTimeout(() => { img.style.backgroundImage = `url(../fotos/paredes/${w.id}-2.webp), url(../fotos/paredes/${w.id}-1.webp)`; img.style.opacity = 1; }, 150);
    $('.info b', r).textContent = w.name;
    $('.info span', r).innerHTML = `${w.n} cuadros · <s style="color:#9ca3af">${eur(c.bruto)}</s> <b style="display:inline;font:700 14px Inter,Arial">${eur(c.total)}</b>`;
    $('.info a', r).href = enlace(w);
  };
  lista.onclick = e => { const b = e.target.closest('button'); if(b) ir(+b.dataset.k); };
  ir(0);
})();
$$('[data-walls-mas]').forEach(m => {
  m.innerHTML = PAREDES.filter((w, i) => i % 2 === 1).slice(0, 12).map(w => { const c = precioPared(w); return `<a href="${enlace(w)}"><img src="../fotos/paredes/${w.id}-${1 + (w.n % 3)}.webp" alt="${w.name}" loading="lazy"/><div><b>${w.name}</b><span>${w.n} cuadros · ${eur(c.total)}</span></div></a>`; }).join('');
});
(function(){
  const r = $('#p6e'); if(!r) return;
  const nums = [...new Set(PAREDES.map(w => w.n))].sort((a, b) => a - b);
  let k = nums.indexOf(4); if(k < 0) k = 0;
  const pinta = () => {
    const n = nums[k]; $('.num b', r).textContent = n;
    const ws = PAREDES.filter(w => w.n === n).slice(0, 6);
    $('.g', r).innerHTML = ws.length ? ws.map(tarjeta).join('') : '<p class="vacio">Para ese número aún no hay paredes con existencias.</p>';
  };
  $$('.num button', r).forEach(b => b.onclick = () => { k = Math.max(0, Math.min(nums.length - 1, k + +b.dataset.d)); pinta(); });
  pinta();
})();

/* ── 8 · preguntas (las mismas respuestas que la ficha actual) ── */
const FAQ = [
  ['foto', '¿Vale cualquier foto del móvil?', 'Casi todas. Una foto hecha con el móvil a tamaño completo llega bien hasta el tamaño grande. Lo que no funciona son las capturas de pantalla ni las fotos reenviadas por WhatsApp, que llegan comprimidas. Si tu foto se queda corta para el tamaño que elijas, el editor te avisa antes de pagar.'],
  ['colgar', '¿De verdad aguanta sin clavos?', 'Sí. La base adhesiva va pegada a la pared y el cuadro se engancha encima con el imán. Aguanta el peso de la plancha de aluminio, que pesa poco, y se recoloca las veces que quieras. Al retirar la base no quedan agujeros ni marcas.'],
  ['envio', '¿Cuánto tarda en llegar?', 'Lo imprimimos en 1-2 días laborables. El envío a España suele tardar 3-5 días laborables más, y al resto de Europa algo más. Verás el plazo y el precio exactos antes de pagar. A partir de 60 € el envío a España es gratis.'],
  ['envio', '¿Puedo devolverlo?', 'Cada pieza se fabrica con tu foto, así que no tiene derecho de desistimiento (art. 103.c de la Ley de Consumidores). Si llega con un defecto o dañado, lo reimprimimos y reenviamos sin coste: escríbenos con una foto en los 14 días siguientes y no hace falta devolver el primero.'],
  ['regalo', '¿Puedo mandarlo directamente como regalo?', 'Sí. Pones una dirección de entrega distinta a la tuya y añades una nota en los comentarios del pedido. El precio no aparece dentro del paquete, y la dedicatoria del dorso la lee solo quien lo descuelgue.'],
  ['regalo', '¿Cómo funciona la dedicatoria?', 'En el editor escribes unas palabras para el dorso y eliges la letra. Va impresa detrás del cuadro. Es opcional y no cuesta más.'],
];
const TEMAS = { foto: 'La foto', colgar: 'El colgado', envio: 'Envío y devoluciones', regalo: 'Para regalar' };
$$('[data-faq="acordeon"]').forEach(g => { const m = Math.ceil(FAQ.length / 2); g.innerHTML = [FAQ.slice(0, m), FAQ.slice(m)].map(col => '<div>' + col.map(f => `<details><summary>${f[1]}</summary><p>${f[2]}</p></details>`).join('') + '</div>').join(''); });
$$('[data-faq="lista"]').forEach(g => { g.innerHTML = FAQ.map(f => `<div class="q"><div><b>${f[1]}</b><p>${f[2]}</p></div></div>`).join(''); });
(function(){
  const r = $('#p8b'); if(!r) return;
  const tabs = $('.tabs', r), panel = $('.panel', r);
  tabs.innerHTML = Object.entries(TEMAS).map(([k, t], i) => `<button type="button" class="chip${i ? '' : ' on'}" data-k="${k}">${t}</button>`).join('');
  const pinta = k => { panel.innerHTML = FAQ.filter(f => f[0] === k).map(f => `<div><b>${f[1]}</b><p>${f[2]}</p></div>`).join(''); };
  tabs.onclick = e => { const b = e.target.closest('button'); if(!b) return; $$('button', tabs).forEach(x => x.classList.toggle('on', x === b)); pinta(b.dataset.k); };
  pinta('foto');
})();
(function(){
  const r = $('#p8c'); if(!r) return;
  const inp = $('input', r), res = $('.res', r);
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const marca = (t, q) => { if(!q) return t; const i = norm(t).indexOf(q); return i < 0 ? t : t.slice(0, i) + '<mark>' + t.slice(i, i + q.length) + '</mark>' + t.slice(i + q.length); };
  const pinta = () => {
    const q = norm(inp.value.trim()), ok = FAQ.filter(f => !q || norm(f[1] + ' ' + f[2]).includes(q));
    res.innerHTML = ok.length ? ok.map(f => `<div><b>${marca(f[1], q)}</b><p>${marca(f[2], q)}</p></div>`).join('') : '<p style="color:#6b7280;text-align:center">No lo encontramos. Escríbenos a hola@momenturies.com</p>';
  };
  inp.oninput = pinta;
  $$('.sug button', r).forEach(b => b.onclick = () => { inp.value = b.textContent; pinta(); });
  pinta();
})();
(function(){
  const r = $('#p8d'); if(!r) return;
  const hilo = $('.hilo', r), preg = $('.preg', r);
  hilo.innerHTML = '<div class="ellos">¡Hola! Somos el equipo de Momenturies. ¿Qué quieres saber?</div>';
  FAQ.forEach(f => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = f[1];
    b.onclick = () => {
      b.classList.add('usada');
      hilo.insertAdjacentHTML('beforeend', `<div class="yo">${f[1]}</div><div class="ellos">…</div>`);
      const u = hilo.lastElementChild; hilo.scrollTop = hilo.scrollHeight;
      setTimeout(() => { u.textContent = f[2]; hilo.scrollTop = hilo.scrollHeight; }, 650);
    };
    preg.appendChild(b);
  });
})();

/* ── 9 · completa tu pedido ── */
(function(){
  const r = $('#p9b'); if(!r) return;
  const cks = $$('input[type=checkbox]', r);
  const pinta = () => {
    const sel = cks.filter(c => c.checked), bruto = sel.reduce((s, c) => s + +c.dataset.p, 0), pct = pctDe(sel.length), tot = bruto * (1 - pct / 100);
    $('.tot s', r).textContent = pct ? eur(bruto) : '';
    $('.tot b', r).textContent = eur(tot);
    $('.tot small', r).textContent = pct ? `-${pct} % por llevar ${sel.length} piezas` : 'Añade otra pieza y te llevas un -10 %';
  };
  cks.forEach(c => c.onchange = pinta); pinta();
})();
})();
