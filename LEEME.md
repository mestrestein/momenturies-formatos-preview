# Momenturies · la web

Este repositorio ES la web publicada en **https://momenturies.com**.

- Lo que se guarda aquí sale solo en momenturies.com en unos 2 minutos. No hay que subir nada a mano.
- La web se sirve desde este repo (GitHub Pages) a través de Cloudflare, con el worker momenturies-web del Vestuario delante. No hay otro hosting ni hay que subir carpetas o zips a ningún sitio.
- El carrito y el pago son de verdad: la tienda es Shopify (tp6upb-7k.myshopify.com). Al publicar, editor.js se conecta solo a la tienda (dominio, token de Storefront, precios y stock que se leen de Shopify, foto de impresión a Archivos de Shopify). En el repo SHOPIFY.domain y storefrontToken están vacíos a propósito: es normal, no hay que rellenarlos.
- Los formularios (aviso de apertura y contacto) los recoge el Vestuario: el worker de momenturies.com reenvía cualquier POST de la web y llega como nota a los dos socios. El campo oculto bot-field es el antispam y el form-name dice qué formulario es: no quitarlos.
- Los precios de verdad están en Shopify. Los «Desde X €» de las páginas están escritos a mano: si cambia un precio, cambiarlo en Shopify y aquí.
- No se publican los archivos que empiezan por «_», ni los que llevan LEEME o BACKUP en el nombre.

## Dónde está cada texto

- La portada es index.html. momenturies.html es una copia idéntica: si se cambia una, cambiar también la otra.
- Los textos de la portada (titular, subtítulo, botones…) están escritos en index.html, dentro de los <span class="es"> y <span class="en"> (español e inglés). Hay que cambiar los dos idiomas.
- angles.js YA NO SE USA: la portada no lo carga. Cambiar textos ahí no tiene ningún efecto en la web.

## Cómo cambiar algo

Desde Claude, con el conector «Vestuario Momenturies» (https://staff.momenturies.com/mcp): se pide el cambio, Claude enseña qué va a tocar, se confirma y en 2 minutos está en la web.

Páginas: / (index.html, la portada), cuadro.html, sobremesa.html, iman.html (editor por producto), producto.html (todos los formatos), paredes.html, nosotros.html, contacto.html y las legales.
