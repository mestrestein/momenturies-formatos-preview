/* La casa para caminar. La geometría y la luz salen de Blender (blender/momenturies-rooms/casa.py); aquí solo se pinta:
   color = textura × luz horneada + reflejo, igual que las habitaciones del editor. Unidades: cm. */
(async function(){
const VER = window.CASA_V || '5';
const ZONAS = ['pasillo', 'salon', 'cocina', 'dormitorio', 'despacho', 'terraza'];
const NOMBRES = { pasillo:'Recibidor', salon:'Salón', cocina:'Cocina', dormitorio:'Dormitorio', despacho:'Despacho', terraza:'Terraza' };
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
function bakedTexture(url, srgb = true){
  if(texCache[url]) return texCache[url];
  const t = texLoader.load(url, () => { pinta = true; });
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
  uniform sampler2D map, lm, env; uniform vec3 color; uniform vec4 crop; uniform float rough, metal, spec, alpha, useMap, useLm, mapK, viva;
  varying vec2 vU0, vU1; varying vec3 vN, vP;
  float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec3 a = color; if(useMap > .5) a *= texture2D(map, vU0 * crop.xy + crop.zw).rgb * mapK;
    vec3 L = useLm > .5 ? texture2D(lm, vU1).rgb * 4.0 : vec3(1.0);
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
const lmTex = {};
function material(m, zona, g, placas){
  const u = m.userData || {}, c = u.c || [1, 1, 1], hasLm = g !== 'glass', a = u.alpha == null ? 1 : u.alpha;
  const foto = /^foto_(\d+)/.exec(m.name || ''), p = foto && placas[+foto[1]];
  let map = u.map ? bakedTexture('rooms/tex/' + u.map + '.webp?v=' + VER) : null, crop = new THREE.Vector4(1, 1, 0, 0);
  if(p){ map = bakedTexture(p.foto + '?v=' + VER); map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping; }
  const un = {
    map:{ value:map }, useMap:{ value:map ? 1 : 0 }, mapK:{ value:p ? 1 : 2 }, viva:{ value:p && p.set === 'iman' ? 1 : 0 }, crop:{ value:crop },
    lm:{ value:hasLm ? bakedTexture(`casa/${zona}/lm_${g}.webp?v=${VER}`) : null }, useLm:{ value:hasLm ? 1 : 0 },
    env:{ value:ENV }, color:{ value:new THREE.Color(c[0], c[1], c[2]) },
    rough:{ value:u.rough == null ? .6 : u.rough }, metal:{ value:u.metal || 0 }, spec:{ value:u.spec == null ? .5 : u.spec }, alpha:{ value:a }
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

const datos = await (await fetch('casa/casa.json?v=' + VER)).json();
const caja = datos.solidos, salas = datos.salas;

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

const loader = new window.GLTFLoader(), fotos = [];
let hechos = 0;
function carga(z){
  return new Promise((ok, mal) => loader.load(`casa/${z}/room.glb?v=${VER}`, g => {
    const root = g.scene; root.scale.setScalar(100);
    root.traverse(o => { if(!o.isMesh) return;
      const u = o.material.userData || {}, nm = o.material.name;
      o.material = material(o.material, z, u.lmg, datos.placas);
      const f = /^foto_(\d+)/.exec(nm || ''); if(f){ o.userData.placa = datos.placas[+f[1]]; fotos.push(o); }
    });
    scene.add(root); hechos++; $('#barra i').style.width = (hechos/ZONAS.length*100) + '%'; pinta = true; ok();
  }, undefined, mal));
}

/* ── andar ── */
const pos = { x:70, z:537 }; let yaw = -Math.PI/2, pitch = -.02;
const tecla = {}; let joy = { x:0, y:0 }, pinta = true, mover = null;
addEventListener('keydown', e => { tecla[e.code] = true; if(/^(Key[WASD]|Arrow)/.test(e.code)){ vuelo = null; if(enFoco) ficha(null); } if(/Arrow|Space/.test(e.code)) e.preventDefault(); fueraAyuda(); });
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
function salaEn(x, z){ return salas.find(s => x >= s.x0-6 && x <= s.x1+6 && z >= s.z0-6 && z <= s.z1+6); }

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
  const h = ray.intersectObjects(fotos, false)[0];
  /* el cuadro tiene que ser lo primero que se ve: si hay una pared antes, no cuenta */
  if(h && h.distance < 720 && visible(h.point)){ const g = grupos.find(q => q.mallas.includes(h.object)); if(g) return enfoca(g); }
  ficha(null);
  const d = ray.ray.direction;
  if(d.y < -.05){ const t = -camera.position.y/d.y; mover = { x:camera.position.x+d.x*t, z:camera.position.z+d.z*t, n:0 }; }
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
    const s = salaEn(g.c.x, g.c.z) || salas[0], hacia = new THREE.Vector3((s.x0+s.x1)/2 - g.c.x, 0, (s.z0+s.z1)/2 - g.c.z);
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
  const p1 = Math.max(-.9, Math.min(.6, Math.atan2(g.c.y - OJO, Math.hypot(dx, dz)) - Math.atan((1 - avail)*.85*tv)));
  vuelo = { t0:performance.now(), dur:1150, a:{ x:pos.x, z:pos.z, yaw, pitch }, b:{ x:fin.x, z:fin.z, yaw:y1, pitch:p1 }, g };
  document.body.classList.add('enfoque'); pinta = true;
}
function ficha(g){
  const f = $('#ficha');
  if(!g){ f.classList.remove('ver'); document.body.classList.remove('enfoque'); enFoco = null; pinta = true; return; }
  const q = queEs(g);
  f.querySelector('em').textContent = NOMBRES[(salaEn(g.c.x, g.c.z) || {}).id] || '';
  f.querySelector('b').textContent = q.tit; f.querySelector('span').textContent = q.txt; f.querySelector('a').href = q.url;
  f.classList.add('ver');
}
$('#ficha button').onclick = () => ficha(null);
$('#ficha .seguir').onclick = () => ficha(null);
/* coloca los botones encima de la imagen 3D: solo los de piezas que se ven (de frente, cerca y sin pared delante) */
const _v = new THREE.Vector3();
function ponPuntos(){
  if(!grupos.length) return;
  const W = innerWidth, H = innerHeight, cam = camera.position;
  grupos.forEach(g => {
    _v.copy(g.ancla).project(camera);
    const dist = Math.hypot(g.c.x - cam.x, g.c.z - cam.z);
    const deFrente = (cam.x - g.c.x)*g.normal.x + (cam.z - g.c.z)*g.normal.z > 20;
    const ve = !vuelo && g !== enFoco && _v.z < 1 && Math.abs(_v.x) < 1.05 && Math.abs(_v.y) < 1.05 && dist < 760 && deFrente && visible(g.c.clone().addScaledVector(g.normal, 4));
    g.el.classList.toggle('ver', ve);
    if(ve){ g.el.style.transform = `translate(${(_v.x+1)/2*W}px,${(1-_v.y)/2*H}px)`; g.el.classList.toggle('lejos', dist > 430); }
  });
}

/* plano pequeño: toca una habitación para ir */
const CENTRO = { pasillo:[120, 537, -Math.PI/2], salon:[640, 760, -2.1], cocina:[230, 800, 1.2], dormitorio:[300, 340, 1.4], despacho:[640, 360, -1.4], terraza:[800, 1120, 2.4] };
{ const W = 1100, Hh = 1320, NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `-20 -20 ${W+20} ${Hh+20}`);
  salas.forEach(s => { const r = document.createElementNS(NS, 'rect'); r.setAttribute('x', s.x0); r.setAttribute('y', s.z0); r.setAttribute('width', s.x1-s.x0); r.setAttribute('height', s.z1-s.z0);
    r.setAttribute('class', 'sala'); r.dataset.id = s.id; r.addEventListener('click', () => { const c = CENTRO[s.id]; pos.x = c[0]; pos.z = c[1]; yaw = c[2]; pitch = -.04; mover = null; pinta = true; });
    svg.append(r); });
  const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('r', 34); dot.setAttribute('fill', '#b2613f'); dot.style.pointerEvents = 'none'; svg.append(dot);
  $('#plano').append(svg); window._dot = dot; }

/* 10-nov: casa.html#salon (o #cocina, #dormitorio, #despacho, #recibidor, #terraza) entra directamente en esa habitación,
   con la vista de las fotos de la portada */
{ const ENTRA = { recibidor:[120, 537, -Math.PI/2], pasillo:[120, 537, -Math.PI/2], salon:[700, 900, -1.9], cocina:[330, 1000, -.25], dormitorio:[300, 340, 1.4], despacho:[640, 360, -1.4], terraza:[800, 1120, 2.4] };
  const c = ENTRA[decodeURIComponent(location.hash.slice(1)).toLowerCase()];
  if(c){ pos.x = c[0]; pos.z = c[1]; yaw = c[2]; pitch = -.03; } }

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
  if(m > .02){ const k = Math.min(1, m)/m*VEL*dt, s = Math.sin(yaw), c = Math.cos(yaw);
    pos.x += (-s*f + c*l)*k; pos.z += (-c*f - s*l)*k; resuelve(pos); balanceo += dt*9; pinta = true; }
  fuera(t/1000);
  if(vuelo){ const k = Math.min(1, (performance.now() - vuelo.t0)/vuelo.dur), e = k < .5 ? 4*k*k*k : 1 - Math.pow(-2*k + 2, 3)/2, A = vuelo.a, B = vuelo.b;
    pos.x = A.x + (B.x-A.x)*e; pos.z = A.z + (B.z-A.z)*e; yaw = A.yaw + (B.yaw-A.yaw)*e; pitch = A.pitch + (B.pitch-A.pitch)*e; pinta = true;
    if(k >= 1){ const g = vuelo.g; vuelo = null; ficha(g); } }
  if(!pinta) return; pinta = false;
  camera.position.set(pos.x, OJO + Math.sin(balanceo)*.9, pos.z);
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  window._dot.setAttribute('cx', pos.x); window._dot.setAttribute('cy', pos.z);
  const s = salaEn(pos.x, pos.z);
  if(s && s.id !== actual){ actual = s.id; $('#top').textContent = NOMBRES[s.id]; document.querySelectorAll('#plano rect').forEach(r => r.classList.toggle('on', r.dataset.id === s.id)); }
  renderer.render(scene, camera);
  ponPuntos();
}
/* ── Lo de fuera: flotadores con la marca en el mar, el logo hinchable, un globo y una avioneta con pancarta.
   No se hornea: luz propia (cielo + sol) y se mueve solo. Todo dentro del cilindro del cielo (r 5200 en 530,650). */
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
  return t => { anim.forEach(f => f(t)); pinta = true; };
})();

/* para las capturas y las pruebas */
window.CASA = { pos, datos, toque, get grupos(){ return grupos; }, enfoca, scene, camera, mira(x, y, z){ const dx = x-pos.x, dz = z-pos.z; yaw = Math.atan2(-dx, -dz); pitch = Math.atan2(y-OJO, Math.hypot(dx, dz)); pinta = true; }, ir(x, z, y, p){ pos.x = x; pos.z = z; yaw = y; pitch = p || 0; pinta = true; }, get listo(){ return hechos === ZONAS.length; }, caja, resuelve, get salas(){ return salas; }, renderer };

requestAnimationFrame(bucle);
await carga('pasillo');
await Promise.all(ZONAS.slice(1).map(carga));
hazGrupos();
const espera = () => { let n = 0; datos.placas.forEach(p => { if(encuadra(p)) n++; }); pinta = true; if(n < datos.placas.length) setTimeout(espera, 300); };
espera();
$('#carga').classList.add('fuera');
setTimeout(fueraAyuda, 9000);
})().catch(e => { document.querySelector('#carga p').textContent = 'No se ha podido abrir la casa. Recarga la página.'; console.error(e); });
