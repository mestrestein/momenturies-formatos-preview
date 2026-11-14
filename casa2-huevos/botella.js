/* Huevo 'botella': un mensaje en una botella, medio enterrado en la arena de la playa sur.
   Se ve desde la terraza (~600 cm) gracias a un halo que late hasta que la encuentras. Va en `scene` (es de fuera). */
export default function(api){
  const { THREE, scene, camera } = api;
  const I = api.ISLA; if(!I) return;

  const A = Math.PI/2 + .12, P = I.punto(A, 250);
  const R = 6.5, L = 45;                                   // radio del cuerpo y largo (un poco grande para que se vea)

  /* tumbada a lo largo de la orilla (tangente al borde), un poco girada hacia el mar */
  const g = new THREE.Group(); g.position.copy(P); g.rotation.y = Math.atan2(-Math.cos(A), -Math.sin(A)) + .35; scene.add(g);
  const roca = new THREE.Group(); roca.position.y = R*.42; g.add(roca);       // medio enterrada: asoma algo menos de la mitad
  const bot = new THREE.Group(); bot.rotation.z = -Math.PI/2 + .08; bot.position.x = -L/2; roca.add(bot);   // el eje +y del torno pasa a +x; el cuello sube un pelín

  /* el vidrio: un torno de 14 lados (culo, cuerpo, hombro, cuello, gollete) */
  const perfil = [[0, 0], [4.6, .15], [6.1, .8], [R, 2], [R, 25.5], [6.1, 28.4], [4.6, 31.2], [2.9, 33.6], [2.15, 35.5], [2.05, 41.6], [2.6, 42], [2.6, 43.6], [2.1, 44]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const vidrio = new THREE.Mesh(new THREE.LatheGeometry(perfil, 14), new THREE.MeshStandardMaterial({
    color:'#2f8a58', emissive:'#0a2416', roughness:.12, metalness:.05, transparent:true, opacity:.55, depthWrite:false }));
  vidrio.renderOrder = 2; bot.add(vidrio);

  /* dentro: el papel enrollado con su cinta roja */
  const papel = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 17, 10), new THREE.MeshStandardMaterial({ color:'#efe3c4', roughness:.92 }));
  papel.position.set(.6, 14, 0); papel.rotation.z = .05; bot.add(papel);
  const cinta = new THREE.Mesh(new THREE.CylinderGeometry(3.62, 3.62, 1.3, 10), new THREE.MeshStandardMaterial({ color:'#b2392f', roughness:.6 }));
  cinta.position.copy(papel.position); cinta.rotation.z = papel.rotation.z; bot.add(cinta);

  /* el corcho, asomando del gollete */
  const corcho = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 1.85, 4.2, 8), new THREE.MeshStandardMaterial({ color:'#b88a56', roughness:.95 }));
  corcho.position.y = 43.4; bot.add(corcho);

  /* la arena que la cubre a medias (dos montoncitos pegados al cuerpo) */
  const arena = new THREE.MeshStandardMaterial({ color:'#e2cea4', roughness:1, flatShading:true });
  [[-6, 22, 12, 4.2, 0], [10, 12, 9, 3.2, .4]].forEach(([x, sx, sz, sy, ry]) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 9, 5), arena); m.scale.set(sx, sy, sz); m.position.set(x, .4, 0); m.rotation.y = ry; g.add(m); });

  /* el halo que late hasta que la encuentras */
  const halo = api.halo(80); halo.position.y = R + 8; g.add(halo);
  const C = new THREE.Vector3(); g.updateMatrixWorld(true); C.copy(P); C.y += R;

  let fin = api.ya('botella') ? -1 : 0, meneo = -1, ultPinta = 0;
  halo.visible = fin === 0;

  /* el sonido: el vidrio que tintinea y la arena que se mueve */
  function tintineo(){
    const a = api.ac(); if(!a) return;
    [[2350, 0, .16], [3520, .012, .09], [5140, .02, .05], [2680, .19, .1], [3990, .2, .06]].forEach(([f, t0, v]) => {
      const T = a.currentTime + t0, o = a.createOscillator(), gg = a.createGain(); o.type = 'sine';
      o.frequency.setValueAtTime(f, T); o.frequency.exponentialRampToValueAtTime(f*.985, T + .9);
      gg.gain.setValueAtTime(.0001, T); gg.gain.exponentialRampToValueAtTime(v, T + .004); gg.gain.exponentialRampToValueAtTime(.0001, T + .9);
      o.connect(gg).connect(a.destination); o.start(T); o.stop(T + .95); });
    api.ruido(.35, 1800, 400, .06, 0);
  }

  function coge(){
    meneo = 0; tintineo(); api.pinta();
    if(fin === 0) fin = performance.now();
    api.encontrado('botella', { emoji:'🍾' });
  }

  api.toque(ray => {
    if(ray.ray.distanceSqToPoint(C) > 35*35) return null;
    return { d:camera.position.distanceTo(C), f:coge, p:C.clone(), lejos:1200 };
  });

  api.tick((dt, t) => {
    let mueve = false;
    if(fin === 0){
      /* late; solo se repinta (a ~20 fps) si estás lo bastante cerca para verla */
      halo.material.opacity = .62 + .3*Math.sin(t*2.6); halo.scale.setScalar(72 + 12*Math.sin(t*1.9));
      if(camera.position.distanceTo(C) < 1300 && t - ultPinta > .05){ ultPinta = t; mueve = true; }
    } else if(fin > 0){
      const k = Math.min(1, (performance.now() - fin)/900);
      halo.material.opacity = .9*(1 - k); halo.scale.setScalar(80 + 70*k); mueve = true;
      if(k >= 1){ halo.visible = false; fin = -1; }
    }
    /* al tocarla se mece en la arena y se asienta */
    if(meneo >= 0){ meneo += dt; const k = meneo;
      roca.rotation.x = .22*Math.exp(-k*3.2)*Math.sin(k*13); roca.position.y = R*.42 + 1.6*Math.max(0, Math.sin(Math.min(1, k/.28)*Math.PI));
      mueve = true; if(k > 1.6){ meneo = -1; roca.rotation.x = 0; roca.position.y = R*.42; } }
    if(mueve) api.pinta();
  });

  api.reinicia(() => { fin = 0; meneo = -1; halo.visible = true; halo.material.opacity = .8; halo.scale.setScalar(80); roca.rotation.x = 0; roca.position.y = R*.42; api.pinta(); });
}
