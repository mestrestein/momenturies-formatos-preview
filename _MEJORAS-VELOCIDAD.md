# Mejoras de velocidad de la web (desde el 20-nov-2026)

Registro de cada cambio de velocidad: qué hace, qué archivos toca y cómo volver atrás.
En el código, cada cambio lleva un comentario con su fecha (`20-nov` / `21-nov`): buscando esa fecha se ve exactamente qué se tocó.
Este archivo empieza por `_`, así que no se ve en la web.

## Cómo volver atrás

- **Un cambio concreto:** pídeselo a Claude («deshaz el cambio X del registro de velocidad»). Lo que hace por debajo:
  `git revert <commit>` en la rama `cambios` y luego publicar. Si son varios cambios del mismo archivo, se deshacen
  del más nuevo al más viejo.
- **Todo de golpe, tal como estaba antes:** la etiqueta `antes-velocidad-21nov` marca la web publicada justo antes
  (20-nov, `503316c`). Ojo: volver a ella también quitaría lo que se publicó después que no es de velocidad
  (reseñas de ejemplo fuera, MOM-32, packs de la ficha...). Mejor deshacer cambio a cambio.
- **Las fotos nuevas** (`fotos/pdp/mini/`, `fotos/pdp/visor-cuadro.webp`) se pueden quedar aunque se deshaga el cambio: no molestan.

## Cambios en la web (repo momenturies-formatos-preview)

| # | Fecha | Commit | Qué hace | Archivos | Comprobado |
|---|---|---|---|---|---|
| 1 | 20-nov | `5d211b0` | Enlace de cambios: el botón compara con lo pagado aplicando el descuento del pedido | editor.js | #1004 en la web publicada |
| 2 | 21-nov | `7ea8add` | Enlace de cambios: abre directo en su conjunto y entorno (sin recargar ni enseñar otro primero), fotos de 4 en 4; al guardar, los cuadros sin tocar reutilizan sus archivos | editor.js, pruebas-conjuntos.js, cuadro/iman/sobremesa/visor.html | Web real (#1004): abre en T01, tapado mientras carga, 6 fotos; al guardar sin tocar nada, 0 subidas |
| 3 | 21-nov | `7d07a8d` | Pagar más rápido: cada cuadro se prepara en cuanto se queda quieto (solo cuando no se toca la pantalla), el recorte no se repite si no hay frase/fecha/dibujo, la animación 3D ya no invalida lo preparado. Con 6 fotos y 4G: 196 s → 5 s al pagar | editor.js + versión en 4 páginas | En local y en la web real (6 fotos: 5,2 s al pagar, carrito con checkout) |
| 4 | 21-nov | `b0a3e58` | Arreglo del 3: la foto original se sube al ponerla también en momenturies.com (allí las fotos van a Archivos de Shopify) | editor.js + versión en 4 páginas | Parche del servidor comprobado |
| 5 | 21-nov | `d992a80` | Portada: las diapositivas que no se ven se bajan al terminar de cargar. Ficha del Cuadro: miniaturas de 240 px y fotos grandes al cargar o al acercarse (1,9 MB → 0,6 MB al entrar) | portada.js, index.html, momenturies.html, ficha-cuadro.html, fotos/pdp/mini/ | Web real: diapositivas y miniaturas bien, sin errores |
| 6 | 21-nov | `70f37e3` | Ficha del Cuadro: el visor 3D se carga cuando el cliente hace algo; mientras, imagen fija idéntica sacada del visor | ficha-cuadro.html, fotos/pdp/visor-cuadro.webp | Web real: imagen fija → 3D al tocar; «Ver el dorso» antes de cargar también gira |
| 7 | 21-nov | `fed0142` | Enlace de cambios: el entorno se guarda dentro del diseño (fallo encontrado en las pruebas: #1004 abría en otro entorno) | editor.js + versión en 4 páginas | Parche del servidor comprobado |

Lo que **no** se ha tocado: calidad de impresión (JPG 0,98 a 300 ppp), aspecto, precios, textos.

## Cambios en el Vestuario (repo vestuario-mcp, se despliega a mano)

| Fecha | Commit | Qué hace | Cómo volver |
|---|---|---|---|
| 20-nov | `2f14575` | Enlace de cambios: factor de descuento pagado | `git revert` + desplegar |
| 21-nov | `f262ba4` | Enlace de cambios: manda los archivos que ya tiene cada cuadro del pedido | `git revert` + desplegar |
| 21-nov | `fcee0c0` | Enlace de cambios: un pedido con un cambio ya guardado se abre en el entorno de la compra | `git revert` + desplegar |
| 21-nov | `0d9baf1`, `0231a01`, `2c5ceb7` | PageSpeed cada mañana: portada, ficha del Cuadro y editor, en móvil y ordenador | quitar URLS_VELOCIDAD en wrangler.jsonc + desplegar |

## Medidas de PageSpeed (móvil / ordenador)

| Fecha | Portada | Ficha del Cuadro | Editor (cuadro.html) | Nota |
|---|---|---|---|---|
| 21-nov mañana | 69 / 91 | 40 / 60 | 41 / 54 | antes de publicar 5 y 6 |
