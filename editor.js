/* editor.js — motor del personalizador 3D de Momenturies.
   Extraído tal cual de producto.html. Se incluye en las páginas de producto
   dedicadas (cuadro.html / sobremesa.html / iman.html).

   REQUISITOS en la página que lo cargue, en este orden y ANTES de este archivo:
     <link rel="stylesheet" href="editor.css">
     <script src="https://cdn.jsdelivr.net/npm/three@0.158.0/build/three.min.js"></script>
     <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.2/dist/gsap.min.js"></script>
   Y un botón con id="btnOpenEditor" para abrir el editor.

   Configuración por página (opcional), antes de cargar este archivo:
     <script>window.MOMENTURIES_EDITOR = { product: 'nevera', lock: true };</script>
   product: 'metal' | 'madera' | 'nevera'   lock: oculta el selector de formato.
   wall: 'P12' abre el editor con esa pared prediseñada (también ?pared=P12 en la URL).
   Las paredes vienen de paredes.js (window.MOMENTURIES_WALLS), que debe cargarse ANTES.
   Sin configuración se comporta igual que producto.html (formato 'metal', editable). */

(function injectEditorMarkup(){
  if (document.getElementById('editor')) return;   // ya está en la página (p.ej. producto.html)
  var HTML = `<!-- ══════════ EDITOR A PANTALLA COMPLETA ══════════ -->
<div class="editor" id="editor">
  <div id="pvStage">
    <canvas id="pvCanvas"></canvas>
    <div class="pv-badge" id="pvBadge">3D · GÍRALO</div>
    <div class="pv-hint" id="pvHint"><span class="es">Arrastra para girar · rueda o pellizco para zoom · toca un cuadro para editarlo</span><span class="en">Drag to rotate · scroll or pinch to zoom · tap a print to edit it</span></div>
    <div class="pv-zoom" id="pvZoom">
      <button type="button" id="pvZoomIn" title="Acercar" aria-label="Acercar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button type="button" id="pvZoomOut" title="Alejar" aria-label="Alejar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button type="button" id="pvBruma" class="pv-bruma" title="Bruma de los bordes: quitar / poner" aria-label="Bruma de los bordes" aria-pressed="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 9h16M3 13h18M5 17h14"/></svg>
      </button>
    </div>
  </div>

  <header class="ed-top">
    <button class="ed-close" id="edClose">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      <span class="es">Salir</span><span class="en">Exit</span>
    </button>
    <div class="ed-logo">
      <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
        <rect x="2.6" y="3.5" width="11.4" height="14.9" rx="1.1" fill="#1a1a1a"/>
        <rect x="15.8" y="3.5" width="9.6" height="7.9" rx="1.1" fill="#c2613a"/>
        <rect x="15.8" y="13.1" width="9.6" height="11.4" rx="1.1" fill="#1a1a1a"/>
        <rect x="2.6" y="20.1" width="11.4" height="4.4" rx="1.1" fill="#c2613a"/>
      </svg>
      <span class="ed-logo-word">Momenturies</span>
    </div>
    <button class="ed-cart" id="addToCart">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      <span id="cartLabel"><span class="es">Sube tu foto</span><span class="en">Upload your photo</span></span><span id="cartTotal"></span>
    </button>
  </header>

  <!-- Mandos del entorno: arriba, siempre a la vista. Abajo solo queda lo de las fotos. -->
  <div class="ed-tools" id="edTools">
    <div class="ed-tool" id="toolWall">
      <button type="button" class="ed-tool-btn" id="btnWallChange">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
        <span class="ed-tool-txt">
          <small><span class="es">Conjunto</span><span class="en">Set</span></small>
          <b id="edWallName"><span class="es">Uno suelto</span><span class="en">Single print</span></b>
        </span>
      </button>
      <button type="button" class="ed-tool-x" id="btnWallFree" hidden title="Quitar el conjunto">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <!-- tamaño del conjunto entero: solo en los conjuntos de una sola talla (ver wallSizes) -->
    <div class="ed-tool ed-tool-size" id="toolSize" hidden>
      <span class="ed-tool-txt">
        <small><span class="es">Tamaño</span><span class="en">Size</span></small>
        <b id="edSizeInfo"></b>
      </span>
      <div class="ed-size-seg" id="edSizeSeg"></div>
    </div>
    <div class="ed-tool" id="toolRoom">
      <button type="button" class="ed-tool-btn" id="btnRoom">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>
        <span class="ed-tool-txt">
          <small><span class="es">Entorno</span><span class="en">Room</span></small>
          <b id="edRoomName"><span class="es">Ninguno</span><span class="en">None</span></b>
        </span>
      </button>
      <button type="button" class="ed-tool-x" id="btnRoomFree" hidden title="Quitar el entorno">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </div>

  <div class="ed-bottom">
    <button type="button" class="ed-suggest" id="edSuggest" hidden></button>
    <div class="pv-thumbs" id="pvThumbs"></div>
    <div class="ed-btnrow">
    <button class="ed-add" id="btnAdd">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <span class="es">Añadir fotos</span><span class="en">Add photos</span>
    </button>
    <!-- Solo en móvil (ver .ed-btnrow en editor.css): atajos con icono a lo mismo que ya se
         puede hacer tocando el centro de la foto — por si a alguien no se le ocurre tocar ahí. -->
    <button class="ed-size-ic" id="btnSizeIc" type="button" title="Tamaño" hidden>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 21v-4a3 3 0 0 1 3-3h4"/></svg>
      <span class="es">Tamaño</span><span class="en">Size</span>
    </button>
    <button class="ed-edit-ic" id="btnEditIc" type="button" title="Editar" hidden>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
      <span class="es">Editar</span><span class="en">Edit</span>
    </button>
    <button class="ed-walls" id="btnWalls" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
      <span class="es">Paredes de ensueño</span><span class="en">Dream walls</span>
    </button>
    </div>
    <button class="ed-sample" id="btnSample" type="button"><span class="es">o prueba con una foto de ejemplo</span><span class="en">or try a sample photo</span></button>
  </div>

  <!-- panel del póster seleccionado (tamaño + encuadre + variaciones) -->
  <aside class="ed-panel" id="edPanel">
    <div class="edp-head">
      <p class="edp-title"><b id="edpNum">1</b><span id="edpDims">Cuadro · 21×29,7 cm</span></p>
      <div class="edp-actions">
        <button class="edp-icon" id="edpDelete" title="Eliminar cuadro">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
        <button class="edp-icon" id="edpClose" title="Cerrar">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <p class="edp-price"><span id="currentPrice">29,99€</span><span class="es">IVA incluido</span><span class="en">VAT included</span></p>

    <div class="edp-row2">
      <button class="edp-photo" id="edpPhoto"><span class="es">Cambiar foto</span><span class="en">Change photo</span></button>
      <button class="edp-photo" id="edpCrop" style="display:none"><span class="es">Encuadre</span><span class="en">Crop</span></button>
    </div>

    <p class="config-label" id="ptypeLabel"><span class="es">Producto</span><span class="en">Product</span></p>
    <div class="ptype-chips" id="ptypeChips"></div>

    <p class="config-label" id="formatLabel"><span class="es">Formato</span><span class="en">Format</span></p>
    <div class="format-chips" id="formatChips"></div>
    <p class="config-label" id="sizeLabel"><span class="es">Tamaño</span><span class="en">Size</span></p>
    <div class="size-grid" id="sizeGrid"></div>
    <p class="wall-size-note" id="wallSizeNote" hidden></p>

    <p class="config-label"><span class="es">Colgado</span><span class="en">Mounting</span>
      <button class="ver-montaje" id="verMontaje"><span class="es">ver cómo queda</span><span class="en">see how it looks</span></button></p>
    <div class="mount-chips" id="mountChips"></div>
    <p class="mount-note" id="mountNote"></p>

    <div class="txt-block" id="txtBlock">
      <p class="txt-block-title"><span class="es">Texto</span><span class="en">Text</span></p>
      <div class="face-tabs" id="faceTabs" role="group" aria-label="Cara del cuadro">
        <button type="button" class="face-tab active" data-face="front" aria-pressed="true"><span class="es">Delante</span><span class="en">Front</span></button>
        <button type="button" class="face-tab" data-face="back" aria-pressed="false">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg>
          <span class="es">Ver detrás</span><span class="en">See the back</span></button>
      </div>
      <p class="config-label txt-sub"><span class="es">Frase delante</span><span class="en">Front caption</span></p>
      <input class="txt-input" id="frontText" maxlength="42" placeholder="Para siempre juntos">
      <div class="txt-row">
        <div class="font-dd" id="frontFontDD" data-for="frontText"></div>
        <input class="txt-date" id="frontDate" maxlength="12" placeholder="Fecha">
      </div>

      <p class="config-label txt-sub txt-back"><span class="es">Dedicatoria detrás</span><span class="en">Back dedication</span></p>
      <textarea class="txt-area txt-back" id="backText" rows="2" maxlength="140" placeholder="Para mamá, con todo nuestro amor"></textarea>
      <div class="txt-row txt-back">
        <div class="font-dd" id="backFontDD" data-for="backText"></div>
        <input class="txt-date" id="backDate" maxlength="12" placeholder="Fecha">
      </div>
      <p class="txt-hint txt-back"><span class="es">Se imprime detrás del cuadro. Arrástrala para colocarla · la letra se ajusta sola al tamaño.</span><span class="en">Printed on the back. Drag it to place it · the letter size adjusts itself.</span></p>
    </div>
  </aside>

  <input type="file" id="fileInput" accept="image/*" multiple style="display:none">
</div>

<!-- VENTANA: ENCUADRE (como el modal de recorte de Futsides, estilo Momenturies) -->
<div class="mmodal" id="cropModal">
  <div class="mmodal-card">
    <div class="mmodal-head">
      <p class="mmodal-title"><span class="es">Formato y encuadre</span><span class="en">Format and crop</span>
        <span class="qty"><span class="es">arrastra la foto para moverla</span><span class="en">drag the photo to move it</span></span></p>
      <button class="edp-icon" id="cropClose" title="Cerrar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <!-- Formato y talla van AQUÍ, en la misma pantalla que el encuadre — antes se elegían
         por separado en el panel general y esto solo dejaba recortar, así que tocaba salir
         y volver a entrar para cambiar el formato. Al tocarlos se actualiza todo en el sitio:
         la geometría del póster, el precio y la caja de recorte, sin cerrar la ventana. -->

    <div class="format-chips crop-format-chips" id="cropFormatChips"></div>
    <div class="size-grid crop-size-grid" id="cropSizeGrid"></div>
    <div class="crop-stagebox" id="cropBox"><canvas id="cropCanvas"></canvas></div>
    <div class="crop-ctrl">
      <div class="orient-row">
        <button class="orient-btn" id="orientV" onclick="setOrientBtn('portrait')"><span class="es">Vertical</span><span class="en">Portrait</span></button>
        <button class="orient-btn" id="orientH" onclick="setOrientBtn('landscape')"><span class="es">Horizontal</span><span class="en">Landscape</span></button>
      </div>
      <label class="crop-zoom-lbl">Zoom<input type="range" id="cropZoom" min="100" max="300" value="100"></label>
      <button class="crop-reset" id="cropReset"><span class="es">Centrar foto</span><span class="en">Center photo</span></button>
    </div>
    <button class="mm-done" id="cropDone"><span class="es">Listo</span><span class="en">Done</span></button>
  </div>
</div>

<!-- VENTANA: MONTAJE DEL COLGADOR (escena 3D de Futsides con la foto del cliente) -->
<div class="mmodal" id="hangerModal">
  <div class="mmodal-card wide">
    <div class="mmodal-head">
      <p class="mmodal-title"><span class="es" id="hangerTitleEs">Así se cuelga</span><span class="en" id="hangerTitleEn">How it mounts</span>
        <span class="qty"><span class="es">con tu propia foto</span><span class="en">with your own photo</span></span></p>
      <button class="edp-icon" id="hangerClose" title="Cerrar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="mount-chips" id="hangerChips"></div>
    <iframe id="hangerFrame" title="Montaje"></iframe>
    <button class="mm-done" id="hangerDone"><span class="es">Entendido</span><span class="en">Got it</span></button>
  </div>
</div>

<!-- ══════════ CHECKOUT EN LA PROPIA PÁGINA (panel lateral, patrón Mixtiles) ══════════ -->
<div class="co" id="coRoot">
  <div class="co-veil" id="coVeil"></div>
  <aside class="co-panel" role="dialog" aria-modal="true" aria-labelledby="coTitle">
    <div class="co-head">
      <h2 class="co-title" id="coTitle"><span class="es">Tu pedido</span><span class="en">Your order</span></h2>
      <button class="co-x" id="coClose" aria-label="Cerrar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="co-scroll">
      <div class="co-sum" id="coSum"></div>

      <div class="co-steps">

        <section class="co-step" id="coStep-mail">
          <button type="button" class="co-row" data-step="mail">
            <span class="co-ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="M3 6l9 6 9-6"/></svg>
            </span>
            <span class="co-row-txt">
              <span class="co-row-lbl"><span class="es">Añade tu correo electrónico</span><span class="en">Add your email</span></span>
              <span class="co-row-val" id="coVal-mail"></span>
            </span>
            <span class="co-row-edit"><span class="es">Cambiar</span><span class="en">Change</span></span>
          </button>
          <div class="co-body">
            <label class="co-lbl" for="coEmail"><span class="es">Correo electrónico</span><span class="en">Email</span></label>
            <input class="co-in" id="coEmail" type="email" inputmode="email" autocomplete="email" placeholder="tu@email.com"/>
            <p class="co-hint"><span class="es">Te mandamos aquí la confirmación y el seguimiento del envío.</span><span class="en">We send the confirmation and tracking here.</span></p>
            <button type="button" class="co-next" data-next="envio"><span class="es">Continuar</span><span class="en">Continue</span></button>
          </div>
        </section>

        <section class="co-step" id="coStep-envio">
          <button type="button" class="co-row" data-step="envio">
            <span class="co-ico">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h11v10H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>
            </span>
            <span class="co-row-txt">
              <span class="co-row-lbl"><span class="es">Añade la dirección de envío</span><span class="en">Add the shipping address</span></span>
              <span class="co-row-val" id="coVal-envio"></span>
            </span>
            <span class="co-row-edit"><span class="es">Cambiar</span><span class="en">Change</span></span>
          </button>
          <div class="co-body">
            <div class="co-grid2">
              <div><label class="co-lbl" for="coName"><span class="es">Nombre y apellidos</span><span class="en">Full name</span></label>
                <input class="co-in" id="coName" autocomplete="name" placeholder="Marc Mestre"/></div>
              <div><label class="co-lbl" for="coPhone"><span class="es">Teléfono</span><span class="en">Phone</span></label>
                <input class="co-in" id="coPhone" inputmode="tel" autocomplete="tel" placeholder="600 00 00 00"/></div>
            </div>
            <label class="co-lbl" for="coAddr"><span class="es">Dirección</span><span class="en">Address</span></label>
            <input class="co-in" id="coAddr" autocomplete="street-address" placeholder="Calle, número, piso"/>
            <div class="co-grid3">
              <div><label class="co-lbl" for="coZip"><span class="es">C.P.</span><span class="en">Postcode</span></label>
                <input class="co-in" id="coZip" inputmode="numeric" autocomplete="postal-code" placeholder="03700"/></div>
              <div><label class="co-lbl" for="coCity"><span class="es">Ciudad</span><span class="en">City</span></label>
                <input class="co-in" id="coCity" autocomplete="address-level2" placeholder="Dénia"/></div>
              <div><label class="co-lbl" for="coCountry"><span class="es">País</span><span class="en">Country</span></label>
                <select class="co-in" id="coCountry">
                  <option value="ES">España</option>
                  <option value="PT">Portugal</option>
                  <optgroup label="Unión Europea">
                    <option value="DE">Alemania</option>
                    <option value="AT">Austria</option>
                    <option value="BE">Bélgica</option>
                    <option value="BG">Bulgaria</option>
                    <option value="CY">Chipre</option>
                    <option value="HR">Croacia</option>
                    <option value="DK">Dinamarca</option>
                    <option value="SK">Eslovaquia</option>
                    <option value="SI">Eslovenia</option>
                    <option value="EE">Estonia</option>
                    <option value="FI">Finlandia</option>
                    <option value="FR">Francia</option>
                    <option value="GR">Grecia</option>
                    <option value="HU">Hungría</option>
                    <option value="IE">Irlanda</option>
                    <option value="IT">Italia</option>
                    <option value="LV">Letonia</option>
                    <option value="LT">Lituania</option>
                    <option value="LU">Luxemburgo</option>
                    <option value="MT">Malta</option>
                    <option value="NL">Países Bajos</option>
                    <option value="PL">Polonia</option>
                    <option value="CZ">República Checa</option>
                    <option value="RO">Rumanía</option>
                    <option value="SE">Suecia</option>
                  </optgroup>
                </select></div>
            </div>
            <div class="co-ship" id="coShipOpts"></div>
            <button type="button" class="co-next" data-next=""><span class="es">Continuar</span><span class="en">Continue</span></button>
          </div>
        </section>

      </div>
    </div>

    <div class="co-foot">
      <div class="co-foot-total" id="coFootTotal"></div>
      <button class="co-pay" id="coPay"><span class="es">Pagar de forma segura</span><span class="en">Pay securely</span></button>
      <p class="co-legal"><span class="es">El pago se hace en la página segura de la tienda, con tus datos ya rellenados.</span><span class="en">Payment happens on the store's secure page, with your details already filled in.</span></p>
    </div>
  </aside>
</div>

<!-- VENTANA: PAREDES DE ENSUEÑO (composiciones prediseñadas) -->
<div class="mmodal" id="wallModal">
  <div class="mmodal-card wide wall-card">
    <div class="mmodal-head">
      <p class="mmodal-title"><span class="es">Paredes de ensueño</span><span class="en">Dream walls</span>
        <span class="qty"><span class="es">elige la composición y pon una foto en cada cuadro</span><span class="en">pick a layout and put a photo in each print</span></span></p>
      <button class="edp-icon" id="wallClose" title="Cerrar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="wall-filters" id="wallFilters"></div>
    <div class="wall-grid" id="wallGrid"></div>
  </div>
</div>

<!-- VENTANA: ENTORNO (habitación donde se ve la pared) -->
<div class="mmodal" id="roomModal">
  <div class="mmodal-card wide">
    <div class="mmodal-head">
      <p class="mmodal-title"><span class="es">Entorno</span><span class="en">Room</span>
        <span class="qty"><span class="es">la habitación donde ves tu pared</span><span class="en">the room you see your wall in</span></span></p>
      <button class="edp-icon" id="roomClose" title="Cerrar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="room-grid" id="roomGrid"></div>
  </div>
</div>

<!-- VENTANA: VER EN MI PARED (foto del cliente, calibrada con dos puntos) -->
<div class="mmodal" id="myWallModal">
  <div class="mmodal-card wide mywall-card">
    <div class="mmodal-head">
      <p class="mmodal-title"><span class="es">Ver en mi pared</span><span class="en">See it on my wall</span>
        <span class="qty" id="mywallStep"></span></p>
      <button class="edp-icon" id="mywallClose" title="Cerrar">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="mywall-stage" id="mywallStage">
      <canvas id="mywallCanvas"></canvas>
      <div class="mywall-empty" id="mywallEmpty">
        <button type="button" class="ed-add" id="mywallPick"><span class="es">Subir una foto de mi pared</span><span class="en">Upload a photo of my wall</span></button>
        <p><span class="es">Hazla de frente y que salga la pared entera. Si en la foto se ve una puerta, un enchufe o el techo, con eso nos vale para saber el tamaño.</span><span class="en">Shoot it straight on with the whole wall in frame. If a door, a socket or the ceiling is visible, that's all we need to work out the scale.</span></p>
      </div>
    </div>
    <p class="mywall-hint" id="mywallHint"></p>
    <div class="mywall-ref" id="mywallRefRow" hidden>
      <span class="mywall-ref-lbl"><span class="es">La línea que has puesto va de punta a punta de…</span><span class="en">The line you placed goes across…</span></span>
      <div class="mywall-chips" id="mywallChips"></div>
      <label class="mywall-len" id="mywallLenRow" hidden><span class="es">Y mide</span><span class="en">And it measures</span> <input type="number" id="mywallCm" value="180" min="5" max="900" step="1"> cm</label>
    </div>
    <div class="mywall-btns">
      <button type="button" class="edp-photo" id="mywallBack"><span class="es">Atrás</span><span class="en">Back</span></button>
      <button type="button" class="mm-done" id="mywallNext"><span class="es">Siguiente</span><span class="en">Next</span></button>
    </div>
    <input type="file" id="mywallFile" accept="image/*" hidden>
  </div>
</div>

<div class="toast" id="toast"></div>`;
  document.body.insertAdjacentHTML('beforeend', HTML);
})();

/* ══════════ ESTADO DEL ENTORNO (arriba del todo a propósito) ══════════
   layout() se ejecuta ya en el arranque y consulta ROOM_CFG, así que estas variables tienen
   que existir antes que cualquier función. Declararlas a mitad de fichero petaba con
   "Cannot access 'ROOM_CFG' before initialization".
   mode:
     'none'  sin entorno: el cuadro sobre el fondo del editor. Es lo que se ve al entrar en
             un producto suelto: la parte simple del personalizador.
     'geo'   una de las habitaciones dibujadas (SCENES)
     'photo' una foto: las nuestras (fotos/entornos) o la que sube el cliente ({custom:true})
   VIEW:
     '3d'    se puede girar · '2d' de frente y quieto, como una foto de la pared */
const ROOM_CFG = { mode: 'none', scene: 'salon-sofa' };
let VIEW = '3d';
const isFlat = () => VIEW === '2d';
/* ── TIPOGRAFÍAS del texto delante/detrás. Antes solo existía una (Georgia, fija en el
   código, sin selector). google=null es la que ya venía con el navegador; el resto se
   cargan de Google Fonts en una sola petición nada más arrancar el editor. */
/* 12-oct · Favoritas arriba (fav): las que más se usan para una dedicatoria, con la de máquina de
   escribir la primera después de la de siempre. El resto va debajo, en «Más letras».
   Las fuentes NO se descargan todas al abrir: la hoja de Google solo las declara, y cada una baja
   cuando se enseña en la lista o cuando se usa (ensureFont). */
/* 12-oct · Marc: fuera la frase de delante (sobre la foto). El código se queda; con true vuelve. */
const FRONT_TEXT = false;
const FONTS = [
  { id:'georgia',    label:'Clásica',    family:'Georgia, "Times New Roman", serif',        weight:'700', style:'italic', google:null, fav:true },
  { id:'typewriter', label:'Máquina de escribir', family:'"Special Elite", "Courier New", monospace', weight:'400', style:'normal', google:'Special+Elite', fav:true },
  { id:'dancing',    label:'Manuscrita', family:'"Dancing Script", cursive',                 weight:'700', style:'normal', google:'Dancing+Script:wght@600;700', fav:true },
  { id:'caveat',     label:'A mano',     family:'"Caveat", cursive',                         weight:'700', style:'normal', google:'Caveat:wght@600;700', fav:true },
  { id:'playfair',   label:'Elegante',   family:'"Playfair Display", Georgia, serif',        weight:'700', style:'normal', google:'Playfair+Display:wght@600;700', fav:true },
  { id:'montserrat', label:'Moderna',    family:'"Montserrat", Arial, sans-serif',           weight:'700', style:'normal', google:'Montserrat:wght@600;700', fav:true },
  { id:'courier',    label:'Máquina fina', family:'"Courier Prime", "Courier New", monospace', weight:'400', style:'normal', google:'Courier+Prime:wght@400;700' },
  { id:'cormorant',  label:'Fina',       family:'"Cormorant Garamond", Georgia, serif',      weight:'600', style:'normal', google:'Cormorant+Garamond:wght@600;700' },
  { id:'marcellus',  label:'Editorial',  family:'"Marcellus", Georgia, serif',               weight:'400', style:'normal', google:'Marcellus' },
  { id:'baskerville',label:'De libro',   family:'"Libre Baskerville", Georgia, serif',       weight:'400', style:'italic', google:'Libre+Baskerville:ital@1' },
  { id:'cinzel',     label:'Romana',     family:'"Cinzel", Georgia, serif',                  weight:'600', style:'normal', google:'Cinzel:wght@600' },
  { id:'abril',      label:'Titular',    family:'"Abril Fatface", Georgia, serif',           weight:'400', style:'normal', google:'Abril+Fatface' },
  { id:'vibes',      label:'Caligrafía', family:'"Great Vibes", cursive',                    weight:'400', style:'normal', google:'Great+Vibes' },
  { id:'sacramento', label:'De un trazo', family:'"Sacramento", cursive',                    weight:'400', style:'normal', google:'Sacramento' },
  { id:'parisienne', label:'Parisina',   family:'"Parisienne", cursive',                     weight:'400', style:'normal', google:'Parisienne' },
  { id:'satisfy',    label:'Pincel',     family:'"Satisfy", cursive',                        weight:'400', style:'normal', google:'Satisfy' },
  { id:'pacifico',   label:'Verano',     family:'"Pacifico", cursive',                       weight:'400', style:'normal', google:'Pacifico' },
  { id:'shadows',    label:'Cuaderno',   family:'"Shadows Into Light", cursive',             weight:'400', style:'normal', google:'Shadows+Into+Light' },
  { id:'indie',      label:'Nota',       family:'"Indie Flower", cursive',                   weight:'400', style:'normal', google:'Indie+Flower' },
  { id:'marker',     label:'Rotulador',  family:'"Permanent Marker", cursive',               weight:'400', style:'normal', google:'Permanent+Marker' },
  { id:'amatic',     label:'Festiva',    family:'"Amatic SC", sans-serif',                   weight:'700', style:'normal', google:'Amatic+SC:wght@700' },
  { id:'poppins',    label:'Redonda',    family:'"Poppins", Arial, sans-serif',              weight:'600', style:'normal', google:'Poppins:wght@600;700' },
  { id:'quicksand',  label:'Suave',      family:'"Quicksand", Arial, sans-serif',            weight:'600', style:'normal', google:'Quicksand:wght@600' },
  { id:'josefin',    label:'Ligera',     family:'"Josefin Sans", Arial, sans-serif',         weight:'600', style:'normal', google:'Josefin+Sans:wght@600' },
  { id:'oswald',     label:'Estrecha',   family:'"Oswald", Arial, sans-serif',               weight:'500', style:'normal', google:'Oswald:wght@500' },
  { id:'bebas',      label:'Cartel',     family:'"Bebas Neue", Arial, sans-serif',           weight:'400', style:'normal', google:'Bebas+Neue' },
];
const FONT_DEFAULT = 'georgia';
const fontOf = id => FONTS.find(f => f.id === id) || FONTS[0];
function fontCss(id, sizePx){ const f=fontOf(id); return `${f.style==='italic'?'italic ':''}${f.weight} ${Math.round(sizePx)}px ${f.family}`; }
/* el canvas no espera a la fuente: se le pide al navegador y, cuando llega, se avisa (una vez) */
function ensureFont(id, done){
  const f = fontOf(id);
  if(!f.google || f._ok === true) return true;
  if(!f._ok){
    f._ok = 'loading';
    document.fonts.load(fontCss(f.id, 40)).catch(()=>{}).then(() => { f._ok = true; if(done) done(); });
  }
  return false;
}
(function loadFontFaces(){
  const fams = FONTS.filter(f => f.google).map(f => 'family=' + f.google).join('&');
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?' + fams + '&display=swap';
  document.head.appendChild(link);
  // solo las favoritas se piden ya (son las que casi seguro se usan); el resto, al elegirlas
  link.onload = () => {
    Promise.all(FONTS.filter(f => f.google && f.fav).map(f => document.fonts.load(fontCss(f.id, 40)).catch(()=>{}).then(() => { f._ok = true; })))
      .then(() => { dirty3D = true; if(typeof applyFrontTexture === 'function' && POSTERS[selected]){ applyFrontTexture(selected); applyBackText(selected); } });
  };
})();
const PHOTO_ROOMS = window.MOMENTURIES_ROOMS || [];
/* Cada entorno real puede tener dos fotos (`group` las junta): una horizontal, pensada para
   verla en PC, y una vertical para el móvil (`orient`). En el selector solo aparece UNA tarjeta
   por grupo — la que toque según el ancho de pantalla — en vez de listar las dos por separado. */
const isMobileView = () => window.innerWidth <= 720;
function roomsForCat(cat){
  const all = PHOTO_ROOMS.filter(r => (r.cat || 'salon') === cat);
  const want = isMobileView() ? 'v' : 'h';
  const vistos = {}, out = [];
  all.forEach(r => {
    const g = r.group || r.id;
    if(vistos[g]) return;
    vistos[g] = true;
    /* con un conjunto puesto, la foto del grupo donde se ve bien (o ninguna: ver roomOk) */
    if(WALL){ const ok = roomFor(r, WALL); if(ok) out.push(ok); return; }
    const cands = all.filter(x => (x.group || x.id) === g);
    out.push(cands.find(x => x.orient === want) || cands[0]);
  });
  return out;
}

/* Estas cuatro viven aquí arriba por lo mismo que ROOM_CFG: layout() corre en el arranque
   y ya llama a placeRoom(), que las toca. Declararlas a mitad de fichero daba
   "Cannot access 'sceneGroups' before initialization". */
let ROOM = null;
let lightRef = null;                      // malla que define el mapa de luz (pared dibujada o foto)
let roomGroup = null, photoMesh = null, fgMesh = null;
const sceneGroups = {};                   // id → grupo ya montado (se monta una sola vez)
const ROOM_BOX = { w:760, h:300, d:460 };
const ROOM_BOX_DEF = { w:760, h:300, d:460 };

/* Grupos del selector de entorno. Van aquí arriba porque setScene() → renderRoomModal() ya se llama
   al arrancar (entrada por ?entorno=) y declararlos más abajo petaba con TDZ. */
/* mesa: si el entorno tiene una superficie donde apoyar algo (mesita, consola, escritorio...).
   El Sobremesa es una peana con foto que se APOYA, no se cuelga: en cocinas, terrazas o la
   escalera no hay dónde ponerla, así que esos grupos no se enseñan para ese producto. */
const GRUPOS_ENTORNO = [
  { id:'nevera',     es:'Neveras',        en:'Fridges',      mesa:false, test: id => /^nevera-/.test(id) },
  { id:'salon',      es:'Salones',        en:'Living rooms', mesa:true,  test: id => /^salon/.test(id) || id === 'rincon' },
  { id:'cocina',     es:'Cocinas',        en:'Kitchens',      mesa:false, test: id => /^cocina/.test(id) },
  { id:'comedor',    es:'Comedores',      en:'Dining rooms', mesa:true,  test: id => false },
  { id:'aparador',   es:'Aparadores',     en:'Sideboards',   mesa:true,  test: id => /^aparador-/.test(id) },
  { id:'estanteria', es:'Estanterías',    en:'Shelving',     mesa:true,  test: id => /^estanteria-/.test(id) },
  { id:'dormitorio', es:'Habitaciones',   en:'Bedrooms',     mesa:true,  test: id => /^dormitorio/.test(id) || /^mesita-/.test(id) },
  { id:'despacho',   es:'Escritorios',    en:'Desks',        mesa:true,  test: id => /^(despacho|estudio)/.test(id) },
  { id:'pasillo',    es:'Pasillo',        en:'Hallway',      mesa:true,  test: id => id === 'pasillo' },
  { id:'terraza',    es:'Terrazas',       en:'Terraces',     mesa:false, test: id => /^terraza/.test(id) },
  { id:'escalera',   es:'Escalera',       en:'Staircase',    mesa:false, test: id => /^escalera-/.test(id) },
];
/* Escenas propias del Sobremesa (se apoya encima de verdad: estantería, aparador, mesita).
   Ver el bloque "SOBREMESA" al final de SCENES. Nunca se enseñan para cuadro/imán (colgar a
   la altura de una mesita quedaría raro), y son las ÚNICAS que se enseñan para el Sobremesa:
   los entornos de pared reutilizados quedaban con el sobremesa flotando en el aire. */
const SOBREMESA_SCENES = /^(estanteria-|aparador-|mesita-)/;
/* 16-oct-2026 · Escenas de nevera: SOLO para el imán (y el imán solo ve estas: un imán no se pega en la pared). */
const NEVERA_SCENES = /^nevera-/;
let grupoAbierto = null;
let _numEntorno = 0;                      // contador de la numeración del selector (arriba: renderRoomModal corre ya en el arranque)

/* Zona NÍTIDA de cada foto, en píxeles de la foto (los mismos recortes que usa pared2d.html).
   Hacen falta porque salon.jpg y salon-claro.jpg llevan el primer plano desenfocado en el
   render original: sin recortar, el 2D enseñaba esa franja y parecía que fallaba el visor. */
/* ROOM_LEJOS: 0 = encuadre automático del conjunto, 1 = la habitación entera (ver setZoom) */
var ROOM_LEJOS = 0;
var SIN_BRUMA = (() => { try{ return localStorage.getItem('mm-bruma') === 'no'; }catch(e){ return false; } })();
const PHOTO_VIEW = {
  'salon':       { x:200, y:530, w:2000, h:1320 },
  'salon-claro': { x:200, y:530, w:2000, h:1320 },
  'aparador':    { x:200, y:530, w:1800, h:1341 },
  'salon-luz':   { x:0,   y:400, w:2304, h:1836 },
};

/* ═══════════ ESCENA (motor 3D del "Sube tu foto" de Futsides) ═══════════ */
const canvas   = document.getElementById('pvCanvas');
const stage    = document.getElementById('pvStage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
renderer.setClearColor(0x000000, 0);            // transparente → se ve el fondo claro del editor
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;     // como el sube-tu-foto de Futsides

const scene  = new THREE.Scene();
const BASEZ  = 8, MINZ = BASEZ*0.45, MAXZ = BASEZ*1.55;
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0, BASEZ);
camera.lookAt(0, 0, 0);

const group = new THREE.Group();
/* el grupo cuelga de un pivote: sin pared gira sobre sí mismo (pivote en el origen); con una
   foto de entorno el pivote se pone PIVOT_R por detrás para que girar sea "mirar alrededor"
   (la pared se desplaza más que gira, y los muebles recortados hacen paralaje) */
const orbitPivot = new THREE.Group();
scene.add(orbitPivot);
orbitPivot.add(group);
const PIVOT_R = 3;
/* desplazamiento del grupo (para no tapar el panel) a la distancia de cámara de referencia
   BASEZ. Como la cámara solo hace dolly (se acerca/aleja en línea recta, sin lookAt por
   fotograma), un grupo descentrado se ve arrastrarse hacia el borde al hacer zoom si su
   position.x/y se queda fija: en animate() se reescala con (cZ-gz)/(BASEZ-gz) cada fotograma
   para que su posición en pantalla no cambie al acercar o alejar. */
const camFrame = { x: 0, y: 0 };

const P_SHORT = 2.0, P_LONG = 2.0*Math.SQRT2, PD = 0.04, GAP = 0.42;   // lado corto/largo (ratio A4)
/* unidades 3D por cm real (la Sobremesa S, 15,2cm de lado largo, mide P_LONG). Declarada aquí
   arriba de todo — createPoster() se llama ya al arrancar la página (antes de que el resto
   del fichero termine de ejecutarse), así que si CM viviera más abajo (como antes) petaba con
   "Cannot access 'CM' before initialization" nada más cargar. */
const CM = P_LONG / 15.2;
const TEX_SHORT = 900, TEX_LONG = Math.round(900*Math.SQRT2);          // lienzo de la textura
const MAXANI = renderer.capabilities.getMaxAnisotropy();

/* entorno de estudio (idéntico a Futsides) */
function buildEnvMap(){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');const W=c.width,H=c.height;
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#49505f');g.addColorStop(.23,'#2b313d');g.addColorStop(.60,'#171b22');g.addColorStop(1,'#090a0d');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(248,250,255,1)';ctx.fillRect(W*0.05,H*0.07,W*0.28,H*0.50);
  ctx.fillStyle='rgba(225,235,255,0.78)';ctx.fillRect(W*0.34,H*0.10,W*0.035,H*0.43);
  let glow=ctx.createRadialGradient(W*0.18,H*0.30,20,W*0.18,H*0.30,280);glow.addColorStop(0,'rgba(220,238,255,0.46)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
  let warm=ctx.createRadialGradient(W*0.58,H*0.14,10,W*0.58,H*0.14,170);warm.addColorStop(0,'rgba(255,228,180,0.70)');warm.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=warm;ctx.fillRect(0,0,W,H);
  const tex=new THREE.CanvasTexture(c);tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;return tex;
}
const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
const rawEnv=buildEnvMap();scene.environment=pmrem.fromEquirectangular(rawEnv).texture;rawEnv.dispose();
pmrem.dispose();

/* luces: las MISMAS del visor de la ficha de Futsides */
scene.add(new THREE.AmbientLight(0xfff2e2,1.85));
const PL=(c,i,d,p)=>{const l=new THREE.PointLight(c,i,d);l.position.set(p[0],p[1],p[2]);scene.add(l);};
PL(0xffebc7,8.7,18,[0,3.6,.8]); PL(0xffdca8,4.35,13,[1.7,2.15,1.4]);
const DL=(c,i,p)=>{const l=new THREE.DirectionalLight(c,i);l.position.set(p[0],p[1],p[2]);scene.add(l);};
DL(0xe2f1ff,3.15,[-4.2,3.1,2.2]); DL(0xffe9d2,1.18,[2.2,1,-3]); DL(0xffffff,1.15,[.2,.4,3.4]);

/* mipmaps + trilinear + anisotropía (nitidez con pósters pequeños en la pared) */
function tune(t){
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANI;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  return t;
}

/* ═══════════ PÓSTERES ═══════════ */
const POSTERS = [];
let selected = 0, panelOpen = false, dirty3D = true;
/* cara que se está viendo del cuadro que se edita (botón Delante/Detrás y campos de texto).
   Con entorno no gira la escena: el cuadro se despega de la pared, se acerca y se da la vuelta
   él solo (showcasePose). FIT = el último encuadre de layout(), para saber dónde acercarlo. */
let FACE_BACK = false, FIT = null;

/* Momenturies Diferentes Formatos: cada póster tiene su PROPIA proporción real (cuadrado,
   clásico 2:3 o retrato 3:4 — ver FORMATS más abajo, junto a PRODUCTS), no una única forma
   fija escalada como en la versión normal. baseW/baseH devuelven ya el tamaño físico de
   verdad en unidades 3D (CM = unidades por cm, definida más abajo junto a layoutWall — un
   forward reference seguro, baseW/baseH solo se EJECUTAN más tarde), así que la geometría de
   cada póster se reconstruye al cambiar de formato o de talla — ver rebuildPosterGeometry(). */
const isLand = p => p.orient === 'landscape';
const baseW  = p => { const d = sizeOf(p).d; return (isLand(p) ? d[1] : d[0]) * CM; };
const baseH  = p => { const d = sizeOf(p).d; return (isLand(p) ? d[0] : d[1]) * CM; };
const TEX_PER_UNIT = TEX_LONG / P_LONG;
const texW   = p => Math.max(200, Math.round(baseW(p) * TEX_PER_UNIT));
const texH   = p => Math.max(200, Math.round(baseH(p) * TEX_PER_UNIT));

/* materiales del sube-tu-foto: frontal iluminado (sin emisivo) + reverso metálico suave */
/* LUZ DEL ENTORNO sobre los cuadros: cada entorno con foto puede traer un mapa de luz (<id>_light.jpg,
   generado por fotos/_build_entorno.py: cuánto más clara o más oscura es la pared en cada punto respecto a la
   pared sin luz, valor = ratio×100). La cara delantera de cada cuadro multiplica su color por ese ratio en el
   punto de la pared que tiene detrás, así la luz de la ventana (o la sombra) le cae encima igual que a la pared,
   con foto o con el hueco vacío. Se muestrea por posición: el fragmento se pasa a coordenadas locales de la
   foto del entorno (uLightInv = inversa de la matriz mundo de photoMesh), sin depender de tallas ni animaciones.
   El ratio va elevado a 0.45: el visor ya ilumina el aluminio con sus luces y con el ratio entero la foto se quemaba. */
const LIGHT_U = { uLightTex:{ value:null }, uLightInv:{ value:new THREE.Matrix4() }, uLightOn:{ value:0 } };
/* 2D = colores reales, sin luces 3D (16-oct-2026). Medido: con las luces del visor (pensadas para lucir el
   aluminio al girarlo) un gris medio salía un 30 % más claro y los tonos claros, blancos quemados, en todos
   los entornos. Marc: «colores muy vivos siempre, con contraste, nada de luces 3D». En 2D (uFlat = 1, lo mueve
   applyFlatGloss por cuadro) el frontal pinta el color de la foto sin luces ni mapa de luz, algo realzado, y encima
   un reflejo diagonal muy suave, como el brillo de los mockups de Futsides (FLAT_GLOSS = 0 lo quita). */
const FLAT_GLOSS = 0.10;
/* «muy vivos, con contraste»: realce suave solo en pantalla (imprenta usa el archivo original). Calibrado para
   que un blanco de 235 no pase de ~248: los claros ganan chispa sin quemarse. 1 / 0 / 1 = color exacto. */
const FLAT_CONTRAST = 1.10, FLAT_LIFT = 0.015, FLAT_SAT = 1.18;
function lightPatch(mat){
  mat.userData.uFlat = { value:0 };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, LIGHT_U);
    sh.uniforms.uFlat = mat.userData.uFlat;
    sh.vertexShader = 'varying vec4 vLightW;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n\tvLightW = modelMatrix * vec4(transformed, 1.0);');
    sh.fragmentShader = 'uniform sampler2D uLightTex; uniform mat4 uLightInv; uniform float uLightOn; uniform float uFlat; varying vec4 vLightW;\n'
      + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n\tvec3 flatCol = diffuseColor.rgb;\n\tif(uLightOn > 0.5){\n'
      + '\t\tvec2 luv = (uLightInv * vLightW).xy + 0.5;\n'
      + '\t\tif(all(greaterThan(luv, vec2(0.0))) && all(lessThan(luv, vec2(1.0)))) diffuseColor.rgb *= pow(texture2D(uLightTex, luv).r * 2.55, 0.45);\n\t}')
      .replace('#include <opaque_fragment>', '#include <opaque_fragment>\n\tif(uFlat > 0.001){\n'
      + '\t\tvec3 fc = pow(max(flatCol, vec3(0.0)), vec3(1.0/2.2));\n'               // realce en espacio de pantalla
      + '\t\tfc = (fc - 0.5) * ' + FLAT_CONTRAST.toFixed(3) + ' + 0.5 + ' + FLAT_LIFT.toFixed(3) + ';\n'
      + '\t\tfc = mix(vec3(dot(fc, vec3(0.299, 0.587, 0.114))), fc, ' + FLAT_SAT.toFixed(3) + ');\n'
      + '\t\tfc = pow(clamp(fc, 0.0, 1.0), vec3(2.2));\n'
      + '\t\t#ifdef USE_MAP\n'
      + '\t\tfloat dg = vMapUv.x * 0.8 + (1.0 - vMapUv.y) * 0.6;\n'   // diagonal de arriba-izquierda a abajo-derecha
      + '\t\tfloat sh = ' + FLAT_GLOSS.toFixed(3) + ' * (exp(-pow((dg - 0.42) / 0.16, 2.0)) * 0.9 + (1.0 - smoothstep(0.0, 0.9, dg)) * 0.35);\n'
      + '\t\tfc = fc + (1.0 - fc) * sh;\n'                             // fusión «trama»: aclara sin quemar los blancos
      + '\t\t#endif\n'
      + '\t\tgl_FragColor.rgb = mix(gl_FragColor.rgb, fc, uFlat);\n\t}');
  };
  mat.customProgramCacheKey = () => 'momenturies-light';
  return mat;
}
const makeFrontMat = tex => lightPatch(new THREE.MeshPhysicalMaterial({map:tex,side:THREE.FrontSide,roughness:0.045,metalness:0.12,reflectivity:1.0,clearcoat:1.0,clearcoatRoughness:0.02,envMapIntensity:1.18,ior:1.8}));
const makeBackMat  = () => new THREE.MeshPhysicalMaterial({color:new THREE.Color('#c9c9c9'),side:THREE.FrontSide,roughness:.55,metalness:.78,reflectivity:.55,clearcoat:.22,clearcoatRoughness:.28,envMapIntensity:.7,ior:1.5});
const makeSideMat  = () => new THREE.MeshPhysicalMaterial({color:0xd8d8d8,roughness:.018,metalness:1,reflectivity:1,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:3.15,ior:2.5});

/* ═══════════ COLGADORES DENTRO DEL VISOR (mismo motor que el visor 3D de Futsides) ═══════════
   Cada póster lleva sus piezas puestas: placa de imán premium, tiras adhesivas, lámina de imán
   de nevera o peana de bambú (con el póster inclinado encima). Al cambiar de producto o de
   colgador la pieza entra/sale en el propio 3D, sin abrir ninguna escena aparte. */
const MAG_D = 0.025, CARD_D = 0.018, STRIP_D = 0.03;
const BASE_H = 0.17, BASE_D = 0.34, BASE_R = 0.04, BAMBU_SINK = 0.06, BAMBU_LEAN = 0.12;

function roundedRect(w,h,r){
  const s = new THREE.Shape(), x = -w/2, y = -h/2;
  s.moveTo(x+r,y);
  s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r);
  s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r);
  s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y);
  return s;
}
/* UV plano para la peana (si no, la veta del bambú sale estirada por el extrude) */
function planarUV(w,h){
  return {
    generateTopUV(g,v,a,b,c){
      const f = i => new THREE.Vector2((v[i*3]+w/2)/w, (v[i*3+1]+h/2)/h);
      return [f(a),f(b),f(c)];
    },
    generateSideWallUV(g,v,a,b,c,d){
      const f = i => new THREE.Vector2((v[i*3]+w/2)/w, (v[i*3+2])/Math.max(w,h));
      return [f(a),f(b),f(c),f(d)];
    }
  };
}
/* veta de bambú pintada a canvas (la misma de Futsides): 7 láminas + nudos */
function buildBambooTex(){
  const c=document.createElement('canvas'); c.width=1400; c.height=300;
  const ctx=c.getContext('2d'), W=c.width, H=c.height;
  const base=ctx.createLinearGradient(0,0,0,H);
  base.addColorStop(0,'#e7c98f'); base.addColorStop(.5,'#dcb877'); base.addColorStop(1,'#cfa863');
  ctx.fillStyle=base; ctx.fillRect(0,0,W,H);
  const strips=7, sh=H/strips;
  for(let i=0;i<strips;i++){
    const y0=i*sh, t=(i%3)/3;
    const g=ctx.createLinearGradient(0,y0,0,y0+sh);
    g.addColorStop(0,`rgba(${236-t*22},${201-t*22},${143-t*20},1)`);
    g.addColorStop(1,`rgba(${205-t*18},${168-t*18},${99-t*16},1)`);
    ctx.fillStyle=g; ctx.fillRect(0,y0,W,sh);
    ctx.globalAlpha=0.10;
    for(let k=0;k<26;k++){
      const yy=y0+Math.random()*sh;
      ctx.strokeStyle=Math.random()<0.5?'#b98f4e':'#f2dcab';
      ctx.lineWidth=Math.random()*1.4+0.3;
      ctx.beginPath(); ctx.moveTo(0,yy);
      const seg=W/6; let x=0;
      for(let s=0;s<6;s++){ x+=seg; ctx.lineTo(x, yy+(Math.random()-0.5)*sh*0.18); }
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    ctx.fillStyle='rgba(120,86,40,0.55)'; ctx.fillRect(0,y0+sh-2,W,2);
    ctx.fillStyle='rgba(255,240,205,0.30)'; ctx.fillRect(0,y0,W,1);
    for(let n=0;n<5;n++){
      const nx=(n+0.5)*(W/5)+(Math.random()-0.5)*60;
      ctx.globalAlpha=0.22; ctx.fillStyle='#8a6230';
      ctx.beginPath(); ctx.ellipse(nx,y0+sh*0.5,5,sh*0.34,0,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=0.14; ctx.fillStyle='#5e4220';
      ctx.fillRect(nx-1,y0+sh*0.16,2,sh*0.68);
      ctx.globalAlpha=1;
    }
  }
  return tune(new THREE.CanvasTexture(c));
}
const bambooTex = buildBambooTex();
const woodFace  = new THREE.MeshPhysicalMaterial({map:bambooTex,roughness:.40,metalness:0,clearcoat:.55,clearcoatRoughness:.20,envMapIntensity:.65,ior:1.45,sheen:.4,sheenColor:new THREE.Color('#fff0d0'),sheenRoughness:.5});
const woodPlain = new THREE.MeshPhysicalMaterial({color:0xdcb877,roughness:.42,metalness:0,clearcoat:.5,clearcoatRoughness:.22,envMapIntensity:.55,ior:1.45,sheen:.35,sheenColor:new THREE.Color('#fff0d0'),sheenRoughness:.5});
const tirasMat  = new THREE.MeshPhysicalMaterial({color:0xf3f0ea,roughness:.5,metalness:0,clearcoat:.25,clearcoatRoughness:.4,envMapIntensity:.55});
const cardMat   = new THREE.MeshPhysicalMaterial({color:0x39342f,roughness:.74,metalness:.12,clearcoat:.12,clearcoatRoughness:.55,envMapIntensity:.5});
/* el imán se desvanece al salir la peana → material por póster */
const makeMagnetMat = () => new THREE.MeshPhysicalMaterial({color:0x121212,roughness:.15,metalness:.95,reflectivity:1,clearcoat:.6,clearcoatRoughness:.02,envMapIntensity:2.5,transparent:true});

/* el imán mide ~40% del ancho y ~38% del alto del póster — antes era un tamaño fijo en
   unidades 3D (pensado para el único A4 de siempre); con formatos de 10×10 a 60×80cm tiene
   que escalar con el póster o se vería minúsculo en el XL y gigante en el S. */
const magDims  = p => [baseW(p)*0.40, baseH(p)*0.38];
const cardGeo  = p => { const g=new THREE.ExtrudeGeometry(roundedRect(baseW(p)*0.80, baseH(p)*0.86, 0.12), {depth:CARD_D,bevelEnabled:false,curveSegments:14}); g.translate(0,0,-CARD_D); return g; };
const bambooGeo = p => {
  const bw = Math.min(baseW(p), baseH(p));   // la peana mide siempre el lado corto
  const g = new THREE.ExtrudeGeometry(roundedRect(bw, BASE_H, BASE_R),
    {depth:BASE_D,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:3,curveSegments:16,UVGenerator:planarUV(bw,BASE_H)});
  g.translate(0,0,-BASE_D/2);
  return g;
};
function placeBamboo(p){
  p.bamboo.position.set(0, (-baseH(p)/2 + BAMBU_SINK) - BASE_H/2, -BASE_D/2 + 0.08);
}

function buildMountParts(p){
  const md = magDims(p);
  p.magMat = makeMagnetMat();
  p.magnet = new THREE.Mesh(new THREE.BoxGeometry(md[0],md[1],MAG_D), p.magMat);
  p.magnet.position.set(0,0,-(PD/2 + MAG_D/2));
  p.magnet.visible = false;
  p.mesh.add(p.magnet);

  p.card = new THREE.Mesh(cardGeo(p), cardMat);
  p.card.position.set(0,0,-(PD/2 + 0.001));
  p.card.scale.set(1.12,1.12,1);
  p.card.visible = false;
  p.mesh.add(p.card);

  p.tiras = new THREE.Group(); p.tiras.visible = false; p.tirasLayout = null;
  p.mesh.add(p.tiras);

  // la peana va FUERA del póster (hermana): el póster se inclina y ella se queda recta
  p.bamboo = new THREE.Mesh(bambooGeo(p), [woodFace, woodPlain]);
  p.bambooGroup = new THREE.Group();
  p.bambooGroup.add(p.bamboo);
  p.bambooGroup.visible = false;
  p.rig.add(p.bambooGroup);
  p.bambu = 0; p.bambuT = 0;
  placeBamboo(p);
}

/* al girar el póster (vertical ↔ horizontal) hay que rehacer las piezas */
function rebuildMountParts(p){
  const md = magDims(p);
  p.magnet.geometry.dispose();
  p.magnet.geometry = new THREE.BoxGeometry(md[0],md[1],MAG_D);
  p.magnet.position.set(0,0,-(PD/2 + MAG_D/2));
  p.card.geometry.dispose();   p.card.geometry   = cardGeo(p);
  p.bamboo.geometry.dispose(); p.bamboo.geometry = bambooGeo(p);
  placeBamboo(p);
  setTiras(p, p.tirasLayout);
}

/* tiras adhesivas: 2 horizontales en las tallas pequeñas · 4 en las esquinas en las grandes */
function setTiras(p, layout){
  p.tirasLayout = layout;
  for(let i=p.tiras.children.length-1;i>=0;i--){
    const c = p.tiras.children[i];
    p.tiras.remove(c); c.geometry.dispose();
  }
  if(!layout){ p.tiras.visible = false; return; }
  p.tiras.visible = true;
  const w = baseW(p), h = baseH(p), SW = 0.19, CL = h*0.32;
  const strip = (sw,sh,x,y)=>{
    const g = new THREE.ExtrudeGeometry(roundedRect(sw,sh,Math.min(sw,sh)*0.45), {depth:STRIP_D,bevelEnabled:false,curveSegments:10});
    g.translate(0,0,-STRIP_D);
    const m = new THREE.Mesh(g, tirasMat);
    m.position.set(x, y, -(PD/2 + 0.001));
    return m;
  };
  if(layout==='horizontal'){
    p.tiras.add(strip(w*0.90, SW, 0,  h*0.28));
    p.tiras.add(strip(w*0.90, SW, 0, -h*0.28));
  } else {
    const ex = w*0.37, ey = h*0.33;
    p.tiras.add(strip(SW, CL,  ex,  ey)); p.tiras.add(strip(SW, CL, -ex,  ey));
    p.tiras.add(strip(SW, CL,  ex, -ey)); p.tiras.add(strip(SW, CL, -ex, -ey));
  }
}

/* imán de nevera: lámina redondeada + dorso blanco tipo tarjeta */
function setCardBack(p, on){
  p.card.visible = on;
  const m = p.backMat;
  if(on){ m.color.set(0xf2f3f5); m.metalness=0;   m.roughness=.55; m.clearcoat=.20; m.envMapIntensity=.6; }
  else  { m.color.set(0xc9c9c9); m.metalness=.78; m.roughness=.55; m.clearcoat=.22; m.envMapIntensity=.7; }
  m.needsUpdate = true;
}

/* la dedicatoria del dorso se pone POR DELANTE de la pieza, para que siga leyéndose */
function backPlaneZ(p){
  const id = mountOf(p);
  const d = id==='iman-pared' ? MAG_D : id==='tiras' ? STRIP_D : id==='iman-nevera' ? CARD_D : 0;
  return -(PD/2 + 0.006 + d);
}

/* qué pieza lleva puesta este póster, según producto + colgador + talla */
function applyMountVisual(p){
  if(!p || !p.magnet) return;
  const id = mountOf(p);
  const big = ['M','L','XL','XXL'].indexOf(p.sizeKey) >= 0;
  p.bambuT = (id==='madera') ? 1 : 0;
  p.magnet.visible = (id==='iman-pared');
  setCardBack(p, id==='iman-nevera');
  setTiras(p, id==='tiras' ? (big ? 'multi' : 'horizontal') : null);
  if(p.backPlane) p.backPlane.position.z = backPlaneZ(p);
  dirty3D = true;
}

/* gira el póster para que la pieza quede a la vista al elegirla */
function showMountPose(p){
  const id = mountOf(p);
  if(ROOM_CFG.mode !== 'none'){ setFace(id!=='madera' && id!=='none'); return; }
  if(id==='madera')     flipToFace(restRy());         // la peana se ve de frente
  else if(id!=='none')  flipToFace(Math.PI + 0.25);   // dorso, un poco girado
}

/* entrada/salida de la peana: el póster se apoya, se inclina y el imán se va */
const clamp01 = v => v<0 ? 0 : (v>1 ? 1 : v);
function mountAnimating(p){ return Math.abs((p.bambuT||0) - (p.bambu||0)) > 1e-4; }
function updateMountAnim(p){
  if(!p.bambooGroup) return;
  const t = p.bambuT || 0;
  p.bambu += (t - p.bambu) * 0.08;
  if(Math.abs(t - p.bambu) < 0.0005) p.bambu = t;
  const v = clamp01(p.bambu);
  p.bambooGroup.visible = v > 0.004;
  p.bambooGroup.position.y = -(1 - v) * 4.2;          // sube desde abajo
  // se inclina hacia atrás pivotando sobre el borde de abajo (metido en la ranura)
  const a = -BAMBU_LEAN * v, halfH = baseH(p)/2, lift = Math.sin(v*Math.PI) * 0.16;
  p.mesh.rotation.x = a;
  p.mesh.position.y = (-halfH + lift) + halfH*Math.cos(a);
  p.mesh.position.z = halfH*Math.sin(a);
  const op = 1 - Math.min(1, v*1.7);
  p.magMat.opacity = op;
  p.magnet.position.y =  v * 1.35;
  p.magnet.position.z = -(PD/2 + MAG_D/2) - v * 0.55;
  const ms = 1 - v*0.45;
  p.magnet.scale.set(ms,ms,ms);
}

function drawPlaceholder(x, W, H){
  x.fillStyle = '#ffffff'; x.fillRect(0,0,W,H);
  x.strokeStyle = '#e6e1d9'; x.lineWidth = 6; x.strokeRect(40,40,W-80,H-80);
  x.strokeStyle = '#c9c3ba'; x.lineWidth = 9; x.lineCap='round'; x.lineJoin='round';
  const cx=W/2, cy=H*0.42;
  x.beginPath();
  x.moveTo(cx-110,cy-30); x.lineTo(cx-78,cy-30); x.lineTo(cx-58,cy-58);
  x.lineTo(cx+58,cy-58); x.lineTo(cx+78,cy-30); x.lineTo(cx+110,cy-30);
  x.quadraticCurveTo(cx+128,cy-30,cx+128,cy-12);
  x.lineTo(cx+128,cy+78); x.quadraticCurveTo(cx+128,cy+96,cx+110,cy+96);
  x.lineTo(cx-110,cy+96); x.quadraticCurveTo(cx-128,cy+96,cx-128,cy+78);
  x.lineTo(cx-128,cy-12); x.quadraticCurveTo(cx-128,cy-30,cx-110,cy-30);
  x.closePath(); x.stroke();
  x.beginPath(); x.arc(cx,cy+24,40,0,Math.PI*2); x.stroke();
  x.fillStyle = '#1a1a1a'; x.textAlign='center';
  const fs = Math.max(78, Math.round(W*0.075));
  x.font = '700 ' + fs + 'px Helvetica, Arial, sans-serif';
  x.fillText('SUBE TU FOTO', cx, H*0.62);
  x.fillStyle = '#6f6860';
  x.font = '400 ' + Math.round(fs*0.6) + 'px Helvetica, Arial, sans-serif';
  x.fillText('Toca para elegirla', cx, H*0.62 + fs*1.05);
}

function makePoster(){
  const pr = PRODUCTS[defaultType] || PRODUCTS.metal;
  const fmt0 = pr.formats ? ((window.MOMENTURIES_EDITOR||{}).format && pr.formats[(window.MOMENTURIES_EDITOR||{}).format] ? window.MOMENTURIES_EDITOR.format : FORMAT_DEFAULT) : null;
  const s0 = defSizeOf(pr, fmt0);
  const gw = s0.d[0]*CM, gh = s0.d[1]*CM;             // ancho/alto reales (formato retrato, cm→unidades 3D)
  const tw = Math.max(200, Math.round(gw*TEX_PER_UNIT)), th = Math.max(200, Math.round(gh*TEX_PER_UNIT));
  const c = document.createElement('canvas');
  c.width = tw; c.height = th;
  drawPlaceholder(c.getContext('2d'), c.width, c.height);
  const frontMat = makeFrontMat(tune(new THREE.CanvasTexture(c)));
  const sideMat  = makeSideMat();
  const backMat  = makeBackMat();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(gw, gh, PD),
    [ sideMat, sideMat, sideMat, sideMat, frontMat, backMat ]
  );
  // el póster va dentro de un rig: el rig lleva sitio/giro (la talla ya está en la propia
  // geometría — ver rebuildPosterGeometry), el póster puede inclinarse dentro (peana) y las
  // piezas del colgador cuelgan de uno o del otro
  const rig = new THREE.Group();
  rig.add(mesh);
  group.add(rig);
  return { mesh, rig, frontMat, backMat, baseX:0, thumb:null, srcImg:null, backPlane:null,
           orient:'portrait', crop:{scale:1,fx:0,fy:0},
           ptype:defaultType, mount:pr.hanger, format:fmt0, sizeKey:s0.k, sizeScale:1, price:s0.price,
           frontText:'', frontX:50, frontY:14, frontSize:62, frontFont:FONT_DEFAULT, frontDate:'',
           backText:'',  backX:50,  backY:50,  backSize:46,  backFont:FONT_DEFAULT,  backDate:'' };
}

function createPoster(){
  const p = makePoster();
  p.uid = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  buildMountParts(p);
  POSTERS.push(p);
  applyMountVisual(p);
  return p;
}
function addPoster(){
  const p = createPoster();
  selected = POSTERS.length - 1;
  layout(); renderThumbs(); applySelection(); syncConfigUI(); updateTotal();
  dirty3D = true;
  return p;
}

/* cambia la orientación del póster (vertical ↔ horizontal) */
function setOrientation(p, o){
  if(p.orient === o) return;
  p.orient = o;
  rebuildPosterGeometry(p);
}

/* ═══════════ PARED (grid Mixtiles) ═══════════ */
function layout(){
  let wideFrame = null;   // plano abierto de la habitación (Sobremesa): punto de partida del viaje de entrada
  const n = POSTERS.length;
  let totalH = 0, maxW = 0, fcx = 0, fcy = 0;   // fcx/fcy: centro de la zona a encuadrar (coords del grupo)
  if(WALL){
    /* pared prediseñada: cada cuadro va exactamente donde dice la composición */
    const wl = layoutWall(); maxW = wl.maxW; totalH = wl.totalH; fcx = wl.cx; fcy = wl.cy;
  } else {
  const perRow = n <= 3 ? n : Math.ceil(n / Math.ceil(n / 4));
  const rows = [];
  for(let i = 0; i < n; i += perRow) rows.push(POSTERS.slice(i, i + perRow));

  const rowH   = r => r.reduce((m,p)=>Math.max(m, baseH(p)*(p.sizeScale||1)), 0);
  totalH = rows.reduce((s,r)=>s + rowH(r), 0) + (rows.length-1)*GAP;

  let y = totalH/2;
  rows.forEach(r=>{
    const h = rowH(r), cy = y - h/2;
    y -= h + GAP;
    let w = (r.length-1)*GAP;
    r.forEach(p=>{ w += baseW(p)*(p.sizeScale||1); });
    maxW = Math.max(maxW, w);
    let x = -w/2;
    r.forEach(p=>{
      const pw = baseW(p)*(p.sizeScale||1);
      p.baseX = x + pw/2;
      p.baseY = cy;
      p.rig.position.x = p.baseX;
      p.rig.position.y = cy;
      x += pw + GAP;
    });
  });
  COMP_U = { w: maxW, h: totalH };
  /* Un cuadro suelto también puede verse en una habitación. Además de colocarla hay que
     ensanchar el encuadre como se hace con un conjunto (layoutWall): si no, la cámara sigue
     pegada al cuadro y la habitación se queda fuera de plano. */
  /* placeRoom SIEMPRE: en modo 'none' es quien apaga la habitación anterior y la luz de pared.
     Antes solo se llamaba con entorno puesto, así que al darle a "Sin entorno" sin conjunto
     la cocina (o lo que hubiera) se quedaba pintada detrás. */
  placeRoom(totalH);
  if(ROOM_CFG.mode !== 'none'){
    if(ROOM_CFG.mode === 'geo'){
      const sc = findScene(ROOM_CFG.scene);
      /* con restCm (Sobremesa: se apoya) el encuadre baja hasta el suelo de verdad, para que
         se vea el mueble entero; con furnCm (se cuelga) solo se enseña un trozo del mueble
         de debajo, no hace falta ver hasta el suelo. */
      const reveal = sc.restCm != null ? sc.restCm : sc.furnCm*0.42;
      // apoyado (Sobremesa): más aire arriba, para que no roce la barra de arriba ni la decoración de la balda
      let top = totalH/2 + (sc.restCm != null ? 48*CM : 9*CM), bot = -totalH/2 - (sc.gapCm + reveal)*CM;
      if(sc.verCm){   // nevera: se ve de verCm[0] a verCm[1] cm del suelo (la puerta entera, sin suelo de más)
        const F = sc.furnCm + sc.gapCm;
        top = Math.max(totalH/2 + 4*CM, -totalH/2 + (sc.verCm[1] - F)*CM); bot = Math.min(-totalH/2 - 4*CM, -totalH/2 + (sc.verCm[0] - F)*CM);
      }
      if(sc.restCm != null){
        /* Sobremesa: se queda CERCA (el Sobremesa y un trozo del mueble), y la habitación entera
           (wideFrame) solo se usa como punto de partida del viaje de entrada (_flyIn). */
        wideFrame = { maxW: Math.max(maxW + 60*CM, sc.viewCm*CM), fcy: (top + bot)/2, totalH: top - bot };
        const cTop = totalH/2 + 16*CM, cBot = -totalH/2 - 30*CM;
        maxW = maxW + 70*CM;
        fcy = (cTop + cBot)/2;
        totalH = cTop - cBot;
      } else {
      maxW = Math.max(maxW + 60*CM, sc.viewCm*CM);
      fcy = (top + bot)/2;
      totalH = top - bot;
      }
    }
  }
  }

  // encuadre según lo que ve la cámara, reservando el hueco de la UI y del panel
  const visH = 2 * BASEZ * Math.tan(camera.fov * Math.PI/360);
  const visW = visH * (camera.aspect || 1);
  const wpx = stage.clientWidth || 1, hpx = stage.clientHeight || 1;
  /* con el editor cerrado el escenario mide 0 y el encuadre saldría negativo (y al abrir se vería
     medio segundo de geometría del revés): se deja para el resize3D() de la apertura */
  if(!editorOpen || wpx < 2 || hpx < 2){ applySelection(); return; }
  /* 17-oct · al entrar en una habitación (foto nuestra, con conjunto) se ve primero entera y la vista
     viaja sola hasta el conjunto, como en las escenas 3D: aquí se coloca, sin animar, el encuadre de lejos */
  let roomFlyGo = false;
  if(_roomFly && !_roomFlyInner){
    _roomFly = false;
    if(WALL && ROOM_CFG.mode === 'photo' && ROOM && !ROOM.custom){
      const k = ROOM_LEJOS; ROOM_LEJOS = 1; _roomFlyInner = true; _flyUntil = 0; group.userData.framed = false;
      try{ layout(); } finally { _roomFlyInner = false; ROOM_LEJOS = k; }
      roomFlyGo = true;
    }
  }
  let topPx = 116;   // deja sitio a la barra de Conjunto/Entorno, que va arriba
  /* la barra se mide: en móvil, con conjunto, lleva una segunda fila (Tamaño) y ocupa más */
  { const t = document.getElementById('edTools');
    if(t){ let b = 0; for(const el of t.children){ if(el.hidden) continue; const r = el.getBoundingClientRect(); if(r.width > 1) b = Math.max(b, r.bottom); }
      const need = b - stage.getBoundingClientRect().top + 10; if(need > topPx) topPx = Math.min(need, hpx*0.3); } }
  let botPx = WALL ? (ROOM_CFG.mode === 'photo' ? 200 : 215) : 150, rightPx = 0;   // con pared hay una barra más abajo
  /* el Sobremesa lleva la peana por debajo del cuadro: sin entorno hay que dejarle sitio, o en
     la talla grande se mete debajo de las miniaturas */
  if(!WALL && ROOM_CFG.mode === 'none' && POSTERS.some(q => q.ptype === 'madera')) botPx += 56;
  if(panelOpen){
    if(wpx > 720) rightPx = 410;
    else          botPx  = Math.max(botPx, hpx*0.62);
  }
  const usableW = visW * (1 - rightPx/wpx);
  const usableH = visH * (1 - (topPx+botPx)/hpx);
  /* sin entorno y un solo cuadro: el zoom se calcula contra la talla MÁS GRANDE del producto,
     no contra la elegida, para que cambiar de talla de verdad se note en el visor (ver
     maxSizeOf/refBaseW/refBaseH). Con pared o entorno puesto se deja como estaba: ahí ya hay
     una referencia real (la habitación, los otros cuadros del conjunto). */
  let refW = maxW, refH = totalH;
  if(ROOM_CFG.mode === 'none' && !WALL && n === 1){
    const p0 = POSTERS[0];
    refW = refBaseW(p0) * (p0.sizeScale||1);
    refH = refBaseH(p0) * (p0.sizeScale||1);
  }
  let s  = Math.min(1, (usableW*0.90)/Math.max(refW,P_SHORT), (usableH*0.96)/Math.max(refH,P_SHORT));
  let fitAuto = s, fitMin = s;
  let apurado = false;   // el conjunto no entra entero sin alejarse más de la cuenta (ver más abajo)
  let muebleY = null, uBotF = null;   // dónde queda en pantalla la fila `mueble` de la foto (para el tope del zoom)
  let px = -visW * (rightPx/(2*wpx)) - fcx*s;
  let py =  visH * ((botPx-topPx)/(2*hpx)) - fcy*s;
  if(ROOM_CFG.mode === 'photo' && photoMesh && photoMesh.visible){   // con o sin conjunto: manda la foto
    const pw = photoMesh.scale.x, ph = photoMesh.scale.y, cx = photoMesh.position.x, cy = photoMesh.position.y;
    const sFit = Math.min(usableW/maxW, usableH/totalH);    // la composición (con 12 cm de aire) cabe en el hueco libre
    if(ROOM && ROOM.custom){
      /* Foto del cliente: se encuadra SOLO la foto, entera y quieta. A propósito no entra la
         composición en el cálculo: si entrara, al arrastrar los cuadros se recolocaría el
         encuadre y parecería que lo que se mueve es la pared. Los cuadros se mueven por
         encima (moveComposition) y el arrastre ya no deja que se salgan de la foto. */
      s = Math.min(usableW/pw, usableH/ph);
      px = -visW * (rightPx/(2*wpx)) - cx*s;
      py =  visH * ((botPx-topPx)/(2*hpx)) - cy*s;
    } else {
      /* entorno nuestro: la foto tiene que tapar TODO el visor (escala mínima de cobertura) y el
         desplazamiento se limita para que no asomen sus bordes */
      /* Lo que puede taparse el visor es la ZONA NÍTIDA de la foto (PHOTO_VIEW), no la imagen
         entera: fuera de ahí hay relleno de pared y, en dos de ellas, primer plano desenfocado. */
      const Upx = CM / ROOM.pxPerCm, vw = PHOTO_VIEW[ROOM.id];
      let rw, rh, rcx, rcy;
      if(vw){
        rw = vw.w*Upx; rh = vw.h*Upx;
        rcx = cx + (vw.x + vw.w/2 - ROOM.w/2)*Upx;
        rcy = cy - (vw.y + vw.h/2 - ROOM.h/2)*Upx;
      } else {
        const pad = ROOM.pad;
        rw = pad ? pw - 2*pad[0]*Upx : pw; rh = pad ? ph - pad[2]*Upx : ph;
        rcx = cx; rcy = pad ? cy + pad[2]*Upx/2 : cy;
      }
      const sCover = Math.max(visW/rw, visH/rh) * (isFlat() ? 1.0 : 1.06);
      /* La foto tapa el visor y el cuadro sale al tamaño que le toca sobre ella. Antes había
         un `Math.max(sCover, sFit*0.85)` para que la composición no quedara pequeña, pero con
         un cuadro suelto sFit es enorme y ampliaba la habitación hasta lo absurdo. */
      /* sin bruma, la foto tapa siempre todo el visor (sin franjas blancas a los lados) */
      const s0 = SIN_BRUMA ? sCover : Math.min(sFit, sCover);
      /* con conjunto, la vista se acerca a la foto (hasta ROOM_ZOOM_MAX) para que el conjunto
         ocupe en torno al 40% del ancho (su ancho real, sin el aire de maxW); si no, uno pequeño salía perdido en la habitación */
      /* 12-oct · Cuánto ocupa el conjunto depende de su ancho: los pequeños se acercan hasta un 40% del
         ancho (con el tope de ROOM_ZOOM_MAX) y los grandes se quedan en un 28%, con más habitación alrededor */
      const llenar = WALL ? ROOM_FILL_SMALL - (ROOM_FILL_SMALL - ROOM_FILL_BIG) * Math.max(0, Math.min(1, (WALL.width - 60) / 90)) : 0;
      const sAuto = WALL ? Math.max(SIN_BRUMA ? s0 : 0, Math.min(sFit, Math.max(s0, Math.min(usableW*llenar/(WALL.width*CM), sCover*ROOM_ZOOM_MAX)))) : s0;
      /* el cliente puede alejarse desde ese encuadre hasta ver la habitación entera (ROOM_LEJOS) */
      s = s0 + (sAuto - s0) * (1 - ROOM_LEJOS);
      fitAuto = sAuto; fitMin = s0;
      /* foto más grande que el visor: no pueden asomar sus bordes. Foto más pequeña (conjunto tan
         grande que hay que alejarse más que la foto): con conjunto se coloca donde el conjunto
         quede centrado, sin sacar la foto del visor; antes se centraba la foto y un conjunto alto
         acababa debajo de la barra de arriba. */
      const clampIn = (v, lo, hi) => lo <= hi ? Math.max(lo, Math.min(hi, v)) : (WALL ? Math.max(hi, Math.min(lo, v)) : (lo + hi)/2);
      const uTop = visH/2 - visH*topPx/hpx, uBot = -visH/2 + visH*botPx/hpx;
      for(let i = 0; i < 30; i++){
        px = -visW * (rightPx/(2*wpx));
        py =  visH * ((botPx-topPx)/(2*hpx));
        /* Con un cuadro suelto sobra mucho alto por debajo y se veía solo pared: la vista baja
           hasta 45 cm para que entre el mueble. Con una composición grande apenas sobra nada y
           el sesgo se queda en casi cero. */
        let bias = Math.min(Math.max(0, visH/s - totalH) * 0.35, 45*CM) * s;
        /* con conjunto, el sesgo no puede subirlo hasta meterlo bajo la barra de arriba */
        if(WALL) bias = Math.min(bias, Math.max(0, uTop - visH*0.05 - (py + (fcy + totalH/2)*s)));
        py += bias;
        px = clampIn(px,  visW/2 - (rcx + rw/2)*s, -visW/2 - (rcx - rw/2)*s);
        py = clampIn(py,  visH/2 - (rcy + rh/2)*s, -visH/2 - (rcy - rh/2)*s);
        /* al acercarse, el borde de la foto puede dejar el conjunto debajo de las barras de
           arriba o de abajo, o el mueble fuera de la vista (solo pared): entonces se acerca menos */
        /* 17-oct · `mueble` (fotos/_calibracion_entornos.py) es la fila que tiene que verse siempre: 25 cm
           dentro del mueble de debajo. Al acercarse nunca se queda en pared lisa. */
        const filaM = ROOM.mueble || ROOM.anchorBottomY;
        muebleY = filaM ? py + (cy - (filaM - ROOM.h/2)*Upx)*s : null; uBotF = uBot;
        const mueble = filaM ? muebleY >= uBot + visH*(ROOM.mueble ? 0.02 : 0.14) : true;
        const dentro = py + (fcy + totalH/2)*s <= uTop && py + (fcy - totalH/2)*s >= uBot;
        /* 12-oct · un conjunto tiene que verse SIEMPRE entero: si ni con la foto tapando justo el
           visor entra (cuelga muy arriba en la foto, o es muy alto), se aleja un poco más aunque
           asome el borde de la foto. `apurado` avisa para que se pruebe otra habitación. */
        const sMin = WALL ? s0*0.55 : s0;
        apurado = !!WALL && (!dentro || s < s0*0.999);
        if(dentro && (mueble || s <= s0)) break;
        if(s <= (dentro ? s0 : sMin)) break;
        s = Math.max(dentro ? s0 : sMin, s*0.94);
      }
    }
  }
  FIT = { s, px, py, cx: -visW * (rightPx/(2*wpx)), cy: visH * ((botPx-topPx)/(2*hpx)), usableW, usableH, sAuto: fitAuto, s0: fitMin, apurado, muebleY, uBot: uBotF, visH, visW, compW: WALL ? WALL.width*CM*s : 0, compH: WALL ? WALL.height*CM*s : 0 };
  /* con foto de entorno el grupo se aleja del pivote (órbita amplia = mirar alrededor) */
  const gz = (WALL && ROOM_CFG.mode === 'photo') ? PIVOT_R : 0;
  orbitPivot.position.z = -gz; group.position.z = gz;
  if(_flyIn && wideFrame){
    /* viaje de entrada (Sobremesa): arranca viendo la habitación, un poco de lado, y se acerca
       con un solo movimiento suave y continuo hasta tener el Sobremesa delante */
    _flyIn = false;
    const sW = Math.min(1, (usableW*0.90)/wideFrame.maxW, (usableH*0.96)/wideFrame.totalH);
    gsap.killTweensOf(group.scale); gsap.killTweensOf(camFrame); gsap.killTweensOf(window, 'tRy');
    group.scale.set(sW, sW, sW); group.userData.framed = true;
    camFrame.x = -visW * (rightPx/(2*wpx)) - fcx*sW;
    camFrame.y =  visH * ((botPx-topPx)/(2*hpx)) - wideFrame.fcy*sW;
    const sc = findScene(ROOM_CFG.scene), ry1 = sc.flyRy != null ? sc.flyRy : REST_RY;
    cRy = tRy = ry1 + (sc.flyRy0 != null ? sc.flyRy0 : 0.42); cRx = tRx = REST_RX;
    const D = 3.2, E = 'power2.inOut', upd = () => { dirty3D = true; };
    _flyUntil = performance.now() + D*1000;
    gsap.to(group.scale, { x:s, y:s, z:s, duration:D, ease:E, onUpdate:upd });
    gsap.to(camFrame,    { x:px, y:py,    duration:D, ease:E, onUpdate:upd });
    const rot = { v: tRy }; gsap.to(rot, { v: ry1, duration:D, ease:E, onUpdate:() => { tRy = cRy = rot.v; upd(); } });
    dirty3D = true;
  } else if(roomFlyGo){
    /* viaje de la habitación entera al conjunto (el encuadre de lejos ya está puesto) */
    const D = 2.2, E = 'power2.inOut', upd = () => { dirty3D = true; };
    gsap.killTweensOf(group.scale); gsap.killTweensOf(camFrame);
    /* si la habitación entera y el encuadre del conjunto casi coinciden, se arranca algo más lejos
       (la bruma difumina los bordes) para que se note que la vista entra en la habitación */
    if(group.scale.x > s/1.25){ const k = 1/1.35; group.scale.set(s*k, s*k, s*k); camFrame.x = px; camFrame.y = py; }
    _flyUntil = performance.now() + (D + .45)*1000;
    gsap.to(group.scale, { x:s, y:s, z:s, duration:D, delay:.45, ease:E, onUpdate:upd });
    gsap.to(camFrame,    { x:px, y:py,    duration:D, delay:.45, ease:E, onUpdate:upd });
    dirty3D = true;
  } else if(performance.now() < _flyUntil){
    /* a mitad del viaje de entrada otro layout() (texturas, modelos que terminan de cargar…) lo
       cortaba con un ajuste de .45 s y la cámara llegaba de golpe: mientras dura, se deja seguir */
  } else if(!(group.scale.x > 0) || !group.userData.framed){
    // primer encuadre (o estado raro): directo, sin animar
    gsap.killTweensOf(group.scale); gsap.killTweensOf(camFrame);
    group.scale.set(s, s, s); group.userData.framed = true; dirty3D = true;
    camFrame.x = px; camFrame.y = py;
  } else {
    gsap.to(group.scale, { x:s, y:s, z:s, duration:.45, ease:'power2.out', onUpdate:()=>{dirty3D=true;} });
    gsap.to(camFrame,    { x:px, y:py,    duration:.45, ease:'power2.out', onUpdate:()=>{dirty3D=true;} });
  }
  applySelection();
}

/* el póster que se está editando se centra (x:0,y:0); los demás se apartan a los
   lados en una sola fila (los que iban antes que él a la izquierda, los que iban
   después a la derecha) para que no queden unos encima de otros */
function applySelection(){
  const editing = panelOpen && POSTERS[selected];
  const pos = {};
  if(editing && !WALL){
    const p0 = POSTERS[selected];
    pos[selected] = {x:0, y:0};
    let leftX = -((baseW(p0)*(p0.sizeScale||1)*1.05)/2 + GAP);
    for(let i=selected-1; i>=0; i--){
      const p=POSTERS[i], w=baseW(p)*(p.sizeScale||1);
      pos[i] = {x: leftX - w/2, y:0};
      leftX -= (w + GAP);
    }
    let rightX = (baseW(p0)*(p0.sizeScale||1)*1.05)/2 + GAP;
    for(let i=selected+1; i<POSTERS.length; i++){
      const p=POSTERS[i], w=baseW(p)*(p.sizeScale||1);
      pos[i] = {x: rightX + w/2, y:0};
      rightX += (w + GAP);
    }
  }
  POSTERS.forEach((p,i)=>{
    const on = editing && i === selected;
    const base = p.sizeScale || 1, sc = on ? base*1.05 : base;
    let t = pos[i] || {x:p.baseX||0, y:p.baseY||0}, z = on ? 0.35 : 0;
    /* dorso con entorno: primero se despega y se acerca, luego gira; al volver, al revés
       (gira de cara y después vuelve a su sitio en la pared). Así nunca atraviesa la pared. */
    const flip = !!(on && FACE_BACK && ROOM_CFG.mode !== 'none' && FIT);
    if(flip){ t = showcasePose(p, sc); z = t.z; }
    if(p.flipA == null){ p.flipA = 0; p.shadowK = 1; }   // gsap solo anima propiedades que ya existen
    const turned = p.flipA > 0.01;
    gsap.to(p.rig.position, { x:t.x, y:t.y, z, duration:.45, delay: !flip && turned ? .55 : 0, ease:'power2.inOut', overwrite:'auto', onUpdate:()=>{dirty3D=true;} });
    gsap.to(p.rig.scale,    { x:sc, y:sc, z:1, duration:.4, ease:'power2.out', onUpdate:()=>{dirty3D=true;} });
    gsap.killTweensOf(p, 'flipA,shadowK');
    gsap.to(p, { flipA: flip ? Math.PI : 0, duration:.75, delay: flip ? .3 : 0, ease:'power2.inOut', onUpdate:()=>{dirty3D=true;} });
    gsap.to(p, { shadowK: flip ? 0 : 1, duration:.25, delay: flip ? 0 : (turned ? .9 : 0), onUpdate:()=>{dirty3D=true;} });
  });
}

/* dónde se pone el cuadro para enseñar el dorso con entorno: en el centro del hueco libre del
   visor, a ~3/4 de su alto, y siempre lo bastante separado de la pared para girar sin tocarla */
function showcasePose(p, sc){
  const Z = tZ, zr = Z / BASEZ, s = FIT.s;
  const W0 = baseW(p)*sc*s, H0 = baseH(p)*sc*s;
  const want = Math.min(FIT.usableH*0.74, FIT.usableW*0.80 * H0/W0);     // alto en pantalla (unidades a BASEZ)
  let zW = Z - H0*BASEZ/want;
  zW = Math.min(Math.max(zW, s*(baseW(p)*sc/2 + 0.12)), Z*0.8);
  const xW = FIT.cx/BASEZ*(Z - zW), yW = FIT.cy/BASEZ*(Z - zW);
  return { x:(xW - FIT.px*zr)/s, y:(yW - FIT.py*zr)/s, z:zW/s };
}

/* Delante / Detrás del cuadro que se edita. Sin entorno gira todo, como siempre (y se acerca
   la cámara para leer la dedicatoria); con entorno el cuadro se despega de la pared y gira solo. */
function setFace(back){
  FACE_BACK = !!back;
  if(ROOM_CFG.mode === 'none'){ flipToFace(FACE_BACK ? Math.PI : 0); zoomForBack(FACE_BACK); }
  applySelection(); syncFaceTabs();
}
function syncFaceTabs(){
  document.querySelectorAll('#faceTabs [data-face]').forEach(b => {
    const on = (b.dataset.face === 'back') === FACE_BACK;
    b.classList.toggle('active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

/* ═══════════ ROTACIÓN / ZOOM (modelo sube-tu-foto: objetivo + easing, 0 render en reposo) ═══════════ */
const REST_RY = 0.15, REST_RX = -0.04;   // pose de reposo de Futsides (coge bien los reflejos)
let tRy=REST_RY, cRy=REST_RY, tRx=REST_RX, cRx=REST_RX, tZ=BASEZ, cZ=BASEZ;
let textDrag=null;
const hintEl = document.getElementById('pvHint');

/* gira todos los pósters hacia una cara por el camino más corto */
/* En 2D el cuadro está quieto y de frente: con el brillo del aluminio (pensado para cuando se
   gira) salía una mancha de luz blanca encima de la foto y un velo en los de la pared. Mientras
   está fijo de frente se apaga casi todo el reflejo; al girarlo (dorso, 3D) vuelve poco a poco. */
function flatTarget(p){ return isFlat() && !((p.flipA || 0) > 0.01) ? 1 : 0; }
function applyFlatGloss(p){
  const t = flatTarget(p);
  p.flatK = p.flatK == null ? t : p.flatK + (t - p.flatK)*.12;
  if(Math.abs(t - p.flatK) < 1e-3) p.flatK = t;
  const k = p.flatK, m = p.frontMat;
  m.clearcoat = 1 - .85*k; m.clearcoatRoughness = .02 + .33*k;
  m.roughness = .045 + .40*k; m.envMapIntensity = 1.18 - .68*k; m.specularIntensity = 1 - .75*k;
  if(m.userData.uFlat) m.userData.uFlat.value = k;           // 2D: colores reales, sin luces (ver lightPatch)
}
function flipToFace(a){ tRy = a + 2*Math.PI*Math.round((cRy-a)/(2*Math.PI)); }
/* con una pared activa la pose de reposo es de frente (como una foto de la pared) */
function restRy(){ return WALL ? 0 : REST_RY; }
function restRx(){ return WALL ? 0 : REST_RX; }

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pickHit(mx,my,objs){
  const r = canvas.getBoundingClientRect();
  ndc.x = ((mx-r.left)/r.width)*2 - 1;
  ndc.y = -((my-r.top)/r.height)*2 + 1;
  ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(objs, false);
  return hits[0] || null;
}
const clampPct = v => Math.max(5, Math.min(95, v));

/* ── VER EN MI PARED: la foto no se toca, se arrastran los cuadros ────────────────
   En una foto del cliente no tiene sentido orbitar: no hay 3D detrás, y al girar la
   escena parecía que se movía la pared. Aquí el arrastre recoloca la composición
   sobre la foto, que es lo que de verdad quiere hacer quien sube una foto de su casa. */
function isMyWall(){ return !!(ROOM && ROOM.custom && ROOM_CFG.mode === 'photo' && isFlat() && photoMesh && photoMesh.visible); }

/* píxel de la foto que hay bajo el puntero (exacto, por raycast: no depende del zoom) */
function photoPxAt(mx, my){
  if(!photoMesh) return null;
  const h = pickHit(mx, my, [photoMesh]);
  if(!h || !h.uv) return null;
  return { x: h.uv.x * ROOM.w, y: (1 - h.uv.y) * ROOM.h };
}

/* recoloca la composición sobre la foto, sin dejar que se salga por ningún lado */
function moveComposition(ax, ay){
  if(!ROOM) return;
  const ppc = ROOM.pxPerCm, halfW = COMP_U.w/CM/2*ppc, hh = COMP_U.h/CM*ppc;
  const clamp = (v, lo, hi) => lo <= hi ? Math.max(lo, Math.min(hi, v)) : (lo + hi)/2;
  ROOM.anchorX       = clamp(ax, halfW, ROOM.w - halfW);
  ROOM.anchorBottomY = clamp(ay, hh, ROOM.h);
  layout();
  dirty3D = true;
}

/* el cartel y la ayuda del visor cambian según se pueda girar o solo arrastrar */
function syncViewerHint(){
  const b = document.getElementById('pvBadge'), h = document.getElementById('pvHint');
  const mine = isMyWall();
  if(b) b.textContent = mine ? 'TU PARED · COLÓCALOS' : isFlat() ? '2D · DE FRENTE' : '3D · GÍRALO';
  if(h) h.innerHTML = mine
    ? '<span class="es">Arrastra los cuadros para colocarlos · rueda o pellizco para acercarte · toca uno para editarlo</span><span class="en">Drag the prints to place them · scroll or pinch to zoom · tap one to edit it</span>'
    : isFlat()
    ? '<span class="es">Tu foto con los cuadros puestos · toca un cuadro para editarlo · pasa a 3D para girarlo</span><span class="en">Your photo with the prints on it · tap a print to edit it · switch to 3D to rotate it</span>'
    : '<span class="es">Arrastra para girar · rueda o pellizco para zoom · toca un cuadro para editarlo</span><span class="en">Drag to rotate · scroll or pinch to zoom · tap a print to edit it</span>';
}

function moveTextTo(mx,my){
  const p = POSTERS[selected]; if(!p) return;
  if(textDrag==='back'){
    const h = pickHit(mx,my,[p.backPlane]); if(!h||!h.uv) return;
    p.backX = clampPct(h.uv.x*100); p.backY = clampPct((1-h.uv.y)*100);
    applyBackText(selected);
  } else {
    const h = pickHit(mx,my,[p.mesh]); if(!h||!h.uv) return;
    p.frontX = clampPct(h.uv.x*100); p.frontY = clampPct((1-h.uv.y)*100);
    applyFrontTexture(selected);
  }
}

/* pointer events con captura (como Futsides) + pinch-zoom */
let drag=false, apId=null, sx=0, sy=0, sRy=0, sRx=0, moved=0;
let compDrag=null;                       // arrastre de la composición sobre la foto del cliente
let pc=0, p1=null, p2=null, lpd=0;

canvas.addEventListener('pointerdown', e=>{
  if(e.cancelable) e.preventDefault();
  pc++;
  if(pc===1){
    // ¿agarras un texto del póster seleccionado?
    const p = POSTERS[selected];
    if(p && panelOpen){
      const objs=[p.mesh]; if(p.backPlane) objs.push(p.backPlane);
      const h = pickHit(e.clientX,e.clientY,objs);
      if(h){
        const cx=h.uv?h.uv.x*100:0, cy=h.uv?(1-h.uv.y)*100:0;
        if(p.backPlane && h.object===p.backPlane && p.backText && p.backText.trim()
           && Math.abs(cx-p.backX)<32 && Math.abs(cy-p.backY)<18){ textDrag='back'; }
        else if(h.object===p.mesh && h.face && h.face.normal.z>0.5 && p.frontText && p.frontText.trim()
           && Math.abs(cx-p.frontX)<32 && Math.abs(cy-p.frontY)<18){ textDrag='front'; }
      }
    }
    hintEl.style.opacity='0';
    apId=e.pointerId; sx=e.clientX; sy=e.clientY; sRy=tRy; sRx=tRx; moved=0;
    p1={id:e.pointerId,x:e.clientX,y:e.clientY};
    if(textDrag){ moveTextTo(e.clientX,e.clientY); }
    else {
      drag=true;
      // sobre la foto del cliente, el arrastre mueve los cuadros y no la escena
      if(isMyWall()){
        const q = photoPxAt(e.clientX, e.clientY);
        if(q) compDrag = { px:q.x, py:q.y, ax:ROOM.anchorX, ay:ROOM.anchorBottomY };
      }
    }
    try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
  } else if(pc===2){
    drag=false; textDrag=null;
    p2={id:e.pointerId,x:e.clientX,y:e.clientY};
    if(p1) lpd=Math.hypot(p2.x-p1.x,p2.y-p1.y);
  }
},{passive:false});

canvas.addEventListener('pointermove', e=>{
  if(p1&&e.pointerId===p1.id) p1={id:e.pointerId,x:e.clientX,y:e.clientY};
  if(p2&&e.pointerId===p2.id) p2={id:e.pointerId,x:e.clientX,y:e.clientY};
  if(pc>=2&&p1&&p2){
    if(e.cancelable)e.preventDefault();
    const nd=Math.hypot(p2.x-p1.x,p2.y-p1.y);
    if(lpd>0) setZoom(tZ*(lpd/nd));
    lpd=nd; return;
  }
  if(textDrag){ if(e.cancelable)e.preventDefault(); moveTextTo(e.clientX,e.clientY); return; }
  if(!drag||(apId!==null&&e.pointerId!==apId)) return;
  if(e.cancelable)e.preventDefault();
  moved = Math.abs(e.clientX-sx)+Math.abs(e.clientY-sy);
  if(compDrag){
    const q = photoPxAt(e.clientX, e.clientY);      // si el dedo se sale de la foto, se queda donde estaba
    if(q) moveComposition(compDrag.ax + (q.x - compDrag.px), compDrag.ay + (q.y - compDrag.py));
    return;
  }
  tRy = sRy+(e.clientX-sx)*.0105;
  tRx = Math.max(-.55,Math.min(.55,sRx+(e.clientY-sy)*.0065));
  if(isFlat()){ tRy = 0; tRx = 0; }                                                                                          // vista 2D: de frente y quieta
  else if(ROOM_CFG.mode !== 'none'){   // sin entorno no hay tope: el cuadro gira entero, como siempre
    if(ROOM_CFG.mode === 'photo'){ tRy = Math.max(-.16, Math.min(.16, tRy)); tRx = Math.max(-.06, Math.min(.08, tRx)); }   // foto: mirar alrededor (paralaje)
    else { tRy = Math.max(-.85, Math.min(.85, tRy)); tRx = Math.max(-.12, Math.min(.42, tRx)); }                           // habitación dibujada: orbitar
  }
},{passive:false});

const up3d = e=>{
  pc=Math.max(0,pc-1);
  if(p1&&e.pointerId===p1.id)p1=null;
  if(p2&&e.pointerId===p2.id)p2=null;
  if(pc<2)lpd=0;
  if(apId!==null&&e.pointerId===apId){
    const wasText=!!textDrag;
    drag=false; textDrag=null;
    if(compDrag){ compDrag=null; scheduleSave(); }
    try{ canvas.releasePointerCapture(e.pointerId); }catch(_){}
    apId=null;
    if(!wasText && moved<6) pickPoster(e.clientX,e.clientY);   // clic = seleccionar / editar
  }
};
['pointerup','pointercancel'].forEach(ev=>canvas.addEventListener(ev,up3d,{passive:false}));

canvas.addEventListener('wheel', e=>{
  if(e.cancelable)e.preventDefault();
  setZoom(tZ+(e.deltaY>0?.35:-.35));
},{passive:false});

/* zoom (rueda, pellizco y +/−). Sobre una foto de entorno nuestra antes no había zoom; ahora se
   puede acercar todo lo que se quiera, pero no alejar más que el encuadre de partida: más allá
   asomarían los bordes de la foto. */
function setZoom(z){
  const foto = ROOM_CFG.mode === 'photo' && !(ROOM && ROOM.custom);
  /* con un conjunto que se ha acercado solo, alejar más allá del encuadre de partida enseña más
     habitación (se recalcula el encuadre, así nunca asoman los bordes de la foto) hasta verla entera */
  const paso = (z - tZ) / (BASEZ * 0.35);
  if(foto && FIT && FIT.sAuto > FIT.s0 * 1.01){
    if(paso > 0 && tZ >= BASEZ - 1e-3 && ROOM_LEJOS < 1 && FIT.s > FIT.s0 * 1.01){ ROOM_LEJOS = Math.min(1, ROOM_LEJOS + paso); layout(); return; }
    if(paso < 0 && ROOM_LEJOS > 0){ ROOM_LEJOS = Math.max(0, ROOM_LEJOS + paso); layout(); return; }
  }
  /* ya se ve toda la foto: si la habitación tiene otra foto tomada desde más lejos (la horizontal de
     los conjuntos pequeños), alejar pasa a esa, enseñándola entera */
  if(foto && paso > 0 && tZ >= BASEZ - 1e-3 && (!FIT || FIT.s <= FIT.s0 * 1.01)){
    const g = ROOM.group || ROOM.id, ancho = r => r.w / r.pxPerCm;
    const lejos = PHOTO_ROOMS.filter(x => (x.group || x.id) === g && x !== ROOM && ancho(x) > ancho(ROOM) * 1.15 && (!WALL || roomFits(x, WALL)))
      .sort((a, b) => ancho(a) - ancho(b))[0];
    if(lejos){
      /* sin saltos: en la foto de lejos se deja la vista algo más abierta que la de antes, no la habitación entera de golpe */
      const antes = FIT ? 1 / FIT.s : 0;
      setRoom(lejos, true);
      for(const v of [0, .2, .4, .6, .8, 1]){ ROOM_LEJOS = v; layout(); if(FIT && 1 / FIT.s >= antes * 1.3) break; }
      return;
    }
  }
  const max = foto ? BASEZ : MAXZ;
  tZ = Math.max(foto ? zoomMinMueble() : MINZ, Math.min(max, z));
}
/* 17-oct · tope del zoom sobre una foto nuestra: se puede acercar hasta que la fila `mueble` (el mueble de
   debajo del conjunto) llegaría al borde de abajo del visor; más cerca solo se vería pared lisa. La cámara
   hace dolly hacia la pared (z=0): en pantalla y = (py·zr + (muebleY−py))·BASEZ/cZ, zr como en animate(). */
function zoomMinMueble(){
  if(!FIT || FIT.muebleY == null || FIT.uBot == null || !ROOM || !ROOM.mueble) return MINZ;
  const gz = group.position.z, lim = Math.max(-FIT.visH/2 + FIT.visH*0.10, FIT.uBot - FIT.visH*0.12);   // que asome por abajo: en PC tras la tira de miniaturas, en móvil sobre los botones
  const fila = FIT.muebleY + 15*CM*FIT.s;   // a mano basta con ver ~10 cm del mueble (la fila `mueble` son 25)
  const y = cz => (FIT.py*(cz - gz)/(BASEZ - gz) + (fila - FIT.py)) * BASEZ / cz;
  /* y el conjunto siempre entero en pantalla (al acercar, crece con BASEZ/cz) */
  const zEntero = Math.max(BASEZ*FIT.compW/(FIT.visW*0.94), BASEZ*FIT.compH/(FIT.visH*0.62));
  if(y(BASEZ) < lim) return BASEZ;
  if(y(MINZ) >= lim) return Math.min(BASEZ, Math.max(MINZ, zEntero));
  let lo = MINZ, hi = BASEZ;
  for(let i = 0; i < 30; i++){ const m = (lo + hi)/2; if(y(m) >= lim) hi = m; else lo = m; }
  return Math.min(BASEZ, Math.max(hi, zEntero));
}

/* PRUEBA (12-oct) · Bruma de los bordes: con ella, las barras de arriba y abajo se funden en blanco
   y, si el conjunto no cabe con la foto tapando todo, quedan franjas claras a los lados. Sin ella, la
   foto tapa siempre el visor. El botón de debajo del zoom la quita y la pone; se recuerda en el navegador. */
(function(){
  const b = document.getElementById('pvBruma'); if(!b) return;
  const pintar = () => { document.getElementById('editor').classList.toggle('sin-bruma', SIN_BRUMA); b.setAttribute('aria-pressed', String(!SIN_BRUMA)); b.classList.toggle('off', SIN_BRUMA); };
  pintar();
  b.addEventListener('click', () => {
    SIN_BRUMA = !SIN_BRUMA;
    try{ localStorage.setItem('mm-bruma', SIN_BRUMA ? 'no' : 'si'); }catch(e){}
    pintar(); layout();
    toast(SIN_BRUMA ? 'Sin bruma en los bordes' : 'Con bruma en los bordes');
  });
})();
/* botones +/− del visor: mismo paso que un golpe de rueda */
function stepZoom(dz){ setZoom(tZ+dz); }
document.getElementById('pvZoomIn').addEventListener('click', ()=>stepZoom(-.9));
document.getElementById('pvZoomOut').addEventListener('click', ()=>stepZoom(.9));

/* acercar la cámara sola al escribir la dedicatoria (Aitor: "por detrás se tiene que ver
   cerca para apreciar lo que has escrito") y devolverla a como estaba al salir del campo. */
let _preBackZoom = null;
function zoomForBack(active){
  if(active){
    if(_preBackZoom == null) _preBackZoom = tZ;
    tZ = MINZ + (BASEZ-MINZ)*0.12;
  } else if(_preBackZoom != null){
    tZ = _preBackZoom; _preBackZoom = null;
  }
}

/* tocar un póster: vacío → subir foto · con foto → panel de opciones */
function pickPoster(clientX,clientY){
  // tocar la peana de bambú cuenta como tocar su póster
  const objs=[], owner=new Map();
  POSTERS.forEach(p=>{
    objs.push(p.mesh); owner.set(p.mesh, p);
    if(p.bambooGroup && p.bambooGroup.visible){ objs.push(p.bamboo); owner.set(p.bamboo, p); }
  });
  const h = pickHit(clientX,clientY, objs);
  if(!h){ closePanel(); return; }
  const idx = POSTERS.indexOf(owner.get(h.object));
  if(idx<0) return;
  if(!POSTERS[idx].srcImg){ selectPoster(idx); pickMode='replace'; fileInput.click(); return; }
  selectPoster(idx); openPanel();
}

/* ═══════════ BUCLE 3D: solo con el editor abierto; en reposo, 0 renders ═══════════ */
let editorOpen=false, raf3d=0, needResize=true;
if(window.ResizeObserver){ try{ new ResizeObserver(()=>{ if(editorOpen) needResize=true; }).observe(stage); }catch(_){} }
window.addEventListener('resize', ()=>{ if(editorOpen) needResize=true; });

function resize3D(){
  const w = Math.max(stage.clientWidth||1,1), h = Math.max(stage.clientHeight||1,1);
  camera.aspect = w/h; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(w,h,false);
  layout();
}
function animate(){
  if(!editorOpen){ raf3d=0; return; }
  raf3d=requestAnimationFrame(animate);
  if(needResize){ needResize=false; resize3D(); dirty3D=true; }
  const moving = Math.abs(tRy-cRy)>1e-4 || Math.abs(tRx-cRx)>1e-4 || Math.abs(tZ-cZ)>1e-4;
  const mounting = POSTERS.some(mountAnimating);   // peana entrando/saliendo
  const matting = POSTERS.some(p => Math.abs(flatTarget(p) - (p.flatK ?? -1)) > 1e-3);
  if(!moving && !mounting && !matting && !dirty3D) return;     // reposo: ni render ni DOM
  cRy+=(tRy-cRy)*.09; cRx+=(tRx-cRx)*.09; cZ+=(tZ-cZ)*.1;
  /* pared con salón geométrico: gira la habitación entera; con foto o sin pared: gira cada cuadro sobre sí mismo */
  const orbit = ROOM_CFG.mode !== 'none';   // sin entorno giran los cuadros uno a uno, haya conjunto o no: es la parte simple
  if(orbit){ orbitPivot.rotation.y=cRy; orbitPivot.rotation.x=cRx; }
  else     { orbitPivot.rotation.y=0;   orbitPivot.rotation.x=0;   }
  POSTERS.forEach(p=>{
    p.rig.rotation.y=(orbit?0:cRy)+(p.flipA||0); p.rig.rotation.x=orbit?0:cRx; updateMountAnim(p);
    if(p.shadow) p.shadow.material.opacity = .5*(p.shadowK ?? 1);   // despegado de la pared, sin sombra
    applyFlatGloss(p);
  });
  if(WALL && ROOM_CFG.mode === 'photo') alignForeground();
  if(lightRef && LIGHT_U.uLightOn.value > 0){
    lightRef.updateWorldMatrix(true, false);
    LIGHT_U.uLightInv.value.copy(lightRef.matrixWorld).invert();
  }
  if(photoMesh && photoMesh.visible){
    photoMesh.updateWorldMatrix(true, false);
    FG_U.uWallInv.value.copy(photoMesh.matrixWorld).invert(); FG_U.uCamPos.value.copy(camera.position);
  }
  camera.position.z=cZ;
  // el grupo se descentra para dejar sitio al panel; se reescala con el zoom para que no se le vaya del sitio
  const zr = (cZ - group.position.z) / (BASEZ - group.position.z);
  group.position.x = camFrame.x * zr;
  group.position.y = camFrame.y * zr;
  renderer.render(scene,camera);
  dirty3D=false;
}

/* ═══════════ SUBIR FOTOS (flujo Mixtiles: varias de golpe, una por póster) ═══════════ */
const fileInput = document.getElementById('fileInput');
let pickMode = 'replace';

function ingestFiles(files, mode){
  const imgs = Array.from(files||[]).filter(f=>f.type && f.type.indexOf('image/')===0);
  if(!imgs.length) return;
  _userEdited = true;
  let skipped = 0;
  imgs.forEach((file, k)=>{
    let idx;
    if(mode==='replace' && k===0){ idx = selected; }
    else {
      idx = POSTERS.findIndex(q=>!q.srcImg && !q.pendingImg);
      if(idx<0){
        if(WALL){ skipped++; return; }           // la pared tiene los huecos que tiene
        addPoster(); idx = POSTERS.length-1;
      }
    }
    const p = POSTERS[idx];
    const auto = !(mode==='replace' && k===0);   // el cliente no eligió el hueco: se puede mover al de su forma
    p.file = file;         // el archivo original: es lo que se guarda y lo que irá a imprenta
    p.pendingImg = true;   // reserva síncrona (la carga es async)
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = ()=>{
      p.pendingImg=false;
      const i=POSTERS.indexOf(p); if(i<0){ URL.revokeObjectURL(url); return; }
      // orientación automática según la foto + recorte centrado
      p.crop = {scale:1, fx:0, fy:0, cx:0.5, cy:0.5};
      const o = img.naturalWidth/img.naturalHeight >= 1.05 ? 'landscape' : 'portrait';
      p.srcImg = img;
      const fit = HANDOFF_FIT && !WALL ? HANDOFF_FIT : null; HANDOFF_FIT = null;
      if(fit && p.format !== fit.format) applyProductSize(p, defSizeOf(PRODUCTS[p.ptype] || PRODUCTS.metal, fit.format), fit.format);
      if(!WALL && p.orient !== o) setOrientation(p, o); else { applyFrontTexture(i); }
      if(WALL && auto && moveToFittingSlot(p)) applyFrontTexture(POSTERS.indexOf(p));
      if(i===selected) syncConfigUI();
      if(WALL) syncWallBar();
      updateTotal();   // con una foto más cambia el total (y el tramo de descuento)
      URL.revokeObjectURL(url);
      // Como en Mixtiles: nada más elegir la foto se pregunta el formato y el encuadre en la
      // misma pantalla — antes la foto se aplicaba en silencio con el formato que hubiera
      // puesto antes, y había que ir a buscar "Formato" dentro del panel para cambiarlo. En
      // una pared (WALL) el formato de cada hueco ya viene fijado por la composición, así que
      // aquí no hace falta preguntar: se queda rápido, como pidió Marc.
      if(!WALL && i===selected && !fit) openCropModal();
    };
    img.onerror = ()=>{ p.pendingImg=false; URL.revokeObjectURL(url); };
    img.src = url;
  });
  setTimeout(syncSuggest, 300);
  const added = imgs.length - skipped;
  if(skipped && !added) toast('La pared ya está completa: toca un cuadro para cambiar su foto');
  else if(skipped)      toast(added + (added>1?' fotos añadidas':' foto añadida') + ' · la pared no tiene más huecos');
  else toast(imgs.length>1 ? imgs.length+' fotos añadidas ✓' : 'Foto aplicada ✓');
  if(WALL) syncWallBar();
}

document.getElementById('btnAdd').addEventListener('click', ()=>{ pickMode='add'; fileInput.click(); });
/* Atajos de la fila móvil: mismo destino que tocar el centro de la foto (openPanel), o el
   selector de fotos si el cuadro seleccionado todavía no tiene ninguna. */
function openPanelOrPick(){
  const p = POSTERS[selected];
  if(!p || !p.srcImg){ pickMode = p ? 'replace' : 'add'; fileInput.click(); return; }
  openPanel();
}
document.getElementById('btnSizeIc').addEventListener('click', openPanelOrPick);
document.getElementById('btnEditIc').addEventListener('click', openPanelOrPick);
// "probar con una foto de ejemplo": carga una foto local como si el cliente la hubiera subido
const SAMPLE_PHOTO = 'fotos/stock/1474552226712-620x877.webp';
document.getElementById('btnSample').addEventListener('click', async ()=>{
  const btn = document.getElementById('btnSample');
  btn.disabled = true;
  try{
    const blob = await (await fetch(SAMPLE_PHOTO)).blob();
    const file = new File([blob], 'ejemplo.webp', {type: blob.type || 'image/webp'});
    const p = POSTERS[selected];
    ingestFiles([file], (p && !p.srcImg && !p.pendingImg) ? 'replace' : 'add');
    btn.hidden = true;
  }catch(e){ btn.disabled = false; toast('No se pudo cargar la foto de ejemplo'); }
});
document.getElementById('edpPhoto').addEventListener('click', ()=>{ pickMode='replace'; fileInput.click(); });
fileInput.addEventListener('change', e=>{ ingestFiles(e.target.files, pickMode); fileInput.value=''; });

['dragenter','dragover'].forEach(ev=>stage.addEventListener(ev, e=>{ e.preventDefault(); stage.classList.add('dropping'); }));
stage.addEventListener('dragleave', e=>{ if(e.target===stage) stage.classList.remove('dropping'); });
stage.addEventListener('drop', e=>{
  e.preventDefault(); stage.classList.remove('dropping');
  ingestFiles(e.dataTransfer && e.dataTransfer.files, 'add');
});

/* ═══════════ TEXTURAS (frontal con recorte + textos, dorso con dedicatoria) ═══════════ */
/* ctx.font ya tiene que estar puesto antes de llamar: measureText() lo necesita */
function computeLines(ctx, text, maxW){
  const words = String(text).trim().split(/\s+/);
  let line='', lines=[];
  words.forEach(w=>{ const t=line?line+' '+w:w; if(ctx.measureText(t).width>maxW && line){ lines.push(line); line=w; } else line=t; });
  if(line) lines.push(line);
  return lines;
}
function drawLines(ctx, lines, cx, cy, lh, stroke){
  const startY = cy - (lines.length-1)*lh/2;
  lines.forEach((l,i)=>{ const yy=startY+i*lh; if(stroke) ctx.strokeText(l,cx,yy); ctx.fillText(l,cx,yy); });
}
/* Tamaño de letra automático: el más grande que quepa entero en el hueco disponible, sin que
   el usuario tenga que tocar un control de tamaño (lo pidió Aitor: "que no tenga que ajustar
   el tamaño"). Prueba tamaños de mayor a menor hasta que el bloque (ancho Y alto, ya con el
   salto de línea) entra en la caja; con una frase corta sale grande, con una larga se achica
   sola en vez de desbordar el dorso. */
function fitTextSize(ctx, text, fontOfSize, maxWpx, maxHpx, minPx, maxPx, lhFactor){
  for(let px = maxPx; px >= minPx; px -= 2){
    ctx.font = fontOfSize(px);
    const lines = computeLines(ctx, text, maxWpx);
    const blockH = lines.length * px * lhFactor;
    const blockW = Math.max(1, ...lines.map(l => ctx.measureText(l).width));
    if(blockH <= maxHpx && blockW <= maxWpx) return { size: px, lines };
  }
  ctx.font = fontOfSize(minPx);
  return { size: minPx, lines: computeLines(ctx, text, maxWpx) };
}
/* El imán de pared (el colgador por defecto) ocupa un rectángulo fijo en el CENTRO del
   dorso (~44% del ancho y del alto, siempre centrado — ver magDims()). Si la dedicatoria
   cae ahí encima, el texto queda tapado por la pieza física. En vez de dejar que se solape,
   se busca el hueco libre más cercano por encima o por debajo del imán; si ni así cabe, se
   deja centrada dentro de los márgenes (mejor un poco ajustada que salirse del póster). */
function placeAwayFromObstacle(ctx, text, px, py, maxW, lh, W, H, marginPx, active){
  const lines = computeLines(ctx, text, maxW);
  const blockH = lines.length * lh;
  if(!active) return { py, lines, blockH };
  const zx0=W*0.28, zx1=W*0.72, zy0=H*0.28, zy1=H*0.72;
  const textW = Math.max(1, ...lines.map(l => ctx.measureText(l).width));
  const tx0 = px - textW/2, tx1 = px + textW/2;
  if(!(tx1>zx0 && tx0<zx1)) return { py, lines, blockH };     // ya cae a un lado, sin conflicto
  const ty0 = py - blockH/2, ty1 = py + blockH/2;
  if(!(ty1>zy0 && ty0<zy1)) return { py, lines, blockH };     // ya cae por encima/debajo, sin conflicto
  const gap = marginPx*0.6;
  const upPy = zy0 - blockH/2 - gap, downPy = zy1 + blockH/2 + gap;
  const fitsUp = upPy - blockH/2 >= marginPx, fitsDown = downPy + blockH/2 <= H - marginPx;
  if(fitsUp && fitsDown) return { py: Math.abs(upPy-py) <= Math.abs(downPy-py) ? upPy : downPy, lines, blockH };
  if(fitsUp)   return { py: upPy,   lines, blockH };
  if(fitsDown) return { py: downPy, lines, blockH };
  return { py: Math.max(marginPx+blockH/2, Math.min(H-marginPx-blockH/2, py)), lines, blockH };  // no cabe ni arriba ni abajo: se ajusta como se pueda
}
/* La fecha va a la esquina superior derecha, como un sello — pero nunca se sale del póster:
   si la fecha es tan ancha que su margen a la derecha o arriba se comería, el propio ancho
   del texto la empuja hacia el centro (su mitad no puede pasar del margen). */
function drawDateCorner(ctx, dateStr, fontStr, W, marginPx, color, strokeColor){
  ctx.save();
  ctx.font = fontStr; ctx.textAlign='right'; ctx.textBaseline='top';
  ctx.lineJoin='round'; ctx.lineWidth = Math.max(2, parseInt(fontStr,10)*0.12 || 3);
  ctx.strokeStyle = strokeColor; ctx.fillStyle = color;
  const tw = ctx.measureText(dateStr).width;
  let x = W - marginPx;                          // normal: pegada a la esquina, con su margen
  if(x - tw < marginPx) x = marginPx + tw;        // si es tan ancha que se saldría por la izquierda, retrocede hacia el centro
  const y = marginPx;
  if(strokeColor) ctx.strokeText(dateStr, x, y);   // sin contorno si no se pasa color (dorso)
  ctx.fillText(dateStr, x, y);
  ctx.restore();
}

/* ventana de recorte cover + zoom + desplazamiento (fx/fy en [-1,1]) */
function cropWindow(p, W, H){
  const img=p.srcImg, target=W/H, ar=img.naturalWidth/img.naturalHeight;
  let sw,sh;
  if(ar>target){ sh=img.naturalHeight; sw=sh*target; } else { sw=img.naturalWidth; sh=sw/target; }
  const sc=Math.max(1,Math.min(3,(p.crop&&p.crop.scale)||1));
  sw/=sc; sh/=sc;
  const maxX=img.naturalWidth-sw, maxY=img.naturalHeight-sh;
  /* 15-oct · El encuadre es el punto de la foto que queda en el centro (cx, cy, de 0 a 1). Antes era
     fx/fy = cuánto se había corrido dentro del margen que sobra, y ese margen cambia con cada proporción:
     al pasar a otro tamaño del Sobremesa o a otro formato del Cuadro, el mismo valor caía en otra
     zona de la foto. Los diseños guardados con fx/fy se pasan a cx/cy la primera vez que se pintan. */
  if(p.crop && p.crop.cx == null){
    const fx=Math.max(-1,Math.min(1,p.crop.fx||0)), fy=Math.max(-1,Math.min(1,p.crop.fy||0));
    p.crop.cx = (maxX*(0.5+0.5*fx) + sw/2) / img.naturalWidth;
    p.crop.cy = (maxY*(0.5+0.5*fy) + sh/2) / img.naturalHeight;
  }
  const cx = p.crop ? p.crop.cx : 0.5, cy = p.crop ? p.crop.cy : 0.5;
  const sx = Math.max(0, Math.min(maxX, cx*img.naturalWidth - sw/2));
  const sy = Math.max(0, Math.min(maxY, cy*img.naturalHeight - sh/2));
  return { sx, sy, sw, sh, maxX, maxY };
}

function buildFrontCanvas(p, W, H){
  W = W || texW(p); H = H || texH(p);
  const c = document.createElement('canvas'); c.width=W; c.height=H;
  const x = c.getContext('2d');
  if(p.srcImg){
    const cw = cropWindow(p, W, H);
    x.fillStyle='#fff'; x.fillRect(0,0,W,H);
    x.drawImage(p.srcImg, cw.sx,cw.sy,cw.sw,cw.sh, 0,0,W,H);
  } else {
    drawPlaceholder(x, W, H);
  }
  const scl=W/texW(p);
  if(FRONT_TEXT && p.frontText && p.frontText.trim()){
    const px=W*(p.frontX/100), py=H*(p.frontY/100);
    const maxW=Math.max(160*scl, 2*Math.min(px, W-px) - 40*scl);
    const maxH=Math.max(90*scl, 2*Math.min(py, H-py) - 40*scl);
    x.textAlign='center'; x.textBaseline='middle';
    const fit = fitTextSize(x, p.frontText, s=>fontCss(p.frontFont, s), maxW, maxH, 22*scl, 120*scl, 1.18);
    const sz = fit.size;
    p.frontSize = sz/scl;   // a talla "sin escalar", igual que antes lo dejaba el slider
    x.font = fontCss(p.frontFont, sz);
    x.lineJoin='round'; x.lineWidth=Math.max(3, sz*0.14); x.strokeStyle='rgba(0,0,0,.6)';
    x.fillStyle='#fff'; x.shadowColor='rgba(0,0,0,.45)'; x.shadowBlur=sz*0.28;
    drawLines(x, fit.lines, px, py, sz*1.18, true);
    x.shadowBlur=0;
  }
  if(FRONT_TEXT && p.frontDate && p.frontDate.trim()){
    drawDateCorner(x, p.frontDate.trim(), fontCss(p.frontFont, 30*scl), W, 26*scl, '#fff', 'rgba(0,0,0,.55)');
  }
  return c;
}

function applyFrontTexture(idx){
  scheduleSave();
  const p = POSTERS[idx];
  const c = buildFrontCanvas(p);
  const tex = tune(new THREE.CanvasTexture(c));
  const old = p.frontMat.map;
  p.frontMat.map = tex; p.frontMat.needsUpdate = true;
  if(old && old!==tex) old.dispose();
  // miniatura solo con foto (o texto): un hueco vacío enseña el icono de cámara
  if(p.srcImg || (p.frontText && p.frontText.trim()) || (p.frontDate && p.frontDate.trim())){ try{ p.thumb = c.toDataURL('image/jpeg', 0.82); }catch(e){ p.thumb = null; } } else p.thumb = null;
  renderThumbs(); dirty3D = true;
}

function applyPhoto(idx, img, silent){
  POSTERS[idx].srcImg = img;
  applyFrontTexture(idx);
  if(!silent) toast('Foto aplicada ✓');
}

function buildBackCanvas(p, W, H){
  const hasText = p.ptype !== 'nevera' && p.backText && p.backText.trim();
  const hasDate = p.backDate && p.backDate.trim();
  if(!hasText && !hasDate) return null;
  W = W || texW(p); H = H || texH(p);
  const scl=W/texW(p);
  const c = document.createElement('canvas'); c.width=W; c.height=H;
  const x = c.getContext('2d');
  if(hasText){
    const px=W*(p.backX/100), py0=H*(p.backY/100);
    const maxW=Math.max(160*scl, 2*Math.min(px, W-px) - 40*scl);
    const maxH=Math.max(80*scl, 2*Math.min(py0, H-py0) - 40*scl);
    x.textAlign='center'; x.textBaseline='middle';
    // tamaño automático: el más grande que entra entero (Aitor: "que no tenga que ajustar
    // el tamaño"), y luego se aparta del imán si hiciera falta con ese mismo tamaño.
    const fit = fitTextSize(x, p.backText, s=>fontCss(p.backFont, s), maxW, maxH, 18*scl, 90*scl, 1.3);
    const sz = fit.size;
    p.backSize = sz/scl;
    x.font = fontCss(p.backFont, sz);
    /* 12-oct: sin contorno blanco alrededor de las letras. La imprenta no imprime blanco, así
       que el contorno no saldría y lo que se ve aquí no sería lo que llega. Tinta sólida. */
    x.fillStyle='#262628';
    // el imán de pared (colgador por defecto) va pegado al centro del dorso: si la
    // dedicatoria cayera encima, se aparta sola al hueco libre más cercano.
    const { py, lines } = placeAwayFromObstacle(x, p.backText, px, py0, maxW, sz*1.3, W, H, 30*scl, mountOf(p) === 'iman-pared');
    drawLines(x, lines, px, py, sz*1.3, false);
  }
  if(hasDate){
    drawDateCorner(x, p.backDate.trim(), fontCss(p.backFont, 26*scl), W, 26*scl, '#262628', null);
  }
  return c;
}

function applyBackText(idx){
  scheduleSave();
  const p = POSTERS[idx];
  if(p && p.backText) ensureFont(p.backFont, () => { const i = POSTERS.indexOf(p); if(i >= 0) applyBackText(i); });
  if(p.backPlane){
    p.mesh.remove(p.backPlane);
    if(p.backPlane.material.map) p.backPlane.material.map.dispose();
    p.backPlane.material.dispose(); p.backPlane.geometry.dispose(); p.backPlane=null;
  }
  dirty3D = true;
  const c = buildBackCanvas(p);
  if(!c) return;
  const tex = tune(new THREE.CanvasTexture(c));
  const mat = new THREE.MeshBasicMaterial({ map:tex, transparent:true, toneMapped:false, side:THREE.DoubleSide,
    depthWrite:false, polygonOffset:true, polygonOffsetFactor:-4, polygonOffsetUnits:-4 });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(baseW(p)*0.98, baseH(p)*0.98), mat);
  plane.position.z = backPlaneZ(p); plane.rotation.y = Math.PI; plane.renderOrder = 20;
  p.mesh.add(plane); p.backPlane = plane;
}

/* ═══════════ THUMBS ═══════════ */
const thumbsEl = document.getElementById('pvThumbs');
function renderThumbs(){
  try{ syncSuggest(); }catch(e){}     // al arrancar aún no existen WALLS: no pasa nada
  thumbsEl.innerHTML='';
  POSTERS.forEach((p,i)=>{
    const t = document.createElement('div');
    t.className = 'pv-thumb' + (isLand(p)?' landscape':'') + (i===selected && panelOpen ? ' active' : '');
    if(p.thumb){ t.style.backgroundImage = `url(${p.thumb})`; }
    else { t.innerHTML = '<span class="pv-thumb-cam">'+'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+'<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2L8 5h8l1.5 2h2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z"/>'+'<circle cx="12" cy="12.5" r="3.2"/></svg>'+'</span>'; }
    if(POSTERS.length>1 && (!WALL || p.srcImg)){
      const del = document.createElement('span');
      del.className='pv-thumb-del'; del.textContent='✕';
      del.onclick = ev=>{ ev.stopPropagation(); removePoster(i); };
      t.appendChild(del);
    }
    t.onclick = ()=>{
      if(!p.srcImg){ selectPoster(i); pickMode='replace'; fileInput.click(); return; }
      selectPoster(i); openPanel();
    };
    thumbsEl.appendChild(t);
  });
  if(WALL) return;
  const add = document.createElement('div');
  add.className='pv-add-thumb';
  add.innerHTML = '+<small>Añadir</small>';
  add.onclick = ()=>{ pickMode='add'; fileInput.click(); };
  thumbsEl.appendChild(add);
}

function removePoster(i){
  _userEdited = true;
  if(WALL){ clearPosterPhoto(i); return; }       // en una pared el hueco se queda, se va la foto
  if(POSTERS.length<=1) return;
  group.remove(POSTERS[i].rig);
  POSTERS.splice(i,1);
  if(selected>=POSTERS.length) selected=POSTERS.length-1;
  closePanel();
  layout(); renderThumbs(); syncConfigUI(); updateTotal();
  dirty3D = true;
}

/* ═══════════ PANEL DEL PÓSTER ═══════════ */
const panelEl = document.getElementById('edPanel');
function openPanel(){
  panelOpen = true; panelEl.classList.add('open'); stage.classList.add('panel-open');
  syncConfigUI(); renderThumbs(); applySelection(); layout();
}
function closePanel(){
  if(!panelOpen) return;
  panelOpen = false; panelEl.classList.remove('open'); stage.classList.remove('panel-open');
  FACE_BACK = false; syncFaceTabs(); zoomForBack(false);
  flipToFace(restRy()); tRx = restRx();
  renderThumbs(); applySelection(); layout();
}
document.getElementById('edpClose').addEventListener('click', closePanel);
document.getElementById('edpDelete').addEventListener('click', ()=>removePoster(selected));

/* ═══════════ CHECKOUT REAL: Shopify (Storefront API) + Cloudinary (subida de la foto final) ═══════════
   "Añadir al carrito" abre siempre el panel lateral (resumen, correo y dirección). Mientras
   SHOPIFY_DOMAIN/STOREFRONT_TOKEN estén vacíos, el botón del panel solo enseña cómo quedaría el
   pedido. En cuanto se rellenen aquí (y los variantId de cada talla, más abajo en PRODUCTS)
   crea un carrito real y manda al pago de Shopify con el correo y la dirección ya puestos. */
const SHOPIFY = {
  domain: '',              // 'tu-tienda.myshopify.com'
  storefrontToken: '',     // Admin → Apps → Desarrollar apps → tu app → Storefront API → Instalar → token
};
const CLOUDINARY = {
  cloudName: '',           // cloudinary.com, plan gratis
  uploadPreset: '',        // Settings → Upload → Add upload preset → Signing Mode: Unsigned
};
const PRINT_DPI = 300;     // resolución de la foto que se manda a producción (no la del visor 3D)
const BLEED_MM = 3;        // sangrado por lado para sublimar: el archivo sigue 3 mm más allá del corte
const MAX_CANVAS_PX = 16.7e6;  // Safari en iPhone no pinta lienzos de más de 16,77 Mpx
const MAX_ORIGINAL_PX = 16e6, MAX_ORIGINAL_BYTES = 19*1024*1024;  // la tienda admite 20 Mpx y 20 MB por imagen

function printDimsPx(p){
  const d = sizeOf(p).d, shortCm = Math.min(d[0], d[1]), longCm = Math.max(d[0], d[1]);
  const shortPx = Math.round(shortCm / 2.54 * PRINT_DPI), longPx = Math.round(longCm / 2.54 * PRINT_DPI);
  return isLand(p) ? {W:longPx, H:shortPx} : {W:shortPx, H:longPx};
}

/* aviso (no bloqueante) si la foto del cliente no llega a los píxeles del tamaño elegido:
   compara el recorte real (cropWindow, ya tiene en cuenta el zoom) contra el objetivo a PRINT_DPI */
function photoIsLowRes(p){
  if(!p.srcImg) return false;
  const {W,H} = printDimsPx(p);
  const cw = cropWindow(p, W, H);
  return cw.sw < W*0.92 || cw.sh < H*0.92;
}

function canvasToBlob(c, quality){
  return new Promise(res => c.toBlob(res, 'image/jpeg', quality||0.92));
}

async function uploadToCloudinary(blob, filename){
  if(!CLOUDINARY.cloudName || !CLOUDINARY.uploadPreset) throw new Error('Cloudinary no configurado');
  const fd = new FormData();
  fd.append('file', blob, filename);
  fd.append('upload_preset', CLOUDINARY.uploadPreset);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY.cloudName}/image/upload`, {method:'POST', body:fd});
  if(!r.ok) throw new Error('Fallo al subir la imagen a Cloudinary');
  const j = await r.json();
  return j.secure_url;
}

/* Archivo para sublimar: la medida final más BLEED_MM por lado. El corte (justo lo que vio el
   cliente, con su frase y su fecha) va en el centro. El sangrado se rellena con la parte de la
   foto que quedó fuera del recorte y, donde ya no hay más foto, con el borde reflejado: nunca blanco.
   En las medidas grandes baja un poco de PRINT_DPI si hace falta para no pasar de MAX_CANVAS_PX. */
function buildPrintCanvas(p){
  const {W:w0, H:h0} = printDimsPx(p);
  const b0 = Math.round(BLEED_MM / 25.4 * PRINT_DPI);
  const k = Math.min(1, Math.sqrt(MAX_CANVAS_PX / ((w0 + 2*b0) * (h0 + 2*b0))));
  const W = Math.round(w0*k), H = Math.round(h0*k), b = Math.round(b0*k);
  const corte = buildFrontCanvas(p, W, H);
  const c = document.createElement('canvas'); c.width = W + 2*b; c.height = H + 2*b;
  const x = c.getContext('2d');
  // 1) base: los últimos BLEED_MM del corte reflejados hacia fuera, como un espejo (y las esquinas)
  const espejo = (tx, ty, sx, sy, srcX, srcY, w, h, dx, dy) => {
    x.save(); x.translate(tx, ty); x.scale(sx, sy); x.drawImage(corte, srcX, srcY, w, h, dx, dy, w, h); x.restore();
  };
  espejo(b, b,      1, -1, 0, 0,   W, b, 0, 0);     // arriba
  espejo(b, H+b,    1, -1, 0, H-b, W, b, 0, -b);    // abajo
  espejo(b, b,     -1,  1, 0, 0,   b, H, 0, 0);     // izquierda
  espejo(W+b, b,   -1,  1, W-b, 0, b, H, -b, 0);    // derecha
  espejo(b, b,     -1, -1, 0, 0,     b, b, 0, 0);   // esquinas
  espejo(W+b, b,   -1, -1, W-b, 0,   b, b, -b, 0);
  espejo(b, H+b,   -1, -1, 0, H-b,   b, b, 0, -b);
  espejo(W+b, H+b, -1, -1, W-b, H-b, b, b, -b, -b);
  // 2) encima, la foto de verdad que hay alrededor del recorte, hasta donde llegue
  if(p.srcImg){
    const img = p.srcImg, cw = cropWindow(p, W, H), s = cw.sw / W;
    const sx0 = Math.max(0, cw.sx - b*s), sy0 = Math.max(0, cw.sy - b*s);
    const sx1 = Math.min(img.naturalWidth, cw.sx + cw.sw + b*s), sy1 = Math.min(img.naturalHeight, cw.sy + cw.sh + b*s);
    x.drawImage(img, sx0, sy0, sx1-sx0, sy1-sy0, b + (sx0-cw.sx)/s, b + (sy0-cw.sy)/s, (sx1-sx0)/s, (sy1-sy0)/s);
  }
  // 3) el corte tal cual, en el centro
  x.drawImage(corte, b, b);
  corte.width = corte.height = 0;   // libera memoria en el móvil
  return {canvas:c, dpi:Math.round(PRINT_DPI*k), cm:[(W+2*b)/(PRINT_DPI*k)*2.54, (H+2*b)/(PRINT_DPI*k)*2.54]};
}

/* escribe los ppp en la cabecera JFIF del JPG: sin ellos, el programa de impresión lo abre
   a 72 ppp y con un tamaño que no es. El lienzo del navegador no los pone. */
async function jpgConDpi(blob, dpi){
  const u = new Uint8Array(await blob.arrayBuffer());
  if(u[0] !== 0xFF || u[1] !== 0xD8) return blob;
  const jfif = u[2] === 0xFF && u[3] === 0xE0 && String.fromCharCode(u[6], u[7], u[8], u[9]) === 'JFIF';
  const app0 = [0xFF,0xE0, 0,16, 0x4A,0x46,0x49,0x46,0, 1,1, 1, dpi>>8,dpi&255, dpi>>8,dpi&255, 0,0];
  if(jfif){ u[13] = 1; u[14] = dpi>>8; u[15] = dpi&255; u[16] = dpi>>8; u[17] = dpi&255; return new Blob([u], {type:'image/jpeg'}); }
  return new Blob([u.subarray(0,2), new Uint8Array(app0), u.subarray(2)], {type:'image/jpeg'});
}

/* la foto original del cliente, para poder rehacer el recorte sin pedírsela otra vez.
   Si es HEIC, pesa más de lo que admite la tienda o pasa de MAX_ORIGINAL_PX, va en JPG
   a la mayor resolución que cabe */
async function originalBlob(p){
  const f = p.file, img = p.srcImg;
  const px = img.naturalWidth * img.naturalHeight;
  if(f && /^image\/(jpeg|png|webp)$/.test(f.type) && f.size <= MAX_ORIGINAL_BYTES && px <= MAX_ORIGINAL_PX) return f;
  const k = Math.min(1, Math.sqrt(MAX_ORIGINAL_PX / px));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth*k); c.height = Math.round(img.naturalHeight*k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return canvasToBlob(c, 0.95);
}

/* imágenes finales de impresión (a PRINT_DPI, no al tamaño reducido del visor 3D), la original
   y la dedicatoria, subidas a la vez */
async function uploadPosterArt(p){
  const t = Date.now();
  const print = buildPrintCanvas(p);
  const frontBlob = await jpgConDpi(await canvasToBlob(print.canvas, 0.95), print.dpi);
  print.canvas.width = print.canvas.height = 0;   // libera memoria en el móvil antes del siguiente
  const {W,H} = printDimsPx(p);
  const backCanvas = buildBackCanvas(p, W, H);
  const backBlob = backCanvas ? await jpgConDpi(await canvasToBlob(backCanvas), PRINT_DPI) : null;
  const orig = await originalBlob(p);
  const ext = orig.type === 'image/png' ? 'png' : orig.type === 'image/webp' ? 'webp' : 'jpg';
  const [frontUrl, backUrl, originalUrl] = await Promise.all([
    uploadToCloudinary(frontBlob, `impresion-${t}.jpg`),
    backBlob ? uploadToCloudinary(backBlob, `dedicatoria-${t}.jpg`) : null,
    // la original es un extra: si no sube, el pedido sigue con el archivo de impresión
    uploadToCloudinary(orig, `original-${t}.${ext}`).catch(e => { console.warn('[Momenturies] Original sin subir:', e.message); return null; }),
  ]);
  const medida = `${print.cm.map(n => n.toFixed(1).replace('.', ',')).join('×')} cm (con ${BLEED_MM} mm de sangrado) a ${print.dpi} ppp`;
  return {frontUrl, backUrl, originalUrl, medida};
}

function variantIdOf(p){
  const s = sizeOf(p);
  return s.variantIds ? s.variantIds[mountOf(p)] : s.variantId;
}

async function shopifyGraphQL(query, variables){
  const r = await fetch(`https://${SHOPIFY.domain}/api/2025-01/graphql.json`, {
    method:'POST',
    headers:{'Content-Type':'application/json', 'X-Shopify-Storefront-Access-Token':SHOPIFY.storefrontToken},
    body: JSON.stringify({query, variables}),
  });
  const j = await r.json();
  if(j.errors) throw new Error(j.errors.map(e=>e.message).join('; '));
  return j.data;
}

async function shopifyCreateCart(lines, buyerIdentity){
  const query = `mutation cartCreate($input:CartInput!){
    cartCreate(input:$input){ cart{ id checkoutUrl
      deliveryGroups(first:5){ nodes{ id deliveryOptions{ handle title } } } }
      userErrors{ message } }
  }`;
  const crear = async input => {
    const data = await shopifyGraphQL(query, {input});
    const errs = data.cartCreate.userErrors;
    if(errs && errs.length) throw new Error(errs.map(e=>e.message).join('; '));
    return data.cartCreate.cart;
  };
  if(!buyerIdentity) return crear({lines});
  // si Shopify rechaza algún dato del cliente, el pedido sigue: lo rellenará en la página de pago
  try{ return await crear({lines, buyerIdentity}); }
  catch(e){ console.warn('[Momenturies] Carrito sin datos del cliente:', e.message); return crear({lines}); }
}

/* deja marcado en Shopify el envío exprés si se eligió en el panel (el estándar ya sale por defecto) */
async function shopifySelectShipping(cart, shipId){
  if(shipId !== 'exp') return;
  try{
    const sel = [];
    for(const g of cart.deliveryGroups.nodes){
      const o = g.deliveryOptions.find(o => /expr[eé]s|express/i.test(o.title));
      if(o) sel.push({deliveryGroupId:g.id, deliveryOptionHandle:o.handle});
    }
    if(!sel.length) return;
    await shopifyGraphQL(`mutation($cartId:ID!, $sel:[CartSelectedDeliveryOptionInput!]!){
      cartSelectedDeliveryOptionsUpdate(cartId:$cartId, selectedDeliveryOptions:$sel){ userErrors{ message } }
    }`, {cartId:cart.id, sel});
  }catch(e){ console.warn('[Momenturies] No se pudo marcar el envío:', e.message); }
}

async function checkoutWithShopify(buyerIdentity, shipId){
  const lines = [];
  for(const p of POSTERS){
    if(!p.srcImg) continue;
    const variantId = variantIdOf(p);
    if(!variantId) throw new Error(`Falta el variantId de Shopify para ${prodOf(p).name} ${p.sizeKey}${p.ptype==='metal' ? ' / '+mountOf(p) : ''}`);
    const {frontUrl, backUrl, originalUrl, medida} = await uploadPosterArt(p);
    const attributes = [
      {key:'_foto_frontal', value: frontUrl},
      {key:'_impresion', value: medida},
      {key:'Colgador', value: MOUNTS[mountOf(p)] ? MOUNTS[mountOf(p)].label : mountOf(p)},
    ];
    if(p.frontText && p.frontText.trim()) attributes.push({key:'Frase (frontal)', value:p.frontText.trim()});
    if(p.frontDate && p.frontDate.trim()) attributes.push({key:'Fecha (frontal)', value:p.frontDate.trim()});
    if(p.ptype !== 'nevera' && p.backText && p.backText.trim()) attributes.push({key:'Dedicatoria (dorso)', value:p.backText.trim()});
    if(p.backDate && p.backDate.trim()) attributes.push({key:'Fecha (dorso)', value:p.backDate.trim()});
    // el dorso puede llevar solo fecha: la imagen va siempre que haya algo detrás
    if(backUrl) attributes.push({key:'_dedicatoria_imagen', value:backUrl});
    if(originalUrl) attributes.push({key:'_foto_original', value:originalUrl});
    lines.push({merchandiseId: variantId, quantity: 1, attributes});
  }
  if(!lines.length) throw new Error('Sube al menos una foto primero');
  const cart = await shopifyCreateCart(lines, buyerIdentity);
  await shopifySelectShipping(cart, shipId);
  return cart.checkoutUrl;
}

/* ═══════════ 3 PRODUCTOS: metálico (M+) / sobremesa de madera (S) / imán nevera (XS) ═══════════ */
/* Tallas y colgadores CALCADOS de futsides.com (opciones Medidas × Colgador del
   producto real). Allí la peana de madera SOLO existe en S, el imán de nevera en
   XS/S y el imán premium de pared solo en M/L/XL → cada talla cae en un producto:
     XS  7 × 10      → Imán de nevera
     S   10,2 × 15,2 → Sobremesa (peana de bambú; desde el 12-oct también 12,7×17,8 y 20,3×25,4)
     M   21 × 29,7 · L 25,5 × 36 · XL 30,5 × 43 → Cuadro de pared
   La escala 3D es proporcional al lado largo real (S = 1). */
/* MOMENTURIES DIFERENTES FORMATOS: las medidas son las de verdad de los paneles de aluminio
   sublimables que se compran (brildor.com/es/paneles-aluminio-blanco-brillo-sublimable), no
   un único A4 escalado en tres tallas. Del catálogo (10×10 a 60×80cm) solo entran aquí las
   medidas que tienen 2 o 3 tallas dentro de la MISMA proporción real — así hay "más grande o
   más pequeño" de verdad dentro del mismo formato. Las medidas sueltas del catálogo (13×18,
   20×25, 18×32cm) no tienen ni una talla más chica ni más grande en su misma proporción, así
   que se han dejado fuera.
   1-oct-2026: fuera también el clásico 40×60 y el retrato 60×80, porque no caben en nuestra
   plancha (40×60).
   stock:false = sin existencias en Brildor (revisado el 1-oct-2026 en su ficha). La talla se
   sigue enseñando, tachada y con "Sin existencias", pero no se puede elegir. Cuando vuelva,
   quitar el stock:false aquí Y en OUT_OF_STOCK de paredes/_build_paredes.py (y regenerar). */
const FORMATS = {
  cuadrado: { id:'cuadrado', es:'Cuadrado', en:'Square', ratio:1,
    sizes:[ {k:'S', d:[10,10], price:14.99, stock:false},
            {k:'M', d:[15,15], price:22.99, stock:false},
            {k:'L', d:[30,30], price:54.99} ] },
  clasico: { id:'clasico', es:'Clásico', en:'Classic', ratio:2/3,
    sizes:[ {k:'S', d:[10,15], price:17.99},
            {k:'M', d:[20,30], price:39.99, stock:false} ] },
  retrato: { id:'retrato', es:'Retrato', en:'Portrait', ratio:3/4,
    sizes:[ {k:'S', d:[12,16], price:19.99},
            {k:'M', d:[18,24], price:34.99},
            {k:'L', d:[24,32], price:49.99, stock:false},
            {k:'XL',d:[30,40], price:69.99} ] },   // 30×40 (1-oct): en stock en Brildor y cabe en la plancha; precio provisional
};
const inStock = s => !!s && s.stock !== false;
/* la talla que se pone al cambiar de formato o al restaurar un diseño: la pedida si hay
   existencias; si no, la más cercana a ella que sí tenga (o la pedida, si todo está agotado) */
function pickSize(list, wantK){
  const want = list.find(s=>s.k===wantK) || list[Math.floor(list.length/2)];
  if(inStock(want)) return want;
  const i = list.indexOf(want);
  return list.filter(inStock).sort((a,b)=>Math.abs(list.indexOf(a)-i)-Math.abs(list.indexOf(b)-i))[0] || want;
}
const sizeStockTag = s => inStock(s) ? '' : '<em class="size-soldout"><span class="es">Sin existencias</span><span class="en">Out of stock</span></em>';
const FORMAT_ORDER = ['cuadrado','clasico','retrato'];
const FORMAT_DEFAULT = 'retrato', SIZE_DEFAULT = 'M';

const PRODUCTS = {
  metal:  { name:'Cuadro',               short:'Cuadro',   hanger:'iman-pared',
            mounts:['iman-pared','tiras','none'], formats:FORMATS },
  madera: { name:'Sobremesa',            short:'Sobremesa',  hanger:'madera',      def:'S',
            note:'Peana de bambú incluida.',
            /* 12-oct: la lámina con peana de bambú de ahorraentinta (ref. MAD1130) viene en tres
               medidas: 152×102, 178×127 y 254×203 mm. La peana mide siempre el lado corto.
               M y L nacen con stock:false porque todavía no existen en Shopify: cuando la tienda
               tenga los SKU SOB-M y SOB-L, la lectura de Shopify les pone precio, variante y
               existencias, y se pueden elegir sin tocar nada aquí. Precios provisionales. */
            /* 13-oct: cada medida tiene su proporción (10×15, 13×18 y 20×25, las de foto de siempre),
               así que formato y tamaño son la misma elección: se enseñan en una sola fila de
               tarjetas con su forma, los cm debajo y el precio (sizeAsFormatChips). */
            oneRow:true,
            sizes:[ {k:'S',d:[10.2,15.2],price:28.99, variantId:null, es:'Pequeño', en:'Small'},
                    {k:'M',d:[12.7,17.8],price:34.99, variantId:null, stock:false, es:'Mediano', en:'Medium'},
                    {k:'L',d:[20.3,25.4],price:44.99, variantId:null, stock:false, es:'Grande', en:'Large'} ] },
  nevera: { name:'Imán',                 short:'Imán',     hanger:'iman-nevera', def:'XS',
            note:'Imán trasero incluido.',
            sizes:[ {k:'XS',d:[7,10],price:9.99, variantId:null} ] },
};
/* colgado del póster de pared: las 3 opciones van incluidas en el precio */
const MOUNTS = {
  'iman-pared': { label:'Imán premium', hint:'incluido' },
  'tiras':      { label:'Tiras adhesivas', hint:'sin agujeros' },
  'none':       { label:'Sin colgador', hint:'lo pongo yo' },
};
let defaultType = ((window.MOMENTURIES_EDITOR||{}).product && PRODUCTS[(window.MOMENTURIES_EDITOR||{}).product]) ? window.MOMENTURIES_EDITOR.product : 'metal';
const cm = n => String(n).replace('.', ',');     // 29.7 → 29,7
const prodOf = p => PRODUCTS[p.ptype] || PRODUCTS.metal;
/* el colgador que se enseña en la escena: el elegido si el producto deja elegir, si no el suyo */
const mountOf = p => { const pr=prodOf(p); return pr.mounts ? (pr.mounts.includes(p.mount)?p.mount:pr.hanger) : pr.hanger; };
/* tallas del producto actual: si tiene formatos (el Cuadro, con sus 3 proporciones), las del
   formato elegido; si no (Sobremesa/Imán, una sola talla fija), su lista de siempre */
const sizesOf = p => { const pr=prodOf(p); return pr.formats ? pr.formats[p.format||FORMAT_DEFAULT].sizes : pr.sizes; };
const sizeOf  = p => { const list = sizesOf(p); return list.find(s=>s.k===p.sizeKey) || list[0]; };
/* la talla más grande de TODO el producto (todos los formatos, no solo el elegido). Sirve solo
   para calcular el zoom del visor sin entorno, nunca la geometría real: si el zoom se ajusta a
   CADA talla por separado (lo que hacía antes), una S y una XL ocupan el mismo hueco en
   pantalla y no se nota la diferencia real entre ellas — es lo que Aitor pedía arreglar
   ("ajustar tamaños reales a la imagen"). Con esto la S se ve pequeña de verdad, dentro del
   mismo encuadre que usaría la XL. */
function maxSizeOf(p){
  const pr = prodOf(p);
  const all = pr.formats ? Object.values(pr.formats).flatMap(f=>f.sizes) : pr.sizes;
  return all.reduce((m,s) => (s.d[0]*s.d[1] > m.d[0]*m.d[1]) ? s : m, all[0]);
}
const refBaseW = p => { const d = maxSizeOf(p).d; return (isLand(p) ? d[1] : d[0]) * CM; };
const refBaseH = p => { const d = maxSizeOf(p).d; return (isLand(p) ? d[0] : d[1]) * CM; };
function defSizeOf(pr, formatId){
  const list = pr.formats ? pr.formats[formatId||FORMAT_DEFAULT].sizes : pr.sizes;
  return pickSize(list, pr.formats ? SIZE_DEFAULT : pr.def);
}
/* Cambiar de formato o de talla cambia la proporción o el tamaño real del panel: hay que
   rehacer la geometría del póster (no basta con escalarla, como antes con el A4 único). */
function rebuildPosterGeometry(p){
  p.mesh.geometry.dispose();
  p.mesh.geometry = new THREE.BoxGeometry(baseW(p), baseH(p), PD);
  rebuildMountParts(p);
  const i = POSTERS.indexOf(p);
  applyFrontTexture(i); applyBackText(i);
  applyMountVisual(p);
  layout(); dirty3D = true;
}
function applyProductSize(p, s, formatId){
  if(formatId) p.format = formatId;
  p.sizeKey = s.k; p.sizeScale = 1; p.price = s.price;
  rebuildPosterGeometry(p);
}

/* precio más bajo del producto: el de la talla S de cualquier formato si tiene formatos,
   si no la primera (y única) talla de su lista de siempre */
function cheapestPrice(pr){
  if(!pr.formats) return pr.sizes[0].price;
  return Math.min(...FORMAT_ORDER.map(fid => Math.min(...pr.formats[fid].sizes.filter(inStock).map(s => s.price))));
}
function renderPtypes(){
  const box=document.getElementById('ptypeChips'); const p=POSTERS[selected]; if(!box||!p) return;
  box.innerHTML='';
  Object.keys(PRODUCTS).forEach(k=>{
    const pr=PRODUCTS[k];
    const b=document.createElement('button');
    b.className='ptype-chip'+(p.ptype===k?' active':'');
    b.innerHTML=`${pr.short}<small>desde ${cheapestPrice(pr).toFixed(2).replace('.',',')}€</small>`;
    b.onclick=()=>setPtype(k);
    box.appendChild(b);
  });
}
/* chips de colgado (solo el póster de pared) + nota fija para los otros dos */
function renderMounts(){
  const box=document.getElementById('mountChips'), note=document.getElementById('mountNote');
  const p=POSTERS[selected]; if(!box||!p) return;
  const pr=prodOf(p);
  box.innerHTML='';
  if(pr.mounts){
    pr.mounts.forEach(id=>{
      const m=MOUNTS[id]; if(!m) return;
      const b=document.createElement('button');
      b.className='mount-chip'+(mountOf(p)===id?' active':'');
      b.innerHTML=`${m.label}<small>${m.hint}</small>`;
      b.onclick=()=>setMount(id);
      box.appendChild(b);
    });
  }
  if(note) note.textContent = pr.mounts ? '' : (pr.note||'');
}
function setMount(id){
  const p=POSTERS[selected]; if(!p||!MOUNTS[id]) return;
  p.mount=id;
  renderMounts(); renderHangerChips(); sceneSelectHanger();
  applyMountVisual(p); showMountPose(p);            // la pieza se pone en el visor
}
/* formato = la PROPORCIÓN real del panel (cuadrado/clásico/retrato). Solo el Cuadro lo tiene
   — Sobremesa e Imán son una sola pieza fija, así que la fila ni se enseña. Cambiar de
   formato reconstruye la geometría del póster (ver applyProductSize → rebuildPosterGeometry). */
/* Productos de una medida por formato (Sobremesa): una tarjeta por medida con su forma a escala
   de su proporción, el nombre, los cm debajo y el precio. Sirve al panel y a la ventana de encuadre. */
function sizeAsFormatChips(box, p, after){
  box.innerHTML='';
  sizesOf(p).forEach(s=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='format-chip format-chip-size'+(p.sizeKey===s.k?' active':'')+(inStock(s)?'':' sold-out');
    const d=isLand(p)?[s.d[1],s.d[0]]:s.d, boxH=22, boxW=Math.max(8,Math.round(boxH*d[0]/d[1]));
    b.innerHTML = `<span class="format-chip-shape" style="width:${boxW}px;height:${boxH}px"></span>`
      + `<span class="es">${s.es||s.k}</span><span class="en">${s.en||s.k}</span>`
      + `<small>${cm(d[0])} × ${cm(d[1])} cm</small><small class="format-chip-price">${String(s.price.toFixed(2)).replace('.',',')}€</small>`
      + sizeStockTag(s);
    if(!inStock(s)){ b.disabled=true; b.title='Sin existencias'; }
    b.onclick=()=>{ if(!inStock(s) || p.sizeKey===s.k) return; applyProductSize(p,s); after(); };
    box.appendChild(b);
  });
}
function renderFormats(){
  const box=document.getElementById('formatChips'), lbl=document.getElementById('formatLabel');
  const p=POSTERS[selected]; if(!box||!p) return;
  const pr=prodOf(p);
  const sizeLbl=document.getElementById('sizeLabel'), sizeGrid=document.getElementById('sizeGrid');
  if(sizeLbl) sizeLbl.hidden=!!pr.oneRow; if(sizeGrid) sizeGrid.hidden=!!pr.oneRow;
  if(pr.oneRow){
    if(lbl){ lbl.hidden=false; lbl.innerHTML='<span class="es">Formato y tamaño</span><span class="en">Format and size</span>'; }
    box.hidden=false;
    sizeAsFormatChips(box, p, ()=>{ renderFormats(); syncPanelHead(); layout(); applySelection(); updateTotal(); applyMountVisual(p); });
    return;
  }
  if(lbl) lbl.innerHTML='<span class="es">Formato</span><span class="en">Format</span>';
  if(!pr.formats){ box.innerHTML=''; box.hidden=true; if(lbl) lbl.hidden=true; return; }
  if(lbl) lbl.hidden=false; box.hidden=false;
  box.innerHTML='';
  FORMAT_ORDER.forEach(fid=>{
    const f=pr.formats[fid];
    const b=document.createElement('button');
    b.type='button';
    b.className='format-chip'+(p.format===fid?' active':'');
    const boxH=20, boxW=Math.max(6,Math.round(boxH*f.ratio));
    b.innerHTML = `<span class="format-chip-shape" style="width:${boxW}px;height:${boxH}px"></span>`
      + `<span class="es">${f.es}</span><span class="en">${f.en}</span>`;
    b.onclick=()=>{
      applyProductSize(p, pickSize(f.sizes, SIZE_DEFAULT), fid);
      renderFormats(); renderSizes(); syncPanelHead(); updateTotal(); applyMountVisual(p);
    };
    box.appendChild(b);
  });
}
function renderSizes(){
  const box=document.getElementById('sizeGrid'); const p=POSTERS[selected]; if(!box||!p) return;
  const list = sizesOf(p);
  box.style.gridTemplateColumns='repeat('+Math.max(list.length,3)+',1fr)';
  box.innerHTML='';
  list.forEach(s=>{
    const b=document.createElement('button');
    b.className='size-btn'+(p.sizeKey===s.k?' active':'');
    const d=isLand(p)?[s.d[1],s.d[0]]:s.d;
    b.innerHTML=s.k+`<small>${cm(d[0])}×${cm(d[1])}</small><small class="size-price">${precioTxt(s.price||0)}</small>`+sizeStockTag(s);
    if(!inStock(s)){ b.disabled=true; b.classList.add('sold-out'); b.title='Sin existencias'; }
    b.onclick=()=>{ if(!inStock(s)) return; applyProductSize(p,s); renderSizes(); syncPanelHead(); layout(); applySelection(); updateTotal(); applyMountVisual(p); };
    box.appendChild(b);
  });
}
/* el imán no lleva dorso: oculta pestañas y dedicatoria (sin borrarla) y repinta el dorso */
function syncBackForProduct(p){
  if(!p) return;
  const noBack = p.ptype === 'nevera';
  document.querySelectorAll('#txtBlock .txt-back, #faceTabs').forEach(el => { el.style.display = noBack ? 'none' : ''; });
  const i = POSTERS.indexOf(p); if(i >= 0) applyBackText(i);
  if(noBack && FACE_BACK) setFace(false);
}
function setPtype(k){
  const p=POSTERS[selected]; if(!p||p.ptype===k||!PRODUCTS[k]) return;
  p.ptype=k;
  p.mount=PRODUCTS[k].hanger;                       // cada producto vuelve a su colgado por defecto
  const pr=PRODUCTS[k], fmt = pr.formats ? FORMAT_DEFAULT : null;
  applyProductSize(p, defSizeOf(pr, fmt), fmt);
  renderPtypes(); renderFormats(); renderSizes(); renderMounts(); renderHangerChips();
  syncPanelHead(); layout(); applySelection(); updateTotal(); syncBackForProduct(p);
  sceneSelectHanger();
  applyMountVisual(p); showMountPose(p);            // peana / imán de nevera / imán de pared
  /* el Sobremesa se APOYA: si había puesto un entorno de pared (foto o escena para colgar), pasa a
     la primera escena donde se apoya; y al revés, un cuadro no se queda encima de una mesita */
  const apoyo = ROOM_CFG.mode === 'geo' && SOBREMESA_SCENES.test(ROOM_CFG.scene);
  if(k === 'madera' && ROOM_CFG.mode !== 'none' && !apoyo){
    const sc = SCENES.find(x => SOBREMESA_SCENES.test(x.id)); if(sc) setScene(sc.id);
  } else if(k !== 'madera' && apoyo) clearRoom();
}

/* ═══ escena de montaje (colgador-scene de Futsides) en ventana, con la foto del cliente ═══ */
const hangerModalEl = document.getElementById('hangerModal');
const hangerFrame   = document.getElementById('hangerFrame');
let sceneReady = false;

window.addEventListener('message', e=>{
  if(!e.data || e.data.type!=='futsides-scene-ready') return;
  if(!hangerFrame.contentWindow || e.source!==hangerFrame.contentWindow) return;
  sceneReady = true;
  try{ hangerFrame.contentWindow.postMessage({type:'futsides-hide-bar'},'*'); }catch(_){}
  pushSceneState();
});

function pushSceneState(){
  const p = POSTERS[selected];
  if(!p || !sceneReady || !hangerFrame.contentWindow) return;
  const cw = hangerFrame.contentWindow;
  try{
    cw.postMessage({type:'futsides-activate', w:hangerFrame.clientWidth, h:hangerFrame.clientHeight},'*');
    const payload = {type:'futsides-set-poster', orientation:p.orient};
    if(p.thumb) payload.front = p.thumb;
    const bc = buildBackCanvas(p);
    if(bc){ try{ payload.back = bc.toDataURL('image/jpeg',0.8); }catch(_){} }
    cw.postMessage(payload,'*');
    cw.postMessage({type:'futsides-select-hanger', id:mountOf(p)},'*');
  }catch(_){}
}
function sceneSelectHanger(){
  const p = POSTERS[selected];
  if(!p || !sceneReady || !hangerFrame.contentWindow) return;
  try{ hangerFrame.contentWindow.postMessage({type:'futsides-select-hanger', id:mountOf(p)},'*'); }catch(_){}
}
/* dentro de la ventana: chips solo si el producto deja elegir colgado */
function renderHangerChips(){
  const box=document.getElementById('hangerChips'), p=POSTERS[selected];
  if(!box||!p) return;
  const pr=prodOf(p);
  box.innerHTML='';
  if(!pr.mounts) return;
  pr.mounts.forEach(id=>{
    const m=MOUNTS[id]; if(!m) return;
    const b=document.createElement('button');
    b.className='mount-chip'+(mountOf(p)===id?' active':'');
    b.textContent=m.label;
    b.onclick=()=>setMount(id);
    box.appendChild(b);
  });
}
const HANGER_TITLES = { madera:['Así se apoya','How it stands'], 'iman-nevera':['Así se pega','How it sticks'] };
function openHangerModal(){
  const p=POSTERS[selected];
  const t=(p && HANGER_TITLES[prodOf(p).hanger]) || ['Así se cuelga','How it mounts'];
  document.getElementById('hangerTitleEs').textContent=t[0];
  document.getElementById('hangerTitleEn').textContent=t[1];
  renderHangerChips();
  hangerModalEl.classList.add('open');
  if(!hangerFrame.src){ hangerFrame.src = 'colgador-scene.html'; }   // scene-ready hará el resto
  else pushSceneState();
}
function closeHangerModal(){ hangerModalEl.classList.remove('open'); }
document.getElementById('hangerClose').addEventListener('click', closeHangerModal);
document.getElementById('hangerDone').addEventListener('click', closeHangerModal);
document.getElementById('verMontaje').addEventListener('click', openHangerModal);

function dimsLabel(p){
  const s = sizeOf(p);
  const d = isLand(p) ? [s.d[1],s.d[0]] : s.d;
  return cm(d[0])+'×'+cm(d[1])+' cm';
}

/* ═══════════ ENCUADRE (recorte + orientación) ═══════════ */
const cropModalEl = document.getElementById('cropModal');
const cropCanvas  = document.getElementById('cropCanvas');
const cropZoom    = document.getElementById('cropZoom');
let _cropCache = null;

function drawCropPreview(){
  const p = POSTERS[selected];
  if(!p || !p.srcImg){ _cropCache=null; return; }
  const land = isLand(p);
  // proporción del FORMATO real elegido (antes esto era un 264×372 fijo, ratio √2 del único
  // A4 de siempre — con cuadrado/clásico/retrato la caja de recorte tiene que seguir la forma
  // de verdad, si no un cuadrado se recortaba dentro de un rectángulo A4 sin que se notara).
  const ratio = Math.min(baseW(p), baseH(p)) / Math.max(baseW(p), baseH(p));
  const LONG = 372, SHORT = Math.round(LONG * ratio);
  const bW = land?LONG:SHORT, bH = land?SHORT:LONG;          // preview grande (va en su propia ventana)
  const k  = Math.min(1, Math.max(200, window.innerWidth-88)/bW);   // que quepa en móvil sin deformarse
  const W  = Math.round(bW*k), H = Math.round(bH*k);
  cropCanvas.width=W*2; cropCanvas.height=H*2;               // 2x para nitidez
  cropCanvas.style.width=W+'px'; cropCanvas.style.height=H+'px';
  const x = cropCanvas.getContext('2d');
  const cw = cropWindow(p, W*2, H*2);
  x.drawImage(p.srcImg, cw.sx,cw.sy,cw.sw,cw.sh, 0,0,W*2,H*2);
  _cropCache = { kx:(W*2)/cw.sw, ky:(H*2)/cw.sh, maxX:cw.maxX, maxY:cw.maxY };
  document.getElementById('orientV').classList.toggle('active', !land);
  document.getElementById('orientH').classList.toggle('active', land);
  cropZoom.value = Math.round(((p.crop&&p.crop.scale)||1)*100);
}

/* formato + talla dentro de la propia ventana de encuadre — mismo botón que el de la barra
   lateral (.format-chip/.size-btn, misma CSS), pero apuntando a #cropFormatChips/#cropSizeGrid
   y refrescando el recorte en el sitio en vez de cerrar la ventana. */
function renderCropFormats(){
  const box=document.getElementById('cropFormatChips'), sbox=document.getElementById('cropSizeGrid');
  const p=POSTERS[selected]; if(!box||!sbox||!p) return;
  const pr=prodOf(p);
  if(pr.oneRow){
    box.hidden=false; sbox.innerHTML=''; sbox.hidden=true;
    sizeAsFormatChips(box, p, ()=>{ renderCropFormats(); drawCropPreview(); syncPanelHead(); updateTotal(); applyMountVisual(p); });
    return;
  }
  if(!pr.formats){ box.innerHTML=''; box.hidden=true; sbox.innerHTML=''; sbox.hidden=true; return; }
  box.hidden=false; sbox.hidden=false;
  box.innerHTML='';
  FORMAT_ORDER.forEach(fid=>{
    const f=pr.formats[fid];
    const b=document.createElement('button');
    b.type='button';
    b.className='format-chip'+(p.format===fid?' active':'');
    const boxH=20, boxW=Math.max(6,Math.round(boxH*f.ratio));
    b.innerHTML = `<span class="format-chip-shape" style="width:${boxW}px;height:${boxH}px"></span>`
      + `<span class="es">${f.es}</span><span class="en">${f.en}</span>`;
    b.onclick=()=>{
      // si la talla actual (S/M/L…) existe también en el formato nuevo, se mantiene
      applyProductSize(p, pickSize(f.sizes, f.sizes.some(x=>x.k===p.sizeKey) ? p.sizeKey : SIZE_DEFAULT), fid);
      renderCropFormats(); drawCropPreview(); syncPanelHead(); updateTotal(); applyMountVisual(p);
    };
    box.appendChild(b);
  });
  const list = sizesOf(p);
  sbox.style.gridTemplateColumns='repeat('+Math.max(list.length,3)+',1fr)';
  sbox.innerHTML='';
  list.forEach(s=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='size-btn'+(p.sizeKey===s.k?' active':'');
    const d=isLand(p)?[s.d[1],s.d[0]]:s.d;
    b.innerHTML=s.k+`<small>${cm(d[0])}×${cm(d[1])}</small><small class="size-price">${precioTxt(s.price||0)}</small>`+sizeStockTag(s);
    if(!inStock(s)){ b.disabled=true; b.classList.add('sold-out'); b.title='Sin existencias'; }
    b.onclick=()=>{ if(!inStock(s)) return; applyProductSize(p,s); renderCropFormats(); drawCropPreview(); syncPanelHead(); updateTotal(); applyMountVisual(p); };
    sbox.appendChild(b);
  });
}
function openCropModal(){
  const p = POSTERS[selected]; if(!p||!p.srcImg) return;
  cropModalEl.classList.add('open');
  renderCropFormats();
  drawCropPreview();
}
function closeCropModal(){ cropModalEl.classList.remove('open'); }
document.getElementById('edpCrop').addEventListener('click', openCropModal);
document.getElementById('cropClose').addEventListener('click', closeCropModal);
document.getElementById('cropDone').addEventListener('click', closeCropModal);

function setOrientBtn(o){
  const p = POSTERS[selected]; if(!p) return;
  setOrientation(p, o);
  syncConfigUI();
}

cropZoom.addEventListener('input', ()=>{
  const p = POSTERS[selected]; if(!p||!p.srcImg) return;
  p.crop.scale = (+cropZoom.value)/100;
  applyFrontTexture(selected); drawCropPreview();
});
document.getElementById('cropReset').addEventListener('click', ()=>{
  const p = POSTERS[selected]; if(!p||!p.srcImg) return;
  p.crop = {scale:1, fx:0, fy:0, cx:0.5, cy:0.5};
  applyFrontTexture(selected); drawCropPreview();
});

/* arrastrar la foto dentro del recuadro de encuadre */
let cropDragId=null, cpx=0, cpy=0;
const cropBox = document.getElementById('cropBox');
cropBox.addEventListener('pointerdown', e=>{
  e.preventDefault(); cropDragId=e.pointerId; cpx=e.clientX; cpy=e.clientY;
  try{ cropBox.setPointerCapture(e.pointerId); }catch(_){}
});
cropBox.addEventListener('pointermove', e=>{
  if(cropDragId!==e.pointerId) return;
  const p = POSTERS[selected]; if(!p||!p.srcImg||!_cropCache) return;
  const dx=e.clientX-cpx, dy=e.clientY-cpy; cpx=e.clientX; cpy=e.clientY;
  const c=_cropCache;
  // el preview se pinta a 2x → el desplazamiento del dedo son dx*2 px de canvas
  // se mueve el punto central (en píxeles de la foto), sin salirse de lo que deja la proporción actual
  const img = p.srcImg, cw = cropWindow(p, texW(p), texH(p)), iw = img.naturalWidth, ih = img.naturalHeight;
  if(c.maxX>0) p.crop.cx = Math.max(cw.sw/2/iw, Math.min(1 - cw.sw/2/iw, p.crop.cx - (dx*2/c.kx)/iw));
  if(c.maxY>0) p.crop.cy = Math.max(cw.sh/2/ih, Math.min(1 - cw.sh/2/ih, p.crop.cy - (dy*2/c.ky)/ih));
  applyFrontTexture(selected); drawCropPreview();
});
['pointerup','pointercancel'].forEach(ev=>cropBox.addEventListener(ev, e=>{ cropDragId=null; }));

/* ═══════════ TEXTOS ═══════════ */
const frontInput=document.getElementById('frontText');
const backInput =document.getElementById('backText');
const frontDateInput=document.getElementById('frontDate');
const backDateInput =document.getElementById('backDate');

/* el tamaño de letra ya no lo toca el cliente (era un control más y desbordaba con frases
   largas): buildFrontCanvas/buildBackCanvas lo calculan solas con fitTextSize y dejan el
   resultado en p.frontSize/p.backSize, solo para el archivo de imprenta y el guardado. */
function bindFront(){ const p=POSTERS[selected]; if(!p) return; p.frontText=frontInput.value; p.frontDate=frontDateInput.value; applyFrontTexture(selected); }
function bindBack(){  const p=POSTERS[selected]; if(!p) return; p.backText =backInput.value;  p.backDate=backDateInput.value; applyBackText(selected); }
[frontInput,frontDateInput].forEach(el=>el.addEventListener('input',bindFront));
if(!FRONT_TEXT){   // sin frase delante: se esconden su rótulo, el campo y la fila de letra y fecha
  const lab = frontInput.previousElementSibling, row = frontInput.nextElementSibling;
  [lab, frontInput, row].forEach(el => { if(el) el.hidden = true; });
  if(row) row.style.display = 'none';
}
[backInput,backDateInput].forEach(el=>el.addEventListener('input',bindBack));
[frontInput,frontDateInput].forEach(el=>el.addEventListener('focus',()=>{ setFace(false); }));
/* Aitor: "por detrás se tiene que ver cerca para apreciar lo que has escrito" — al escribir
   la dedicatoria la cámara se acerca sola (como el zoom manual, mismo tZ); al salir de ese
   campo vuelve a alejarse. */
[backInput,backDateInput].forEach(el=>el.addEventListener('focus',()=>{ setFace(true); }));
[backInput,backDateInput].forEach(el=>el.addEventListener('blur',()=>{ zoomForBack(false); }));
document.querySelectorAll('#faceTabs [data-face]').forEach(b => b.addEventListener('click', () => setFace(b.dataset.face === 'back')));

/* Selector de tipografía: un botón + lista, sin <select> nativo porque no deja pintar
   cada opción con su propia fuente de forma fiable en todos los navegadores. Cada opción
   se escribe con LO QUE EL CLIENTE YA HA PUESTO en ese campo (o un ejemplo si aún no ha
   escrito nada), para que se vea de verdad cómo queda antes de elegir. */
function buildFontDD(container, getInput, getKey, setKey, sample){
  container.innerHTML = '<button type="button" class="font-dd-btn"><span></span>'
    + '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>'
    + '<div class="font-dd-list"></div>';
  const btn = container.querySelector('.font-dd-btn'), lbl = btn.querySelector('span'), list = container.querySelector('.font-dd-list');
  function text(){ const t = getInput().value.trim(); return t || sample; }
  function renderList(){
    list.innerHTML = '';
    FONTS.forEach((f, i) => {
      if(i === 0 || !!f.fav !== !!FONTS[i-1].fav){
        const h = document.createElement('p'); h.className = 'font-dd-head';
        h.innerHTML = f.fav ? '<span class="es">Favoritas</span><span class="en">Favourites</span>' : '<span class="es">Más letras</span><span class="en">More fonts</span>';
        list.appendChild(h);
      }
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'font-dd-opt' + (f.id === getKey() ? ' active' : '');
      opt.style.fontFamily = f.family; opt.style.fontWeight = f.weight; opt.style.fontStyle = f.style;
      opt.innerHTML = '<small>' + f.label + '</small>' + text();
      opt.onclick = () => { setKey(f.id); close(); render(); };
      list.appendChild(opt);
    });
  }
  function render(){
    const f = fontOf(getKey());
    lbl.textContent = f.label; lbl.style.fontFamily = f.family; lbl.style.fontWeight = f.weight; lbl.style.fontStyle = f.style;
  }
  function close(){ container.classList.remove('open'); document.removeEventListener('click', onDocClick); }
  function onDocClick(e){ if(!container.contains(e.target)) close(); }
  btn.onclick = () => {
    const willOpen = !container.classList.contains('open');
    document.querySelectorAll('.font-dd.open').forEach(d => d !== container && d.classList.remove('open'));
    if(willOpen){ renderList(); container.classList.add('open'); document.addEventListener('click', onDocClick); }
    else close();
  };
  render();
  return { render, renderList };
}
const frontFontDD = buildFontDD(document.getElementById('frontFontDD'),
  () => frontInput, () => (POSTERS[selected]||{}).frontFont || FONT_DEFAULT,
  id => { const p=POSTERS[selected]; if(!p) return; p.frontFont=id; applyFrontTexture(selected); }, 'Para siempre juntos');
const backFontDD = buildFontDD(document.getElementById('backFontDD'),
  () => backInput, () => (POSTERS[selected]||{}).backFont || FONT_DEFAULT,
  id => { const p=POSTERS[selected]; if(!p) return; p.backFont=id; applyBackText(selected); }, 'Con todo mi cariño');
frontInput.addEventListener('input', () => frontFontDD.render());
backInput.addEventListener('input', () => backFontDD.render());

/* ═══════════ TOTAL / SELECCIÓN / CARRITO ═══════════ */
/* ═══ DESCUENTO POR COMBINACIÓN ═══
   Cuantos más cuadros van en el mismo pedido, más barato sale cada uno. Es lo que la ficha
   de producto anuncia como "combinaciones 2, 3 y 4", así que el carrito tiene que cumplirlo.
   OJO AL MARGEN: las Paredes de ensueño llevan de 3 a 10 piezas por definición, así que
   entran de lleno en el tramo más alto. Los porcentajes son un valor de partida:
   se cambian aquí y en el bloque .pk- de cuadro.html / pdp.css. */
const PACK_TIERS = [ {n:4, pct:20}, {n:3, pct:15}, {n:2, pct:10} ];
function packPieces(){ return POSTERS.filter(p=>p.srcImg).length; }
function packPct(){ const n = packPieces(), t = PACK_TIERS.find(t=>n>=t.n); return t ? t.pct : 0; }
function coGross(){ return POSTERS.filter(p=>p.srcImg).reduce((s,p)=>s+(p.price||0),0); }
function coDiscount(){ return Math.round(coGross()*packPct())/100; }
function coSubtotal(){ return Math.round((coGross()-coDiscount())*100)/100; }

function precioTxt(n){ return n.toFixed(2).replace('.',',') + '€'; }
function updateTotal(){
  scheduleSave();
  /* En un conjunto cuenta la pared entera (hay que llenarla para pedirla); sueltos, los que llevan foto,
     y sin ninguna, los huecos que hay. Con descuento por cantidad sale el precio tachado al lado. */
  const conFoto = POSTERS.filter(p=>p.srcImg);
  const piezas = (WALL || !conFoto.length) ? POSTERS : conFoto;
  const bruto = piezas.reduce((s,p)=>s+(p.price||0),0);
  const t = PACK_TIERS.find(t=>piezas.length>=t.n), pct = t ? t.pct : 0;
  const total = Math.round((bruto - Math.round(bruto*pct)/100)*100)/100;
  const el = document.getElementById('cartTotal');
  if(el) el.innerHTML = ' · ' + (pct ? '<s>' + precioTxt(bruto) + '</s> ' : '') + precioTxt(total);
  const lb = document.getElementById('cartLabel');
  if(lb) lb.innerHTML = conFoto.length
    ? '<span class="es">Añadir al carrito</span><span class="en">Add to cart</span>'
    : '<span class="es">Sube tu foto</span><span class="en">Upload your photo</span>';
}

function selectPoster(i){ selected=i; renderThumbs(); applySelection(); syncConfigUI(); }
function syncPanelHead(){
  const p = POSTERS[selected]; if(!p) return;
  document.getElementById('edpNum').textContent  = (selected+1);
  document.getElementById('edpDims').textContent = (WALL ? 'de ' + POSTERS.length + ' · ' : '') + prodOf(p).name + ' · ' + dimsLabel(p);
  document.getElementById('currentPrice').textContent = (p.price||0).toFixed(2).replace('.',',')+'€';
  const wn = document.getElementById('wallSizeNote');
  if(wn){
    wn.hidden = !WALL;
    if(WALL) wn.innerHTML = wallSizes(WALL).length > 1
      ? '<span class="es">En un conjunto todos los cuadros van a la misma medida. Cámbiala arriba, en <b>Tamaño</b>.</span><span class="en">In a set every print is the same size. Change it up top, under <b>Size</b>.</span>'
      : '<span class="es">Talla <b>' + p.sizeKey + '</b> fijada por la pared «' + WALL.name + '». Para otra medida, cambia de pared.</span><span class="en">Size <b>' + p.sizeKey + '</b> is set by the “' + WALL.name + '” wall. Pick another wall for a different size.</span>';
  }
}
function syncConfigUI(){
  const p = POSTERS[selected]; if(!p) return;
  frontInput.value=p.frontText||''; frontDateInput.value=p.frontDate||'';
  /* 16-oct · el imán no lleva nada detrás (va pegado a la nevera): fuera pestañas y dedicatoria. La dedicatoria NO se
     borra: en «Todos los formatos» (producto.html) se puede cambiar de producto, y al volver a cuadro sigue ahí. Mientras
     es imán ni se dibuja (applyBackText) ni va al carrito. */
  syncBackForProduct(p);
  backInput.value =p.backText ||''; backDateInput.value =p.backDate ||'';
  if(!p.frontFont) p.frontFont = FONT_DEFAULT;
  if(!p.backFont)  p.backFont  = FONT_DEFAULT;
  frontFontDD.render(); backFontDD.render();
  document.getElementById('edpCrop').style.display = p.srcImg ? 'block' : 'none';
  renderPtypes(); renderFormats(); renderSizes(); renderMounts(); syncPanelHead();
  if(hangerModalEl && hangerModalEl.classList.contains('open')) renderHangerChips();
  if(cropModalEl.classList.contains('open')) drawCropPreview();
}

document.getElementById('addToCart').addEventListener('click', async ()=>{
  const withPhoto = POSTERS.filter(p=>p.srcImg).length;
  if(!withPhoto){ pickMode='add'; fileInput.click(); return; }
  // red de seguridad: los botones de talla agotada ya están desactivados, pero un diseño
  // guardado de antes o una pared abierta por URL podrían traer una
  const agotado = POSTERS.findIndex(p=>p.srcImg && !inStock(sizeOf(p)));
  if(agotado >= 0){ toast('Uno de los cuadros lleva una talla sin existencias: cámbiala para seguir'); selectPoster(agotado); return; }
  if(WALL && withPhoto < POSTERS.length){
    const faltan = POSTERS.length - withPhoto;
    toast(faltan===1 ? 'Falta 1 foto para completar la pared' : 'Faltan ' + faltan + ' fotos para completar la pared');
    const i = POSTERS.findIndex(p=>!p.srcImg); if(i>=0) selectPoster(i);
    return;
  }
  const total = POSTERS.reduce((s,p)=>s+(p.price||0),0).toFixed(2).replace('.',',');
  const lowRes = POSTERS.some(p=>p.srcImg && photoIsLowRes(p));

  if(lowRes){
    toast('Alguna foto se vería algo borrosa a este tamaño. Seguimos con el pedido igualmente.');
  }
  // el carrito es el panel lateral: de ahí se pasa al pago
  openCheckout();
});

/* ═══════════ ABRIR / CERRAR EDITOR ═══════════ */
const editorEl = document.getElementById('editor');
function openEditor(){
  editorEl.classList.add('open');
  document.body.style.overflow = 'hidden';
  editorOpen = true; needResize = true; dirty3D = true;
  resize3D();                      // encuadre correcto ya en el primer fotograma
  if(!raf3d) animate();
}
function closeEditor(){
  closePanel();
  editorEl.classList.remove('open');
  document.body.style.overflow = '';
  editorOpen = false;              // el bucle 3D se detiene solo en el próximo frame
}
function openEditorWithType(t){
  if(PRODUCTS[t]) defaultType = t;
  const p = POSTERS[selected];
  // si solo está el póster placeholder, adopta el producto elegido
  if(POSTERS.length===1 && p && !p.srcImg){
    p.ptype = defaultType;
    p.mount = PRODUCTS[defaultType].hanger;
    { const pr = PRODUCTS[defaultType], fmt = pr.formats ? FORMAT_DEFAULT : null;
      applyProductSize(p, defSizeOf(pr, fmt), fmt); }
    layout(); updateTotal(); syncConfigUI(); applyMountVisual(p);
  }
  openEditor();
}
(function(){ var _b=document.getElementById('btnOpenEditor'); if(_b) _b.addEventListener('click', function(){ openEditorWithType(defaultType); }); })();
document.getElementById('edClose').addEventListener('click', closeEditor);
window.addEventListener('keydown', e=>{
  if(e.key!=='Escape') return;
  if(cropModalEl.classList.contains('open')) closeCropModal();
  else if(wallModalEl && wallModalEl.classList.contains('open')) closeWallModal();
  else if(document.getElementById('myWallModal').classList.contains('open')) closeMyWall();
  else if(document.getElementById('roomModal').classList.contains('open')) closeRoomModal();
  else if(hangerModalEl.classList.contains('open')) closeHangerModal();
  else if(panelOpen) closePanel();
  else if(editorOpen) closeEditor();
});

/* ═══════════ TOAST / NAV ═══════════ */
let toastTimer=null;
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>el.classList.remove('show'), 2200);
}
window.addEventListener('scroll', ()=>{ document.getElementById('nav').classList.toggle('floating', window.scrollY>20); }, {passive:true});

/* ═══════════ INIT ═══════════ */
addPoster();   // empieza vacío: un póster "SUBE TU FOTO" listo para personalizar
/* entrada desde la landing con la foto ya elegida (photo-handoff.js):
   se recoge el File original de IndexedDB, se abre el editor y se monta en 3D. */
let HANDOFF_FIT = null;   // formato fijado y sin recorte para la foto que llega de un personalizado
(function pickUpHandoffPhoto(){
  if(!window.MOMENTURIES_PHOTO) return;
  if(new URLSearchParams(location.search).get('foto') !== '1') return;
  window.MOMENTURIES_PHOTO.take().then(function(file){
    const files = Array.isArray(file) ? file : (file ? [file] : []);   // una (versión vieja) o varias
    if(!files.length) return;
    openEditor();
    /* 16-oct · los pósters personalizados (cielo.html, mapa.html) llegan con ?formato=retrato&encuadre=0: ya
       vienen en 3:4 con el texto colocado, así que entran directos en Retrato y sin pasar por el recorte.
       Solo para esta foto; después el cliente puede cambiar de formato como siempre. */
    const _hq = new URLSearchParams(location.search);
    if(_hq.get('encuadre') === '0') HANDOFF_FIT = { format: FORMATS[_hq.get('formato')] ? _hq.get('formato') : 'retrato' };
    ingestFiles(files, 'replace');
    const b = document.getElementById('btnSample'); if(b) b.hidden = true;
  });
})();

// entrada directa desde la landing: producto.html?type=metal|madera|nevera
const _urlType = new URLSearchParams(location.search).get('type');
const _EDCFG = window.MOMENTURIES_EDITOR || {};
if(_EDCFG.lock) document.documentElement.classList.add('ed-locked');
if(_urlType && PRODUCTS[_urlType]){
  openEditorWithType(_urlType);
}else if(_EDCFG.product && PRODUCTS[_EDCFG.product]){
  /* pagina dedicada: fija el producto pero NO abre el editor (se ve antes el marketing) */
  defaultType = _EDCFG.product;
  const _p0 = POSTERS[selected];
  if(POSTERS.length===1 && _p0 && !_p0.srcImg){
    _p0.ptype = _EDCFG.product;
    _p0.mount = PRODUCTS[_EDCFG.product].hanger;
    { const _pr = PRODUCTS[_EDCFG.product], _fmt = _pr.formats ? (FORMATS[_EDCFG.format] ? _EDCFG.format : FORMAT_DEFAULT) : null;
      applyProductSize(_p0, defSizeOf(_pr, _fmt), _fmt); }
    layout(); updateTotal(); syncConfigUI(); applyMountVisual(_p0);
  }
  /* 16-oct · el imán se enseña en una nevera desde el principio */
  if(_EDCFG.product === 'nevera' && ROOM_CFG.mode === 'none'){ ROOM_CFG.mode = 'geo'; ROOM_CFG.scene = 'nevera-menta'; }
}


/* ═══════════ CHECKOUT EN LA PROPIA PÁGINA (panel lateral, patrón Mixtiles) ═══════════
   Es el carrito: enseña el resumen y recoge correo y dirección sin salir del editor.
   El botón final crea el carrito en Shopify con esos datos y lleva a su página de pago.
   Las tarifas de envío de abajo son las mismas que tiene la tienda en Shopify: si se cambian
   allí, hay que cambiarlas aquí. */
const SHIPPING = {
  ES: [ {id:'std', es:'Envío estándar', en:'Standard shipping', dias:'3-5 días laborables', days:'3-5 working days', price:4.95, free:60},
        {id:'exp', es:'Envío exprés',   en:'Express shipping',  dias:'1-2 días laborables', days:'1-2 working days', price:9.95, free:null} ],
  PT: [ {id:'std', es:'Envío estándar', en:'Standard shipping', dias:'4-6 días laborables', days:'4-6 working days', price:6.95, free:80} ],
  EU: [ {id:'std', es:'Envío estándar', en:'Standard shipping', dias:'5-8 días laborables', days:'5-8 working days', price:9.95, free:100} ],
};
const eur = n => n.toFixed(2).replace('.', ',') + '€';
const coEl = id => document.getElementById(id);
const CO = { step:'mail', ship:'std', mail:'', envio:null };


/* zonas de envío de la tienda: España, Portugal y el resto de la UE (mercado «Unión Europea» en Shopify) */
function coShipOpts(){ const c = (coEl('coCountry')||{}).value || 'ES'; return SHIPPING[c] || SHIPPING.EU; }
function coShipSel(){ const o=coShipOpts(); return o.find(x=>x.id===CO.ship) || o[0]; }
function coShipCost(){ const o=coShipSel(); return (o.free!=null && coSubtotal()>=o.free) ? 0 : o.price; }

function coRenderShip(){
  const box = coEl('coShipOpts'); if(!box) return;
  const opts = coShipOpts();
  if(!opts.some(o=>o.id===CO.ship)) CO.ship = opts[0].id;
  box.innerHTML = opts.map(o=>{
    const free = (o.free!=null && coSubtotal()>=o.free);
    return `<label class="co-ship-opt${o.id===CO.ship?' on':''}">
      <input type="radio" name="coship" value="${o.id}"${o.id===CO.ship?' checked':''}>
      <span><b><span class="es">${o.es}</span><span class="en">${o.en}</span></b>
        <small><span class="es">${o.dias}</span><span class="en">${o.days}</span></small></span>
      <span class="co-ship-price">${free ? 'Gratis' : eur(o.price)}</span></label>`;
  }).join('');
  box.querySelectorAll('input[name="coship"]').forEach(r=>{
    r.addEventListener('change', ()=>{ CO.ship = r.value; coRenderShip(); coRenderSum(); });
  });
}

function coRenderSum(){
  const box = coEl('coSum'); if(!box) return;
  const items = POSTERS.filter(p=>p.srcImg);
  const envio = coShipCost();
  const lines = items.map(p=>{
    const pr = prodOf(p);
    const mount = pr.mounts ? ' · ' + (MOUNTS[mountOf(p)]||{}).label : '';
    return `<div class="co-sum-line">
      ${p.thumb ? `<img class="co-sum-thumb" src="${p.thumb}" alt="">` : '<div class="co-sum-thumb"></div>'}
      <span class="co-sum-txt"><b>${pr.name}</b><small>${dimsLabel(p)}${mount}</small></span>
      <span class="co-sum-amt">${eur(p.price||0)}</span></div>`;
  }).join('');
  const dto = coDiscount();
  box.innerHTML = lines + `<div class="co-sum-rule"></div>
    ${dto ? `<div class="co-sum-row"><span><span class="es">Subtotal</span><span class="en">Subtotal</span></span><span>${eur(coGross())}</span></div>
    <div class="co-sum-row co-sum-dto"><span><span class="es">Combinación de ${packPieces()} cuadros</span><span class="en">Set of ${packPieces()} prints</span> &minus;${packPct()}%</span><span>&minus;${eur(dto)}</span></div>` : ''}
    <div class="co-sum-row"><span><span class="es">${dto ? 'Subtotal con descuento' : 'Subtotal'}</span><span class="en">${dto ? 'Discounted subtotal' : 'Subtotal'}</span></span><span>${eur(coSubtotal())}</span></div>
    <div class="co-sum-row"><span><span class="es">Envío</span><span class="en">Shipping</span></span><span>${envio===0?'Gratis':eur(envio)}</span></div>
    <div class="co-sum-row total"><span>Total</span><span>${eur(coSubtotal()+envio)}<small><span class="es">IVA incl.</span><span class="en">VAT incl.</span></small></span></div>`;
  const ft = coEl('coFootTotal');
  if(ft) ft.innerHTML = `<span><span class="es">Total</span><span class="en">Total</span> <small><span class="es">IVA e importe con envío incluidos</span><span class="en">VAT and shipping included</span></small></span><b>${eur(coSubtotal()+envio)}</b>`;
}

function coOpen(name){
  CO.step = name;
  ['mail','envio'].forEach(k=>{
    const s = coEl('coStep-'+k); if(s) s.classList.toggle('open', k===name);
  });
  const first = coEl('coStep-'+name); if(first){ const i=first.querySelector('.co-in'); if(i) setTimeout(()=>i.focus(),120); }
}

function coMarkDone(name, value){
  const s = coEl('coStep-'+name); if(!s) return;
  s.classList.add('done');
  const v = coEl('coVal-'+name); if(v) v.textContent = value;
}

function coValid(name){
  if(name==='mail'){
    const v = (coEl('coEmail').value||'').trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    coEl('coEmail').classList.toggle('bad', !ok);
    if(ok){ CO.mail = v; coMarkDone('mail', v); }
    return ok;
  }
  if(name==='envio'){
    const f = {name:'coName', addr:'coAddr', zip:'coZip', city:'coCity'};
    let ok = true;
    Object.values(f).forEach(id=>{
      const el = coEl(id); const bad = !(el.value||'').trim();
      el.classList.toggle('bad', bad); if(bad) ok = false;
    });
    if(ok){
      CO.envio = {name:coEl('coName').value.trim(), phone:coEl('coPhone').value.trim(), addr:coEl('coAddr').value.trim(),
                  zip:coEl('coZip').value.trim(), city:coEl('coCity').value.trim(), country:coEl('coCountry').value};
      coMarkDone('envio', `${CO.envio.addr}, ${CO.envio.zip} ${CO.envio.city}`);
    }
    return ok;
  }
  return true;
}

/* correo y dirección del panel, en el formato del carrito de Shopify */
function coBuyerIdentity(){
  const id = {email: CO.mail};
  const e = CO.envio;
  if(e){
    const [firstName, ...rest] = e.name.split(/\s+/);
    const deliveryAddress = {firstName, lastName:rest.join(' '), address1:e.addr, zip:e.zip, city:e.city, country:e.country};
    const tel = e.phone.replace(/[^\d+]/g, '');
    if(/^\+\d{8,15}$/.test(tel)) deliveryAddress.phone = tel;
    else if(e.country==='ES' && /^[6-9]\d{8}$/.test(tel)) deliveryAddress.phone = '+34' + tel;
    id.countryCode = e.country;
    id.deliveryAddressPreferences = [{deliveryAddress}];
  }
  return id;
}

function openCheckout(){
  const items = POSTERS.filter(p=>p.srcImg);
  if(!items.length){ toast('Sube al menos una foto primero'); return; }
  coRenderShip(); coRenderSum();
  const next = !CO.mail ? 'mail' : (!CO.envio ? 'envio' : '');
  coOpen(next);
  coEl('coRoot').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCheckout(){
  coEl('coRoot').classList.remove('open');
  if(editorOpen) document.body.style.overflow = 'hidden'; else document.body.style.overflow = '';
}

(function coWire(){
  const root = coEl('coRoot'); if(!root) return;
  coEl('coClose').addEventListener('click', closeCheckout);
  coEl('coVeil').addEventListener('click', closeCheckout);
  root.querySelectorAll('.co-row').forEach(r=>{
    r.addEventListener('click', ()=> coOpen(r.dataset.step));
  });
  root.querySelectorAll('.co-next').forEach(b=>{
    b.addEventListener('click', ()=>{
      const cur = b.closest('.co-step').id.replace('coStep-','');
      if(!coValid(cur)) return;
      const nx = b.dataset.next;
      if(nx) coOpen(nx); else { coOpen(''); }
      coRenderSum();
    });
  });
  coEl('coCountry').addEventListener('change', ()=>{ coRenderShip(); coRenderSum(); });
  const payHtml = coEl('coPay').innerHTML;
  // al volver atrás desde la página de pago, el botón vuelve a estar listo
  window.addEventListener('pageshow', e=>{ if(e.persisted){ const b = coEl('coPay'); b.disabled = false; b.innerHTML = payHtml; } });
  coEl('coPay').addEventListener('click', async ()=>{
    for(const s of ['mail','envio']){
      if(!coValid(s)){ coOpen(s); toast(s==='mail' ? 'Falta tu correo electrónico' : 'Faltan datos de la dirección'); return; }
    }
    if(SHOPIFY.domain && SHOPIFY.storefrontToken){
      const btn = coEl('coPay');
      btn.disabled = true;
      btn.innerHTML = '<span class="es">Preparando pedido…</span><span class="en">Preparing order…</span>';
      try{
        window.location.href = await checkoutWithShopify(coBuyerIdentity(), CO.ship);
      }catch(err){
        console.error(err);
        toast('No se ha podido crear el pedido: ' + err.message);
        btn.disabled = false; btn.innerHTML = payHtml;
      }
      return;
    }
    // sin tienda conectada: solo se enseña cómo quedaría el pedido
    const total = eur(coSubtotal() + coShipCost());
    document.querySelector('.co-scroll').innerHTML = `<div class="co-ok">
      <div class="co-ok-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
      <h3><span class="es">Así quedaría el pedido</span><span class="en">This is how the order would look</span></h3>
      <p><span class="es">Total ${total} a nombre de ${CO.envio.name}, con envío a ${CO.envio.city}. <b>No se ha cobrado nada</b>: la tienda todavía no está abierta. Escríbenos a <a href="mailto:hola@momenturies.com">hola@momenturies.com</a> y te avisamos en cuanto lo esté.</span><span class="en">Total ${total} for ${CO.envio.name}, shipping to ${CO.envio.city}. <b>Nothing was charged</b>: the store isn't open yet. Write to <a href="mailto:hola@momenturies.com">hola@momenturies.com</a> and we'll let you know when it is.</span></p></div>`;
    const ft = coEl('coFootTotal'); if(ft) ft.innerHTML = '';
    const pay = coEl('coPay');
    pay.innerHTML = '<span class="es">Cerrar</span><span class="en">Close</span>';
    pay.onclick = closeCheckout;
    const legal = document.querySelector('.co-legal'); if(legal) legal.remove();
    clearDesign();
  });
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape' && root.classList.contains('open')){ e.stopPropagation(); closeCheckout(); }
  }, true);
})();


/* ═══════════ AUTOGUARDADO DEL DISEÑO ═══════════
   El diseño (formato, talla, colgado, encuadre, textos) y las FOTOS ORIGINALES se guardan
   en IndexedDB, así una recarga o un cierre de pestaña no borran el trabajo del cliente.
   Al volver no se restaura sin avisar: se ofrece con una barra ("Retomar" / "Descartar").
   Las fotos se guardan como Blob, no como dataURL: se conserva la resolución de imprenta. */
/* var y function a propósito: scheduleSave() se llama desde updateTotal() durante el
   arranque, antes de llegar a estas líneas, y con let/const eso lanza ReferenceError. */
var SAVE_KEY = 'design', SAVE_TTL = 30 * 24 * 3600e3;   // 30 días
function store(){ return window.MOMENTURIES_STORE || null; }
var _saveT = null, _savedBlobs = null, _restoring = false, _userEdited = false;

function scheduleSave(){
  if(_restoring || !store() || typeof POSTERS === 'undefined') return;
  clearTimeout(_saveT);
  _saveT = setTimeout(saveDesign, 700);
}

async function saveDesign(){
  const st = store(); if(!st) return;
  try{
    const items = POSTERS.filter(p => p.srcImg || p.frontText || p.backText || p.frontDate || p.backDate).map(p => ({
      uid:p.uid, ptype:p.ptype, mount:p.mount, format:p.format, sizeKey:p.sizeKey, orient:p.orient, slot:POSTERS.indexOf(p),
      crop:{scale:p.crop.scale, fx:p.crop.fx, fy:p.crop.fy, cx:p.crop.cx, cy:p.crop.cy},
      frontText:p.frontText, frontX:p.frontX, frontY:p.frontY, frontSize:p.frontSize, frontFont:p.frontFont, frontDate:p.frontDate,
      backText:p.backText, backX:p.backX, backY:p.backY, backSize:p.backSize, backFont:p.backFont, backDate:p.backDate,
      photo: p.file ? ('photo:' + p.uid) : null, thumb: p.thumb || null,
    }));
    if(!items.length){ if(_userEdited) await clearDesign(); return; }
    _savedBlobs = _savedBlobs || new Set();
    // las fotos solo se escriben una vez cada una (pesan)
    for(const p of POSTERS){
      if(p.file && p.uid && !_savedBlobs.has(p.uid)){
        await st.put('photo:' + p.uid, p.file);
        _savedBlobs.add(p.uid);
      }
    }
    // resumen para el carrito de la cabecera (carrito.js), que no carga el editor
    // igual que el botón del editor: en un conjunto cuenta la pared entera, aunque falten fotos
    const conFoto = POSTERS.filter(p => p.srcImg), piezas = WALL ? POSTERS : conFoto;
    const bruto = piezas.reduce((s, p) => s + (p.price || 0), 0), tramo = PACK_TIERS.find(t => piezas.length >= t.n), pct = tramo ? tramo.pct : 0;
    const dto = Math.round(bruto * pct) / 100;
    const resumen = { lineas: piezas.map(p => ({ nombre: prodOf(p).name, medida: dimsLabel(p), precio: p.price || 0, thumb: p.srcImg ? (p.thumb || null) : null, sinFoto: !p.srcImg })),
      bruto, dto, total: Math.round((bruto - dto) * 100) / 100, pct,
      pared: WALL ? WALL.name : null, faltan: WALL ? POSTERS.length - conFoto.length : 0 };
    await st.put(SAVE_KEY, { v:1, at:Date.now(), items, resumen, wall: WALL ? WALL.id : null, wallSize: WALL ? (WALL.vk || null) : null, scene: ROOM_CFG.mode === 'geo' ? ROOM_CFG.scene : null });
  }catch(e){ /* sin sitio o sin permiso: el editor sigue funcionando igual */ }
}

async function clearDesign(){
  const st = store(); if(!st) return;
  try{
    const saved = await st.get(SAVE_KEY);
    if(saved && saved.items) for(const it of saved.items) if(it.photo) await st.del(it.photo);
    await st.del(SAVE_KEY);
    if(_savedBlobs) _savedBlobs.clear();
  }catch(e){}
}

async function restoreDesign(saved){
  _restoring = true;
  try{
    const st = store();
    const savedWall = saved.wall && findWall(saved.wall) ? wallAt(findWall(saved.wall), saved.wallSize) : null;
    if(saved.scene){ ROOM_BY_USER = true; ROOM = null; ROOM_CFG.mode = 'geo'; ROOM_CFG.scene = findScene(saved.scene).id; VIEW = '3d'; }
    if(savedWall) applyWall(savedWall, {quiet:true});
    for(let k = 0; k < saved.items.length; k++){
      const it = saved.items[k];
      const p = savedWall ? (POSTERS[it.slot] || POSTERS[k]) : (k === 0 ? POSTERS[0] : addPoster());
      if(!p) break;
      p.uid = it.uid || p.uid;
      if(!savedWall){
        if(PRODUCTS[it.ptype]) p.ptype = it.ptype;
        p.mount = it.mount;
        const pr = prodOf(p);
        const fmt = pr.formats ? (pr.formats[it.format] ? it.format : FORMAT_DEFAULT) : null;
        const list = pr.formats ? pr.formats[fmt].sizes : pr.sizes;
        applyProductSize(p, pickSize(list, list.some(s => s.k === it.sizeKey) ? it.sizeKey : (pr.formats ? SIZE_DEFAULT : pr.def)), fmt);
      } else if(PRODUCTS.metal.mounts.includes(it.mount)) p.mount = it.mount;
      Object.assign(p, {
        frontText:FRONT_TEXT ? it.frontText||'' : '', frontX:it.frontX, frontY:it.frontY, frontSize:it.frontSize, frontFont:it.frontFont||FONT_DEFAULT, frontDate:FRONT_TEXT ? it.frontDate||'' : '',
        backText:it.backText||'',  backX:it.backX,  backY:it.backY,  backSize:it.backSize,  backFont:it.backFont||FONT_DEFAULT,  backDate:it.backDate||'',
      });
      const i = POSTERS.indexOf(p);
      if(it.photo && st){
        const blob = await st.get(it.photo);
        if(blob){
          p.file = blob;
          _savedBlobs = _savedBlobs || new Set();
          _savedBlobs.add(p.uid);
          await new Promise(res => {
            const url = URL.createObjectURL(blob), img = new Image();
            img.onload = () => {
              p.srcImg = img;
              p.crop = {scale:it.crop.scale, fx:it.crop.fx, fy:it.crop.fy, cx:it.crop.cx, cy:it.crop.cy};
              if(!savedWall && p.orient !== it.orient) setOrientation(p, it.orient); else applyFrontTexture(i);
              URL.revokeObjectURL(url); res();
            };
            img.onerror = () => { URL.revokeObjectURL(url); res(); };
            img.src = url;
          });
        }
      }
      applyBackText(i); applyMountVisual(p);
    }
    layout(); renderThumbs(); applySelection(); syncConfigUI(); updateTotal();
    if(savedWall) syncWallBar();
    dirty3D = true;
  }catch(e){ console.warn('Momenturies: no se ha podido recuperar el diseño', e); }
  _restoring = false;
  openEditor();
  syncTools(); syncViewerHint();
}

/* barra de "tienes un diseño sin terminar" */
(async function offerSavedDesign(){
  const st = store(); if(!st) return;
  const _q = new URLSearchParams(location.search);
  if(_q.get('foto') === '1') return;   // viene con foto nueva
  if(_q.get('pared')) return;          // viene a una pared concreta
  let saved;
  try{ saved = await st.get(SAVE_KEY); }catch(e){ return; }
  if(!saved || !saved.items || !saved.items.length) return;
  if(Date.now() - (saved.at || 0) > SAVE_TTL){ clearDesign(); return; }
  // desde el carrito de la cabecera: se recupera sin preguntar y, si lo pidió, se abre el pago
  if(_q.get('carrito') === '1' || _q.get('retomar') === '1'){
    await restoreDesign(saved);
    if(_q.get('carrito') === '1' && POSTERS.some(p => p.srcImg)) openCheckout();
    history.replaceState(null, '', location.pathname);
    return;
  }

  const n = saved.items.length;
  const bar = document.createElement('div');
  bar.className = 'resume';
  bar.innerHTML = `
    ${saved.items[0].thumb ? `<img class="resume-thumb" src="${saved.items[0].thumb}" alt="">` : ''}
    <span class="resume-txt">
      <b><span class="es">Tienes un diseño sin terminar</span><span class="en">You have an unfinished design</span></b>
      <small><span class="es">${n === 1 ? '1 pieza guardada' : n + ' piezas guardadas'}</span><span class="en">${n === 1 ? '1 saved item' : n + ' saved items'}</span></small>
    </span>
    <button type="button" class="resume-go"><span class="es">Retomar</span><span class="en">Resume</span></button>
    <button type="button" class="resume-x" aria-label="Descartar">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  document.body.appendChild(bar);
  requestAnimationFrame(() => bar.classList.add('show'));
  bar.querySelector('.resume-go').addEventListener('click', () => { bar.remove(); restoreDesign(saved); });
  bar.querySelector('.resume-x').addEventListener('click', () => { bar.remove(); clearDesign(); });
})();

window.addEventListener('beforeunload', () => { if(!_restoring) saveDesign(); });

/* para carrito.js: en una página con editor, el diseño de ahora mismo se abre sin recargar */
window.MOMENTURIES_EDITOR_VIVO = {
  hay: () => POSTERS.some(p => p.srcImg),
  pagar: () => { openEditor(); openCheckout(); },
  editar: () => openEditor(),
};


/* ═══════════ PAREDES DE ENSUEÑO (composiciones prediseñadas, tipo Mixtiles) ═══════════
   Las paredes viven en paredes.js (generado por paredes/_build_paredes.py) con las medidas
   exactas de Futsides. Con una pared activa:
     · hay tantos cuadros como huecos, cada uno con SU talla y orientación (no se cambian)
     · las posiciones vienen de la pared (cm → unidades 3D), no de la rejilla automática
     · "Añadir fotos" rellena los huecos vacíos en orden; la X de una miniatura vacía el hueco
     · el pedido se hace con la pared completa
   `var` a propósito: layout() se llama en el arranque, antes de llegar aquí. */
var WALL = null;
const WALLS = window.MOMENTURIES_WALLS || [];
/* medida en cm de lo que hay colgado ahora mismo (una pared o los cuadros sueltos).
   La usa el arrastre sobre la foto del cliente para no dejar que se salga de la foto. */
/* Se guarda en UNIDADES 3D, no en cm: layout() corre en el arranque, antes de que exista `CM`,
   y dividir aquí petaba con "Cannot access 'CM' before initialization". La conversión a cm se
   hace en moveComposition(), que solo se llama con el editor ya montado. */
var COMP_U = { w:0, h:0 };
function findWall(id){ return WALLS.find(w => w.id === id) || null; }
const wallModalEl = document.getElementById('wallModal');
const editorRootEl = document.getElementById('editor');

function layoutWall(){
  const W = WALL.width, H = WALL.height;
  COMP_U = { w:W*CM, h:H*CM };
  WALL.pieces.forEach((pc, i) => {
    const p = POSTERS[i]; if(!p) return;
    p.baseX =  (pc.x + pc.w/2 - W/2) * CM;
    p.baseY = -(pc.y + pc.h/2 - H/2) * CM;
    syncShadow(p);
  });
  placeRoom(H*CM);
  const R = ROOM_CFG;
  // sin entorno no hay habitación que enseñar: solo la composición, con su aire
  if(R.mode === 'none') return { maxW: (W + 24)*CM, totalH: (H + 24)*CM, cx: 0, cy: 0 };
  // se encuadra la composición con aire y el sofá debajo (hasta un poco por debajo del suelo)
  if(R.mode === 'photo' && ROOM){
    // con foto: se encuadra solo la composición (la foto cubre el visor y el sofá queda donde está)
    return { maxW: (W + 24)*CM, totalH: (H + 24)*CM, cx: 0, cy: 0 };
  }
  const sc = findScene(R.scene);
  /* con escena dibujada se encuadra la composición MÁS un trozo mínimo de habitación (sc.viewCm de ancho
     y el mueble entero por debajo): si no, con composiciones pequeñas se veía solo la pared y un mueble gigante */
  /* 20-sep-2026: menos aire (antes 16 cm arriba y 0,75 del mueble abajo). Marc quería que los cuadros
     ocupen más pared y no queden pequeños en medio de una pared enorme. */
  const revealW = sc.restCm != null ? sc.restCm : sc.furnCm*0.42;
  let top = H*CM/2 + (sc.restCm != null ? 48*CM : 9*CM), bot = -H*CM/2 - (sc.gapCm + revealW)*CM;
  if(sc.verCm){ const F = sc.furnCm + sc.gapCm; top = Math.max(H*CM/2 + 4*CM, -H*CM/2 + (sc.verCm[1] - F)*CM); bot = Math.min(-H*CM/2 - 4*CM, -H*CM/2 + (sc.verCm[0] - F)*CM); }
  return { maxW: Math.max(W + 60, sc.viewCm)*CM, totalH: top - bot, cx: 0, cy: (top + bot)/2 };
}

/* ── ENTORNO DEL VISOR ──────────────────────────────────────────────────────
   mode 'geo' (lo normal): una habitación DIBUJADA en 3D de verdad, con medidas reales en cm
   (ver SCENES más abajo: salón y habitación). Se puede orbitar.
   mode 'photo': solo la foto que sube el cliente en "Ver en mi pared" (plano con paralaje suave;
   las fotos de habitación nuestras se retiraron del 3D el 19-sep-2026 y viven en pared2d.html).
     pxPerCm: píxeles por cm reales · anchorX: columna del centro de la composición ·
     anchorBottomY: fila donde apoya el borde inferior de la composición. */
/* Las fotos de habitación (fotos/entornos/entornos.js) YA NO se usan en 3D: desde el 19-sep-2026
   viven solo en la vista 2D (pared2d.html). Aquí ROOM solo puede ser la foto del cliente
   ({custom:true,...} de "Ver en mi pared"); el resto del tiempo se ve una escena dibujada. */

function loadTex(url, cb, onErr, mip){
  new THREE.TextureLoader().load(url, tex => {
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = MAXANI;
    /* la normal se enseña casi 1:1; la HD se ve a menudo reducida (habitación entera) y sin mipmaps
       parpadea al moverla */
    tex.generateMipmaps = !!mip; tex.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    cb(tex);
  }, undefined, onErr);
}
/* 14-oct · Las fotos de entorno miden 1536 px y, al acercarse a un conjunto, salían borrosas. Hay una
   versión al doble en fotos/entornos/hd/ (ampliada con Real-ESRGAN ×4 y reducida a ×2: nítida sin pesar
   demasiado). La del cliente y las que no tengan HD van como siempre. */
const roomHD = r => !r.custom && /^fotos\/entornos\/[^/]+\.jpg$/.test(r.img || '') ? r.img.replace('fotos/entornos/', 'fotos/entornos/hd/') : null;
/* La capa de muebles va por delante de la pared y, proyectada desde la cámara, sobresale de la foto por los
   lados (fotos sin relleno lateral: se vería la planta flotando sobre el fondo del editor). Se descarta cada
   fragmento cuyo rayo desde la cámara NO cae dentro de la foto de la pared (plano local de photoMesh, ±0.5). */
const FG_U = { uWallInv:{ value:new THREE.Matrix4() }, uCamPos:{ value:new THREE.Vector3() } };
function fgClipMat(mat){
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, FG_U);
    sh.vertexShader = 'varying vec4 vFgW;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n\tvFgW = modelMatrix * vec4(transformed, 1.0);');
    sh.fragmentShader = 'uniform mat4 uWallInv; uniform vec3 uCamPos; varying vec4 vFgW;\n'
      + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n'
      + '\tvec3 c = (uWallInv * vec4(uCamPos, 1.0)).xyz; vec3 q = (uWallInv * vFgW).xyz;\n'
      + '\tfloat t = -c.z / (q.z - c.z); vec2 h = c.xy + t * (q.xy - c.xy);\n'
      + '\tif(abs(h.x) > 0.5 || abs(h.y) > 0.5) discard;');
  };
  mat.customProgramCacheKey = () => 'momenturies-fgclip';
  return mat;
}
function ensurePhotoRoom(){
  if(photoMesh) return photoMesh;
  photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ toneMapped:false }));
  photoMesh.renderOrder = -10; photoMesh.visible = false;
  group.add(photoMesh);
  fgMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fgClipMat(new THREE.MeshBasicMaterial({ toneMapped:false, transparent:true, alphaTest:0.02 })));
  fgMesh.renderOrder = 30; fgMesh.visible = false;
  group.add(fgMesh);
  return photoMesh;
}
/* texturas del entorno activo: pared (sin muebles si hay capa) y muebles recortados */
function setRoomTextures(room){
  /* Siempre la FOTO ENTERA, con sus muebles. La separación pared (_wall) + muebles (_fg)
     se pensó para el paralaje del 3D, pero la capa de muebles nunca llegó a alinear bien y
     además esos ficheros no se despliegan (pesan 4 MB y no se publican).
     Con la foto entera el 2D sale nítido y el 3D no echa nada de menos. */
  const plana = true;
  const base = room.img;
  const key = room.id + ':' + base;
  if(photoMesh.userData.key === key) return;
  photoMesh.userData.key = key;
  const pm = photoMesh.material, fm = fgMesh.material;
  if(pm.map){ pm.map.dispose(); pm.map = null; pm.needsUpdate = true; }
  if(fm.map){ fm.map.dispose(); fm.map = null; fm.needsUpdate = true; }
  fgMesh.visible = false;
  const poner = tex => {
    if(photoMesh.userData.key !== key){ tex.dispose(); return; }
    if(tex.image && tex.image.naturalWidth && !room.w){ room.w = tex.image.naturalWidth; room.h = tex.image.naturalHeight; }
    if(pm.map) pm.map.dispose();
    pm.map = tex; pm.needsUpdate = true; dirty3D = true;
    if(WALL) layout();
  };
  const hd = roomHD(room);
  /* primero la normal (sale al momento) y encima la HD en cuanto llega */
  loadTex(base, tex => { poner(tex); if(hd) loadTex(hd, poner, () => {}, true); });
  if(room.fg && !plana) loadTex(room.fg, tex => {
    if(photoMesh.userData.key !== key){ tex.dispose(); return; }
    fm.map = tex; fm.needsUpdate = true; fgMesh.visible = true; dirty3D = true;
  });
  // mapa de luz (datos lineales, sin sRGB): mientras no cargue, o si el entorno no lo trae, los cuadros van sin luz
  if(LIGHT_U.uLightTex.value){ LIGHT_U.uLightTex.value.dispose(); LIGHT_U.uLightTex.value = null; }
  LIGHT_U.uLightOn.value = 0;
  lightRef = photoMesh;
  if(room.light) new THREE.TextureLoader().load(room.light, tex => {
    if(photoMesh.userData.key !== key){ tex.dispose(); return; }
    tex.colorSpace = THREE.NoColorSpace; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter;
    LIGHT_U.uLightTex.value = tex; LIGHT_U.uLightOn.value = 1; dirty3D = true;
  });
}
function placePhotoRoom(compH){
  const m = ensurePhotoRoom(), R = ROOM, U = CM / R.pxPerCm;   // unidades 3D por píxel
  setRoomTextures(R);
  m.scale.set(R.w*U, R.h*U, 1);
  /* 2-oct-2026: la composición, siempre dentro de la PARED LIBRE de la foto (R.free, ver
     fotos/_calibracion_entornos.py): si con el anclaje de siempre pisaría una planta o un mueble,
     se corre lo justo para quedar en la pared lisa. La foto del cliente no trae pared libre. */
  let ax = R.anchorX, by = R.anchorBottomY;
  if(R.free && typeof COMP_U !== 'undefined' && COMP_U){
    const [fx0, fy0, fx1, fy1] = R.free, wpx = COMP_U.w / U, hpx = compH / U;
    ax = wpx > fx1 - fx0 ? (fx0 + fx1) / 2 : Math.max(fx0 + wpx/2, Math.min(fx1 - wpx/2, ax));
    by = hpx > fy1 - fy0 ? (fy0 + fy1 + hpx) / 2 : Math.max(fy0 + hpx, Math.min(fy1, by));
  }
  m.position.set(-(ax - R.w/2)*U, -compH/2 - (R.h/2 - by)*U, -0.22);
  m.visible = true;
}
/* la capa de muebles va fgDepthCm por delante de la pared, escalada y desplazada para que, vista de
   frente, coincida píxel a píxel con la foto (proyección desde la cámara); al orbitar, hace paralaje */
function alignForeground(){
  if(!fgMesh || !fgMesh.visible || !ROOM || !ROOM.fg) return;
  const s = group.scale.x, px = group.position.x, py = group.position.y;
  const D = (ROOM.fgDepthCm || 55) * CM;
  const zw = -0.22*s, zf = zw + D*s;                    // z en mundo de pared y muebles (grupo en z=0 mundo)
  const f = (cZ - zw) / (cZ - zf);
  fgMesh.scale.set(photoMesh.scale.x*f, photoMesh.scale.y*f, 1);
  const wx = px + s*photoMesh.position.x, wy = py + s*photoMesh.position.y;
  fgMesh.position.set((f*wx - px)/s, (f*wy - py)/s, -0.22 + D);
}
/* una foto de entorno: las nuestras (fotos/entornos/entornos.js) o la del cliente */
function setRoom(room, sinViaje){
  FACE_BACK = false; syncFaceTabs(); zoomForBack(false);
  ROOM = room; ROOM_LEJOS = 0;
  if(room && !room.custom && !sinViaje){ _roomFly = true; tZ = BASEZ; }   // al entrar, de la habitación entera al conjunto
  ROOM_CFG.mode = room ? 'photo' : 'none';
  setZoom(tZ);                            // si venía alejado, que no asomen los bordes de la foto
  VIEW = '2d';                            // sobre una foto lo natural es mirarla de frente
  tRy = tRx = cRy = cRx = 0;
  layout(); renderRoomModal(); syncTools(); syncViewerHint();
  scheduleSave();
}
/* una de las habitaciones dibujadas */
var _roomFly = false, _roomFlyInner = false;   // viaje de entrada en las fotos de entorno (ver layout)
var _flyIn = false, _flyUntil = 0;   // la próxima vez que se encuadre, viaje de la habitación al Sobremesa
function setScene(id){
  FACE_BACK = false; syncFaceTabs(); zoomForBack(false);
  ROOM = null; ROOM_CFG.mode = 'geo'; ROOM_CFG.scene = findScene(id).id;
  if(findScene(id).restCm != null) _flyIn = true;
  VIEW = '3d';                            // si es geometría, que se note
  layout(); renderRoomModal(); syncTools(); syncViewerHint();
  scheduleSave();
}
/* sin entorno: el cuadro solo, que es como entra un producto suelto */
function clearRoom(){
  FACE_BACK = false; syncFaceTabs(); zoomForBack(false);
  ROOM = null; ROOM_CFG.mode = 'none';
  VIEW = '3d'; tRy = tRx = cRy = cRx = 0;
  layout(); renderRoomModal(); syncTools(); syncViewerHint();
  scheduleSave();
}
/* 2D = de frente y quieto · 3D = se puede girar */
function setView(v){
  VIEW = v === '2d' ? '2d' : '3d';
  if(isFlat()) tRy = tRx = 0;
  layout(); syncTools(); syncViewerHint();
  scheduleSave();
}

function shadedMat(hex, k){ return new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped:false }); }
/* caja con una tonalidad por cara: [derecha, izquierda, arriba, abajo, frente, atrás] */
function shadedBox(w, h, d, hex, r){
  const g = r ? (() => { const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, r), { depth:d, bevelEnabled:false, curveSegments:8 }); geo.translate(0, 0, -d/2); return geo; })()
              : new THREE.BoxGeometry(w, h, d);
  const mats = [0.90, 0.84, 1.07, 0.78, 1.0, 0.9].map(k => shadedMat(hex, k));
  const m = new THREE.Mesh(g, r ? [shadedMat(hex, 1.0), shadedMat(hex, 0.9)] : mats);
  return m;
}
function gradientTex(c1, c2, vertical){
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d'), g = vertical ? x.createLinearGradient(0, 0, 0, 256) : x.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ═══════════ ESCENAS 3D (las habitaciones dibujadas) ═══════════
   Desde el 19-sep-2026 el visor 3D SOLO usa escenas dibujadas: las fotos de habitación
   pasaron a la vista 2D (pared2d.html), porque una foto plana con los cuadros en 3D
   encima no acababa de colar. Aquí la habitación es geometría de verdad y se puede
   mirar alrededor. Cada escena declara:
     furnCm  alto del mueble que va contra la pared (sofá, cabecero): el suelo se coloca
             a (gapCm + furnCm) por debajo del borde inferior de la composición
     gapCm   hueco entre ese mueble y el primer cuadro
     build   (g, U) monta los muebles; U = unidades 3D por cm
   El sombreado va "horneado" por cara (MeshBasicMaterial): las luces del visor están
   pensadas para el aluminio y quemarían una habitación con materiales físicos. */
/* Caja de la habitación POR ESCENA. Antes era una constante y todas las habitaciones
   medían lo mismo: cambiabas el sofá pero seguía pareciendo la misma sala. Un pasillo
   estrecho y alto, un estudio pequeño y un salón ancho se leen distinto por la caja, no
   por los muebles. `buildShell` la lee de ROOM_BOX, que fija cada escena antes de montarse. */

/* Mancha de luz de ventana sobre la pared. Devuelve un canvas en GRIS donde el valor es
   ratio×100 (100 = pared sin luz), el mismo formato que los <id>_light.jpg de las fotos:
   así los cuadros se iluminan con el mismo shader (lightPatch) y la luz les cae encima. */
function windowLightCanvas(){
  const W = 1024, H = 512, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#646464'; x.fillRect(0, 0, W, H);                  // 100 = pared sin luz
  x.save();
  x.translate(W*0.26, H*0.46); x.transform(1, 0.70, 0, 1, 0, 0);     // el sol entra por la izquierda, inclinado
  x.filter = 'blur(30px)';
  x.fillStyle = '#727272'; x.fillRect(-W*0.19, -H*0.30, W*0.38, H*0.60);   // halo ancho
  x.filter = 'blur(10px)';
  x.fillStyle = '#8e8e8e';                                          // los dos cristales
  x.fillRect(-W*0.135, -H*0.22, W*0.12, H*0.44);
  x.fillRect(W*0.015, -H*0.22, W*0.12, H*0.44);
  x.filter = 'blur(8px)';
  x.fillStyle = '#6c6c6c';                                          // el travesaño
  x.fillRect(-W*0.15, -H*0.02, W*0.30, H*0.04);
  x.restore();
  x.filter = 'none';
  return c;
}
let wallLightCv = null, wallLightTex = null;
function wallLight(){
  if(!wallLightTex){
    wallLightCv = windowLightCanvas();
    wallLightTex = new THREE.CanvasTexture(wallLightCv);
    wallLightTex.colorSpace = THREE.NoColorSpace; wallLightTex.generateMipmaps = false;
    wallLightTex.minFilter = THREE.LinearFilter;
  }
  return wallLightTex;
}
/* textura de la pared = degradado vertical MULTIPLICADO por el mismo mapa de luz que reciben los
   cuadros (ratio^(1/2.2), el ratio es lineal y el canvas es sRGB): así la mancha de sol de la pared
   y la de los cuadros son exactamente la misma luz. */
function wallTex(c1, c2){
  wallLight();
  const W = 1024, H = 512, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const img = x.getImageData(0, 0, W, H), d = img.data;
  const lit = wallLightCv.getContext('2d').getImageData(0, 0, W, H).data;
  const lut = new Float32Array(256);
  for(let v = 0; v < 256; v++) lut[v] = Math.pow(Math.max(v, 1) / 100, 1 / 2.2);
  for(let i = 0; i < d.length; i += 4){
    const f = lut[lit[i]];
    d[i] = Math.min(255, d[i]*f); d[i+1] = Math.min(255, d[i+1]*f); d[i+2] = Math.min(255, d[i+2]*f);
  }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANI;
  return t;
}

/* caja de la habitación: pared del fondo (z=0, donde cuelgan los cuadros), suelo, laterales y rodapié */
function buildShell(g, U, o){
  const W = ROOM_BOX.w*U, H = ROOM_BOX.h*U, D = ROOM_BOX.d*U;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: wallTex(o.wall1, o.wall2), toneMapped:false }));
  wall.scale.set(W, H, 1); wall.position.set(0, H/2, 0); g.add(wall);
  g.userData.wall = wall;                       // referencia para el mapa de luz de los cuadros
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshBasicMaterial({ map: gradientTex(o.floor1, o.floor2, true), toneMapped:false }));
  floor.rotation.x = -Math.PI/2; floor.position.set(0, 0, D/2); g.add(floor);
  [-1, 1].forEach(sg => {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(D, H), shadedMat(o.side, sg < 0 ? 0.99 : 0.90));
    side.rotation.y = sg < 0 ? Math.PI/2 : -Math.PI/2; side.position.set(sg*W/2, H/2, D/2); g.add(side);
  });
  const skirt = shadedBox(W, 9*U, 1.4*U, o.skirt); skirt.position.set(0, 4.5*U, 0.7*U); g.add(skirt);
}
/* sombra de contacto: mancha oscura difusa en el suelo bajo un mueble (le da peso a la escena) */
let softShadowTex = null;
function softShadow(){
  if(softShadowTex) return softShadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(60,48,36,.55)'); g.addColorStop(0.55, 'rgba(60,48,36,.26)'); g.addColorStop(1, 'rgba(60,48,36,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  softShadowTex = new THREE.CanvasTexture(c);
  return softShadowTex;
}
function addContactShadow(g, U, w, d, x, z, op){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w*U, d*U),
    new THREE.MeshBasicMaterial({ map:softShadow(), transparent:true, opacity:op == null ? 0.85 : op, depthWrite:false, toneMapped:false }));
  m.rotation.x = -Math.PI/2; m.position.set(x, 0.9*U, z); m.renderOrder = -3; g.add(m);
}
/* alfombra con un borde más claro */
function addRug(g, U, w, d, z, hex){
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(w*U, d*U), shadedMat(hex, 1));
  rug.rotation.x = -Math.PI/2; rug.position.set(0, 0.3*U, z*U); g.add(rug);
  const edge = new THREE.Mesh(new THREE.PlaneGeometry((w - 14)*U, (d - 14)*U), shadedMat(hex, 1.09));
  edge.rotation.x = -Math.PI/2; edge.position.set(0, 0.5*U, z*U); g.add(edge);
}
/* lámpara de sobremesa (mesita de noche) */
function addTableLamp(g, U, x, y, z, brass, shade){
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(5*U, 6*U, 2*U, 18), shadedMat(brass, 0.92)); foot.position.set(x, y + U, z); g.add(foot);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.1*U, 1.1*U, 18*U, 10), shadedMat(brass, 1)); pole.position.set(x, y + 11*U, z); g.add(pole);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(8.5*U, 11.5*U, 13*U, 22, 1, true),
    new THREE.MeshBasicMaterial({ color:new THREE.Color(shade), side:THREE.DoubleSide, toneMapped:false }));
  sh.position.set(x, y + 25*U, z); g.add(sh);
  const top = new THREE.Mesh(new THREE.CircleGeometry(8.5*U, 22), shadedMat(shade, 1.12));
  top.rotation.x = -Math.PI/2; top.position.set(x, y + 31.4*U, z); g.add(top);
}
/* planta de hojas redondeadas */
function addPlant(g, U, x, z, potHex){
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(15*U, 12*U, 30*U, 20), shadedMat(potHex, 1)); pot.position.set(x, 15*U, z); g.add(pot);
  [[0, 52, 0, 24], [-14, 62, 6, 19], [15, 66, -4, 20], [4, 80, 4, 17], [-8, 44, 12, 14]].forEach(([dx, dy, dz, r], i) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(r*U, 14, 10), shadedMat('#6f8a63', 0.85 + (i%3)*0.08));
    leaf.position.set(x + dx*U, dy*U, z + dz*U); g.add(leaf);
  });
}

/* ── HABITACIÓN: cama de 160 con cabecero, dos mesitas con lámpara, alfombra y planta ── */
function buildDormitorio(g, U){
  buildShell(g, U, { wall1:'#e7e0d9', wall2:'#d6cec6', floor1:'#c5b8a7', floor2:'#b1a492', side:'#e6e0da', skirt:'#d8d0c6' });
  const BW = 160*U, BL = 200*U, HB_H = 105*U, HB_D = 9*U;     // cama de 160×200, cabecero de 105 de alto
  const wood = '#9d7c56', wood2 = '#836547', sheet = '#efeae1', duvet = '#d5cbbb', pillow = '#f7f3ec';
  addRug(g, U, 300, 230, 150, '#cfc3b2');
  // cabecero contra la pared
  const hb = shadedBox(BW + 14*U, HB_H, HB_D, wood, 2.5*U); hb.position.set(0, HB_H/2, HB_D/2 + 0.5*U); g.add(hb);
  const hbPad = shadedBox(BW + 2*U, HB_H - 26*U, 3*U, '#cfc2ae', 2*U); hbPad.position.set(0, HB_H/2 + 8*U, HB_D + 1.5*U); g.add(hbPad);
  // canapé + colchón (la cama se ve de frente, así que lo que la hace legible son las capas:
  // canapé oscuro, colchón claro, edredón por encima con vuelo a los lados y las almohadas al fondo)
  const bz = HB_D + BL/2;
  addContactShadow(g, U, 230, 260, 0, bz, 0.9);
  const bedBase = shadedBox(BW - 6*U, 24*U, BL, wood2);   bedBase.position.set(0, 12*U, bz); g.add(bedBase);
  const mat = shadedBox(BW, 22*U, BL, sheet);             mat.position.set(0, 24*U + 11*U, bz); g.add(mat);
  // almohadas apoyadas en el cabecero
  [-1, 1].forEach(sg => {
    const p = shadedBox(BW/2 - 9*U, 17*U, 46*U, pillow, 6*U);
    p.position.set(sg*(BW/4 - 1*U), 46*U + 8*U, HB_D + 28*U);
    p.rotation.x = -0.26; g.add(p);
  });
  // edredón: cubre desde los pies hasta media cama, con vuelo a los lados
  const dv = shadedBox(BW + 14*U, 15*U, BL*0.58, duvet, 3*U);
  dv.position.set(0, 46*U + 5*U, HB_D + BL - BL*0.29); g.add(dv);
  [-1, 1].forEach(sg => {                                  // el vuelo que cae por el lado
    const fall = shadedBox(3*U, 20*U, BL*0.58, duvet);
    fall.position.set(sg*(BW/2 + 6*U), 46*U - 6*U, HB_D + BL - BL*0.29); g.add(fall);
  });
  const roll = shadedBox(BW + 14*U, 9*U, 20*U, '#cabfad', 4*U);   // el doblez de arriba
  roll.position.set(0, 46*U + 11*U, HB_D + BL*0.42); g.add(roll);
  const throwB = shadedBox(BW + 10*U, 7*U, 44*U, '#b9a894', 3*U); // manta doblada a los pies
  throwB.position.set(0, 46*U + 14*U, HB_D + BL - 34*U); g.add(throwB);
  // mesitas + lámparas
  const NX = BW/2 + 34*U, NW = 46*U, ND = 38*U, NH = 54*U;
  [-1, 1].forEach(sg => {
    const x = sg*NX;
    const body = shadedBox(NW, NH, ND, wood, 2*U); body.position.set(x, NH/2, HB_D + ND/2 + 4*U); g.add(body);
    const drawer = shadedBox(NW - 8*U, 14*U, 1.5*U, '#c2a67f'); drawer.position.set(x, NH*0.62, HB_D + ND + 4.8*U); g.add(drawer);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(1.8*U, 12, 10), shadedMat('#7a6244', 1)); knob.position.set(x, NH*0.62, HB_D + ND + 6*U); g.add(knob);
    addTableLamp(g, U, x, NH, HB_D + ND/2 + 4*U, '#a48f74', '#f2e9da');
    addContactShadow(g, U, 80, 70, x, HB_D + ND/2 + 4*U, 0.6);
  });
  addPlant(g, U, -(BW/2 + 108*U), 52*U, '#b3a08b');
  addContactShadow(g, U, 80, 70, -(BW/2 + 108*U), 52*U, 0.6);
}

/* ── MUEBLES NUESTROS CON MATERIAL REAL ─────────────────────────────────────
   El catálogo CC0 de Poly Haven no tiene ni sofá ni escritorio modernos (todos los sofás son
   de época). Así que estas dos piezas las montamos nosotros con la forma que queremos y les
   ponemos TEXTURAS reales CC0 de Poly Haven (`texturas/`, 1k en WebP: color + normal + ARM):
   bouclé crema para el sofá y roble claro para el escritorio. Van con MeshStandardMaterial y
   el mismo mapa de entorno del visor, así que reciben la luz igual que los modelos descargados. */
const TEX_CACHE = {};
/* OJO con `repeat`: las UV que genera ExtrudeGeometry son las coordenadas del objeto en unidades
   3D (1 unidad = 5,37 cm), no 0..1. Así que repeat 0,18 ≈ un azulejo de tela cada 30 cm, que es lo
   que se quiere; con repeat 5 la tela salía como ruido invisible. */
function pbrTex(base, repeat){
  const key = base + '|' + repeat;
  if(TEX_CACHE[key]) return TEX_CACHE[key];
  const L = new THREE.TextureLoader();
  const set = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.anisotropy = MAXANI; return t; };
  const map = set(L.load('texturas/' + base + '_diff.webp', () => { dirty3D = true; }));
  map.colorSpace = THREE.SRGBColorSpace;
  const nor = set(L.load('texturas/' + base + '_nor.webp'));
  const arm = set(L.load('texturas/' + base + '_arm.webp'));   // R=AO, G=rugosidad, B=metal
  TEX_CACHE[key] = { map, nor, arm };
  return TEX_CACHE[key];
}
function pbrMat(base, repeat, o){
  const t = pbrTex(base, repeat);
  const m = new THREE.MeshStandardMaterial({
    map: t.map, normalMap: t.nor, aoMap: t.arm, roughnessMap: t.arm, metalnessMap: t.arm,
    color: new THREE.Color((o && o.color) || '#ffffff'),
    roughness: (o && o.roughness) != null ? o.roughness : 1, metalness: 0,
    envMapIntensity: (o && o.env) != null ? o.env : 0.45,
  });
  m.normalScale = new THREE.Vector2(0.7, 0.7);
  return calmMat(m);
}
/* caja con esquinas redondeadas y UV que no estira la tela (la geometría extruida trae UV plana) */
function softBox(w, h, d, r, mat){
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, Math.min(r, Math.min(w, h)/2 - 0.001)),
    { depth: d, bevelEnabled: true, bevelThickness: Math.min(r*0.5, d*0.12), bevelSize: Math.min(r*0.5, 0.04), bevelSegments: 3, curveSegments: 10 });
  geo.translate(0, 0, -d/2);
  geo.computeVertexNormals();
  const uv = geo.attributes.uv; if(uv) geo.setAttribute('uv2', uv.clone());   // el aoMap usa uv2
  return new THREE.Mesh(geo, mat);
}

/* SOFÁ MODERNO de 215 cm: base baja, dos cojines de asiento, dos de respaldo, brazos finos
   y patas de metal negro. Tapizado en bouclé (la tela de moda) para que no parezca de dibujo. */
function addSofaModerno(g, U, o){
  /* Proporciones de sofá moderno de verdad (cm): patas 14, zócalo hasta 34, asiento hasta 52,
     respaldo hasta 88, brazos finos de 14 y 72 de alto, fondo 92. Visto de frente se tiene que
     leer la línea del zócalo, la del asiento y la de los cojines: por eso van por capas. */
  const x0 = (o && o.xCm || 0)*U, z0 = (o && o.zCm || 10)*U;
  const W = ((o && o.wCm) || 215)*U, D = 92*U;      // wCm: sofá más corto (p. ej. 165, de dos plazas)
  const c1 = (o && o.c1) || '#f6efe4', c2 = (o && o.c2) || '#ddd3c4', c3 = (o && o.c3) || '#e9e0d2';
  const tela  = pbrMat('curly_teddy_natural', 0.18, { color:c1, roughness:1, env:0.30 });
  const telaB = pbrMat('curly_teddy_natural', 0.18, { color:c2, roughness:1, env:0.28 });
  const telaC = pbrMat('curly_teddy_natural', 0.18, { color:c3, roughness:1, env:0.30 });
  const metal = new THREE.MeshStandardMaterial({ color:0x35353a, roughness:0.4, metalness:0.85, envMapIntensity:0.55 });
  const G = new THREE.Group(); G.position.set(x0, 0, z0); g.add(G);
  const box = (w, h, d, r, mat, x, y, z, rx) => { const m = softBox(w, h, d, r, mat); m.position.set(x, y, z); if(rx) m.rotation.x = rx; G.add(m); return m; };
  box(W, 20*U, D, 3*U, telaB, 0, 24*U, D/2);                                  // zócalo
  box(W - 26*U, 52*U, 14*U, 4*U, telaB, 0, 60*U, 7*U);                        // respaldo
  [-1, 1].forEach(sg => box(14*U, 58*U, D, 5*U, telaC, sg*(W/2 - 7*U), 43*U, D/2));   // brazos
  [-1, 1].forEach(sg => {
    box(W/2 - 22*U, 18*U, D - 30*U, 4*U, tela, sg*(W/4 - 5*U), 43*U, D/2 + 8*U);      // asiento
    box(W/2 - 24*U, 36*U, 13*U, 5*U, tela, sg*(W/4 - 5*U), 70*U, 21*U, -0.13);        // cojín de respaldo
  });
  [-1, 1].forEach(sx => [17*U, D - 13*U].forEach(dz => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.7*U, 1.4*U, 14*U, 10), metal);
    leg.position.set(sx*(W/2 - 11*U), 7*U, dz); G.add(leg);
  }));
  addContactShadow(g, U, W/U + 40, 135, (o && o.xCm || 0)*U, z0 + D/2, 0.9);
  return G;
}

/* BUTACA MODERNA de 78 cm, a juego con el sofá: mismas alturas y la misma tela de bouclé,
   solo que para una plaza. Es lo que pide una "sala de estar" y lo que el catálogo CC0 no tiene:
   todos sus sillones son de época o de cuero oscuro. */
function addButacaModerna(g, U, o){
  const x0 = (o && o.xCm || 0)*U, z0 = (o && o.zCm || 10)*U;
  const W = 78*U, D = 86*U;
  const c1 = (o && o.c1) || '#f4ecdf', c2 = (o && o.c2) || '#dcd1c1', c3 = (o && o.c3) || '#e8dfd0';
  const tela  = pbrMat('curly_teddy_natural', 0.30, { color:c1, roughness:1, env:0.30 });
  const telaB = pbrMat('curly_teddy_natural', 0.30, { color:c2, roughness:1, env:0.28 });
  const telaC = pbrMat('curly_teddy_natural', 0.30, { color:c3, roughness:1, env:0.30 });
  const metal = new THREE.MeshStandardMaterial({ color:0x35353a, roughness:0.4, metalness:0.85, envMapIntensity:0.55 });
  const G = new THREE.Group(); G.position.set(x0, 0, z0); if(o && o.rotY) G.rotation.y = o.rotY; g.add(G);
  const box = (w, h, d, r, mat, x, y, z, rx) => { const m = softBox(w, h, d, r, mat); m.position.set(x, y, z); if(rx) m.rotation.x = rx; G.add(m); return m; };
  box(W, 20*U, D, 3*U, telaB, 0, 24*U, D/2);                                   // zócalo
  box(W - 26*U, 52*U, 14*U, 4*U, telaB, 0, 60*U, 7*U);                         // respaldo
  [-1, 1].forEach(sg => box(13*U, 56*U, D, 5*U, telaC, sg*(W/2 - 6.5*U), 42*U, D/2));   // brazos
  box(W - 30*U, 18*U, D - 30*U, 4*U, tela, 0, 43*U, D/2 + 8*U);                // asiento
  box(W - 32*U, 36*U, 13*U, 5*U, tela, 0, 70*U, 21*U, -0.13);                  // cojín de respaldo
  [-1, 1].forEach(sx => [17*U, D - 13*U].forEach(dz => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.7*U, 1.4*U, 14*U, 10), metal);
    leg.position.set(sx*(W/2 - 10*U), 7*U, dz); G.add(leg);
  }));
  addContactShadow(g, U, 105, 105, (o && o.xCm || 0)*U, z0 + D/2, 0.8);
  return G;
}

/* ESCRITORIO MODERNO de 150×62: tablero fino de roble, faldón y patas rectas. Nada de cajones
   con tiradores: lo que se quiere es una mesa limpia debajo de los cuadros. */
function addEscritorioModerno(g, U, o){
  const x0 = (o && o.xCm || 0)*U, z0 = (o && o.zCm || 8)*U;
  const W = 150*U, D = 62*U, H = 74*U;
  const roble = pbrMat('oak_veneer_01', 0.11, { color:'#e8dcc8', roughness:0.55, env:0.5 });
  const roble2 = pbrMat('oak_veneer_01', 0.09, { color:'#d8cab3', roughness:0.6, env:0.45 });
  const G = new THREE.Group(); G.position.set(x0, 0, z0); g.add(G);
  const top = softBox(W, 3.4*U, D, 1.2*U, roble);  top.position.set(0, H - 1.7*U, D/2); G.add(top);
  const skirt = softBox(W - 18*U, 9*U, 2.5*U, 1*U, roble2); skirt.position.set(0, H - 12*U, 4*U); G.add(skirt);
  [-1, 1].forEach(sx => {
    const leg = softBox(4.5*U, H - 3.4*U, 4.5*U, 1*U, roble2);
    leg.position.set(sx*(W/2 - 5*U), (H - 3.4*U)/2, 6*U); G.add(leg);
    const leg2 = softBox(4.5*U, H - 3.4*U, 4.5*U, 1*U, roble2);
    leg2.position.set(sx*(W/2 - 5*U), (H - 3.4*U)/2, D - 6*U); G.add(leg2);
    const bar = softBox(3*U, 3*U, D - 16*U, 1*U, roble2);
    bar.position.set(sx*(W/2 - 5*U), 12*U, D/2); G.add(bar);
  });
  addContactShadow(g, U, 190, 100, (o && o.xCm || 0)*U, z0 + D/2, 0.85);
  return G;
}

/* ── SALÓN REALISTA: misma pared y suelo, pero los muebles son modelos reales descargados ── */
function buildSalonReal(g, U){
  /* Muebles reales de Poly Haven, a su tamaño de verdad y a propósito PEQUEÑOS: mesita auxiliar de 55,
     butaca de 82, mesa baja de 120×60 y planta de 84. Nada de aparadores ni sofás grandes: la pared
     tiene que ser lo que manda, y aquí se mira de frente (lo que se acerca a la cámara sale enorme).
     Medidas reales de cada .glb: `python _medir_modelos.py`. */
  buildShell(g, U, { wall1:'#ece7e0', wall2:'#ded8ce', floor1:'#c8beb2', floor2:'#b4aa9c', side:'#eae5de', skirt:'#ded8cf' });
  addRug(g, U, 300, 180, 118, '#d6ccbc');
  addModel(g, 'modelos/side_table_01.glb',   { xCm:-112, zCm:8, back:true });           // 55×55×45
  addContactShadow(g, U, 80, 70, -112*U, 32*U, 0.7);
  addModel(g, 'modelos/ceramic_vase_01.glb', { xCm:-112, zCm:30, yCm:55 });             // encima de la mesita
  /* El asiento: por defecto la butaca de bouclé nuestra. Con ?butaca=cc0 se ve en su lugar
     el sillón descargado, aclarado, para poder comparar los dos. */
  const _bt = new URLSearchParams(location.search).get('butaca');
  if(_bt === 'cc0'){
    addModel(g, 'modelos/modern_arm_chair_01.glb', { xCm:140, zCm:70, rotY:-0.55, tint:'#e9e0d1', tintKeep:['wood','madera','frame'] });
    addContactShadow(g, U, 120, 115, 150*U, 76*U, 0.6);
  } else if(_bt === 'pp'){
    // butaca low-poly de poly.pizza (CreativeTrio, CC0): sin textura, así que el tinte SÍ funciona
    addModel(g, 'modelos/butaca_polypizza_cc0.glb', { xCm:118, zCm:58, rotY:-0.4, widthCm:82, tint:'#e6ddcd' });
    addContactShadow(g, U, 118, 112, 118*U, 62*U, 0.6);
  } else if(_bt === 'q'){
    addModel(g, 'modelos/silla_quaternius_cc0.glb', { xCm:118, zCm:58, rotY:-0.4, widthCm:82, tint:'#e6ddcd' });
    addContactShadow(g, U, 118, 112, 118*U, 62*U, 0.6);
  } else {
    addButacaModerna(g, U, { xCm:104, zCm:58, rotY:-0.38 });
  }
  addModel(g, 'modelos/potted_plant_02.glb', { xCm:-202, zCm:58 });                     // 70×84
  addContactShadow(g, U, 88, 82, -202*U, 58*U, 0.6);
}

/* ── ESCRITORIO: mesa pequeña contra la pared, silla clara, libreta y plantas ── */
function buildDespachoReal(g, U){
  buildShell(g, U, { wall1:'#eae5df', wall2:'#dbd5cd', floor1:'#c3b9ad', floor2:'#b0a698', side:'#e7e2dc', skirt:'#dbd5cc' });
  addRug(g, U, 270, 175, 128, '#d0c7bb');
  addEscritorioModerno(g, U, { xCm:-14, zCm:8 });                                      // 150×62, roble claro
  addModel(g, 'modelos/binder_notebook.glb',   { xCm:-52, zCm:34, yCm:74, rotY:0.2 });
  addModel(g, 'modelos/potted_plant_04.glb',   { xCm:16,  zCm:30, yCm:74 });           // suculenta de 27
  addModel(g, 'modelos/painted_wooden_chair_01.glb', { xCm:96, zCm:80, rotY:Math.PI - 0.55 });
  addContactShadow(g, U, 70, 70, 96*U, 80*U, 0.6);
  addModel(g, 'modelos/side_table_01.glb',     { xCm:182, zCm:8, back:true });
  addContactShadow(g, U, 80, 70, 182*U, 32*U, 0.65);
  addModel(g, 'modelos/ceramic_vase_01.glb',   { xCm:182, zCm:28, yCm:55 });
  addModel(g, 'modelos/potted_plant_02.glb',   { xCm:-178, zCm:52 });
  addContactShadow(g, U, 88, 82, -178*U, 52*U, 0.6);
}

/* ── SALÓN CON SOFÁ: el sofá de bouclé nuestro, una mesita real y plantas ── */
function buildSalonSofa(g, U){
  buildShell(g, U, { wall1:'#ece7e0', wall2:'#ded8ce', floor1:'#c8beb2', floor2:'#b4aa9c', side:'#eae5de', skirt:'#ded8cf' });
  addRug(g, U, 340, 200, 140, '#d6ccbc');
  addSofaModerno(g, U, { xCm:0, zCm:8 });                                              // 215 de ancho, 78 de alto
  addModel(g, 'modelos/side_table_01.glb',   { xCm:-152, zCm:14, back:true });
  addContactShadow(g, U, 80, 70, -152*U, 38*U, 0.7);
  addModel(g, 'modelos/ceramic_vase_01.glb', { xCm:-152, zCm:36, yCm:55 });
  addModel(g, 'modelos/potted_plant_02.glb', { xCm:158, zCm:56 });
  addContactShadow(g, U, 88, 82, 158*U, 56*U, 0.6);
}


/* ── PARED DE RETORNO: un trozo de pared perpendicular que entra hacia la cámara.
   Es lo que hace que una escena se lea como "una esquina" o como un pasillo, y no como
   un decorado plano. `faceIn` es hacia dónde mira la cara buena: +1 al centro, -1 afuera. ── */
function addReturnWall(g, U, o){
  const H = ROOM_BOX.h*U, D = o.depthCm*U, T = 12*U, x = o.xCm*U;
  const w = shadedBox(T, H, D, o.wall || '#eae5de');
  w.position.set(x, H/2, D/2); g.add(w);
  const sk = shadedBox(T + 1.2*U, 9*U, D, o.skirt || '#ded8cf');
  sk.position.set(x, 4.5*U, D/2); g.add(sk);
  // el canto vertical, un pelo más claro: es la arista que dibuja la esquina
  const edge = shadedBox(1.2*U, H, 1.6*U, o.wall || '#eae5de');
  edge.scale.setScalar(1); edge.position.set(x + (o.faceIn || 1)*T/2, H/2, D - 0.8*U);
  edge.material = shadedMat(o.wall || '#eae5de', 1.14); g.add(edge);
  return w;
}

/* ── PUERTA sobre la pared del fondo: hueco oscuro con su marco y su jamba.
   Va en la pared del fondo y no en una lateral porque el visor mira de frente: una puerta
   en la pared de al lado se vería de canto, es decir, no se vería. ── */
function addDoorway(g, U, o){
  const x = o.xCm*U, W = 82*U, H = 203*U, z = 0.4*U;
  const hueco = new THREE.Mesh(new THREE.PlaneGeometry(W, H),
    new THREE.MeshBasicMaterial({ map: gradientTex('#d2cbbe', '#ada496', true), toneMapped:false }));
  hueco.position.set(x, H/2, z); g.add(hueco);
  // la jamba: un canto claro a la derecha del hueco, que es lo que le da grosor a la pared
  const jamba = new THREE.Mesh(new THREE.PlaneGeometry(9*U, H), shadedMat('#d9d3c9', 1));
  jamba.position.set(x + W/2 - 4.5*U, H/2, z + 0.4*U); g.add(jamba);
  const marco = '#f4f1ea';
  [-1, 1].forEach(sg => {
    const j = new THREE.Mesh(new THREE.PlaneGeometry(7*U, H + 14*U), shadedMat(marco, 1.04));
    j.position.set(x + sg*(W/2 + 3.5*U), (H + 14*U)/2 - 7*U, z + 0.8*U); g.add(j);
  });
  const dintel = new THREE.Mesh(new THREE.PlaneGeometry(W + 14*U, 7*U), shadedMat(marco, 1.07));
  dintel.position.set(x, H + 3.5*U, z + 0.8*U); g.add(dintel);
}

/* ── ALFOMBRA DE PASILLO: estrecha y larga, va hacia la cámara (no como la del salón) ── */
function addRunner(g, U, o){
  const w = o.wCm*U, d = o.dCm*U;
  const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shadedMat(o.hex, 1));
  r.rotation.x = -Math.PI/2; r.position.set((o.xCm||0)*U, 0.3*U, (o.zCm||0)*U + d/2); g.add(r);
  const c = new THREE.Mesh(new THREE.PlaneGeometry(w - 12*U, d - 12*U), shadedMat(o.hex, 1.08));
  c.rotation.x = -Math.PI/2; c.position.set((o.xCm||0)*U, 0.5*U, (o.zCm||0)*U + d/2); g.add(c);
}

/* Panel de madera en la pared, del suelo hasta `altoCm`: el cabecero moderno que cubre
   media pared. Va pegado a la pared (z casi 0) para que los cuadros caigan justo encima. */
function addPanelMadera(g, U, o){
  const W = (o.wCm || 320)*U, H = (o.altoCm || 110)*U, T = 3*U;
  const madera = pbrMat('oak_veneer_01', 0.22, { color:o.color || '#dfcdae', roughness:0.6, env:0.4 });
  const p = softBox(W, H, T, 0.6*U, madera);
  p.position.set((o.xCm || 0)*U, H/2, T/2 + 0.4*U); g.add(p);
  // ceja superior: un canto claro que separa el panel de la pared pintada
  const ceja = new THREE.Mesh(new THREE.PlaneGeometry(W, 1.6*U), shadedMat('#c2ad8a', 1));
  ceja.position.set((o.xCm || 0)*U, H + 0.8*U, T + 0.6*U); g.add(ceja);
  return p;
}


/* ── TERRAZAS: la pared del fondo sigue siendo maciza (ahí se cuelga el aluminio, como en
   una casa real); lo que cambia es el lateral, que en vez de otra pared lleva cristal o
   barandilla, con un cielo/verde detrás para que no se vea un hueco negro. ── */
function addVidrieraLateral(g, U, o){
  const sg = o.sg, H = ROOM_BOX.h*U, D = ROOM_BOX.d*U, x = sg*ROOM_BOX.w/2*U;
  // cielo/verde tras el cristal primero, para que se transparente por debajo del panel
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(D*1.5, H*1.5),
    new THREE.MeshBasicMaterial({ map: gradientTex(o.sky1 || '#bfe0ea', o.sky2 || '#eef2df', true), toneMapped:false }));
  sky.rotation.y = sg < 0 ? Math.PI/2 : -Math.PI/2; sky.position.set(x + sg*40*U, H*0.55, D/2); g.add(sky);
  const cristal = new THREE.Mesh(new THREE.PlaneGeometry(D, H),
    new THREE.MeshBasicMaterial({ color:new THREE.Color(o.tinte || '#dfeef0'), transparent:true, opacity:0.22, toneMapped:false, side:THREE.DoubleSide }));
  cristal.rotation.y = sg < 0 ? Math.PI/2 : -Math.PI/2; cristal.position.set(x, H/2, D/2); g.add(cristal);
  // carpintería de aluminio: antes solo había junquillos verticales de 3cm sueltos, sin
  // remate arriba ni abajo — parecía un cristal flotando. Ahora hay perfil superior e
  // inferior corridos (como una carpintería de verdad) y los verticales son más gruesos.
  const marco = new THREE.MeshStandardMaterial({ color:new THREE.Color(o.marco || '#e2e2e0'), roughness:0.4, metalness:0.55, envMapIntensity:0.5 });
  for(let z = 8; z < o.depthCm; z += 90){
    const bar = new THREE.Mesh(new THREE.BoxGeometry(5*U, H, 5*U), marco);
    bar.position.set(x, H/2, z*U); g.add(bar);
  }
  const remate = (y) => { const r = new THREE.Mesh(new THREE.BoxGeometry(6*U, 6*U, D), marco); r.position.set(x, y, D/2); g.add(r); };
  remate(3*U); remate(H - 3*U);
  const zocalo = shadedBox(10*U, 9*U, D, o.marco || '#e2e2e0');
  zocalo.position.set(x - sg*5*U, 4.5*U, D/2); g.add(zocalo);
}
function addBarandilla(g, U, o){
  const sg = o.sg, HP = 98*U, D = ROOM_BOX.d*U, x = sg*ROOM_BOX.w/2*U, H = ROOM_BOX.h*U;
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(D*1.5, H*1.4),
    new THREE.MeshBasicMaterial({ map: gradientTex(o.sky1 || '#bcdbe8', o.sky2 || '#eef3e0', true), toneMapped:false }));
  sky.rotation.y = sg < 0 ? Math.PI/2 : -Math.PI/2; sky.position.set(x + sg*45*U, H*0.5, D/2); g.add(sky);
  const metal = new THREE.MeshStandardMaterial({ color:0x2c2c30, roughness:0.4, metalness:0.75 });
  // Antes el peto (macizo) y los barrotes ocupaban la MISMA altura entera, montados casi
  // pegados: un muro sólido justo detrás de una barandilla, que no se lee ni como una cosa
  // ni como la otra. Lo normal en una terraza española es peto bajo (fábrica, ~45cm) y
  // barandilla de hierro encima hasta la altura de seguridad — eso es lo que hay ahora.
  const PET = 14*U, PH = 46*U;                          // peto: grueso de muro, hasta la rodilla
  const peto = shadedBox(PET, PH, D, o.peto || '#e4ddd0');
  peto.position.set(x - sg*(PET/2 - 2*U), PH/2, D/2); g.add(peto);
  const remate = new THREE.Mesh(new THREE.BoxGeometry(PET + 2*U, 3*U, D), shadedMat(o.peto || '#e4ddd0', 1.1));
  remate.position.set(x - sg*(PET/2 - 2*U), PH - 1.5*U, D/2); g.add(remate);       // vierteaguas
  const pasamanos = new THREE.Mesh(new THREE.BoxGeometry(7*U, 3.5*U, D), metal);
  pasamanos.position.set(x, HP + 1.8*U, D/2); g.add(pasamanos);                    // pasamanos, arriba del todo
  const zocaloBarra = new THREE.Mesh(new THREE.BoxGeometry(3*U, 2.4*U, D), metal);
  zocaloBarra.position.set(x, PH + 1.2*U, D/2); g.add(zocaloBarra);                // pletina que recoge los barrotes desde el peto
  // barrotes: solo desde el remate del peto hasta el pasamanos, no desde el suelo
  for(let z = 6; z < o.depthCm; z += 16){
    const barrote = new THREE.Mesh(new THREE.CylinderGeometry(0.8*U, 0.8*U, HP - PH, 10), metal);
    barrote.position.set(x, PH + (HP - PH)/2, z*U); g.add(barrote);
  }
}
/* Trenzado de ratán pintado a canvas (mismo truco que buildBambooTex para el bambú): dos
   juegos de tiras diagonales que se cruzan por encima/debajo, con veta suelta en cada tira.
   Antes el ratán era un MeshBasicMaterial de color plano — sin luz ni textura, por eso se
   veía "de plástico" al lado de los muebles de dentro (que sí llevan mapa PBR). */
let _ratanTex = null;
function buildRatanTex(){
  if(_ratanTex) return _ratanTex;
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const ctx = c.getContext('2d'), N = c.width;
  ctx.fillStyle = '#b6905f'; ctx.fillRect(0, 0, N, N);
  const strip = 34, gap = 6;
  const drawSet = (flip) => {
    for(let o2 = -N; o2 < N*2; o2 += strip + gap){
      ctx.save();
      ctx.translate(N/2, N/2); ctx.rotate(flip ? Math.PI/4 : -Math.PI/4); ctx.translate(-N/2, -N/2);
      const g2 = ctx.createLinearGradient(o2, 0, o2 + strip, 0);
      const base = 0.86 + Math.sin(o2*0.7)*0.03;
      g2.addColorStop(0, `rgba(70,48,26,${0.30})`);
      g2.addColorStop(0.18, `rgba(255,235,205,${base})`);
      g2.addColorStop(0.5, `rgba(214,171,116,${base})`);
      g2.addColorStop(0.82, `rgba(255,235,205,${base*0.9})`);
      g2.addColorStop(1, `rgba(70,48,26,0.30)`);
      ctx.fillStyle = g2;
      ctx.fillRect(o2, -N, strip, N*3);
      // veta suelta dentro de la tira
      ctx.globalAlpha = 0.14;
      for(let k = 0; k < 10; k++){
        ctx.strokeStyle = Math.random() < 0.5 ? '#5a3d20' : '#f4e2c4';
        ctx.lineWidth = 0.8;
        const lx = o2 + Math.random()*strip;
        ctx.beginPath(); ctx.moveTo(lx, -N); ctx.lineTo(lx + (Math.random()-0.5)*6, N*2); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  };
  drawSet(false); drawSet(true);
  _ratanTex = tune(new THREE.CanvasTexture(c));
  _ratanTex.wrapS = _ratanTex.wrapT = THREE.RepeatWrapping;
  return _ratanTex;
}
function ratanMat(hex, repeat){
  const t = buildRatanTex().clone(); t.needsUpdate = true; t.repeat.set(repeat || 1.6, repeat || 1.6);
  return calmMat(new THREE.MeshStandardMaterial({ map:t, color:new THREE.Color(hex || '#ffffff'), roughness:0.86, metalness:0, envMapIntensity:0.4 }));
}
/* tumbona de ratán, hecha con cajas: el kit descargado no trae mobiliario de exterior */
function addRatanLounge(g, U, o){
  const x0 = (o.xCm||0)*U, z0 = (o.zCm||10)*U, W = 170*U, D = 82*U;
  const ratan = ratanMat(o.color || '#c9ad81', 0.4);
  const cojin = pbrMat('curly_teddy_natural', 0.4, { color:o.cojin || '#eee6d6', roughness:1, env:0.3 });
  const G = new THREE.Group(); G.position.set(x0, 0, z0); if(o.rotY) G.rotation.y = o.rotY; g.add(G);
  const base = softBox(W, 15*U, D, 2*U, ratan); base.position.set(0, 7.5*U, D/2); G.add(base);
  const respaldo = softBox(W, 42*U,9*U, 3*U, ratan); respaldo.position.set(0, 15*U + 21*U, 7*U); respaldo.rotation.x = -0.2; G.add(respaldo);
  const asiento = softBox(W - 10*U, 9*U, D - 12*U, 2*U, cojin); asiento.position.set(0, 20*U, D/2 + 2*U); G.add(asiento);
  const cojinResp = softBox(W - 16*U, 30*U, 8*U, 3*U, cojin); cojinResp.position.set(0, 40*U, 15*U); cojinResp.rotation.x = -0.2; G.add(cojinResp);
  [-1, 1].forEach(sgn => { const brazo = softBox(11*U, 24*U, D, 3*U, ratan); brazo.position.set(sgn*(W/2 - 5.5*U), 22*U, D/2); G.add(brazo); });
  addContactShadow(g, U, W/U*1.15, D/U*1.2, x0, z0 + D/2, 0.6);
  return G;
}
function addMesaRatan(g, U, o){
  const x = (o.xCm||0)*U, z = (o.zCm||10)*U, ratan = ratanMat(o.color || '#c9ad81', 3);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(22*U, 22*U, 3*U, 22), ratan); top.position.set(x, 44*U, z); g.add(top);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(13*U, 16*U, 41*U, 16), ratan); base.position.set(x, 21.5*U, z); g.add(base);
  addContactShadow(g, U, 55, 55, x, z, 0.55);
}


/* ── CAMA MODERNA de plataforma: base baja tapizada + cabecero acolchado con costuras
   verticales (canalé), sin somier visto ni patas torneadas. El estilo "boutique hotel". ── */
function addCamaModerna(g, U, o){
  const anchoCm = o.anchoCm || 160, largoCm = o.largoCm || 200;
  const x0 = (o.xCm||0)*U, z0 = (o.zCm||6)*U, W = anchoCm*U, D = largoCm*U;
  const tela = shadedMat(o.color || '#d8cbb8', 1), telaOsc = shadedMat(o.color || '#d8cbb8', 0.88);
  const ropa = shadedMat(o.ropaCm || o.ropa || '#f5f1e8', 1);
  const G = new THREE.Group(); G.position.set(x0, 0, z0); if(o.rotY) G.rotation.y = o.rotY; g.add(G);
  // cabecero: panel con canalé (franjas verticales en relieve, siete cajas finas pegadas)
  const HC = 108*U, WC = W + 10*U;
  const panel = softBox(WC, HC, 6*U, 2*U, telaOsc); panel.position.set(0, HC/2, -2*U); G.add(panel);
  const nCanal = 7, wCanal = WC/nCanal;
  for(let i=0;i<nCanal;i++){
    const c = softBox(wCanal*0.72, HC*0.94, 2.2*U, wCanal*0.3, tela);
    c.position.set(-WC/2 + wCanal*(i+0.5), HC/2, 1.2*U); G.add(c);
  }
  // base de plataforma, baja y con zócalo retranqueado (efecto "flota")
  const BH = 32*U;
  const zocaloB = shadedBox(W - 6*U, BH - 8*U, D - 6*U, o.color || '#c7b9a2');
  zocaloB.position.set(0, (BH-8*U)/2, D/2); zocaloB.material.forEach ? null : null; G.add(zocaloB);
  const base = softBox(W, 8*U, D, 1.5*U, telaOsc); base.position.set(0, BH - 4*U, D/2); G.add(base);
  // colchón + ropa de cama
  const colchon = softBox(W - 4*U, 16*U, D - 4*U, 2*U, ropa); colchon.position.set(0, BH + 8*U, D/2); G.add(colchon);
  const funda = softBox(W - 2*U, 4*U, D*0.42, 2*U, ropa); funda.position.set(0, BH + 18*U, D*0.24); G.add(funda);
  // almohadas: dos cajas redondeadas apoyadas en el cabecero
  [-1,1].forEach(sg => {
    const alm = softBox(W*0.42, 12*U, 20*U, 5*U, shadedMat('#ffffff', 0.98));
    alm.position.set(sg*W*0.24, BH + 22*U, 14*U); alm.rotation.x = -0.08; G.add(alm);
  });
  addContactShadow(g, U, anchoCm*1.15, largoCm*1.08, x0, z0 + D/2, 0.55);
  return G;
}
/* mesita de noche moderna: un cajón + hueco abierto debajo, sin tiradores (canto como uña) */
function addMesitaModerna(g, U, o){
  const x=(o.xCm||0)*U, z=(o.zCm||6)*U, W=44*U, D=38*U, H=52*U;
  const mat = pbrMat(o.tex || 'oak_veneer_01', 0.16, { color:o.color || '#d9c9ab', roughness:0.55, env:0.45 });
  const G = new THREE.Group(); G.position.set(x,0,z); if(o.rotY) G.rotation.y = o.rotY; g.add(G);
  /* 15-oct: las patas no llegaban al cajón (quedaban 4 cm de aire) y solo había las dos de delante */
  const top = softBox(W, 3*U, D, 0.8*U, mat); top.position.set(0, H - 1.5*U, D/2); G.add(top);
  const LH = H*0.42, cajH = (H - 3*U) - LH;                 // patas hasta el cajón, cajón hasta la tapa
  const cajon = softBox(W - 4*U, cajH + 0.4*U, D - 6*U, 0.8*U, mat); cajon.position.set(0, LH + cajH/2, D/2); G.add(cajon);
  const uña = softBox(W - 10*U, 1.1*U, 0.6*U, 0.2*U, shadedMat('#2a2119', 0.9));   // la ranura del cajón, oscura
  uña.position.set(0, LH + cajH*0.80, D - 3*U + 0.15*U); G.add(uña);          // justo bajo la tapa, como el tirador de uñero
  [-1,1].forEach(sx => [5*U, D - 5*U].forEach(pz => {
    const pata = softBox(2.4*U, LH + 0.6*U, 2.4*U, 0.6*U, mat); pata.position.set(sx*(W/2 - 5*U), (LH + 0.6*U)/2, pz); G.add(pata);
  }));
  addContactShadow(g, U, 55, 48, x, z, 0.5);
  return G;
}
/* lámpara de techo colgante, sencilla, para dormitorios modernos (sin mesita con lámpara) */
function addLamparaColgante(g, U, xCm, zCm, hCm, color){
  const x=xCm*U, z=zCm*U, y=(hCm||150)*U;
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.25*U,0.25*U, (ROOM_BOX.h*U - y), 6), shadedMat('#2a2a2a',1));
  cable.position.set(x, y + (ROOM_BOX.h*U - y)/2, z); g.add(cable);
  const globo = new THREE.Mesh(new THREE.SphereGeometry(9*U, 20, 16), shadedMat(color || '#efe6d6', 1.05));
  globo.position.set(x, y, z); g.add(globo);
}
/* mueble de TV bajo, moderno, sin tiradores; opcional pantalla encima */
function addConsolaTV(g, U, o){
  const x=(o.xCm||0)*U, z=(o.zCm||8)*U, W=(o.wCm||190)*U, D=40*U, H=42*U;
  const mat = pbrMat(o.tex || 'oak_veneer_01', 0.22, { color:o.color || '#5a4636', roughness:0.5, env:0.4 });
  const G = new THREE.Group(); G.position.set(x,0,z); g.add(G);
  const cuerpo = softBox(W, H, D, 1.2*U, mat); cuerpo.position.set(0, H/2 + 6*U, D/2); G.add(cuerpo);
  [-1,1].forEach(sx=>{ const pata = new THREE.Mesh(new THREE.CylinderGeometry(1.1*U,0.9*U,6*U,10), new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:0.5,metalness:0.6}));
    pata.position.set(sx*(W/2-10*U), 3*U, D-8*U); G.add(pata); });
  for(let i=1;i<3;i++){ const hueco=new THREE.Mesh(new THREE.PlaneGeometry(1*U,H-8*U), shadedMat('#000',1)); hueco.position.set(-W/2+W*i/3, H/2+6*U, D+0.3*U); G.add(hueco); }
  if(o.tv !== false){
    const pant = softBox(W*0.62, W*0.62*0.58, 3*U, 0.4*U, shadedMat('#111214', 0.9));
    pant.position.set(0, H + 6*U + W*0.62*0.29 + 4*U, 6*U); G.add(pant);
    const marco = new THREE.Mesh(new THREE.PlaneGeometry(W*0.62-3*U, W*0.62*0.58-3*U), new THREE.MeshBasicMaterial({ color:0x171a1d, toneMapped:false }));
    marco.position.set(0, H + 6*U + W*0.62*0.29 + 4*U, 6*U + 1.6*U); G.add(marco);
  }
  addContactShadow(g, U, o.wCm||190, 60, x, z + D/2, 0.55);
  return G;
}
/* estantería alta y abierta (para el Sobremesa: se apoya encima, o en una balda entre libros).
   `shelvesCm` = alturas (desde el suelo) de las baldas intermedias; la de arriba y la de abajo
   son fijas (tapa y base del mueble). */
function addEstanteria(g, U, o){
  const x=(o.xCm||0)*U, z=(o.zCm||10)*U, W=(o.wCm||88)*U, D=(o.dCm||32)*U, H=(o.hCm||190)*U, T=2.2*U;
  const mat = pbrMat(o.tex || 'oak_veneer_01', 0.3, { color:o.color || '#5a4636', roughness:0.55, env:0.4 });
  const G = new THREE.Group(); G.position.set(x,0,z); if(o.rotY) G.rotation.y = o.rotY; g.add(G);
  [-1,1].forEach(sx=>{ const lado = softBox(T, H, D, 0.4*U, mat); lado.position.set(sx*(W/2-T/2), H/2, D/2); G.add(lado); });
  const tapa = softBox(W, T, D, 0.4*U, mat); tapa.position.set(0, H-T/2, D/2); G.add(tapa);
  const base = softBox(W, T, D, 0.4*U, mat); base.position.set(0, T/2, D/2); G.add(base);
  (o.shelvesCm || []).forEach(yCm => {
    const balda = softBox(W - T*0.3, T*0.85, D - 1*U, 0.3*U, mat);
    balda.position.set(0, yCm*U, D/2); G.add(balda);
  });
  /* sin trasera (noBack): para la balda donde se apoya el cuadro. Con trasera, en esa misma
     altura, el panel quedaría por delante del cuadro (el cuadro siempre pinta a la profundidad
     de "la pared", fija) y lo taparía entero. Sin ella se ve la pared de la habitación al fondo,
     que cuela igual de bien. */
  if(o.noBack !== true){
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W - T*1.6, H - T*1.6), shadedMat(o.backColor || '#33261a', 0.6));
    back.position.set(0, H/2, 0.08*U); G.add(back);
  }
  addContactShadow(g, U, o.wCm||88, (o.dCm||32)*1.7, x, z + D/2, 0.5);
  return G;
}
/* fila de "libros" (cajas de colores, altura y ancho ligeramente al azar): decora una balda
   sin depender de un modelo con proporciones desconocidas */
function addBookRow(g, U, xCm, yCm, zCm, n, wTotalCm){
  const colors = ['#8a3b3b','#3b5d8a','#c9a227','#446644','#7a4a8a','#c9793f','#33475b'];
  const G = new THREE.Group(); G.position.set(xCm*U, yCm*U, zCm*U); g.add(G);
  let x = -wTotalCm*U/2;
  for(let i=0;i<n;i++){
    const w = (wTotalCm/n)*(0.6+((i*37)%10)/14)*U, h=(13+((i*53)%9))*U, d=17*U;
    const mat = new THREE.MeshStandardMaterial({ color:colors[i%colors.length], roughness:0.75, metalness:0 });
    const book = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
    book.position.set(x+w/2, h/2, 0); G.add(book);
    x += w + 0.2*U;
  }
  return G;
}
/* aparador/consola alto (para el Sobremesa: se apoya encima). Cuerpo con puertas simuladas
   (huecos finos) sobre patas metálicas cortas. */
function addAparadorAlto(g, U, o){
  const x=(o.xCm||0)*U, z=(o.zCm||10)*U, W=(o.wCm||130)*U, D=(o.dCm||42)*U, H=(o.hCm||96)*U, legH=9*U;
  const mat = pbrMat(o.tex || 'oak_veneer_01', 0.24, { color:o.color || '#4d3a28', roughness:0.5, env:0.42 });
  const G = new THREE.Group(); G.position.set(x,0,z); if(o.rotY) G.rotation.y = o.rotY; g.add(G);
  const cuerpo = softBox(W, H-legH, D, 1*U, mat); cuerpo.position.set(0, legH + (H-legH)/2, D/2); G.add(cuerpo);
  [-1,1].forEach(sx=>{ [-1,1].forEach(sz=>{
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(1.1*U,0.9*U,legH,10), new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:0.5,metalness:0.55}));
    pata.position.set(sx*(W/2-8*U), legH/2, D/2 + sz*(D/2-6*U)); G.add(pata);
  }); });
  const nPuertas = o.puertas || 3;
  for(let i=1;i<nPuertas;i++){
    const hueco = new THREE.Mesh(new THREE.PlaneGeometry(0.6*U, H-legH-6*U), shadedMat('#000000', 1));
    hueco.position.set(-W/2 + W*i/nPuertas, legH+(H-legH)/2, D+0.3*U); G.add(hueco);
  }
  for(let i=0;i<nPuertas;i++){
    const tirador = new THREE.Mesh(new THREE.CylinderGeometry(0.35*U,0.35*U, W/nPuertas*0.45, 8),
      new THREE.MeshStandardMaterial({color:0x1c1c1c,roughness:0.35,metalness:0.7}));
    tirador.rotation.z = Math.PI/2; tirador.position.set(-W/2 + W*(i+0.5)/nPuertas, legH+(H-legH)*0.55, D+0.5*U); G.add(tirador);
  }
  addContactShadow(g, U, o.wCm||130, (o.dCm||42)*1.5, x, z + D/2, 0.55);
  return G;
}
/* pérgola de madera para terrazas: cuatro postes + vigas cruzadas, con opción de tela de toldo */
function addPergola(g, U, o){
  const W = (o.wCm||280)*U, D = (o.dCm||220)*U, H = (o.hCm||230)*U;
  const x0 = (o.xCm||0)*U, z0 = (o.zCm||40)*U;
  const madera = pbrMat('oak_veneer_01', 0.3, { color:o.color || '#8a6a45', roughness:0.65, env:0.35 });
  const G = new THREE.Group(); G.position.set(x0,0,z0); g.add(G);
  const postes = [[-W/2,0],[W/2,0],[-W/2,D],[W/2,D]];
  postes.forEach(([px,pz])=>{ const p=new THREE.Mesh(new THREE.BoxGeometry(6*U,H,6*U), madera); p.position.set(px,H/2,pz); G.add(p); });
  const vigaLateral = (pz)=>{ const v=new THREE.Mesh(new THREE.BoxGeometry(W+8*U,7*U,7*U), madera); v.position.set(0,H-3.5*U,pz); G.add(v); };
  vigaLateral(0); vigaLateral(D);
  const nVigas = 6;
  for(let i=0;i<=nVigas;i++){
    const vz = i*D/nVigas;
    const v = new THREE.Mesh(new THREE.BoxGeometry(W+2*U,5*U,5*U), madera); v.position.set(0,H-9*U,vz); G.add(v);
  }
  if(o.toldo){
    const tela = new THREE.Mesh(new THREE.PlaneGeometry(W-4*U, D-4*U), new THREE.MeshBasicMaterial({ color:new THREE.Color(o.toldo), transparent:true, opacity:0.88, side:THREE.DoubleSide, toneMapped:false }));
    tela.rotation.x = Math.PI/2; tela.position.set(0, H-13*U, D/2); G.add(tela);
  }
  return G;
}
/* ── ESCALERA: tramo de peldaños que sube hacia el fondo, con zanca y barandilla. La pared
   de aterrizaje (donde se cuelga el aluminio) sigue siendo la pared normal del fondo. ── */
function addEscalones(g, U, o){
  const nPelda = o.n || 11, hPelda = 17.5*U, dPelda = 27*U, W = (o.wCm||96)*U;
  const x0 = (o.xCm||0)*U, z0 = (o.zCm||0)*U;
  const madera = pbrMat('oak_veneer_01', 0.28, { color:o.color || '#c7ad84', roughness:0.55, env:0.4 });
  const zanca = shadedMat(o.zanca || '#f1ede4', 1);
  const G = new THREE.Group(); G.position.set(x0, 0, z0); g.add(G);
  for(let i=0;i<nPelda;i++){
    const y = i*hPelda, z = i*dPelda;
    const huella = softBox(W, 3.2*U, dPelda + 1*U, 0.6*U, madera); huella.position.set(0, y + hPelda, z + dPelda/2); G.add(huella);
    const tabica = new THREE.Mesh(new THREE.PlaneGeometry(W, hPelda), zanca); tabica.position.set(0, y + hPelda/2, z + 0.3*U); G.add(tabica);
  }
  // barandilla: pasamanos + barrotes, en el lado abierto
  const sg = o.sg || 1, HB = 92*U;
  const metal = new THREE.MeshStandardMaterial({ color:new THREE.Color(o.metalColor || '#2c2c30'), roughness:o.metalColor ? 0.35 : 0.4, metalness:o.metalColor ? 0.15 : 0.7 });
  for(let i=0;i<nPelda;i+=2){
    const y = i*hPelda, z = i*dPelda + dPelda/2;
    const barrote = new THREE.Mesh(new THREE.CylinderGeometry(0.55*U,0.55*U,HB,8), metal);
    barrote.position.set(sg*(W/2 - 1*U), y + hPelda + HB/2, z); G.add(barrote);
  }
  const pasHex = o.pasamanos || o.metalColor || '#2c2c30';
  const pasMat = o.pasamanos ? pbrMat('oak_veneer_01', 0.2, { color:pasHex, roughness:0.5, env:0.4 }) : metal;
  const pasCurva = new THREE.Mesh(new THREE.BoxGeometry(4*U,4*U, nPelda*dPelda*1.02), pasMat);
  pasCurva.position.set(sg*(W/2-1*U), (nPelda-1)/2*hPelda + hPelda + HB, (nPelda-1)*dPelda/2 + dPelda/2);
  pasCurva.rotation.x = -Math.atan(hPelda/dPelda); G.add(pasCurva);
  return G;
}
/* Escalera moderna "flotante": peldaños de madera en voladizo sobre una viga de acero negra,
   sin tabica (se ve el hueco debajo de cada uno) y barrotes de cable fino — el look de las
   escaleras de arquitecto que salían en las fotos de referencia, bien distinto de la rústica. */
function addEscalonesFlotantes(g, U, o){
  const nPelda = o.n || 11, hPelda = 17.5*U, dPelda = 27*U, W = (o.wCm||100)*U;
  const x0 = (o.xCm||0)*U, z0 = (o.zCm||0)*U, sg = o.sg || 1;
  const madera = pbrMat('oak_veneer_01', 0.24, { color:o.color || '#4a3626', roughness:0.45, env:0.4 });
  const acero = new THREE.MeshStandardMaterial({ color:0x1c1c1f, roughness:0.3, metalness:0.85 });
  const G = new THREE.Group(); G.position.set(x0, 0, z0); g.add(G);
  // viga central, en diagonal, que hace de zanca vista (así "flotan" los peldaños)
  const largoViga = Math.hypot(nPelda*hPelda, nPelda*dPelda);
  const viga = new THREE.Mesh(new THREE.BoxGeometry(14*U, 7*U, largoViga), acero);
  viga.position.set(0, (nPelda-1)/2*hPelda + hPelda*0.55, (nPelda-1)/2*dPelda + dPelda*0.55);
  viga.rotation.x = -Math.atan(hPelda/dPelda); G.add(viga);
  for(let i=0;i<nPelda;i++){
    const y = i*hPelda, z = i*dPelda;
    const huella = softBox(W, 5*U, dPelda - 2*U, 0.8*U, madera); huella.position.set(0, y + hPelda, z + dPelda/2); G.add(huella);
    // tira de luz baja bajo cada peldaño (detalle que se repetía en las fotos "modernas")
    const tira = new THREE.Mesh(new THREE.PlaneGeometry(W - 4*U, 1.2*U), new THREE.MeshBasicMaterial({ color:new THREE.Color(o.luz || '#ffd9a0'), toneMapped:false }));
    tira.rotation.x = -Math.PI/2; tira.position.set(0, y + hPelda - 2.3*U, z + dPelda - 3*U); G.add(tira);
  }
  const HB = 92*U;
  for(let i=0;i<nPelda;i++){
    const y = i*hPelda, z = i*dPelda + dPelda/2;
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.3*U,0.3*U,HB,6), acero);
    cable.position.set(sg*(W/2 - 1*U), y + hPelda + HB/2, z); G.add(cable);
  }
  const pasamanos = new THREE.Mesh(new THREE.BoxGeometry(5*U,3*U, nPelda*dPelda*1.02), acero);
  pasamanos.position.set(sg*(W/2-1*U), (nPelda-1)/2*hPelda + hPelda + HB, (nPelda-1)*dPelda/2 + dPelda/2);
  pasamanos.rotation.x = -Math.atan(hPelda/dPelda); G.add(pasamanos);
  return G;
}

/* mesa de centro redonda, para salones sin sofá con mesa auxiliar cuadrada */
function addMesaCentro(g, U, o){
  const x=(o.xCm||0)*U, z=(o.zCm||60)*U, R=(o.rCm||34)*U;
  const mat = o.piedra ? liso(o.color || '#cfc9bf', 0.45) : pbrMat('oak_veneer_01', 0.14, { color:o.color || '#c8ab82', roughness:0.5, env:0.45 });
  const top = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 3.4*U, 32), mat); top.position.set(x, 34*U, z); g.add(top);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R*0.16, R*0.22, 32.3*U, 20), mat); base.position.set(x, 16*U, z); g.add(base);
  addContactShadow(g, U, o.rCm*2.3||78, o.rCm*2.3||78, x, z, 0.6);
}
/* ── COCINA: fila de muebles bajos sin tiradores, encimera de roble y columna alta a un lado.
   Nada de muebles altos sobre la encimera: ahí es justo donde van los cuadros. ── */
function addCocinaRun(g, U, o){
  const x0 = (o.xCm||0)*U, W = (o.wCm||300)*U, D = 62*U;
  const ALTO = 88*U, ENC = 4*U;                       // carcasa 88 + encimera 4 = 92 de alto
  /* colores parametrizados: la misma cocina sale en tres versiones cambiando cuatro hex */
  const frente = o.frente || '#e4dfd6', frente2 = o.frente2 || '#d6d0c5', zocalo = o.zocalo || '#a9a298';
  const roble = o.encimera === 'piedra'
    ? liso('#d9d5cd', 0.5)
    : pbrMat('oak_veneer_01', 0.10, { color:o.encimeraHex || '#e7dbc6', roughness:0.5, env:0.5 });
  const G = new THREE.Group(); G.position.set(x0, 0, 0); g.add(G);

  // zócalo retranqueado 5 cm: el mueble parece que flota, que es lo que hace moderna una cocina
  const zoc = shadedBox(W, 10*U, D - 10*U, zocalo); zoc.position.set(0, 5*U, 5*U + (D - 10*U)/2); G.add(zoc);
  // carcasa
  const caja = shadedBox(W, ALTO - 10*U, D, frente2); caja.position.set(0, 10*U + (ALTO - 10*U)/2, D/2); G.add(caja);
  // frentes: un cajonero de 3 a la izquierda y dos puertas grandes, con junta de 2 cm entre ellos
  const fz = D + 0.6*U, y0 = 10*U, fh = ALTO - 10*U;
  const modulo = W/3;
  [0, 1, 2].forEach(i => {
    const cx = -W/2 + modulo*(i + 0.5);
    if(i === 0){
      [0, 1, 2].forEach(k => {                         // tres cajones
        const h = (fh - 4*U)/3;
        const fr = softBox(modulo - 2*U, h - 1.2*U, 1.8*U, 0.5*U, shadedMat(frente, 1.0));
        fr.position.set(cx, y0 + 2*U + h*(k + 0.5) - 0.6*U, fz); G.add(fr);
        // la junta de arriba es la que hace de tirador (sin herrajes a la vista)
        const gap = new THREE.Mesh(new THREE.PlaneGeometry(modulo - 2*U, 1.2*U), shadedMat('#8f887e', 1));
        gap.position.set(cx, y0 + 2*U + h*(k + 1) - 0.6*U, fz + 1*U); G.add(gap);
      });
    } else {
      const fr = softBox(modulo - 2*U, fh - 4*U, 1.8*U, 0.5*U, shadedMat(frente, i === 1 ? 1.0 : 0.985));
      fr.position.set(cx, y0 + 2*U + (fh - 4*U)/2, fz); G.add(fr);
      const gap = new THREE.Mesh(new THREE.PlaneGeometry(modulo - 2*U, 1.4*U), shadedMat('#8f887e', 1));
      gap.position.set(cx, y0 + fh - 2.4*U, fz + 1*U); G.add(gap);
    }
  });
  // encimera de roble, con un vuelo de 2 cm sobre los frentes
  const enc = softBox(W + 3*U, ENC, D + 3*U, 0.8*U, roble);
  enc.position.set(0, ALTO + ENC/2, (D + 3*U)/2); G.add(enc);
  addContactShadow(g, U, (o.wCm||300) + 40, 90, x0, D/2 + 6*U, 0.85);
  return { topY: ALTO + ENC, x0: o.xCm||0, D:62 };
}

/* Fregadero SOBRE encimera (tipo cubeta). Hundido no se veía: la cámara mira casi a ras de
   la encimera y una pila plana queda de canto. Con la cubeta por encima, su frente cae dentro
   del encuadre y se lee al momento, que es lo que se busca. */
function addFregadero(g, U, xCm, topYCm){
  const x = xCm*U, y = topYCm*U, W = 54*U, H = 13*U, D = 38*U, z = 30*U;
  const cuerpo = shadedBox(W, H, D, '#dcd8d0', 1.2*U);
  cuerpo.position.set(x, y + H/2, z); g.add(cuerpo);
  const interior = new THREE.Mesh(new THREE.PlaneGeometry(W - 5*U, D - 5*U), shadedMat('#9a968f', 1));
  interior.rotation.x = -Math.PI/2; interior.position.set(x, y + H - 1.6*U, z); g.add(interior);
  const desague = new THREE.Mesh(new THREE.CircleGeometry(2.6*U, 18), shadedMat('#6d6a66', 1));
  desague.rotation.x = -Math.PI/2; desague.position.set(x, y + H - 1.4*U, z); g.add(desague);
  // línea de sombra bajo la cubeta: la despega de la encimera
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(W + 1*U, 1.4*U), shadedMat('#b9b4ab', 1));
  sombra.position.set(x, y + 0.7*U, z + D/2 + 0.4*U); g.add(sombra);
}

/* Grifo de cuello de cisne: columna, arco completo hacia delante y caño que cae sobre la pila.
   El anterior era medio toro en el plano equivocado y se leía como un signo de interrogación. */
function addGrifo(g, U, xCm, zCm, topYCm){
  const metal = new THREE.MeshStandardMaterial({ color:0x2f3034, roughness:0.28, metalness:0.9, envMapIntensity:0.6 });
  const x = xCm*U, z = zCm*U, y = topYCm*U;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3*U, 3.6*U, 2*U, 20), metal);
  base.position.set(x, y + 1*U, z); g.add(base);
  /* 15-oct: antes eran tres piezas sueltas (cuerpo, arco y caño separados en el aire). Ahora un solo
     tubo: sube desde la base, se curva hacia la pila y baja en el caño. */
  const camino = new THREE.CurvePath();
  camino.add(new THREE.LineCurve3(new THREE.Vector3(x, y + 1.5*U, z), new THREE.Vector3(x, y + 24*U, z)));
  camino.add(new THREE.CubicBezierCurve3(new THREE.Vector3(x, y + 24*U, z), new THREE.Vector3(x, y + 35*U, z),
    new THREE.Vector3(x, y + 35*U, z + 16*U), new THREE.Vector3(x, y + 25*U, z + 16*U)));
  camino.add(new THREE.LineCurve3(new THREE.Vector3(x, y + 25*U, z + 16*U), new THREE.Vector3(x, y + 21*U, z + 16*U)));
  const cuello = new THREE.Mesh(new THREE.TubeGeometry(camino, 64, 1.8*U, 16, false), metal); g.add(cuello);
  const boca = new THREE.Mesh(new THREE.CylinderGeometry(1.95*U, 1.95*U, 1.2*U, 16), metal);
  boca.position.set(x, y + 21*U, z + 16*U); g.add(boca);
  const mando = new THREE.Mesh(new THREE.CylinderGeometry(1.1*U, 1.1*U, 8*U, 12), metal);
  mando.rotation.z = -1.05; mando.position.set(x - 4.6*U, y + 11*U, z); g.add(mando);        // sale del cuerpo, sin hueco
}

/* ── CONSOLA DE RECIBIDOR: 110×28, tablero fino de roble y patas de metal negro.
   Poco fondo a propósito: en un pasillo no cabe otra cosa. ── */
function addConsola(g, U, o){
  const x0 = (o.xCm||0)*U, z0 = (o.zCm||6)*U, W = 110*U, D = 28*U, H = 78*U;
  const roble = pbrMat('oak_veneer_01', 0.13, { color:'#e8dcc8', roughness:0.55, env:0.5 });
  const metal = new THREE.MeshStandardMaterial({ color:0x2f2f33, roughness:0.45, metalness:0.8, envMapIntensity:0.5 });
  const G = new THREE.Group(); G.position.set(x0, 0, z0); g.add(G);
  const top = softBox(W, 3*U, D, 1*U, roble); top.position.set(0, H - 1.5*U, D/2); G.add(top);
  const balda = softBox(W - 8*U, 2.2*U, D - 6*U, 0.8*U, roble); balda.position.set(0, 22*U, D/2); G.add(balda);   // de pata a pata (antes flotaba entre ellas)
  [-1, 1].forEach(sx => [4*U, D - 4*U].forEach(dz => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(2.2*U, H - 3*U, 2.2*U), metal);
    leg.position.set(sx*(W/2 - 4*U), (H - 3*U)/2, dz); G.add(leg);
  }));
  addContactShadow(g, U, 140, 55, x0, z0 + D/2, 0.8);
  return G;
}

/* ── COCINA MODERNA (tres paletas sobre la misma geometría) ── */
function buildCocina(g, U, pal){
  pal = pal || {};
  buildShell(g, U, pal.shell || { wall1:'#eeeae3', wall2:'#e0dbd2', floor1:'#c9c2b6', floor2:'#b6afa2', side:'#ece8e1', skirt:'#e0dbd2' });
  addCocinaRun(g, U, Object.assign({ xCm:0, wCm:300 }, pal.run || {}));
  addFregadero(g, U, 62, 92);
  addGrifo(g, U, 62, 12, 92);

  // columna alta a la izquierda, justo en el borde del encuadre: rompe la horizontal
  // de la encimera y le da fondo a la cocina sin acercarse a los cuadros
  const colX = -188*U;
  const col = shadedBox(62*U, 208*U, 64*U, (pal.run && pal.run.frente) || '#e4dfd6'); col.position.set(colX, 104*U, 32*U); g.add(col);
  const colZ = shadedBox(62*U, 10*U, 54*U, (pal.run && pal.run.zocalo) || '#a9a298'); colZ.position.set(colX, 5*U, 5*U + 27*U); g.add(colZ);
  [88, 120].forEach(y => {                                   // las dos juntas horizontales de la columna
    const j = new THREE.Mesh(new THREE.PlaneGeometry(58*U, 1.4*U), shadedMat('#8f887e', 1));
    j.position.set(colX, y*U, 64.6*U); g.add(j);
  });
  addContactShadow(g, U, 100, 90, colX, 32*U, 0.8);

  addModel(g, 'modelos/ceramic_vase_01.glb',  { xCm:-116, zCm:26, yCm:92 });
  addModel(g, 'modelos/potted_plant_04.glb',  { xCm:-74,  zCm:24, yCm:92 });
  addModel(g, 'modelos/potted_plant_02.glb',  { xCm:196,  zCm:50 });
  addContactShadow(g, U, 88, 82, 196*U, 50*U, 0.6);
}

/* ── PASILLO ── */
function buildPasillo(g, U){
  buildShell(g, U, { wall1:'#efebe4', wall2:'#e1dcd3', floor1:'#c4bcaf', floor2:'#b0a89a', side:'#ebe7e0', skirt:'#e1dcd3' });
  // Las dos paredes que estrechan la vista: es lo que se lee como pasillo. Van a ±174 porque
  // el visor encuadra unos 380 cm de ancho; más afuera no se ven y la escena se queda en
  // "una pared con una consola". La composición más ancha (195 cm) sigue cabiendo de sobra.
  addReturnWall(g, U, { xCm:-186, depthCm:320, faceIn:1,  wall:'#e7e2da', skirt:'#dad4ca' });
  addReturnWall(g, U, { xCm:186,  depthCm:320, faceIn:-1, wall:'#efebe4', skirt:'#e1dcd3' });
  addDoorway(g, U, { xCm:134 });                       // la puerta del fondo, al lado de los cuadros
  addRunner(g, U, { wCm:130, dCm:300, zCm:8, hex:'#b2a591' });
  addConsola(g, U, { xCm:-76, zCm:6 });
  addModel(g, 'modelos/ceramic_vase_01.glb', { xCm:-104, zCm:20, yCm:78 });
  addModel(g, 'modelos/binder_notebook.glb', { xCm:-50,  zCm:19, yCm:78, rotY:0.35 });
  addModel(g, 'modelos/potted_plant_02.glb', { xCm:-168, zCm:26 });
  addContactShadow(g, U, 88, 82, -168*U, 26*U, 0.6);
}

/* ── RINCÓN DE CASA: la esquina de verdad (dos paredes que se encuentran) con la planta al lado ── */
function buildRincon(g, U){
  buildShell(g, U, { wall1:'#ece7df', wall2:'#ded8ce', floor1:'#c7bdb0', floor2:'#b3a99b', side:'#eae5de', skirt:'#ded8cf' });
  // La esquina de verdad: un trozo de pared perpendicular que entra hacia la cámara. A 172 cm
  // entra en el encuadre (unos 380 cm de ancho) sin comerse la composición, que va centrada.
  addReturnWall(g, U, { xCm:152, depthCm:165, faceIn:-1, wall:'#dcd6cb', skirt:'#cfc8bc' });
  addRug(g, U, 250, 170, 115, '#d4cabb');
  addModel(g, 'modelos/potted_plant_02.glb',     { xCm:112, zCm:40 });      // la planta, metida en la esquina
  addContactShadow(g, U, 92, 86, 112*U, 40*U, 0.68);
  addModel(g, 'modelos/modern_arm_chair_01.glb', { xCm:-186, zCm:52, rotY:-0.3 });
  addContactShadow(g, U, 120, 115, -186*U, 52*U, 0.55);
  addModel(g, 'modelos/side_table_01.glb',       { xCm:-104, zCm:8, back:true });
  addContactShadow(g, U, 80, 70, -104*U, 32*U, 0.7);
  addModel(g, 'modelos/ceramic_vase_01.glb',     { xCm:-104, zCm:28, yCm:55 });
  // lámpara de pie, al filo del encuadre por la izquierda
  const lx = -176*U, lz = 150*U, brass = '#9d8b74';
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.3*U, 1.3*U, 148*U, 10), shadedMat(brass, 0.95));
  pole.position.set(lx, 74*U, lz); g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(13*U, 13*U, 2.4*U, 20), shadedMat(brass, 0.9));
  foot.position.set(lx, 1.2*U, lz); g.add(foot);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(17*U, 22*U, 26*U, 24, 1, true),
    new THREE.MeshBasicMaterial({ color:new THREE.Color('#f0e8da'), side:THREE.DoubleSide, toneMapped:false }));
  shade.position.set(lx, 153*U, lz); g.add(shade);
  const shadeTop = new THREE.Mesh(new THREE.CircleGeometry(17*U, 24), shadedMat('#f6f0e6', 1.1));
  shadeTop.rotation.x = -Math.PI/2; shadeTop.position.set(lx, 166*U, lz); g.add(shadeTop);
  addContactShadow(g, U, 66, 58, lx, lz, 0.5);
}

/* ══════════ MATERIALES DEL KIT ══════════
   Tres telas y dos maderas, más colores planos. Los muebles descargados se repintan con
   esto: es lo que les quita el aire de videojuego sin tener que modelarlos nosotros. */
const MAT_KIT = {
  'tela-crema':  () => pbrMat('curly_teddy_natural', 0.5,  { color:'#f2e9da', roughness:1, env:0.28 }),
  'tela-arena':  () => pbrMat('curly_teddy_natural', 0.5,  { color:'#ddd1bd', roughness:1, env:0.26 }),
  'tela-gris':   () => pbrMat('curly_teddy_natural', 0.5,  { color:'#c8c4bd', roughness:1, env:0.26 }),
  'roble':       () => pbrMat('oak_veneer_01', 0.35, { color:'#e6d9c2', roughness:0.55, env:0.45 }),
  'roble-medio': () => pbrMat('oak_veneer_01', 0.35, { color:'#c8ab82', roughness:0.6,  env:0.4 }),
  'blanco':      () => liso('#eae5dd', 0.85),
  'hueso':       () => liso('#ded6c9', 0.85),
  'piedra':      () => liso('#c6c1b8', 0.8),
  'verde':       () => liso('#93a08d', 0.8),
  'negro':       () => liso('#3a3a3e', 0.55),
  'rojo':        () => liso('#b03b3b', 0.6),
  'grafito':     () => liso('#54565c', 0.6),
  'metal':       () => new THREE.MeshStandardMaterial({ color:0x35353a, roughness:0.4, metalness:0.85, envMapIntensity:0.55 }),
};
function liso(hex, rough){ return calmMat(new THREE.MeshStandardMaterial({ color:new THREE.Color(hex), roughness:rough, metalness:0, envMapIntensity:0.4 })); }
const _matCache = {};
function matKit(n){
  if(!_matCache[n]) _matCache[n] = (MAT_KIT[n] || MAT_KIT['hueso'])();
  return _matCache[n];
}

/* ══════════ ESCENAS POR DATOS ══════════
   `shell` = colores de la caja (pared, suelo, laterales, rodapié).
   `muebles` = lista de piezas: m (fichero de modelos/pp/), xCm, zCm, wCm (ancho real),
   rotY, yCm, back, mat. Con esto una habitación nueva son seis líneas. */
const KIT = 'modelos/pp/';
function buildEscena(g, U, def){
  buildShell(g, U, def.shell);
  if(def.esquina) addReturnWall(g, U, Object.assign({ faceIn:-1, wall:'#e2dacd', skirt:'#d4ccbf' }, def.esquina));   // la pared que cierra el rincón
  if(def.panel) addPanelMadera(g, U, def.panel);
  if(def.alfombra) addRug(g, U, def.alfombra[0], def.alfombra[1], def.alfombra[2], def.alfombra[3]);
  (def.muebles || []).forEach(p => {
    addModel(g, KIT + p.m + '.glb', {
      xCm:p.xCm, zCm:p.zCm, yCm:p.yCm, rotY:p.rotY, back:p.back, widthCm:p.wCm, mat:p.mat
    });
    if(p.sombra !== false && !p.yCm) addContactShadow(g, U, (p.wCm || 60)*1.25, (p.dCm || p.wCm || 60)*1.1,
      (p.xCm || 0)*U, ((p.zCm || 0) + (p.dCm || p.wCm || 60)*0.45)*U, 0.62);
  });
}

/* ── NEVERA RETRO + COCINA ─────────────────────────────────────────────────
   Todo en cm desde la pared (z=0) y el suelo (y=0); la nevera centrada en x=0, que es donde van los imanes. */
const NEVERA_FRONT = 69.7;   // cara de la puerta, en cm desde la pared (cuerpo 2–66 + puerta 3,7)
function canvasTex(w, h, draw, rx, ry){
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = MAXANI;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); return t;
}
// azulejo metro 15 × 7,5 cm al tresbolillo; una tesela = 60 × 60 cm
function subwayTex(c1, grout, wCm, hCm){
  return canvasTex(512, 512, (x, W, H) => {
    x.fillStyle = grout; x.fillRect(0, 0, W, H);
    const tw = W / 4, th = H / 8, gp = 4;
    for(let r = 0; r < 8; r++) for(let k = -1; k < 5; k++){
      const ox = (r % 2) * tw / 2, x0 = k * tw + ox + gp / 2, y0 = r * th + gp / 2;
      const gr = x.createLinearGradient(0, y0, 0, y0 + th); gr.addColorStop(0, c1); gr.addColorStop(1, shade(c1, 0.94));
      x.fillStyle = gr; x.beginPath(); x.roundRect ? x.roundRect(x0, y0, tw - gp, th - gp, 5) : x.rect(x0, y0, tw - gp, th - gp); x.fill();
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(x0 + 6, y0 + 4, tw - gp - 12, 3);
    }
  }, wCm / 60, hCm / 60);
}
function shade(hex, k){ const c = new THREE.Color(hex).multiplyScalar(k); return '#' + c.getHexString(); }
// suelo: damero de 30 cm, baldosa de barro 30 cm o tablas de roble
function floorTex(a, b, kind, wCm, dCm){
  return canvasTex(512, 512, (x, W, H) => {
    if(kind === 'roble'){
      for(let r = 0; r < 8; r++){ const off = (r * 157) % W;
        for(let k = -1; k < 3; k++){ x.fillStyle = (r + k) % 2 ? a : b; x.fillRect(k * W / 2 + off % (W / 2), r * H / 8, W / 2, H / 8); }
        x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, r * H / 8, W, 2); }
      return;
    }
    const n = 2, s = W / n;
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
      x.fillStyle = kind === 'barro' ? ((i + j) % 2 ? a : b) : ((i + j) % 2 ? b : a);
      x.fillRect(i * s, j * s, s, s);
      if(kind === 'barro'){ x.strokeStyle = 'rgba(80,40,20,.35)'; x.lineWidth = 6; x.strokeRect(i * s, j * s, s, s); }
    }
  }, wCm / 60, dCm / 60);
}
function addNeveraRetro(g, U, o){
  const W = 60, x0 = (o.xCm || 0);
  /* el visor ilumina fuerte (ambiente 1,85 + focos, pensado para el aluminio): con el color tal cual la nevera salía
     casi blanca. El color base va oscurecido (0,58) para que en pantalla salga el tono de verdad, y la laca con poco
     reflejo de entorno y algo de rugosidad: brilla como un esmalte, sin la mancha blanca del foco. */
  const esmalte = new THREE.MeshPhysicalMaterial({ color:new THREE.Color(o.color).multiplyScalar(0.58), roughness:0.5, metalness:0, clearcoat:0.8, clearcoatRoughness:0.28, envMapIntensity:0.35, specularIntensity:0.35 });
  const cromo = new THREE.MeshStandardMaterial({ color:0xe2e4e6, metalness:1, roughness:0.14, envMapIntensity:1.25 });
  const goma = new THREE.MeshStandardMaterial({ color:0x2a2a2a, roughness:0.8, metalness:0 });
  const B = (w, h, d, r, mat, x, y, z) => { const m = softBox(w*U, h*U, d*U, r*U, mat); m.position.set(x*U, y*U, z*U); g.add(m); return m; };
  // cuerpo (6–154 cm de alto, 2–66 cm de fondo) y puerta delante, algo más pequeña para que se lea la junta
  B(W, 148, 56, 8, esmalte, x0, 6 + 74, 34);
  B(W - 2.2, 139, 3, 7, esmalte, x0, 6 + 4.5 + 69.5, 66 + 1.86);
  // junta de goma entre cuerpo y puerta
  B(W - 3, 137, 0.8, 6.5, goma, x0, 80, 65.9);
  // tirador cromado en el canto izquierdo de la puerta (no tapa los imanes)
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(1.1*U, 1.1*U, 44*U, 16), cromo); bar.position.set((x0 - W/2 - 2.4)*U, 118*U, 64*U); g.add(bar);
  [-1, 1].forEach(sy => {
    const brazo = softBox(4.2*U, 2.2*U, 2.6*U, 1*U, cromo); brazo.position.set((x0 - W/2 - 0.6)*U, (118 + sy*19)*U, 64*U); g.add(brazo);
    const tapa = new THREE.Mesh(new THREE.SphereGeometry(1.25*U, 14, 10), cromo); tapa.position.set((x0 - W/2 - 2.4)*U, (118 + sy*22)*U, 64*U); g.add(tapa);
  });
  // bisagras cromadas a la derecha y placa cromada arriba (sin marca)
  [148, 14].forEach(y => B(2.4, 6, 3.5, 1, cromo, x0 + W/2 - 0.4, y, 66));
  B(14, 2.4, 0.7, 0.9, cromo, x0, 147.5, NEVERA_FRONT + 0.2);
  // zócalo con rejilla y patas cromadas
  B(W - 6, 5, 2, 1, goma, x0, 9, 63);
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(1.6*U, 2.1*U, 6*U, 14), cromo); pata.position.set((x0 + sx*(W/2 - 6))*U, 3*U, (34 + sz*24)*U); g.add(pata);
  }));
  addContactShadow(g, U, 78, 84, x0*U, 36*U, 0.7);
}
function buildCocinaNevera(g, U, o){
  buildShell(g, U, { wall1:o.wall1, wall2:o.wall2, floor1:'#888', floor2:'#777', side:o.wall1, skirt:o.wall2 });
  const BW = ROOM_BOX.w, BD = ROOM_BOX.d;
  // suelo propio encima del de la caja
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(BW*U, BD*U), new THREE.MeshBasicMaterial({ map: floorTex(o.floor[0], o.floor[1], o.floor[2], BW, BD), toneMapped:false }));
  fl.rotation.x = -Math.PI/2; fl.position.set(0, 0.2*U, BD/2*U); g.add(fl);
  // pared alicatada hasta 150 cm con un remate de madera
  const TH = 150;
  const tiles = new THREE.Mesh(new THREE.PlaneGeometry(BW*U, TH*U), new THREE.MeshBasicMaterial({ map: subwayTex(o.tiles[0], o.tiles[1], BW, TH), toneMapped:false }));
  tiles.position.set(0, TH/2*U, 0.15*U); g.add(tiles);
  const madera = pbrMat('oak_veneer_01', 0.3, { color:'#c99d6a', roughness:0.55, env:0.4 });
  const remate = softBox(BW*U, 2.2*U, 2.4*U, 0.6*U, madera); remate.position.set(0, (TH + 1.1)*U, 1.2*U); g.add(remate);
  // muebles bajos a la derecha de la nevera, con encimera y cosas encima
  const mx = 34 + 80, mW = 160;
  const frente = new THREE.MeshPhysicalMaterial({ color:new THREE.Color(o.mueble).multiplyScalar(0.7), roughness:0.45, metalness:0, clearcoat:0.35, clearcoatRoughness:0.4, envMapIntensity:0.45 });
  const mueble = softBox(mW*U, 80*U, 58*U, 1*U, frente); mueble.position.set(mx*U, 48*U, 31*U); g.add(mueble);
  const zocalo = softBox((mW - 4)*U, 8*U, 54*U, 0.5*U, shadedMat('#222222', 1)); zocalo.position.set(mx*U, 4*U, 29*U); g.add(zocalo);
  const tir = new THREE.MeshStandardMaterial({ color:0xc9a46a, metalness:1, roughness:0.25, envMapIntensity:1 });
  for(let k = 0; k < 4; k++){
    const xd = mx - mW/2 + mW*(k + 0.5)/4;
    if(k) { const j = new THREE.Mesh(new THREE.PlaneGeometry(0.5*U, 76*U), shadedMat('#000000', 1)); j.material.transparent = true; j.material.opacity = 0.35; j.position.set((mx - mW/2 + mW*k/4)*U, 48*U, 63.6*U); g.add(j); }
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.6*U, 0.6*U, 12*U, 10), tir); t.rotation.z = Math.PI/2; t.position.set(xd*U, 80*U, 64.6*U); g.add(t);
  }
  const top = softBox((mW + 4)*U, 4*U, 64*U, 0.6*U, o.encimera === '#c79a63' ? madera : new THREE.MeshPhysicalMaterial({ color:new THREE.Color(o.encimera), roughness:0.3, clearcoat:0.6, envMapIntensity:0.5 }));
  top.position.set(mx*U, 90*U, 32*U); g.add(top);
  // frutero con limones y un bote
  const cuenco = new THREE.Mesh(new THREE.SphereGeometry(11*U, 24, 12, 0, Math.PI*2, Math.PI/2, Math.PI/2), new THREE.MeshStandardMaterial({ color:0xf3efe6, roughness:0.4, side:THREE.DoubleSide }));
  cuenco.position.set((mx + 30)*U, 103*U, 34*U); g.add(cuenco);
  const limon = new THREE.MeshStandardMaterial({ color:0xf3cd38, roughness:0.55 });
  [[-4, 0], [4, 1], [0, -4], [1, 4]].forEach(([dx, dz], i) => { const l = new THREE.Mesh(new THREE.SphereGeometry(4*U, 16, 12), limon); l.scale.set(1, 0.85, 0.85); l.position.set((mx + 30 + dx)*U, (95.5 + (i > 1 ? 3 : 0))*U, (34 + dz)*U); g.add(l); });
  const bote = new THREE.Mesh(new THREE.CylinderGeometry(5*U, 5*U, 18*U, 20), new THREE.MeshPhysicalMaterial({ color:0xffffff, roughness:0.05, transmission:0.6, transparent:true, opacity:0.55 }));
  bote.position.set((mx - 40)*U, 101*U, 22*U); g.add(bote);
  const tapaB = new THREE.Mesh(new THREE.CylinderGeometry(5.3*U, 5.3*U, 2.4*U, 20), madera); tapaB.position.set((mx - 40)*U, 111*U, 22*U); g.add(tapaB);
  addContactShadow(g, U, mW*1.05, 70, mx*U, 31*U, 0.5);
  // planta a la izquierda
  addNeveraRetro(g, U, { color:o.fridge, xCm:0 });
}

const SCENES = [

  /* ── SALONES ───────────────────────────────────────────────────────────── */
  { id:'salon-moderno-gris', caja:{ w:640, h:296, d:430 }, es:'Salón gris', en:'Grey living room', des:'sofá grafito y mesa de centro', den:'graphite sofa and coffee table',
    furnCm:88, gapCm:24, viewCm:400, build:(g,U) => {
      buildShell(g, U, { wall1:'#e6e6e6', wall2:'#d7d7d7', floor1:'#a9a49c', floor2:'#918c84', side:'#e3e3e3', skirt:'#d7d7d7' });
      addRug(g, U, 320, 200, 150, '#8f8c86');
      addSofaModerno(g, U, { xCm:0, zCm:8, c1:'#5c5d61', c2:'#46474b', c3:'#525359' });
      addMesaCentro(g, U, { xCm:0, zCm:150, rCm:32, piedra:true, color:'#3a3a3c' });
      addModel(g, KIT + 'lamp_round_floor_kenney.glb', { xCm:200, zCm:36, wCm:42, dCm:42, mat:'negro' });
      addContactShadow(g, U, 52, 52, 200*U, 36*U, 0.62);
      addModel(g, KIT + 'houseplant_quaternius.glb', { xCm:-206, zCm:34, wCm:60, dCm:60, mat:'verde' });
      addContactShadow(g, U, 75, 75, -206*U, 34*U, 0.6);
    } },
  { id:'salon-butacas', caja:{ w:600, h:284, d:410 }, es:'Salón con butacas', en:'Armchair living room', des:'dos butacas y mesa redonda', den:'two armchairs and round table',
    furnCm:78, gapCm:26, viewCm:390, build:(g,U) => {
      buildShell(g, U, { wall1:'#eee8dd', wall2:'#e0d9cb', floor1:'#c9beac', floor2:'#b5a998', side:'#ebe5da', skirt:'#e0d9cb' });
      addRug(g, U, 300, 195, 148, '#cabb9d');
      addButacaModerna(g, U, { xCm:-118, zCm:78, rotY:0.5, c1:'#e3d3b6', c2:'#cbb996', c3:'#d8c6a5' });
      addButacaModerna(g, U, { xCm:118,  zCm:78, rotY:-0.5, c1:'#e3d3b6', c2:'#cbb996', c3:'#d8c6a5' });
      addMesaCentro(g, U, { xCm:0, zCm:88, rCm:36 });
      addModel(g, KIT + 'houseplant_quaternius.glb', { xCm:-206, zCm:26, wCm:58, dCm:58, mat:'verde' });
      addContactShadow(g, U, 72, 72, -206*U, 26*U, 0.6);
    } },
  /* ── ESCRITORIOS ───────────────────────────────────────────────────────── */
  { id:'estudio', caja:{ w:520, h:266, d:350 }, es:'Estudio', en:'Study', des:'mesa de roble y estantería', den:'oak desk and shelves',
    furnCm:74, gapCm:30, viewCm:380, build:(g,U) => buildEscena(g, U, {
      shell:{ wall1:'#efeae2', wall2:'#e1dbd1', floor1:'#ccc3b6', floor2:'#b8afa1', side:'#ece7e0', skirt:'#e0dbd2' },
      muebles:[
        { m:'desk_kenney',              xCm:-20,  zCm:8,  wCm:150, dCm:80, back:true, rotY:Math.PI, mat:'roble' },
        { m:'desk_chair_kenney',        xCm:-34,  zCm:112, wCm:46, dCm:44, rotY:Math.PI - 0.2, mat:'tela-gris' },
        { m:'bookcase_with_books_quaternius', xCm:176, zCm:10, wCm:90, dCm:32, back:true, mat:'roble-medio' },
        { m:'lamp_round_table_kenney',  xCm:-84,  zCm:30, wCm:26,  dCm:26, yCm:78, mat:'hueso' },
      ]}) },
  { id:'despacho-gris', caja:{ w:560, h:278, d:380 }, es:'Despacho', en:'Home office', des:'mesa en L y silla', den:'L-desk and chair',
    furnCm:74, gapCm:30, viewCm:400, build:(g,U) => buildEscena(g, U, {
      shell:{ wall1:'#eceded', wall2:'#dee0e0', floor1:'#c5c3bd', floor2:'#b1afa8', side:'#eaebeb', skirt:'#dee0e0' },
      muebles:[
        { m:'desk_creativetrio',        xCm:-30,  zCm:8,  wCm:160, dCm:80, back:true, rotY:Math.PI, mat:'hueso' },
        { m:'desk_chair_kenney',        xCm:-42,  zCm:114, wCm:46, dCm:44, rotY:Math.PI - 0.24, mat:'negro' },
        { m:'bookcase_with_books_quaternius', xCm:176, zCm:10, wCm:84, dCm:30, back:true, mat:'hueso' },
        { m:'houseplant_quaternius',    xCm:-196, zCm:30, wCm:56,  dCm:56, mat:'verde' },
      ]}) },

  { id:'despacho-gamer', caja:{ w:560, h:288, d:360 }, es:'Escritorio gamer', en:'Gaming desk', des:'mesa regulable, monitor y altavoces', den:'standing desk, monitor and speakers',
    furnCm:120, gapCm:20, viewCm:400, build:(g,U) => buildEscena(g, U, {
      shell:{ wall1:'#e6e7ea', wall2:'#d4d6db', floor1:'#b9b7b2', floor2:'#a4a29d', side:'#e2e3e6', skirt:'#d4d6db' },
      alfombra:[280, 180, 120, '#aeb0b4'],
      muebles:[
        /* OJO licencia: la mesa regulable es CC-BY 3.0 (jeff cobesign, poly.pizza). Si va a producción,
           crédito visible en Nosotros o en el pie. Alternativa CC0 lista: 'desk_creativetrio'. */
        { m:'adjustable_desk_jeffcobesign_CCBY', xCm:0, zCm:2, wCm:160, dCm:78, back:true, rotY:Math.PI, mat:'grafito' },
        { m:'monitor_creativetrio',     xCm:0,    zCm:26, wCm:70,  dCm:14, yCm:74, mat:'negro' },
        { m:'speaker_ipoly3d',          xCm:-54,  zCm:28, wCm:13,  dCm:11, yCm:74, mat:'grafito' },
        { m:'speaker_ipoly3d',          xCm:54,   zCm:28, wCm:13,  dCm:11, yCm:74, mat:'grafito' },
        { m:'open_book_quaternius',     xCm:-2,   zCm:56, wCm:44,  dCm:16, yCm:74, mat:'grafito' },
        { m:'office_chair_quaternius',  xCm:-14,  zCm:152, wCm:60, dCm:66, rotY:Math.PI - 0.18, mat:'rojo' },
        { m:'bookcase_with_books_quaternius', xCm:184, zCm:10, wCm:84, dCm:30, back:true, mat:'grafito' },
        { m:'light_floor_quaternius',   xCm:-190, zCm:26, wCm:34,  dCm:34, mat:'negro' },
      ]}) },

  /* ── HABITACIONES ──────────────────────────────────────────────────────── */
  { id:'dormitorio-doble', caja:{ w:680, h:296, d:500 }, es:'Dormitorio', en:'Double bedroom', des:'cama de 150, panel de madera', den:'double bed, wood panel',
    furnCm:112, gapCm:24, viewCm:400, build:(g,U) => buildEscena(g, U, {
      shell:{ wall1:'#ece5da', wall2:'#ded5c7', floor1:'#c6bbab', floor2:'#b2a796', side:'#eae3d8', skirt:'#ded5c8' },
      panel:{ wCm:340, altoCm:112, color:'#ddc9a8' },
      muebles:[
        { m:'bed_double_kenney',        xCm:0,    zCm:4,  wCm:200, dCm:210, back:true, alinear:false, rotY:Math.PI, mat:'tela-crema' },
        { m:'cabinet_bed_drawer_kenney', xCm:-136, zCm:8, wCm:46,  dCm:40, back:true, mat:'roble' },
        { m:'cabinet_bed_drawer_kenney', xCm:136,  zCm:8, wCm:46,  dCm:40, back:true, mat:'roble' },
        { m:'lamp_round_table_kenney',  xCm:-136, zCm:22, wCm:24,  dCm:24, yCm:46, mat:'hueso' },
        { m:'lamp_round_table_kenney',  xCm:136,  zCm:22, wCm:24,  dCm:24, yCm:46, mat:'hueso' },
      ]}) },
  { id:'dormitorio-juvenil', caja:{ w:500, h:262, d:360 }, es:'Habitación juvenil', en:'Small bedroom', des:'cama individual y estante', den:'single bed and shelf',
    furnCm:120, gapCm:20, viewCm:360, build:(g,U) => { buildEscena(g, U, {
      shell:{ wall1:'#e6e9e2', wall2:'#d6dbd1', floor1:'#c6bfb1', floor2:'#b2ab9c', side:'#e4e7e0', skirt:'#d6dbd1' },
      alfombra:[240, 170, 150, '#cfc7b8'],
      muebles:[
        { m:'night_stand_quaternius',   xCm:92,   zCm:8,  wCm:44,  dCm:40, back:true, mat:'roble' },
        { m:'small_plant_quaternius',   xCm:92,   zCm:20, wCm:24,  dCm:24, yCm:38.2, mat:'verde' },   // tapa de la mesita (medida)
      ]});
      /* 15-oct: la cama descargada era una losa plana con un bloque encima; ahora la misma cama que
         los otros dormitorios, en individual de 90×190, con cabecero de 108 cm (por eso furnCm 120) */
      addCamaModerna(g, U, { xCm:20, zCm:6, anchoCm:90, largoCm:190, color:'#c9c1ae', ropa:'#f4f1ea' });
    } },


  { id:'dormitorio-boutique', caja:{ w:640, h:294, d:460 }, es:'Dormitorio boutique', en:'Boutique bedroom', des:'cabecero acolchado terracota', den:'padded terracotta headboard',
    furnCm:112, gapCm:22, viewCm:400, build:(g,U) => {
      buildShell(g, U, { wall1:'#e9e2d8', wall2:'#dbd2c4', floor1:'#c2b6a4', floor2:'#ae9f8c', side:'#e6ded2', skirt:'#dbd2c4' });
      addRug(g, U, 300, 195, 170, '#c9b89a');
      addCamaModerna(g, U, { xCm:0, zCm:6, anchoCm:160, largoCm:200, color:'#a8583f', ropa:'#f2ece0' });
      addMesitaModerna(g, U, { xCm:-138, zCm:8, color:'#8a5c3a' });
      addMesitaModerna(g, U, { xCm:138,  zCm:8, color:'#8a5c3a' });
      addLamparaColgante(g, U, -138, 20, 168, '#f0e6d6');
      addLamparaColgante(g, U, 138,  20, 168, '#f0e6d6');
      addModel(g, KIT + 'small_plant_quaternius.glb', { xCm:196, zCm:56, wCm:26, dCm:26, yCm:0, mat:'verde' });
      addContactShadow(g, U, 40, 40, 196*U, 56*U, 0.55);
    } },
  { id:'dormitorio-nordico', caja:{ w:600, h:280, d:430 }, es:'Dormitorio nórdico', en:'Nordic bedroom', des:'lino claro y banco a los pies', den:'pale linen, bench at the foot',
    furnCm:106, gapCm:20, viewCm:380, build:(g,U) => {
      buildShell(g, U, { wall1:'#f1efe9', wall2:'#e5e2da', floor1:'#d3c9b8', floor2:'#bfb4a0', side:'#eeece5', skirt:'#e5e2da' });
      addCamaModerna(g, U, { xCm:0, zCm:6, anchoCm:150, largoCm:200, color:'#e4ddcd', ropa:'#faf8f2' });
      addMesitaModerna(g, U, { xCm:-130, zCm:8, color:'#e8dcc4', tex:'oak_veneer_01' });
      addMesitaModerna(g, U, { xCm:130,  zCm:8, color:'#e8dcc4', tex:'oak_veneer_01' });
      const bancoMat = pbrMat('oak_veneer_01', 0.16, { color:'#e0d3b6', roughness:0.55, env:0.45 });
      const banco = softBox(120*U, 15*U, 40*U, 2*U, bancoMat); banco.position.set(0, 30*U, 214*U); g.add(banco);
      [-1,1].forEach(sx => { const pata = softBox(3*U, 28*U, 3*U, 0.6*U, bancoMat); pata.position.set(sx*54*U, 14*U, 214*U); g.add(pata); });
      addContactShadow(g, U, 150, 60, 0, 214*U, 0.55);
      addModel(g, KIT + 'small_plant_quaternius.glb', { xCm:196, zCm:40, wCm:26, dCm:26, mat:'verde' });
      addContactShadow(g, U, 40, 40, 196*U, 40*U, 0.55);
    } },
  /* ── COCINAS ───────────────────────────────────────────────────────────── */
  { id:'dormitorio', caja:{ w:660, h:292, d:470 }, es:'Habitación', en:'Bedroom',     des:'cama con mesitas',       den:'bed and nightstands',  furnCm:105, gapCm:18, viewCm:300, build:buildDormitorio },
  { id:'salon-real', caja:{ w:640, h:286, d:420 },    es:'Sala de estar', en:'Sitting room',    des:'butaca y mesita',      den:'armchair and side table', furnCm:55, gapCm:22, viewCm:340, build:buildSalonReal },
  { id:'despacho-real', caja:{ w:560, h:274, d:380 }, es:'Escritorio',   en:'Desk',             des:'mesa de roble y silla',   den:'oak desk and chair',        furnCm:74, gapCm:22, viewCm:340, build:buildDespachoReal },
  { id:'salon-sofa', caja:{ w:800, h:300, d:480 },    es:'Salón sofá',   en:'Sofa',             des:'sofá de bouclé',          den:'bouclé sofa',               furnCm:88, gapCm:20, viewCm:360, build:buildSalonSofa },
  { id:'cocina', caja:{ w:600, h:276, d:400 },        es:'Cocina',        en:'Kitchen',        des:'frentes greige y roble',  den:'greige fronts and oak',  furnCm:92, gapCm:42, viewCm:380, build:buildCocina },
  { id:'cocina-blanca', caja:{ w:600, h:282, d:400 }, es:'Cocina blanca', en:'White kitchen',  des:'frentes blancos y piedra', den:'white fronts and stone', furnCm:92, gapCm:42, viewCm:380,
    build:(g,U) => buildCocina(g, U, { shell:{ wall1:'#f0eeea', wall2:'#e2e0dc', floor1:'#c9c4bb', floor2:'#b5b0a7', side:'#eeece8', skirt:'#e2e0dc' },
                                       run:{ frente:'#f3f1ec', frente2:'#e6e3dd', zocalo:'#b9b5ad', encimera:'piedra' } }) },
  { id:'cocina-verde', caja:{ w:580, h:272, d:390 },  es:'Cocina verde',  en:'Green kitchen',  des:'frentes salvia y roble',   den:'sage fronts and oak',    furnCm:92, gapCm:42, viewCm:380,
    build:(g,U) => buildCocina(g, U, { shell:{ wall1:'#ece9e1', wall2:'#dedacf', floor1:'#c6bdaf', floor2:'#b2a99a', side:'#eae7df', skirt:'#dedacf' },
                                       run:{ frente:'#9fae9a', frente2:'#8f9e8a', zocalo:'#6f7a6b', encimeraHex:'#e9dcc4' } }) },


  { id:'cocina-negra', caja:{ w:600, h:280, d:400 }, es:'Cocina negra mate', en:'Matte black kitchen', des:'frentes negros y piedra clara', den:'matte black fronts, pale stone',
    furnCm:92, gapCm:42, viewCm:380,
    build:(g,U) => buildCocina(g, U, { shell:{ wall1:'#e9e6e1', wall2:'#dbd7d0', floor1:'#c0bab0', floor2:'#aba49a', side:'#e6e3dd', skirt:'#dbd7d0' },
                                       run:{ frente:'#22221f', frente2:'#2b2b27', zocalo:'#121210', encimera:'piedra' } }) },
  { id:'cocina-terracota', caja:{ w:600, h:278, d:400 }, es:'Cocina terracota', en:'Terracotta kitchen', des:'frentes cálidos y encimera clara', den:'warm fronts, pale counter',
    furnCm:92, gapCm:42, viewCm:380,
    build:(g,U) => buildCocina(g, U, { shell:{ wall1:'#f0e8de', wall2:'#e2d8ca', floor1:'#c9b9a4', floor2:'#b5a48c', side:'#eee5d9', skirt:'#e2d8ca' },
                                       run:{ frente:'#c1694a', frente2:'#a85a3e', zocalo:'#5c3626', encimeraHex:'#f0e6d6' } }) },
  /* ── TERRAZAS ──────────────────────────────────────────────────────────── */
  { id:'terraza-cristal', caja:{ w:480, h:280, d:170 }, es:'Terraza acristalada', en:'Glass-enclosed terrace', des:'cristal de suelo a techo', den:'floor-to-ceiling glass',
    furnCm:52, gapCm:28, viewCm:380, build:(g,U) => {
      buildShell(g, U, { wall1:'#ece6da', wall2:'#ddd4c3', floor1:'#c9beac', floor2:'#b5a998', side:'#e8e2d5', skirt:'#ddd4c3' });
      addVidrieraLateral(g, U, { sg:1, depthCm:170, sky1:'#bfe0ea', sky2:'#eef2df' });
      addRatanLounge(g, U, { xCm:-130, zCm:54, rotY:0.3 });
      addMesaRatan(g, U, { xCm:22, zCm:64 });
      addModel(g, 'modelos/potted_plant_02.glb', { xCm:180, zCm:38 });
      addContactShadow(g, U, 88, 82, 180*U, 38*U, 0.6);
    } },
  { id:'terraza-abierta', caja:{ w:480, h:268, d:170 }, es:'Terraza abierta', en:'Open terrace', des:'barandilla y vistas', den:'railing and views',
    furnCm:46, gapCm:30, viewCm:380, build:(g,U) => {
      buildShell(g, U, { wall1:'#eee7da', wall2:'#e0d8c8', floor1:'#c7bca8', floor2:'#b2a48f', side:'#e9e2d3', skirt:'#e0d8c8' });
      addBarandilla(g, U, { sg:1, depthCm:170, sky1:'#bcdbe8', sky2:'#f1f0dc' });
      addRatanLounge(g, U, { xCm:-122, zCm:50, rotY:0.26 });
      addMesaRatan(g, U, { xCm:30, zCm:58 });
      addModel(g, 'modelos/potted_plant_04.glb', { xCm:186, zCm:32 });
      addContactShadow(g, U, 60, 60, 186*U, 32*U, 0.55);
    } },

  { id:'terraza-jardin', caja:{ w:490, h:300, d:175 }, es:'Terraza con jardín', en:'Garden terrace', des:'ratán y plantas', den:'rattan and plants',
    furnCm:52, gapCm:26, viewCm:390, build:(g,U) => {
      buildShell(g, U, { wall1:'#eee8d9', wall2:'#e1d9c4', floor1:'#c3b89e', floor2:'#ab9e82', side:'#eae4d3', skirt:'#e1d9c4' });
      addVidrieraLateral(g, U, { sg:1, depthCm:175, sky1:'#bfe3d0', sky2:'#f0f2df', tinte:'#e4efe0' });
      addRatanLounge(g, U, { xCm:-134, zCm:52, rotY:0.3 });
      addMesaRatan(g, U, { xCm:16, zCm:62 });
      addModel(g, 'modelos/potted_plant_04.glb', { xCm:190, zCm:34 });
      addContactShadow(g, U, 64, 64, 190*U, 34*U, 0.6);
      addModel(g, 'modelos/potted_plant_02.glb', { xCm:200, zCm:70 });
      addContactShadow(g, U, 88, 82, 200*U, 70*U, 0.55);
    } },
  { id:'terraza-urbana', caja:{ w:480, h:282, d:170 }, es:'Terraza urbana', en:'Rooftop terrace', des:'barandilla de acero y hormigón', den:'steel railing, concrete floor',
    furnCm:46, gapCm:28, viewCm:380, build:(g,U) => {
      buildShell(g, U, { wall1:'#dedcd8', wall2:'#cfccc6', floor1:'#9a978f', floor2:'#84817a', side:'#dad7d1', skirt:'#cfccc6' });
      addBarandilla(g, U, { sg:1, depthCm:170, sky1:'#8fa6c2', sky2:'#e7d9c6' });
      addRatanLounge(g, U, { xCm:-112, zCm:48, rotY:0.2, color:'#4a4a4c', cojin:'#d8d4cb' });
      addMesaRatan(g, U, { xCm:34, zCm:56, color:'#4a4a4c' });
      addModel(g, 'modelos/potted_plant_02.glb', { xCm:188, zCm:30 });
      addContactShadow(g, U, 60, 60, 188*U, 30*U, 0.55);
    } },
  { id:'pasillo', caja:{ w:470, h:314, d:540 },       es:'Pasillo',      en:'Hallway',          des:'consola y alfombra',      den:'console and runner',        furnCm:78, gapCm:24, viewCm:330, build:buildPasillo },
  { id:'rincon', caja:{ w:540, h:288, d:400 },        es:'Rincón',       en:'Corner',           des:'la esquina, con planta',  den:'the corner, with a plant',  furnCm:55, gapCm:26, viewCm:340, build:buildRincon },

  /* ── ESCALERA ──────────────────────────────────────────────────────────── */
  { id:'escalera-galeria', caja:{ w:520, h:300, d:420 }, es:'Escalera rústica', en:'Rustic staircase', des:'la pared del rellano, con la escalera al fondo', den:'landing wall, staircase behind',
    furnCm:70, gapCm:24, viewCm:380, build:(g,U) => {
      buildShell(g, U, { wall1:'#eeeae2', wall2:'#e0dbd0', floor1:'#c7bfaf', floor2:'#b3aa99', side:'#ebe7df', skirt:'#e0dbd0' });
      addEscalones(g, U, { xCm:164, zCm:26, sg:-1, wCm:96, n:10, color:'#c7ad84', zanca:'#f1ede4' });
      addRunner(g, U, { wCm:100, dCm:260, zCm:8, hex:'#b2a591' });
      addConsola(g, U, { xCm:-160, zCm:6 });
      addModel(g, 'modelos/ceramic_vase_01.glb', { xCm:-188, zCm:20, yCm:78 });
      addModel(g, 'modelos/potted_plant_02.glb', { xCm:-196, zCm:60 });
      addContactShadow(g, U, 76, 72, -196*U, 60*U, 0.6);
    } },
  { id:'escalera-blanca', caja:{ w:520, h:302, d:420 }, es:'Escalera clásica', en:'Classic staircase', des:'balaustres blancos y pasamanos oscuro', den:'white balusters, dark handrail',
    furnCm:70, gapCm:24, viewCm:380, build:(g,U) => {
      buildShell(g, U, { wall1:'#f1eee6', wall2:'#e4e0d6', floor1:'#c9b797', floor2:'#b5a37f', side:'#eeece4', skirt:'#e4e0d6' });
      addEscalones(g, U, { xCm:164, zCm:26, sg:-1, wCm:96, n:10, color:'#a9744a', zanca:'#faf8f4', metalColor:'#f5f3ee', pasamanos:'#5a4028' });
      addRunner(g, U, { wCm:96, dCm:260, zCm:8, hex:'#c9b6a1' });
      addConsola(g, U, { xCm:-160, zCm:6 });
      addModel(g, 'modelos/ceramic_vase_01.glb', { xCm:-188, zCm:20, yCm:78 });
      addModel(g, 'modelos/potted_plant_04.glb', { xCm:-196, zCm:58 });
      addContactShadow(g, U, 60, 56, -196*U, 58*U, 0.55);
    } },
  { id:'escalera-moderna', caja:{ w:520, h:296, d:420 }, es:'Escalera moderna', en:'Modern staircase', des:'peldaños flotantes de acero y madera', den:'floating steel-and-wood steps',
    furnCm:70, gapCm:24, viewCm:380, build:(g,U) => {
      buildShell(g, U, { wall1:'#e2ded9', wall2:'#d2cdc6', floor1:'#3a342e', floor2:'#2a2621', side:'#ded9d3', skirt:'#d2cdc6' });
      addEscalonesFlotantes(g, U, { xCm:170, zCm:22, sg:-1, wCm:100, n:10, color:'#3f2c1d', luz:'#ffcf94' });
      const bancoMat = new THREE.MeshStandardMaterial({ color:0x232323, roughness:0.5, metalness:0.2 });
      const banco = softBox(120*U, 15*U, 40*U, 2*U, bancoMat); banco.position.set(-150*U, 30*U, 60*U); g.add(banco);
      [-1,1].forEach(sx => { const pata = softBox(3*U, 28*U, 3*U, 0.6*U, bancoMat); pata.position.set(-150*U + sx*54*U, 14*U, 60*U); g.add(pata); });
      addContactShadow(g, U, 150, 60, -150*U, 60*U, 0.55);
      addMesaCentro(g, U, { xCm:-40, zCm:70, rCm:26, piedra:true, color:'#1c1c1c' });
      addModel(g, 'modelos/potted_plant_02.glb', { xCm:-196, zCm:34 });
      addContactShadow(g, U, 88, 82, -196*U, 34*U, 0.6);
    } },

  /* ── SOBREMESA: se apoya, no se cuelga ───────────────────────────────────
     Escenas propias para el Sobremesa (madera): estanterías y aparadores altos
     donde se pone encima, o una balda entre libros; y mesitas de noche. furnCm
     es aquí la altura REAL de la superficie (la balda, la tapa del aparador o
     de la mesita), casi sin gapCm: el sobremesa se apoya justo encima, no cuelga. */
  /* 2-oct-2026: rehechas a petición de Marc. Cada una es una HABITACIÓN (dormitorio con cama, salón
     con sofá pequeño) y al entrar la cámara arranca viendo la habitación y se acerca sola hasta el
     Sobremesa (flyIn en layout). Sin plantas. restCm = cara de ARRIBA exacta de la superficie (antes
     iba 1-2 cm por debajo y el Sobremesa parecía metido dentro de la mesita); restZCm = a cuántos cm
     de la pared queda el centro de esa superficie. */
  { id:'estanteria-cima', flyRy:0.3, flyRy0:0.5, restZCm:18, caja:{ w:560, h:270, d:420 }, es:'Salón con estantería baja', en:'Living room, low bookcase', des:'encima de la estantería, junto al sofá', den:'on the bookcase, next to the sofa',
    restCm:84, gapCm:0, furnCm:84, viewCm:330, build:(g,U) => {
      buildShell(g, U, { wall1:'#efe9df', wall2:'#e1dbcd', floor1:'#c9beac', floor2:'#b5a998', side:'#ece6da', skirt:'#e1dbcd' });
      addRug(g, U, 260, 170, 150, '#d6cbb8');
      addEstanteria(g, U, { xCm:0, zCm:2, wCm:96, dCm:32, hCm:84, shelvesCm:[42], color:'#6b4f36' });
      addBookRow(g, U, -22, 2.2, 18, 6, 40); addBookRow(g, U, 24, 43, 18, 4, 30);
      addBookRow(g, U, -32, 84, 18, 3, 16);                               // tres libros en la tapa, lejos del cuadro
      addSofaModerno(g, U, { xCm:150, zCm:8, wCm:165 });
      addTableLamp(g, U, 30*U, 84*U, 14*U, '#b08d57', '#f3ece0');
    } },
  { id:'estanteria-hueco', flyRy:-0.3, flyRy0:-0.5, restZCm:18, caja:{ w:560, h:270, d:420 }, es:'Salón con estantería', en:'Living room, bookshelf', des:'en una balda, entre libros, junto al sofá', den:'on a shelf between books, next to the sofa',
    restCm:96, gapCm:0, furnCm:96, viewCm:330, build:(g,U) => {
      buildShell(g, U, { wall1:'#ede6d9', wall2:'#ddd4c1', floor1:'#c5b9a5', floor2:'#b1a48e', side:'#eae3d5', skirt:'#ddd4c1' });
      addRug(g, U, 260, 170, 150, '#cfc3ae');
      // balda del cuadro con la cara de arriba en 96 cm (centro 95.07 + medio grosor 0.93)
      addEstanteria(g, U, { xCm:0, zCm:2, wCm:96, dCm:32, hCm:190, shelvesCm:[48, 95.07, 142], color:'#4a3826', backColor:'#3a2c1e' });
      addBookRow(g, U, -30, 96, 18, 4, 24); addBookRow(g, U, 30, 96, 18, 4, 24);
      addBookRow(g, U, -12, 2.2, 18, 6, 56); addBookRow(g, U, 10, 49, 18, 6, 60); addBookRow(g, U, -18, 143, 18, 4, 34);
      addSofaModerno(g, U, { xCm:-150, zCm:8, wCm:165, c1:'#e9dfcf', c2:'#cfc2ae', c3:'#ddd2c0' });
    } },
  { id:'aparador-alto', restZCm:35, caja:{ w:420, h:260, d:340 }, es:'Aparador alto', en:'Tall sideboard', des:'de pie encima del aparador', den:'standing on top of the sideboard',
    restCm:96, gapCm:0, furnCm:96, viewCm:280, build:(g,U) => {
      buildShell(g, U, { wall1:'#e9e3d7', wall2:'#dbd3c1', floor1:'#c4b9a5', floor2:'#b0a48d', side:'#e6e0d3', skirt:'#dbd3c1' });
      addAparadorAlto(g, U, { xCm:0, zCm:14, wCm:150, dCm:42, hCm:96, puertas:3, color:'#4d3a28' });
      addBookRow(g, U, 50, 96, 35, 3, 15);
      addModel(g, KIT + 'lamp_round_table_kenney.glb', { xCm:-50, zCm:35, wCm:20, dCm:20, yCm:96, mat:'negro' });
    } },
  { id:'aparador-consola', restZCm:33, caja:{ w:400, h:255, d:330 }, es:'Consola alta', en:'Tall console', des:'de pie encima de la consola', den:'standing on top of the console',
    restCm:88, gapCm:0, furnCm:88, viewCm:260, build:(g,U) => {
      buildShell(g, U, { wall1:'#e7e2da', wall2:'#d8d2c6', floor1:'#beb3a1', floor2:'#aa9e8b', side:'#e4dfd6', skirt:'#d8d2c6' });
      addAparadorAlto(g, U, { xCm:0, zCm:14, wCm:130, dCm:38, hCm:88, puertas:2, color:'#8a5c3a' });
      addBookRow(g, U, 44, 88, 33, 3, 14);
      addModel(g, KIT + 'lamp_round_table_kenney.glb', { xCm:-46, zCm:33, wCm:18, dCm:18, yCm:88, mat:'negro' });
    } },
  { id:'mesita-boutique', flyRy:-0.3, flyRy0:-0.5, restZCm:33, caja:{ w:560, h:270, d:430 }, es:'Dormitorio', en:'Bedroom', des:'encima de la mesita, junto a la cama', den:'on the nightstand, next to the bed',
    restCm:52, gapCm:0, furnCm:52, viewCm:330, build:(g,U) => {
      buildShell(g, U, { wall1:'#e9ddd2', wall2:'#dbcbb8', floor1:'#c2b6a4', floor2:'#ae9f8c', side:'#e6ded2', skirt:'#dbd2c4' });
      addRug(g, U, 300, 200, 175, '#c9b89a');
      addCamaModerna(g, U, { xCm:-108, zCm:4, anchoCm:160, largoCm:200, color:'#a8583f', ropa:'#f2ece0' });
      addMesitaModerna(g, U, { xCm:0,    zCm:4, color:'#8a5c3a' });
      addMesitaModerna(g, U, { xCm:-216, zCm:4, color:'#8a5c3a' });
      /* 15-oct: la pantalla mide 11,5 cm de radio: a 6 cm de la pared se metía dentro. El Sobremesa va
         más adelante en la mesita (restZCm 33) y la lámpara detrás, a un lado, sin tocar ni pared ni cuadro */
      addTableLamp(g, U, 16*U, 52*U, 13*U, '#b08d57', '#f3ece0');
      addTableLamp(g, U, -216*U, 52*U, 20*U, '#b08d57', '#f3ece0');
    } },
  { id:'mesita-nordica', flyRy:-0.3, flyRy0:-0.5, restZCm:33, caja:{ w:560, h:270, d:430 }, es:'Dormitorio nórdico', en:'Nordic bedroom', des:'encima de la mesita, junto a la cama', den:'on the nightstand, next to the bed',
    restCm:52, gapCm:0, furnCm:52, viewCm:330, build:(g,U) => {
      buildShell(g, U, { wall1:'#f1efe9', wall2:'#e5e2da', floor1:'#d3c9b8', floor2:'#bfb4a0', side:'#eeece5', skirt:'#e5e2da' });
      addCamaModerna(g, U, { xCm:-108, zCm:4, anchoCm:160, largoCm:200, color:'#e4ddcd', ropa:'#faf8f2' });
      addMesitaModerna(g, U, { xCm:0,    zCm:4, color:'#e8dcc4', tex:'oak_veneer_01' });
      addMesitaModerna(g, U, { xCm:-216, zCm:4, color:'#e8dcc4', tex:'oak_veneer_01' });
      const bancoMat = pbrMat('oak_veneer_01', 0.16, { color:'#e0d3b6', roughness:0.55, env:0.45 });
      const banco = softBox(120*U, 15*U, 40*U, 2*U, bancoMat); banco.position.set(-108*U, 30*U, 230*U); g.add(banco);
      [-1,1].forEach(sx => { const pata = softBox(3*U, 28*U, 3*U, 0.6*U, bancoMat); pata.position.set((-108 + sx*54)*U, 14*U, 230*U); g.add(pata); });
      addTableLamp(g, U, 16*U, 52*U, 13*U, '#2b2b2b', '#efeae0');
      addTableLamp(g, U, -216*U, 52*U, 20*U, '#2b2b2b', '#efeae0');
    } },

  /* ── NEVERAS (imán) ──────────────────────────────────────────────────────
     16-oct-2026. Nevera retro de una puerta, tamaño real (60 × 154 × 70 cm) y no una americana enorme,
     para que los imanes (7 × 10 cm) se vean grandes. La cara de la puerta hace de «pared»: restZCm =
     dónde queda esa cara (NEVERA_FRONT), así la escena se retrasa y los imanes quedan pegados a la puerta.
     furnCm + gapCm = altura del borde de abajo de la composición (100 cm, a la altura de la mano). */
  { id:'nevera-menta', restZCm:NEVERA_FRONT, caja:{ w:420, h:270, d:380 }, es:'Nevera retro menta', en:'Mint retro fridge', des:'cocina con suelo de damero', den:'kitchen with checkerboard floor',
    furnCm:92, gapCm:8, viewCm:90, verCm:[88, 158], build:(g,U) => buildCocinaNevera(g, U, {
      wall1:'#f3efe6', wall2:'#e6e0d3', fridge:'#a9d8c4', tiles:['#fbfaf6', '#d9d6cc'], floor:['#f4f1ea', '#262626'],
      mueble:'#f2efe8', encimera:'#c79a63' }) },
  { id:'nevera-roja', restZCm:NEVERA_FRONT, caja:{ w:420, h:270, d:380 }, es:'Nevera retro roja', en:'Red retro fridge', des:'cocina verde con baldosa de barro', den:'green kitchen, terracotta floor',
    furnCm:92, gapCm:8, viewCm:90, verCm:[88, 158], build:(g,U) => buildCocinaNevera(g, U, {
      wall1:'#f1e9dc', wall2:'#e4d9c6', fridge:'#c8382f', tiles:['#2f5a46', '#23463a'], floor:['#b8613f', '#a5553a', 'barro'],
      mueble:'#2f5a46', encimera:'#e9e2d4' }) },
  { id:'nevera-crema', restZCm:NEVERA_FRONT, caja:{ w:420, h:270, d:380 }, es:'Nevera retro crema', en:'Cream retro fridge', des:'azulejo azul y suelo de roble', den:'blue tiles and oak floor',
    furnCm:92, gapCm:8, viewCm:90, verCm:[88, 158], build:(g,U) => buildCocinaNevera(g, U, {
      wall1:'#f4efe6', wall2:'#e7e0d2', fridge:'#f0e6cc', tiles:['#2d5b8c', '#244c77'], floor:['#c9a67c', '#b8946a', 'roble'],
      mueble:'#f6f2ea', encimera:'#2b2b2b' }) },
];
/* ── MUEBLES DESCARGADOS (Poly Haven, CC0) ─────────────────────────────────
   Modelos reales CC0 de polyhaven.com (uso comercial permitido, sin atribución obligatoria),
   comprimidos a `modelos/<id>.glb` por `_build_modelos.py` (geometría cuantizada + texturas WebP:
   21 MB de fuentes → 5 MB). Se cargan SOLO cuando el cliente elige una escena realista, con el
   GLTFLoader de gltf-loader.js.
   Las medidas del glTF están en METROS: 1 m = 100*CM unidades nuestras. Cada mueble se coloca por
   su caja: apoyado en el suelo (y=0) y, si se pide, con la espalda pegada a la pared (z=0). */
let _gltfLoader = null, _gltfPending = null;
const MODEL_CACHE = {};
/* el loader (107 KB) se baja solo cuando hace falta: las páginas de producto no lo cargan de entrada */
function ensureGltfLoader(cb){
  if(window.GLTFLoader) return cb();
  if(!_gltfPending){
    _gltfPending = new Promise(res => {
      const sc = document.createElement('script');
      sc.src = 'gltf-loader.js'; sc.onload = () => res(); sc.onerror = () => res();
      document.head.appendChild(sc);
    });
  }
  _gltfPending.then(() => { if(window.GLTFLoader) cb(); });
}
/* Los muebles se pintan apagados: se les quita ~30% de saturación y un punto de luz. Un mueble con
   color fuerte (madera roja, una lámpara naranja) se come los pósters, que es lo que se vende. */
function calmMat(mat){
  if(mat.userData._calm) return mat;
  mat.userData._calm = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = sh => {
    if(prev) prev(sh);
    sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n'
      + '\tdiffuseColor.rgb = mix(vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), diffuseColor.rgb, 0.70) * 0.96;');
  };
  // OJO: hay que atar la original al material. La de three hace `this.onBeforeCompile.toString()`
  // y suelta (this undefined) petaba con "Cannot read properties of undefined".
  const key = mat.customProgramCacheKey.bind(mat);
  mat.customProgramCacheKey = () => 'calm|' + key();
  return mat;
}
function loadModel(url, cb){
  if(MODEL_CACHE[url]){ cb(MODEL_CACHE[url].clone(true)); return; }
  if(!window.GLTFLoader){ ensureGltfLoader(() => loadModel(url, cb)); return; }
  _gltfLoader = _gltfLoader || new window.GLTFLoader();
  _gltfLoader.load(url, gltf => {
    const root = gltf.scene;
    root.traverse(o => { if(o.isMesh && o.material){
      o.material.envMapIntensity = 0.5;                   // el visor está iluminado para el aluminio: quemaría los muebles
      if(o.material.roughness != null) o.material.roughness = Math.min(1, o.material.roughness * 1.15 + 0.14);
      calmMat(o.material);                                // la habitación no puede tirar más que los cuadros
    }});
    MODEL_CACHE[url] = root;
    cb(root.clone(true));
  }, undefined, () => {});
}
/* Coloca un modelo: xCm/zCm en cm (x = centro, z = distancia a la pared), `back:true` = pegado a la pared,
   `yCm` = altura de apoyo (encima de un mueble), `rotY` = giro. Los modelos de Poly Haven vienen a TAMAÑO REAL,
   así que por defecto se respeta su medida; `widthCm` solo si hay que forzarla. */
function addModel(g, url, o){
  loadModel(url, root => {
    /* `tint`: repinta el mueble de un color liso. OJO: hay que QUITAR el mapa de color, porque
       en un modelo texturizado el color multiplica la textura y un cuero negro se queda negro
       hagas lo que hagas. A cambio se pierde el dibujo del material: solo vale para tapizados
       lisos, no para maderas. `tintKeep` deja fuera las partes que no se repintan (la madera). */
    /* `mat`: le pone al modelo un material NUESTRO. Los muebles de poly.pizza vienen sin
       textura (colores planos), así que aquí es donde dejan de parecer de videojuego. */
    if(o.mat){
      const m = matKit(o.mat);
      root.traverse(x => { if(x.isMesh) x.material = m; });
    }
    if(o.tint){
      const c = new THREE.Color(o.tint), keep = o.tintKeep || [];
      root.traverse(m => { if(m.isMesh && m.material){
        const nom = (m.material.name || '') + ' ' + (m.name || '');
        if(keep.some(k => nom.toLowerCase().includes(k))) return;
        m.material = m.material.clone();
        m.material.map = null;
        m.material.color = c.clone();
        if(m.material.roughness != null) m.material.roughness = Math.min(1, m.material.roughness * 0.6 + 0.55);
        m.material.needsUpdate = true;
      }});
    }
    const U = CM;
    root.updateMatrixWorld(true);                         // sin esto la caja sale mal (matrices sin actualizar) y la escala del mueble se va al garete
    const box = new THREE.Box3().setFromObject(root), size = new THREE.Vector3(); box.getSize(size);
    let k = 100*U;                                        // metros → unidades
    /* `widthCm` = el lado LARGO en horizontal, no el eje X: los muebles del kit vienen con
       orientaciones distintas y medir siempre en X hacía sofás de tres metros. */
    if(o.widthCm) k = (o.widthCm*U) / Math.max(size.x, size.z);
    root.scale.setScalar(k);
    let ry = o.rotY || 0;
    // si es más largo de fondo que de ancho, se gira un cuarto para que quede a lo ancho de la pared
    if(o.alinear !== false && size.z > size.x*1.25) ry += Math.PI/2;
    if(ry) root.rotation.y = ry;
    root.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(root), c = new THREE.Vector3(); b2.getCenter(c);
    root.position.x += (o.xCm||0)*U - c.x;
    root.position.y += (o.yCm||0)*U - b2.min.y;           // apoyado en el suelo (o a yCm, encima de un mueble)
    root.position.z += o.back ? -b2.min.z + (o.zCm||0)*U : (o.zCm||0)*U - c.z;
    g.add(root);
    dirty3D = true;
  });
}

const findScene = id => SCENES.find(s => s.id === id) || SCENES[0];
function getScene(id){
  const sc = findScene(id);
  if(!sceneGroups[sc.id]){
    const g = new THREE.Group();
    Object.assign(ROOM_BOX, ROOM_BOX_DEF, sc.caja || {});   // la caja de ESTA escena
    sc.build(g, CM);
    Object.assign(ROOM_BOX, ROOM_BOX_DEF);
    g.visible = false;
    group.add(g);
    sceneGroups[sc.id] = g;
  }
  return sceneGroups[sc.id];
}

/* coloca la escena: el suelo queda a (gap + mueble) cm por debajo del borde inferior de la
   composición, y la cara de la pared justo detrás de los cuadros */
function placeRoom(compH){
  const R = ROOM_CFG;
  if(R.mode === 'none'){
    Object.values(sceneGroups).forEach(g => g.visible = false);
    if(photoMesh){ photoMesh.visible = false; fgMesh.visible = false; photoMesh.userData.key = null; }
    LIGHT_U.uLightOn.value = 0; lightRef = null;
    return;
  }
  if(R.mode === 'photo' && ROOM){
    Object.values(sceneGroups).forEach(g => g.visible = false);
    placePhotoRoom(compH);
    return;
  }
  if(photoMesh){ photoMesh.visible = false; fgMesh.visible = false; photoMesh.userData.key = null; }
  const sc = findScene(R.scene);
  Object.entries(sceneGroups).forEach(([id, g]) => { if(id !== sc.id) g.visible = false; });
  const g = getScene(sc.id);
  /* restCm = altura REAL de la superficie donde se apoya (solo en las escenas del Sobremesa);
     en el resto furnCm hace las dos cosas (altura del mueble Y cuánto se ve en el encuadre,
     ver layout()) porque ahí el cuadro se CUELGA por encima, no se apoya. */
  /* restZCm (2-oct-2026): a cuántos cm de la pared queda el centro de la superficie donde se apoya
     el Sobremesa. La escena se retrasa eso para que el Sobremesa quede ENCIMA del mueble, en medio
     de la balda o la mesita, y no pegado a la pared a la altura del mueble. */
  /* Sobremesa: lo que hay entre el borde de abajo del póster y la superficie es SOLO la peana de
     bambú (lo que asoma por debajo del póster: BASE_H - BAMBU_SINK), sin gapCm; con gapCm la peana
     quedaba 1-4 cm en el aire. Los cuadros colgados siguen con su gapCm. */
  const below = sc.restCm != null ? (BASE_H - BAMBU_SINK) + sc.restCm*CM : (sc.gapCm + sc.furnCm)*CM;
  g.position.set(0, -compH/2 - below, -0.22 - (sc.restZCm || 0)*CM);
  if(sc.restCm != null){
    /* la primera vez el póster aún no está colocado en este punto de layout(): se repite en el
       fotograma siguiente y cuando han llegado los muebles descargados */
    const yBase = g.position.y; apoyarSobremesa(g);
    const otraVez = () => { if(!g.visible || findScene(ROOM_CFG.scene) !== sc) return; g.position.y = yBase; apoyarSobremesa(g); dirty3D = true; };
    requestAnimationFrame(otraVez); setTimeout(otraVez, 700);
  }
  g.visible = true;
  // los cuadros reciben la luz de ventana de la pared dibujada (mismo shader que con foto)
  LIGHT_U.uLightTex.value = wallLight(); LIGHT_U.uLightOn.value = 1;
  lightRef = g.userData.wall || null;
}

/* 15-oct · La altura de la peana salía de una fórmula (restCm + lo que asoma la peana) que no contaba
   la inclinación del póster ni el canto redondeado de las tapas: la peana se metía 5-6 mm dentro de la
   balda o la mesita, más cuanto más grande el Sobremesa. Ahora se mide: la base de la peana en reposo
   (sin la animación de entrada) y la cara de arriba de lo que tiene justo debajo, y la escena se mueve
   lo que haga falta para que se toquen. */
function apoyarSobremesa(g){
  const p = POSTERS.find(q => q.ptype === 'madera' && q.bamboo); if(!p) return;
  const bg = p.bambooGroup, y0 = bg.position.y;
  bg.position.y = 0;                                   // en reposo, no a mitad de la animación
  /* todo se mide en el sistema del grupo (la habitación), no en el de la pantalla: el visor inclina y
     gira el grupo y entonces «arriba» en pantalla no es «arriba» en la habitación */
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), M = new THREE.Matrix4();
  /* caja de una malla en el sistema del grupo, desde su geometría (pasar la caja de pantalla al grupo
     con el visor inclinado la inflaba varios cm) */
  const cajaEnGrupo = o => {
    if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    return o.geometry.boundingBox.clone().applyMatrix4(M.multiplyMatrices(inv, o.matrixWorld));
  };
  const pb = cajaEnGrupo(p.bamboo);
  bg.position.y = y0;
  const s = 1, tol = 4*CM;
  let top = -Infinity;
  g.traverse(o => {
    if(!o.isMesh) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if(m && m.transparent && m.depthWrite === false) return;          // sombras de contacto
    const b = cajaEnGrupo(o);
    const cx = (pb.min.x + pb.max.x)/2, cz = (pb.min.z + pb.max.z)/2;
    if(b.min.x > cx || b.max.x < cx || b.min.z > cz || b.max.z < cz) return;   // justo debajo del centro de la peana
    if(b.max.y > pb.min.y + tol || b.max.y < pb.min.y - tol) return;
    top = Math.max(top, b.max.y);
  });
  if(isFinite(top)) g.position.y += (pb.min.y - top) / s;
  bg.updateMatrixWorld(true);
}

/* sombra suave detrás de cada cuadro (solo se ve con pared) */
let shadowTex = null;
function getShadowTex(){
  if(shadowTex) return shadowTex;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.filter = 'blur(13px)'; x.fillStyle = 'rgba(0,0,0,.62)';
  x.beginPath(); x.roundRect(30, 30, 196, 196, 6); x.fill();
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}
function syncShadow(p){
  if(!p.shadow){
    p.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map:getShadowTex(), transparent:true, opacity:.5, depthWrite:false, toneMapped:false }));
    p.shadow.renderOrder = -5;
    p.rig.add(p.shadow);
  }
  p.shadow.scale.set(baseW(p)*1.3, baseH(p)*1.3, 1);
  p.shadow.position.set(0.04, -0.06, -0.12);
  p.shadow.visible = !!WALL && ROOM_CFG.mode !== 'none';   // sin entorno no hay pared: la sombra sobraba
}

function wallGross(w){
  return w.pieces.reduce((s, pc) => { const sz = FORMATS[pc.format].sizes.find(x => x.k === pc.size); return s + (sz ? sz.price : 0); }, 0);
}
/* El precio que se enseña de un conjunto YA lleva el descuento por cantidad (PACK_TIERS),
   igual que en la portada, en paredes.html y en pared2d. Si aquí saliera el bruto, el
   cliente vería un precio en el selector y otro distinto en el carrito. */
function wallPct(w){ const t = PACK_TIERS.find(t => w.pieces.length >= t.n); return t ? t.pct : 0; }
function wallPrice(w){ return Math.round(wallGross(w) * (100 - wallPct(w))) / 100; }
/* un conjunto solo se puede elegir si TODAS sus tallas tienen existencias */
function wallInStock(w){ return w.pieces.every(pc => inStock(FORMATS[pc.format].sizes.find(x => x.k === pc.size))); }
/* ── TAMAÑO DEL CONJUNTO ── (la geometría la calcula paredes.js: MOMENTURIES_wallAt)
   Un conjunto de una sola talla se puede pedir en las demás tallas de su formato. WALL es
   entonces esa versión: mismo id y nombre, con .vk (talla) y .base (el original). */
const wallAt = window.MOMENTURIES_wallAt || (w => w);
const wallSizeKeys = window.MOMENTURIES_wallSizeKeys || (() => []);
const HUECOS = window.MOMENTURIES_HUECOS || [];
const huecoOf = window.MOMENTURIES_huecoOf || (() => '');
function wallKOf(w){ return w.vk || w.pieces[0].size; }
function wallSizes(w){ return wallSizeKeys(w).map(k => wallAt(w, k)); }     // [] si mezcla tallas
function wallPieceDims(w){ const d = FORMATS[w.pieces[0].format].sizes.find(s => s.k === wallKOf(w)).d; return cm(d[0]) + ' × ' + cm(d[1]); }
/* la talla pedida (o la suya) si hay existencias, y si no la más cercana que tenga · qué versión
   se enseña en cada hueco. Las dos viven en paredes.js; aquí mandan las existencias de FORMATS. */
function wallPick(w, k){ return window.MOMENTURIES_wallPick ? window.MOMENTURIES_wallPick(w, k, wallInStock) : (w.base || w); }
function wallForHueco(w, h){ return window.MOMENTURIES_wallForHueco ? window.MOMENTURIES_wallForHueco(w, h, wallInStock) : w; }
function setWallSize(k){
  if(!WALL || wallKOf(WALL) === k) return;
  const v = wallAt(WALL, k);
  if(!wallInStock(v)) return;
  applyWall(v, {quiet:true, keepRoom:true});
  toast('Cuadros de ' + wallPieceDims(v) + ' cm. El conjunto ocupa ' + cm(v.width) + ' × ' + cm(v.height) + ' cm');
}
const wallSoldOutTag = '<em class="wall-soldout"><span class="es">Sin existencias</span><span class="en">Out of stock</span></em>';

/* miniatura SVG de una pared: la dibuja paredes.js (compartida con paredes.html y la landing) */
const wallSVG = window.MOMENTURIES_wallSVG || function(){ return ''; };

function clearPosterPhoto(i){
  const p = POSTERS[i]; if(!p) return;
  _userEdited = true;
  p.srcImg = null; p.file = null; p.pendingImg = false; p.crop = {scale:1, fx:0, fy:0, cx:0.5, cy:0.5};
  applyFrontTexture(i);
  p.thumb = null;
  closePanel(); renderThumbs(); syncConfigUI(); updateTotal(); syncWallBar();
  dirty3D = true;
}

function disposePoster(i){
  const p = POSTERS[i];
  group.remove(p.rig);
  POSTERS.splice(i, 1);
}

/* 16-oct-2026 · Cada foto al hueco de su forma. Antes, al elegir un conjunto, las fotos iban por orden a los
   huecos: una foto vertical (p. ej. el cielo de estrellas) podía caer en un hueco horizontal y quedar recortada.
   Ahora se reparte por parecido de proporción (vertical con vertical, horizontal con horizontal, la cuadrada
   donde menos se recorte). Lo mismo al subir fotos con un conjunto puesto (moveToFittingSlot). */
function applyPieceTo(p, pc){
  p.ptype = 'metal';
  if(!PRODUCTS.metal.mounts.includes(p.mount)) p.mount = PRODUCTS.metal.hanger;
  applyProductSize(p, FORMATS[pc.format].sizes.find(s => s.k === pc.size) || defSizeOf(PRODUCTS.metal, pc.format), pc.format);
  const o = pc.orient === 'h' ? 'landscape' : 'portrait';
  if(p.orient !== o) setOrientation(p, o); else applyMountVisual(p);
}
function photoRatio(p){ const im = p && p.srcImg; return im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : 0; }
function pieceRatio(pc){ const r = FORMATS[pc.format].ratio; return pc.orient === 'h' ? 1 / r : r; }   // ancho/alto del hueco
function fitCost(ph, pc){ return ph ? Math.abs(Math.log(ph) - Math.log(pieceRatio(pc))) : 0; }
function matchPhotosToPieces(w){
  const n = w.pieces.length;
  if(!POSTERS.some(p => p.srcImg)) return;
  const slotOf = POSTERS.map(() => -1), taken = w.pieces.map(() => false), pairs = [];
  POSTERS.forEach((p, i) => { if(p.srcImg) w.pieces.forEach((pc, k) => pairs.push([fitCost(photoRatio(p), pc), i, k])); });
  // el par más parecido primero; a igualdad, se respeta el orden de las fotos y de los huecos
  pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  pairs.forEach(([, i, k]) => { if(slotOf[i] < 0 && !taken[k]){ slotOf[i] = k; taken[k] = true; } });
  let free = 0;
  POSTERS.forEach((p, i) => { if(slotOf[i] >= 0) return; while(free < n && taken[free]) free++; if(free < n){ slotOf[i] = free; taken[free] = true; } });
  const sel = POSTERS[selected], next = new Array(n);
  POSTERS.forEach((p, i) => { next[slotOf[i]] = p; });
  POSTERS.splice(0, POSTERS.length, ...next);
  selected = Math.max(0, POSTERS.indexOf(sel));
}
/* foto recién subida en un hueco que no le va: si hay otro hueco vacío con su forma, se cambia allí */
function moveToFittingSlot(p){
  if(!WALL) return false;
  const pcs = WALL.pieces, i = POSTERS.indexOf(p); if(i < 0 || !pcs[i]) return false;
  const ph = photoRatio(p); let best = i, bc = fitCost(ph, pcs[i]);
  POSTERS.forEach((q, j) => {
    if(j === i || !pcs[j] || q.srcImg || q.pendingImg) return;
    const c = fitCost(ph, pcs[j]); if(c < bc - 0.05){ bc = c; best = j; }
  });
  if(best === i) return false;
  const q = POSTERS[best];
  POSTERS[best] = p; POSTERS[i] = q;
  applyPieceTo(p, pcs[best]); applyPieceTo(q, pcs[i]);
  if(selected === i) selected = best; else if(selected === best) selected = i;
  layout(); renderThumbs(); applySelection(); dirty3D = true;
  return true;
}

function applyWall(w, opts){
  opts = opts || {};
  if(!w) return;
  ROOM_LEJOS = 0;
  if(!wallInStock(w)){ toast('La pared «' + w.name + '» no tiene existencias ahora mismo'); return; }
  WALL = w;
  _userEdited = true;
  const n = w.pieces.length;
  // sobran cuadros: se van primero los vacíos, y si no queda otra, los últimos
  while(POSTERS.length > n){
    let i = POSTERS.findIndex(p => !p.srcImg && !p.pendingImg);
    if(i < 0) i = POSTERS.length - 1;
    disposePoster(i);
  }
  while(POSTERS.length < n) createPoster();
  matchPhotosToPieces(w);                 // cada foto al hueco de su forma (vertical con vertical…)
  // cada hueco impone producto (cuadro de pared), talla y orientación
  w.pieces.forEach((pc, i) => applyPieceTo(POSTERS[i], pc));
  if(selected >= n) selected = n - 1;
  /* el entorno: la foto 2D que mejor le va a este conjunto, salvo que el cliente ya haya elegido
     uno (y le quepa). Antes se ponía directamente el salón 3D. */
  const keep = (ROOM_BY_USER || opts.keepRoom) && !(ROOM_CFG.mode === 'photo' && ROOM && !ROOM.custom && !roomOk(ROOM, w));
  if(!keep){
    /* si el cliente había elegido la habitación, primero la otra foto de esa misma (la cercana) */
    const alt = (ROOM_BY_USER || opts.keepRoom) && ROOM_CFG.mode === 'photo' && ROOM && !ROOM.custom ? roomFor(ROOM, w) : null;
    const r = alt || bestRoomFor(w); if(r) setRoom(r);
  }
  editorRootEl.classList.add('ed-wall');
  wallPreferN = 0; syncSuggest();
  flipToFace(0); tRx = 0;                 // la pared se ve de frente
  closePanel();
  layout(); renderThumbs(); syncConfigUI(); updateTotal(); syncWallBar();
  if(!ROOM_BY_USER) arreglarEncuadre(w);
  const hint = document.getElementById('pvHint');
  if(hint) hint.innerHTML = ROOM_CFG.mode === 'photo'
    ? '<span class="es">Toca un cuadro para poner tu foto · arrastra para verlos en 3D</span><span class="en">Tap a print to add your photo · drag to see them in 3D</span>'
    : '<span class="es">Toca un cuadro para poner tu foto · arrastra para girar la pared</span><span class="en">Tap a print to add your photo · drag to rotate the wall</span>';
  dirty3D = true;
  if(!opts.quiet){
    const b = document.getElementById('btnSample'); if(b) b.hidden = true;
    toast('Pared «' + w.name + '» · ' + n + ' cuadros. Toca cada uno para poner tu foto');
  }
}

/* ── ENTORNO AUTOMÁTICO AL ELEGIR CONJUNTO ──
   Se busca la foto en la que el conjunto se vea bien: que quepa en la pared libre de la foto
   (`free`, encima de su línea de apoyo `anchorBottomY`) y que ocupe más o menos un tercio del
   ancho de la foto. Así los conjuntos grandes caen en fotos tomadas desde lejos y los pequeños
   en fotos más cercanas, donde no salen diminutos. Solo fotos de la orientación de la pantalla
   (vertical en móvil, horizontal en PC). */
let ROOM_BY_USER = false;   // el cliente eligió entorno (selector, ?entorno= o su propia pared)
const ROOM_FILL = 0.33;
/* dónde se cuelgan fotos de verdad: primero salón, aparador, comedor y dormitorio */
const ROOM_CAT_PEN = { salon:0, aparador:0, comedor:.05, dormitorio:.1, despacho:.35, cocina:.35, terraza:.4, escalera:.45 };
function roomFit(r, w){
  if(!r.free || !r.pxPerCm) return null;
  const cw = w.width * r.pxPerCm, ch = w.height * r.pxPerCm;
  const fw = r.free[2] - r.free[0], fh = (r.anchorBottomY || r.free[3]) - r.free[1];
  return { fits: cw <= fw*0.92 && ch <= fh*0.95, fill: cw / r.w, fillH: ch / r.h };
}
function roomFits(r, w){ const f = roomFit(r, w); return !f || f.fits; }
/* 11-oct · Un conjunto pequeño en una foto tomada desde lejos (se ven 5 m de pared) salía enano.
   Con conjunto el visor se acerca a la foto hasta ROOM_ZOOM_MAX (layout), y aun así una foto
   solo vale si el conjunto ocupa al menos ROOM_MIN_FILL de su ancho: con el acercamiento queda
   en torno a una cuarta parte de lo que se ve. Cada habitación tiene una foto de lejos y otra
   cercana (la vertical): si la de la pantalla no vale, se usa la otra. */
/* 14-oct · con las fotos HD el visor puede acercarse más sin que se vea borroso: 1,6 → 2,4, y el conjunto
   ocupa más (40/28% → 48/34%) */
const ROOM_MIN_FILL = 0.16, ROOM_ZOOM_MAX = 2.4;
/* ancho que ocupa el conjunto en el visor: 40% hasta 60 cm de ancho, bajando hasta 28% a partir de 150 cm */
const ROOM_FILL_SMALL = 0.48, ROOM_FILL_BIG = 0.34;
function roomOk(r, w){
  if(!w || r.custom) return true;
  /* 16-oct: un conjunto estrecho y alto (una columna de tres) nunca ocupa mucho de ancho: cuenta también el alto */
  const f = roomFit(r, w); return !f || (f.fits && Math.max(f.fill, f.fillH*0.7) >= minFillFor(w));
}
/* Los conjuntos más pequeños (dos o tres cuadros de 12×16) casi no llegan al mínimo en ninguna foto,
   porque las que hay están hechas desde lejos. Para que el selector nunca se quede vacío, si con el
   mínimo normal le quedarían menos de 6 habitaciones se rebaja para ese conjunto. */
const _minFill = {};
function minFillFor(w){
  const key = w.id + '@' + (w.vk || '') + ':' + w.width;
  if(_minFill[key] != null) return _minFill[key];
  const vistos = {}; let n = 0;
  PHOTO_ROOMS.forEach(r => {
    const g = r.group || r.id; if(vistos[g]) return;
    const f = roomFit(r, w);
    if(f && f.fits && Math.max(f.fill, f.fillH*0.7) >= ROOM_MIN_FILL){ vistos[g] = true; n++; }
  });
  return (_minFill[key] = n >= 6 ? ROOM_MIN_FILL : ROOM_MIN_FILL*0.6);
}
/* la foto de la habitación de r en la que el conjunto w se ve bien: la de la orientación de la
   pantalla si puede ser, si no la otra. null = en esa habitación no queda bien. */
function roomFor(r, w){
  const g = r.group || r.id, want = isMobileView() ? 'v' : 'h';
  const par = PHOTO_ROOMS.filter(x => (x.group || x.id) === g)
    .sort((a, b) => (a.orient === want ? 0 : 1) - (b.orient === want ? 0 : 1));
  return par.find(x => roomOk(x, w)) || null;
}
function bestRoomFor(w, ranked){
  const want = isMobileView() ? 'v' : 'h';
  const vistos = {}, cands = [];
  PHOTO_ROOMS.forEach(r => {          // una por grupo: la de la pantalla, o la que le vaya al conjunto
    const g = r.group || r.id; if(vistos[g]) return; vistos[g] = true;
    const par = PHOTO_ROOMS.filter(x => (x.group || x.id) === g);
    cands.push(roomFor(r, w) || par.find(x => x.orient === want) || par[0]);
  });
  const scored = [];
  cands.forEach(r => {
    const f = roomFit(r, w); if(!f) return;
    const pen = ROOM_CAT_PEN[r.cat || 'salon'] ?? .3, gamer = /gaming|gamer/.test(r.id) ? 1 : 0;
    const otra = r.orient && r.orient !== want ? .15 : 0;   // la foto de la otra orientación, solo si hace falta
    scored.push({ r, score: Math.abs(Math.log(f.fill / ROOM_FILL)) + pen + gamer + otra + (f.fits ? 0 : 10) + (roomOk(r, w) ? 0 : 5) });
  });
  if(!scored.length) return null;
  scored.sort((a, b) => a.score - b.score);
  if(ranked) return scored.map(x => x.r);
  /* entre las que quedan casi igual de bien, una fija por conjunto: así no caen todos en la misma */
  const near = scored.filter(x => x.score <= scored[0].score + .12);
  let h = 0; for(const c of w.id) h = (h*31 + c.charCodeAt(0)) >>> 0;
  return near[h % near.length].r;
}
/* Si en la habitación que tocaba el conjunto no entra entero sin alejarse de más (layout lo marca
   en FIT.apurado), se van probando las siguientes hasta dar con una donde quede bien. Solo
   cuando la habitación la ha puesto el editor: la que elige el cliente se respeta. */
function arreglarEncuadre(w){
  if(!FIT || !FIT.apurado || ROOM_CFG.mode !== 'photo' || !ROOM || ROOM.custom) return;
  const primera = ROOM, lista = (bestRoomFor(w, true) || []).filter(r => r !== primera && roomOk(r, w)).slice(0, 10);
  for(const r of lista){ setRoom(r); if(FIT && !FIT.apurado) return; }
  setRoom(primera);
}

/* vuelve a la pared libre (rejilla automática); los cuadros y sus fotos se quedan */
function clearWall(){
  if(!WALL) return;
  WALL = null;
  editorRootEl.classList.remove('ed-wall');
  if(roomGroup) roomGroup.visible = false;
  if(photoMesh){ photoMesh.visible = false; fgMesh.visible = false; }
  POSTERS.forEach(p => { if(p.shadow) p.shadow.visible = false; });
  flipToFace(REST_RY); tRx = REST_RX;
  closePanel();
  layout(); renderThumbs(); syncConfigUI(); updateTotal(); syncWallBar();
  const hint = document.getElementById('pvHint');
  if(hint) hint.innerHTML = '<span class="es">Arrastra para girar · rueda o pellizco para zoom · toca un cuadro para editarlo</span><span class="en">Drag to rotate · scroll or pinch to zoom · tap a print to edit it</span>';
  dirty3D = true;
}

/* Nombre de lo que hay puesto ahora mismo, para la barra de arriba */
function roomLabel(){
  if(ROOM_CFG.mode === 'none') return '<span class="es">Ninguno</span><span class="en">None</span>';
  if(ROOM_CFG.mode === 'photo') return ROOM && ROOM.custom
    ? '<span class="es">Mi pared</span><span class="en">My wall</span>'
    : (ROOM ? ROOM.name : '');
  const sc = findScene(ROOM_CFG.scene);
  return '<span class="es">' + sc.es + '</span><span class="en">' + sc.en + '</span>';
}
function syncTools(){
  const nm = document.getElementById('edWallName'), rn = document.getElementById('edRoomName');
  if(nm) nm.innerHTML = WALL
    ? WALL.name + ' <i>' + POSTERS.filter(p => p.srcImg).length + '/' + POSTERS.length + '</i>'
    : '<span class="es">Uno suelto</span><span class="en">Single print</span>';
  if(rn) rn.innerHTML = roomLabel();
  const wx = document.getElementById('btnWallFree'); if(wx) wx.hidden = !WALL;
  const rx = document.getElementById('btnRoomFree'); if(rx) rx.hidden = ROOM_CFG.mode === 'none';
  const ts = document.getElementById('toolSize');
  if(ts){
    const vs = WALL ? wallSizes(WALL) : [];
    ts.hidden = vs.length < 2;
    editorRootEl.classList.toggle('ed-sized', vs.length > 1);
    if(vs.length > 1){
      document.getElementById('edSizeInfo').innerHTML = '<span class="es">Ocupa ' + Math.round(WALL.width) + ' × ' + Math.round(WALL.height) + ' cm</span><span class="en">Takes ' + Math.round(WALL.width) + ' × ' + Math.round(WALL.height) + ' cm</span>';
      const seg = document.getElementById('edSizeSeg'); seg.innerHTML = '';
      vs.forEach(v => {
        const b = document.createElement('button'), ok = wallInStock(v);
        b.type = 'button'; b.textContent = wallPieceDims(v).replace(/ /g, '');
        if(wallKOf(v) === wallKOf(WALL)) b.className = 'active';
        if(!ok){ b.disabled = true; b.title = 'Sin existencias'; }
        else b.title = 'Ocupa ' + cm(v.width) + ' × ' + cm(v.height) + ' cm · ' + wallPrice(v).toFixed(2).replace('.', ',') + ' €';
        b.onclick = () => setWallSize(wallKOf(v));
        seg.appendChild(b);
      });
    }
  }
}
const syncWallBar = syncTools;            // nombre viejo, lo llaman varios sitios

/* ── ventana de elección ── */
let wallFilter = 'all';
let wallPreferN = 0;   // >0: el cliente tiene N fotos y viene de «verlas juntas»: primero los de N cuadros
function renderWallModal(){
  const fl = document.getElementById('wallFilters'), grid = document.getElementById('wallGrid');
  if(!fl || !grid) return;
  /* 11-oct: el filtro es el hueco donde va (por el ancho que ocupa), no el nº de cuadros */
  fl.innerHTML = '';
  [{k:'all'}].concat(HUECOS).forEach(h => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'wall-filter' + (wallFilter === h.k ? ' active' : '');
    b.innerHTML = h.k === 'all' ? '<span class="es">Todas</span><span class="en">All</span>'
      : '<span class="es">' + h.es + ' <i>' + h.esR + '</i></span><span class="en">' + h.en + ' <i>' + h.enR + '</i></span>';
    b.onclick = () => { wallFilter = h.k; renderWallModal(); };
    fl.appendChild(b);
  });
  grid.innerHTML = '';
  // opción "pared libre"
  const free = document.createElement('button');
  free.type = 'button'; free.className = 'wall-opt wall-opt-free' + (WALL ? '' : ' active');
  free.innerHTML = '<div class="wall-opt-svg"><svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="14" width="30" height="42" rx="2" fill="none" stroke="#8a929a" stroke-width="2" stroke-dasharray="4 3"/><rect x="46" y="14" width="30" height="42" rx="2" fill="none" stroke="#8a929a" stroke-width="2" stroke-dasharray="4 3"/><rect x="82" y="14" width="30" height="42" rx="2" fill="none" stroke="#8a929a" stroke-width="2" stroke-dasharray="4 3"/></svg></div>'
    + '<b><span class="es">Pared libre</span><span class="en">Free wall</span></b><small><span class="es">Tú eliges cuántos cuadros y de qué tamaño.</span><span class="en">You choose how many prints and which sizes.</span></small>';
  free.onclick = () => { clearWall(); closeWallModal(); };
  if(wallFilter === 'all') grid.appendChild(free);
  // primero las que se pueden pedir en su talla de siempre, luego las que solo quedan en otra, y las agotadas al final
  const orden = w => (wallInStock(w) ? (w.base ? 1 : 0) : 4) + (wallPreferN && w.n !== wallPreferN ? 2 : 0);
  WALLS.map(w => wallForHueco(w, wallFilter)).filter(Boolean)
    .sort((a, b) => orden(a) - orden(b)).forEach(w => {
    const b = document.createElement('button');
    const ok = wallInStock(w);
    const otras = wallSizes(w).filter(v => wallKOf(v) !== wallKOf(w) && wallInStock(v)).map(v => wallPieceDims(v).replace(/ /g, ''));
    b.type = 'button'; b.className = 'wall-opt' + (WALL && WALL.id === w.id ? ' active' : '') + (ok ? '' : ' sold-out'); b.dataset.id = w.id;
    if(!ok){ b.disabled = true; b.title = 'Sin existencias'; }
    b.innerHTML = '<div class="wall-opt-svg">' + wallSVG(w) + '</div>'
      + '<b>' + w.name + '</b>'
      + '<small>' + w.n + ' <span class="es">cuadros' + (wallSizeKeys(w).length ? ' de ' + wallPieceDims(w) : '') + '</span><span class="en">prints' + (wallSizeKeys(w).length ? ', ' + wallPieceDims(w) : '') + '</span><br>'
      + '<span class="es">Ocupa ' + cm(w.width) + ' × ' + cm(w.height) + ' cm</span><span class="en">Takes ' + w.width + ' × ' + w.height + ' cm</span></small>'
      + '<span class="wall-opt-price">' + wallPrice(w).toFixed(2).replace('.', ',') + '€'
      + (wallPct(w) ? '<s>' + wallGross(w).toFixed(2).replace('.', ',') + '€</s>' : '') + '</span>'
      + (otras.length ? '<em class="wall-sizes"><span class="es">También en ' + otras.join(' y ') + '</span><span class="en">Also in ' + otras.join(' and ') + '</span></em>' : '')
      + (ok ? '' : wallSoldOutTag);
    b.onclick = () => { if(!ok) return; applyWall(w); closeWallModal(); };
    grid.appendChild(b);
  });
}
function openWallModal(){ renderWallModal(); wallModalEl.classList.add('open'); }
/* 14-oct · Quien sube varias fotos sueltas casi siempre quiere colgarlas juntas: se le ofrece verlas
   en un conjunto de ese mismo número de cuadros (el selector los pone primero). Las fotos se quedan. */
function syncSuggest(){
  const b = document.getElementById('edSuggest'); if(!b) return;
  const n = POSTERS.filter(p => p.srcImg).length;
  const hay = !WALL && n >= 2 && n <= 20 && WALLS.some(w => !w.dup && w.n === n && wallInStock(wallPick(w)));
  b.hidden = !hay;
  if(hay) b.innerHTML = '<span class="es">' + n + ' fotos · <b>Míralas juntas en una pared</b> →</span><span class="en">' + n + ' photos · <b>See them together on a wall</b> →</span>';
  // con alguna foto ya puesta, sobra «o prueba con una foto de ejemplo»
  const ej = document.getElementById('btnSample'); if(ej && n > 0) ej.hidden = true;
}
document.getElementById('edSuggest').addEventListener('click', () => {
  wallPreferN = POSTERS.filter(p => p.srcImg).length; wallFilter = 'all';
  openWallModal();
  const g = document.getElementById('wallGrid'); if(g) g.scrollTop = 0;
});
function closeWallModal(){ wallModalEl.classList.remove('open'); }
document.getElementById('btnWalls').addEventListener('click', openWallModal);
/* sin paredes cargadas, o en una página fijada a sobremesa/imán, no hay "conjunto" que elegir:
   son un cuadro suelto por naturaleza, así que también se quita la píldora "Conjunto" de arriba
   (antes solo se ocultaba el botón de abajo, y la de arriba se podía seguir tocando). */
if(!WALLS.length || (_EDCFG.lock && _EDCFG.product && _EDCFG.product !== 'metal')){
  document.getElementById('btnWalls').hidden = true;
  const tw = document.getElementById('toolWall'); if(tw) tw.hidden = true;
}
document.getElementById('btnWallChange').addEventListener('click', openWallModal);
document.getElementById('btnWallFree').addEventListener('click', clearWall);
document.getElementById('wallClose').addEventListener('click', closeWallModal);
wallModalEl.addEventListener('click', e => { if(e.target === wallModalEl) closeWallModal(); });

/* entrada directa: desde una tarjeta de paredes.html / la landing, o por URL (?pared=P12) */
window.MOMENTURIES_openWalls = function(){ openEditorWithType('metal'); openWallModal(); };
window.MOMENTURIES_openWall = function(id, k){
  let base = findWall(id); if(!base){ openEditorWithType('metal'); return; }
  /* repetido de otro conjunto (paredes.js lo marca con `dup`): se abre aquel, en la talla de este */
  if(base.dup && findWall(base.dup)){ k = k || base.pieces[0].size; base = findWall(base.dup); }
  openEditorWithType('metal');
  const w = wallPick(base, k);              // la talla pedida, o la más cercana que tenga existencias
  if(!wallInStock(w)){ openWallModal(); toast('La pared «' + w.name + '» no tiene existencias ahora mismo. Elige otra'); return; }
  applyWall(w);
  if(wallKOf(w) !== (k || wallKOf(base))) toast('Ese tamaño está agotado. Te lo enseñamos con cuadros de ' + wallPieceDims(w) + ' cm');
};
(function wallEntry(){
  const qs = new URLSearchParams(location.search);
  const id = qs.get('pared') || _EDCFG.wall;
  if(id && findWall(id)) window.MOMENTURIES_openWall(id, qs.get('talla'));
})();
/* ?entorno=geo → salón geométrico (versión 1) · ?entorno=<id> → esa foto de entorno */
/* ?entorno=salon|dormitorio (escenas dibujadas). Los ids viejos de foto (salon-claro, aparador,
   salon-luz...) ya no existen en 3D: se quedan en el salón, las fotos están en pared2d.html */
/* 6-oct: las tarjetas de la portada, de paredes.html y de esta misma página traen aquí sus fotos de
   entorno (antes iban a pared2d.html): ?entorno=<id de foto> pone esa foto, en su versión vertical u
   horizontal según la pantalla. Las paredes lisas (pared-beige/blanca/gris) solo existen en 2D: aquí
   se quedan sin entorno, con la composición sola. */
(function roomEntry(){
  const e = new URLSearchParams(location.search).get('entorno'); if(!e) return;
  if(!/^pared-/.test(e)) ROOM_BY_USER = true;
  if(e === 'geo'){ setScene('salon'); return; }
  const r = PHOTO_ROOMS.find(x => x.id === e);
  if(r){
    const g = r.group || r.id, want = isMobileView() ? 'v' : 'h';
    const cands = PHOTO_ROOMS.filter(x => (x.group || x.id) === g);
    /* con conjunto, la foto de esa habitación donde se vea bien; si en ninguna, la mejor otra */
    /* 16-oct (Marc): de una tarjeta de la portada se llega a ESA foto, la misma de la miniatura, sin
       cambiarla por la otra orientación ni por otra habitación. Solo si el conjunto no cabe se busca otra. */
    if(WALL){ if(roomFits(r, WALL)){ setRoom(r); return; }
      const ok = roomFor(r, WALL) || bestRoomFor(WALL); if(ok){ setRoom(ok); return; } }
    setRoom(cands.find(x => x.orient === want) || r);
    return;
  }
  if(/^pared-/.test(e)) return;
  /* con conjunto, un id que ya no existe no manda al 3D: la mejor foto para ese conjunto */
  if(WALL && !SCENES.some(s => s.id === e)){ const ok = bestRoomFor(WALL); if(ok){ setRoom(ok); return; } }
  setScene(e);
})();


/* ═══════════ ENTORNOS: selector + "VER EN MI PARED" ═══════════ */
const roomModalEl = document.getElementById('roomModal');
/* ══════════ SELECTOR DE ENTORNO: lista por tipos, desplegable ══════════ */


function roomCard(o){
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'room-opt' + (o.on ? ' active' : '');
  b.innerHTML = '<span class="room-opt-img"' + (o.img ? ' style="background-image:url(\'' + o.img + '\')"' : ' data-ico="1"') + '>'
      + (o.img ? '' : o.svg || '')
      + (o.dim ? '<em class="room-dim room-dim-' + o.dim.toLowerCase() + '">' + o.dim + '</em>' : '') + '</span>'
    + '<b>' + (o.num ? '<i class="room-n">' + o.num + '</i>' : '') + o.title + '</b>'
    + (o.sub ? '<small>' + o.sub + '</small>' : '');
  b.onclick = o.click;
  if(o.id) b.dataset.id = o.id;          // para localizar la tarjeta (grabación de demos, pruebas)
  return b;
}
function sceneCard(sc){
  sc._n = ++_numEntorno;
  return roomCard({
    num: sc._n,
    on: ROOM_CFG.mode === 'geo' && ROOM_CFG.scene === sc.id,
    img: 'fotos/escenas/' + sc.id + '.webp', dim: '3D',
    title: '<span class="es">' + sc.es + '</span><span class="en">' + sc.en + '</span>',
    sub: '<span class="es">' + sc.des + '</span><span class="en">' + sc.den + '</span>',
    click: () => { ROOM_BY_USER = true; setScene(sc.id); closeRoomModal(); }, id: sc.id
  });
}
function photoCard(r){
  r._n = ++_numEntorno;
  return roomCard({
    num: r._n,
    on: ROOM_CFG.mode === 'photo' && ROOM && ROOM.id === r.id,
    img: r.thumb || r.img, dim: '2D',
    title: r.name,
    sub: '<span class="es">foto real</span><span class="en">real photo</span>',
    click: () => { ROOM_BY_USER = true; setRoom(r); closeRoomModal(); }, id: r.id
  });
}
/* fila de la lista: nombre, cuántas opciones hay y cuál está puesta; al tocar se despliega */
function groupRow(o){
  const row = document.createElement('div');
  row.className = 'room-group' + (o.open ? ' open' : '');
  const head = document.createElement('button');
  head.type = 'button'; head.className = 'room-group-head'; head.dataset.group = o.id;
  head.innerHTML = '<span class="room-group-name">' + o.title + '</span>'
    + '<span class="room-group-meta">' + (o.active ? '<b>' + o.active + '</b> · ' : '') + o.n + ' <span class="es">opciones</span><span class="en">options</span>'
    + (o.dims ? ' · ' + o.dims : '') + '</span>'
    + '<span class="room-group-chev">›</span>';
  head.onclick = () => { grupoAbierto = o.open ? null : o.id; renderRoomModal(); };
  row.appendChild(head);
  if(o.open){
    const grid = document.createElement('div'); grid.className = 'room-group-grid';
    o.cards.forEach(c => grid.appendChild(c));
    row.appendChild(grid);
  }
  return row;
}
function renderRoomModal(){
  const grid = document.getElementById('roomGrid'); if(!grid) return;
  grid.innerHTML = '';
  grid.classList.add('room-list');
  _numEntorno = 0;                       // numeración estable: siempre en el orden de la lista
  const es = document.documentElement.getAttribute('data-lang') !== 'en';

  // arriba, los dos accesos directos: sin entorno y tu pared
  const top = document.createElement('div'); top.className = 'room-group-grid room-top';
  top.appendChild(roomCard({
    on: ROOM_CFG.mode === 'none',
    svg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="4" width="10" height="14" rx="1"/><path d="M3 21h18"/></svg>',
    title: '<span class="es">Sin entorno</span><span class="en">No room</span>',
    sub: '<span class="es">solo el cuadro</span><span class="en">just the print</span>',
    click: () => { clearRoom(); closeRoomModal(); }
  }));
  top.appendChild(roomCard({
    on: !!(ROOM && ROOM.custom),
    img: ROOM && ROOM.custom ? ROOM.img : null, dim: ROOM && ROOM.custom ? '2D' : '',
    svg: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    title: '<span class="es">Mi pared</span><span class="en">My wall</span>',
    sub: ROOM && ROOM.custom ? '<span class="es">tu foto · toca para cambiarla</span><span class="en">your photo · tap to change</span>' : '<span class="es">sube una foto de tu casa</span><span class="en">upload a photo of your home</span>',
    click: () => { closeRoomModal(); openMyWall(); }
  }));
  grid.appendChild(top);

  // un grupo por tipo de habitación (el Sobremesa se apoya: solo entornos con mesa/consola/escritorio)
  GRUPOS_ENTORNO.forEach(G => {
    if(defaultType === 'madera' && !G.mesa) return;
    if((defaultType === 'nevera') !== (G.id === 'nevera')) return;     // el imán, solo neveras; el resto, nunca
    // el Sobremesa solo ve sus propias escenas (se apoya de verdad); el resto de productos
    // nunca ven esas, para no colgar un cuadro a la altura de una mesita de noche
    const scs = defaultType === 'madera'
      ? SCENES.filter(sc => SOBREMESA_SCENES.test(sc.id) && G.test(sc.id))
      : SCENES.filter(sc => !SOBREMESA_SCENES.test(sc.id) && G.test(sc.id));
    const fotos = defaultType === 'madera' || defaultType === 'nevera' ? [] : roomsForCat(G.id);
    if(!scs.length && !fotos.length) return;
    const activa = (ROOM_CFG.mode === 'geo' && scs.find(x => x.id === ROOM_CFG.scene))
                 || (ROOM_CFG.mode === 'photo' && ROOM && !ROOM.custom && fotos.find(x => x.id === ROOM.id));
    const dims = (fotos.length ? '<i class="room-dim-mini room-dim-2d">2D</i> ' : '') + (scs.length ? '<i class="room-dim-mini room-dim-3d">3D</i>' : '');
    grid.appendChild(groupRow({
      id: G.id, open: grupoAbierto === G.id || (!grupoAbierto && !!activa),
      title: '<span class="es">' + G.es + '</span><span class="en">' + G.en + '</span>',
      n: scs.length + fotos.length, dims,
      active: activa ? (activa.es ? (es ? activa.es : activa.en) : activa.name) : '',
      cards: fotos.map(photoCard).concat(scs.map(sceneCard)),
    }));
  });
}
function openRoomModal(){ renderRoomModal(); roomModalEl.classList.add('open'); }
function closeRoomModal(){ roomModalEl.classList.remove('open'); }
document.getElementById('btnRoom').addEventListener('click', openRoomModal);
document.getElementById('btnRoomFree').addEventListener('click', clearRoom);
document.getElementById('roomClose').addEventListener('click', closeRoomModal);
roomModalEl.addEventListener('click', e => { if(e.target === roomModalEl) closeRoomModal(); });

/* ── VER EN MI PARED: foto del cliente + dos puntos de medida + arrastrar la composición ──
   No hay 3D ni IA: la escala la pone el cliente (marca algo que sepa cuánto mide), por eso
   funciona siempre. Después esa foto se usa como entorno, igual que los nuestros. */
const mwEl = document.getElementById('myWallModal'), mwCanvas = document.getElementById('mywallCanvas'), mwCtx = mwCanvas.getContext('2d');
const MW = { img:null, w:0, h:0, step:1, p1:null, p2:null, cx:0, cby:0, drag:null, scale:1, ref:80, grab:null };
const MW_MAX = 2000;                                     // lado mayor de la foto guardada

/* Referencias para dar la escala. Nadie sale a medir el sofá con un metro, pero una puerta,
   un enchufe o la altura del techo los tiene todo el mundo y miden casi lo mismo en toda casa
   española. `cm:0` = "otra medida", que abre el campo para escribirla. */
const MW_REFS = [
  { cm:80,  es:'Una puerta',        en:'A door',            sub:'80 cm' },
  { cm:250, es:'Del suelo al techo', en:'Floor to ceiling', sub:'250 cm' },
  { cm:200, es:'Un sofá de 3 plazas', en:'A 3-seat sofa',    sub:'200 cm' },
  { cm:8,   es:'Un enchufe',        en:'A plug socket',     sub:'8 cm' },
  { cm:0,   es:'Otra cosa',         en:'Something else',    sub:'' },
];
function mwRenderChips(){
  const box = document.getElementById('mywallChips'); if(!box) return;
  box.innerHTML = '';
  MW_REFS.forEach(r => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mywall-chip' + (MW.ref === r.cm ? ' on' : '');
    b.innerHTML = '<b><span class="es">' + r.es + '</span><span class="en">' + r.en + '</span></b>'
      + (r.sub ? '<small>' + r.sub + '</small>' : '');
    b.onclick = () => { MW.ref = r.cm; mwRenderChips(); mwSetStep(MW.step); };
    box.appendChild(b);
  });
  document.getElementById('mywallLenRow').hidden = MW.ref !== 0;
}
function mwRefCm(){
  if(MW.ref === 0) return Math.max(5, +document.getElementById('mywallCm').value || 180);
  return MW.ref;
}

function openMyWall(){
  mwEl.classList.add('open');
  mwSetStep(MW.img ? 2 : 1);
}
function closeMyWall(){ mwEl.classList.remove('open'); }
function mwSetStep(n){
  MW.step = n;
  const es = { 1:'paso 1 de 3 · la foto', 2:'paso 2 de 3 · la medida', 3:'paso 3 de 3 · el sitio' };
  const en = { 1:'step 1 of 3 · the photo', 2:'step 2 of 3 · the size', 3:'step 3 of 3 · the spot' };
  document.getElementById('mywallStep').innerHTML = '<span class="es">' + es[n] + '</span><span class="en">' + en[n] + '</span>';
  document.getElementById('mywallEmpty').hidden = !!MW.img;
  document.getElementById('mywallRefRow').hidden = n !== 2;
  if(n === 2) mwRenderChips();
  const hint = document.getElementById('mywallHint');
  hint.innerHTML = n === 1 ? ''
    : n === 2 ? '<span class="es">Arrastra las dos bolitas a los extremos de algo que salga en la foto y dinos qué es. Los cuadros que ves cambian de tamaño a la vez: cuando parezcan del tamaño real, está bien.</span><span class="en">Drag the two handles to the ends of something in the photo and tell us what it is. The prints resize as you go: when they look life-size, you got it.</span>'
    : '<span class="es">Arrastra la composición hasta donde la quieres. Está a escala real.</span><span class="en">Drag the layout to where you want it. It is to scale.</span>';
  document.getElementById('mywallBack').hidden = n === 1;
  const next = document.getElementById('mywallNext');
  next.hidden = n === 1;
  next.innerHTML = n === 3 ? '<span class="es">Ver mi pared</span><span class="en">See my wall</span>' : '<span class="es">Siguiente</span><span class="en">Next</span>';
  mwDraw();
}
function mwLoad(file){
  const url = URL.createObjectURL(file), img = new Image();
  img.onload = () => {
    const k = Math.min(1, MW_MAX / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth*k); c.height = Math.round(img.naturalHeight*k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    MW.img = c; MW.w = c.width; MW.h = c.height;
    // la regla se coloca sola: si hay que arrastrarla se ve enseguida, y si no, ya vale
    MW.p1 = { x: MW.w*0.28, y: MW.h*0.70 };
    MW.p2 = { x: MW.w*0.60, y: MW.h*0.70 };
    MW.cx = MW.w/2; MW.cby = MW.h*0.62;
    URL.revokeObjectURL(url);
    mwSetStep(2);
  };
  img.onerror = () => { URL.revokeObjectURL(url); toast('No se ha podido abrir la foto'); };
  img.src = url;
}
function mwPxPerCm(){
  if(!MW.p1 || !MW.p2) return 0;
  return Math.hypot(MW.p2.x - MW.p1.x, MW.p2.y - MW.p1.y) / mwRefCm();
}
function mwDraw(){
  const stage = document.getElementById('mywallStage');
  const maxW = Math.max(200, stage.clientWidth || 700), maxH = Math.min(520, Math.round(window.innerHeight*0.5));
  if(!MW.img){ mwCanvas.width = maxW; mwCanvas.height = Math.round(maxW*0.6); mwCtx.clearRect(0,0,mwCanvas.width,mwCanvas.height); return; }
  const k = Math.min(maxW / MW.w, maxH / MW.h);
  MW.scale = k;
  mwCanvas.width = Math.round(MW.w*k); mwCanvas.height = Math.round(MW.h*k);
  mwCtx.drawImage(MW.img, 0, 0, mwCanvas.width, mwCanvas.height);
  const S = v => v*k;
  if(MW.step === 2 && MW.p1 && MW.p2){
    const ax = S(MW.p1.x), ay = S(MW.p1.y), bx = S(MW.p2.x), by = S(MW.p2.y);
    // la línea, con un halo blanco debajo para que se vea sobre cualquier foto
    mwCtx.lineCap = 'round';
    mwCtx.strokeStyle = 'rgba(255,255,255,.9)'; mwCtx.lineWidth = 6;
    mwCtx.beginPath(); mwCtx.moveTo(ax, ay); mwCtx.lineTo(bx, by); mwCtx.stroke();
    mwCtx.strokeStyle = '#1a1a1a'; mwCtx.lineWidth = 2.5;
    mwCtx.beginPath(); mwCtx.moveTo(ax, ay); mwCtx.lineTo(bx, by); mwCtx.stroke();
    // las agarraderas: gordas y con aro blanco, para que se vea que se cogen
    [[ax, ay], [bx, by]].forEach(([x, y]) => {
      mwCtx.beginPath(); mwCtx.arc(x, y, 13, 0, Math.PI*2);
      mwCtx.fillStyle = '#fff'; mwCtx.fill();
      mwCtx.strokeStyle = 'rgba(0,0,0,.18)'; mwCtx.lineWidth = 1; mwCtx.stroke();
      mwCtx.beginPath(); mwCtx.arc(x, y, 6.5, 0, Math.PI*2);
      mwCtx.fillStyle = '#1a1a1a'; mwCtx.fill();
    });
    // la medida, en el centro de la línea
    const txt = mwRefCm() + ' cm';
    mwCtx.font = '700 12px Inter, sans-serif'; mwCtx.textAlign = 'center'; mwCtx.textBaseline = 'middle';
    const mx = (ax + bx)/2, my = (ay + by)/2 - 22, tw = mwCtx.measureText(txt).width + 18;
    mwCtx.fillStyle = 'rgba(26,26,26,.92)';
    mwCtx.beginPath(); mwCtx.roundRect(mx - tw/2, my - 11, tw, 22, 11); mwCtx.fill();
    mwCtx.fillStyle = '#fff'; mwCtx.fillText(txt, mx, my);
    mwCtx.textBaseline = 'alphabetic';
  }
  if(MW.step >= 2 && WALL){
    mwCtx.globalAlpha = MW.step === 2 ? 0.8 : 1;      // en el paso de la medida van en fantasma
    const ppc = mwPxPerCm() || 5;
    const ox = MW.cx - WALL.width/2*ppc, oy = MW.cby - WALL.height*ppc;
    WALL.pieces.forEach((pc, i) => {
      const x = S(ox + pc.x*ppc), y = S(oy + pc.y*ppc), w = S(pc.w*ppc), h = S(pc.h*ppc);
      const p = POSTERS[i];
      mwCtx.fillStyle = 'rgba(0,0,0,.28)'; mwCtx.fillRect(x+3, y+4, w, h);
      if(p && p.thumb){ const im = mwThumb(p); if(im) mwCtx.drawImage(im, x, y, w, h); else { mwCtx.fillStyle='#fff'; mwCtx.fillRect(x,y,w,h); } }
      else { mwCtx.fillStyle = '#fff'; mwCtx.fillRect(x, y, w, h); mwCtx.fillStyle = '#b5ada3'; mwCtx.font = '600 ' + Math.max(9, h*0.14) + 'px Inter, sans-serif'; mwCtx.textAlign = 'center'; mwCtx.fillText(pc.size, x + w/2, y + h/2 + 4); }
      mwCtx.strokeStyle = 'rgba(255,255,255,.5)'; mwCtx.lineWidth = 1; mwCtx.strokeRect(x, y, w, h);
    });
    mwCtx.globalAlpha = 1;
  }
}
const _mwThumbs = {};
function mwThumb(p){
  if(!p.thumb) return null;
  let im = _mwThumbs[p.uid];
  if(im && im.src === p.thumb) return im.complete ? im : null;
  im = new Image(); im.onload = mwDraw; im.src = p.thumb; _mwThumbs[p.uid] = im;
  return null;
}
function mwPos(e){ const r = mwCanvas.getBoundingClientRect(); return { x:(e.clientX - r.left)/MW.scale, y:(e.clientY - r.top)/MW.scale }; }
mwCanvas.addEventListener('pointerdown', e => {
  if(!MW.img) return;
  e.preventDefault();
  const p = mwPos(e);
  if(MW.step === 2){
    // se coge la bolita más cercana; si se toca lejos de las dos, salta la más cercana ahí
    const d1 = Math.hypot(p.x - MW.p1.x, p.y - MW.p1.y), d2 = Math.hypot(p.x - MW.p2.x, p.y - MW.p2.y);
    MW.grab = d1 <= d2 ? 'p1' : 'p2';
    const cerca = Math.min(d1, d2) * MW.scale <= 26;       // 26 px de pantalla: el radio del dedo
    if(!cerca) MW[MW.grab] = p;
    mwCanvas.setPointerCapture(e.pointerId);
    mwDraw(); return;
  }
  if(MW.step === 3){ MW.drag = { x:p.x, y:p.y, cx:MW.cx, cby:MW.cby }; mwCanvas.setPointerCapture(e.pointerId); }
});
mwCanvas.addEventListener('pointermove', e => {
  if(MW.step === 2 && MW.grab){
    const p = mwPos(e);
    MW[MW.grab] = { x: Math.max(0, Math.min(MW.w, p.x)), y: Math.max(0, Math.min(MW.h, p.y)) };
    mwDraw(); return;
  }
  if(MW.step !== 3 || !MW.drag) return;
  const p = mwPos(e);
  MW.cx = MW.drag.cx + (p.x - MW.drag.x); MW.cby = MW.drag.cby + (p.y - MW.drag.y);
  mwDraw();
});
['pointerup','pointercancel'].forEach(ev => mwCanvas.addEventListener(ev, () => { MW.drag = null; MW.grab = null; }));
document.getElementById('mywallCm').addEventListener('input', mwDraw);
document.getElementById('mywallPick').addEventListener('click', () => document.getElementById('mywallFile').click());
document.getElementById('mywallFile').addEventListener('change', e => { if(e.target.files && e.target.files[0]) mwLoad(e.target.files[0]); e.target.value = ''; });
document.getElementById('mywallBack').addEventListener('click', () => { if(MW.step === 2){ MW.img = null; MW.p1 = MW.p2 = null; mwSetStep(1); } else mwSetStep(MW.step - 1); });
document.getElementById('mywallNext').addEventListener('click', () => {
  if(MW.step === 2){
    if(!MW.p1 || !MW.p2){ toast('Coloca las dos bolitas'); return; }
    if(mwPxPerCm() <= 0){ toast('Separa un poco las dos bolitas'); return; }
    mwSetStep(3); return;
  }
  if(MW.step === 3){
    const ppc = mwPxPerCm(); if(!ppc) return;
    _userEdited = true;
    ROOM_BY_USER = true;
    setRoom({ id:'custom', name:'Mi pared', custom:true, img: MW.img.toDataURL('image/jpeg', 0.9), w: MW.w, h: MW.h,
              pxPerCm: ppc, anchorX: MW.cx, anchorBottomY: MW.cby, fg:null, wall:null, fgDepthCm:0 });
    closeMyWall();
    toast('Esta es tu pared. Arrastra los cuadros para colocarlos');
  }
});
document.getElementById('mywallClose').addEventListener('click', closeMyWall);
mwEl.addEventListener('click', e => { if(e.target === mwEl) closeMyWall(); });
window.addEventListener('resize', () => { if(mwEl.classList.contains('open')) mwDraw(); });
