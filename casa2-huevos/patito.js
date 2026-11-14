/* casa2-huevos/patito.js · huevo 'patito': un patito de goma en la bañera del baño principal.
   Flota, se balancea y gira despacio. Al tocarlo: «cuac, cuac», se aplasta y vuelve. Ver GUIA_AGENTES_13nov.md, Agente C. */
export default function(api){
  const { THREE, scene, camera } = api;
  const raiz = api.RAICES && api.RAICES.bano_suite; if(!raiz) return;
  const P = new THREE.Vector3(1150, 358.3, 985);

  const amarillo = new THREE.MeshStandardMaterial({ color:'#ffd21f', roughness:.35 });
  const naranja = new THREE.MeshStandardMaterial({ color:'#ff8a1c', roughness:.4 });
  const negro = new THREE.MeshStandardMaterial({ color:'#111', roughness:.2 });

  const g = new THREE.Group(); g.position.copy(P);            // g: posición y giro; cuerpo: balanceo y aplastado
  const cuerpo = new THREE.Group(); g.add(cuerpo);
  const panza = new THREE.Mesh(new THREE.SphereGeometry(5, 14, 10), amarillo);
  panza.scale.set(1.25, .8, 1); panza.position.y = 2.2; cuerpo.add(panza);
  const cola = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.2, 8), amarillo);
  cola.position.set(-5.6, 4.4, 0); cola.rotation.z = .9; cuerpo.add(cola);
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(3.1, 12, 10), amarillo);
  cabeza.position.set(3, 7.6, 0); cuerpo.add(cabeza);
  const pico = new THREE.Mesh(new THREE.SphereGeometry(1.6, 10, 6), naranja);
  pico.scale.set(1.5, .45, 1.05); pico.position.set(6.1, 7.1, 0); cuerpo.add(pico);
  [-1, 1].forEach(s => { const o = new THREE.Mesh(new THREE.SphereGeometry(.55, 8, 6), negro); o.position.set(5.2, 8.6, s*1.6); cuerpo.add(o); });
  api.mundo('bano_suite').add(g);

  const caja = new THREE.Box3(), _p = new THREE.Vector3();
  let aplasta = -1, ang = Math.random()*6;

  function cuac(){
    const a = api.ac(); if(!a) return;
    [0, .2].forEach((t0, i) => {
      const T = a.currentTime + t0, o = a.createOscillator(), f = a.createBiquadFilter(), v = a.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(i ? 520 : 600, T); o.frequency.exponentialRampToValueAtTime(i ? 330 : 380, T + .16);
      f.type = 'bandpass'; f.frequency.value = 1300; f.Q.value = 2.5;
      v.gain.setValueAtTime(0, T); v.gain.linearRampToValueAtTime(.28, T + .02); v.gain.exponentialRampToValueAtTime(.001, T + .17);
      o.connect(f).connect(v).connect(a.destination); o.start(T); o.stop(T + .2);
    });
  }
  function pulsa(){ aplasta = 0; cuac(); api.encontrado('patito', { emoji:'🦆' }); api.pinta(); }

  api.toque(ray => {
    if(api.PISO !== 1 || !raiz.visible) return null;
    caja.setFromObject(g).expandByScalar(4);
    if(!ray.ray.intersectBox(caja, _p)) return null;
    return { d:_p.distanceTo(camera.position), f:pulsa, p:_p.clone() };
  });

  api.tick((dt, t) => {
    if(api.PISO !== 1 || !raiz.visible || camera.position.distanceTo(P) > 600) return;
    dt = Math.min(dt, .1); ang += dt*.25;
    g.rotation.y = ang;
    g.position.x = P.x + Math.sin(t*.4)*6; g.position.z = P.z + Math.sin(t*.53)*2.5;   // la bañera es estrecha: poco recorrido en z
    cuerpo.rotation.z = Math.sin(t*1.7)*.09; cuerpo.rotation.x = Math.sin(t*1.3 + 1)*.06;
    cuerpo.position.y = Math.sin(t*2.1)*.35;
    if(aplasta >= 0){ aplasta += dt; const k = Math.min(1, aplasta/.45), s = Math.sin(k*Math.PI);
      cuerpo.scale.set(1 + .25*s, 1 - .4*s, 1 + .25*s); if(k >= 1){ aplasta = -1; cuerpo.scale.set(1, 1, 1); } }
    api.pinta();
  });

  api.reinicia(() => { aplasta = -1; cuerpo.scale.set(1, 1, 1); });
}
