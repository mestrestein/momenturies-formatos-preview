/* cuenta.js · «Mi cuenta» de Momenturies con la Customer Account API de Shopify (cliente público + PKCE). */

/* Marc: rellenar desde el admin de Shopify → canal Headless → Customer Account API.
   shopId = el número que sale en las URLs de autenticación; clientId = el ID de cliente público.
   Redirect URI a dar de alta allí: https://momenturies.com/cuenta.html (y la de vista-cambios si se prueba ahí).
   Vacíos = modo ejemplo. */
const CUENTA = { shopId:'108862079310', clientId:'', apiVersion:'2026-10' };

/* consulta en una sola constante para poder corregir nombres de campos fácilmente */
const CONSULTA = `query { customer { firstName emailAddress{emailAddress}
  orders(first:20, sortKey:PROCESSED_AT, reverse:true){ nodes{ id name processedAt financialStatus cancelledAt statusPageUrl
    totalPrice{amount currencyCode}
    lineItems(first:20){nodes{ name title variantTitle quantity image{url} customAttributes{key value} }}
    fulfillments(first:3){nodes{ status latestShipmentStatus trackingInformation{company number url} }} } } } }`;

(function(){
  const $ = s => document.querySelector(s);
  const REDIR = location.origin + location.pathname;
  const AUTH = 'https://shopify.com/authentication/' + CUENTA.shopId;
  const q = new URLSearchParams(location.search);
  const DEMO = !CUENTA.shopId || !CUENTA.clientId || q.get('demo') === '1';
  const st = {
    get(k, s){ try { return JSON.parse((s ? sessionStorage : localStorage).getItem(k)); } catch(e){ return null; } },
    set(k, v, s){ try { (s ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch(e){} },
    del(k, s){ try { (s ? sessionStorage : localStorage).removeItem(k); } catch(e){} },
  };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const cld = (u, t) => u && /res\.cloudinary\.com/.test(u) && u.includes('/upload/') ? u.replace('/upload/', '/upload/' + t + '/') : u;
  const num = n => String(Math.round(n * 10) / 10).replace('.', ',');

  /* ── OAuth ── */
  const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const azar = () => b64u(crypto.getRandomValues(new Uint8Array(32)));
  async function entrar(){
    const verifier = azar(), state = azar(), nonce = azar();
    const reto = b64u(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    st.set('mc_pkce', { verifier, state, nonce }, true);
    const p = new URLSearchParams({ scope:'openid email customer-account-api:full', client_id:CUENTA.clientId, response_type:'code',
      redirect_uri:REDIR, state, nonce, code_challenge:reto, code_challenge_method:'S256', locale:'es' });
    location.href = AUTH + '/oauth/authorize?' + p;
  }
  async function token(body){
    const r = await fetch(AUTH + '/oauth/token', { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body:new URLSearchParams(body) });
    if(!r.ok) throw new Error('token ' + r.status);
    const j = await r.json(), prev = st.get('mc_tok') || {};
    const t = { access:j.access_token, refresh:j.refresh_token || prev.refresh, id:j.id_token || prev.id, expires_at:Date.now() + (j.expires_in || 3600) * 1000 - 60000 };
    st.set('mc_tok', t); return t;
  }
  async function callback(){
    const code = q.get('code'), state = q.get('state'), pk = st.get('mc_pkce', true);
    history.replaceState(null, '', location.pathname);
    st.del('mc_pkce', true);
    if(!pk || pk.state !== state) throw new Error('state');
    await token({ grant_type:'authorization_code', client_id:CUENTA.clientId, redirect_uri:REDIR, code, code_verifier:pk.verifier });
  }
  async function acceso(){
    let t = st.get('mc_tok'); if(!t) return null;
    if(Date.now() > t.expires_at){ if(!t.refresh) return null; t = await token({ grant_type:'refresh_token', client_id:CUENTA.clientId, refresh_token:t.refresh }); }
    return t.access;
  }
  function salir(){
    const t = st.get('mc_tok'); st.del('mc_tok');
    if(DEMO || !t){ location.href = location.pathname; return; }
    location.href = AUTH + '/logout?' + new URLSearchParams({ id_token_hint:t.id || '', post_logout_redirect_uri:REDIR });
  }
  async function datos(){
    const a = await acceso(); if(!a) return null;
    const r = await fetch('https://shopify.com/' + CUENTA.shopId + '/account/customer/api/' + CUENTA.apiVersion + '/graphql',
      { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:a }, body:JSON.stringify({ query:CONSULTA }) });
    if(r.status === 401){ st.del('mc_tok'); return null; }
    const j = await r.json(); if(!j.data || !j.data.customer) throw new Error('api'); return j.data.customer;
  }

  /* ── ejemplo ── */
  function demo(){
    const d = n => new Date(Date.now() - n * 864e5).toISOString(), S = 'fotos/stock/';
    const imp = (w, h) => num(w + .6) + '×' + num(h + .6) + ' cm (con 3 mm de sangrado) a 300 ppp';
    const L = (title, foto, w, h, extra) => ({ name:title, title, variantTitle:num(w) + '×' + num(h) + ' cm', quantity:1, image:{ url:S + foto },
      customAttributes:Object.entries(Object.assign({ _foto_frontal:S + foto, _foto_original:S + foto, _impresion:imp(w, h) }, extra || {})).map(([key, value]) => ({ key, value })) });
    const eur = a => ({ amount:a, currencyCode:'EUR' });
    return { firstName:'Lucía', emailAddress:{ emailAddress:'lucia@ejemplo.com' }, orders:{ nodes:[
      { id:'1047', name:'#1047', processedAt:d(2), financialStatus:'PAID', cancelledAt:null, statusPageUrl:'#', totalPrice:eur('134.97'), fulfillments:{ nodes:[] },
        lineItems:{ nodes:[
          L('Cuadro de pared', '1548858806-480x640.webp', 24, 32, { Colgador:'Imán', _conjunto:'W01|Trío vertical|80x32', _pieza:'0,0,24,32' }),
          L('Cuadro de pared', '1557495235-480x640.webp', 24, 32, { Colgador:'Imán', _conjunto:'W01|Trío vertical|80x32', _pieza:'28,0,24,32' }),
          L('Cuadro de pared', '1603367563698-480x640.webp', 24, 32, { Colgador:'Imán', _conjunto:'W01|Trío vertical|80x32', _pieza:'56,0,24,32' }) ] } },
      { id:'1039', name:'#1039', processedAt:d(14), financialStatus:'PAID', cancelledAt:null, statusPageUrl:'#', totalPrice:eur('54.99'),
        fulfillments:{ nodes:[{ status:'SUCCESS', latestShipmentStatus:'IN_TRANSIT', trackingInformation:[{ company:'Correos', number:'PK4F2A1B9C0ES', url:'https://www.correos.es/' }] }] },
        lineItems:{ nodes:[ L('Cuadro de pared', '1491013516836-620x877.webp', 30, 40, { Colgador:'Imán', 'Frase (frontal)':'Siempre nosotros', 'Fecha (frontal)':'14 · 08 · 2026',
          'Dedicatoria (dorso)':'Para mamá, por enseñarnos a mirar el lado bonito de todo.', 'Fecha (dorso)':'Navidad 2026' }) ] } },
      { id:'1021', name:'#1021', processedAt:d(31), financialStatus:'PAID', cancelledAt:null, statusPageUrl:'#', totalPrice:eur('39.97'),
        fulfillments:{ nodes:[{ status:'SUCCESS', latestShipmentStatus:'DELIVERED', trackingInformation:[{ company:'Correos', number:'PK3C88D02E1ES', url:'https://www.correos.es/' }] }] },
        lineItems:{ nodes:[ L('Imán de nevera', '1586498024141-480x640.webp', 7, 10), L('Imán de nevera', '1606983340126-480x640.webp', 7, 10),
          L('Sobremesa', '1472719674214-480x640.webp', 10, 15) ] } },
    ] } };
  }

  /* ── modelo ── */
  function pieza(li, o){
    const a = {}; (li.customAttributes || []).forEach(x => a[x.key] = x.value);
    const tit = li.name || li.title || '', colg = /colgador/i.test(tit);
    const tipo = /sobremesa/i.test(tit) ? 'sobremesa' : /im[aá]n/i.test(tit) && !colg ? 'iman' : 'cuadro';
    const foto = a._foto_frontal || (!colg && li.image && li.image.url) || '';
    let w = 0, h = 0;
    const m = (a._impresion || '').match(/([\d.,]+)\s*[×x]\s*([\d.,]+)\s*cm(?:.*?con\s*([\d.,]+)\s*mm)?/i);
    if(m){ const b = m[3] ? parseFloat(m[3].replace(',', '.')) / 10 : 0; w = parseFloat(m[1].replace(',', '.')) - 2 * b; h = parseFloat(m[2].replace(',', '.')) - 2 * b; }
    const nombre = { cuadro:'Cuadro', sobremesa:'Sobremesa', iman:'Imán de nevera' }[tipo];
    return { li, a, o, tipo, w, h, foto, img:foto ? cld(foto, 'w_600,q_auto,f_auto') : (li.image && li.image.url),
      etiqueta:foto ? nombre + (w ? ' · ' + num(w) + '×' + num(h) + ' cm' : '') : tit };
  }
  function estado(o){
    if(o.cancelledAt) return { paso:-1, txt:'Cancelado', cls:'can' };
    const f = (o.fulfillments && o.fulfillments.nodes) || [];
    if(f.some(x => x.latestShipmentStatus === 'DELIVERED')) return { paso:3, txt:'Entregado', cls:'ent' };
    if(f.length) return { paso:2, txt:'Enviado', cls:'env' };
    return { paso:1, txt:'En preparación', cls:'prep' };
  }
  const fecha = s => new Date(s).toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' });
  const dinero = p => new Intl.NumberFormat('es-ES', { style:'currency', currency:p.currencyCode }).format(+p.amount);

  let PIEZAS = [], CONJ = [];
  function pintar(c){
    const orders = c.orders.nodes;
    PIEZAS = []; CONJ = [];
    orders.forEach(o => {
      o._p = o.lineItems.nodes.map(li => pieza(li, o));
      const fotos = o._p.filter(p => p.foto); PIEZAS.push(...fotos);
      const grupos = {};
      fotos.forEach(p => { if(p.a._conjunto){ (grupos[p.a._conjunto] = grupos[p.a._conjunto] || []).push(p); } });
      Object.entries(grupos).forEach(([k, ps]) => {
        const [id, nom, med] = k.split('|'), [W, H] = (med || '').split('x').map(parseFloat);
        ps.forEach(p => { const v = (p.a._pieza || '0,0,0,0').split(',').map(parseFloat); p.pos = { x:v[0], y:v[1], w:v[2] || p.w, h:v[3] || p.h }; });
        CONJ.push({ id, nombre:nom || 'Conjunto', W, H, ps, o });
      });
      const sueltos = fotos.filter(p => p.tipo === 'cuadro' && !p.a._conjunto);
      if(!Object.keys(grupos).length && sueltos.length > 1){
        const H = Math.max(...sueltos.map(p => p.h)); let x = 0;
        sueltos.forEach(p => { p.pos = { x, y:(H - p.h) / 2, w:p.w, h:p.h }; x += p.w + 4; });
        CONJ.push({ nombre:'Conjunto del pedido ' + o.name, W:x - 4, H, ps:sueltos, o });
      }
    });
    $('#hola').textContent = 'Hola' + (c.firstName ? ', ' + c.firstName : '');
    $('#stats').innerHTML = [[orders.length, 'pedidos'], [PIEZAS.length, PIEZAS.length === 1 ? 'cuadro' : 'cuadros'], [CONJ.length, CONJ.length === 1 ? 'conjunto' : 'conjuntos']]
      .map(([n, t]) => `<div class="c-stat"><b>${n}</b><span>${t}</span></div>`).join('');
    const vacio = (t, p) => `<div class="c-empty"><h3>${t}</h3><p>${p}</p><a class="c-btn" href="cuadro.html">Crear mi cuadro</a></div>`;
    const PASOS = ['Pedido recibido', 'En preparación', 'Enviado', 'Entregado'];
    $('#p-pedidos').innerHTML = orders.length ? orders.map((o, oi) => {
      const e = estado(o), f = (o.fulfillments.nodes.find(x => x.trackingInformation && x.trackingInformation.length) || {}).trackingInformation;
      const t = f && f[0];
      return `<article class="o-card"><div class="o-top"><div><div class="o-num">Pedido ${esc(o.name)}</div><div class="o-date">${fecha(o.processedAt)}</div></div>
        <div class="o-right"><span class="pill ${e.cls}">${e.txt}</span><div class="o-total">${dinero(o.totalPrice)}</div></div></div>
        ${e.paso < 0 ? '' : `<ol class="tl">${PASOS.map((s, i) => `<li class="${i <= e.paso ? 'on' : ''} ${i === e.paso ? 'now' : ''}">${s}</li>`).join('')}</ol>`}
        ${t ? `<div class="o-track">${esc(t.company || 'Envío')} · ${esc(t.number || '')} ${t.url ? `<a href="${esc(t.url)}" target="_blank" rel="noopener">Seguir el envío</a>` : ''}</div>` : ''}
        <div class="o-thumbs">${o._p.filter(p => p.img).map(p => `<img src="${esc(p.img)}" alt="" loading="lazy">`).join('')}</div>
        <details class="o-det"><summary><span class="abrir">Ver detalle</span><span class="cerrar">Ocultar detalle</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="m6 9 6 6 6-6"/></svg></summary>
          ${o._p.map(p => {
            const d = [['Colgador', p.a.Colgador], ['Frase', p.a['Frase (frontal)']], ['Fecha', p.a['Fecha (frontal)']], ['Dedicatoria', p.a['Dedicatoria (dorso)']], ['Fecha detrás', p.a['Fecha (dorso)']]].filter(x => x[1]);
            const i = PIEZAS.indexOf(p);
            return `<div class="ln">${p.img ? `<img class="ln-img" src="${esc(p.img)}" alt="" loading="lazy">` : '<div class="ln-img"></div>'}<div>
              <h3>${esc(p.etiqueta)} ${p.li.quantity > 1 ? `<span class="q">× ${p.li.quantity}</span>` : ''}</h3>
              ${d.length ? `<dl>${d.map(([k, v]) => `<dt>${k}</dt><dd class="${k === 'Dedicatoria' ? 'ded' : ''}">${esc(v)}</dd>`).join('')}</dl>` : ''}
              ${p.foto ? `<div class="ln-act"><button class="chip dark" data-ver="${i}">Ver en 3D</button><button class="chip" data-otra="${i}">Pedir otra igual</button>
                <a class="chip" href="${esc(cld(p.foto, 'fl_attachment'))}" download>Descargar foto</a></div>` : ''}</div></div>`;
          }).join('')}
          ${o.statusPageUrl && o.statusPageUrl !== '#' ? `<a class="c-link o-shop" href="${esc(o.statusPageUrl)}" target="_blank" rel="noopener">Ver el pedido en Shopify</a>` : ''}
        </details></article>`;
    }).join('') : vacio('Aún no hay pedidos', 'Cuando hagas tu primer pedido lo verás aquí, con su envío paso a paso.');
    $('#p-cuadros').innerHTML = PIEZAS.length ? `<div class="g-grid">${PIEZAS.map((p, i) => {
      const r = p.w && p.h ? p.w / p.h : .75, w = r >= 1 ? 72 : 72 * r, h = r >= 1 ? 72 / r : 72;
      return `<button class="g-item" data-ver="${i}"><div class="g-sc"><div class="g-pz" style="width:${w}%;height:${h}%"><img src="${esc(p.img)}" alt="" loading="lazy"></div></div>
        <div class="g-meta"><span class="v3d">Ver en 3D</span><b>${esc(p.etiqueta)}</b><span>Pedido ${esc(p.o.name)} · ${new Date(p.o.processedAt).toLocaleDateString('es-ES', { day:'numeric', month:'short' })}</span></div></button>`;
    }).join('')}</div>` : vacio('Tu galería está vacía', 'Aquí irán todas las fotos que conviertas en cuadro.');
    $('#p-conjuntos').innerHTML = CONJ.length ? `<div class="s-grid">${CONJ.map((s, i) => `<article class="s-card"><div class="s-wall"><div class="s-lay" style="aspect-ratio:${s.W}/${s.H};max-width:${Math.min(100, s.W / s.H * 60)}%">
        ${s.ps.map(p => `<img src="${esc(p.img)}" alt="" style="left:${p.pos.x / s.W * 100}%;top:${p.pos.y / s.H * 100}%;width:${p.pos.w / s.W * 100}%;height:${p.pos.h / s.H * 100}%">`).join('')}</div></div>
        <h3>${esc(s.nombre)}</h3><p>${s.ps.length} piezas · ${num(s.W)}×${num(s.H)} cm · pedido ${esc(s.o.name)}</p>
        <button class="chip dark" data-pared="${i}">Ver en 3D en una pared</button></article>`).join('')}</div>`
      : vacio('Todavía no tienes conjuntos', 'Si pides dos o más cuadros juntos, aquí los verás colgados como en tu pared.');
  }

  /* ── pestañas ── */
  const tabs = [...document.querySelectorAll('.c-tab')];
  function tab(t){ tabs.forEach(b => { const on = b === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; $('#' + b.getAttribute('aria-controls')).hidden = !on; }); }
  tabs.forEach((b, i) => { b.onclick = () => tab(b); b.onkeydown = e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if(d){ const n = tabs[(i + d + tabs.length) % tabs.length]; tab(n); n.focus(); } }; });

  /* ── 3D: el MISMO visor de la página de producto (cuadro.html / sobremesa.html / iman.html) dentro de la ventana.
     Las fotos pasan por photo-handoff (IndexedDB, mismo origen) y la página las monta como si las hubiera subido el
     cliente: con ?formato=…&encuadre=0 entra la foto de imprenta tal cual, sin recortar; un conjunto, con ?pared=. ── */
  const DEST = { cuadro:'cuadro.html', sobremesa:'sobremesa.html', iman:'iman.html' };
  const formato = p => { const r = p.w && p.h ? Math.min(p.w, p.h) / Math.max(p.w, p.h) : .75; return r > .9 ? 'cuadrado' : r < .71 ? 'clasico' : 'retrato'; };
  async function aFile(p){
    const b = await (await fetch(DEMO ? p.foto : cld(p.foto, 'q_auto'))).blob();   // la de imprenta: ya va recortada a su formato
    return new File([b], 'foto.' + ((b.type.split('/')[1]) || 'jpg'), { type:b.type });
  }
  const modal = $('#modal'), marco = $('#m-frame'); let antes = null;
  async function abrir(tit, sub, ps, extra){
    antes = document.activeElement; modal.hidden = false; document.body.style.overflow = 'hidden';
    $('#m-tit').textContent = tit; $('#m-sub').textContent = sub;
    $('#m-wait').hidden = false; marco.src = 'about:blank';
    modal.querySelector('.m-x').focus();
    try { await MOMENTURIES_PHOTO.put(await Promise.all(ps.map(aFile))); }
    catch(e){ $('#m-wait').textContent = 'No se ha podido cargar la foto.'; return; }
    marco.onload = () => { $('#m-wait').hidden = true; };
    marco.src = DEST[ps[0].tipo] + '?foto=1&encuadre=0&formato=' + formato(ps[0]) + (extra || '');
  }
  function cerrar(){ modal.hidden = true; marco.src = 'about:blank'; document.body.style.overflow = ''; if(antes) antes.focus(); }
  modal.addEventListener('click', e => { if(e.target.closest('[data-cerrar]')) cerrar(); });
  addEventListener('keydown', e => { if(e.key === 'Escape' && !modal.hidden) cerrar(); });
  const ver = p => abrir(p.etiqueta, 'Pedido ' + p.o.name, [p]);
  const pared = s => abrir(s.nombre, num(s.W) + '×' + num(s.H) + ' cm · ' + s.ps.length + ' piezas', s.ps, s.id && !DEMO ? '&pared=' + encodeURIComponent(s.id) : '');

  async function otra(p){
    const dest = { cuadro:'cuadro.html', sobremesa:'sobremesa.html', iman:'iman.html' }[p.tipo];
    try {
      const u = p.a._foto_original || p.foto, b = await (await fetch(u)).blob();
      await MOMENTURIES_PHOTO.put([new File([b], 'foto.' + ((b.type.split('/')[1]) || 'jpg'), { type:b.type })]);
      location.href = dest + '?foto=1';
    } catch(e){ location.href = dest; }
  }
  $('#dentro').addEventListener('click', e => {
    const v = e.target.closest('[data-ver]'), o = e.target.closest('[data-otra]'), w = e.target.closest('[data-pared]');
    if(v) ver(PIEZAS[+v.dataset.ver]); else if(o) otra(PIEZAS[+o.dataset.otra]); else if(w) pared(CONJ[+w.dataset.pared]);
  });

  /* ── arranque ── */
  $('#entrar').onclick = () => { if(!CUENTA.shopId || !CUENTA.clientId){ location.href = '?demo=1'; return; } entrar().catch(() => fallo('No hemos podido abrir el acceso. Prueba otra vez.')); };
  $('#salir').onclick = salir;
  function fallo(t){ const e = $('#error'); e.textContent = t; e.hidden = false; }
  function fuera(){ $('#cargando').hidden = true; $('#fuera').hidden = false; }
  function dentro(c){ $('#cargando').hidden = true; $('#dentro').hidden = false; $('#salir').hidden = false; $('#demo-aviso').hidden = !DEMO; pintar(c); }
  (async () => {
    if(DEMO){ if(q.get('demo') === '1') return dentro(demo()); return fuera(); }
    try {
      if(q.get('code')) await callback();
      else if(q.get('error')){ history.replaceState(null, '', location.pathname); fuera(); return fallo('No se ha completado el acceso. Prueba otra vez.'); }
      const c = await datos(); c ? dentro(c) : fuera();
    } catch(e){ console.warn(e); fuera(); fallo('No hemos podido cargar tu cuenta ahora mismo. Vuelve a intentarlo en un rato.'); }
  })();
})();
