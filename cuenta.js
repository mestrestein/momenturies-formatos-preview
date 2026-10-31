/* cuenta.js · «Mi cuenta» de Momenturies con la Customer Account API de Shopify (cliente público + PKCE). */

/* Marc: rellenar desde el admin de Shopify → canal Headless → Customer Account API.
   shopId = el número que sale en las URLs de autenticación; clientId = el ID de cliente público.
   Redirect URI a dar de alta allí: https://momenturies.com/cuenta.html (y la de vista-cambios si se prueba ahí).
   Vacíos = modo ejemplo. */
const CUENTA = { shopId:'108862079310', clientId:'', apiVersion:'2026-10' };
/* Repetir pedido: el carrito se crea con la Storefront API, como en el editor. El token lo pone el worker de la web al servir este archivo. */
const TIENDA = { domain:'tp6upb-7k.myshopify.com', storefrontToken:'' };

/* consulta en una sola constante para poder corregir nombres de campos fácilmente */
const CONSULTA = `query { customer { firstName emailAddress{emailAddress}
  orders(first:20, sortKey:PROCESSED_AT, reverse:true){ nodes{ id name processedAt financialStatus cancelledAt statusPageUrl
    totalPrice{amount currencyCode}
    lineItems(first:20){nodes{ name title variantTitle variantId quantity image{url} customAttributes{key value} }}
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
    let w = 0, h = 0, print = null;
    const m = (a._impresion || '').match(/([\d.,]+)\s*[×x]\s*([\d.,]+)\s*cm(?:.*?con\s*([\d.,]+)\s*mm)?/i);
    if(m){
      const b = m[3] ? parseFloat(m[3].replace(',', '.')) / 10 : 0, W = parseFloat(m[1].replace(',', '.')), H = parseFloat(m[2].replace(',', '.'));
      w = W - 2 * b; h = H - 2 * b;
      /* el archivo de imprenta entero (con sangrado), para rehacerlo con otra foto a la misma medida */
      const d = (a._impresion.match(/(\d+)\s*ppp/i) || [])[1];
      print = { W, H, b, dpi:d ? +d : 300 };
    }
    const nombre = { cuadro:'Cuadro', sobremesa:'Sobremesa', iman:'Imán de nevera' }[tipo];
    return { li, a, o, tipo, w, h, print, foto, img:foto ? cld(foto, 'w_600,q_auto,f_auto') : (li.image && li.image.url),
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
    PIEZAS = []; CONJ = []; PEDIDOS = orders; EMAIL = (c.emailAddress && c.emailAddress.emailAddress) || '';
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
        ${e.paso < 0 ? '' : `<div class="o-rep"><button class="chip dark" data-repetir="${oi}">Repetir pedido</button>${o._p.some(p => p.foto && p.w) ? `<button class="chip" data-rehacer="${oi}">Repetir con otras fotos</button>` : ''}</div>`}
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
    $('#mas').innerHTML = MAS.map(([href, img, t, d]) => `<a class="x-card" href="${href}"><div class="x-img" style="background-image:url(${img})"></div><b>${t}</b><span>${d}</span></a>`).join('');
  }
  /* «Añade más»: el resto de productos de la tienda */
  const MAS = [
    ['ficha-cuadro.html', 'fotos/producto-metalico.jpg', 'Cuadro', 'Para la pared, con imán premium y sin agujeros.'],
    ['paredes.html', 'fotos/producto-hero-pared.jpg', 'Paredes', 'Conjuntos de varias fotos montados para tu hueco.'],
    ['ficha-sobremesa.html', 'fotos/producto-sobremesa.jpg', 'Sobremesa', 'Con peana de bambú, para la mesita o la estantería.'],
    ['ficha-iman.html', 'fotos/producto-iman-nevera.jpg', 'Imán', 'Pequeño, para la nevera o para sumar al pedido.'],
    ['colgador-iman.html', 'fotos/pdp/paso-4-colgado.webp', 'Colgador de imán', 'Para colgar lo que quieras, hasta 1 kg.'],
  ];

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
    const r = e.target.closest('[data-repetir]'), n = e.target.closest('[data-rehacer]');
    if(v) ver(PIEZAS[+v.dataset.ver]); else if(o) otra(PIEZAS[+o.dataset.otra]); else if(w) pared(CONJ[+w.dataset.pared]);
    else if(r) repetir(PEDIDOS[+r.dataset.repetir], r); else if(n) rehacer(PEDIDOS[+n.dataset.rehacer]);
  });

  /* ── repetir pedido: mismo carrito (mismas variantes, mismas fotos de imprenta y mismos datos) y al pago ── */
  let PEDIDOS = [], EMAIL = '';
  async function tienda(query, variables){
    const r = await fetch('https://' + TIENDA.domain + '/api/2025-01/graphql.json', { method:'POST',
      headers:{ 'Content-Type':'application/json', 'X-Shopify-Storefront-Access-Token':TIENDA.storefrontToken }, body:JSON.stringify({ query, variables }) });
    const j = await r.json(); if(j.errors) throw new Error(j.errors.map(x => x.message).join('; ')); return j.data;
  }
  async function alPago(lines){
    if(DEMO) throw new Error('Esto es un ejemplo: con tu cuenta, este botón te lleva al pago con el pedido ya hecho.');
    if(!TIENDA.storefrontToken) throw new Error('La tienda no está conectada ahora mismo. Prueba en un rato.');
    const input = { lines }; if(EMAIL) input.buyerIdentity = { email:EMAIL };
    const d = await tienda(`mutation($input:CartInput!){ cartCreate(input:$input){ cart{ checkoutUrl } userErrors{ message } } }`, { input });
    const er = d.cartCreate.userErrors; if(er && er.length) throw new Error(er.map(x => x.message).join('; '));
    location.href = d.cartCreate.cart.checkoutUrl;
  }
  const linea = (li, attrs) => ({ merchandiseId:li.variantId, quantity:li.quantity || 1, attributes:attrs || li.customAttributes || [] });
  function aviso(el, txt){
    let n = el.parentNode.querySelector('.o-msg'); if(!n){ n = document.createElement('p'); n.className = 'o-msg'; el.parentNode.appendChild(n); }
    n.textContent = txt; n.hidden = !txt;
  }
  async function repetir(o, btn){
    const lis = o.lineItems.nodes.filter(li => li.variantId || DEMO);
    if(!lis.length) return aviso(btn, 'Este pedido ya no se puede repetir tal cual: alguno de sus productos ha cambiado.');
    const t = btn.textContent; btn.disabled = true; btn.textContent = 'Preparando el pago…'; aviso(btn, '');
    try { await alPago(lis.map(li => linea(li))); }
    catch(e){ aviso(btn, e.message); btn.disabled = false; btn.textContent = t; }
  }

  /* ── repetir con otras fotos: un personalizador sencillo, sin entorno. Cada pieza mantiene su medida exacta;
     se elige foto, se encuadra arrastrando y con el zoom, y se rehace el archivo de imprenta a la misma resolución. ── */
  let REH = null;
  const CAMBIAN = ['_foto_frontal', '_foto_original', 'Frase (frontal)', 'Fecha (frontal)'];
  function rehacer(o){
    REH = { o, ps:o._p.map(p => ({ p, nueva:null, z:1, dx:0, dy:0 })) };
    $('#r-tit').textContent = 'Pedido ' + o.name + ' con otras fotos';
    pintarReh();
    $('#dentro').hidden = true; $('#rehacer').hidden = false; scrollTo(0, 0);
  }
  function salirReh(){ $('#rehacer').hidden = true; $('#dentro').hidden = false; REH = null; }
  function pintarReh(){
    $('#r-grid').innerHTML = REH.ps.map((x, i) => {
      const p = x.p;
      if(!p.foto || !p.print) return `<article class="r-card r-fija"><div class="r-meta"><b>${esc(p.etiqueta)}</b><span>Se repite igual${p.li.quantity > 1 ? ' · × ' + p.li.quantity : ''}</span></div></article>`;
      const frase = p.a['Frase (frontal)'] || p.a['Fecha (frontal)'];
      return `<article class="r-card"><div class="r-box" data-caja="${i}" style="aspect-ratio:${p.print.W}/${p.print.H}">
          <img src="${esc(x.nueva ? x.url : p.img)}" alt="" draggable="false" class="${x.nueva ? '' : 'vieja'}">
          <i class="r-corte" style="inset:${p.print.b / p.print.H * 100}% ${p.print.b / p.print.W * 100}%"></i>
          ${x.nueva ? '' : '<span class="r-tag">Foto de antes</span>'}</div>
        <div class="r-meta"><b>${esc(p.etiqueta)}</b>${p.li.quantity > 1 ? `<span>× ${p.li.quantity}</span>` : ''}</div>
        ${x.nueva ? `<label class="r-zoom">Zoom <input type="range" min="1" max="3" step=".01" value="${x.z}" data-zoom="${i}"></label>` : ''}
        <label class="chip ${x.nueva ? '' : 'dark'} r-elegir">${x.nueva ? 'Cambiar foto' : 'Elegir otra foto'}<input type="file" accept="image/*" data-foto="${i}" hidden></label>
        ${frase ? `<p class="r-nota">Este llevaba texto delante${x.nueva ? ': con la foto nueva va sin él' : ''}. Si lo quieres, hazlo desde el <a class="c-link" href="${{ cuadro:'cuadro.html', sobremesa:'sobremesa.html', iman:'iman.html' }[p.tipo]}">editor</a>.</p>` : ''}
      </article>`;
    }).join('');
    REH.ps.forEach((x, i) => { if(x.nueva) colocar(i); });
    const n = REH.ps.filter(x => x.nueva).length;
    $('#r-resumen').textContent = n ? n + (n === 1 ? ' foto nueva' : ' fotos nuevas') + ' · lo demás se repite igual' : 'Elige al menos una foto nueva';
    $('#r-pagar').disabled = !n;
  }
  /* geometría en unidades de la caja (ancho 1): la foto la cubre entera, con zoom y desplazamiento limitados */
  function encaje(x){
    const R = x.p.print.H / x.p.print.W, iw = x.img.naturalWidth, ih = x.img.naturalHeight;
    const s = Math.max(1 / iw, R / ih) * x.z, w = iw * s, h = ih * s;
    x.dx = Math.min(Math.max(x.dx, (1 - w) / 2), (w - 1) / 2); x.dy = Math.min(Math.max(x.dy, (R - h) / 2), (h - R) / 2);
    return { R, w, h, l:(1 - w) / 2 - x.dx, t:(R - h) / 2 - x.dy };
  }
  function colocar(i){
    const x = REH.ps[i], g = encaje(x), im = document.querySelector(`[data-caja="${i}"] img`);
    if(!im) return;
    Object.assign(im.style, { width:g.w * 100 + '%', height:g.h / g.R * 100 + '%', left:g.l * 100 + '%', top:g.t / g.R * 100 + '%' });
  }
  async function cargarFoto(i, f){
    const x = REH.ps[i], url = URL.createObjectURL(f), img = new Image();
    img.src = url;
    try { await img.decode(); } catch(e){ URL.revokeObjectURL(url); return falloReh('No hemos podido abrir esa foto. Prueba con una JPG o PNG.'); }
    if(x.url) URL.revokeObjectURL(x.url);
    Object.assign(x, { nueva:f, url, img, z:1, dx:0, dy:0 });
    /* aviso si la foto se queda corta para la medida (menos de 150 ppp en la pieza) */
    const ppp = Math.min(img.naturalWidth / (x.p.print.W / 2.54), img.naturalHeight / (x.p.print.H / 2.54));
    falloReh(ppp < 150 ? 'Una de las fotos tiene poca resolución para esa medida y puede salir borrosa.' : '');
    pintarReh();
  }
  function falloReh(t){ const e = $('#r-err'); e.textContent = t; e.hidden = !t; }
  $('#rehacer').addEventListener('change', e => {
    const f = e.target.closest('[data-foto]'); if(f && f.files[0]) cargarFoto(+f.dataset.foto, f.files[0]);
  });
  $('#rehacer').addEventListener('input', e => {
    const z = e.target.closest('[data-zoom]'); if(z){ REH.ps[+z.dataset.zoom].z = +z.value; colocar(+z.dataset.zoom); }
  });
  /* arrastrar la foto dentro de su caja */
  $('#rehacer').addEventListener('pointerdown', e => {
    const c = e.target.closest('[data-caja]'); if(!c) return;
    const i = +c.dataset.caja, x = REH.ps[i]; if(!x.nueva) return;
    e.preventDefault(); c.setPointerCapture(e.pointerId);
    const W = c.clientWidth, x0 = e.clientX, y0 = e.clientY, dx0 = x.dx, dy0 = x.dy;
    const mover = ev => { x.dx = dx0 - (ev.clientX - x0) / W; x.dy = dy0 - (ev.clientY - y0) / W; colocar(i); };
    const soltar = () => { c.removeEventListener('pointermove', mover); c.removeEventListener('pointerup', soltar); c.removeEventListener('pointercancel', soltar); };
    c.addEventListener('pointermove', mover); c.addEventListener('pointerup', soltar); c.addEventListener('pointercancel', soltar);
  });
  $('#r-volver').onclick = salirReh;

  /* el archivo de imprenta nuevo: misma medida y resolución que el del pedido (con su sangrado) */
  async function imprenta(x){
    const pr = x.p.print, c = document.createElement('canvas');
    c.width = Math.round(pr.W / 2.54 * pr.dpi); c.height = Math.round(pr.H / 2.54 * pr.dpi);
    const g = encaje(x), k = c.width, ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(x.img, g.l * k, g.t * k, g.w * k, g.h * k);
    const b = await new Promise(r => c.toBlob(r, 'image/jpeg', .95));
    return conDpi(b, pr.dpi);
  }
  async function conDpi(blob, dpi){
    const u = new Uint8Array(await blob.arrayBuffer());
    if(u[0] !== 0xFF || u[1] !== 0xD8 || u[2] !== 0xFF || u[3] !== 0xE0) return blob;
    u[13] = 1; u[14] = dpi >> 8; u[15] = dpi & 255; u[16] = dpi >> 8; u[17] = dpi & 255;
    return new Blob([u], { type:'image/jpeg' });
  }
  /* sube a Archivos de la tienda, por el mismo camino que el editor (/subidas/ del Vestuario) */
  async function subir(blob, nombre){
    const json = async r => { const j = await r.json().catch(() => ({})); if(!r.ok) throw new Error(j.error || 'No se pudo subir la foto'); return j; };
    const p = await json(await fetch('/subidas/preparar', { method:'POST', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ nombre, tipo:blob.type || 'image/jpeg', tamano:blob.size }) }));
    const fd = new FormData(); p.parameters.forEach(x => fd.append(x.name, x.value)); fd.append('file', blob, nombre);
    if(!(await fetch(p.url, { method:'POST', body:fd })).ok) throw new Error('No se pudo subir la foto');
    const c = await json(await fetch('/subidas/confirmar', { method:'POST', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ resourceUrl:p.resourceUrl, nombre }) }));
    return c.url || c.id;
  }
  $('#r-pagar').onclick = async () => {
    const btn = $('#r-pagar'), t = btn.textContent; btn.disabled = true; falloReh('');
    try {
      if(DEMO) throw new Error('Esto es un ejemplo: con tu cuenta, aquí se suben las fotos y vas al pago.');
      const lines = [], vistos = new Set(), nuevas = REH.ps.filter(x => x.nueva).length; let hechas = 0;
      for(const x of REH.ps){
        const li = x.p.li; if(vistos.has(li)) continue; vistos.add(li);
        if(!li.variantId) throw new Error('Alguno de los productos de este pedido ya no está a la venta.');
        if(!x.nueva){ lines.push(linea(li)); continue; }
        btn.textContent = 'Subiendo foto ' + (++hechas) + ' de ' + nuevas + '…';
        const s = Date.now(), ext = (x.nueva.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        const [frontal, original] = await Promise.all([
          subir(await imprenta(x), 'impresion-' + s + '.jpg'),
          subir(x.nueva, 'original-' + s + '.' + ext).catch(() => null),
        ]);
        const at = (li.customAttributes || []).filter(a => !CAMBIAN.includes(a.key));
        at.unshift({ key:'_foto_frontal', value:frontal });
        if(original) at.push({ key:'_foto_original', value:original });
        lines.push(linea(li, at));
      }
      btn.textContent = 'Preparando el pago…';
      await alPago(lines);
    } catch(e){ falloReh(e.message); btn.disabled = false; btn.textContent = t; }
  };

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
