/* Pared 3D sobre foto real: la habitación es una foto de entornos/, las piezas (lámina, imán, cuadros)
   son 3D en centímetros reales y su sombra cae sobre la pared. Origen = centro de la foto, y hacia arriba. */
(function(){
  const cl = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const E = {
    out: (u) => 1 - Math.pow(1 - u, 3),
    in: (u) => u * u * u,
    io: (u) => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  };

  function entorno(renderer){
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const x = c.getContext('2d'), W = 1024, H = 512;
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f4ede2'); g.addColorStop(.45, '#d9cfc0'); g.addColorStop(1, '#8c7d6a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(W * .08, H * .1, W * .2, H * .45);   // ventana
    x.fillStyle = 'rgba(255,236,205,.8)'; x.fillRect(W * .45, H * .02, W * .3, H * .05);   // luz del techo
    const t = new THREE.CanvasTexture(c); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(renderer); const r = pm.fromEquirectangular(t).texture; pm.dispose(); return r;
  }

  /* rectángulo de esquinas redondeadas con UV 0–1 en la cara (para la foto) */
  function rr(w, h, r){
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  const uvPlano = (w, h) => ({
    generateTopUV(g, v, a, b, c){ return [a, b, c].map(i => new THREE.Vector2((v[i * 3] + w / 2) / w, (v[i * 3 + 1] + h / 2) / h)); },
    /* el canto toma el color del borde de la foto (como si la impresión diera la vuelta): sin filo oscuro alrededor */
    generateSideWallUV(g, v, a, b, c, d){ return [a, b, c, d].map(i => new THREE.Vector2(Math.min(1, Math.max(0, (v[i * 3] + w / 2) / w)), Math.min(1, Math.max(0, (v[i * 3 + 1] + h / 2) / h)))); },
  });

  function laminaTex(){
    const c = document.createElement('canvas'); c.width = 512; c.height = 690; const x = c.getContext('2d');
    x.fillStyle = '#ea8a12'; x.fillRect(0, 0, 512, 690);
    x.fillStyle = '#b8620a'; x.fillRect(0, 0, 512, 56);
    x.fillStyle = '#fff'; x.font = 'bold 18px sans-serif'; x.fillText('Momenturies', 22, 36);
    x.font = '11px sans-serif'; x.textAlign = 'right'; x.fillText('1 SOLO USO', 490, 28); x.fillText('RETIRA ▲', 490, 46);
    x.fillStyle = '#1a1a1a'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.fillText('LÁMINA PROTECTORA', 256, 108);
    x.strokeStyle = '#1a1a1a'; x.lineWidth = 2.5; x.setLineDash([10, 6]); x.strokeRect(118, 160, 276, 368); x.setLineDash([]);
    x.font = 'bold 26px sans-serif'; x.fillText('PEGA', 256, 310); x.fillText('EL IMÁN', 256, 346); x.fillText('AQUÍ', 256, 382);
    x.fillStyle = '#a40000'; x.font = 'bold 13px sans-serif'; x.fillText('Presiona fuerte durante al menos 5 segundos.', 256, 580);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }

  /* la trasera del cuadro: aluminio cepillado con la dedicatoria impresa (lo que ve quien lo descuelga) */
  function trasera(w, h){
    const c = document.createElement('canvas'); c.width = 600; c.height = 800; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 600, 800); g.addColorStop(0, '#e9e8e5'); g.addColorStop(.5, '#d4d3cf'); g.addColorStop(1, '#e4e3df');
    x.fillStyle = g; x.fillRect(0, 0, 600, 800);
    x.globalAlpha = .07; for(let i = 0; i < 800; i += 2){ x.fillStyle = Math.random() < .5 ? '#000' : '#fff'; x.fillRect(0, i, 600, 1); } x.globalAlpha = 1;
    x.fillStyle = '#2b2b2b'; x.textAlign = 'center';
    x.font = 'italic 34px Georgia, serif'; x.fillText('Para mamá,', 300, 600);
    x.font = 'italic 26px Georgia, serif'; x.fillText('por enseñarnos a mirar', 300, 642); x.fillText('el lado bonito de todo.', 300, 676);
    x.font = '18px Georgia, serif'; x.fillStyle = '#6b6b6b'; x.fillText('Lucía y Pablo · Navidad 2026', 300, 726);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w - .3, h - .3), new THREE.MeshStandardMaterial({ map:t, metalness:.35, roughness:.45 }));
    m.rotation.y = Math.PI; m.position.z = .37; return m;
  }

  /* opts: canvas, stage, foto, fotoPx:[w,h], pxPorCm, foco:{x,y,w,h} (cm), luz:[x,y,z] (desde el foco) */
  window.Pared3D = function(o){
    const renderer = new THREE.WebGLRenderer({ canvas:o.canvas, antialias:true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.useLegacyLights = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .82;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.VSMShadowMap;
    const scene = new THREE.Scene();
    scene.environment = entorno(renderer);
    const W = o.fotoPx[0] / o.pxPorCm, H = o.fotoPx[1] / o.pxPorCm;

    /* la habitación: la foto tal cual, sin luz ni tono */
    const ft = new THREE.TextureLoader().load(o.foto); ft.colorSpace = THREE.SRGBColorSpace; ft.anisotropy = 8;
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map:ft, toneMapped:false })));
    /* solo la sombra, encima de la foto */
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.ShadowMaterial({ opacity:o.sombra || .3 }));
    sombra.position.z = .02; sombra.receiveShadow = true; scene.add(sombra);

    let f = o.foco;
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x9a8a76, 1.1));
    const sol = new THREE.DirectionalLight(0xfff0dc, 2.4);
    const L = o.luz || [-70, 90, 140];
    sol.position.set(f.x + L[0], f.y + L[1], L[2]); sol.target.position.set(f.x, f.y, 0);
    sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.radius = o.blur || 18; sol.shadow.blurSamples = 24; sol.shadow.bias = -.0005;
    const m = Math.max(f.w, f.h) * .75;
    Object.assign(sol.shadow.camera, { left:-m, right:m, top:m, bottom:-m, near:10, far:500 });
    scene.add(sol, sol.target);

    const camara = new THREE.PerspectiveCamera(o.fov || 22, 1, 1, 3000);
    let acerca = 1, tam = '';
    function encuadrar(){
      const w = o.stage.clientWidth, h = o.stage.clientHeight, asp = w / h;
      if(tam !== w + 'x' + h){ tam = w + 'x' + h; renderer.setSize(w, h, false); }
      camara.aspect = asp;
      /* el foco entero a la vista, sin salirse nunca de la foto */
      let vh = Math.max(f.h, f.w / asp) * acerca; vh = Math.min(vh, H, W / asp);
      const vw = vh * asp;
      const cx = Math.max(-W / 2 + vw / 2, Math.min(W / 2 - vw / 2, f.x));
      const cy = Math.max(-H / 2 + vh / 2, Math.min(H / 2 - vh / 2, f.y));
      const d = vh / 2 / Math.tan(camara.fov * Math.PI / 360);
      camara.position.set(cx, cy, d); camara.lookAt(cx, cy, 0); camara.updateProjectionMatrix();
    }
    addEventListener('resize', encuadrar); encuadrar();

    /* materiales compartidos */
    const alu = new THREE.MeshPhysicalMaterial({ color:0xeeeeee, metalness:1, roughness:.16, envMapIntensity:1.7 });
    const negro = new THREE.MeshPhysicalMaterial({ color:0x161616, metalness:.15, roughness:.55, clearcoat:.3, clearcoatRoughness:.5 });
    const cargador = new THREE.TextureLoader();

    function cuadro(src, w = 30, h = 40){
      const g = new THREE.Group();
      /* la foto impresa en metal brilla: algo más de color y contraste, y sin el tono apagado de la escena */
      const cara = new THREE.MeshPhysicalMaterial({ color:0x202020, emissive:0xffffff, emissiveIntensity:1, roughness:.2, metalness:0,
        clearcoat:1, clearcoatRoughness:.04, envMapIntensity:.3, toneMapped:false });
      const img = new Image(); img.onload = () => {
        const lienzo = document.createElement('canvas'); lienzo.width = img.naturalWidth; lienzo.height = img.naturalHeight;
        const x = lienzo.getContext('2d'); x.filter = 'saturate(1.5) contrast(1.16) brightness(1.05)'; x.drawImage(img, 0, 0);
        const tex = new THREE.CanvasTexture(lienzo); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        cara.map = tex; cara.emissiveMap = tex; cara.needsUpdate = true;
      }; img.src = src;
      /* placa de aluminio con grosor de verdad; la foto solo en la cara: las tapas van juntas en el grupo 0
         (primero la de atrás, luego la de delante), así que la de atrás pasa a aluminio.
         Sin bisel: la foto llega hasta el borde, que el cuadro no lleva marco y un bisel se leía como un filo negro */
      const geo = new THREE.ExtrudeGeometry(rr(w, h, .3), { depth:.32, bevelEnabled:false, curveSegments:8, UVGenerator:uvPlano(w, h) });
      const tapas = geo.groups[0], mitad = tapas.count / 2;
      geo.groups.splice(0, 1, { start:tapas.start, count:mitad, materialIndex:1 }, { start:tapas.start + mitad, count:mitad, materialIndex:0 });
      geo.groups.forEach((gr, k) => { if(k > 1) gr.materialIndex = 0; });
      const placa = new THREE.Mesh(geo, [cara, alu]); placa.position.z = .45; placa.castShadow = true; g.add(placa);
      const im = new THREE.Mesh(new THREE.BoxGeometry(w * .4, h * .3, .4), negro); im.position.z = .2; im.castShadow = true; g.add(im);
      scene.add(g); return g;
    }
    function lamina(){
      const m = new THREE.Mesh(new THREE.BoxGeometry(23, 31, .05),
        [0, 0, 0, 0].map(() => new THREE.MeshStandardMaterial({ color:0xc97510, roughness:.7 })).concat([new THREE.MeshStandardMaterial({ map:laminaTex(), roughness:.62 }), new THREE.MeshStandardMaterial({ color:0xc97510 })]));
      m.castShadow = true; scene.add(m); return m;
    }
    function imanPared(){
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(rr(12, 16, .5), { depth:.32, bevelEnabled:true, bevelThickness:.04, bevelSize:.06, bevelSegments:2 }), negro);
      m.castShadow = true; scene.add(m); return m;
    }

    /* movimientos: «llevar en la mano» hasta la pared y el tirón del imán al final */
    const temblor = (t, k) => Math.sin(t * 7.3 + k) * .5 + Math.sin(t * 13.1 + k * 2) * .25;
    function llegar(p, u, x, y, z, desde, iman){
      const d = Object.assign({ x:x + 30, y:y - 34, z:70, ry:-.35, rx:.18, rz:.1 }, desde || {});
      const cerca = iman ? .8 : 1, zc = z + (iman ? 3.5 : 0);
      const a = E.out(cl(u / cerca)), b = iman ? E.in(cl((u - cerca) / (1 - cerca))) : 0;
      const arco = Math.sin(a * Math.PI) * 6;                  // la mano sube un poco antes de bajar a la pared
      const vib = (1 - a) * .012;
      p.position.set(lerp(d.x, x, a), lerp(d.y, y, a) + arco, lerp(d.z, zc, a) - (zc - z) * b);
      p.rotation.set(lerp(d.rx, 0, a) + temblor(u * 4, 1) * vib, lerp(d.ry, 0, a) + temblor(u * 4, 2) * vib, lerp(d.rz, 0, a));
      if(iman && u > 1){ const k = u - 1; p.position.z = z + Math.sin(k * 70) * .25 * Math.exp(-k * 16); }
      if(u <= 0) p.visible = false; else p.visible = true;
    }
    /* despegar: primero se separa el borde de abajo (se coge por abajo), luego se aparta */
    function quitar(p, u, x, y, z, hacia){
      const h = Object.assign({ x:x - 40, y:y - 20, z:75, ry:.4 }, hacia || {});
      const a = E.io(cl(u / .3)), b = E.io(cl((u - .3) / .7));
      p.position.set(lerp(x, h.x, b), lerp(y, h.y, b) + Math.sin(b * Math.PI) * 5, z + a * 4 + lerp(0, h.z, b));
      p.rotation.set(-.22 * a * (1 - b), lerp(0, h.ry, b), lerp(0, .06, b));
      p.visible = u < 1;
    }

    let visible = false;
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold:.05 }).observe(o.stage);
    return {
      scene, camara, cuadro, lamina, imanPared, trasera, llegar, quitar, E, cl, lerp,
      /* control a mano (escena por scroll): cambiar el encuadre y pintar un fotograma */
      renderer, fondo:scene.children[0],
      encuadre(nf, k){ f = nf; acerca = k || 1; encuadrar(); },
      pintar(){ renderer.render(scene, camara); },
      bucle(T, pose){
        const t0 = performance.now(), q = new URLSearchParams(location.search).get('t');
        (function paso(){
          requestAnimationFrame(paso);
          if(!visible && q === null) return;
          const t = q !== null ? +q : ((performance.now() - t0) / 1000) % T;
          acerca = 1 - .03 * (t / T); encuadrar();           // acercamiento muy lento de cámara, como grabado
          pose(t); renderer.render(scene, camara);
        })();
      },
    };
  };
})();
