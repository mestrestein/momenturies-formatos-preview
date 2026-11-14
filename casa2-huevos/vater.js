/* casa2-huevos/vater.js · los váteres (huevo 'retrete'). Ver blender/momenturies-rooms/GUIA_AGENTES_13nov.md, Agente A.
   Las tapas (malla 'inodoro_tapa') se cuelgan de su bisagra y se abren al tocar la taza; el pulsador de la pared tira de la cadena.
   En el baño de abajo espera la cagada, con sus dos moscas. Al tirar: remolino, se va, y cuenta el huevo. */
export default function(api){
  const { THREE, scene, camera, pos, RAICES } = api;
  const TAPA_MAT = new THREE.MeshBasicMaterial({ color:'#e6e3dc' });
  const miles = api.miles || (n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'));

  /* ── 1. buscar las tapas (si no hay, es un glb viejo: se queda la caja de antes) ── */
  scene.updateMatrixWorld(true);
  const sueltas = [];
  scene.traverse(o => { if(o.isMesh && o.userData.mat === 'inodoro_tapa') sueltas.push(o); });
  if(!sueltas.length) return;
  api.quitaCaja('retrete');

  /* agrupar por váter (por si una tapa viniera en varios trozos) */
  const grupos = [], _b = new THREE.Box3(), _c = new THREE.Vector3();
  sueltas.forEach(o => { _b.setFromObject(o); _b.getCenter(_c);
    let g = grupos.find(q => q.c.distanceTo(_c) < 30);
    if(!g){ g = { c:_c.clone(), b:new THREE.Box3(), m:[] }; grupos.push(g); }
    g.m.push(o); g.b.union(_b); });

  const zonaDe = o => { for(let p = o; p; p = p.parent) if(p.userData && p.userData.zona) return p.userData.zona; return null; };
  /* los tres que conocemos: todos con la pared en x */
  const SABIDOS = [{ x:1300, z:880, y:0 }, { x:652, z:330, y:300 }, { x:1300, z:1000, y:300 }];
  const A = 1.5;                                   // giro de la tapa abierta (rad), sin pasar de la vertical
  const smooth = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a)/(b - a))); return k*k*(3 - 2*k); };

  /* ── 2. texturas pequeñas y compartidas ── */
  const TEX_REMOLINO = api.lienzo(128, 128, (x, w, h) => {
    x.translate(w/2, h/2); x.lineCap = 'round';
    for(let brazo = 0; brazo < 4; brazo++){ x.save(); x.rotate(brazo*Math.PI/2); x.beginPath();
      for(let i = 0; i <= 40; i++){ const k = i/40, ang = k*4.2, r = 6 + k*54; i ? x.lineTo(Math.cos(ang)*r, Math.sin(ang)*r) : x.moveTo(Math.cos(ang)*r, Math.sin(ang)*r); }
      x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 5; x.stroke(); x.restore(); }
    const g = x.createRadialGradient(0, 0, 0, 0, 0, 62); g.addColorStop(0, 'rgba(120,170,200,.55)'); g.addColorStop(.7, 'rgba(190,225,240,.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 62, 0, 2*Math.PI); x.fill(); });
  const TEX_PESTE = api.lienzo(64, 128, (x, w, h) => {
    x.strokeStyle = 'rgba(150,192,70,.9)'; x.lineWidth = 7; x.lineCap = 'round'; x.shadowColor = 'rgba(170,210,90,.8)'; x.shadowBlur = 8;
    x.beginPath(); for(let i = 0; i <= 24; i++){ const k = i/24, y = h - 10 - k*(h - 20), xx = w/2 + Math.sin(k*Math.PI*2.4)*14; i ? x.lineTo(xx, y) : x.moveTo(xx, y); } x.stroke(); });

  /* ── 3. sonidos (Web Audio, sin archivos) ── */
  let RUIDO = null;
  const bufRuido = a => { if(RUIDO && RUIDO.sampleRate === a.sampleRate) return RUIDO;
    const n = a.sampleRate*2, b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    let ult = 0; for(let i = 0; i < n; i++){ const w = Math.random()*2 - 1; ult = ult*.6 + w*.4; d[i] = w*.7 + ult*.6; } return RUIDO = b; };
  /* ruido filtrado con envolvente: tipo de filtro y frecuencia que va de fA a fB */
  function sopla(t0, dur, tipo, fA, fB, vol, q = 1){ const a = api.ac(); if(!a) return; const T = a.currentTime + t0;
    const s = a.createBufferSource(); s.buffer = bufRuido(a); s.loop = true;
    const f = a.createBiquadFilter(); f.type = tipo; f.Q.value = q; f.frequency.setValueAtTime(fA, T); f.frequency.exponentialRampToValueAtTime(fB, T + dur);
    const g = a.createGain(), at = Math.min(.18, dur/4);
    g.gain.setValueAtTime(.0001, T); g.gain.exponentialRampToValueAtTime(vol, T + at);
    g.gain.setValueAtTime(vol, T + Math.max(at, dur*.55)); g.gain.exponentialRampToValueAtTime(.0001, T + dur);
    s.connect(f).connect(g).connect(a.destination); s.start(T, Math.random()); s.stop(T + dur + .05); }
  /* burbuja de agua: un seno que sube de golpe */
  function glup(t0, f0, f1, dur, vol){ const a = api.ac(); if(!a) return; const T = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f0, T); o.frequency.exponentialRampToValueAtTime(f1, T + dur);
    g.gain.setValueAtTime(.0001, T); g.gain.exponentialRampToValueAtTime(vol, T + .008); g.gain.exponentialRampToValueAtTime(.0001, T + dur);
    o.connect(g).connect(a.destination); o.start(T); o.stop(T + dur + .02); }
  /* clic de plástico */
  function clic(t0, vol = .08, f = 2300){ const a = api.ac(); if(!a) return; const T = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(f, T); o.frequency.exponentialRampToValueAtTime(f*.45, T + .03);
    g.gain.setValueAtTime(.0001, T); g.gain.exponentialRampToValueAtTime(vol, T + .003); g.gain.exponentialRampToValueAtTime(.0001, T + .04);
    o.connect(g).connect(a.destination); o.start(T); o.stop(T + .05); }
  function sonCisterna(){
    clic(0, .1, 2000); clic(.05, .05, 1500);                                       // el pulsador
    sopla(.1, .7, 'highpass', 3200, 2200, .1);                                     // abre la válvula
    sopla(.14, 2.4, 'bandpass', 1500, 520, .5, .7);                                // el chorro
    sopla(.22, 2.1, 'lowpass', 800, 170, .32);                                     // el retumbe de la taza
    for(let i = 0; i < 9; i++){ const f0 = 130 + Math.random()*140; glup(.75 + Math.random()*1.7, f0, f0*(2.1 + Math.random()*1.2), .05 + Math.random()*.07, .05 + Math.random()*.06); }
    glup(2.32, 320, 980, .2, .1); glup(2.5, 180, 620, .16, .08);                   // el «glugluuú» del final
    sopla(2.5, 4.3, 'bandpass', 480, 1250, .07, 2.4);                              // se vuelve a llenar
    sopla(2.6, 4.1, 'highpass', 4200, 3800, .018);
    clic(6.75, .04, 900); api.golpe(6.78, .07);                                    // la boya cierra
  }
  const sonAbre = () => { sopla(0, .26, 'bandpass', 800, 1700, .05, 1.2); };
  const sonToca = (s) => { api.golpe(0, .34*s); sopla(0, .08, 'bandpass', 2600, 1700, .26*s, 1.6); clic(0, .07*s, 3000); };

  /* ── 4. montar cada váter ── */
  const V = [];
  grupos.forEach(G => {
    const b = G.b, c = b.getCenter(new THREE.Vector3()), size = b.getSize(new THREE.Vector3()), suelo = b.min.y - 44.4;
    let n = 'x', dir = 1;
    const s0 = SABIDOS.find(k => Math.abs(c.z - k.z) < 60 && Math.abs(suelo - k.y) < 60 && Math.abs(c.x - k.x) < 90);
    if(s0) dir = Math.sign(s0.x - c.x) || 1;
    else { n = size.x >= size.z ? 'x' : 'z'; const s = api.salaEn && api.salaEn(c.x, c.z, suelo > 150 ? 1 : 0);
      if(s) dir = n === 'x' ? ((s.x1 - b.max.x) < (b.min.x - s.x0) ? 1 : -1) : ((s.z1 - b.max.z) < (b.min.z - s.z0) ? 1 : -1); }
    const N = n === 'x' ? new THREE.Vector3(dir, 0, 0) : new THREE.Vector3(0, 0, dir);     // hacia la pared
    const Tg = n === 'x' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);       // a lo largo de la pared
    const borde = n === 'x' ? (dir > 0 ? b.max.x : b.min.x) : (dir > 0 ? b.max.z : b.min.z);
    const bis = c.clone(); bis.y = (b.min.y + b.max.y)/2; if(n === 'x') bis.x = borde; else bis.z = borde;
    const pared = bis.clone().addScaledVector(N, 5);                                       // la tapa empieza a 5 cm de la pared

    const zona = zonaDe(G.m[0]), raiz = zona && RAICES[zona];
    const base = new THREE.Group(); scene.add(base);
    const piv = new THREE.Group(); piv.position.copy(bis); base.add(piv); scene.updateMatrixWorld(true);
    G.m.forEach(o => { piv.attach(o); o.material = TAPA_MAT; });   // 14-nov: la cara de abajo salía horneada en negro (la tapa estaba cerrada al hornear)

    /* el remolino del agua (se ve al tirar de la cadena, con la tapa abierta) */
    const rr = Math.max(4, Math.min(7, Math.min(size.x, size.z)*.2));
    const remo = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ map:TEX_REMOLINO, transparent:true, opacity:0, depthWrite:false, toneMapped:false, polygonOffset:true, polygonOffsetFactor:-2 }));
    remo.rotation.x = -Math.PI/2; remo.scale.set(rr, rr*1.12, 1); remo.position.set(c.x, suelo + 32.45, c.z); remo.visible = false; base.add(remo);

    /* cajas para tocar: la taza (más alta con la tapa levantada) y el pulsador de la pared */
    const taza = new THREE.Box3(new THREE.Vector3(b.min.x - 2, suelo + 12, b.min.z - 2), new THREE.Vector3(b.max.x + 2, suelo + 50, b.max.z + 2));
    const cp = pared.clone().addScaledVector(N, -1); cp.y = suelo + 104.5;
    const tam = n === 'x' ? new THREE.Vector3(7, 19, 26) : new THREE.Vector3(26, 19, 7);
    const puls = new THREE.Box3().setFromCenterAndSize(cp, tam);
    const pPuls = cp.clone().addScaledVector(N, -14);                                      // punto de comprobación, fuera de la pared
    const pTaza = new THREE.Vector3(c.x, suelo + 40, c.z);

    if(raiz) api.mundo(zona).add(base);
    V.push({ zona, raiz, n, dir, N, Tg, c, suelo, piv, remo, taza, puls, pPuls, pTaza, a:0, v:0, meta:0, fl:-1, quieto:true, golpes:0 });
  });

  const ponTapa = w => { const g = A*w.a; if(w.n === 'x') w.piv.rotation.z = -w.dir*g; else w.piv.rotation.x = w.dir*g; };

  /* ── 5. la cagada 💩 (solo en el baño de abajo) ── */
  const abajo = V.find(w => w.suelo < 150 && (w.zona === 'bano' || Math.abs(w.c.x - 1270) < 60)) || V.find(w => w.suelo < 150);
  let po = null;
  if(abajo){
    const w = abajo, M = new THREE.MeshStandardMaterial({ color:'#7a4523', roughness:.26, metalness:.02, emissive:'#2b1206', emissiveIntensity:.55 });
    const g = new THREE.Group(), cuerpo = new THREE.Group(); g.add(cuerpo);
    [[3.4, 1.75, 1.7, 0, 0], [2.55, 1.42, 4.35, .25, -.15], [1.65, 1.12, 6.5, -.2, .2]].forEach(([R, r, y, dx, dz], i) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, 10, 22), M); m.rotation.x = -Math.PI/2; m.rotation.y = (i - 1)*.07;
      m.position.set(dx, y, dz); cuerpo.add(m); });
    /* la punta, un poco torcida */
    const punta = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [1.55, 0], [1.6, .55], [1.25, 1.35], [.7, 2.15], [.25, 2.9], [0, 3.15]].map(([x, y]) => new THREE.Vector2(x, y)), 12), M);
    punta.position.set(-.15, 7.05, .15); punta.rotation.z = .28; cuerpo.add(punta);
    /* la cara: ojos y sonrisa, mirando a la puerta */
    const cara = new THREE.Group(); cuerpo.add(cara);
    const blanco = new THREE.MeshBasicMaterial({ color:'#ffffff', toneMapped:false }), negro = new THREE.MeshBasicMaterial({ color:'#140c08', toneMapped:false });
    const ojos = [-1.15, 1.15].map(x => { const o = new THREE.Group(); o.position.set(x, 4.95, 3.5);
      const bl = new THREE.Mesh(new THREE.SphereGeometry(.78, 12, 8), blanco); bl.scale.z = .6; o.add(bl);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(.4, 10, 6), negro); pu.position.set(0, -.05, .42); o.add(pu);
      const br = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 4), blanco); br.position.set(.14, .12, .78); o.add(br);
      cara.add(o); return o; });
    const boca = new THREE.Mesh(new THREE.TorusGeometry(.95, .2, 6, 14, Math.PI), negro);
    boca.rotation.z = Math.PI; boca.position.set(0, 3.75, 3.82); boca.rotation.x = -.25; cara.add(boca);
    const yaw0 = Math.atan2(-w.N.x, -w.N.z);                                   // de frente a la habitación
    g.position.set(w.c.x, w.suelo + 32.3 - .7, w.c.z); g.rotation.y = yaw0; scene.add(g);

    /* las moscas: cuerpo + alas (un solo plano doble) */
    const mCu = new THREE.MeshStandardMaterial({ color:'#1d2326', roughness:.3, metalness:.55 });
    const mAla = new THREE.MeshBasicMaterial({ color:'#e8f0f4', transparent:true, opacity:.5, side:THREE.DoubleSide, depthWrite:false });
    const gAla = new THREE.BufferGeometry(); gAla.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .1, -1, 0, -.35, -.9, 0, .45, 0, 0, .1, .9, 0, .45, 1, 0, -.35], 3));
    const moscas = [0, 1].map(i => { const f = new THREE.Group();
      const cu = new THREE.Mesh(new THREE.SphereGeometry(.5, 8, 6), mCu); cu.scale.set(.8, .75, 1.35); f.add(cu);
      const ca = new THREE.Mesh(new THREE.SphereGeometry(.34, 8, 6), mCu); ca.position.z = .72; f.add(ca);
      const al = new THREE.Mesh(gAla, mAla); al.position.set(0, .38, .05); f.add(al);
      f.visible = false; scene.add(f);
      return { f, al, i, fase:i*2.6 + .7, w:i ? -2.3 : 1.9, prev:new THREE.Vector3(), vel:new THREE.Vector3(), huye:-1, pan:null, osc:null, gan:null }; });
    /* el tufillo: tres rayitas verdes que suben */
    const peste = [0, 1, 2].map(i => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map:TEX_PESTE, transparent:true, opacity:0, depthWrite:false, toneMapped:false }));
      s.scale.set(3, 6, 1); s.visible = false; scene.add(s); return s; });

    if(w.raiz){ const M = api.mundo(w.raiz.userData.zona); M.add(g); moscas.forEach(m => M.add(m.f)); peste.forEach(s => M.add(s)); }
    po = { w, g, cuerpo, cara, ojos, moscas, peste, yaw0, y0:g.position.y, estado:'ahi', k:0, giro:0, orb:0, parpa:2.5 + Math.random()*2 };
  }

  /* zumbido: dos sierras con vibrato, paneadas según dónde esté cada mosca */
  let zum = null;
  function zumbido(){
    if(zum) return zum; const a = api.ac(); if(!a) return null;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(a.destination);
    po.moscas.forEach((m, i) => {
      const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = i ? 236 : 198;
      const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 6.5 + i*1.7; lg.gain.value = 7; lfo.connect(lg).connect(o.frequency);
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 560 + i*90; bp.Q.value = .8;
      const g = a.createGain(); g.gain.value = 0;
      let sal = g; if(a.createStereoPanner){ m.pan = a.createStereoPanner(); g.connect(m.pan); sal = m.pan; }
      o.connect(bp).connect(g); sal.connect(lp); o.start(); lfo.start();
      m.osc = o; m.lfo = lfo; m.gan = g; });
    return zum = { a, lp, cada:0 };
  }
  function callaZumbido(){
    if(!zum) return; const z = zum; zum = null; const T = z.a.currentTime;
    po.moscas.forEach(m => { if(!m.gan) return; m.gan.gain.setTargetAtTime(0, T, .08); m.osc.stop(T + .5); m.lfo.stop(T + .5); m.osc = m.lfo = m.gan = m.pan = null; });
    setTimeout(() => { try{ z.lp.disconnect(); }catch(_){} }, 700);
  }

  /* ── 6. acciones ── */
  let tiradas = 0;
  function tapa(w, abre = !w.meta){
    if(abre === !!w.meta) return; w.meta = abre ? 1 : 0; w.quieto = false; w.golpes = 0;
    if(abre){ w.v = Math.max(w.v, .4); sonAbre(); } else w.v = Math.min(w.v, -.3);
    api.pinta();
  }
  function cisterna(w){
    if(w.fl >= 0 && w.fl < 6.9){                                                 // aún se está llenando
      clic(0, .09, 2000); sopla(.02, .25, 'highpass', 3000, 2400, .03);
      if(w.fl > 1.2) api.aviso({ emoji:'🚰', t:'La cisterna se está llenando', x:'Paciencia, que esto no es una fuente.', ms:2000 });
      return; }
    const tira = () => { w.fl = 0; tiradas++; sonCisterna(); w.remo.visible = true;
      if(po && po.w === w && po.estado === 'ahi'){ po.estado = 'baja'; po.k = 0;
        po.moscas.forEach(m => { if(!m.f.visible) return; m.huye = 0;
          m.vel.set(m.f.position.x - po.g.position.x, 0, m.f.position.z - po.g.position.z).normalize().multiplyScalar(45).addScaledVector(w.N, -25); m.vel.y = 55; }); }
      api.pinta(); };
    /* con la cagada dentro y la tapa bajada, primero se levanta la tapa: el espectáculo hay que verlo */
    if(po && po.w === w && po.estado === 'ahi' && !w.meta){ tapa(w, true); setTimeout(tira, 550); } else tira();
  }

  const _p = new THREE.Vector3();
  api.toque(ray => {
    let mejor = null;
    V.forEach(w => {
      if(w.raiz && !w.raiz.visible) return;
      if(Math.abs(camera.position.y - (w.suelo + 120)) > 170) return;
      if(ray.ray.intersectBox(w.puls, _p)){ const d = _p.distanceTo(camera.position); if(!mejor || mejor.pr < 2 || d < mejor.d) mejor = { d, f:() => cisterna(w), p:w.pPuls, pr:2 }; return; }
      w.taza.max.y = w.suelo + (w.meta ? 95 : 50);
      if(ray.ray.intersectBox(w.taza, _p)){ const d = _p.distanceTo(camera.position); if(!mejor || (mejor.pr < 2 && d < mejor.d)) mejor = { d, f:() => tapa(w), p:w.pTaza, pr:1 }; }
    });
    return mejor && { d:mejor.d, f:mejor.f, p:mejor.p };
  });

  /* ── 7. cada fotograma ── */
  const cam = camera.position, _v = new THREE.Vector3(), _r = new THREE.Vector3();
  api.tick((dt0, t) => {
    const dt = Math.min(dt0, .05);
    let mueve = false;
    V.forEach(w => {
      /* la tapa: muelle hacia arriba (con un pelín de rebote contra la cisterna); al cerrar cae y rebota en el asiento con su «clac» */
      if(!w.quieto){
        const acc = w.meta ? 140*(1 - w.a) - 16*w.v : -150*w.a - 7*w.v - 2;
        w.v += acc*dt; w.a += w.v*dt;
        if(w.a > 1.045){ w.a = 1.045; if(w.v > .6) clic(0, Math.min(.06, w.v*.03), 1300); w.v *= -.3; }
        if(w.a < 0){ w.a = 0; const s = Math.min(1, -w.v/4); if(s > .06){ sonToca(s*(w.golpes ? .45 : 1)); w.golpes++; } w.v = -w.v*.26; if(w.v < .25) w.v = 0; }
        if(Math.abs(w.meta - w.a) < .002 && Math.abs(w.v) < .02){ w.a = w.meta; w.v = 0; w.quieto = true; }
        ponTapa(w); mueve = true;
      }
      /* el remolino */
      if(w.fl >= 0){ w.fl += dt;
        const op = smooth(.3, .75, w.fl)*(1 - smooth(1.9, 2.8, w.fl));
        w.remo.material.opacity = op*.8; w.remo.rotation.z -= dt*(3 + 9*op); w.remo.visible = op > .005;
        if(w.fl < 3) mueve = true;
        if(w.fl > 7){ w.fl = -1; w.remo.visible = false; } }
    });

    if(po){
      const w = po.w, abierta = w.a > .08;
      const cerca = api.PISO === 0 && Math.hypot(cam.x - po.g.position.x, cam.z - po.g.position.z) < 420;
      /* la cagada: respira, parpadea y te sigue con la mirada; al tirar, gira en espiral y se hunde */
      if(po.estado === 'ahi' && cerca && abierta){
        const k = 1 + .03*Math.sin(t*2.3); po.cuerpo.scale.set(1/Math.sqrt(k), k, 1/Math.sqrt(k));
        let obj = Math.atan2(cam.x - po.g.position.x, cam.z - po.g.position.z) - po.yaw0;
        obj = Math.atan2(Math.sin(obj), Math.cos(obj)); obj = Math.max(-.7, Math.min(.7, obj));
        po.giro += (obj - po.giro)*(1 - Math.exp(-dt*3)); po.g.rotation.y = po.yaw0 + po.giro;
        po.parpa -= dt; const pp = po.parpa < 0 ? .12 : 1; po.ojos.forEach(o => o.scale.y = pp);
        if(po.parpa < -.12) po.parpa = 2.2 + Math.random()*3;
        mueve = true;
      } else if(po.estado === 'baja'){
        po.k = Math.min(1, po.k + dt/1.9*(w.fl > .45 ? 1 : 0));
        const k = po.k, vel = 2 + 16*k*k;
        po.orb += dt*vel*.8; po.giro += dt*vel;
        const r = 2.6*Math.sin(Math.PI*Math.min(1, k*1.1)), hund = k < .35 ? k*2 : .7 + Math.pow((k - .35)/.65, 1.6)*13;
        po.g.position.set(w.c.x + Math.cos(po.orb)*r, po.y0 - hund, w.c.z + Math.sin(po.orb)*r);
        po.g.rotation.set(Math.sin(po.orb*1.3)*.25*k, po.yaw0 + po.giro, Math.cos(po.orb)*.2*k);
        po.g.scale.setScalar(1 - .6*k*k); po.ojos.forEach(o => o.scale.y = k > .2 ? .5 : 1);          // pone cara de «¿qué pasa?»
        if(k >= 1){ po.estado = 'fuera'; po.g.visible = false; glup(0, 220, 90, .18, .09);
          api.encontrado('retrete', { emoji:'🚽', x:'Momento inolvidable n.º ' + miles(4381 + tiradas) }); }
        mueve = true;
      }
      /* las moscas */
      let alguna = false;
      po.moscas.forEach(m => {
        if(m.huye >= 0){
          m.huye += dt; m.vel.multiplyScalar(Math.pow(1.7, dt)); m.vel.y += 25*dt; m.f.position.addScaledVector(m.vel, dt);
          _v.copy(m.f.position).add(m.vel); m.f.lookAt(_v);
          if(m.huye > 1.6){ m.huye = -1; m.f.visible = false; }
        } else if(po.estado === 'ahi' && abierta && cerca){
          const tt = t*1.15 + m.fase, r = 7.5 + 3*Math.sin(tt*1.3) + 1.2*Math.sin(tt*4.1);
          const ang = tt*m.w + .6*Math.sin(tt*.9);
          m.prev.copy(m.f.position);
          m.f.position.set(po.g.position.x + Math.cos(ang)*r, w.suelo + 55 + 8*Math.sin(tt*.95 + m.i*2) + 3*Math.sin(tt*2.9), po.g.position.z + Math.sin(ang)*r);
          if(!m.f.visible){ m.f.visible = true; m.prev.copy(m.f.position); }
          m.vel.subVectors(m.f.position, m.prev).divideScalar(Math.max(dt, .001));
          _v.copy(m.f.position).addScaledVector(m.vel, .1); if(m.vel.lengthSq() > 1e-4) m.f.lookAt(_v);
        } else { m.f.visible = false; return; }
        m.al.scale.x = .35 + .65*Math.abs(Math.sin(t*95 + m.i));
        alguna = true;
      });
      /* el tufillo */
      const huele = po.estado === 'ahi' && abierta && cerca;
      po.peste.forEach((s, i) => { if(!huele){ s.visible = false; return; }
        const k = ((t*.42 + i/3) % 1); s.visible = true; s.material.opacity = Math.sin(k*Math.PI)*.55*Math.min(1, w.a*2);
        s.position.set(po.g.position.x + (i - 1)*3.2 + Math.sin(t*1.7 + i)*1.2, w.suelo + 42 + k*22, po.g.position.z + (i - 1)*.8); });
      if(alguna || huele) mueve = true;

      /* el zumbido, más alto cuanto más cerca y siguiendo a cada mosca de oreja a oreja */
      const suena = alguna && cerca;
      if(suena){ const z = zumbido();
        if(z && (z.cada -= dt) <= 0){ z.cada = .06; const T = z.a.currentTime;
          _r.set(1, 0, 0).applyQuaternion(camera.quaternion);
          po.moscas.forEach(m => { if(!m.gan) return;
            const d = cam.distanceTo(m.f.position), cerc = Math.max(0, 1 - d/330);
            const fuga = m.huye >= 0 ? Math.max(0, 1 - m.huye/1.4) : Math.min(1, w.a*1.5);
            m.gan.gain.setTargetAtTime(.05*Math.pow(cerc, 1.4)*fuga*(m.f.visible ? 1 : 0), T, .07);
            if(m.pan){ _v.subVectors(m.f.position, cam).normalize(); m.pan.pan.setTargetAtTime(Math.max(-.85, Math.min(.85, _v.dot(_r))), T, .07); }
            m.osc.frequency.setTargetAtTime((m.i ? 236 : 198) + Math.max(-30, Math.min(30, m.vel.y*.5)), T, .1); }); }
      } else if(zum && (po.estado !== 'ahi' || !cerca)) callaZumbido();
      else if(zum && !alguna){ const T = zum.a.currentTime; po.moscas.forEach(m => m.gan && m.gan.gain.setTargetAtTime(0, T, .08)); }
    }
    if(mueve) api.pinta();
  });

  /* ── 8. volver a empezar ── */
  api.reinicia(() => {
    V.forEach(w => { w.a = w.v = w.meta = 0; w.quieto = true; w.fl = -1; w.remo.visible = false; w.remo.material.opacity = 0; ponTapa(w); });
    if(po){ callaZumbido(); po.estado = 'ahi'; po.k = po.giro = po.orb = 0; po.g.visible = true; po.g.scale.setScalar(1);
      po.g.position.set(po.w.c.x, po.y0, po.w.c.z); po.g.rotation.set(0, po.yaw0, 0); po.ojos.forEach(o => o.scale.y = 1);
      po.moscas.forEach(m => { m.huye = -1; m.f.visible = false; }); po.peste.forEach(s => s.visible = false); }
    api.pinta();
  });
}
