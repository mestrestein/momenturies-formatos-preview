/* La tele retro de la mesita del salón (huevo 'tele'). Guía: blender/momenturies-rooms/GUIA_AGENTES_13nov.md, Agente B.
   Un plano con un canvas de 384×288 delante del cristal (malla 'tele_pantalla'); se repinta a 12 fps solo encendida y estando en el salón.
   Toque: apagada → se enciende en el canal 1 (raya blanca que se abre); luego zapping (nieve + chasquido); después del último canal, se apaga. */
export default function(api){
  const { THREE, scene, camera, pos } = api;
  const W = 384, H = 288, PASO = 1/12;
  const CREMA = '#f6f1e7', TERRA = '#c2613a', NEGRO = '#1a1a1a', SERIF = 'Georgia, "Times New Roman", serif', SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';

  /* ── dónde está el cristal ── */
  let cristal = null;
  scene.traverse(o => { if(!cristal && o.isMesh && o.userData.mat === 'tele_pantalla') cristal = o; });
  let cy = 69.9, cz = 686.4, sw = 19.2, sh = 14.4, fx = 1025.9;
  if(cristal){ cristal.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(cristal), c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    if(s.z > 8 && s.z < 40 && s.y > 6 && s.y < 30){ cy = c.y; cz = c.z; sw = s.z; sh = s.y; fx = b.min.x; } }
  const CENTRO = new THREE.Vector3(fx - .1, cy, cz);
  const CAJA = new THREE.Box3(new THREE.Vector3(fx - 3, cy - sh/2 - 7, cz - sw/2 - 7), new THREE.Vector3(fx + 22, cy + sh/2 + 7, cz + sw/2 + 7));   // pantalla + mueble de la tele

  /* ── el lienzo ── */
  const tex = api.lienzo(W, H, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); });
  tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
  const can = tex.image, x = can.getContext('2d');
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map:tex, color:'#f2f2f2', toneMapped:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2 }));
  pantalla.rotation.y = -Math.PI/2; pantalla.position.copy(CENTRO); pantalla.visible = false; scene.add(pantalla);
  if(api.RAICES && api.RAICES.salon){ scene.updateMatrixWorld(true); api.RAICES.salon.attach(pantalla); }   // se esconde con el salón

  const mini = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; };
  /* líneas de barrido */
  const LINEAS = mini(W, H, (c, w, h) => { c.fillStyle = 'rgba(0,0,0,.2)'; for(let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1); });
  /* viñeteado + esquinas redondeadas de tubo */
  const VINETA = mini(W, H, (c, w, h) => {
    const g = c.createRadialGradient(w/2, h/2, h*.32, w/2, h/2, w*.66); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.7, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,.8)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = '#000'; c.beginPath(); c.rect(0, 0, w, h); c.roundRect(3, 3, w - 6, h - 6, 34); c.fill('evenodd');
    const r = c.createLinearGradient(0, 0, w*.6, h*.6); r.addColorStop(0, 'rgba(255,255,255,.08)'); r.addColorStop(.5, 'rgba(255,255,255,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); });
  /* nieve: un canvas pequeño que se estira sin suavizar */
  const NIEVE = mini(128, 96, () => {}), nx = NIEVE.getContext('2d'), nimg = nx.createImageData(128, 96);
  function nieve(a = 1){ const d = nimg.data; for(let i = 0; i < d.length; i += 4){ const v = Math.random()*255 | 0; d[i] = d[i+1] = d[i+2] = v; d[i+3] = 255; }
    nx.putImageData(nimg, 0, 0); x.save(); x.globalAlpha = a; x.imageSmoothingEnabled = false; x.drawImage(NIEVE, 0, 0, W, H); x.restore(); }

  /* ── fotos de las placas (las mismas URL que usa la casa → salen de la caché) ── */
  let fotos = null;
  function cargaFotos(){
    if(fotos) return; fotos = [];
    const vistas = new Set(), ps = ((api.datos && api.datos.placas) || []).filter(p => p && p.foto && !vistas.has(p.foto) && vistas.add(p.foto));
    const de = s => ps.filter(p => s(p.set || ''));
    const orden = [...de(s => /^W/.test(s)), ...de(s => s === 'sobremesa'), ...de(s => s === 'iman'), ...ps];
    const usadas = new Set();
    for(const p of orden){ if(fotos.length >= 7) break; if(usadas.has(p.foto)) continue; usadas.add(p.foto);
      const im = new Image(); im.decoding = 'async'; im.onload = () => { im.ok = true; }; im.src = p.foto + '?v=' + api.VER; im.set = p.set || ''; fotos.push(im); }
  }
  const foto = i => fotos && fotos.length ? fotos[i % fotos.length] : null;
  const fotoSet = (re, i = 0) => { const l = (fotos || []).filter(f => re.test(f.set)); return l.length ? l[i % l.length] : foto(i); };
  /* dibuja una foto «cover» en un rectángulo, con zoom y desplazamiento */
  function cubre(im, X, Y, w, h, zoom = 1, px = .5, py = .5){
    if(!im || !im.ok || !im.width){ const g = x.createLinearGradient(X, Y, X + w, Y + h); g.addColorStop(0, TERRA); g.addColorStop(1, '#e8c9a8'); x.fillStyle = g; x.fillRect(X, Y, w, h); return; }
    const ra = im.width/im.height, rb = w/h; let a = im.width, b = im.height;
    if(ra > rb) a = b*rb; else b = a/rb; a /= zoom; b /= zoom;
    x.drawImage(im, (im.width - a)*px, (im.height - b)*py, a, b, X, Y, w, h);
  }

  /* ── utilidades de texto ── */
  const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);
  const rebote = k => { k = Math.max(0, Math.min(1, k)); const c = 1.7; return 1 + (c + 1)*Math.pow(k - 1, 3) + c*Math.pow(k - 1, 2); };
  function espaciado(t, cx, y, sp){ const ws = [...t].map(c => x.measureText(c).width), tot = ws.reduce((a, b) => a + b, 0) + sp*(ws.length - 1);
    let px = cx - tot/2; x.textAlign = 'left'; [...t].forEach((c, i) => { x.fillText(c, px, y); px += ws[i] + sp; }); x.textAlign = 'center'; }
  function envuelve(t, maxW){ const out = []; let l = ''; t.split(' ').forEach(p => { const n = l ? l + ' ' + p : p; if(x.measureText(n).width > maxW && l){ out.push(l); l = p; } else l = n; }); if(l) out.push(l); return out; }
  function logo(X, Y, s){ if(api.MARCA && api.MARCA.image) x.drawImage(api.MARCA.image, X, Y, s, s); }
  function marca(cx, y, tam, color = NEGRO){ x.fillStyle = color; x.font = `700 ${tam}px ${SERIF}`; x.textBaseline = 'middle'; espaciado('MOMENTURIES', cx, y, tam*.32); }
  /* una placa de metal con su brillo que pasa */
  function placa(im, X, Y, w, h, t, r = 4){
    x.save(); x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.roundRect(X + 4, Y + 6, w, h, r); x.fill();
    x.beginPath(); x.roundRect(X, Y, w, h, r); x.clip(); cubre(im, X, Y, w, h, 1.04);
    const k = ((t*.45) % 1.6) - .3, g = x.createLinearGradient(X + w*(k - .3), Y, X + w*(k + .3), Y + h);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.38)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(X, Y, w, h);
    x.restore(); x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; x.beginPath(); x.roundRect(X + .5, Y + .5, w - 1, h - 1, r); x.stroke();
  }

  /* ── canal 1: el anuncio (16 s en bucle) ── */
  function anuncio(t){
    const u = t % 17, x0 = W/2;
    x.textAlign = 'center'; x.textBaseline = 'middle';
    if(u < 4){                                                     // foto a pantalla completa con zoom lento
      const k = u/4; cubre(foto(0), 0, 0, W, H, 1.04 + .16*k, .5 + .06*k, .45);
      const g = x.createLinearGradient(0, H*.5, 0, H); g.addColorStop(0, 'rgba(26,26,26,0)'); g.addColorStop(1, 'rgba(26,26,26,.85)'); x.fillStyle = g; x.fillRect(0, H*.5, W, H*.5);
      const e = ease((u - .4)/.6); x.globalAlpha = e; x.fillStyle = CREMA; x.font = `italic 700 34px ${SERIF}`; x.fillText('Tus fotos, en metal', x0, H - 62 + 14*(1 - e));
      x.fillStyle = TERRA; x.fillRect(x0 - 110*ease((u - .9)/.6), H - 38, 220*ease((u - .9)/.6), 3); x.globalAlpha = 1;
      logo(14, 14, 26); x.fillStyle = CREMA; x.font = `700 11px ${SERIF}`; x.textAlign = 'left'; x.fillText('MOMENTURIES', 46, 27); x.textAlign = 'center';
    } else if(u < 8.5){                                            // las tres formas, entrando de una en una
      const v = u - 4; x.fillStyle = CREMA; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(194,97,58,.09)'; for(let i = 0; i < 9; i++) x.fillRect(-60 + i*52 + (v*14 % 52), 0, 18, H);
      const tres = [[fotoSet(/^W/, 1), 34, 48, 128, 160, 0, 'Cuadro'], [fotoSet(/^sobremesa$/), 186, 88, 92, 120, .35, 'Sobremesa'], [fotoSet(/^iman$/), 296, 120, 62, 62, .7, 'Imán']];
      tres.forEach(([im, X, Y, w, h, d, n]) => { const s = rebote((v - d)/.55); if(s <= 0) return;
        x.save(); x.translate(X + w/2, Y + h); x.scale(s, s); x.translate(-(X + w/2), -(Y + h));
        if(n === 'Sobremesa'){ x.fillStyle = '#8c8c8c'; x.beginPath(); x.moveTo(X + w*.3, Y + h); x.lineTo(X + w*.7, Y + h); x.lineTo(X + w*.62, Y + h + 8); x.lineTo(X + w*.38, Y + h + 8); x.fill(); }
        placa(im, X, Y, w, h, v + d*3, n === 'Imán' ? 8 : 3);
        x.fillStyle = '#6b5f52'; x.font = `600 12px ${SANS}`; x.fillText(n, X + w/2, Y + h + 20); x.restore(); });
      const e = ease((v - 1.4)/.6); x.globalAlpha = e; x.fillStyle = NEGRO; x.font = `700 23px ${SERIF}`; x.fillText('Cuadros · Sobremesas · Imanes', x0, H - 30); x.globalAlpha = 1;
    } else if(u < 13){                                             // la placa cae, se pega con imán: ni un agujero
      const v = u - 8.5; x.fillStyle = '#e9e4da'; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(0,0,0,.05)'; x.lineWidth = 1; for(let i = 0; i < W; i += 24){ x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
      const cae = Math.min(1, v/.55), yy = v < .55 ? -170 + 210*cae*cae : 40 - 7*Math.sin(Math.min(1, (v - .55)/.35)*Math.PI)*Math.exp(-(v - .55)*4);
      placa(foto(2), x0 - 66, yy, 132, 160, v);
      x.fillStyle = '#5c5c5c'; [[x0 - 54, yy - 3], [x0 + 46, yy - 3]].forEach(([a, b]) => x.fillRect(a, b, 8, 4));
      if(v > .55 && v < .9){ x.strokeStyle = TERRA; x.lineWidth = 2; for(let i = 0; i < 5; i++){ const a = -Math.PI*.9 + i*.45; x.beginPath(); x.moveTo(x0 + Math.cos(a)*90, 40 + Math.sin(a)*20); x.lineTo(x0 + Math.cos(a)*104, 40 + Math.sin(a)*28); x.stroke(); } }
      if(v > 1.2){ const k = ease((v - 1.2)/.4); x.save(); x.translate(330, 66); x.scale(k, k);                 // agujero de taladro, tachado
        x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 22, 0, 7); x.fill(); x.fillStyle = '#3a3a3a'; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill();
        x.strokeStyle = '#d0342c'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 20, 0, 7); x.moveTo(-14, -14); x.lineTo(14, 14); x.stroke(); x.restore(); }
      const e = ease((v - .9)/.6); x.globalAlpha = e; x.fillStyle = NEGRO; x.font = `700 21px ${SERIF}`; x.fillText('Se cuelgan con imán,', x0, H - 52); x.fillStyle = TERRA; x.fillText('sin agujeros', x0, H - 26); x.globalAlpha = 1;
    } else if(u < 15.5){                                           // Black Friday
      const v = u - 13; x.fillStyle = NEGRO; x.fillRect(0, 0, W, H);
      x.save(); x.translate(x0, H/2 - 10); x.rotate(v*.25); x.fillStyle = 'rgba(194,97,58,.16)';
      for(let i = 0; i < 12; i++){ x.rotate(Math.PI/6); x.beginPath(); x.moveTo(0, 0); x.lineTo(260, -38); x.lineTo(260, 38); x.fill(); } x.restore();
      const s = rebote(v/.5); x.save(); x.translate(x0, H/2 - 30); x.scale(s, s); x.fillStyle = CREMA; x.font = `700 46px ${SERIF}`; espaciado('BLACK', 0, -22, 8); x.fillStyle = TERRA; espaciado('FRIDAY', 0, 26, 8); x.restore();
      if(v > .5 && (v*2.4 | 0) % 2 === 0 || v > 1.8){ x.fillStyle = CREMA; x.font = `600 17px ${SANS}`; x.fillText('Black Friday · 27 de noviembre', x0, H - 54); }
      x.fillStyle = 'rgba(246,241,231,.5)'; x.font = `500 11px ${SANS}`; x.fillText('Apúntalo en la nevera (con un imán)', x0, H - 30);
    } else {                                                       // cierre con la marca
      const v = u - 15.5; x.fillStyle = CREMA; x.fillRect(0, 0, W, H);
      const s = ease(v/.5); x.globalAlpha = s; logo(x0 - 30, 64 - 10*(1 - s), 60); marca(x0, 160, 22); x.fillStyle = TERRA; x.font = `600 13px ${SANS}`; x.fillText('momenturies.com', x0, 196); x.globalAlpha = 1;
    }
  }

  /* ── canal 2: el tiempo en casa ── */
  const TIEMPO = {
    salon:['Salón', '☀️', 22], cocina:['Cocina', '🔥', 26], dormitorio:['Dormitorio', '😴', 20], despacho:['Despacho', '⛈️', 23], pasillo:['Pasillo', '💨', 18],
    terraza:['Terraza', '🐦', 19], recibidor:['Recibidor', '☂️', 17], bano:['Baño', '🌫️', 31], distribuidor:['Distribuidor', '💨', 19], dormitorio2:['Invitados', '🌙', 20],
    bano2:['Baño', '🌫️', 28], biblioteca:['Biblioteca', '🤫', 21], vestidor:['Vestidor', '🧦', 20], suite:['Suite', '💤', 21], bano_suite:['Baño', '🫧', 29],
  };
  const PREVISION = [['Sofá', 'chubascos de mantas', '🛋️'], ['Pasillo', 'corrientes de calcetín', '🧦'], ['Terraza', 'alerta amarilla por gaviotas', '⚠️'], ['Cocina', 'olor a croquetas en aumento', '🍽️']];
  function tiempo(t){
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1f4a7a'); g.addColorStop(1, '#0d2442'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = TERRA; x.fillRect(0, 12, 232, 30); x.fillStyle = CREMA; x.font = `700 15px ${SERIF}`; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('EL TIEMPO EN CASA', 14, 28);
    const pag = Math.floor(t/6) % 3, v = t % 6;
    if(pag < 2){
      const ss = api.salas.filter(s => s.p === pag), X0 = Math.min(...ss.map(s => s.x0)), X1 = Math.max(...ss.map(s => s.x1)), Z0 = Math.min(...ss.map(s => s.z0)), Z1 = Math.max(...ss.map(s => s.z1));
      const k = Math.min((W - 40)/(X1 - X0), (H - 108)/(Z1 - Z0)), ox = (W - (X1 - X0)*k)/2, oy = 52;
      x.fillStyle = 'rgba(255,255,255,.7)'; x.font = `600 10px ${SANS}`; x.textAlign = 'right'; x.fillText(pag ? 'PLANTA ALTA' : 'PLANTA BAJA', W - 14, 28 + 14);
      ss.forEach((s, i) => { const a = ox + (s.x0 - X0)*k, b = oy + (s.z0 - Z0)*k, w = (s.x1 - s.x0)*k - 3, h = (s.z1 - s.z0)*k - 3, d = TIEMPO[s.id] || [s.id, '☁️', 20];
        const e = ease((v - i*.08)/.4); if(e <= 0) return; x.globalAlpha = e;
        x.fillStyle = s.id === 'terraza' ? 'rgba(120,190,120,.35)' : 'rgba(246,241,231,.16)'; x.fillRect(a, b, w, h); x.strokeStyle = 'rgba(246,241,231,.5)'; x.lineWidth = 1; x.strokeRect(a + .5, b + .5, w - 1, h - 1);
        const cx = a + w/2, cy = b + h/2, peq = w < 60 || h < 40; x.textAlign = 'center';
        x.font = `${peq ? 15 : 22}px ${SANS}`; x.fillText(d[1], cx - (peq ? 0 : 18), cy - (peq ? 8 : 4));
        x.fillStyle = '#fff'; x.font = `700 ${peq ? 12 : 18}px ${SANS}`; x.fillText(Math.round(d[2]*e) + '°', cx + (peq ? 0 : 20), cy + (peq ? 9 : -4));
        if(!peq){ x.fillStyle = 'rgba(255,255,255,.75)'; x.font = `500 10px ${SANS}`; x.fillText(d[0], cx, cy + 18); }
        x.globalAlpha = 1; });
      if(pag === 0){ const a = ox + (380 - X0)*k, b = oy + (640 - Z0)*k, p = .5 + .5*Math.sin(t*5);      // la nevera, aparte
        x.fillStyle = `rgba(110,190,255,${.55 + .35*p})`; x.beginPath(); x.roundRect(a, b, 40, 18, 4); x.fill(); x.fillStyle = '#fff'; x.font = `700 11px ${SANS}`; x.fillText('🧊 4°', a + 20, b + 10); }
      for(let i = 0; i < 3; i++){ const nx = ((t*14 + i*150) % (W + 120)) - 60, ny = 70 + i*52;                             // nubecitas que pasan
        x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.arc(nx, ny, 12, 0, 7); x.arc(nx + 14, ny - 6, 14, 0, 7); x.arc(nx + 30, ny, 11, 0, 7); x.fill(); }
    } else {
      x.fillStyle = '#fff'; x.font = `700 17px ${SERIF}`; x.textAlign = 'left'; x.fillText('Previsión para el fin de semana', 22, 70);
      PREVISION.forEach(([a, b, c], i) => { const e = ease((v - .3 - i*.35)/.4); if(e <= 0) return; const y = 104 + i*34; x.globalAlpha = e;
        x.fillStyle = 'rgba(246,241,231,.12)'; x.fillRect(22 - 20*(1 - e), y - 14, W - 44, 28); x.font = `18px ${SANS}`; x.fillText(c, 30, y + 1);
        x.fillStyle = '#ffd77a'; x.font = `700 13px ${SANS}`; x.fillText(a, 60, y + 1); x.fillStyle = '#fff'; x.font = `500 13px ${SANS}`; x.fillText(b, 140, y + 1); x.globalAlpha = 1; });
    }
    x.fillStyle = CREMA; x.fillRect(0, H - 38, W, 38); x.fillStyle = TERRA; x.fillRect(0, H - 38, 6, 38);
    x.fillStyle = NEGRO; x.font = `700 15px ${SERIF}`; x.textAlign = 'center'; x.fillText('100 % de probabilidad de recuerdos', W/2, H - 19);
  }

  /* ── canal 3: noticias 24 h ── */
  const NOTICIAS = [
    ['Alguien se ha comido lo del táper', 'La nevera no quiere hacer declaraciones', '🥡'],
    ['El vecino de abajo pide silencio', '«Parece que saltan encima de mi techo»', '🔨'],
    ['Una gaviota roba una patata en la terraza', 'Los testigos hablan de un vuelo rasante', '🐦'],
    ['El sofá vuelve a su forma tras un salto', 'Los cojines, en observación', '🛋️'],
    ['El señor del retrato niega estar mirando', 'Fuentes de la biblioteca lo ponen en duda', '🧐'],
    ['Aparece un calcetín detrás de la lavadora', 'Se busca a su pareja', '🧦'],
  ];
  const RODILLO = 'Última hora: alguien se ha comido lo del táper   ·   El vecino de abajo pide silencio   ·   Una gaviota roba una patata en la terraza   ·   La nevera, abierta más de diez segundos: los expertos, preocupados   ·   Sube el precio del papel de aluminio   ·   ';
  let rodilloW = 0;
  function noticias(t){
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#16202e'); g.addColorStop(1, '#2a1a1a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,255,255,.05)'; x.lineWidth = 1; for(let i = -H; i < W; i += 22){ x.beginPath(); x.moveTo(i + (t*6 % 22), 0); x.lineTo(i + H + (t*6 % 22), H); x.stroke(); }
    x.textBaseline = 'middle'; x.textAlign = 'left';
    x.fillStyle = TERRA; x.fillRect(12, 12, 104, 28); x.fillStyle = '#fff'; x.font = `800 14px ${SANS}`; x.fillText('NOTICIAS 24 H', 19, 26);
    if((t*1.5 | 0) % 2 === 0){ x.fillStyle = '#e8322b'; x.beginPath(); x.arc(130, 26, 5, 0, 7); x.fill(); } x.fillStyle = 'rgba(255,255,255,.85)'; x.font = `700 10px ${SANS}`; x.fillText('EN DIRECTO', 140, 26);
    const n = Math.floor(t/5) % NOTICIAS.length, v = t % 5, [tit, sub, ico] = NOTICIAS[n], e = ease(v/.45);
    x.save(); x.translate(-30*(1 - e), 0); x.globalAlpha = e;
    const ig = x.createLinearGradient(16, 58, 128, 170); ig.addColorStop(0, '#e3b08e'); ig.addColorStop(1, TERRA); x.fillStyle = ig; x.beginPath(); x.roundRect(16, 58, 112, 112, 6); x.fill();
    x.textAlign = 'center'; x.font = `${58 + 4*Math.sin(t*3)}px ${SANS}`; x.fillText(ico, 72, 116);
    x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(16, 156, 112, 14); x.fillStyle = '#fff'; x.font = `600 8px ${SANS}`; x.fillText('IMAGEN DE ARCHIVO', 72, 163);
    x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = `700 21px ${SERIF}`;
    envuelve(tit, W - 160).slice(0, 4).forEach((l, i) => x.fillText(l, 142, 74 + i*25));
    x.fillStyle = 'rgba(255,255,255,.7)'; x.font = `italic 12px ${SERIF}`; envuelve(sub, W - 160).slice(0, 2).forEach((l, i) => x.fillText(l, 142, 186 + i*15));
    x.restore();
    /* rodillo de abajo */
    x.fillStyle = '#d0342c'; x.fillRect(0, H - 58, 104, 24); x.fillStyle = '#fff'; x.font = `800 11px ${SANS}`; x.fillText('ÚLTIMA HORA', 12, H - 46);
    x.fillStyle = 'rgba(246,241,231,.95)'; x.fillRect(0, H - 34, W, 34);
    x.fillStyle = NEGRO; x.font = `600 14px ${SANS}`; if(!rodilloW) rodilloW = x.measureText(RODILLO).width;
    const r = -((t*58) % rodilloW); x.fillText(RODILLO, r, H - 17); x.fillText(RODILLO, r + rodilloW, H - 17);
    const d = new Date(); x.fillStyle = TERRA; x.fillRect(W - 58, H - 34, 58, 34); x.fillStyle = '#fff'; x.font = `700 14px ${SANS}`; x.textAlign = 'center';
    x.fillText(String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'), W - 29, H - 17);
  }

  const CANALES = [['Momenturies', anuncio], ['El tiempo en casa', tiempo], ['Noticias 24 h', noticias]];

  /* ── sonidos ── */
  function nota(f, t0, dur, vol = .05, tipo = 'sine', f1){ const a = api.ac(); if(!a) return; const T = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, T); if(f1) o.frequency.exponentialRampToValueAtTime(f1, T + dur);
    g.gain.setValueAtTime(.0001, T); g.gain.exponentialRampToValueAtTime(vol, T + .012); g.gain.exponentialRampToValueAtTime(.0001, T + dur);
    o.connect(g).connect(a.destination); o.start(T); o.stop(T + dur + .02); }
  const clic = () => { nota(2200, 0, .03, .08, 'square'); api.golpe(0, .12); };
  const sintonia = c => { if(c === 0) [523, 659, 784, 1047].forEach((f, i) => nota(f, .05 + i*.11, .3, .045));
    else if(c === 1) [880, 1175].forEach((f, i) => nota(f, .05 + i*.16, .5, .035));
    else [392, 392, 523].forEach((f, i) => nota(f, .05 + i*.14, i === 2 ? .45 : .1, .045, 'triangle')); };

  /* ── estado ── */
  let estado = 'off', canal = 0, desde = 0, reloj = 0, acum = 0, osd = 0;
  function enciende(){
    cargaFotos(); estado = 'enciende'; desde = 0; canal = 0; reloj = 0; osd = 2.4; acum = PASO; pantalla.visible = true;
    clic(); api.ruido(.6, 9000, 1400, .07, .05); nota(15000, .05, .8, .006); setTimeout(() => sintonia(0), 380);
    if(!api.ya('tele')) setTimeout(() => api.encontrado('tele', { emoji:'📺' }), 700);
  }
  function zapea(){
    if(canal >= CANALES.length - 1){ estado = 'apaga'; desde = 0; acum = PASO; clic(); api.ruido(.3, 2600, 200, .08); nota(900, .02, .35, .04, 'sine', 60); return; }
    canal++; estado = 'zap'; desde = 0; reloj = 0; osd = 2.4; acum = PASO; clic(); api.ruido(.3, 7000, 2500, .16); setTimeout(() => estado === 'on' && sintonia(canal), 320);
  }
  const pulsa = () => { if(estado === 'off') enciende(); else if(estado === 'on') zapea(); else if(estado === 'zap'){ estado = 'on'; zapea(); } };
  function apagaYa(){ estado = 'off'; pantalla.visible = false; api.pinta(); }

  /* ── pintar un fotograma ── */
  function fotograma(){
    x.save(); x.textAlign = 'center'; x.textBaseline = 'middle';
    if(estado === 'apaga'){                                        // la imagen se recoge en una raya y luego en un punto
      const k = Math.min(1, desde/.45); x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
      if(k < .4){ const h = Math.max(2, H*(1 - k/.4)); x.fillStyle = '#fff'; x.fillRect(0, H/2 - h/2, W, h); }
      else if(k < .75){ const w = W*(1 - (k - .4)/.35); x.fillStyle = '#fff'; x.fillRect(W/2 - w/2, H/2 - 1.5, w, 3); }
      else { const g = x.createRadialGradient(W/2, H/2, 0, W/2, H/2, 10); g.addColorStop(0, `rgba(255,255,255,${1 - (k - .75)/.25})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(W/2 - 12, H/2 - 12, 24, 24); }
      x.restore(); tex.needsUpdate = true; return;
    }
    if(estado === 'zap'){ nieve(); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, (desde*900) % H, W, 30); }
    else { x.globalAlpha = 1; CANALES[canal][1](reloj); x.globalAlpha = 1; x.textAlign = 'center'; x.textBaseline = 'middle';
      nieve(.07); }
    if(estado === 'enciende'){                                     // la raya blanca que se abre
      const k = Math.min(1, desde/.55);
      if(k < .3){ const w = W*ease(k/.3); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; x.fillRect(W/2 - w/2, H/2 - 2, w, 4);
        x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(W/2 - w/2, H/2 - 7, w, 14); }
      else { const h = H*ease((k - .3)/.7); x.fillStyle = '#000'; x.fillRect(0, 0, W, H/2 - h/2); x.fillRect(0, H/2 + h/2, W, H/2 - h/2 + 1);
        x.fillStyle = `rgba(255,255,255,${.85*(1 - (k - .3)/.7)})`; x.fillRect(0, H/2 - h/2, W, h); }
    }
    const barra = (reloj*40) % (H + 80) - 40; x.fillStyle = 'rgba(255,255,255,.035)'; x.fillRect(0, barra, W, 40);   // la franja que baja
    x.drawImage(LINEAS, 0, 0);
    if(estado !== 'enciende' || desde > .3){                       // número de canal arriba a la derecha
      const grande = osd > 0; x.textAlign = 'right'; x.font = `700 ${grande ? 30 : 16}px "Courier New", monospace`; x.lineWidth = 4; x.strokeStyle = 'rgba(0,0,0,.7)';
      const num = String(canal + 1), xx = W - 24, yy = grande ? 36 : 28; x.strokeText(num, xx, yy); x.fillStyle = '#6dff7a'; x.fillText(num, xx, yy);
      if(grande){ x.font = `700 11px "Courier New", monospace`; x.strokeText(CANALES[canal][0].toUpperCase(), xx, yy + 24); x.fillText(CANALES[canal][0].toUpperCase(), xx, yy + 24); }
    }
    x.drawImage(VINETA, 0, 0);
    x.restore(); tex.needsUpdate = true;
  }

  /* ── toque ── */
  const _p = new THREE.Vector3();
  api.toque(ray => {
    if(api.PISO !== 0) return null;
    if(!ray.ray.intersectBox(CAJA, _p)) return null;
    return { d:_p.distanceTo(camera.position), f:pulsa, p:_p.clone() };
  });

  /* ── cada fotograma: poco trabajo; repinta como mucho a 12 fps y solo encendida en el salón ── */
  api.tick(dt => {
    if(estado === 'off') return;
    const s = api.salaEn(pos.x, pos.z);
    if(api.PISO !== 0 || !s || s.id !== 'salon' || Math.hypot(pos.x - CENTRO.x, pos.z - CENTRO.z) > 700){ apagaYa(); return; }
    dt = Math.min(dt, .1); desde += dt; reloj += dt; if(osd > 0) osd -= dt;
    if(estado === 'enciende' && desde > .55) estado = 'on';
    else if(estado === 'zap' && desde > .3){ estado = 'on'; reloj = 0; }
    else if(estado === 'apaga' && desde > .5){ apagaYa(); return; }
    acum += dt; if(acum < PASO) return; acum %= PASO;
    fotograma(); api.pinta();
  });

  api.reinicia(() => { estado = 'off'; canal = 0; pantalla.visible = false; x.fillStyle = '#000'; x.fillRect(0, 0, W, H); tex.needsUpdate = true; });
}
