# Área de cliente en momenturies.com/cuenta.html: qué hay que hacer en Shopify

Guía paso a paso para Marc. Comprobado el 30-oct-2026 contra la documentación de Shopify y contra la propia tienda.

## Lo que ya sabemos de la tienda (no hay que buscarlo)

- **Shop ID: `108862079310`**. Sale del archivo público de la tienda
  `https://tp6upb-7k.myshopify.com/.well-known/openid-configuration` (también funciona en `checkout.momenturies.com`).
- Las "cuentas de cliente nuevas" ya responden en la tienda (esos archivos existen), así que casi seguro ya están activadas. El paso 1 sirve para confirmarlo.
- Versión de la API que toca usar ahora: **2026-10**.

## Paso 1. Confirmar que están activadas las cuentas de cliente nuevas

1. Admin de Shopify → **Configuración** → **Cuentas de cliente**.
2. En el bloque de cuentas para la tienda online y el checkout, pulsa **Editar**.
3. Marca **Cuentas de cliente** (las nuevas, con código por email, sin contraseña). **Guardar**.

Las cuentas antiguas (con contraseña) están retiradas y no funcionan con esta API.

## Paso 2. Instalar el canal "Headless"

1. Admin → **Configuración** → **Aplicaciones y canales de venta** → **Shopify App Store**.
2. Busca **Headless** (la de Shopify) e instálala.
3. Si ya está instalada (es posible, porque la web crea carritos con la Storefront API), no hace falta hacer nada más aquí.

Necesitas permiso de "Aplicaciones y canales" en la tienda. No hace falta Shopify Plus. La documentación no pide ningún plan concreto.

## Paso 3. Crear (o abrir) el storefront y sacar el Client ID

1. Admin → **Canales de venta** → **Headless** → abre el storefront (o pulsa **Crear storefront** si no hay ninguno).
2. Entra en **Customer Account API** → **Ajustes de la Customer Account API**.
3. En **Credenciales**, el tipo de cliente tiene que ser **Público** (en inglés "Public"). Si pide elegir subtipo, elige **Web**. No queremos un cliente "confidencial": ese necesita un servidor que guarde un secreto.
4. Copia el **Client ID**. Es lo único que hay que pasar al código (no es secreto, puede ir en la página).
5. En **Permisos**, deja marcados los de leer cliente y **leer pedidos** (`customer_read_orders`). Sin ese, no salen los pedidos.

## Paso 4. Rellenar las direcciones permitidas

En la misma pantalla, **Configuración de la aplicación** (Application setup):

**URL de callback (Callback URI)**, una por línea:
```
https://momenturies.com/cuenta.html
https://momenturies.com/vista-cambios/cuenta.html
```

**Orígenes de JavaScript (JavaScript origins)**:
```
https://momenturies.com
```
(Es el dominio solo, sin barra final ni ruta. Cubre las dos páginas porque las dos están en momenturies.com.)

**URL de cierre de sesión (Logout URI)**:
```
https://momenturies.com/cuenta.html
https://momenturies.com/vista-cambios/cuenta.html
```

Guardar.

**localhost NO vale.** Shopify lo dice tal cual: no admite `localhost` ni ninguna dirección `http`. Para probar en el ordenador hay que usar un túnel (ngrok, Cloudflare Tunnel) con dirección `https`, y añadir esa dirección también en los tres campos. Lo más fácil: probar directamente en `momenturies.com/vista-cambios/cuenta.html`.

## Paso 5. Pasar al código estos datos

- Client ID: (el del paso 3)
- Shop ID: `108862079310`
- Nada más. No hay secreto.

## Paso 6. Prueba con un pedido real de prueba

1. Haz un pedido de prueba como invitado (sin iniciar sesión) con un email tuyo y un producto que lleve la foto.
2. Entra en `momenturies.com/vista-cambios/cuenta.html`, inicia sesión con ese mismo email (llega un código).
3. Mira si sale el pedido y **si sale la foto** (ver el aviso de abajo).

## Aviso importante: la foto del pedido

Las fotos del pedido se guardan en propiedades que empiezan por guion bajo (por ejemplo `_foto_frontal`). Shopify las trata como "ocultas" para el cliente. La documentación de esta API no dice si las devuelve o no. Por eso la prueba del paso 6 decide:

- **Si la foto sale:** listo.
- **Si no sale:** hay dos arreglos, de más limpio a menos:
  1. **Copiar la foto a un "metacampo" del pedido** cuando entra el pedido (con Shopify Flow o con el worker de Cloudflare al recibir el aviso de pedido nuevo) y dar permiso de lectura de ese metacampo a las cuentas de cliente (Admin → Configuración → Metacampos → Pedidos → el metacampo → acceso "Customer Account API: leer"). Así la página lo lee directamente, sin servidor.
  2. **Que el worker de Cloudflare de momenturies.com lo sirva:** la página le manda el token del cliente, el worker pregunta a Shopify con ese token qué pedidos son suyos y luego lee las fotos de esos pedidos con la API de administración (que sí ve las propiedades con guion bajo). El worker nunca enseña pedidos que no sean de ese cliente.

## Pedidos hechos antes como invitado

Shopify guarda cada pedido en la ficha del cliente de ese email, aunque haya comprado sin cuenta. Cuando la persona entra con el mismo email, ve esos pedidos. Si usó otro email, no. Se confirma en el paso 6.

## Fuentes

- Primeros pasos con la Customer Account API (requisitos, Client ID, callback, orígenes, localhost): https://shopify.dev/docs/storefronts/headless/building-with-the-customer-account-api/getting-started
- Referencia de la API (direcciones, versión 2026-10, cabecera, límites): https://shopify.dev/docs/api/customer
- Pedido: https://shopify.dev/docs/api/customer/latest/objects/Order
- Línea de pedido: https://shopify.dev/docs/api/customer/latest/objects/LineItem
- Envío: https://shopify.dev/docs/api/customer/latest/objects/Fulfillment
