# Momenturies · la web

Este repositorio ES la web publicada en **https://momenturies.com**.

- Lo que se guarda aquí sale solo en momenturies.com en unos 2 minutos. No hay que subir nada a mano.
- Ya NO se usa Netlify (ni Netlify Drop, ni la carpeta _netlify, ni momenturies-web.zip). Si algún texto habla de Netlify, está desfasado.
- El carrito y el pago son de verdad: la tienda es Shopify (tp6upb-7k.myshopify.com). Al publicar, editor.js se conecta solo a la tienda (dominio, token de Storefront, precios y stock que se leen de Shopify, foto de impresión a Archivos de Shopify). En el repo SHOPIFY.domain y storefrontToken están vacíos a propósito: es normal, no hay que rellenarlos.
- Los formularios (aviso de apertura y contacto) llevan data-netlify por historia, pero ahora los recoge el Vestuario y llegan como nota a los dos socios. No hay que tocarlos.
- Los precios de verdad están en Shopify. Los «Desde X €» de las páginas están escritos a mano: si cambia un precio, cambiarlo en Shopify y aquí.
- No se publican los archivos que empiezan por «_», ni los que llevan LEEME o BACKUP en el nombre.

## Cómo cambiar algo

Desde Claude, con el conector «Vestuario Momenturies» (https://staff.momenturies.com/mcp): se pide el cambio, Claude enseña qué va a tocar, se confirma y en 2 minutos está en la web.

Páginas: / (index.html, la portada), cuadro.html, sobremesa.html, iman.html (editor por producto), producto.html (todos los formatos), paredes.html, nosotros.html, contacto.html y las legales.
