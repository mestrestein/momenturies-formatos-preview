# Plan de lanzamiento en Meta (MOM-21)

Propuesta del 9 de noviembre de 2026. Lanzamiento el **jueves 20 de noviembre** (o el 19 si está todo listo). Está escrito para que lo revisemos los dos y cambiemos lo que haga falta antes de gastar un euro.

## 1. Lo que tiene que estar hecho antes de encender

Sin esto no se lanza, porque pagaríamos clics que no pueden comprar o que Meta no sabe medir.

| Qué | Quién | Estado |
|---|---|---|
| Datos del titular en aviso legal, privacidad y términos | Marc | Falta nombre, NIF y domicilio |
| Quitar la contraseña de la web (`WEB_CLAVE`) | Marc | Pendiente, el mismo día del lanzamiento |
| Shopify Payments sin modo de prueba y un pedido real hecho y reembolsado | Marc + Aitor | Pago real previsto el 9-nov por la tarde |
| Políticas de Shopify (reembolso, envío, términos, contacto) rellenas | Marc | Pendiente; el texto ya está en envios.html y terminos.html |
| Dominio momenturies.com verificado en el Business Manager | Marc | Comprobar |
| Píxel 1917299959243159 recibiendo PageView, ViewContent y AddToCart de la web, e InitiateCheckout y Purchase del canal de Shopify | Marc | Probar con `?fbtest=1` y el Administrador de eventos |
| Instagram y Facebook de Momenturies con al menos 9 publicaciones | Aitor | Comprobar |
| Método de pago y límite de gasto en la cuenta publicitaria | Marc | Comprobar |
| Publicar en main la rama `cambios` (páginas de ayuda, aviso de foto, ficha sin la nota inventada) | Marc | Pendiente de su sí |

## 2. Estructura

Lo que pidió Aitor: CBO, un conjunto por ángulo y mucha variedad de formatos.

**Campaña 1 · Ventas · Captación (CBO)**
- Objetivo: Ventas, evento de conversión **Compra**. Con el píxel nuevo, Meta tarda unos días en aprender: no tocar nada durante las primeras 72 horas.
- Público: España, de 25 a 60 años, Advantage+ audiencia (amplio). Sin intereses: con presupuestos pequeños el público amplio aprende antes.
- Ubicaciones: Advantage+ (automáticas).
- 5 conjuntos, uno por ángulo (apartado 3), con 3 a 5 anuncios cada uno mezclando formatos.

**Campaña 2 · Ventas · Retargeting (presupuesto por conjunto, ABO)**
- Conjunto A: visitaron la web o vieron un producto en los últimos 14 días y no compraron.
- Conjunto B: añadieron al carrito o diseñaron una pared en los últimos 14 días y no compraron.
- Creativos: la pared que estaban mirando (Paredes de ensueño), «se cuelga sin clavos», el envío gratis desde 60 € y, desde el 27-nov, el descuento de Black Friday.
- Al principio casi no habrá gente que retargetear: se enciende con poco presupuesto y se sube cuando el público pase de unas 1.000 personas.

## 3. Ángulos (uno por conjunto)

Salen del panel de guiones (mestrestein.github.io/momenturies-guiones), los de prioridad alta. Noviembre y diciembre son de regalo, así que el regalo va con más peso.

| Conjunto | Ángulo | Guion | Creativos que ya tenemos |
|---|---|---|---|
| 1 | **Regalo de Navidad** con dedicatoria detrás | G03, G13 | demo-regalo.mp4, foto hero «Para regalar», dorsos con frase |
| 2 | **Sin clavos ni taladro** (pisos de alquiler) | G02 | foto hero «Sin clavos», vídeo «Así se cuelga», colgador-iman |
| 3 | **Fotos olvidadas en el móvil** | G01 | foto hero «Tus recuerdos», demo-paredes.mp4 |
| 4 | **De pared vacía a pared llena** (paredes de ensueño) | G12, G05 | miniaturas de las paredes, DondeLimpio-web.mp4 |
| 5 | **Míralo en tu pared antes de pedirlo** (la app) | G08 | grabaciones de la app: subir foto, cambiar de habitación, girar en 3D |

## 4. Formatos por conjunto

Para empezar no hace falta rodar nada: casi todo sale de la web y de la app.

- **Estático 1:1 y 4:5**: foto del hero con un titular corto. Son los de Canva de Aitor (MOM-17), revisados.
- **Carrusel**: 4 o 5 paredes de ensueño con su precio con descuento, o los pasos «sube, mira, cuelga».
- **Vídeo 9:16 de pantalla**: grabación de la app real (como demo-paredes.mp4), de 15 a 25 segundos, con texto encima y música de Mixkit.
- **Vídeo con IA** (MOM-18): ambiente y producto, nunca un falso cliente diciendo que lo ha comprado.
- **Vídeo propio** (MOM-16, Aitor): colgar un cuadro de verdad en casa. Entra cuando esté.

## 5. Textos de partida (uno por ángulo)

Se escriben como habla la gente, sin prometer reseñas que no tenemos.

**Regalo**
- Texto: Este año no regales otra taza. Elige su foto favorita, escríbele una frase detrás y llega lista para colgar, sin clavos.
- Titular: Su foto, en aluminio y con dedicatoria
- Botón: Comprar

**Sin clavos**
- Texto: Se pega, se engancha y ya está. Nuestros cuadros de aluminio se cuelgan con imán: sin taladro, sin agujeros y sin perder la fianza del piso.
- Titular: Cuélgalo en segundos
- Botón: Comprar

**Fotos olvidadas**
- Texto: Tienes miles de fotos y las paredes vacías. Elige tres, míralas colgadas en tu salón desde el móvil y te las mandamos impresas en aluminio.
- Titular: Saca tus fotos del móvil
- Botón: Diseñar mi pared

**Pared llena**
- Texto: Más de 30 combinaciones ya pensadas para que tu pared quede bien a la primera. Pones tus fotos, eliges la estancia y la ves antes de pedirla. Con 3 o más, un 15 % menos.
- Titular: Tu pared, lista en dos minutos
- Botón: Ver paredes

**Míralo antes**
- Texto: Sube tu foto y mira cómo queda en tu salón, en tu cocina o en el pasillo, a tamaño real. Lo que ves es lo que te llega a casa.
- Titular: Pruébalo en tu pared gratis
- Botón: Probar ahora

## 6. Presupuesto propuesto (a decidir)

| Fase | Fechas | Captación (CBO) | Retargeting | Al día |
|---|---|---|---|---|
| Aprendizaje | 20 al 26-nov | 40 €/día | 5 €/día | 45 € |
| Black Friday | 27-nov al 1-dic | 60 €/día | 15 €/día | 75 € |
| Navidad | 2 al 14-dic | según resultados | 10-20 €/día | — |

Total hasta el 1-dic: unos 690 €. Reglas para decidir después de 3 días con datos:
- Un anuncio con más de 3 € gastados por clic en el enlace o sin añadidos al carrito tras 30 € de gasto, fuera.
- Un conjunto con coste por compra por debajo de unos 25 € (calculamos un pedido medio de 50-60 € con descuento; se corrige con los datos reales), se le sube el 20 % cada 2 días.
- El último día para prometer entrega antes de Navidad con envío estándar es sobre el **16 de diciembre**: a partir del 12 los anuncios lo dicen.

## 7. Black Friday y las «100 primeras paredes»

- Hasta el 26-nov se vende al precio normal (con el descuento por cantidad). Si el 27 bajamos a mitad de precio, quien compró el 20 se sentirá engañado: o bien no se anuncia la mitad de precio, o se avisa desde el principio («el 27-nov, las 100 primeras paredes a mitad de precio: apúntate»).
- Con el 50 % y el 20 % de vuelta por la foto, a una pared pequeña de 3 le quedan unos 1,70 € antes de anuncios (estudio de precios del 16-oct). Con anuncios se pierde dinero en cada pedido. Propuesta: 50 % solo en paredes de 4 o más cuadros, o un 30 %.
- Precio de lanzamiento, no «-50 %», porque no hay precio anterior de 30 días (ley Omnibus).

## 8. Seguimiento diario

Cada mañana: gasto, clics, añadidos al carrito, compras y coste por compra por conjunto y por anuncio. Se apunta en un comentario de MOM-21 y decidimos qué se apaga y qué se sube.
