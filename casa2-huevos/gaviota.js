/* casa2-huevos/gaviota.js · huevo 'gaviota': una gaviota en el peto de la terraza, mirando al mar.
   Gira la cabeza de vez en cuando. Si te acercas (o la tocas) grita, abre las alas y se va volando hacia el mar.
   Vuelve a los 40 s si no estás cerca. Ver GUIA_AGENTES_13nov.md, Agente C. */
export default function(api){
  const { THREE, scene, camera, pos } = api;
  const raiz = api.RAICES && api.RAICES.terraza; if(!raiz) return;
  const P = new THREE.Vector3(760, 103.4, 1296);

  const blanco = new THREE.MeshStandardMaterial({ color:'#f4f4f0', roughness:.7 });
  const gris = new THREE.MeshStandardMaterial({ color:'#8d96a0', roughness:.7, side:THREE.DoubleSide });
  const punta = new THREE.MeshStandardMaterial({ color:'#22262b', roughness:.7, side:THREE.DoubleSide });
  const amarillo = new THREE.MeshStandardMaterial({ color:'#f2c230', roughness:.5 });
  const naranja = new THREE.MeshStandardMaterial({ color:'#f08a3a', roughness:.6 });
  const negro = new THREE.MeshStandardMaterial({ color:'#111', roughness:.3 });

  /* modelo mirando a +z (al mar); 1 unidad = 1 cm */
  const g = new THREE.Group(); g.position.copy(P);
  const ave = new THREE.Group(); g.add(ave);
  const cuerpo = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 9), blanco);
  cuerpo.scale.set(.85, .8, 1.75); cuerpo.position.y = 14; cuerpo.rotation.x = -.18; ave.add(cuerpo);
  const cola = new THREE.Mesh(new THREE.ConeGeometry(4, 9, 6), gris);
  cola.position.set(0, 13, -13); cola.rotation.x = -Math.PI/2 - .25; cola.scale.x = 1.4; ave.add(cola);
  const cabeza = new THREE.Group(); cabeza.position.set(0, 22, 9); ave.add(cabeza);
  cabeza.add(new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 9), blanco));
  const pico = new THREE.Mesh(new THREE.ConeGeometry(1.1, 6, 6), amarillo);
  pico.rotation.x = Math.PI/2; pico.position.set(0, -.6, 6); cabeza.add(pico);
  const mancha = new THREE.Mesh(new THREE.SphereGeometry(.5, 6, 4), new THREE.MeshStandardMaterial({ color:'#c0392b' }));
  mancha.position.set(0, -1.1, 7.2); cabeza.add(mancha);
  [-1, 1].forEach(s => { const o = new THREE.Mesh(new THREE.SphereGeometry(.65, 8, 6), negro); o.position.set(s*3.2, 1, 2); cabeza.add(o); });
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 8, 5), naranja); p.position.set(s*2.5, 4, 1); ave.add(p);
    const pie = new THREE.Mesh(new THREE.BoxGeometry(2.6, .5, 3.4), naranja); pie.position.set(s*2.5, .25, 2); ave.add(pie); });
  /* alas: un plano gris con la punta negra, pivotando en el hombro */
  const alas = [-1, 1].map(s => {
    const piv = new THREE.Group(); piv.position.set(s*5, 17, 1); ave.add(piv);
    const a = new THREE.Mesh(new THREE.BoxGeometry(22, .6, 11), gris); a.position.x = s*11; piv.add(a);
    const pt = new THREE.Mesh(new THREE.BoxGeometry(10, .5, 7), punta); pt.position.set(s*26, 0, -1.5); piv.add(pt);
    piv.userData.s = s; return piv; });
  const pliega = () => alas.forEach(p => { p.rotation.set(0, p.userData.s*1.35, p.userData.s*-.25); });  // plegadas a lo largo del cuerpo
  pliega();
  api.mundo('terraza').add(g);
  const casa = { pos:g.position.clone(), rot:g.rotation.y };

  function grito(){
    const a = api.ac(); if(!a) return;
    [0, .3, .52].forEach((t0, i) => {
      const T = a.currentTime + t0, o = a.createOscillator(), f = a.createBiquadFilter(), v = a.createGain(), d = i ? .2 : .32;
      o.type = 'sawtooth'; o.frequency.setValueAtTime(1500 - i*120, T); o.frequency.linearRampToValueAtTime(1900 - i*150, T + d*.3); o.frequency.exponentialRampToValueAtTime(900, T + d);
      f.type = 'bandpass'; f.frequency.value = 2100; f.Q.value = 1.6;
      v.gain.setValueAtTime(0, T); v.gain.linearRampToValueAtTime(.2, T + .03); v.gain.exponentialRampToValueAtTime(.001, T + d);
      o.connect(f).connect(v).connect(a.destination); o.start(T); o.stop(T + d + .05);
    });
    api.ruido(.5, 3000, 900, .06, .05);   // aleteo
  }

  let vuela = -1, fuera = -1, giro = 0, giroT = 2;
  function espanta(){ if(vuela >= 0 || fuera >= 0) return; vuela = 0; grito(); setTimeout(() => api.encontrado('gaviota', { emoji:'🐦' }), 800); api.pinta(); }

  const caja = new THREE.Box3(), _p = new THREE.Vector3();
  api.toque(ray => {
    if(vuela >= 0 || fuera >= 0 || !raiz.visible) return null;
    caja.setFromObject(ave).expandByScalar(6);
    if(!ray.ray.intersectBox(caja, _p)) return null;
    return { d:_p.distanceTo(camera.position), f:espanta, p:_p.clone(), lejos:900 };
  });

  const cerca = () => api.PISO === 0 && Math.hypot(pos.x - casa.pos.x, pos.z - casa.pos.z) < 170;
  api.tick((dt, t) => {
    dt = Math.min(dt, .1);
    if(fuera >= 0){   // se fue: vuelve a los 40 s si no estás cerca
      fuera += dt; if(fuera > 40 && !cerca()){ fuera = -1; g.visible = true; g.position.copy(casa.pos); g.rotation.set(0, casa.rot, 0); ave.rotation.set(0, 0, 0); pliega(); api.pinta(); }
      return;
    }
    if(!raiz.visible) return;
    if(vuela < 0){
      if(cerca()){ espanta(); return; }
      /* gira la cabeza de vez en cuando */
      giroT -= dt; if(giroT <= 0){ giro = (Math.random() - .5)*1.6; giroT = 1.5 + Math.random()*3; }
      const d = giro - cabeza.rotation.y;
      if(Math.abs(d) > .01 && camera.position.distanceTo(P) < 1500){ cabeza.rotation.y += d*Math.min(1, dt*8); api.pinta(); }
      return;
    }
    vuela += dt; const k = vuela;
    alas.forEach(p => { const s = p.userData.s, ab = Math.min(1, k/.25);
      p.rotation.y = s*1.35*(1 - ab); p.rotation.z = s*(-.25*(1 - ab) + ab*Math.sin(k*16)*.7); });
    ave.rotation.x = -Math.min(.35, k*.8);
    /* sube y se aleja hacia el mar (+z en el mundo); el grupo vive dentro de la terraza, así que movemos en el mundo y volvemos a local */
    const w = new THREE.Vector3(P.x + Math.sin(k*1.3)*40, P.y + 40*k + 25*k*k, P.z + 140*k + 90*k*k);
    g.parent.worldToLocal(w); g.position.copy(w);
    if(k > 3){ vuela = -1; fuera = 0; g.visible = false; }
    api.pinta();
  });

  api.reinicia(() => { vuela = fuera = -1; g.visible = true; g.position.copy(casa.pos); g.rotation.set(0, casa.rot, 0); ave.rotation.set(0, 0, 0); pliega(); });
}
