/* «Así se cuelga» (#asi-se-cuelga): la escena de colgado de Futsides, pasada a scroll y sobre una habitación real.
   Las tres piezas empiezan sueltas delante de la pared (como en el visor de Futsides), se montan una a una
   mientras bajas, el cuadro se engancha con su clic, se endereza, llegan cuatro más y la cámara se aleja hasta
   ver el salón entero. Todo depende de cuánto has bajado: si subes, se desmonta.
   Necesita three.js y pared3d.js cargados. Habitación: salon-luz (9,75 px/cm), origen = centro de la foto. */
(function(){
  const sec = document.getElementById('asi-se-cuelga'); if(!sec || !window.Pared3D) return;
  const stage = sec.querySelector('.cs-stage'), canvas = sec.querySelector('canvas');
  const capts = [...sec.querySelectorAll('.cs-cap')], dots = [...sec.querySelectorAll('.cs-dots i')];
  const tags = [...sec.querySelectorAll('.cs-tag')];

  const X = 22, Y = -14;                                   // donde va el cuadro principal (cm, sobre la luz de la ventana)
  const P = Pared3D({ canvas, stage, foto:'fotos/entornos/salon-luz.jpg', fotoPx:[2304, 2236], pxPorCm:9.75,
    foco:{ x:X, y:Y, w:170, h:130 }, luz:[-90, 80, 170], blur:20, sombra:.3, fov:24 });
  const { E, cl, lerp } = P;

  const lam = P.lamina(), im = P.imanPared();
  const A = P.cuadro('fotos/stock/1752652011858-480x640.webp', 30, 40); A.add(P.trasera(30, 40));
  /* los que llegan después: [foto, ancho, alto, x, y] (retrato 18×24 a los lados, 12×16 por fuera) */
  /* en pantalla vertical no cabe a lo ancho: los pequeños van encima de los de los lados */
  const vertical = stage.clientWidth / stage.clientHeight < .8;
  const MAS = (vertical
    ? [['1586498024141', 18, 24, X - 28, Y - 6], ['1738956952892', 18, 24, X + 28, Y - 6],
       ['1603367563698', 12, 16, X - 28, Y + 18], ['1548858806', 12, 16, X + 28, Y + 18]]
    : [['1586498024141', 18, 24, X - 29, Y], ['1738956952892', 18, 24, X + 29, Y],
       ['1603367563698', 12, 16, X - 49, Y + 4], ['1548858806', 12, 16, X + 49, Y - 4]])
    .map(([f, w, h, x, y]) => ({ c:P.cuadro('fotos/stock/' + f + '-480x640.webp', w, h), i:P.imanPared(), w, h, x, y }));
  MAS.forEach(m => m.i.scale.setScalar(m.w / 30));

  /* destello: una franja de luz que cruza la cara del cuadro justo después del clic (el brillo del aluminio) */
  const franja = (() => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 64; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(.38, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.55)'); g.addColorStop(.62, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 64); return c;
  })();
  function destello(cuadro, w, h){
    const t = new THREE.CanvasTexture(franja); t.center.set(.5, .5); t.rotation = -.5;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w - .4, h - .4), new THREE.MeshBasicMaterial({ map:t, transparent:true,
      blending:THREE.AdditiveBlending, depthWrite:false, toneMapped:false, opacity:0 }));
    m.position.z = .84; cuadro.add(m);
    return u => { m.material.opacity = u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; t.offset.x = lerp(-.75, .75, u); };
  }
  const brilloA = destello(A, 30, 40);
  MAS.forEach(m => m.brillo = destello(m.c, m.w, m.h));

  /* despiece inicial: cada pieza flotando delante de la pared, giradas para que se vea el canto */
  const SUELTO = {
    lam:{ x:X - 40, y:Y + 3, z:18, ry:.5, rx:.05 },
    im: { x:X - 9,  y:Y - 1, z:26, ry:.5, rx:.05 },
    A:  { x:X + 30, y:Y + 2, z:30, ry:Math.PI - .55, rx:.04 },
  };
  if(vertical){ Object.assign(SUELTO.lam, { x:X - 22, y:Y + 22, z:14 }); Object.assign(SUELTO.im, { x:X + 14, y:Y + 20, z:20 });
    Object.assign(SUELTO.A, { x:X - 2, y:Y - 24, z:22 }); }
  const flotar = (p, s, t, k) => {
    p.visible = true;
    p.position.set(s.x, s.y + Math.sin(t * 1.1 + k) * .9, s.z);
    p.rotation.set(s.rx, s.ry + Math.sin(t * .7 + k) * .05, 0);
  };
  /* de suelto a la pared: avanza, gira de cara y al final se pega (iman = el tirón y el rebote del clic) */
  function montar(p, s, u, x, y, z, iman){
    const a = E.io(cl(iman ? u / .82 : u)), zc = z + (iman ? 3.2 : 0);
    p.position.set(lerp(s.x, x, a), lerp(s.y, y, a) + Math.sin(a * Math.PI) * 4, lerp(s.z, zc, a));
    p.rotation.set(lerp(s.rx, 0, a), lerp(s.ry, 0, a), 0);
    if(iman && u > .82){ const b = E.in(cl((u - .82) / .1)); p.position.z = zc - (zc - z) * b;
      if(u > .92){ const k = (u - .92) * 3; p.position.z = z + Math.sin(k * 70) * .25 * Math.exp(-k * 16); } }
  }

  /* tramos del scroll (0–1) */
  const T = { lam:[.12, .24], im:[.24, .36], A:[.36, .54], tuerce:[.56, .66], mas:[.66, .88], lejos:[.86, 1] };
  const tramo = (p, r) => cl((p - r[0]) / (r[1] - r[0]));
  const CAPS = [0, .12, .24, .36, .56, .66, .88];          // dónde empieza cada texto

  const fCerca = { x:X - 4, y:Y - 4, w:135, h:95 }, fGaleria = { x:X + 2, y:Y - 8, w:150, h:105 }, fSalon = { x:X - 12, y:Y - 8, w:205, h:150 };
  if(vertical){ fCerca.x = X; fCerca.w = 100; fGaleria.x = X; fGaleria.y = Y - 2; fGaleria.w = 80; fSalon.x = X - 6; fSalon.w = 110; }
  const mezclaF = (a, b, u) => ({ x:lerp(a.x, b.x, u), y:lerp(a.y, b.y, u), w:lerp(a.w, b.w, u), h:lerp(a.h, b.h, u) });
  const pared = P.fondo.material.color, apagada = new THREE.Color(0xece8e2), viva = new THREE.Color(0xffffff);
  const v3 = new THREE.Vector3();

  function pose(p, t){
    /* 1 · las tres piezas, sueltas o montándose */
    if(p < T.lam[0]) flotar(lam, SUELTO.lam, t, 0); else montar(lam, SUELTO.lam, tramo(p, T.lam), X, Y, .03);
    if(p < T.im[0]) flotar(im, SUELTO.im, t, 1.7); else montar(im, SUELTO.im, tramo(p, T.im), X, Y - 2, .1);
    if(p < T.A[0]) flotar(A, SUELTO.A, t, 3.1); else montar(A, SUELTO.A, tramo(p, T.A) * 1.08, X, Y, .5, true);
    /* 2 · se tuerce un poco y se endereza con un dedo */
    brilloA(tramo(p, [.5, .6]));
    const k = tramo(p, T.tuerce); if(k > 0 && k < 1) A.rotation.z = -.075 * (k < .4 ? E.out(k / .4) : 1 - E.io((k - .4) / .6));
    /* 3 · llegan los demás: primero su imán, luego el cuadro con su clic */
    MAS.forEach((m, n) => {
      const u = tramo(p, [T.mas[0] + n * .045, T.mas[0] + n * .045 + .07]);
      if(u <= 0){ m.i.visible = false; m.c.visible = false; return; }
      P.llegar(m.i, cl(u * 2.2), m.x, m.y - 2 * m.h / 40, .1, { x:m.x + 20, y:m.y - 30, z:60 });
      P.llegar(m.c, (u - .4) / .55, m.x, m.y, .5, { x:m.x + 25, y:m.y - 35, z:75 }, true);
      m.brillo(cl(((p - T.mas[0] - n * .045) / .07 - .9) / .6));
    });
    /* 4 · la pared «despierta» y la cámara se aleja hasta ver el salón */
    pared.copy(apagada).lerp(viva, E.io(tramo(p, [.5, .9])));
    const g = E.io(tramo(p, [.62, .8])), l = E.io(tramo(p, T.lejos));
    P.encuadre(mezclaF(mezclaF(fCerca, fGaleria, g), fSalon, l));
  }

  /* textos y etiquetas del despiece */
  let capOn = -1;
  function textos(p){
    let c = 0; CAPS.forEach((s, i) => { if(p >= s) c = i; });
    if(c !== capOn){ capOn = c; capts.forEach((el, i) => el.classList.toggle('on', i === c)); dots.forEach((d, i) => d.classList.toggle('on', i <= c)); }
    const verTags = p < T.lam[0] - .015, r = stage.getBoundingClientRect();
    [[lam, 0, -18], [im, 1, -10], [A, 2, -23]].forEach(([obj, i, dy]) => {
      const el = tags[i]; if(!el) return;
      el.classList.toggle('on', verTags);
      if(!verTags) return;
      v3.set(obj.position.x, obj.position.y + dy, obj.position.z).project(P.camara);
      el.style.transform = `translate(${(v3.x + 1) / 2 * r.width}px, ${(1 - v3.y) / 2 * r.height}px) translate(-50%, 0)`;
    });
  }

  /* progreso = cuánto has recorrido de la sección; se suaviza un poco para que no vaya a saltos con la rueda */
  const q = new URLSearchParams(location.search).get('cs');   // ?cs=0.5 congela la escena en ese punto (capturas)
  let objetivo = 0, actual = 0, visible = false, t0 = performance.now();
  function medir(){
    const r = sec.getBoundingClientRect(), recorrido = r.height - innerHeight;
    objetivo = q !== null ? +q : cl(-r.top / Math.max(1, recorrido));
  }
  addEventListener('scroll', medir, { passive:true }); addEventListener('resize', medir); medir(); actual = objetivo;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin:'100px 0px' }).observe(sec);
  (function paso(){
    requestAnimationFrame(paso);
    if(!visible) return;
    actual += (objetivo - actual) * .14; if(Math.abs(objetivo - actual) < .0004) actual = objetivo;
    const t = (performance.now() - t0) / 1000;
    pose(actual, t); P.pintar(); textos(actual);
  })();
  sec.classList.add('cs-listo');
})();
