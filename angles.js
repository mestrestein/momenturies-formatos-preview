/* angles.js — herramienta de revisión: 10 ángulos de venta distintos para la misma
   landing de Momenturies, cambiables en caliente desde la barra de arriba (#angleBar).
   No toca precios, tallas, FAQ ni legal — solo el copy que "vende el ángulo": topbar,
   hero, la intro de "sube tu foto", la cabecera del carrusel de productos, el bloque
   Gloss HD y la newsletter. El resto de la página (hechos del producto) se queda igual
   pase lo que pase, porque no cambia según el ángulo.

   Para quitar esta herramienta antes de un lanzamiento serio: borra el <div id="angleBar">
   de momenturies.html, la sección de CSS ".angle-bar" y este <script>. Nada más depende
   de ello. */

const ANGLES = [
  {
    label: 'Socio · Recuerdos juntos (H1 A)',
    topbar: { es: 'Oferta relámpago — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'Flash sale — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'INMORTALIZA RECUERDOS JUNTOS', en: 'KEEP YOUR MEMORIES TOGETHER' },
    heroH1: { es: 'No pierdas los recuerdos de tu galería.<br>Elige tus fotos y conviértelas en realidad', en: "Don't lose the memories in your gallery.<br>Pick your photos and make them real" },
    heroSub: { es: 'Cuadros de aluminio HD con colgado magnético: sin daños en la pared y ajustables cuando quieras.', en: 'HD aluminium prints with magnetic mounting: no damage to the wall, and you can move them whenever.' },
    heroCta: { es: 'Elegir mis fotos', en: 'Pick my photos' },
    heroCta2: { es: 'Ver cómo queda en casa', en: 'See it at home' },
    trust1: { es: 'Sin agujeros ni marco', en: 'No holes, no frame' },
    trust2: { es: 'Vista previa en 3D', en: '3D preview' },
    trust3: { es: 'Imán incluido', en: 'Magnet included' },
    upTag: { es: 'Paso a paso', en: 'Step by step' },
    upH2: { es: 'Elige tus fotos.<br>Elige cómo queda. Listo.', en: 'Pick your photos.<br>Pick how it looks. Done.' },
    upLead: { es: 'Todo desde el móvil y en un par de minutos: eliges las fotos de tu galería, eliges la combinación y el entorno, le añades tu dedicatoria y ya está.', en: "All from your phone in a couple of minutes: pick the photos from your gallery, pick the layout and the room, add your dedication and that's it." },
    pcTag: { es: 'Nuestros formatos', en: 'Our formats' },
    pcH2: { es: 'El mismo aluminio HD,<br>tres formas de tenerlo', en: 'The same HD aluminium,<br>three ways to have it' },
    ghTag: { es: 'Acabado Exclusivo', en: 'Exclusive Finish' },
    ghH2: { es: 'Pura Luz.<br>Puro Reflejo.', en: 'Pure Light.<br>Pure Reflection.' },
    ghBody: { es: 'Imprimimos directamente sobre aluminio de alta pureza para conseguir un brillo, una profundidad de color y un reflejo que ningún papel, canvas ni otro material puede igualar.', en: 'We print directly onto high-purity aluminium to achieve a gloss, colour depth and reflection that no paper, canvas or other material can match.' },
    nlTag: { es: 'Aviso de lanzamiento', en: 'Launch notice' },
    nlH2: { es: 'Te avisamos cuando abramos', en: "We'll tell you when we open" },
    nlLead: { es: 'Un solo correo cuando la tienda esté lista, con descuento para los primeros pedidos. Nada más.', en: 'One email when the store is live, with a discount for the first orders. Nothing else.' },
  },
  {
    label: 'Regalo',
    topbar: { es: '¿Buscas un regalo distinto? <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'Looking for a different gift? <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'EL REGALO QUE SE CUELGA', en: 'THE GIFT THAT HANGS' },
    heroH1: { es: 'El regalo que no acaba<br>guardado en un cajón', en: "The gift that doesn't end up<br>in a drawer" },
    heroSub: { es: 'Una foto vuestra, impresa en aluminio y lista para colgar el mismo día que la abre. Sin envolver nada raro: solo la caja.', en: 'A photo of you two, printed on aluminium and ready to hang the day it arrives. Nothing awkward to wrap: just the box.' },
    heroCta: { es: 'Elegir el regalo', en: 'Pick the gift' },
    heroCta2: { es: 'Ver ideas', en: 'See ideas' },
    trust1: { es: 'Llega listo para regalar', en: 'Arrives gift-ready' },
    trust2: { es: 'Se cuelga en el momento', en: 'Hangs on the spot' },
    trust3: { es: 'Sin precio dentro del paquete', en: 'No price shown inside' },
    upTag: { es: 'Para regalar', en: 'For gifting' },
    upH2: { es: 'Eliges la foto.<br>Nosotros hacemos el resto.', en: 'You choose the photo.<br>We do the rest.' },
    upLead: { es: 'No hace falta que sepas de diseño. Subes una foto, la encuadras, la ves en 3D y ya está listo para envolver.', en: "No design skills needed. Upload a photo, frame it, see it in 3D and it's ready to wrap." },
    pcTag: { es: 'Un regalo por ocasión', en: 'A gift for every occasion' },
    pcH2: { es: 'Para la pared, la mesa<br>o la puerta de la nevera', en: 'For the wall, the desk<br>or the fridge door' },
    ghTag: { es: 'El detalle que se nota', en: 'The detail that shows' },
    ghH2: { es: 'Se abre una vez.<br>Se mira para siempre.', en: 'Opened once.<br>Looked at forever.' },
    ghBody: { es: 'El aluminio le da a la foto un brillo que un marco normal no tiene. Es el tipo de regalo que se queda colgado, no guardado.', en: "Aluminium gives the photo a gloss a normal frame doesn't have. It's the kind of gift that stays on the wall, not in a box." },
    nlTag: { es: 'Antes de que abramos', en: 'Before we open' },
    nlH2: { es: 'Entérate antes que nadie', en: 'Be the first to know' },
    nlLead: { es: 'Un correo cuando la tienda esté lista, con un descuento para quien llegue primero.', en: 'One email when the store is ready, with a discount for whoever gets there first.' },
  },
  {
    label: 'Diseño / decoración',
    topbar: { es: 'Renueva una pared este mes — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'Refresh a wall this month — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'PARA TU PARED', en: 'FOR YOUR WALL' },
    heroH1: { es: 'La pared que le falta<br>a tu salón', en: 'The wall your living room<br>is missing' },
    heroSub: { es: 'Cambia una pared vacía por una composición de tus fotos en aluminio. Sin marcos, sin taladro, sin obra.', en: 'Turn a blank wall into a composition of your photos on aluminium. No frames, no drilling, no mess.' },
    heroCta: { es: 'Diseñar mi pared', en: 'Design my wall' },
    heroCta2: { es: 'Ver composiciones', en: 'See layouts' },
    trust1: { es: 'Sin agujeros en la pared', en: 'No holes in the wall' },
    trust2: { es: 'Combina varios tamaños', en: 'Mix different sizes' },
    trust3: { es: 'Acabado de galería', en: 'Gallery-style finish' },
    upTag: { es: 'Interiorismo fácil', en: 'Easy interior design' },
    upH2: { es: 'Compón tu pared<br>como en una galería.', en: 'Compose your wall<br>like a gallery.' },
    upLead: { es: 'Mezcla cuadro, sobremesa e imán del tamaño que quieras. Los ves montados en 3D antes de decidirte.', en: 'Mix wall prints, desk prints and magnets in any size. See them mounted in 3D before you decide.' },
    pcTag: { es: 'Tres piezas, una pared', en: 'Three pieces, one wall' },
    pcH2: { es: 'De la mesa de entrada<br>a la pared del salón', en: 'From the entryway table<br>to the living room wall' },
    ghTag: { es: 'Acabado galería', en: 'Gallery finish' },
    ghH2: { es: 'Un brillo que cambia<br>con la luz de la habitación.', en: 'A gloss that shifts<br>with the light in the room.' },
    ghBody: { es: 'El aluminio refleja la luz de un modo que ni el papel ni el lienzo consiguen. Cambia de aspecto según la hora del día.', en: 'Aluminium reflects light in a way paper and canvas simply can\'t. It looks different depending on the time of day.' },
    nlTag: { es: 'Ideas para tu pared', en: 'Ideas for your wall' },
    nlH2: { es: 'Te mandamos ideas de composición', en: "We'll send you layout ideas" },
    nlLead: { es: 'Un correo cuando abramos, con ejemplos de paredes montadas para inspirarte.', en: "One email when we open, with example walls to inspire you." },
  },
  {
    label: 'Sin obras',
    topbar: { es: 'Sin taladro, sin polvo, sin marcas — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'No drill, no dust, no marks — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'SIN TALADRO', en: 'NO DRILLING' },
    heroH1: { es: 'Cuélgalo sin hacer<br>un solo agujero', en: "Hang it without making<br>a single hole" },
    heroSub: { es: 'Base adhesiva en la pared, el cuadro se engancha con un imán. Diez segundos, sin herramientas.', en: 'Adhesive base on the wall, the print clicks on with a magnet. Ten seconds, no tools.' },
    heroCta: { es: 'Probarlo', en: 'Try it' },
    heroCta2: { es: 'Cómo funciona', en: 'How it works' },
    trust1: { es: 'Cero agujeros', en: 'Zero holes' },
    trust2: { es: 'Se monta en 10 segundos', en: 'Up in 10 seconds' },
    trust3: { es: 'Se puede mover cuando quieras', en: 'Move it whenever you like' },
    upTag: { es: 'Sin complicarte', en: 'No hassle' },
    upH2: { es: 'Ni nivel, ni taco,<br>ni martillo.', en: 'No spirit level, no wall plug,<br>no hammer.' },
    upLead: { es: 'Pegas la base adhesiva, enganchas el cuadro con el imán y ya está recto. Si te mudas o cambias de idea, se despega sin dejar marca.', en: "Stick the adhesive base, click the print on with the magnet and it's already straight. Moving out or changing your mind? It peels off without a mark." },
    pcTag: { es: 'Cuelga, apoya o pega', en: 'Hang it, stand it or stick it' },
    pcH2: { es: 'El mismo sistema fácil<br>en los tres formatos', en: 'The same easy system<br>across all three formats' },
    ghTag: { es: 'Colgado en segundos', en: 'Up in seconds' },
    ghH2: { es: 'Lo difícil ya está hecho.<br>Solo falta engancharlo.', en: 'The hard part is done.<br>All that\'s left is clicking it on.' },
    ghBody: { es: 'Nada de escuadras ni de marcar la pared con lápiz. El imán encuentra su sitio solo.', en: 'No squares, no pencil marks on the wall. The magnet finds its own place.' },
    nlTag: { es: 'Para cuando abramos', en: "For when we open" },
    nlH2: { es: 'Te avisamos sin darte la turra', en: "We'll tell you, without the spam" },
    nlLead: { es: 'Un correo cuando podamos enviar pedidos. Nada de spam de por medio.', en: "One email when we can ship orders. No spam in between." },
  },
  {
    label: 'Calidad del material',
    topbar: { es: 'Aluminio de verdad, no una foto plastificada — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: "Real aluminium, not a laminated photo — <strong>10% off</strong> · Code: <span class=\"topbar-code\">METAL10</span>" },
    heroTag: { es: 'ALUMINIO, NO PAPEL', en: 'ALUMINIUM, NOT PAPER' },
    heroH1: { es: 'Del móvil a tu pared, crea un hogar lleno de historias junto a los tuyos', en: "Your photo printed into metal,<br>not stuck onto it" },
    heroSub: { es: 'Sube tus fotos, combínalas y mira cómo queda en casa. Cuélgalo sin daños en la pared.', en: 'The ink is fused straight into the aluminium sheet. No paper, no laminate, nothing to peel off.' },
    heroCta: { es: 'Ver el material', en: 'See the material' },
    heroCta2: { es: 'Comparar con papel', en: 'Compare with paper' },
    trust1: { es: 'Plancha de aluminio real', en: 'A real aluminium sheet' },
    trust2: { es: 'No se dobla ni se moja', en: "Won't bend or get damaged by water" },
    trust3: { es: 'Se limpia con un paño', en: 'Cleans with a cloth' },
    upTag: { es: 'El material importa', en: 'The material matters' },
    upH2: { es: 'No es una lámina.<br>Es una plancha de metal.', en: "It's not a sheet of paper.<br>It's a plate of metal." },
    upLead: { es: 'Notarás la diferencia al cogerlo: pesa, es rígido y no se curva como un póster de papel.', en: "You'll feel the difference holding it: it has weight, it's rigid, and it won't curl like a paper poster." },
    pcTag: { es: 'El mismo material, tres tamaños', en: 'The same material, three sizes' },
    pcH2: { es: 'Del imán de nevera<br>al cuadro grande', en: 'From the fridge magnet<br>to the large wall print' },
    ghTag: { es: 'Impresión directa', en: 'Direct printing' },
    ghH2: { es: 'El color vive<br>dentro del metal.', en: 'The colour lives<br>inside the metal.' },
    ghBody: { es: 'Al imprimir directamente sobre aluminio, el color no se queda en una capa de tinta encima: se integra en la superficie.', en: "Printed directly onto aluminium, colour isn't a layer of ink on top: it becomes part of the surface." },
    nlTag: { es: 'Antes del lanzamiento', en: 'Before launch' },
    nlH2: { es: 'Sé de los primeros en probarlo', en: 'Be among the first to try it' },
    nlLead: { es: 'Te avisamos por email en cuanto puedas pedir el tuyo.', en: "We'll email you the moment you can order yours." },
  },
  {
    label: 'Recién lanzados',
    topbar: { es: 'Somos nuevos: <strong>10% en los primeros pedidos</strong> · Código: <span class="topbar-code">METAL10</span>', en: "We're new: <strong>10% off first orders</strong> · Code: <span class=\"topbar-code\">METAL10</span>" },
    heroTag: { es: 'RECIÉN LANZADO', en: 'JUST LAUNCHED' },
    heroH1: { es: 'Estamos empezando.<br>Sé de los primeros.', en: "We're just getting started.<br>Be one of the first." },
    heroSub: { es: 'Momenturies acaba de abrir. Los primeros pedidos tienen un 10% de descuento y toda nuestra atención.', en: "Momenturies just opened. The first orders get a 10% discount and our full attention." },
    heroCta: { es: 'Hacer mi pedido', en: 'Place my order' },
    heroCta2: { es: 'Conocer la marca', en: 'Get to know us' },
    trust1: { es: 'Marca nueva, sin trucos', en: 'New brand, no tricks' },
    trust2: { es: '10% en los primeros pedidos', en: '10% off first orders' },
    trust3: { es: 'Te respondemos nosotros mismos', en: 'We answer you ourselves' },
    upTag: { es: 'De cero a tu pared', en: 'From zero to your wall' },
    upH2: { es: 'Somos pequeños todavía.<br>Por eso cuidamos cada pedido.', en: "We're still small.<br>That's why we look after every order." },
    upLead: { es: 'No hay un almacén enorme detrás. Cada foto que nos mandas la revisamos antes de imprimirla.', en: "There's no huge warehouse behind this. We check every photo you send before printing it." },
    pcTag: { es: 'Con lo que tenemos hoy', en: 'What we have today' },
    pcH2: { es: 'Tres formatos<br>para empezar', en: 'Three formats<br>to start with' },
    ghTag: { es: 'Primeros pasos', en: 'First steps' },
    ghH2: { es: 'Estrenamos aluminio,<br>no discurso.', en: "We're launching aluminium,<br>not a pitch." },
    ghBody: { es: 'Preferimos que lo pruebes tú a prometerte números que no podemos demostrar todavía.', en: "We'd rather you tried it than have us promise numbers we can't back up yet." },
    nlTag: { es: 'Sé de los primeros', en: 'Be among the first' },
    nlH2: { es: 'Entérate en cuanto abramos del todo', en: 'Find out the moment we fully open' },
    nlLead: { es: 'Un correo, con el código de descuento de lanzamiento.', en: 'One email, with the launch discount code.' },
  },
  {
    label: 'Familia',
    topbar: { es: 'Para la familia — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'For the family — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'PARA LOS TUYOS', en: 'FOR YOUR PEOPLE' },
    heroH1: { es: 'La foto de familia<br>que sí acabas colgando', en: "The family photo<br>you actually hang up" },
    heroSub: { es: 'Esa foto que tienes guardada en el móvil, en aluminio y en la pared, para verla cada día en vez de una vez al año.', en: "That photo saved on your phone, on aluminium and on the wall, so you see it every day instead of once a year." },
    heroCta: { es: 'Elegir la foto', en: 'Choose the photo' },
    heroCta2: { es: 'Ver ejemplos', en: 'See examples' },
    trust1: { es: 'De cualquier foto del móvil', en: 'From any photo on your phone' },
    trust2: { es: 'Se cuelga en el salón o el pasillo', en: 'Hangs in the living room or hallway' },
    trust3: { es: 'Dedicatoria detrás, si quieres', en: 'A dedication on the back, if you want' },
    upTag: { es: 'La que ya tienes', en: 'The one you already have' },
    upH2: { es: 'Esa foto de todos juntos.<br>La que nunca imprimes.', en: 'That photo of everyone together.<br>The one you never print.' },
    upLead: { es: 'No hace falta una sesión de fotos. Vale la del último cumpleaños, la de la playa o la del reencuentro.', en: "No photoshoot needed. The one from the last birthday, the beach or the reunion works fine." },
    pcTag: { es: 'Un formato para cada rincón', en: 'A format for every corner' },
    pcH2: { es: 'En el salón, en la mesilla<br>o en la nevera de la cocina', en: 'In the living room, on the nightstand<br>or on the kitchen fridge' },
    ghTag: { es: 'Se ve cada día', en: 'Seen every day' },
    ghH2: { es: 'No la vuelvas a guardar<br>en una carpeta.', en: "Stop filing it away<br>in a folder." },
    ghBody: { es: 'En el pasillo, en el salón o en la cocina: en algún sitio de la casa donde la veas de verdad.', en: 'In the hallway, the living room or the kitchen: somewhere in the house you actually see it.' },
    nlTag: { es: 'Para cuando abramos', en: 'For when we open' },
    nlH2: { es: 'Te avisamos por email', en: "We'll email you" },
    nlLead: { es: 'Sin spam, un aviso cuando puedas hacer tu pedido.', en: 'No spam, just a heads-up when you can order.' },
  },
  {
    label: 'Minimalista',
    topbar: { es: 'Sin marco, sin cristal, sin ruido — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'No frame, no glass, no clutter — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'SIN MARCO', en: 'FRAMELESS' },
    heroH1: { es: 'Menos marco.<br>Más foto.', en: 'Less frame.<br>More photo.' },
    heroSub: { es: 'Un rectángulo de aluminio con tu foto y nada más. Sin marco, sin cristal, sin passe-partout.', en: 'A rectangle of aluminium with your photo and nothing else. No frame, no glass, no mat.' },
    heroCta: { es: 'Ver el formato', en: 'See the format' },
    heroCta2: { es: 'Ver ejemplos', en: 'See examples' },
    trust1: { es: 'Sin marco', en: 'No frame' },
    trust2: { es: 'Sin cristal', en: 'No glass' },
    trust3: { es: 'Sin tornillos a la vista', en: 'No visible screws' },
    upTag: { es: 'Menos es más', en: 'Less is more' },
    upH2: { es: 'La foto es el objeto.<br>No necesita nada alrededor.', en: 'The photo is the object.<br>It needs nothing around it.' },
    upLead: { es: 'Un canto limpio, un acabado brillante y tu foto. Encaja en cualquier pared sin competir con ella.', en: 'A clean edge, a gloss finish and your photo. It fits any wall without competing with it.' },
    pcTag: { es: 'Un mismo lenguaje, tres tamaños', en: 'One language, three sizes' },
    pcH2: { es: 'De la pared grande<br>al detalle pequeño', en: 'From the large wall piece<br>to the small detail' },
    ghTag: { es: 'Acabado limpio', en: 'Clean finish' },
    ghH2: { es: 'Una superficie.<br>Un reflejo.', en: 'One surface.<br>One reflection.' },
    ghBody: { es: 'Sin biseles ni relieves. El aluminio hace de marco y de foto a la vez.', en: 'No bevels, no relief. The aluminium is the frame and the photo at once.' },
    nlTag: { es: 'Aviso de apertura', en: 'Opening notice' },
    nlH2: { es: 'Un correo, cuando toque', en: 'One email, when it matters' },
    nlLead: { es: 'Nada de newsletters semanales: solo el aviso de cuándo puedes comprar.', en: 'No weekly newsletters: just the notice of when you can buy.' },
  },
  {
    label: 'Adiós al marco',
    topbar: { es: 'Adiós a los marcos de siempre — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'Say goodbye to the old-school frame — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'OLVÍDATE DEL MARCO', en: 'FORGET THE FRAME' },
    heroH1: { es: 'El cuadro de toda la vida,<br>sin sus problemas', en: 'The classic wall print,<br>without the hassle' },
    heroSub: { es: 'Nada de marco pesado, nada de cristal que se rompe, nada de clavo torcido. Aluminio directo a la pared con un imán.', en: 'No heavy frame, no glass that breaks, no crooked nail. Aluminium straight onto the wall with a magnet.' },
    heroCta: { es: 'Ver la diferencia', en: 'See the difference' },
    heroCta2: { es: 'Comparar formatos', en: 'Compare formats' },
    trust1: { es: 'Sin marco que se astilla', en: 'No frame to chip' },
    trust2: { es: 'Sin cristal que se rompe', en: 'No glass to break' },
    trust3: { es: 'Sin agujero que rellenar después', en: 'No hole to fill in later' },
    upTag: { es: 'Lo de siempre, mejor', en: 'The classic, done better' },
    upH2: { es: 'El mismo hueco en la pared.<br>Sin la parte molesta.', en: 'The same spot on the wall.<br>Without the annoying part.' },
    upLead: { es: 'Ni comprar marco aparte, ni ir a la tienda a que te lo corten a medida. Llega listo tal cual.', en: 'No buying a separate frame, no trip to get it cut to size. It arrives ready as it is.' },
    pcTag: { es: 'Sin marco en ningún formato', en: 'Frameless in every format' },
    pcH2: { es: 'Pared, mesa o nevera:<br>siempre sin marco', en: 'Wall, desk or fridge:<br>always frameless' },
    ghTag: { es: 'Antes y ahora', en: 'Before and now' },
    ghH2: { es: 'El cuadro ha cambiado.<br>El marco ya no hace falta.', en: 'The wall print has changed.<br>The frame is no longer needed.' },
    ghBody: { es: 'El aluminio aguanta lo que antes hacía el marco y el cristal juntos, sin el peso ni el cuidado que piden.', en: 'Aluminium does what the frame and the glass used to do together, without the weight or the upkeep.' },
    nlTag: { es: 'Antes de que abramos', en: 'Before we open' },
    nlH2: { es: 'Te lo contamos cuando esté listo', en: "We'll tell you when it's ready" },
    nlLead: { es: 'Un correo cuando puedas pedir el tuyo, con descuento de lanzamiento.', en: 'One email when you can order yours, with a launch discount.' },
  },
  {
    label: 'Editor 3D',
    topbar: { es: 'Diséñalo tú mismo en 3D — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'Design it yourself in 3D — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'LO DISEÑAS TÚ', en: 'YOU DESIGN IT' },
    heroH1: { es: 'Gíralo, ajústalo,<br>decide tú cómo queda', en: 'Rotate it, adjust it,<br>you decide how it looks' },
    heroSub: { es: 'Sube tu foto y muévela en un editor 3D real hasta que quede como quieres. Lo ves antes de pedirlo, no después.', en: 'Upload your photo and move it around in a real 3D editor until it looks right. You see it before ordering, not after.' },
    heroCta: { es: 'Abrir el editor', en: 'Open the editor' },
    heroCta2: { es: 'Ver cómo funciona', en: 'See how it works' },
    trust1: { es: 'Editor 3D de verdad', en: 'A real 3D editor' },
    trust2: { es: 'Encuadre a tu gusto', en: 'Crop it your way' },
    trust3: { es: 'Frase y dedicatoria si quieres', en: 'Caption and dedication if you want' },
    upTag: { es: 'Tú decides', en: 'You decide' },
    upH2: { es: 'Encuadre, tamaño, colgador:<br>lo eliges todo.', en: 'Crop, size, mounting:<br>you choose it all.' },
    upLead: { es: 'Arrastra la foto, ajusta el zoom y gira el cuadro en 3D para verlo desde todos los ángulos antes de pagar.', en: 'Drag the photo, adjust the zoom and rotate the print in 3D to see it from every angle before paying.' },
    pcTag: { es: 'Un editor, tres formatos', en: 'One editor, three formats' },
    pcH2: { es: 'Cambia de cuadro a sobremesa<br>sin salir del editor', en: 'Switch from wall print to desk print<br>without leaving the editor' },
    ghTag: { es: 'Lo ves antes de pedirlo', en: 'See it before you order' },
    ghH2: { es: 'Nada de sorpresas<br>al abrir la caja.', en: 'No surprises<br>when you open the box.' },
    ghBody: { es: 'El editor 3D usa tu foto real, tu texto real y el tamaño real. Lo que ves en pantalla es lo que llega a casa.', en: 'The 3D editor uses your real photo, your real text and the real size. What you see on screen is what arrives home.' },
    nlTag: { es: 'Prueba el editor', en: 'Try the editor' },
    nlH2: { es: 'Te avisamos cuando puedas comprar', en: "We'll tell you when you can buy" },
    nlLead: { es: 'El editor ya funciona. En cuanto abramos pedidos, te lo decimos por correo.', en: 'The editor already works. The moment we open for orders, we\'ll email you.' },
  },
  /* Los otros dos titulares que propuso el socio el 21-sep-2026. Solo cambia el H1:
     el resto del ángulo es el mismo, para poder compararlos sin más ruido. */
  {
    label: 'Socio · Construye tu pared (H1 B)',
    topbar: { es: 'Oferta relámpago — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'Flash sale — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'INMORTALIZA RECUERDOS JUNTOS', en: 'KEEP YOUR MEMORIES TOGETHER' },
    heroH1: { es: 'Construye tu pared junto a los tuyos,<br>dale vida a tu hogar', en: 'Build your wall with the people you love,<br>bring your home to life' },
    heroSub: { es: 'Cuadros de aluminio HD con colgado magnético: sin daños en la pared y ajustables cuando quieras.', en: 'HD aluminium prints with magnetic mounting: no damage to the wall, and you can move them whenever.' },
    heroCta: { es: 'Construir mi pared', en: 'Build my wall' },
    heroCta2: { es: 'Ver cómo queda en casa', en: 'See it at home' },
  },
  {
    label: 'Socio · De tu móvil a casa (H1 C)',
    topbar: { es: 'Oferta relámpago — <strong>10% de descuento</strong> · Código: <span class="topbar-code">METAL10</span>', en: 'Flash sale — <strong>10% off</strong> · Code: <span class="topbar-code">METAL10</span>' },
    heroTag: { es: 'INMORTALIZA RECUERDOS JUNTOS', en: 'KEEP YOUR MEMORIES TOGETHER' },
    heroH1: { es: 'De tu móvil a casa,<br>decora tu pared a medida', en: 'From your phone to your home,<br>a wall made to measure' },
    heroSub: { es: 'Cuadros de aluminio HD con colgado magnético: sin daños en la pared y ajustables cuando quieras.', en: 'HD aluminium prints with magnetic mounting: no damage to the wall, and you can move them whenever.' },
    heroCta: { es: 'Elegir mis fotos', en: 'Pick my photos' },
    heroCta2: { es: 'Ver cómo queda en casa', en: 'See it at home' },
  },
];

const ANGLE_FIELD_TO_ID = {
  topbar: 'angleTopbar', heroTag: 'angleHeroTag', heroH1: 'angleHeroH1', heroSub: 'angleHeroSub',
  heroCta: 'angleHeroCta', heroCta2: 'angleHeroCta2',
  trust1: 'angleTrust1', trust2: 'angleTrust2', trust3: 'angleTrust3',
  upTag: 'angleUpTag', upH2: 'angleUpH2', upLead: 'angleUpLead',
  pcTag: 'anglePcTag', pcH2: 'anglePcH2',
  ghTag: 'angleGhTag', ghH2: 'angleGhH2', ghBody: 'angleGhBody',
  nlTag: 'angleNlTag', nlH2: 'angleNlH2', nlLead: 'angleNlLead',
};

let currentAngleIdx = 0;

function applyAngle(idx) {
  const angle = ANGLES[idx];
  if (!angle) return;
  Object.keys(ANGLE_FIELD_TO_ID).forEach(field => {
    const val = angle[field];
    if (!val) return;
    const baseId = ANGLE_FIELD_TO_ID[field];
    const esEl = document.getElementById(baseId + '-es');
    const enEl = document.getElementById(baseId + '-en');
    if (esEl) esEl.innerHTML = val.es;
    if (enEl) enEl.innerHTML = val.en;
  });

  const counter = document.getElementById('angleCounter');
  if (counter) counter.textContent = (idx + 1) + ' / ' + ANGLES.length;
  const select = document.getElementById('angleSelect');
  if (select) select.value = String(idx);

  currentAngleIdx = idx;
  try { localStorage.setItem('momenturies_angle', String(idx)); } catch (e) {}
}

function angleStep(dir) {
  const next = (currentAngleIdx + dir + ANGLES.length) % ANGLES.length;
  applyAngle(next);
}

(function initAngleSwitcher() {
  const select = document.getElementById('angleSelect');
  const prevBtn = document.getElementById('angleBtnPrev');
  const nextBtn = document.getElementById('angleBtnNext');
  if (!select || !prevBtn || !nextBtn) return; // esta página no tiene la barra de ángulos

  ANGLES.forEach((a, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = (i + 1) + '. ' + a.label;
    select.appendChild(opt);
  });

  prevBtn.addEventListener('click', () => angleStep(-1));
  nextBtn.addEventListener('click', () => angleStep(1));
  select.addEventListener('change', () => applyAngle(parseInt(select.value, 10)));

  let start = 0;
  try {
    const saved = parseInt(localStorage.getItem('momenturies_angle'), 10);
    if (!isNaN(saved) && saved >= 0 && saved < ANGLES.length) start = saved;
  } catch (e) {}
  applyAngle(start);
})();
