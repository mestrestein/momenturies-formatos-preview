# Sugerencia #2: Portada móvil: hero, «Así funciona» y puntos de «La diferencia» listos para publicar

_Aitor · 2026-11-03 · cambio_

Marc, he dejado en la rama «cambios» varios arreglos de la portada que me ha pedido Aitor (3 nov). Míralos en momenturies.com/vista-cambios/ en el móvil y, si te encajan, publícalos.

1) LA DIFERENCIA – nuevo copy de los 4 puntos (index.html y momenturies.html):
 1. Un cuadro que dura mucho más – Aluminio rígido, resistente y duradero.
 2. Acabado en alta definición HD – Colores más vivos, nítido y con efecto reflejo.
 3. Pared destrozada – Tu pared llena de agujeros. Cuélgalo sin daños.
 4. Sobrecoste del marco – Pagas de más y encima el papel se estropea con facilidad.
 (Los globos solo existen en español: no hay versión EN de esta parte.)

2) LA DIFERENCIA – globos en móvil (portada.js + portada.css):
 - En móvil el globo sale al lado de su punto y a su altura (antes salía siempre abajo del todo), sin salirse de la foto ni tapar el punto.
 - Tocar en cualquier sitio que no sea un punto cierra el globo (también en PC).
 - El globo ya no «viaja» deslizándose de un punto a otro.

3) HERO en móvil (≤860px):
 - La foto/vídeo va siempre en 16:9 entera: sin recorte arriba/abajo/lados y sin el zoom animado (scale 1.06) en móvil.
 - El hero mide lo que su contenido (antes height calc(100svh - 96px), pero la cabecera mide 114px y se pasaba).
 - Si el texto no cabe, portada.js lo encoge un poco (variable --k, mínimo 0,7) para que foto + texto + botón quepan sin bajar; en pantallas muy bajas quita la línea pequeña de abajo (clase .apretado). Quitado el bloque antiguo de max-height:700px.
 - PC sin cambios.

4) ASÍ FUNCIONA en móvil:
 - Menos aire (padding 26/30 en vez de 64/70, gaps más pequeños) y el teléfono se ajusta al alto de pantalla descontando la barra fija de 62px: título + teléfono + botón se ven a la vez.
 - Por debajo de 240px de ancho el teléfono no se estrecha (su interfaz se monta): portada.js lo reduce entero con zoom. En móviles bajos (≤720px de alto) se oculta la etiqueta «Así funciona».
 - Tarjeta de la dedicatoria proporcional al teléfono.

Probado en local en 390x844, 375x667 y 393x560 (y PC). Versión de caché subida: portada.css?v=947dfea6 y portada.js?v=a9711a32 en index.html y momenturies.html.
