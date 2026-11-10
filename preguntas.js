/* ═════ PREGUNTAS FRECUENTES GLOBALES (10-nov) ═════
   Una sola lista para preguntas.html y para la sección «Preguntas» de la portada.
   Cada pregunta: [tema, destacada, pregunta, respuesta en HTML].
   destacada = 1 → sale también en el filtro «Todas» (las más importantes de cada tema).
   El orden de TEMAS es el orden de la página; dentro de cada tema, el orden de la lista. */
(function(){
  var TEMAS = [
    ['colgar',   'Colgar sin agujeros'],
    ['producto', 'El cuadro'],
    ['editor',   'Diseña y visualiza'],
    ['fotos',    'Tus fotos'],
    ['pedido',   'Precios y pedido'],
    ['envio',    'Producción y envío'],
    ['garantia', 'Garantía y devoluciones'],
    ['regalo',   'Regalo y dedicatoria']
  ];

  /* Copia a mano de FORMATS en editor.js (igual que en ficha-cuadro.html): si cambia un precio o una medida, cambiarlo también aquí. */
  var TAMANOS = [
    ['Cuadrado', [['S','10×10',14.99],['M','15×15',24.99],['ML','20×20',29.99],['L','30×30',54.99]]],
    ['Clásico',  [['S','10×15',19.99],['M','21×29,7',29.99],['L','25,5×36',44.99],['XL','30,5×43,1',59.99]]],
    ['Retrato',  [['S','12×16',19.99],['M','18×24',29.99],['L','24×32',44.99],['XL','30×40',54.99]]]
  ];
  var eur = function(n){ return n.toFixed(2).replace('.', ',') + ' €'; };
  var tablaTamanos = '<table class="fq-tabla fq-tam"><thead><tr><th>Tamaño</th><th>Medida</th><th>Precio</th></tr></thead>'
    + TAMANOS.map(function(f){ return '<tbody><tr class="f"><th colspan="3" scope="colgroup">' + f[0] + '</th></tr>'
      + f[1].map(function(s){ return '<tr><td>' + s[0] + '</td><td>' + s[1] + ' cm</td><td>' + eur(s[2]) + '</td></tr>'; }).join('') + '</tbody>'; }).join('')
    + '</table>';

  var COMPARA = [
    ['Aluminio <b>rígido, premium y resistente</b>', 'Material frágil y menos duradero'],
    ['<b>Alta definición HD</b>: brillo, nitidez y efecto reflejo', 'Peor calidad visual y muy variable'],
    ['<b>Ultrarresistente</b>, pensado para durar', 'Se arruga, se dobla y se estropea con facilidad'],
    ['<b>100 % impermeable</b>: resiste la humedad', 'Aguanta mal los golpes y la humedad'],
    ['<b>Fácil de limpiar</b> y de conservar', 'Mantenimiento delicado y constante'],
    ['<b>No necesita marco</b> para lucir', 'Necesita marco, con su coste añadido'],
    ['<b>Imán</b>: sin daños en la pared e intercambiable', 'Clavos o tacos, y un acabado básico y común'],
    ['<b>Regalo original</b> y memorable', 'Regalo muy visto, poco original']
  ];
  var tablaCompara = '<table class="fq-tabla fq-vs"><thead><tr><th>Cuadro metálico HD</th><th>Póster tradicional</th></tr></thead><tbody>'
    + COMPARA.map(function(r){ return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</tbody></table>';

  var MAIL = '<a href="mailto:info@momenturies.com">info@momenturies.com</a>';
  var AVISO_PARED = '<p class="fq-nota"><b>Consejo:</b> en superficies muy rugosas o irregulares (paredes con mucho relieve o ladrillo), aprieta firmemente unos segundos para que el adhesivo se fije mejor.</p>'
    + '<p class="fq-nota fq-ojo"><b>Advertencia:</b> no lo recomendamos en gotelé muy marcado, en papel pintado que se despega ni en pintura recién dada (menos de 3 semanas).</p>';

  var PREGUNTAS = [
    /* ─── COLGAR SIN AGUJEROS ─── */
    ['colgar', 1, '¿Se cuelga sin herramientas ni agujeros en la pared?',
      '<p>Sí. Puedes colgar tus cuadros <b>en segundos, sin ser ningún manitas y sin dejar la pared llena de agujeros</b>.</p>'
      + '<p>Es muy fácil: pega el <b>papel protector</b> en la pared, donde quieras el cuadro, y coloca encima el <b>imán</b>, en el centro. Solo con acercar el cuadro a la base, <b>se engancha y queda perfectamente sujeto</b>.</p>'
      + '<p>Si no te convence cómo ha quedado, lo <b>mueves sin ningún problema</b>, y puedes <b>intercambiar cuadros cuando y como quieras</b>. Y si quieres quitarlo definitivamente, despegas la base adhesiva de la pared y <b>no deja ningún rastro</b>.</p>'],
    ['colgar', 1, '¿En qué paredes se puede pegar la base?',
      '<p>Las bases adhesivas están diseñadas para ser <b>versátiles, reutilizables y respetuosas con las paredes</b>, para que puedas colocarlas prácticamente en cualquier sitio.</p>'
      + '<p>Lo ideal son las <b>paredes lisas y pintadas</b>, aunque muchos clientes también las han colocado con éxito en: pintura plástica, azulejo, madera lacada, cristal, puertas de armario, paredes con textura, ladrillo o cemento, estuco, revestimientos de madera y papel pintado.</p>'
      + '<p><b>¿Por qué se adhieren tan bien?</b> Nuestro adhesivo está diseñado para ser resistente pero delicado con las superficies: sujeta firme, se retira limpiamente y se puede reutilizar muchas veces.</p>'
      + '<ul><li><b>Fáciles de retirar:</b> se despegan limpiamente, sin dañar la pintura ni dejar residuos.</li>'
      + '<li><b>Reutilizables:</b> cambia cada cuadro de sitio las veces que quieras sin que pierda adherencia.</li>'
      + '<li><b>Sujeción duradera:</b> están pensados para seguir firmes durante años.</li></ul>'
      + AVISO_PARED + '<p>Si dudas, escríbenos sin problema.</p>'],
    ['colgar', 1, '¿Deja marca al quitarlo?',
      '<p>No. El cuadro <b>se separa del imán sin esfuerzo</b> y la base adhesiva se retira tirando despacio, en paralelo a la pared. <b>No quedan agujeros ni marcas de taladro</b>.</p>'],
    ['colgar', 0, '¿Se ve el imán una vez colgado?',
      '<p>No. El imán va justo detrás, en el centro del cuadro, así que una vez colgado <b>solo se ve tu foto, como si flotara en la pared</b>.</p>'],
    ['colgar', 1, 'Paso a paso para colgarlo',
      '<p>¡Tus cuadros Momenturies ya han llegado! Ahora viene la parte más divertida: colocarlos en la pared. <b>Sin clavos, sin herramientas y sin complicaciones.</b></p>'
      + '<p><b>Paso 1. Prepara la pared.</b> Límpiala con un paño seco para quitar el polvo. Una superficie limpia ayuda a que el adhesivo se fije firmemente y a que tus cuadros sigan perfectos durante más tiempo.</p>'
      + '<p><b>Paso 2. Planifica la distribución.</b> Coloca primero los cuadros en el suelo o en una mesa para probar combinaciones, distribuciones y separaciones. Si creaste tu pared en el editor, básate en la combinación que elegiste.</p>'
      + '<ul><li>Decide cómo quieres distribuirlos <b>antes de quitar el papel protector</b> del adhesivo.</li><li>Así evitas que la almohadilla adhesiva pierda fuerza antes de llegar a la pared.</li></ul>'
      + '<p class="fq-nota">💡 <b>¿Necesitas inspiración?</b> Mira las composiciones ya diseñadas en <a href="paredes.html">Paredes de ensueño</a>.</p>'
      + '<p><b>Paso 3. Mide y nivela.</b> Si quieres una composición ordenada, simétrica o en cuadrícula, usa una cinta métrica o un nivel para que la separación entre cuadros sea igual.</p>'
      + '<p><b>Paso 4. Coloca tus cuadros.</b></p>'
      + '<ol><li><b>Pega el papel protector y el imán en la pared:</b> el papel en el punto exacto donde quieras el cuadro y, encima, el imán centrado.</li>'
      + '<li><b>Fija el cuadro:</b> alinea la placa de la parte de atrás del cuadro con el imán de la pared.</li>'
      + '<li><b>Ajusta y endereza:</b> gracias al sistema magnético, lo mueves fácilmente hasta dejarlo en la posición perfecta.</li></ol>'
      + '<p>¡Así de fácil! <b>Sin clavos, sin taladros y sin complicaciones.</b></p>'],
    ['colgar', 0, '¿Cómo muevo, intercambio o retiro mis cuadros?',
      '<p>Tanto si te mudas como si quieres cambiar la decoración o renovar tus cuadros porque tienes un motivo (un viaje, la familia, un acontecimiento importante o lo que te apetezca), con Momenturies es muy sencillo:</p>'
      + '<ul><li><b>Intercambiarlos</b> entre ellos y cambiar las combinaciones a tu gusto.</li>'
      + '<li><b>Retirar</b> los que ya no quieras y poner los nuevos en su sitio.</li>'
      + '<li>Todo <b>sin dañar las paredes ni hacer más agujeros</b>.</li></ul>'
      + '<p><b>Si quieres retirarlo todo, base adhesiva incluida:</b> quita primero el cuadro, después coge el papel protector por una esquina y despégalo despacio. Si lo colocaste siguiendo nuestras indicaciones, <b>la pared quedará como estaba, sin ninguna marca</b>.</p>'],
    ['colgar', 0, '¿Tus cuadros se despegan o se caen? Así lo solucionas',
      '<p>Si tus cuadros se caen o no se sujetan con la firmeza que deberían, o el imán o el papel protector tampoco aguantan, sigue estos pasos:</p>'
      + '<p><b>Paso 1. Limpia siempre la pared antes de colocar nada.</b> Con el tiempo, el polvo y la suciedad se acumulan y debilitan el adhesivo. Pasa un paño limpio y seco por la zona antes de volver a colocar los cuadros: una superficie lisa y sin polvo ayuda a que el imán y el papel protector se fijen mejor.</p>'
      + AVISO_PARED
      + '<p><b>Paso 2. Vuelve a colocarlo bien.</b> Pega el papel protector en la pared y, después, el imán en el centro del papel. <b>Aprieta firmemente unos segundos</b> para que quede bien adherido antes de colgar el cuadro. Alinea la placa metálica de detrás del cuadro con el imán de la pared: notarás cómo se pegan y podrás ajustar la posición a tu gusto. Si se pegan con firmeza, el cuadro no debería caerse.</p>'
      + '<p><b>Paso 3. Prueba otra ubicación.</b> Algunos acabados, como las pinturas muy brillantes o las superficies rugosas, dificultan la adherencia. Prueba en otra zona cercana de la pared: una superficie más lisa suele dar mejores resultados.</p>'
      + '<p><b>Paso 4. ¿Siguen sin sujetarse?</b> Si después de seguir estas indicaciones tus cuadros se caen o los imanes parecen haber perdido fuerza, <b>escríbenos</b> a ' + MAIL + ' y te ayudaremos a encontrar la mejor solución para que vuelvas a disfrutarlos con tranquilidad.</p>'],
    ['colgar', 0, '¿Lo puedo poner en la cocina o en el baño?',
      '<p>Sí. El aluminio <b>no absorbe la humedad ni se ondula</b> como el papel. Evita solo el agua directa, como dentro de la ducha, y el calor del fuego justo encima.</p>'],

    /* ─── EL CUADRO ─── */
    ['producto', 1, '¿Qué son los cuadros metálicos de Momenturies?',
      '<p><b>Tu foto impresa en alta definición directamente sobre aluminio.</b></p>'
      + '<ul><li><b>Cuadro metálico:</b> no se dobla ni se arruga; es rígido y mucho más duradero.</li>'
      + '<li><b>Impresión HD:</b> acabado brillante, con colores más vivos, nítido y con efecto reflejo. Sin sobrecoste por marco ni cristal.</li>'
      + '<li><b>Imán premium:</b> olvídate de herramientas y agujeros. Colocas el imán y cuelgas tu cuadro sin esfuerzo ni daños.</li>'
      + '<li><b>Base adhesiva:</b> se pega en la pared y la protege. El imán va encima, en el centro, listo para colgar el cuadro.</li></ul>'
      + '<p><b>Dedicatoria:</b> si quieres, puedes añadir unas palabras para quien más te importa, gratis.</p>'],
    ['producto', 1, '¿Qué diferencia hay entre un cuadro metálico y uno tradicional?', tablaCompara],
    ['producto', 1, 'Tamaños y precios',
      '<p>El cuadro va en <b>tres formatos</b> (cuadrado, clásico y retrato), cada uno en varios tamaños:</p>' + tablaTamanos
      + '<p class="fq-nota">IVA e imán incluidos en todos los precios. Y si pides varios, <b>hasta un 20 % de descuento</b>. Para elegir tu tamaño ideal, entra en <a href="cuadro.html">Diseña tu pared</a>.</p>'],
    ['producto', 0, '¿Cómo es el acabado? ¿Brilla mucho?',
      '<p>Es <b>acabado brillo</b>: los colores tienen mucha profundidad y los negros salen muy negros. Como toda superficie brillante, frente a una ventana puede dar algún reflejo. En una pared sin luz directa luce más.</p>'],
    ['producto', 0, '¿Qué productos hay?',
      '<p><b>Cuadro</b> para la pared, en tres formatos. <b>Sobremesa</b>, con peana de bambú, para una estantería o la mesa. Y el <b>Imán</b> para la nevera. También vendemos el <a href="colgador-iman.html">colgador de imán</a> suelto.</p>'],
    ['producto', 0, '¿Cómo se limpia?',
      '<p>Con un <b>paño suave, seco o un poco húmedo</b>. Sin productos abrasivos ni estropajos.</p>'],

    /* ─── DISEÑA Y VISUALIZA ─── */
    ['editor', 1, 'Mira cómo queda en tiempo real antes de comprar',
      '<p>Gracias a nuestro editor, en cuanto subes tu foto <b>ves cómo queda todo</b>: tu cuadro, tu dedicatoria (si la has puesto), en el rincón de casa donde lo vas a colgar y con la combinación de cuadros que más te guste. <b>Todo desde tu móvil, sin moverte del sofá.</b></p>'],
    ['editor', 1, '¿Puedo ver cómo queda en cada lugar de mi casa?',
      '<p>Sí. Desde el editor, en tu móvil, lo ves <b>en todos los ambientes que quieras</b> para decidir dónde te gusta más: salón, dormitorio, escritorio, cocina, comedor, aparador, escaleras, pasillo… <b>e incluso en tu propia pared, subiendo una foto de ella</b>.</p>'
      + '<p>Todos los ambientes se ven <b>en 2D y en 3D</b>, y en distintos estilos: minimalista, moderno, rústico… Así ves cómo quedaría en tu casa <b>antes de comprar</b>, sin arriesgarte con algo que no sabes si te va a gustar.</p>'],
    ['editor', 1, 'Convierte las fotos de tu galería en realidad: el paso a paso',
      '<ol><li>Elige tus <b>fotos favoritas</b>, esas que tienes olvidadas en la galería.</li>'
      + '<li>Mira <b>cómo quedan</b> antes de comprar.</li>'
      + '<li>Elige el <b>lugar</b> donde quieres colgarlas y la <b>combinación</b> que más te guste.</li>'
      + '<li>Añade una <b>dedicatoria</b>, si quieres. ¡Y listo!</li></ol>'
      + '<p>Muy pronto tendrás tus cuadros en casa, <b>listos para colgar en segundos y sin daños en la pared</b>.</p>'],
    ['editor', 0, 'Paredes de ensueño: ¿qué son?',
      '<p>Sabemos que muchas veces no nos atrevemos a comprar más de un cuadro por miedo a que no quede bien, y es normal. Por eso en <a href="paredes.html">Paredes de ensueño</a> tienes <b>composiciones ya diseñadas</b> para elegir la tuya.</p>'
      + '<p>Eliges la pared, subes las fotos que quieres convertir en realidad, la ves en cualquier rincón de casa y, si quieres, la <b>adaptas a tu gusto</b> en el editor. No tengas miedo a decorar tu casa como te apetezca: <b>empieza a crear tu pared de ensueño</b>.</p>'],
    ['editor', 0, '¿Cómo elijo la combinación que más me gusta?',
      '<p>Tienes dos caminos:</p>'
      + '<ul><li><b>Partir de una pared ya diseñada</b> en <a href="paredes.html">Paredes de ensueño</a>.</li>'
      + '<li><b>Crear la tuya</b> en el editor, con el tamaño y la forma que más te gusten o que necesites para tu espacio.</li></ul>'
      + '<p>En los dos casos la ves colgada antes de pagar, así que no hay riesgo de equivocarte.</p>'],
    ['editor', 0, '¿Cómo sé cómo quedará la composición?',
      '<p>Al elegir una composición se abre el editor con ella puesta. Subes tus fotos y eliges la estancia (salón, dormitorio, pasillo…), y <b>la ves colgada a escala antes de pagar</b>. Puedes cambiar las fotos y el orden todas las veces que quieras.</p>'],
    ['editor', 0, '¿Puedo combinar tamaños y estilos distintos en un mismo pedido?',
      '<p>¡Sí! Puedes <b>combinar cuadros de diferentes tamaños y estilos</b> en un mismo pedido. 🎉</p>'
      + '<ol><li>Sube tus fotos.</li><li>Toca cada foto para elegir su tamaño o su estilo por separado.</li></ol>'
      + '<p>Así creas una composición totalmente personalizada. También puedes partir de una de nuestras <a href="paredes.html">Paredes de ensueño</a>, que ya combinan tamaños y estilos, y <b>modificarla a tu gusto</b>.</p>'],
    ['editor', 0, 'No sé si cabrá donde quiero colgarlo',
      '<p>Sin problema. En el editor ves <b>el tamaño real de cada cuadro y de la composición entera</b>, con los espacios entre ellos, así que te aseguras de que <b>cabe seguro</b> en tu sitio.</p>'],

    /* ─── TUS FOTOS ─── */
    ['fotos', 1, '¿Qué calidad tienen que tener mis fotos?',
      '<p>Queremos que tus cuadros salgan con la mejor calidad posible, así que te pedimos que <b>subas tus fotos con la máxima resolución</b> que tengas. Una foto hecha con el móvil y guardada a tamaño completo va bien; las capturas de pantalla y las fotos reenviadas por WhatsApp llegan comprimidas. Si una foto se queda corta para el tamaño que eliges, <b>el editor te avisa antes de pagar</b>.</p>'
      + '<p>Si alguna foto no llega a nuestro estándar de impresión, <b>la mejoramos con nuestra IA antes de imprimirla, sin coste para ti</b>. Lo hacemos para que el resultado final sea el mejor posible, aunque nos suponga un coste añadido.</p>'
      + '<p class="fq-nota">Al hacer el pedido aceptas esta mejora. Si prefieres que no usemos la IA en tus fotos, avísanos al hacer el pedido; en ese caso, la calidad de impresión de esa foto no será motivo de reclamación.</p>'],
    ['fotos', 1, '¿Cómo recorto y ajusto mis fotos antes del pedido?',
      '<p>En el editor, <b>toca la foto y adáptala a tu gusto</b>:</p>'
      + '<ul><li><b>Ajustar el recorte:</b> elige la parte de la foto que quieres en tu cuadro.</li>'
      + '<li><b>Centrar la imagen:</b> mueve y recoloca la foto hasta conseguir el encuadre perfecto.</li>'
      + '<li><b>Horizontal o vertical:</b> colócala como mejor te venga.</li></ul>'
      + '<p>Así compruebas cómo quedará antes de confirmar la compra. ¡Consigue el encuadre perfecto y crea tus cuadros tal y como los imaginas!</p>'],
    ['fotos', 0, '¿Puedo cambiar las fotos una vez comprado?',
      '<p>Los cuadros Momenturies son <b>una única pieza con todo integrado</b>. Una vez impresa la foto sobre el aluminio y colocada la placa metálica para el imán, no se puede deshacer, así que <b>la foto no se puede cambiar ni sustituir</b>. Gracias a este diseño de una sola pieza, el acabado es impecable y te llega listo para colgar, exactamente como lo diseñaste.</p>'
      + '<p><b>¡Pero renovar tu decoración es muy sencillo!</b> Crea un nuevo conjunto con tus fotos más recientes en unos clics y combínalo con los cuadros que ya tienes para darle un aire nuevo a tus paredes siempre que quieras. Sin clavos, sin herramientas y sin complicaciones.</p>'],
    ['fotos', 0, '¿Qué hacéis con mis fotos?',
      '<p>Las usamos <b>solo para fabricar tu pedido</b>. No las publicamos ni se las damos a nadie. Lo explicamos en la <a href="privacidad.html">política de privacidad</a>.</p>'],
    ['fotos', 0, '¿Y si no tengo una foto mía?',
      '<p>Puedes elegir una obra de nuestra <a href="galeria.html">galería de arte</a> o crear un <a href="personalizados.html">diseño personalizado</a>: un cielo estrellado o el mapa de un sitio importante para ti.</p>'],

    /* ─── PRECIOS Y PEDIDO ─── */
    ['pedido', 1, '¿Cómo funcionan los descuentos por cantidad?',
      '<p><b>Cuantos más cuadros, menos pagas por cada uno:</b></p>'
      + '<ul><li>2 cuadros: <b>-10 %</b></li><li>3 o 4 cuadros: <b>-15 %</b></li><li>5 o más: <b>-20 %</b></li></ul>'
      + '<p>El descuento <b>se aplica solo en el carrito</b> y puedes mezclar tamaños y productos.</p>'],
    ['pedido', 1, '¿Cómo cancelo o edito mi pedido?',
      '<p>¡Lo entendemos perfectamente! A veces los planes cambian.</p>'
      + '<p>Podemos cancelar o editar tu pedido <b>siempre que todavía no haya entrado en producción</b>; una vez en producción, ya no admitimos cancelaciones ni cambios. Lo mejor es <b>escribirnos cuanto antes</b> a ' + MAIL + ' con tu número de pedido y lo que quieres cambiar.</p>'
      + '<p>Haremos todo lo posible por gestionarlo antes de que entre en producción y te enviaremos la confirmación por correo electrónico.</p>'],
    ['pedido', 0, '¿Cómo consulto el estado y los detalles de mi pedido?',
      '<p><b>Revisa tu correo electrónico.</b> Justo después de hacer el pedido te enviamos una confirmación al email que usaste en la compra, con:</p>'
      + '<ul><li><b>Fotos o productos pedidos:</b> qué cuadros has pedido y qué imágenes elegiste.</li>'
      + '<li><b>Dirección de envío:</b> para comprobar que los datos de entrega son correctos.</li>'
      + '<li><b>Número de pedido:</b> tu identificador de compra, para cualquier consulta.</li>'
      + '<li><b>Importe total pagado:</b> el resumen del pago.</li></ul>'
      + '<p class="fq-nota">💡 <b>Consejo:</b> guarda el correo de confirmación hasta que recibas tu pedido. También puedes ver tus pedidos en <a href="cuenta.html">Mi cuenta</a> con el mismo email.</p>'],
    ['pedido', 0, '¿Cómo puedo pagar?',
      '<p>Con tarjeta y con los demás medios que te enseña el <b>pago seguro</b> de nuestra tienda, que funciona con Shopify. Nosotros nunca vemos ni guardamos los datos de tu tarjeta.</p>'],
    ['pedido', 0, '¿Necesito una cuenta para comprar?',
      '<p>No. Puedes <b>pedir como invitado</b>. Si quieres ver tus pedidos más adelante, entra en <a href="cuenta.html">Mi cuenta</a> con el mismo email: te llega un código y no hace falta contraseña.</p>'],

    /* ─── PRODUCCIÓN Y ENVÍO ─── */
    ['envio', 1, '¿Cuánto tarda en llegar?',
      '<ul><li><b>Producción:</b> de 24 a 72 h.</li><li><b>Envío</b> (después de la producción): <b>desde 24 h hasta 7 días laborables</b>, según el destino y el tipo de envío.</li></ul>'
      + '<p>Antes de pagar verás el plazo y el precio exactos.</p>'],
    ['envio', 0, '¿Cuánto cuesta el envío?',
      '<p>En España, 4,95 € el estándar y <b>gratis a partir de 60 €</b>. El exprés cuesta 9,95 €. A Portugal, 6,95 € (gratis desde 80 €). Al resto de la Unión Europea, 9,95 € (gratis desde 100 €). Tienes el detalle en <a href="envios.html">Envíos y devoluciones</a>.</p>'],
    ['envio', 0, '¿Enviáis fuera de España?',
      '<p>Sí, a <b>Portugal y al resto de la Unión Europea</b>. Fuera de la UE, de momento, no enviamos.</p>'],
    ['envio', 0, '¿Llega bien protegido?',
      '<p>Sí. Cada pieza va protegida para que llegue <b>sin golpes ni rayas</b>. Si aun así llega dañada, te la reimprimimos gratis.</p>'],

    /* ─── GARANTÍA Y DEVOLUCIONES ─── */
    ['garantia', 1, 'Política de devoluciones y reembolsos',
      '<p>En Momenturies nuestro objetivo es muy sencillo: <b>que estés completamente satisfecho con tu pedido</b>. Cada conjunto de cuadros se fabrica con especial cuidado, y por eso lo respaldamos con nuestra <b>Garantía de Satisfacción</b>. Si algo no sale como esperabas, haremos todo lo posible por solucionarlo.</p>'
      + '<p><b>Productos personalizados.</b> Todos nuestros cuadros se fabrican exclusivamente para ti, con tus fotos y las opciones que hayas elegido. Por eso <b>no aceptamos devoluciones por cambio de opinión</b>. Pero sabemos que pueden surgir imprevistos, y para eso existe nuestra garantía. Estas son algunas situaciones en las que te ayudamos:</p>'
      + '<ul><li><b>Problemas de calidad:</b> si tus cuadros llegan dañados, tienen un defecto de fabricación o no cumplen lo esperado, <b>sustituimos los afectados sin ningún coste</b>.</li>'
      + '<li><b>Problemas con el envío:</b> si tu pedido se pierde, se retrasa o llega dañado durante el transporte, lo solucionamos contigo lo antes posible.</li>'
      + '<li><b>Cualquier otra incidencia:</b> aunque sea un pequeño detalle, queremos escucharte y encontrar una solución para que disfrutes plenamente de tus cuadros.</li></ul>'
      + '<p>Si tienes cualquier problema, escríbenos a ' + MAIL + '. <b>¡Tu satisfacción es lo más importante para nosotros!</b></p>'],
    ['garantia', 1, '¿Y si llega dañado?',
      '<p><b>Lo reimprimimos y te lo reenviamos sin coste.</b> Escríbenos con una foto en los 14 días siguientes a la entrega; no hace falta que nos devuelvas el primero.</p>'],
    ['garantia', 0, '¿Puedo devolverlo si cambio de opinión?',
      '<p>Cada pieza se fabrica con tu foto, así que <b>no tiene derecho de desistimiento</b> (art. 103.c de la Ley General para la Defensa de los Consumidores). Por eso te dejamos <b>verlo en tu pared antes de pagar</b>. Si llega con un defecto, lo reimprimimos. El colgador de imán suelto sí se puede devolver en 14 días.</p>'],
    ['garantia', 0, 'Mi pedido no llega. ¿Qué hago?',
      '<p>Cuando sale el paquete te mandamos un email con el seguimiento. Si ha pasado el plazo y no lo tienes, <b>escríbenos con tu número de pedido</b> y lo buscamos con la empresa de transporte.</p>'],

    /* ─── REGALO Y DEDICATORIA ─── */
    ['regalo', 1, '¿Puedo mandarlo directamente como regalo?',
      '<p>Sí. Pones <b>una dirección de entrega distinta a la tuya</b> y añades una nota en los comentarios del pedido. <b>El precio no aparece dentro del paquete</b>, y la dedicatoria la lee solo quien lo abra.</p>'],
    ['regalo', 1, '¿Cómo funciona la dedicatoria?',
      '<p>Puedes añadir unas palabras a tu gusto, <b>por delante o por detrás</b>, adaptadas a tu imagen, con el <b>tamaño, la tipografía y el color que quieras</b>. <b>Sin ningún coste añadido.</b></p>'],
    ['regalo', 0, '¿Llega a tiempo para una fecha concreta?',
      '<p>Si pides con <b>al menos 10 días laborables de margen</b>, normalmente sí. Para fechas justas, elige el envío exprés y escríbenos: haremos lo posible por adelantarlo.</p>']
  ];

  window.MM_FAQ = { temas: TEMAS, preguntas: PREGUNTAS };

  /* Pinta una lista con chips de filtro. «Todas» = destacadas de cada tema, agrupadas por tema.
     opciones: { chips, lista, grupos (true = con título de tema), verTodas (texto del enlace por tema o null) } */
  window.mmPintaFaq = function(o){
    var chips = o.chips, lista = o.lista; if(!lista) return;
    var nombre = {}; TEMAS.forEach(function(t){ nombre[t[0]] = t[1]; });
    var det = function(p){ return '<details data-t="' + p[0] + '"><summary>' + p[2] + '</summary><div class="fq-a">' + p[3] + '</div></details>'; };
    var pinta = function(t){
      var html = '';
      TEMAS.forEach(function(tm){
        if(t !== '*' && t !== tm[0]) return;
        var ps = PREGUNTAS.filter(function(p){ return p[0] === tm[0] && (t !== '*' || p[1]); });
        var total = PREGUNTAS.filter(function(p){ return p[0] === tm[0]; }).length;
        if(o.grupos) html += '<section class="fq-group" id="' + tm[0] + '"><h2>' + tm[1] + '</h2>';
        html += ps.map(det).join('');
        if(o.grupos && t === '*' && total > ps.length) html += '<button type="button" class="fq-mas" data-t="' + tm[0] + '">Ver las ' + total + ' preguntas de este tema →</button>';
        if(o.grupos) html += '</section>';
      });
      lista.innerHTML = html;
    };
    var elige = function(t, desplaza){
      if(chips) [].forEach.call(chips.querySelectorAll('button'), function(b){ b.classList.toggle('on', b.dataset.t === t); b.setAttribute('aria-pressed', b.dataset.t === t);
        if(b.dataset.t === t && chips.scrollWidth > chips.clientWidth) chips.scrollLeft = b.offsetLeft - (chips.clientWidth - b.offsetWidth) / 2; });
      pinta(t);
      if(desplaza && chips) window.scrollTo({ top: chips.getBoundingClientRect().top + window.pageYOffset - 10, behavior: 'smooth' });
    };
    if(chips){
      chips.innerHTML = '<button type="button" data-t="*">Todas</button>' + TEMAS.map(function(t){ return '<button type="button" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('');
      chips.addEventListener('click', function(e){ var b = e.target.closest('button'); if(b) elige(b.dataset.t, false); });
    }
    lista.addEventListener('click', function(e){ var b = e.target.closest('.fq-mas'); if(b) elige(b.dataset.t, true); });
    var h = (location.hash || '').slice(1);
    elige(o.hashes && nombre[h] ? h : '*', false);
    return elige;
  };

  /* datos estructurados FAQPage con todas las preguntas (solo donde se pide) */
  window.mmFaqLd = function(){
    var div = document.createElement('div');
    var qs = PREGUNTAS.map(function(p){ div.innerHTML = p[3];
      return { '@type':'Question', name: p[2], acceptedAnswer: { '@type':'Answer', text: div.textContent.replace(/\s+/g, ' ').trim() } }; });
    var s = document.createElement('script'); s.type = 'application/ld+json';
    s.textContent = JSON.stringify({ '@context':'https://schema.org', '@type':'FAQPage', mainEntity: qs });
    document.head.appendChild(s);
  };
})();
