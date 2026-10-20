/* Galería de la ficha del Cuadro (#galeria): fotos, vídeos y dos escenas 3D hechas con pared3d.js
   (el cuadro girando con su dedicatoria detrás, y el colgado con lámina + imán + clic).
   Las escenas 3D y los vídeos solo arrancan cuando su foto está a la vista. */
(function(){
  const gal = document.getElementById('galeria'); if(!gal) return;
  const track = gal.querySelector('.gal-track'), slides = [...track.children];
  const thumbs = [...gal.querySelectorAll('.gal-thumbs button')], num = gal.querySelector('.gal-n');
  let actual = 0;

  function ir(i){ i = (i + slides.length) % slides.length; track.scrollTo({ left:slides[i].offsetLeft, behavior:'smooth' }); }
  gal.querySelector('.gal-prev').addEventListener('click', () => ir(actual - 1));
  gal.querySelector('.gal-next').addEventListener('click', () => ir(actual + 1));
  thumbs.forEach((b, i) => b.addEventListener('click', () => ir(i)));

  function marcar(i){
    if(i === actual && slides[i].dataset.on) return;
    actual = i;
    slides.forEach((s, k) => {
      const on = k === i; s.dataset.on = on ? '1' : '';
      const v = s.querySelector('video'); if(v){ if(on){ v.play().catch(() => {}); } else v.pause(); }
      if(on && s.dataset.escena) escena(s);
    });
    thumbs.forEach((b, k) => { b.classList.toggle('on', k === i); if(k === i) b.scrollIntoView({ block:'nearest', inline:'nearest' }); });
    if(num) num.textContent = (i + 1) + ' / ' + slides.length;
  }
  let raf = 0;
  track.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => marcar(Math.round(track.scrollLeft / track.clientWidth))); }, { passive:true });
  marcar(0);

  /* ---- escenas 3D (pared3d.js necesita three.js, que esta página ya carga para el editor) ---- */
  function cargar(ok){
    if(window.Pared3D) return ok();
    const s = document.createElement('script'); s.src = gal.dataset.pared3d; s.onload = ok; document.body.appendChild(s);
  }
  const ESCENAS = {
    /* el cuadro flotando delante de una pared lisa: gira solo y se puede arrastrar; detrás, el imán y la dedicatoria */
    giro(stage){
      const P = Pared3D({ canvas:stage.querySelector('canvas'), stage, foto:'fotos/fondos/pared-beige.webp', fotoPx:[1254, 1254], pxPorCm:10,
        foco:{ x:0, y:0, w:62, h:62 }, luz:[-60, 70, 120], blur:24, sombra:.22, fov:26 });
      const C = P.cuadro('fotos/stock/1752652011858-480x640.webp', 30, 40); C.add(P.trasera(30, 40));
      let giro = 0, vel = .35, arrastre = null, ultimo = performance.now();
      stage.addEventListener('pointerdown', e => { arrastre = e.clientX; stage.setPointerCapture(e.pointerId); });
      stage.addEventListener('pointermove', e => { if(arrastre === null) return; giro += (e.clientX - arrastre) * .012; arrastre = e.clientX; });
      const soltar = () => { arrastre = null; ultimo = performance.now(); };
      stage.addEventListener('pointerup', soltar); stage.addEventListener('pointercancel', soltar);
      P.bucle(1e6, t => {
        /* tras soltarlo espera 2,5 s y sigue girando solo */
        if(arrastre === null && performance.now() - ultimo > 2500) giro += vel / 60;
        C.position.set(0, Math.sin(t * 1.2) * .6, 12);
        C.rotation.set(.04, giro, 0);
      });
    },
    /* colgado: lámina, imán, el cuadro llega y hace clic, se tuerce, se endereza */
    colgado(stage){
      const P = Pared3D({ canvas:stage.querySelector('canvas'), stage, foto:'fotos/entornos/salon-luz.jpg', fotoPx:[2304, 2236], pxPorCm:9.75,
        foco:{ x:22, y:-14, w:80, h:80 }, luz:[-90, 80, 170], blur:20, sombra:.3 });
      const X = 22, Y = -14, lam = P.lamina(), im = P.imanPared();
      const A = P.cuadro('fotos/stock/1752652011858-480x640.webp', 30, 40); A.add(P.trasera(30, 40));
      const pasos = [...stage.querySelectorAll('.gal-paso')];
      let paso = -1;
      P.bucle(11, t => {
        P.llegar(lam, (t - .4) / 1.3, X, Y, .03, { z:55, rx:.1 });
        P.llegar(im, (t - 2) / 1.2, X, Y - 2, .1, { z:55 });
        P.llegar(A, (t - 3.6) / 1.9, X, Y, .5, { x:X + 34, y:Y - 30, z:70, ry:-2.4 }, true);
        if(t > 6.2 && t < 7.6){ const u = (t - 6.2) / 1.4; A.rotation.z = -.07 * Math.sin(u * Math.PI); }
        const p = t < 2 ? 0 : t < 3.6 ? 1 : t < 6.2 ? 2 : 3;
        if(p !== paso){ paso = p; pasos.forEach((li, i) => li.classList.toggle('on', i === p)); }
        stage.querySelector('canvas').classList.toggle('fuera', t > 10.4);
      });
    },
  };
  function escena(s){
    if(s.dataset.hecha || !window.THREE) return; s.dataset.hecha = '1';
    cargar(() => { try { ESCENAS[s.dataset.escena](s); s.classList.add('gal-3d-listo'); } catch(e){ console.error(e); } });
  }
  /* three.js llega al final de la página: si la primera escena estaba a la vista antes, se arranca ahora */
  addEventListener('load', () => { const s = slides[actual]; if(s.dataset.escena) escena(s); });
})();
