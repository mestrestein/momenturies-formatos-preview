/* CASA 2 (10-nov): dos plantas con escalera. Copia de casa.js; la casa en línea sigue siendo casa.js.
   La casa para caminar. La geometría y la luz salen de Blender (blender/momenturies-rooms/casa.py); aquí solo se pinta:
   color = textura × luz horneada + reflejo, igual que las habitaciones del editor. Unidades: cm. */
(async function(){
const VER = window.CASA_V || '11';
let HV = null;                       // 12-nov: los easter eggs (más abajo)
const ZONAS = ['recibidor', 'pasillo', 'salon', 'cocina', 'dormitorio', 'despacho', 'terraza', 'bano', 'distribuidor', 'dormitorio2', 'bano2', 'biblioteca', 'vestidor', 'suite', 'bano_suite'];
const NOMBRES = { recibidor:'Recibidor', pasillo:'Pasillo', salon:'Salón', cocina:'Cocina', dormitorio:'Dormitorio', despacho:'Despacho', terraza:'Terraza', bano:'Baño', distribuidor:'Planta alta', dormitorio2:'Dormitorio de invitados', bano2:'Baño de arriba', biblioteca:'Biblioteca', vestidor:'Vestidor', suite:'Dormitorio principal', bano_suite:'Baño principal' };
const DIR = 'casa2';
const OJO = 158, RADIO = 24, VEL = 190;
const $ = s => document.querySelector(s);
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, matchMedia('(pointer:coarse)').matches ? 1.5 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const MAXANI = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const scene = new THREE.Scene(); scene.background = new THREE.Color('#548cce');
const camera = new THREE.PerspectiveCamera(66, 1, 4, 9000);

const texLoader = new THREE.TextureLoader(), texCache = {};
const MOVIL = matchMedia('(pointer:coarse)').matches;
function bakedTexture(url, srgb = true){
  if(texCache[url]) return texCache[url];
  const t = texLoader.load(url, tx => {
    if(MOVIL && /\/lm_/.test(url) && tx.image && tx.image.width > 1024){
      const c = document.createElement('canvas'); c.width = tx.image.width >> 1; c.height = tx.image.height >> 1;
      c.getContext('2d').drawImage(tx.image, 0, 0, c.width, c.height); tx.image = c; tx.needsUpdate = true; }
    pinta = true; });
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = MAXANI; t.flipY = false;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return texCache[url] = t;
}
/* lo que refleja lo brillante: el mismo cuarto claro pintado a mano del editor */
function bakedEnv(){
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, '#fbfaf6'); g.addColorStop(.48, '#d9d6cf'); g.addColorStop(.52, '#8f8a80'); g.addColorStop(1, '#6e675c');
  x.fillStyle = g; x.fillRect(0, 0, 256, 128);
  x.fillStyle = '#ffffff'; [[10, 26, 38, 44], [60, 26, 38, 44], [176, 22, 56, 50]].forEach(r => x.fillRect(r[0], r[1], r[2], r[3]));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; return t;
}
const ENV = bakedEnv();
const VERT = `
  varying vec2 vU0, vU1; varying vec3 vN, vP;
  void main(){ vU0 = uv; vU1 = uv1; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz;
    vN = mat3(modelMatrix) * normal; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FRAG = `
  uniform sampler2D map, lm, env; uniform vec3 color; uniform vec4 crop; uniform float rough, metal, spec, alpha, useMap, useLm, mapK, viva, nevLuz, frio;
  varying vec2 vU0, vU1; varying vec3 vN, vP;
  float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec3 a = color; if(useMap > .5) a *= texture2D(map, vU0 * crop.xy + crop.zw).rgb * mapK;
    vec3 L = useLm > .5 ? texture2D(lm, vU1).rgb * 4.0 : vec3(1.0);
    /* nevera abierta: la luz de dentro lo aclara todo (el horneado es con la puerta cerrada) */
    if(nevLuz > 0. && (frio > .5 || (vP.x > 366.6 && vP.x < 433.4 && vP.y > 65. && vP.y < 187. && vP.z > 636. && vP.z < 702.5)))
      L = mix(L, min(L * 1.3 + vec3(.2, .22, .25), vec3(1.05)), nevLuz);
    if(mapK < 1.5) L = max(L, vec3(.82));                /* una foto nunca se queda a oscuras */
    if(viva > .5){ float g = dot(a, vec3(.3, .59, .11)); a = clamp(mix(vec3(g), a, 1.28) * 1.12, 0., 1.); L = vec3(1.); }   /* imanes: más vivos, sin sombra */
    vec3 V = normalize(cameraPosition - vP), N = normalize(vN); if(dot(N, V) < 0.0) N = -N;
    vec3 R = reflect(-V, N);
    vec2 e = vec2(atan(R.z, R.x) / 6.28318 + .5, acos(clamp(R.y, -1., 1.)) / 3.14159);
    vec3 E = texture2D(env, vec2(e.x, 1. - e.y), rough * 7.0).rgb;
    float lum = dot(L, vec3(.33)), occ = clamp(lum * 1.3, 0., 1.);
    float nv = clamp(dot(N, V), 0., 1.), gl = (1. - rough) * (1. - rough);
    vec3 F0 = mix(vec3(.08 * spec), a, metal);
    vec3 F = F0 + (max(vec3(gl), F0) - F0) * pow(1. - nv, 5.);
    vec3 col = a * (1. - metal) * L + E * F * occ * (metal > .5 ? max(.45, lum) : 1.);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
    gl_FragColor.rgb += (rnd(gl_FragCoord.xy) - .5) / 255.;
  }`;
const lmTex = {}, NEVLUZ = { value:0 };
function material(m, zona, g, placas){
  const u = m.userData || {}, c = u.c || [1, 1, 1], hasLm = g !== 'glass', a = u.alpha == null ? 1 : u.alpha;
  const foto = /^foto_(\d+)/.exec(m.name || ''), p = foto && placas[+foto[1]];
  let map = u.map ? bakedTexture('rooms/tex/' + u.map + '.webp?v=' + VER) : null, crop = new THREE.Vector4(1, 1, 0, 0);
  if(p){ map = bakedTexture(p.foto + '?v=' + VER); map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; }
  const un = {
    map:{ value:map }, useMap:{ value:map ? 1 : 0 }, mapK:{ value:p ? 1 : 2 }, viva:{ value:p && p.set === 'iman' ? 1 : 0 }, crop:{ value:crop },
    lm:{ value:hasLm ? bakedTexture(`${DIR}/${zona}/lm_${g}.webp?v=${VER}`) : null }, useLm:{ value:hasLm ? 1 : 0 },
    env:{ value:ENV }, color:{ value:new THREE.Color(c[0], c[1], c[2]) },
    rough:{ value:u.rough == null ? .6 : u.rough }, metal:{ value:u.metal || 0 }, spec:{ value:u.spec == null ? .5 : u.spec }, alpha:{ value:a },
    nevLuz:NEVLUZ, frio:{ value:0 }
  };
  if(p) p.un = un;
  return new THREE.ShaderMaterial({ vertexShader:VERT, fragmentShader:FRAG, uniforms:un, side:(u.ds || !hasLm || /^inox_seno/.test(m.name || '')) ? THREE.DoubleSide : THREE.FrontSide, transparent:a < 1, depthWrite:!(a < 1) });
}
/* encuadre "cover" de cada foto en su placa, cuando ya se sabe el tamaño de la imagen */
function encuadra(p){
  const t = p.un && p.un.map.value; if(!t || !t.image) return false;
  const ra = t.image.width/t.image.height, rp = p.w/p.h;
  const sx = ra > rp ? rp/ra : 1, sy = ra > rp ? 1 : ra/rp;
  p.un.crop.value.set(sx, sy, (1-sx)/2, (1-sy)/2); return true;
}

const datos = await (await fetch(DIR + '/casa.json?v=' + VER)).json();
const CAJAS = [datos.solidos, datos.solidos1 || []], salas = datos.salas, ESC = datos.escalera;
let PISO = 0, caja = CAJAS[0];
/* altura del suelo donde se está: en la escalera, una rampa; fuera, la de la planta. Al pasar la mitad de la
   escalera se cambia de planta (y de paredes con las que chocar). */
function enEscalera(x, z){ return ESC && x > ESC.x0 && x < ESC.x1 && z > ESC.z0-30 && z < ESC.z1; }
function sueloEn(x, z){ if(enEscalera(x, z)) return Math.max(0, Math.min(1, (z-ESC.z0)/(ESC.z1-ESC.z0)))*ESC.y1; return PISO*(ESC ? ESC.y1 : 0); }
function ponPiso(p){ if(p === PISO) return; PISO = p; caja = CAJAS[p]; document.querySelectorAll('#plano g.pl').forEach(g => g.style.display = +g.dataset.p === p ? '' : 'none'); HV && HV.piso(); }
function revisaPiso(){ if(enEscalera(pos.x, pos.z)) ponPiso(sueloEn(pos.x, pos.z) > ESC.y1/2 ? 1 : 0); }

/* el cielo de las ventanas */
{ const t = texLoader.load('rooms/tex/sky_med.webp?v=' + VER, () => { pinta = true; }); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.MirroredRepeatWrapping; t.repeat.set(3, 1);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(5200, 5200, 4600, 48, 1, true), new THREE.MeshBasicMaterial({ map:t, side:THREE.BackSide, toneMapped:false, fog:false }));
  m.position.set(530, 900, 650); scene.add(m);
  /* encima y debajo del cilindro: el mismo azul del borde de la foto, para que no se vea dónde acaba */
  const capa = (y0, y1, c0, c1) => { const g = new THREE.CylinderGeometry(5200, 5200, y1-y0, 48, 1, true), P = g.attributes.position, col = [];
    const A = new THREE.Color(c0), B = new THREE.Color(c1);
    for(let i = 0; i < P.count; i++){ const k = P.getY(i) > 0 ? 1 : 0, c = k ? B : A; col.push(c.r, c.g, c.b); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const q = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors:true, side:THREE.BackSide, toneMapped:false, fog:false })); q.position.set(530, (y0+y1)/2, 650); scene.add(q); };
  capa(3195, 9000, '#548cce', '#3c74bd'); capa(-6000, -1395, '#0f466e', '#124d77');
  const tapa = (y, c) => { const q = new THREE.Mesh(new THREE.CircleGeometry(5200, 48), new THREE.MeshBasicMaterial({ color:c, side:THREE.DoubleSide, toneMapped:false, fog:false })); q.rotation.x = Math.PI/2; q.position.set(530, y, 650); scene.add(q); };
  tapa(9000, '#3c74bd'); tapa(-6000, '#0f466e'); }

const loader = new window.GLTFLoader(), fotos = [], espejos = [], RAICES = {};
/* 12-nov: para que vaya fluido no se dibuja la otra planta. Desde abajo se ve el distribuidor por el hueco de la escalera
   y, desde el salón, la cocina y la terraza, la fachada de arriba; desde arriba, el recibidor, el pasillo y la terraza (balcón). */
const ARRIBA = ['distribuidor', 'dormitorio2', 'bano2', 'biblioteca', 'vestidor', 'suite', 'bano_suite'];
const ABAJO = ['pasillo', 'salon', 'cocina', 'dormitorio', 'despacho', 'terraza', 'bano'];
const FACHADA = ['terraza', 'salon', 'cocina'];
let zonasClave = '';
function ponZonas(sala){
  const ve = new Set(['recibidor']);
  if(PISO === 0){ ABAJO.forEach(z => ve.add(z)); ve.add('distribuidor'); if(FACHADA.includes(sala)) ['suite', 'bano_suite', 'vestidor'].forEach(z => ve.add(z)); }
  else { ARRIBA.forEach(z => ve.add(z)); ['pasillo', 'terraza'].forEach(z => ve.add(z)); }
  const k = [...ve].sort().join() + Object.keys(RAICES).length; if(k === zonasClave) return; zonasClave = k;
  Object.entries(RAICES).forEach(([z, r]) => r.visible = ve.has(z));
}
let hechos = 0;
function carga(z){
  return new Promise((ok, mal) => loader.load(`${DIR}/${z}/room.glb?v=${VER}`, g => {
    const root = g.scene; root.scale.setScalar(100);
    root.traverse(o => { if(!o.isMesh) return;
      const u = o.material.userData || {}, nm = o.material.name;
      o.material = material(o.material, z, u.lmg, datos.placas); o.userData.mat = nm || '';
      const f = /^foto_(\d+)/.exec(nm || ''); if(f){ o.userData.placa = datos.placas[+f[1]]; fotos.push(o); }
      if(nm === 'espejo') espejos.push({ o, z });
    });
    root.userData.zona = z; RAICES[z] = root; scene.add(root); hechos++; $('#barra i').style.width = (hechos/ZONAS.length*100) + '%'; pinta = true; ok();
  }, undefined, mal));
}

/* ── andar ── */
const pos = { x:1235, z:120 }; let yaw = 2.84, pitch = -.06;
const tecla = {}; let joy = { x:0, y:0 }, pinta = true, mover = null;
/* agacharse (12-nov, Marc: N o el botón lo ponen y lo quitan, no hay que mantener) y saltar (espacio / botón) */
/* doble salto: un segundo impulso en el aire. TECHO = altura máxima de los ojos sobre el suelo (las plantas
   miden 300; así la cabeza no atraviesa el techo hacia la planta de arriba) */
const AGACHA = 72, G = 980, VSALTO = 300, TECHO = 262; let agache = 0, agachaOn = false, saltoY = 0, saltoV = 0, saltos = 0;
function salta(){ if(saltos >= 2) return; saltoV = VSALTO * (agachado() ? .8 : 1) * (saltos ? .9 : 1); saltos++; pinta = true; HV && HV.salto(); }
function agachado(){ return agachaOn; }
function agacha(v = !agachaOn){ agachaOn = v; $('#bagacha').classList.toggle('on', v); $('#agachado').classList.toggle('ver', v && !MOVIL); pinta = true; }
addEventListener('keydown', e => { if(e.code === 'Space' && !e.repeat) salta(); tecla[e.code] = true; if(e.code === 'KeyN' && !e.repeat) agacha(); if(/^(Key[WASD]|Arrow)/.test(e.code)){ vuelo = null; if(enFoco) ficha(null); } if(/Arrow|Space/.test(e.code)) e.preventDefault(); fueraAyuda(); });
{ const bS = $('#bsalta'), bA = $('#bagacha');
  bS.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); salta(); fueraAyuda(); });
  bA.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); agacha(); fueraAyuda(); }); }
addEventListener('keyup', e => { tecla[e.code] = false; });
addEventListener('blur', () => { for(const k in tecla) tecla[k] = false; });
function fueraAyuda(){ $('#ayuda').classList.add('fuera'); }
/* empuja fuera de cada caja; al chocar en esquina se desliza por la pared */
function resuelve(p){
  for(let n = 0; n < 3; n++) for(const b of caja){
    const cx = Math.max(b[0], Math.min(p.x, b[2])), cz = Math.max(b[1], Math.min(p.z, b[3]));
    const dx = p.x-cx, dz = p.z-cz, d2 = dx*dx+dz*dz;
    if(d2 >= RADIO*RADIO) continue;
    if(d2 > 1e-6){ const d = Math.sqrt(d2), k = (RADIO-d)/d; p.x += dx*k; p.z += dz*k; }
    else { const izq = p.x-b[0], der = b[2]-p.x, arr = p.z-b[1], aba = b[3]-p.z, m = Math.min(izq, der, arr, aba);
      if(m === izq) p.x = b[0]-RADIO; else if(m === der) p.x = b[2]+RADIO; else if(m === arr) p.z = b[1]-RADIO; else p.z = b[3]+RADIO; }
  }
}
function salaEn(x, z, p = PISO){ return salas.find(s => (s.p === p || s.id === 'recibidor') && x >= s.x0-6 && x <= s.x1+6 && z >= s.z0-6 && z <= s.z1+6); }

/* Controles tipo videojuego. En el móvil: el dedo de la mitad izquierda saca un joystick donde toca y anda;
   el de la derecha mira arrastrando. Con ratón, arrastrar mira. Un toque corto = ver el cuadro o andar hasta ahí. */
const dedos = new Map(), stk = $('#stick'), pomo = stk.firstElementChild, RJ = 52;
function stickEn(x, y){ stk.style.left = (x-65) + 'px'; stk.style.top = (y-65) + 'px'; stk.style.bottom = 'auto'; stk.classList.add('activo'); }
function stickFuera(){ stk.style.left = stk.style.top = stk.style.bottom = ''; stk.classList.remove('activo'); pomo.style.transform = ''; joy = { x:0, y:0 }; }
canvas.addEventListener('pointerdown', e => {
  let modo = e.pointerType === 'touch' && e.clientX < innerWidth*.45 ? 'stick' : 'mira';
  if(modo === 'stick' && [...dedos.values()].some(d => d.modo === 'stick')) modo = 'mira';
  dedos.set(e.pointerId, { modo, x:e.clientX, y:e.clientY, x0:e.clientX, y0:e.clientY, t:performance.now() });
  try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
  if(modo === 'stick') stickEn(e.clientX, e.clientY); else canvas.classList.add('drag');
  mover = null; vuelo = null; fueraAyuda();
});
canvas.addEventListener('pointermove', e => {
  const d = dedos.get(e.pointerId); if(!d) return;
  if(d.modo === 'stick'){
    let x = e.clientX-d.x0, y = e.clientY-d.y0; const r = Math.hypot(x, y);
    if(r > RJ){ x *= RJ/r; y *= RJ/r; }
    joy = { x:x/RJ, y:y/RJ }; pomo.style.transform = `translate(${x}px,${y}px)`;
  } else {
    const k = e.pointerType === 'touch' ? .0068 : .0042;
    yaw -= (e.clientX-d.x)*k; pitch -= (e.clientY-d.y)*k*.85; pitch = Math.max(-1.05, Math.min(.85, pitch));
  }
  d.x = e.clientX; d.y = e.clientY; pinta = true;
});
function suelta(e, vale){
  const d = dedos.get(e.pointerId); if(!d) return; dedos.delete(e.pointerId);
  if(d.modo === 'stick'){ stickFuera(); if(!vale) return; }
  if(![...dedos.values()].some(q => q.modo === 'mira')) canvas.classList.remove('drag');
  const corto = Math.hypot(e.clientX-d.x0, e.clientY-d.y0) < 9 && performance.now()-d.t < 650;
  if(vale && corto) toque(e);
}
canvas.addEventListener('pointerup', e => suelta(e, true));
canvas.addEventListener('pointercancel', e => suelta(e, false));
canvas.addEventListener('contextmenu', e => e.preventDefault());

/* giroscopio: girar el móvil también mira (se suma a lo que mueva el dedo) */
const giro = { on:false, prev:null };
{ const zee = new THREE.Vector3(0, 0, 1), eu = new THREE.Euler(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion(-Math.sqrt(.5), 0, 0, Math.sqrt(.5)), q = new THREE.Quaternion(), v = new THREE.Vector3();
  const D = THREE.MathUtils.degToRad;
  addEventListener('deviceorientation', e => {
    if(!giro.on || e.alpha == null) return;
    const o = D((screen.orientation && screen.orientation.angle) || window.orientation || 0);
    eu.set(D(e.beta), D(e.alpha), -D(e.gamma), 'YXZ'); q.setFromEuler(eu); q.multiply(q1); q.multiply(q0.setFromAxisAngle(zee, -o));
    v.set(0, 0, -1).applyQuaternion(q);
    const y = Math.atan2(-v.x, -v.z), pt = Math.asin(Math.max(-1, Math.min(1, v.y)));
    if(giro.prev){
      let dy = y-giro.prev.y; if(dy > Math.PI) dy -= 2*Math.PI; if(dy < -Math.PI) dy += 2*Math.PI;
      if(Math.abs(dy) < .5){ yaw += dy; pitch = Math.max(-1.05, Math.min(.85, pitch + (pt-giro.prev.p))); pinta = true; }
    }
    giro.prev = { y, p:pt };
  });
  const b = $('#giro');
  b.addEventListener('click', async () => {
    if(!giro.on && window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function'){
      try{ if(await DeviceOrientationEvent.requestPermission() !== 'granted') return; }catch(_){ return; }
    }
    giro.on = !giro.on; giro.prev = null; b.classList.toggle('on', giro.on);
    b.querySelector('span').textContent = giro.on ? 'Giroscopio activado' : 'Activar giroscopio';
  });
}
const ray = new THREE.Raycaster();
function toque(e){
  const r = canvas.getBoundingClientRect(), v = new THREE.Vector2((e.clientX-r.left)/r.width*2-1, -(e.clientY-r.top)/r.height*2+1);
  ray.setFromCamera(v, camera);
  if(HV && HV.toque(ray)) return;
  const h = ray.intersectObjects(fotos, false)[0];
  /* el cuadro tiene que ser lo primero que se ve: si hay una pared antes, no cuenta */
  if(h && h.distance < 720 && visible(h.point)){ const g = grupos.find(q => q.mallas.includes(h.object)); if(g) return enfoca(g); }
  ficha(null);
  const d = ray.ray.direction;
  if(d.y < -.05){ const t = -(camera.position.y - sueloEn(pos.x, pos.z))/d.y; mover = { x:camera.position.x+d.x*t, z:camera.position.z+d.z*t, n:0 }; }
}
function visible(p){
  const a = camera.position, N = 24;
  for(let i = 1; i < N; i++){ const t = i/N, x = a.x+(p.x-a.x)*t, z = a.z+(p.z-a.z)*t;
    if(caja.some(b => b[3]-b[1] <= 14 || b[2]-b[0] <= 14 ? (x > b[0] && x < b[2] && z > b[1] && z < b[3]) : false)) return false; }
  return true;
}
/* ── 10-nov (Marc): un botón al lado de cada pieza (conjunto, imanes, sobremesa). Al tocarlo la cámara se acerca
   hasta tenerla de frente y sale la ficha con el botón que lleva al personalizador con eso ya puesto. ── */
const QUE = {
  iman:      g => ({ tag:'Imanes', tit:'Imanes para la nevera', txt:`${g.n} imanes de aluminio HD con tus fotos. Se pegan a la nevera y se cambian cuando quieras.`, url:'iman.html?conjunto=N09' }),
  escalera:  g => ({ tag:'Nueve en subida', tit:'Conjunto «Nueve en subida»', txt:`${g.n} cuadros de 30 × 40 de aluminio HD que suben con la escalera. Se cuelgan con imán, sin agujeros.`, url:'cuadro.html' }),
  sobremesa: g => ({ tag:'Sobremesa', tit:'Foto de sobremesa', txt:'Aluminio HD con peana de bambú, para la mesita, la estantería o el escritorio.', url:'sobremesa.html' }),
};
const queEs = g => (QUE[g.set] || (g => ({ tag:g.nombre, tit:`Conjunto «${g.nombre}»`, txt:`${g.n} ${g.n === 1 ? 'cuadro' : 'cuadros'} de aluminio HD. Se cuelgan con imán, sin agujeros, y ya llevan los tamaños y la separación resueltos.`, url:`cuadro.html?pared=${g.set}` })))(g);
let grupos = [], enFoco = null, vuelo = null;
/* junta las placas en piezas: mismo conjunto y a menos de 70 cm entre bordes (un mismo conjunto puede salir en dos sitios) */
function hazGrupos(){
  scene.updateMatrixWorld(true);
  const gs = [], b = new THREE.Box3(), nm = new THREE.Matrix3(), v = new THREE.Vector3();
  fotos.forEach(o => {
    const p = o.userData.placa; b.setFromObject(o); const c = b.getCenter(new THREE.Vector3());
    let g = gs.find(q => q.set === p.set && q.caja.distanceToPoint(c) < 70);
    if(!g){ g = { set:p.set, nombre:p.nombre, mallas:[], caja:new THREE.Box3(), c, n:0 }; gs.push(g); }
    g.mallas.push(o); g.caja.union(b); g.n++;
    if(!g.normal){ const a = o.geometry.attributes.normal; if(a){ nm.getNormalMatrix(o.matrixWorld); v.fromBufferAttribute(a, 0).applyMatrix3(nm); v.y = 0; if(v.lengthSq() > 1e-6) g.normal = v.clone().normalize(); } }
  });
  /* une los trozos del mismo conjunto que han quedado separados (bordes a menos de 70 cm) */
  for(let i = 0; i < gs.length; i++) for(let j = gs.length - 1; j > i; j--){ const A = gs[i], B = gs[j];
    if(A.set !== B.set) continue; const e = A.caja.clone().expandByScalar(70);
    if(!e.intersectsBox(B.caja)) continue;
    A.mallas.push(...B.mallas); A.caja.union(B.caja); A.n += B.n; A.normal = A.normal || B.normal; gs.splice(j, 1); j = gs.length; }
  gs.forEach(g => {
    g.c = g.caja.getCenter(new THREE.Vector3());
    const r0 = salaEn(g.c.x, g.c.z, 0); g.piso = r0 && r0.id === 'recibidor' ? -1 : (g.c.y > 290 ? 1 : 0);
    const s = salaEn(g.c.x, g.c.z, Math.max(0, g.piso)) || salas[0]; g.sala = s.id; const hacia = new THREE.Vector3((s.x0+s.x1)/2 - g.c.x, 0, (s.z0+s.z1)/2 - g.c.z);
    if(!g.normal) g.normal = Math.abs(hacia.x) > Math.abs(hacia.z) ? new THREE.Vector3(Math.sign(hacia.x), 0, 0) : new THREE.Vector3(0, 0, Math.sign(hacia.z));
    if(g.normal.dot(hacia) < 0) g.normal.negate();   // hacia dentro de la habitación
    g.t = new THREE.Vector3(-g.normal.z, 0, g.normal.x);   // a lo largo de la pared
    const sz = g.caja.getSize(new THREE.Vector3());
    g.ancho = Math.abs(sz.x*g.t.x) + Math.abs(sz.z*g.t.z); g.alto = sz.y;
    /* el botón va al lado, a la derecha de la pieza (mirándola), a media altura de su parte de arriba */
    g.ancla = g.c.clone().addScaledVector(g.t, -(g.ancho/2 + 14)); g.ancla.y = g.c.y + g.alto*.25;
    const q = queEs(g), el = document.createElement('button');
    el.type = 'button'; el.className = 'pto'; el.innerHTML = `<i></i><span></span>`; el.querySelector('span').textContent = q.tag;
    el.setAttribute('aria-label', 'Ver ' + q.tit);
    el.addEventListener('click', e => { e.stopPropagation(); enfoca(g); });
    $('#puntos').append(el); g.el = el;
  });
  grupos = gs; pinta = true;
}
/* vuela hasta tener la pieza de frente, que ocupe ~60 % de la pantalla */
function enfoca(g){
  ficha(null); fueraAyuda(); mover = null; enFoco = g;
  const vf = THREE.MathUtils.degToRad(camera.fov), hf = 2*Math.atan(Math.tan(vf/2)*camera.aspect);
  /* la ficha tapa la parte de abajo: la pieza va en el hueco de encima (avail = parte de la altura libre) */
  const avail = Math.max(.42, 1 - 310/innerHeight), tv = Math.tan(vf/2), th = Math.tan(hf/2);
  const d = Math.max(95, Math.min(380, Math.max(g.alto/(2*tv*avail*.7), g.ancho/(2*th*.78))));
  const fin = { x:g.c.x + g.normal.x*d, z:g.c.z + g.normal.z*d }; resuelve(fin);
  const dx = g.c.x - fin.x, dz = g.c.z - fin.z;
  let y1 = Math.atan2(-dx, -dz); while(y1 - yaw > Math.PI) y1 -= 2*Math.PI; while(y1 - yaw < -Math.PI) y1 += 2*Math.PI;
  const p1 = Math.max(-.9, Math.min(.6, Math.atan2(g.c.y - OJO - sueloEn(pos.x, pos.z), Math.hypot(dx, dz)) - Math.atan((1 - avail)*.85*tv)));
  vuelo = { t0:performance.now(), dur:1150, a:{ x:pos.x, z:pos.z, yaw, pitch }, b:{ x:fin.x, z:fin.z, yaw:y1, pitch:p1 }, g };
  document.body.classList.add('enfoque'); pinta = true;
}
function ficha(g){
  const f = $('#ficha');
  if(!g){ f.classList.remove('ver'); document.body.classList.remove('enfoque'); enFoco = null; pinta = true; return; }
  const q = queEs(g);
  f.querySelector('em').textContent = NOMBRES[(salaEn(g.c.x, g.c.z, Math.max(0, g.piso)) || {}).id] || '';
  f.querySelector('b').textContent = q.tit; f.querySelector('span').textContent = q.txt; f.querySelector('a').href = q.url;
  f.classList.add('ver');
}
$('#ficha button').onclick = () => ficha(null);
$('#ficha .seguir').onclick = () => ficha(null);
/* coloca los botones encima de la imagen 3D: solo los de piezas que se ven (de frente, cerca y sin pared delante) */
const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function ponPuntos(){
  if(!grupos.length) return;
  const W = innerWidth, H = innerHeight, cam = camera.position;
  grupos.forEach(g => {
    _v.copy(g.ancla).project(camera);
    const dist = Math.hypot(g.c.x - cam.x, g.c.z - cam.z);
    const deFrente = (cam.x - g.c.x)*g.normal.x + (cam.z - g.c.z)*g.normal.z > 20;
    /* 12-nov (Marc): solo cuando lo estás mirando, de cerca y desde su misma habitación (nada de botones a través de las paredes) */
    _w.copy(g.c).project(camera);
    const mirando = _w.z < 1 && Math.abs(_w.x) < .7 && Math.abs(_w.y) < .8;
    const misma = g.sala === (salaEn(cam.x, cam.z, PISO) || {}).id;
    const ve = !vuelo && g !== enFoco && (g.piso < 0 || g.piso === PISO) && misma && _v.z < 1 && Math.abs(_v.x) < 1 && Math.abs(_v.y) < 1 && mirando && dist < 430 && deFrente && !(g.set === 'iman' && HV && HV.nevAbierta) && visible(g.c.clone().addScaledVector(g.normal, 4));
    g.el.classList.toggle('ver', ve);
    if(ve){ g.el.style.transform = `translate(${(_v.x+1)/2*W}px,${(1-_v.y)/2*H}px)`; g.el.classList.remove('lejos'); }
  });
}

/* plano pequeño: toca una habitación para ir */
const CENTRO = { recibidor:[1235, 120, 2.84], pasillo:[120, 537, -Math.PI/2], salon:[640, 760, -2.1], cocina:[300, 1000, -.3], dormitorio:[300, 340, 1.4], despacho:[640, 360, -1.4], terraza:[800, 1120, 2.4], bano:[1180, 700, 3.0],
  distribuidor:[150, 537, -Math.PI/2], dormitorio2:[380, 380, .9], bano2:[560, 400, 0], biblioteca:[930, 400, .8], vestidor:[250, 1000, .6], suite:[820, 780, Math.PI/2], bano_suite:[960, 720, -2.3] };
{ const W = 1320, Hh = 1320, NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'), capas = [0, 1].map(p => { const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pl'); g.dataset.p = p; if(p) g.style.display = 'none'; svg.append(g); return g; });
  svg.setAttribute('viewBox', `-20 -20 ${W+20} ${Hh+20}`);
  salas.forEach(s => { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', s.x0); r.setAttribute('y', s.z0); r.setAttribute('width', s.x1-s.x0); r.setAttribute('height', s.z1-s.z0);
    r.setAttribute('class', 'sala'); r.dataset.id = s.id; r.addEventListener('click', () => { const c = CENTRO[s.id]; ponPiso(s.p); pos.x = c[0]; pos.z = c[1]; yaw = c[2]; pitch = -.04; mover = null; pinta = true; });
    capas[s.p].append(r); if(s.id === 'recibidor'){ const r2 = r.cloneNode(); r2.dataset.id = s.id; r2.addEventListener('click', () => r.dispatchEvent(new Event('click'))); capas[1].append(r2); } });
  const et = document.createElementNS(NS, 'text'); et.setAttribute('x', W/2-10); et.setAttribute('y', Hh-6); svg.append(et); window._et = et;
  const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', 34); dot.setAttribute('fill', '#b2613f'); dot.style.pointerEvents = 'none'; svg.append(dot);
  $('#plano').append(svg); window._dot = dot; }

/* 10-nov: casa.html#salon (o #cocina, #dormitorio, #despacho, #recibidor, #terraza) entra directamente en esa habitación,
   con la vista de las fotos de la portada */
{ const ENTRA = Object.assign({}, CENTRO, { salon:[700, 900, -1.9], cocina:[330, 1000, -.25], arriba:CENTRO.distribuidor }), k = decodeURIComponent(location.hash.slice(1)).toLowerCase();
  const c = ENTRA[k], s = salas.find(q => q.id === (k === 'arriba' ? 'distribuidor' : k));
  if(c){ if(s) ponPiso(s.p); pos.x = c[0]; pos.z = c[1]; yaw = c[2]; pitch = -.03; } }

function tam(){ const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w/h; camera.fov = w < h ? 76 : 66; camera.updateProjectionMatrix(); pinta = true; }
addEventListener('resize', tam); tam();

let actual = '', ult = performance.now(), balanceo = 0;
function bucle(t){
  requestAnimationFrame(bucle);
  const dt = Math.min(.05, (t-ult)/1000); ult = t;
  let f = (tecla.KeyW || tecla.ArrowUp ? 1 : 0) - (tecla.KeyS || tecla.ArrowDown ? 1 : 0) - joy.y;
  let l = (tecla.KeyD ? 1 : 0) - (tecla.KeyA ? 1 : 0) + joy.x;
  if(tecla.ArrowLeft) { yaw += 1.8*dt; pinta = true; }
  if(tecla.ArrowRight){ yaw -= 1.8*dt; pinta = true; }
  if(mover){ const dx = mover.x-pos.x, dz = mover.z-pos.z, d = Math.hypot(dx, dz);
    if(d < 12 || ++mover.n > 400 || f || l) mover = null;
    else { pos.x += dx/d*VEL*dt; pos.z += dz/d*VEL*dt; resuelve(pos); balanceo += dt*9; pinta = true; } }
  const m = Math.hypot(f, l);
  /* la altura de los ojos va hacia la de agachado poco a poco; el salto es una parábola con gravedad */
  const meta = agachado() ? 1 : 0;
  if(agache !== meta){ agache += Math.sign(meta-agache)*Math.min(Math.abs(meta-agache), dt*6); pinta = true; }
  if(saltoV || saltoY > 0){ saltoV -= G*dt; saltoY += saltoV*dt;
    const tope = TECHO - OJO + agache*AGACHA; if(saltoY > tope){ saltoY = tope; saltoV = Math.min(0, saltoV); }
    if(saltoY <= 0){ saltoY = 0; saltoV = 0; saltos = 0; } pinta = true; }
  if(m > .02){ const k = Math.min(1, m)/m*VEL*dt*(1 - agache*.5), s = Math.sin(yaw), c = Math.cos(yaw);
    pos.x += (-s*f + c*l)*k; pos.z += (-c*f - s*l)*k; resuelve(pos); balanceo += dt*9; pinta = true; }
  fuera(t/1000);
  if(vuelo){ const k = Math.min(1, (performance.now() - vuelo.t0)/vuelo.dur), e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2, A = vuelo.a, B = vuelo.b;
    pos.x = A.x + (B.x-A.x)*e; pos.z = A.z + (B.z-A.z)*e; yaw = A.yaw + (B.yaw-A.yaw)*e; pitch = A.pitch + (B.pitch-A.pitch)*e; pinta = true;
    if(k >= 1){ const g = vuelo.g; vuelo = null; ficha(g); } }
  HV && HV.tick(dt, t/1000);
  if(!pinta) return; pinta = false;
  revisaPiso();
  camera.position.set(pos.x, sueloEn(pos.x, pos.z) + OJO - agache*AGACHA + saltoY + (HV ? HV.dy : 0) + (saltoY ? 0 : Math.sin(balanceo)*.9), pos.z);
  window._et.textContent = PISO ? 'Planta alta' : 'Planta baja';
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  window._dot.setAttribute('cx', pos.x); window._dot.setAttribute('cy', pos.z);
  const s = salaEn(pos.x, pos.z);
  if(s) ponZonas(s.id);
  if(s && s.id !== actual){ actual = s.id; $('#top').textContent = NOMBRES[s.id]; document.querySelectorAll('#plano rect').forEach(r => r.classList.toggle('on', r.dataset.id === s.id)); }
  renderer.render(scene, camera);
  ponPuntos();
  ajustaCalidad(dt);
}
const PR_MAX = Math.min(devicePixelRatio, MOVIL ? 1.5 : 2), PR_MIN = Math.min(1, PR_MAX);
let prAhora = PR_MAX, prSuma = 0, prN = 0;
function ajustaCalidad(dt){
  if(document.hidden || dt <= 0) return; prSuma += dt; prN++;
  if(prN < 45) return; const media = prSuma/prN; prSuma = 0; prN = 0;
  let n = prAhora;
  if(media > 1/45) n = Math.max(PR_MIN, prAhora - .25); else if(media < 1/58) n = Math.min(PR_MAX, prAhora + .25);
  if(n !== prAhora){ prAhora = n; renderer.setPixelRatio(n); renderer.setSize(innerWidth, innerHeight, false); pinta = true; }
}
/* ── Lo de fuera: flotadores con la marca en el mar, el logo hinchable, un globo y una avioneta con pancarta.
   No se hornea: luz propia (cielo + sol) y se mueve solo. Todo dentro del cilindro del cielo (r 5200 en 530,650). */
let ISLA = null;
const fuera = (() => {
  const TERRA = '#c2613a', NEGRO = '#1a1a1a', CREMA = '#f6f1e7', MAR = -300;
  scene.add(new THREE.HemisphereLight('#e4eef8', '#6f8590', 2.1));
  const sol = new THREE.DirectionalLight('#fff1dc', 2.6); sol.position.set(-2000, 3000, 2600); scene.add(sol);
  scene.fog = new THREE.Fog('#cfdde8', 2600, 9500);
  const lienzo = (w, h, f, w2, h2) => { if(w2){ w = w2; h = h2; } const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANI; return t; };
  const palabra = (x, txt, cx, cy, px, color, esp = .18) => {          /* MOMENTURIES con su letra (Georgia, negrita, espaciada) */
    x.font = `700 ${px}px Georgia, 'Times New Roman', serif`; x.fillStyle = color; x.textBaseline = 'middle';
    const L = [...txt], sp = px*esp, w = L.reduce((s, c) => s + x.measureText(c).width, 0) + sp*(L.length-1);
    let p = cx - w/2; L.forEach(c => { x.fillText(c, p, cy); p += x.measureText(c).width + sp; }); return w;
  };
  const marca = (x, X, Y, s) => {                                      /* el símbolo: cuatro placas */
    [[2.6, 3.5, 11.4, 14.9, NEGRO], [15.8, 3.5, 9.6, 7.9, TERRA], [15.8, 13.1, 9.6, 11.4, NEGRO], [2.6, 20.1, 11.4, 4.4, TERRA]]
      .forEach(([a, b, w, h, c]) => { x.fillStyle = c; x.beginPath(); x.roundRect(X + a*s, Y + b*s, w*s, h*s, 1.1*s); x.fill(); });
  };
  const anim = [];

  /* flotadores: rosco a franjas crema y terracota, con la palabra en las crema */
  const texRosco = lienzo(2048, 512, (x, w, h) => {
    for(let i = 0; i < 4; i++){ x.fillStyle = i % 2 ? TERRA : CREMA; x.fillRect(i*w/4, 0, w/4+1, h); }
    for(let i = 0; i < 4; i++) for(const v of [.13, .38, .63, .88]) palabra(x, 'MOMENTURIES', i*w/4 + w/8, h*v, 50, i % 2 ? CREMA : NEGRO, .12);
  }, 2048, 512);
  texRosco.wrapS = THREE.RepeatWrapping;
  const mRosco = new THREE.MeshStandardMaterial({ map:texRosco, roughness:.28, metalness:0 });
  const gRosco = new THREE.TorusGeometry(150, 58, 32, 80);
  [[560, 2150, 0], [1500, 2900, 1.7], [260, 3300, 3.1], [1800, 1700, 4.2], [380, -1500, .8], [880, -2100, 2.4], [2300, 420, 5.1]].forEach(([x, z, f]) => {
    const m = new THREE.Mesh(gRosco, mRosco); m.position.set(x, MAR, z); m.rotation.x = -Math.PI/2; scene.add(m);
    anim.push(t => { m.position.y = MAR + 14 + Math.sin(t*.9 + f)*9; m.rotation.x = -Math.PI/2 + Math.sin(t*.7 + f)*.07; m.rotation.y = Math.cos(t*.6 + f)*.06; m.rotation.z = t*.05 + f; });
  });

  /* el símbolo hinchable, grande, flotando de pie delante del salón */
  { const g = new THREE.Group(), s = 16;
    [[2.6, 3.5, 11.4, 14.9, NEGRO], [15.8, 3.5, 9.6, 7.9, TERRA], [15.8, 13.1, 9.6, 11.4, NEGRO], [2.6, 20.1, 11.4, 4.4, TERRA]].forEach(([a, b, w, h, c]) => {
      const sh = new THREE.Shape(), r = 1.6*s, W = w*s, H = h*s;
      sh.moveTo(r, 0); sh.lineTo(W-r, 0); sh.quadraticCurveTo(W, 0, W, r); sh.lineTo(W, H-r); sh.quadraticCurveTo(W, H, W-r, H);
      sh.lineTo(r, H); sh.quadraticCurveTo(0, H, 0, H-r); sh.lineTo(0, r); sh.quadraticCurveTo(0, 0, r, 0);
      const geo = new THREE.ExtrudeGeometry(sh, { depth:30, bevelEnabled:true, bevelThickness:26, bevelSize:24, bevelSegments:6, curveSegments:10 });
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color:c, roughness:.3 }));
      m.position.set(a*s - 14*s, (28 - b - h)*s + 230, 0); g.add(m);
    });
    const base = new THREE.Mesh(new THREE.TorusGeometry(260, 60, 24, 64), new THREE.MeshStandardMaterial({ color:CREMA, roughness:.3 }));
    base.rotation.x = -Math.PI/2; base.position.y = 10; g.add(base);
    { const sh = new THREE.Shape(), W = 1000, H = 170, r = 70;
      sh.moveTo(-W/2+r, 0); sh.lineTo(W/2-r, 0); sh.quadraticCurveTo(W/2, 0, W/2, r); sh.lineTo(W/2, H-r); sh.quadraticCurveTo(W/2, H, W/2-r, H);
      sh.lineTo(-W/2+r, H); sh.quadraticCurveTo(-W/2, H, -W/2, H-r); sh.lineTo(-W/2, r); sh.quadraticCurveTo(-W/2, 0, -W/2+r, 0);
      const bar = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth:40, bevelEnabled:true, bevelThickness:30, bevelSize:26, bevelSegments:6, curveSegments:12 }), new THREE.MeshStandardMaterial({ color:CREMA, roughness:.3 }));
      bar.position.set(0, 30, 160); g.add(bar);
      const tx = lienzo(2048, 320, (x, w, h) => { palabra(x, 'MOMENTURIES', w/2, h*.54, 190, NEGRO, .16); });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(1000, 156), new THREE.MeshStandardMaterial({ map:tx, transparent:true, roughness:.35 }));
      pl.position.set(0, 30+H/2, 160+40+31); g.add(pl); }
    g.position.set(820, MAR, 2500); g.rotation.y = Math.PI + .15; scene.add(g);
    anim.push(t => { g.position.y = MAR + 30 + Math.sin(t*.55)*12; g.rotation.z = Math.sin(t*.5)*.025; g.rotation.y = Math.PI + .15 + Math.sin(t*.2)*.06; });
  }

  /* globo: gajos crema, terracota y negro, con una franja con la palabra */
  { const tex = lienzo(2048, 1024, (x, w, h) => {
      const C = [CREMA, TERRA, CREMA, NEGRO]; for(let i = 0; i < 16; i++){ x.fillStyle = C[i % 4]; x.fillRect(i*w/16, 0, w/16+1, h); }
      x.fillStyle = CREMA; x.fillRect(0, h*.42, w, h*.16);
      for(let k = 0; k < 2; k++){ palabra(x, 'MOMENTURIES', w*(.25 + k*.5), h*.5, 92, NEGRO, .16); }
    });
    const g = new THREE.Group();
    const env = new THREE.Mesh(new THREE.SphereGeometry(480, 48, 32), new THREE.MeshStandardMaterial({ map:tex, roughness:.55 }));
    env.scale.set(1, 1.18, 1); g.add(env);
    const cuello = new THREE.Mesh(new THREE.CylinderGeometry(150, 60, 220, 32, 1, true), new THREE.MeshStandardMaterial({ color:TERRA, roughness:.6, side:THREE.DoubleSide }));
    cuello.position.y = -560; g.add(cuello);
    const cesta = new THREE.Mesh(new THREE.BoxGeometry(110, 90, 110), new THREE.MeshStandardMaterial({ color:'#8a6a45', roughness:.9 }));
    cesta.position.y = -830; g.add(cesta);
    const cuerda = new THREE.LineBasicMaterial({ color:'#3a332c' });
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a*55, -785, b*55), new THREE.Vector3(a*70, -670, b*70)]), cuerda)));
    scene.add(g);
    anim.push(t => { const a = t*.012; g.position.set(530 + Math.cos(a)*2700, 2050 + Math.sin(t*.25)*60, 650 + Math.sin(a)*2700 + 500); g.rotation.y = t*.03; });
  }

  /* avioneta con pancarta, dando vueltas a la casa */
  { const tex = lienzo(2048, 320, (x, w, h) => { x.fillStyle = CREMA; x.fillRect(0, 0, w, h); x.strokeStyle = TERRA; x.lineWidth = 14; x.strokeRect(7, 7, w-14, h-14);
      marca(x, 70, 40, 9); palabra(x, 'MOMENTURIES', w*.56, h*.52, 150, NEGRO, .2); });
    const av = new THREE.Group(), B = new THREE.MeshStandardMaterial({ color:'#f2efe9', roughness:.35 }), T = new THREE.MeshStandardMaterial({ color:TERRA, roughness:.4 });
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(42, 28, 520, 20), B); fus.rotation.z = Math.PI/2; av.add(fus);
    const morro = new THREE.Mesh(new THREE.SphereGeometry(42, 20, 14), T); morro.position.x = 260; av.add(morro);
    const ala = new THREE.Mesh(new THREE.BoxGeometry(110, 10, 900), B); ala.position.set(60, 30, 0); av.add(ala);
    [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(112, 11, 120), T); p.position.set(60, 30, s*400); av.add(p); });
    const cola = new THREE.Mesh(new THREE.BoxGeometry(80, 120, 8), T); cola.position.set(-240, 70, 0); av.add(cola);
    const est = new THREE.Mesh(new THREE.BoxGeometry(70, 8, 260), B); est.position.set(-240, 20, 0); av.add(est);
    const helice = new THREE.Mesh(new THREE.BoxGeometry(6, 170, 14), new THREE.MeshStandardMaterial({ color:'#2a2622' })); helice.position.x = 300; av.add(helice);
    const N = 40, L = 2000, H = 310, gb = new THREE.PlaneGeometry(L, H, N, 1);
    const pan = new THREE.Mesh(gb, new THREE.MeshStandardMaterial({ map:tex, roughness:.8, side:THREE.DoubleSide }));
    pan.frustumCulled = false; scene.add(av, pan);
    const cab = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color:'#3a332c' })); cab.frustumCulled = false; scene.add(cab);
    const P = gb.attributes.position, base = P.array.slice(), R = 3900, cx = 530, cz = 650, alt = 1150;
    const en = (a, d) => new THREE.Vector3(cx + Math.cos(a)*R, alt + Math.sin(a*3)*40, cz + Math.sin(a)*R);
    anim.push(t => {
      const a = -t*.045;
      av.position.copy(en(a)); const sig = en(a - .01); av.lookAt(sig); av.rotateY(-Math.PI/2); av.rotateX(-.18);
      helice.rotation.x = t*40;
      /* la pancarta sigue la trayectoria por detrás y ondea */
      const cola0 = 450, ang = L/R;
      for(let i = 0; i < P.count; i++){
        const u = (base[i*3] + L/2)/L, v = base[i*3+1];
        const aa = a + (cola0 + u*L)/R, p = en(aa), dir = new THREE.Vector3(-Math.sin(aa), 0, Math.cos(aa));
        const out = new THREE.Vector3(Math.cos(aa), 0, Math.sin(aa));
        const ola = Math.sin(t*5 + u*9)*18*(1-u*.3);
        P.setXYZ(i, p.x + out.x*ola, p.y + v - 20, p.z + out.z*ola);
      }
      P.needsUpdate = true; gb.computeVertexNormals();
      const c0 = av.position.clone(), c1 = en(a + cola0/R); c1.y -= 20;
      cab.geometry.setFromPoints([c0, c1]);
    });
  }

  /* ── 13-nov (Marc): «que por fuera se vea como una isla, no en medio del agua; un todoterreno con la marca, muy guay».
     Isla baja alrededor de la casa (césped), roca, playa con espuma y agua turquesa hacia la orilla; palmeras, rocas,
     el camino de la entrada y el todoterreno. Todo del visor (no se hornea) y fundido por material: pocas llamadas de dibujo. ── */
  const fundir = (objs, extra = {}) => {          /* junta mallas del mismo material en una sola (ya colocadas) */
    const por = new Map();
    objs.forEach(o => { o.updateMatrixWorld(true); const k = o.material; if(!por.has(k)) por.set(k, []); por.get(k).push(o); });
    const out = [];
    por.forEach((lista, m) => {
      const P = [], N = [], U = [], C = []; let conColor = lista.every(o => o.geometry.attributes.color);
      lista.forEach(o => { let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
        if(!g.attributes.normal) g.computeVertexNormals();
        const n = g.attributes.position.count; P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array);
        U.push(...(g.attributes.uv ? g.attributes.uv.array : new Float32Array(n*2)));
        if(conColor) C.push(...g.attributes.color.array); });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); if(conColor) g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.computeBoundingSphere(); const mm = new THREE.Mesh(g, m); Object.assign(mm, extra); out.push(mm);
    });
    return out;
  };
  {
    const CX = 650, CZ = 650, SEG = 128, mar = -300;
    const ond = a => .5*Math.sin(a*3 + 1.3) + .3*Math.sin(a*7 + .4) + .2*Math.sin(a*13 + 2.1);
    /* borde del césped en la dirección a (desde el centro de la casa): el rectángulo de la casa más un margen.
       Al norte, sitio para el camino y el coche; al sur, poco (la terraza mira al mar); a los lados, jardín */
    const borde = a => { const dx = Math.cos(a), dz = Math.sin(a), t = Math.min(dx ? 664/Math.abs(dx) : 1e9, dz ? 660/Math.abs(dz) : 1e9);
      const n = Math.max(0, -dz), s = Math.max(0, dz); return t + 300 + 430*n*n - 150*s*s + 42*ond(a); };
    const PERFIL = [            /* [metros más allá del borde, altura, color] */
      [-90, -4, '#7f9d55'], [0, -4, '#86a35a'], [32, -13, '#8f9862'], [85, -110, '#a38c71'], [150, -246, '#8b7762'],
      [190, -286, '#cdb991'], [330, -297.5, '#ead9b5'], [420, -306, '#cbb68e'], [640, -365, '#ad9a74'] ];
    const altura = (x, z) => { const a = Math.atan2(z - CZ, x - CX), d = Math.hypot(x - CX, z - CZ) - borde(a);
      if(d <= PERFIL[0][0]) return -4;
      for(let i = 1; i < PERFIL.length; i++){ const [d0, y0] = PERFIL[i-1], [d1, y1] = PERFIL[i]; if(d <= d1) return y0 + (y1 - y0)*(d - d0)/(d1 - d0); }
      return PERFIL[PERFIL.length-1][1]; };
    ISLA = { altura, borde, CX, CZ, punto:(a, k) => { const r = borde(a) + k, x = CX + Math.cos(a)*r, z = CZ + Math.sin(a)*r; return new THREE.Vector3(x, altura(x, z), z); } };

    /* el terreno: un abanico de anillos (centro + 9 anillos × 128) */
    { const pos = [CX, -4, CZ], col = [], idx = [], c0 = new THREE.Color('#7f9d55'); col.push(c0.r, c0.g, c0.b);
      const tmp = new THREE.Color();
      for(let r = 0; r < PERFIL.length; r++) for(let k = 0; k < SEG; k++){
        const a = k/SEG*Math.PI*2, R = borde(a) + PERFIL[r][0], v = .94 + .12*Math.sin(k*1.7 + r*2.3)*Math.sin(k*.53 + r);
        pos.push(CX + Math.cos(a)*R, PERFIL[r][1], CZ + Math.sin(a)*R); tmp.set(PERFIL[r][2]).multiplyScalar(v); col.push(tmp.r, tmp.g, tmp.b); }
      for(let k = 0; k < SEG; k++) idx.push(0, 1 + (k+1)%SEG, 1 + k);
      for(let r = 0; r < PERFIL.length - 1; r++) for(let k = 0; k < SEG; k++){
        const a = 1 + r*SEG + k, b = 1 + r*SEG + (k+1)%SEG, c = a + SEG, d = b + SEG; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.96, metalness:0 })); scene.add(m); }

    /* el agua: de la orilla al horizonte, turquesa cerca y del azul de la foto del cielo lejos (sin niebla: casa con la foto) */
    { const R = [300, 380, 520, 820, 1500], LEJOS = [2600, 3800, 5150], COL = ['#56bcc2', '#47aec0', '#3797b6', '#2c82aa', '#2a76a0', '#286c96', '#276891', '#26668d'];
      const pos = [], col = [], idx = [], tmp = new THREE.Color(), n = R.length + LEJOS.length;
      for(let r = 0; r < n; r++) for(let k = 0; k < SEG; k++){ const a = k/SEG*Math.PI*2, D = r < R.length ? borde(a) + R[r] : LEJOS[r - R.length];
        pos.push(CX + Math.cos(a)*D, mar, CZ + Math.sin(a)*D); tmp.set(COL[r]); col.push(tmp.r, tmp.g, tmp.b); }
      for(let r = 0; r < n - 1; r++) for(let k = 0; k < SEG; k++){ const a = r*SEG + k, b = r*SEG + (k+1)%SEG; idx.push(a, b, a + SEG, b, b + SEG, a + SEG); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      const agua = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors:true, roughness:.14, metalness:.05, fog:false })); scene.add(agua);
      /* espuma en la orilla: una franja blanca que va y viene */
      const pe = [], ip = [], ue = [];
      for(let k = 0; k <= SEG; k++){ const a = k/SEG*Math.PI*2, b = borde(a);
        [[340, 0], [378, 1]].forEach(([o, v]) => { pe.push(CX + Math.cos(a)*(b + o), mar + .6, CZ + Math.sin(a)*(b + o)); ue.push(k/8, v); }); }
      for(let k = 0; k < SEG; k++){ const a = k*2; ip.push(a, a+2, a+1, a+1, a+2, a+3); }
      const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pe, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(ue, 2)); ge.setIndex(ip);
      const tx = lienzo(256, 64, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.35, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
        x.globalCompositeOperation = 'destination-out'; for(let i = 0; i < 70; i++){ x.fillStyle = `rgba(0,0,0,${.3 + Math.random()*.5})`; x.beginPath(); x.ellipse(Math.random()*w, Math.random()*h, 4 + Math.random()*14, 2 + Math.random()*5, 0, 0, 7); x.fill(); } });
      tx.wrapS = THREE.RepeatWrapping;
      const esp = new THREE.Mesh(ge, new THREE.MeshBasicMaterial({ map:tx, transparent:true, depthWrite:false, toneMapped:false, opacity:.75, fog:false })); scene.add(esp);
      anim.push(t => { tx.offset.x = t*.01; esp.material.opacity = .55 + .25*Math.sin(t*.8); }); }

    /* palmeras: tronco con anillos y hojas de canvas; todas en dos mallas */
    { const texT = lienzo(64, 256, (x, w, h) => { x.fillStyle = '#8c7155'; x.fillRect(0, 0, w, h);
        for(let i = 0; i < 22; i++){ x.fillStyle = i % 2 ? 'rgba(60,42,28,.45)' : 'rgba(205,180,140,.25)'; x.fillRect(0, i*h/22, w, h/44); } });
      texT.wrapS = texT.wrapT = THREE.RepeatWrapping;
      const texH = lienzo(512, 128, (x, w, h) => { x.strokeStyle = '#4c6b2e'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, h/2); x.lineTo(w, h/2); x.stroke();
        for(let i = 6; i < w; i += 9){ const l = 58*Math.sin(Math.PI*Math.min(1, i/w*1.05))**.7, c = ['#5f8a37', '#4f7a2e', '#6c9640'][i % 3];
          x.strokeStyle = c; x.lineWidth = 5; x.beginPath(); x.moveTo(i, h/2); x.lineTo(i + 16, h/2 - l); x.moveTo(i, h/2); x.lineTo(i + 16, h/2 + l); x.stroke(); } });
      const mT = new THREE.MeshStandardMaterial({ map:texT, roughness:.95 }), mH = new THREE.MeshStandardMaterial({ map:texH, roughness:.8, side:THREE.DoubleSide, alphaTest:.5, transparent:false });
      const piezas = [];
      [[-170, 260, 560, .3], [-200, 940, 640, -.5], [-120, 1330, 520, 2.4], [1490, 230, 600, 1.1], [1520, 1010, 540, 3.3], [1470, 1360, 600, .9], [170, -420, 620, 4.4], [1470, -520, 560, 5.2], [520, -640, 500, 2.0]]
        .forEach(([x, z, H, f]) => {
          if(Math.hypot(x - CX, z - CZ) > borde(Math.atan2(z - CZ, x - CX)) - 40) return;
          const lean = new THREE.Vector3(Math.cos(f), 0, Math.sin(f)).multiplyScalar(H*.16);
          const pts = [0, .35, .7, 1].map(k => new THREE.Vector3(x + lean.x*k*k, -4 + H*k, z + lean.z*k*k));
          const curva = new THREE.CatmullRomCurve3(pts), gt = new THREE.TubeGeometry(curva, 10, 12, 7, false), P = gt.attributes.position;
          for(let i = 0; i < P.count; i++){ const ring = Math.floor(i/8), t = ring/10, c = curva.getPointAt(t), k = 1 - .45*t;
            P.setXYZ(i, c.x + (P.getX(i) - c.x)*k, P.getY(i), c.z + (P.getZ(i) - c.z)*k); }
          const uv = gt.attributes.uv; for(let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)*H/60);
          gt.computeVertexNormals(); piezas.push(new THREE.Mesh(gt, mT));
          const top = pts[3];
          for(let j = 0; j < 10; j++){ const a = j/10*Math.PI*2 + f, L = 230 + 40*Math.sin(j*2.1 + f), gh = new THREE.PlaneGeometry(1, 1, 10, 1), Q = gh.attributes.position;
            for(let i = 0; i < Q.count; i++){ const s = Q.getX(i) + .5, side = Q.getY(i), w = 52*Math.sin(Math.PI*Math.min(1, s*1.05))**.6;
              const r = s*L, y = top.y + 10 + r*.5 - r*r/L*1.05;
              Q.setXYZ(i, top.x + Math.cos(a)*r - Math.sin(a)*side*w, y + Math.abs(side)*w*.18, top.z + Math.sin(a)*r + Math.cos(a)*side*w); }
            gh.computeVertexNormals(); piezas.push(new THREE.Mesh(gh, mH)); }
          const coco = new THREE.Mesh(new THREE.SphereGeometry(8, 8, 6), new THREE.MeshStandardMaterial({ color:'#5b4630', roughness:.7 }));
          [[9, 0], [-6, 8], [-4, -9]].forEach(([dx, dz]) => { const c = coco.clone(); c.position.set(top.x + dx, top.y - 2, top.z + dz); piezas.push(c); });
        });
      fundir(piezas).forEach(m => scene.add(m)); }

    /* rocas en el pie del acantilado y en la playa */
    { const g = new THREE.DodecahedronGeometry(1, 0), m = new THREE.MeshStandardMaterial({ color:'#8e7c67', roughness:.95, flatShading:true });
      const R = [], q = new THREE.Quaternion(), e = new THREE.Euler(), M = new THREE.Matrix4();
      for(let i = 0; i < 26; i++){ const a = i/26*Math.PI*2 + .37*Math.sin(i*5.3), k = 140 + 70*((i*37) % 10)/10, p = ISLA.punto(a, k), s = 28 + ((i*53) % 9)*7;
        e.set(i, i*1.7, i*.6); q.setFromEuler(e); M.compose(new THREE.Vector3(p.x, p.y + s*.25, p.z), q, new THREE.Vector3(s*1.3, s*.8, s)); R.push(M.clone()); }
      const im = new THREE.InstancedMesh(g, m, R.length); R.forEach((mm, i) => im.setMatrixAt(i, mm)); scene.add(im); }

    /* el camino de la entrada (grava), de la puerta de la calle al aparcamiento */
    { const curva = new THREE.CatmullRomCurve3([[1222, 4], [1222, -150], [1120, -330], [880, -440], [600, -450]].map(([x, z]) => new THREE.Vector3(x, -2.6, z)));
      const N = 40, pos = [], uv = [], idx = [];
      for(let i = 0; i <= N; i++){ const t = i/N, p = curva.getPointAt(t), d = curva.getTangentAt(t), n = new THREE.Vector3(-d.z, 0, d.x), w = i > N*.62 ? 330 : 190;
        [-1, 1].forEach(s => { pos.push(p.x + n.x*w/2*s, -2.6, p.z + n.z*w/2*s); uv.push((s + 1)/2, t*12); }); }
      for(let i = 0; i < N; i++){ const a = i*2; idx.push(a, a+1, a+2, a+1, a+3, a+2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const tx = lienzo(128, 128, (x, w, h) => { x.fillStyle = '#d9cdb4'; x.fillRect(0, 0, w, h);
        for(let i = 0; i < 900; i++){ const c = 150 + Math.random()*90 | 0; x.fillStyle = `rgba(${c},${c - 12},${c - 30},.55)`; x.fillRect(Math.random()*w, Math.random()*h, 1 + Math.random()*2.5, 1 + Math.random()*2.5); } });
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map:tx, roughness:.95, side:THREE.DoubleSide })); scene.add(m); }

    /* ── el todoterreno de la marca: crema, terracota y negro, con baca, tabla de surf, faros redondos, rueda de repuesto
       con el logo y la marca en las puertas. Mira hacia el oeste, aparcado al final del camino. ── */
    { const g = new THREE.Group(), L = 460, W = 196;
      const M = (c, r = .45, mt = 0, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color:c, roughness:r, metalness:mt }, extra));
      const mCrema = M(CREMA, .32, .1), mNegro = M('#1c1c1c', .55), mGoma = M('#1a1a1a', .92), mLlanta = M('#8a6a3c', .35, .7), mCristal = M('#1d2427', .06, .5), mCromo = M('#d9d6cf', .18, .9);
      const add = (geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
      /* carrocería: perfil lateral con los pasos de rueda, extruido a lo ancho */
      const sh = new THREE.Shape(); sh.moveTo(-232, 42); sh.lineTo(-200, 42); sh.absarc(-150, 42, 50, Math.PI, 0, true); sh.lineTo(100, 42); sh.absarc(150, 42, 50, Math.PI, 0, true);
      sh.lineTo(234, 42); sh.lineTo(238, 98); sh.lineTo(229, 121); sh.lineTo(112, 127); sh.lineTo(-232, 127); sh.lineTo(-237, 66); sh.closePath();
      const gc = new THREE.ExtrudeGeometry(sh, { depth:W - 24, bevelEnabled:true, bevelThickness:9, bevelSize:7, bevelSegments:3, curveSegments:14 }); gc.translate(0, 0, -(W - 24)/2);
      add(gc, mCrema);
      /* la parte de los cristales y el techo */
      const sv = new THREE.Shape(); sv.moveTo(112, 126); sv.lineTo(44, 186); sv.lineTo(-224, 188); sv.lineTo(-231, 126); sv.closePath();
      const gv = new THREE.ExtrudeGeometry(sv, { depth:W - 40, bevelEnabled:true, bevelThickness:4, bevelSize:3, bevelSegments:2 }); gv.translate(0, 0, -(W - 40)/2);
      add(gv, mCristal);
      add(new THREE.BoxGeometry(272, 9, W - 22), mCrema, -92, 191, 0);                                         // techo
      [[-22, 9], [-128, 9], [-222, 12]].forEach(([x, w]) => add(new THREE.BoxGeometry(w, 62, W - 30), mCrema, x, 158, 0));   // montantes
      { const a = add(new THREE.BoxGeometry(80, 7, W - 30), mCrema, 78, 157, 0, 0, 0, Math.atan2(60, 68)); }       // marco del parabrisas
      /* parachoques, rejilla, aletas */
      add(new THREE.BoxGeometry(18, 26, W + 6), mNegro, 242, 50, 0); add(new THREE.BoxGeometry(18, 26, W + 6), mNegro, -242, 50, 0);
      add(new THREE.BoxGeometry(6, 44, 112), mNegro, 240, 88, 0);
      [-1, 1].forEach(s => { [150, -150].forEach(x => { const f = add(new THREE.TorusGeometry(53, 6.5, 6, 18, Math.PI), mNegro, x, 42, s*(W/2 + 3)); });
        add(new THREE.BoxGeometry(170, 6, 16), mNegro, 0, 36, s*(W/2 + 8));                                    // estribo
        add(new THREE.BoxGeometry(9, 12, 16), mNegro, 112, 132, s*(W/2 + 10));                                 // retrovisor
        add(new THREE.CylinderGeometry(12, 12, 5, 20), M('#fffbea', .2, 0, { emissive:'#fff6d8', emissiveIntensity:.9 }), 241, 96, s*70, 0, 0, Math.PI/2);   // faros
        add(new THREE.TorusGeometry(12.5, 2, 6, 20), mCromo, 243, 96, s*70, 0, Math.PI/2, 0);
        add(new THREE.BoxGeometry(4, 6, 14), M('#e8901d', .3, 0, { emissive:'#a85a10', emissiveIntensity:.5 }), 240, 70, s*78);
        add(new THREE.BoxGeometry(4, 22, 12), M('#b82a22', .3, 0, { emissive:'#6a120e', emissiveIntensity:.6 }), -240, 104, s*84); });
      /* ruedas todoterreno con llanta bronce */
      [[150, 1], [150, -1], [-150, 1], [-150, -1]].forEach(([x, s]) => { const z = s*(W/2 - 16);
        add(new THREE.CylinderGeometry(40, 40, 30, 26), mGoma, x, 40, z, Math.PI/2);
        add(new THREE.TorusGeometry(40, 4.5, 6, 26), mGoma, x, 40, z + s*14);
        add(new THREE.CylinderGeometry(24, 24, 31.5, 14), mLlanta, x, 40, z, Math.PI/2);
        add(new THREE.CylinderGeometry(7, 7, 33, 10), mNegro, x, 40, z, Math.PI/2); });
      /* rueda de repuesto atrás, con la funda de la marca */
      add(new THREE.CylinderGeometry(39, 39, 28, 26), mGoma, -262, 112, 0, 0, 0, Math.PI/2);
      { const t = lienzo(512, 512, (x, w, h) => { x.fillStyle = CREMA; x.beginPath(); x.arc(w/2, h/2, w/2, 0, 7); x.fill(); x.strokeStyle = TERRA; x.lineWidth = 26; x.beginPath(); x.arc(w/2, h/2, w/2 - 22, 0, 7); x.stroke();
          marca(x, w/2 - 105, h/2 - 150, 8); palabra(x, 'MOMENTURIES', w/2, h*.79, 46, NEGRO, .14); });
        add(new THREE.CircleGeometry(36, 32), new THREE.MeshStandardMaterial({ map:t, roughness:.5 }), -276.5, 112, 0, 0, -Math.PI/2, 0); }
      /* baca con barra de luces, bidón y tabla de surf */
      [-1, 1].forEach(s => add(new THREE.BoxGeometry(280, 5, 5), mNegro, -92, 200, s*82));
      [-200, -130, -60, 10].forEach(x => add(new THREE.BoxGeometry(5, 5, 170), mNegro, x, 200, 0));
      add(new THREE.BoxGeometry(10, 12, 150), mNegro, 42, 204, 0);
      for(let i = 0; i < 6; i++) add(new THREE.BoxGeometry(2, 7, 16), M('#fffdf2', .2, 0, { emissive:'#fff7df', emissiveIntensity:.8 }), 47.5, 204, -55 + i*22);
      { const t = lienzo(512, 64, (x, w, h) => { x.fillStyle = CREMA; x.fillRect(0, 0, w, h); x.fillStyle = TERRA; x.fillRect(0, h*.36, w, h*.28); x.fillStyle = NEGRO; x.fillRect(w*.47, 0, 6, h); });
        const s = add(new THREE.SphereGeometry(1, 20, 10), new THREE.MeshStandardMaterial({ map:t, roughness:.3 }), -100, 210, -30); s.scale.set(125, 4, 24); }
      add(new THREE.BoxGeometry(34, 44, 18), M('#3f5a3a', .6), -175, 225, 50);                                   // bidón
      /* snorkel */
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(200, 70, 100), new THREE.Vector3(150, 120, 100), new THREE.Vector3(70, 182, 92), new THREE.Vector3(66, 196, 90)]), 10, 5, 8, false), mNegro);
      /* la marca en las dos puertas y una franja terracota a lo largo */
      { const t = lienzo(1024, 340, (x, w, h) => { marca(x, 30, 40, 9.5); palabra(x, 'MOMENTURIES', w*.6, h*.36, 96, NEGRO, .12);
          x.fillStyle = TERRA; x.font = `600 40px system-ui, -apple-system, 'Segoe UI', sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Tus momentos, en tu pared', w*.6, h*.64);
          x.fillStyle = '#5c544a'; x.font = `500 30px system-ui, sans-serif`; x.fillText('momenturies.com', w*.6, h*.86); });
        const mL = new THREE.MeshStandardMaterial({ map:t, transparent:true, roughness:.35 });
        const mF = M(TERRA, .4);
        [-1, 1].forEach(s => { add(new THREE.PlaneGeometry(196, 65), mL, -6, 82, s*95.6, 0, s > 0 ? 0 : Math.PI, 0);
          add(new THREE.BoxGeometry(460, 7, 1), mF, 2, 118, s*95.4); }); }
      /* matrículas (27-11: el Black Friday) */
      { const t = lienzo(520, 112, (x, w, h) => { x.fillStyle = '#f7f7f2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f4fb4'; x.fillRect(0, 0, 54, h); x.fillStyle = '#ffd400'; x.font = '700 22px sans-serif'; x.textAlign = 'center'; x.fillText('E', 27, 92);
          x.fillStyle = '#111'; x.font = '700 84px "DIN Alternate", "Arial Narrow", Arial, sans-serif'; x.textBaseline = 'middle'; x.fillText('2711 BFR', 290, 60); x.strokeStyle = '#111'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4); });
        const mm = new THREE.MeshStandardMaterial({ map:t, roughness:.4 });
        add(new THREE.PlaneGeometry(52, 11.2), mm, 251.5, 54, 0, 0, Math.PI/2, 0); add(new THREE.PlaneGeometry(52, 11.2), mm, -251.5, 66, 0, 0, -Math.PI/2, 0); }
      /* sombra suave debajo (para que pise el suelo) */
      const sombra = new THREE.Mesh(new THREE.PlaneGeometry(560, 290), new THREE.MeshBasicMaterial({ transparent:true, depthWrite:false, toneMapped:false,
        map:lienzo(256, 128, (x, w, h) => { const r = x.createRadialGradient(w/2, h/2, 4, w/2, h/2, w/2); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(.6, 'rgba(0,0,0,.28)'); r.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = r; x.save(); x.scale(1, h/w); x.fillRect(0, 0, w, w); x.restore(); }) }));
      sombra.rotation.x = -Math.PI/2; sombra.position.y = .4; g.add(sombra);
      const partes = g.children.filter(o => o !== sombra);
      const fund = fundir(partes); partes.forEach(o => g.remove(o)); fund.forEach(o => g.add(o));
      g.position.set(800, -2.6, -430); g.rotation.y = Math.PI - .1; scene.add(g); }
  }

  return t => { anim.forEach(f => f(t)); pinta = true; };
})();

/* ── 12-nov (Marc): EASTER EGGS. Cada uno cuenta una vez (se guarda en este navegador) y sale «N/14 encontrados».
   Con todos, el código de premio. No van horneados: son objetos del visor o cajas invisibles sobre muebles horneados.
   Lista y sitios: blender/momenturies-rooms/PENDIENTE_casa2_noche_11nov.md ── */
HV = (() => {
  /* 12-nov (Marc): tres premios, creados en Shopify (una vez por cliente, no se suman a otros descuentos) */
  const LISTA = [   // id, título, texto, pista
    ['espejo', 'Lo que solo ve el espejo', 'Estaba justo detrás de ti. Solo se veía en el reflejo.', 'Mírate en el espejo del baño de abajo. ¿Qué tienes detrás?'],
    ['iman_cocina', 'Imán en lo alto', 'Alguien lo dejó encima de los armarios de la cocina.', 'En la cocina hay algo encima de los armarios altos. Salta (dos veces).'],
    ['iman_biblioteca', 'Imán con polvo', 'Encima de las estanterías nadie limpia nunca.', 'Encima de las estanterías de la biblioteca.'],
    ['iman_terraza', 'Imán al sol', 'Tomando el sol en la esquina de la terraza.', 'En la esquina más lejana de la terraza.'],
    ['iman_invitados', 'Imán perdido', 'Debajo del escritorio, donde acaba todo lo que se cae.', 'Agáchate en el dormitorio de invitados.'],
    ['iman_lampara', 'Imán en la lámpara', 'Solo se ve desde arriba.', 'Asómate a la barandilla de arriba y mira la lámpara del recibidor.'],
    ['nevera', 'El táper prohibido', '«No es tuyo.» Firmado: tu compañero de piso.', 'Abre la nevera de la cocina.'],
    ['retrete', 'Momento inolvidable', '', 'Abre el váter del baño de abajo… y tira de la cadena.'],
    ['sofa', 'El sofá te atrapa', 'Uff… cinco minutitos más.', 'Siéntate en el sofá del salón.'],
    ['calendario', 'Apuntado', '27 de noviembre: Black Friday en Momenturies. ¿Lo tienes apuntado?', 'Mira el calendario del despacho.'],
    ['escalera', '¿Estás bien?', 'Llevas 5 viajes por la escalera. Bebe un poco de agua.', 'Sube y baja la escalera. Varias veces.'],
    ['retrato', 'El retrato que te mira', '¿Qué miras? Él también te mira a ti.', 'En la biblioteca hay alguien que no te quita ojo.'],
    ['vecino', 'El vecino de abajo', '¡TOC, TOC, TOC! «¿Se puede saber qué hacéis ahí arriba?»', 'Arriba, salta sin parar.'],
    ['tele', 'Hay algo en la tele', 'Esta noche, en todas las cadenas: tus fotos.', 'En el salón hay una tele antigua. ¿Funcionará?'],
    ['botella', 'Mensaje en una botella', '«Tus fotos merecen salir del móvil.»', 'Desde la terraza, mira bien la orilla de la playa.'],
    ['patito', 'Cuac', 'El patito de la bañera tiene muy buen oído.', 'En la bañera del baño principal hay alguien.'],
    ['gaviota', 'Te ha visto', 'La gaviota ya no te deja ni una patata frita.', 'En la terraza hay alguien en la barandilla. Acércate despacio.'],
  ];
  const TOTAL = LISTA.length, INFO = Object.fromEntries(LISTA.map(([id, t, x, p]) => [id, { t, x, p }])), CLAVE = 'momenturies_casa2_huevos';
  /* 13-nov (Marc): cuatro premios. CASAIMAN y CASAREGALO se pueden usar juntos (imán + sobremesa de regalo) */
  const PREMIOS = [
    { n:4, code:'CASA10', m:'−10%', c:'−10 %', t:'un 10 % de descuento' },
    { n:8, code:'CASAIMAN', m:'🧲', c:'Imán de regalo', t:'un imán de regalo con tu compra' },
    { n:12, code:'CASA20', m:'−20%', c:'−20 %', t:'un 20 % de descuento' },
    { n:TOTAL, code:'CASAREGALO', m:'🎁', c:'Sobremesa de regalo', t:'un cuadro de sobremesa de regalo con tu compra (se suma al imán de regalo, CASAIMAN)' } ];
  let hechos = [];
  try{ hechos = JSON.parse(localStorage.getItem(CLAVE) || '[]').filter(k => INFO[k]); }catch(_){ hechos = []; }
  const guarda = () => { try{ localStorage.setItem(CLAVE, JSON.stringify(hechos)); }catch(_){} };
  const ya = id => hechos.includes(id);
  const miles = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  /* el aviso de arriba y el contador */
  const av = document.createElement('div'); av.id = 'hv';
  av.innerHTML = '<i></i><div><small></small><b></b><span></span><a></a></div><button type="button" aria-label="Cerrar">×</button>';
  const pill = document.createElement('button'); pill.id = 'hvc'; pill.type = 'button';
  document.body.append(av, pill);
  let tAv = 0, pista = 0;
  function aviso(o){
    av.querySelector('i').textContent = o.emoji || '🥚'; av.querySelector('small').textContent = o.sub || '';
    av.querySelector('b').textContent = o.t; av.querySelector('span').textContent = o.x || '';
    const a = av.querySelector('a'); a.style.display = o.link ? '' : 'none'; if(o.link){ a.textContent = o.link[0]; a.href = o.link[1]; }
    av.classList.add('ver'); clearTimeout(tAv); if(!o.fijo) tAv = setTimeout(() => av.classList.remove('ver'), o.ms || 6500);
  }
  av.querySelector('button').addEventListener('click', e => { e.stopPropagation(); av.classList.remove('ver'); });
  const ganados = () => PREMIOS.filter(q => hechos.length >= q.n);
  const siguiente = () => PREMIOS.find(q => hechos.length < q.n);
  const copia = (code, btn) => { const ok = () => { btn.textContent = '¡Copiado!'; setTimeout(() => btn.textContent = 'Copiar', 1600); };
    try{ navigator.clipboard.writeText(code).then(ok, ok); }catch(_){ ok(); } };

  /* contador pequeño (huevos y premios); al tocarlo, el panel con los premios y una pista */
  function cuenta(){ pill.innerHTML = `<span>🥚 ${hechos.length}/${TOTAL}</span><span>🎁 ${ganados().length}/${PREMIOS.length}</span>`; pill.classList.toggle('ver', hechos.length > 0); }
  const panel = document.createElement('div'); panel.id = 'hvp'; document.body.append(panel);
  function abrePanel(){
    const f = LISTA.filter(l => !ya(l[0]));
    panel.innerHTML = `<button type="button" class="x" aria-label="Cerrar">×</button><small>Easter eggs</small><b>${hechos.length} de ${TOTAL} encontrados</b>
      <div class="barra"><i style="width:${hechos.length/TOTAL*100}%"></i>${PREMIOS.map(q => `<em style="left:${q.n/TOTAL*100}%" class="${hechos.length >= q.n ? 'si' : ''}"></em>`).join('')}</div>
      <ul>${PREMIOS.map(q => hechos.length >= q.n
        ? `<li class="si"><span>${q.c}</span><code>${q.code}</code><button type="button" data-c="${q.code}">Copiar</button></li>`
        : `<li><span>${q.c}</span><em>Encuentra ${q.n === TOTAL ? 'los ' + TOTAL : q.n}</em><i>🔒</i></li>`).join('')}</ul>
      ${f.length ? `<p class="pi"><b>Pista:</b> ${f[pista++ % f.length][3]}</p><button type="button" class="otra">Otra pista</button>` : '<p class="pi">¡Los tienes todos! Usa el mejor código en la tienda.</p>'}
      ${ganados().length ? '<a href="index.html">Ir a la tienda</a>' : ''}`;
    panel.classList.add('ver');
    panel.querySelector('.x').onclick = e => { e.stopPropagation(); panel.classList.remove('ver'); };
    const o = panel.querySelector('.otra'); if(o) o.onclick = e => { e.stopPropagation(); abrePanel(); };
    panel.querySelectorAll('[data-c]').forEach(b => b.onclick = e => { e.stopPropagation(); copia(b.dataset.c, b); });
  }
  ['pointerdown', 'click', 'touchstart'].forEach(t => panel.addEventListener(t, e => e.stopPropagation()));
  pill.addEventListener('click', e => { e.stopPropagation(); panel.classList.contains('ver') ? panel.classList.remove('ver') : abrePanel(); });
  cuenta();

  /* la celebración: confeti + tarjeta con el código */
  const fiesta = document.createElement('div'); fiesta.id = 'fiesta';
  fiesta.innerHTML = '<canvas></canvas><div class="tarjeta"><div class="medalla"></div><small></small><h2></h2><p></p><div class="cod"><code></code><button type="button">Copiar</button></div><span class="nota"></span><div class="bts"><a href="index.html">Usarlo en la tienda</a><button type="button" class="sigue">Seguir buscando</button></div></div>';
  document.body.append(fiesta);
  ['pointerdown', 'click', 'touchstart'].forEach(t => fiesta.addEventListener(t, e => e.stopPropagation()));
  let confeti = [], rafF = 0;
  function lanzaConfeti(){
    const cv = fiesta.querySelector('canvas'), x = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    cv.width = W*dpr; cv.height = H*dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const COL = ['#c2613a', '#1a1a1a', '#ffd77a', '#f6f1e7', '#e89a6b', '#7fa38a', '#f2c14e'];
    const pieza = (o) => Object.assign({ w:6 + Math.random()*7, h:4 + Math.random()*5, r:Math.random()*6, vr:(Math.random() - .5)*.35, c:COL[Math.floor(Math.random()*COL.length)], f:Math.random()*6, t:0 }, o);
    for(let k = 0; k < 2; k++) for(let i = 0; i < 110; i++){ const izq = k === 0;
      confeti.push(pieza({ x:izq ? -10 : W + 10, y:H*(.6 + Math.random()*.3), vx:(izq ? 1 : -1)*(3 + Math.random()*10), vy:-(10 + Math.random()*12), d:Math.random()*.25 })); }
    for(let i = 0; i < 90; i++) confeti.push(pieza({ x:Math.random()*W, y:-20 - Math.random()*H*.5, vx:(Math.random() - .5)*2, vy:2 + Math.random()*3, d:.5 + Math.random()*.9 }));
    const t0 = performance.now(); let tp = t0; cancelAnimationFrame(rafF);
    const paso = n => { const dt = Math.min(.05, (n - tp)/1000); tp = n; x.clearRect(0, 0, W, H);
      confeti.forEach(p => { p.t += dt; if(p.t < p.d) return; p.vy = Math.min(p.vy + 24*dt, 4 + p.w*.25); p.vx *= .985;
        p.x += p.vx*dt*30 + Math.sin(p.t*3 + p.f)*.6; p.y += p.vy*dt*30; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.scale(1, Math.cos(p.t*6 + p.f)); x.fillStyle = p.c; x.fillRect(-p.w/2, -p.h/2, p.w, p.h); x.restore(); });
      confeti = confeti.filter(p => p.y < H + 40);
      if(confeti.length && n - t0 < 10000) rafF = requestAnimationFrame(paso); else { confeti = []; x.clearRect(0, 0, W, H); } };
    rafF = requestAnimationFrame(paso);
  }
  function fanfarria(){ const a = ac(); if(!a) return; const T = a.currentTime + .05;
    [[523.25, 0], [659.25, .12], [783.99, .24], [1046.5, .38], [783.99, .56], [1046.5, .68]].forEach(([f, d], i) => {
      const o = a.createOscillator(), g = a.createGain(); o.type = i > 2 ? 'triangle' : 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0, T + d); g.gain.linearRampToValueAtTime(.08, T + d + .02); g.gain.exponentialRampToValueAtTime(.001, T + d + (i === 5 ? .9 : .28));
      o.connect(g); g.connect(a.destination); o.start(T + d); o.stop(T + d + 1); }); }
  function celebra(q){
    const t = fiesta.querySelector('.tarjeta'), ult = q.n === TOTAL, sg = PREMIOS.find(k => k.n > q.n);
    t.querySelector('.medalla').textContent = q.m;
    t.querySelector('small').textContent = ult ? `Los ${TOTAL} easter eggs` : `${q.n} de ${TOTAL} easter eggs`;
    t.querySelector('h2').textContent = ult ? '¡Los has encontrado todos!' : '¡Enhorabuena!';
    t.querySelector('p').textContent = `Has conseguido ${q.t} en Momenturies.`;
    t.querySelector('code').textContent = q.code;
    t.querySelector('.nota').textContent = sg ? `Sigue buscando: con ${sg.n === TOTAL ? 'los ' + TOTAL : sg.n} consigues ${sg.t}.` : 'El premio más gordo. Un uso por cliente.';
    const b = t.querySelector('.cod button'); b.textContent = 'Copiar'; b.onclick = () => copia(q.code, b);
    const sb = t.querySelector('.sigue'); sb.textContent = ult ? 'Seguir paseando' : 'Seguir buscando'; sb.onclick = () => fiesta.classList.remove('ver');
    fiesta.classList.toggle('oro', ult);
    av.classList.remove('ver'); panel.classList.remove('ver');
    fiesta.classList.remove('ver'); void fiesta.offsetWidth; fiesta.classList.add('ver'); lanzaConfeti(); fanfarria();
  }
  function encontrado(id, o = {}){
    const e = INFO[id], nuevo = !ya(id);
    if(nuevo){ hechos.push(id); guarda(); cuenta(); }
    const sg = siguiente(), falta = sg ? ` · ${sg.n - hechos.length} para el siguiente premio` : '';
    aviso({ emoji:o.emoji, t:o.t || e.t, x:o.x != null ? o.x : e.x, link:o.link, sub:nuevo ? `${hechos.length}/${TOTAL} encontrados${falta}` : 'Este ya lo tenías' });
    const q = nuevo && PREMIOS.find(k => k.n === hechos.length);
    if(q) setTimeout(() => celebra(q), 2600);
  }

  /* sonidos hechos al vuelo (sin archivos) */
  let AC = null;
  const ac = () => { try{ AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume(); }catch(_){ AC = null; } return AC; };
  function ruido(dur, f0, f1, vol, t0 = 0){ const a = ac(); if(!a) return; const T = a.currentTime + t0, n = Math.floor(a.sampleRate*dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for(let i = 0; i < n; i++) d[i] = Math.random()*2 - 1;
    const s = a.createBufferSource(); s.buffer = b; const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(f0, T); f.frequency.exponentialRampToValueAtTime(f1, T + dur);
    const g = a.createGain(); g.gain.setValueAtTime(.0001, T); g.gain.exponentialRampToValueAtTime(vol, T + .1); g.gain.exponentialRampToValueAtTime(.0001, T + dur);
    s.connect(f).connect(g).connect(a.destination); s.start(T); }
  function golpe(t0, vol = .8){ const a = ac(); if(!a) return; const T = a.currentTime + t0, o = a.createOscillator(), g = a.createGain();
    o.frequency.setValueAtTime(150, T); o.frequency.exponentialRampToValueAtTime(48, T + .16);
    g.gain.setValueAtTime(.0001, T); g.gain.exponentialRampToValueAtTime(vol, T + .01); g.gain.exponentialRampToValueAtTime(.0001, T + .24);
    o.connect(g).connect(a.destination); o.start(T); o.stop(T + .26); }

  /* texturas */
  const lienzo = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANI; return t; };
  const BRILLO = lienzo(128, 128, (x, w, h) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,244,200,1)'); g.addColorStop(.22, 'rgba(255,214,120,.7)'); g.addColorStop(1, 'rgba(255,196,90,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const MARCA = lienzo(256, 256, (x, w) => { x.fillStyle = '#f6f1e7'; x.beginPath(); x.roundRect(0, 0, w, w, 28); x.fill(); const s = w/28;
    [[2.6, 3.5, 11.4, 14.9, '#1a1a1a'], [15.8, 3.5, 9.6, 7.9, '#c2613a'], [15.8, 13.1, 9.6, 11.4, '#1a1a1a'], [2.6, 20.1, 11.4, 4.4, '#c2613a']]
      .forEach(([a, b, ww, hh, c]) => { x.fillStyle = c; x.beginPath(); x.roundRect(a*s, b*s, ww*s, hh*s, 1.1*s); x.fill(); }); });
  const halo = (sz, extra = {}) => { const s = new THREE.Sprite(new THREE.SpriteMaterial(Object.assign({ map:BRILLO, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, toneMapped:false }, extra))); s.scale.set(sz, sz, 1); return s; };
  const anims = [];

  /* ── 5 imanes escondidos: se cogen al tocarlos o al tenerlos a menos de 75 cm y a menos de 40 cm de la altura de los ojos
     (cocina: un salto; biblioteca: doble salto; terraza: agacharse) ── */
  const IMANES = [
    ['iman_cocina', 30, 219, 1138],             // encima de las columnas de la cocina (218 de alto): solo se ve saltando
    ['iman_biblioteca', 681, 551, 300],         // encima de la estantería de la biblioteca (250 + planta alta)
    ['iman_terraza', 1300, 103.4, 1293],        // la esquina del peto de la terraza
    ['iman_invitados', 422, 300.6, 118],        // en el suelo, debajo del escritorio del dormitorio de invitados
    ['iman_lampara', 1212, 406.5, 231, -.4],    // de pie encima de la lámpara de bola del recibidor, mirando a la barandilla de arriba
  ].map(([id, x, y, z, rx = -Math.PI/2], i) => {
    const g = new THREE.Group(), m = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map:MARCA, toneMapped:false, transparent:true }));
    m.rotation.x = rx; g.add(m); const s = halo(24); s.position.y = 2; g.add(s);
    g.position.set(x, y, z); g.visible = !ya(id); scene.add(g);
    return { id, g, s, p:new THREE.Vector3(x, y, z), i, fin:0 };
  });
  const coge = q => { if(q.fin) return; q.fin = performance.now();
    encontrado(q.id, { emoji:'🧲', t:`${INFO[q.id].t} · ${IMANES.filter(k => ya(k.id) || k === q).length} de 5` }); };

  /* ── el espejo del baño de abajo: lo brillante está DETRÁS de ti; el espejo (horneado) no refleja, así que se pinta
     en el punto simétrico, al otro lado del cristal, y solo donde está el cristal (stencil) ── */
  const P_ESP = new THREE.Vector3(1105, 120, 722); let esp = null;
  function montaEspejo(){
    const e = espejos.find(q => q.z === 'bano'); if(!e || ya('espejo')) return;
    e.o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(e.o);
    const sala = salas.find(s => s.id === 'bano'), haciaX = (sala.x0+sala.x1)/2 < b.min.x;     // el espejo mira hacia el centro del baño
    const X = haciaX ? b.min.x : b.max.x, Pp = new THREE.Vector3(2*X - P_ESP.x, P_ESP.y, P_ESP.z);
    const mascara = new THREE.Mesh(e.o.geometry, new THREE.MeshBasicMaterial({ colorWrite:false, depthWrite:false, stencilWrite:true, stencilRef:1, stencilFunc:THREE.AlwaysStencilFunc, stencilZPass:THREE.ReplaceStencilOp }));
    mascara.position.copy(e.o.position); mascara.quaternion.copy(e.o.quaternion); mascara.scale.copy(e.o.scale); mascara.renderOrder = 10; e.o.parent.add(mascara);
    const st = { stencilWrite:true, stencilRef:1, stencilFunc:THREE.EqualStencilFunc, stencilFail:THREE.KeepStencilOp, stencilZFail:THREE.KeepStencilOp, stencilZPass:THREE.KeepStencilOp, depthTest:false, depthWrite:false, transparent:true, toneMapped:false };
    const g = new THREE.Group(); g.position.copy(Pp);
    const nucleo = new THREE.Mesh(new THREE.OctahedronGeometry(7, 0), new THREE.MeshBasicMaterial(Object.assign({ color:'#ffd77a' }, st)));
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshBasicMaterial(Object.assign({ map:MARCA, side:THREE.DoubleSide }, st)));
    placa.position.y = 14;
    const h = halo(58, st); g.add(h, nucleo, placa); g.children.forEach(o => o.renderOrder = 11); scene.add(g);
    esp = { g, nucleo, placa, h, fin:0, mascara };
  }

  /* ── el calendario del despacho, con el Black Friday marcado ── */
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(30, 42), new THREE.MeshBasicMaterial({ color:'#ece7de', toneMapped:false, map:lienzo(300, 420, (x, w, h) => {
    x.fillStyle = '#fbf9f4'; x.fillRect(0, 0, w, h); x.fillStyle = '#b2613f'; x.fillRect(0, 0, w, 74);
    x.fillStyle = '#fff'; x.font = '700 30px Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('NOVIEMBRE', w/2, 30); x.font = '600 18px system-ui, sans-serif'; x.fillText('2026', w/2, 56);
    x.fillStyle = '#6f6558'; x.font = '700 15px system-ui, sans-serif'; 'LMXJVSD'.split('').forEach((c, i) => x.fillText(c, 26 + i*41.3, 96));
    for(let d = 1; d <= 30; d++){ const k = d + 5, c = k % 7, f = Math.floor(k/7), cx = 26 + c*41.3, cy = 130 + f*52;     // el 1 de noviembre de 2026 es domingo
      x.fillStyle = c === 6 ? '#b2613f' : '#2b2520'; x.font = '600 19px system-ui, sans-serif'; x.fillText(d, cx, cy);
      if(d === 27){ x.strokeStyle = '#d0342c'; x.lineWidth = 4; x.beginPath(); x.ellipse(cx, cy, 19, 16, -.2, 0, 2*Math.PI); x.stroke();
        x.fillStyle = '#d0342c'; x.font = '800 10px system-ui, sans-serif'; x.fillText('BLACK', cx, cy + 25); x.fillText('FRIDAY', cx, cy + 36); } }
  }) }));
  cal.position.set(600, 158, .7); scene.add(cal);

  /* ── el retrato de la biblioteca: un señor con bigote cuyos ojos siguen a la cámara ── */
  const retrato = new THREE.Group(); retrato.position.set(999.2, 300 + 168, 382); retrato.rotation.y = -Math.PI/2;
  const lienzoR = new THREE.Mesh(new THREE.PlaneGeometry(46, 60), new THREE.MeshBasicMaterial({ color:'#e2dbcf', toneMapped:false, map:lienzo(460, 600, (x, w, h) => {
    const g = x.createRadialGradient(w/2, 230, 40, w/2, 300, 380); g.addColorStop(0, '#5d6b4f'); g.addColorStop(1, '#232a1e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1d1b22'; x.beginPath(); x.moveTo(40, h); x.quadraticCurveTo(70, 420, 230, 410); x.quadraticCurveTo(390, 420, 420, h); x.fill();          // chaqueta
    x.fillStyle = '#efe9dc'; x.beginPath(); x.moveTo(180, 415); x.lineTo(230, 520); x.lineTo(280, 415); x.fill();                                             // camisa
    x.fillStyle = '#b2613f'; x.beginPath(); x.moveTo(200, 430); x.lineTo(230, 448); x.lineTo(200, 466); x.fill(); x.beginPath(); x.moveTo(260, 430); x.lineTo(230, 448); x.lineTo(260, 466); x.fill();  // pajarita
    x.fillStyle = '#e1b48c'; x.fillRect(205, 360, 50, 60);                                                                                                    // cuello
    x.beginPath(); x.ellipse(230, 270, 98, 122, 0, 0, 2*Math.PI); x.fill();                                                                                    // cara
    x.beginPath(); x.ellipse(132, 278, 16, 26, 0, 0, 2*Math.PI); x.ellipse(328, 278, 16, 26, 0, 0, 2*Math.PI); x.fill();                                       // orejas
    x.fillStyle = '#4a3528'; x.beginPath(); x.ellipse(230, 172, 96, 44, 0, Math.PI, 2*Math.PI); x.fill(); x.fillRect(134, 168, 192, 14);                        // pelo
    x.fillStyle = '#fff'; x.beginPath(); x.ellipse(180, 252, 25, 17, 0, 0, 2*Math.PI); x.ellipse(280, 252, 25, 17, 0, 0, 2*Math.PI); x.fill();               // ojos (las pupilas van aparte)
    x.strokeStyle = '#4a3528'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(152, 222); x.quadraticCurveTo(180, 210, 208, 222); x.moveTo(252, 222); x.quadraticCurveTo(280, 210, 308, 222); x.stroke();   // cejas
    x.strokeStyle = '#c4946c'; x.lineWidth = 4; x.beginPath(); x.moveTo(230, 262); x.quadraticCurveTo(220, 300, 236, 312); x.stroke();                       // nariz
    x.fillStyle = '#3b2a20'; x.beginPath(); x.moveTo(230, 322); x.bezierCurveTo(200, 312, 160, 316, 132, 344); x.bezierCurveTo(170, 336, 200, 342, 230, 334);
    x.bezierCurveTo(260, 342, 290, 336, 328, 344); x.bezierCurveTo(300, 316, 260, 312, 230, 322); x.fill();                                                   // bigote
    x.strokeStyle = '#a77b52'; x.lineWidth = 3; x.beginPath(); x.arc(280, 252, 31, 0, 2*Math.PI); x.stroke(); x.beginPath(); x.moveTo(306, 268); x.lineTo(318, 340); x.stroke();   // monóculo
  }) }));
  retrato.add(lienzoR);
  { const M = new THREE.MeshStandardMaterial({ color:'#b98f55', metalness:.6, roughness:.38 });
    [[52, 4, 0, 32], [52, 4, 0, -32], [4, 60, 24, 0], [4, 60, -24, 0]].forEach(([w, h, x, y]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 2.4), M); b.position.set(x, y, .6); retrato.add(b); }); }
  const pupilas = [[-5, 4.8], [5, 4.8]].map(([x, y]) => { const p = new THREE.Mesh(new THREE.CircleGeometry(1.15, 20), new THREE.MeshBasicMaterial({ color:'#1d1712', toneMapped:false })); p.position.set(x, y, .15); p.userData.o = [x, y]; retrato.add(p); return p; });
  scene.add(retrato);
  let guino = 0;

  /* ── cajas invisibles sobre muebles horneados (coordenadas de la casa, cm) ── */
  const CAJAS_HV = [
    ['nevera', new THREE.Box3(new THREE.Vector3(364, 0, 634), new THREE.Vector3(436, 190, 708))],
    ['retrete', new THREE.Box3(new THREE.Vector3(1238, 0, 856), new THREE.Vector3(1300, 116, 904))],
    ['sofa', new THREE.Box3(new THREE.Vector3(950, 0, 712), new THREE.Vector3(1052, 86, 948))],
  ];
  let tiradas = 0, sofaT = -1, viajes = 0, saltosArriba = 0, ultSalto = 0;

  /* ── la nevera (12-nov, Marc: «tiene que abrirse y verse el táper dentro»). La puerta de arriba viene aparte en el glb
     (materiales nevera_puerta*) y se hornea cerrada con la luz de dentro encendida. Aquí se cuelga de su bisagra, con
     los imanes que lleva pegados, y gira. Dentro, en la balda del medio, el táper de tapa azul con su pósit. ── */
  const NEV = { x0:364, x1:436, y0:69, y1:188, zf:703.7, bisagra:new THREE.Vector3(434.7, 0, 703.7), max:1.5 };
  let nev = null;
  function montaNevera(){
    const piv = new THREE.Group(); piv.position.copy(NEV.bisagra); scene.add(piv); scene.updateMatrixWorld(true);
    const van = [], b = new THREE.Box3(), c = new THREE.Vector3();
    scene.traverse(o => { if(!o.isMesh || o.parent === piv) return; const n = o.userData.mat || '';
      if(/^nevera_puerta/.test(n)) van.push(o);
      else if(/^(foto_|iman_placa)/.test(n)){ b.setFromObject(o); b.getCenter(c);
        if(c.x > NEV.x0 && c.x < NEV.x1 && c.y > NEV.y0 && c.y < NEV.y1 && c.z > NEV.zf - 1 && c.z < NEV.zf + 3) van.push(o); } });
    if(!van.some(o => o.userData.mat === 'nevera_puerta')){ scene.remove(piv); return; }     // un glb de antes, sin puerta suelta
    van.forEach(o => { piv.attach(o); if(/^nevera_puerta_(forro|balda|junta|botella|leche|zumo|salsa|huevo)/.test(o.userData.mat) && o.material.uniforms) o.material.uniforms.frio.value = 1; });
    /* el pósit, en la cara de delante del táper */
    const nota = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ color:'#f1ead2', toneMapped:false, map:lienzo(360, 360, (x, w, h) => {
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffe680'); g.addColorStop(1, '#f7d64f'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(0,0,0,.06)'; x.fillRect(0, 0, w, 34);
      x.fillStyle = '#1f2a44'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const mano = '"Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive';
      x.font = `700 70px ${mano}`; x.fillText('NO ES', w/2, 120); x.fillText('TUYO.', w/2, 200);
      x.strokeStyle = '#1f2a44'; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(80, 246); x.quadraticCurveTo(180, 236, 285, 250); x.stroke();
      x.font = `400 30px ${mano}`; x.fillText('Firmado:', w/2, 288); x.fillText('tu compañero de piso', w/2, 324);
    }) }));
    nota.position.set(397, 139.6, 681.4); nota.rotation.z = .06; scene.add(nota);
    const cocina = RAICES.cocina; if(cocina){ cocina.attach(piv); cocina.attach(nota); }   // se esconden con la cocina
    nev = { piv, a:0, meta:0, visto:false, caja:new THREE.Box3() };
  }
  function abreNevera(abre = !(nev && nev.meta)){
    if(!nev){ encontrado('nevera', { emoji:'🥡' }); return; }
    if(abre === !!nev.meta) return; nev.meta = abre ? 1 : 0; pinta = true;
    if(abre){ ruido(.32, 2400, 500, .22); ruido(1.6, 220, 160, .05, .25);                 // se despega la goma y zumba
      if(!nev.visto){ nev.visto = true; setTimeout(() => encontrado('nevera', { emoji:'🥡' }), 900); } }
    else { ruido(.18, 900, 140, .3, .32); setTimeout(() => golpe(0, .35), 320); }
  }
  const _p = new THREE.Vector3(), _c = new THREE.Vector3();
  /* 13-nov: lo que ven los módulos de casa2-huevos/ (ver blender/momenturies-rooms/GUIA_AGENTES_13nov.md) */
  const EXT = { toque:[], tick:[], reinicia:[] }, MODULOS = ['vater', 'tele', 'botella', 'patito', 'gaviota'];
  const API = { THREE, scene, camera, pos, RAICES, salas, salaEn, datos, VER, MARCA, encontrado, ya, aviso, ruido, golpe, ac, lienzo, halo, miles,
    get ISLA(){ return ISLA; }, get PISO(){ return PISO; }, pinta(){ pinta = true; },
    toque(f){ EXT.toque.push(f); }, tick(f){ EXT.tick.push(f); }, reinicia(f){ EXT.reinicia.push(f); },
    /* 14-nov: grupo dentro de la habitación que deshace su transformación (los glb vienen en metros, escala 100): lo que se mete aquí va en cm de mundo y se oculta con la sala */
    mundo(z){ const r = RAICES[z]; if(!r) return null; if(!r.userData.mundo){ const m = new THREE.Group(); r.updateMatrixWorld(true); m.applyMatrix4(r.matrixWorld.clone().invert()); r.add(m); r.userData.mundo = m; } return r.userData.mundo; },
    quitaCaja(id){ const i = CAJAS_HV.findIndex(c => c[0] === id); if(i >= 0) CAJAS_HV.splice(i, 1); } };
  const accion = {
    nevera(){ abreNevera(); },
    retrete(){ tiradas++; ruido(2.2, 2600, 260, .5); ruido(1.2, 700, 120, .25, .9);
      encontrado('retrete', { emoji:'🚽', x:`Momento inolvidable n.º ${miles(4381 + tiradas)}` }); },
    sofa(){ sofaT = 0; ruido(.35, 500, 90, .35); encontrado('sofa', { emoji:'🛋️' }); },
    calendario(){ encontrado('calendario', { emoji:'📅', link:['Ver la tienda', 'index.html'] }); },
    retrato(){ guino = performance.now(); encontrado('retrato', { emoji:'🧐' }); },
  };

  return {
    dy:0,
    /* 13-nov: cada huevo nuevo vive en su archivo (casa2-huevos/<nombre>.js, export default function(api){…}) */
    monta(){ montaEspejo(); montaNevera();
      return Promise.all(MODULOS.map(n => import(`./casa2-huevos/${n}.js?v=${VER}`).then(m => m.default(API)).catch(e => console.warn('huevo', n, e)))); },
    get nevAbierta(){ return !!(nev && nev.a > .05); },
    piso(){ if(++viajes === 5) encontrado('escalera', { emoji:'🥵' }); },
    salto(){
      if(PISO !== 1 || enEscalera(pos.x, pos.z)) return;
      const n = performance.now(); if(n - ultSalto > 4000) saltosArriba = 0; ultSalto = n;
      if(++saltosArriba === 10){ [0, .32, .64].forEach(t0 => golpe(t0)); setTimeout(() => encontrado('vecino', { emoji:'🔨' }), 900); }
    },
    /* un toque: lo más cercano de lo que tenga easter egg, si está a mano y no hay pared por medio */
    toque(ray){
      let mejor = null; const prueba = (d, f, p, lejos) => { if(d < (lejos || 520) && (!mejor || d < mejor.d) && (lejos || visible(p))) mejor = { d, f }; };
      EXT.toque.forEach(fn => { const r = fn(ray); if(r) prueba(r.d, r.f, r.p, r.lejos); });
      IMANES.forEach(q => { if(q.g.visible && !q.fin && ray.ray.distanceSqToPoint(q.p) < 15*15) prueba(camera.position.distanceTo(q.p), () => coge(q), q.p); });
      CAJAS_HV.forEach(([id, b]) => { if(ray.ray.intersectBox(b, _p)) prueba(_p.distanceTo(camera.position), accion[id], _p.clone()); });
      if(nev && nev.meta){ nev.caja.setFromObject(nev.piv); if(ray.ray.intersectBox(nev.caja, _p)) prueba(_p.distanceTo(camera.position), accion.nevera, _p.clone()); }
      [[cal, 'calendario'], [lienzoR, 'retrato']].forEach(([o, id]) => { const h = ray.intersectObject(o, false)[0]; if(h) prueba(h.distance, accion[id], h.point); });
      if(!mejor) return false;
      fueraAyuda(); mejor.f(); return true;
    },
    tick(dt, t){
      const cam = camera.position;
      IMANES.forEach(q => { if(!q.g.visible) return;
        if(q.fin){ const k = Math.min(1, (performance.now() - q.fin)/600); q.g.scale.setScalar(1 + k*1.5); q.s.material.opacity = 1 - k; q.g.children[0].material.opacity = 1 - k; if(k >= 1) q.g.visible = false; return; }
        q.s.material.opacity = .65 + .3*Math.sin(t*3.2 + q.i*1.7); q.s.scale.setScalar(20 + 5*Math.sin(t*2.1 + q.i));
        if(Math.hypot(cam.x - q.p.x, cam.z - q.p.z) < 75 && Math.abs(cam.y - q.p.y) < 40) coge(q); });
      if(esp && esp.g.visible){
        esp.nucleo.rotation.y = t*1.6; esp.placa.rotation.y = -t*1.1; esp.g.position.y = P_ESP.y + Math.sin(t*1.8)*3; esp.h.scale.setScalar(52 + 8*Math.sin(t*2.6));
        if(esp.fin){ const k = Math.min(1, (performance.now() - esp.fin)/700); esp.g.scale.setScalar(1 - k); if(k >= 1){ esp.g.visible = false; esp.mascara.visible = false; } }
        else if(PISO === 0 && Math.hypot(pos.x - P_ESP.x, pos.z - P_ESP.z) < 38){ esp.fin = performance.now(); encontrado('espejo', { emoji:'🪞' }); }
      }
      /* las pupilas del retrato miran a la cámara */
      if(PISO === 1){ _c.copy(cam); retrato.worldToLocal(_c); const z = Math.max(20, _c.z);
        pupilas.forEach(p => { const [x0, y0] = p.userData.o, dx = Math.max(-1, Math.min(1, (_c.x - x0)/z*1.6)), dy = Math.max(-1, Math.min(1, (_c.y - y0)/z*1.6));
          p.position.set(x0 + dx*1.25, y0 + dy*.55, .15); });
        const g = guino && performance.now() - guino < 500; pupilas[1].scale.y = g ? .12 : 1; }
      /* la puerta de la nevera: va hacia abierta/cerrada con un poco de inercia; si te alejas, se cierra sola */
      if(nev){
        if(nev.meta && (PISO !== 0 || Math.hypot(pos.x - 400, pos.z - 720) > 340)) abreNevera(false);
        NEVLUZ.value = Math.min(1, Math.max(0, nev.a*1.6));
        const d = nev.meta - nev.a;
        if(Math.abs(d) > .0005){ nev.a += d*(1 - Math.exp(-dt*(nev.meta ? 5.5 : 7))); const k = nev.a;
          nev.piv.rotation.y = NEV.max*(k + (nev.meta ? .04*Math.sin(k*Math.PI) : 0)); pinta = true; }
        else if(nev.a !== nev.meta){ nev.a = nev.meta; nev.piv.rotation.y = NEV.max*nev.a; pinta = true; }
      }
      /* el sofá: se hunde y vuelve */
      if(sofaT >= 0){ sofaT += dt; this.dy = -30*Math.sin(Math.min(1, sofaT/1.7)*Math.PI); if(sofaT > 1.7){ sofaT = -1; this.dy = 0; } }
      /* los huevos de los módulos (casa2-huevos/*.js) */
      EXT.tick.forEach(f => { try{ f(dt, t); }catch(e){ console.warn(e); } });
    },
    get hechos(){ return hechos.slice(); }, celebra(i = 0){ celebra(PREMIOS[i]); }, panel(){ abrePanel(); }, reinicia(){ EXT.reinicia.forEach(f => f()); if(nev){ nev.meta = nev.a = 0; NEVLUZ.value = 0; nev.visto = false; nev.piv.rotation.y = 0; } fiesta.classList.remove('ver'); panel.classList.remove('ver'); hechos = []; guarda(); cuenta(); viajes = 0; saltosArriba = 0;
      IMANES.forEach(q => { q.fin = 0; q.g.visible = true; q.g.scale.setScalar(1); q.g.children[0].material.opacity = 1; });
      if(esp){ esp.fin = 0; esp.g.visible = true; esp.g.scale.setScalar(1); esp.mascara.visible = true; } else montaEspejo(); },
  };
})();

/* para las capturas y las pruebas */
window.CASA = { pos, datos, toque, get huevos(){ return HV; }, get grupos(){ return grupos; }, enfoca, scene, camera, mira(x, y, z){ const dx = x-pos.x, dz = z-pos.z; yaw = Math.atan2(-dx, -dz); pitch = Math.atan2(y-OJO-sueloEn(pos.x, pos.z), Math.hypot(dx, dz)); pinta = true; }, ir(x, z, y, p){ pos.x = x; pos.z = z; yaw = y; pitch = p || 0; mover = null; vuelo = null; pinta = true; }, get listo(){ return hechos === ZONAS.length; }, get caja(){ return caja; }, resuelve, get piso(){ return PISO; }, set piso(p){ ponPiso(p); pinta = true; }, get salas(){ return salas; }, renderer };

requestAnimationFrame(bucle);
await carga('recibidor');
await Promise.all(ZONAS.slice(1).map(carga));
hazGrupos();
await HV.monta();
const espera = () => { let n = 0; datos.placas.forEach(p => { if(encuadra(p)) n++; }); pinta = true; if(n < datos.placas.length) setTimeout(espera, 300); };
espera();
$('#carga').classList.add('fuera');
setTimeout(fueraAyuda, 9000);
})().catch(e => { document.querySelector('#carga p').textContent = 'No se ha podido abrir la casa. Recarga la página.'; console.error(e); });
