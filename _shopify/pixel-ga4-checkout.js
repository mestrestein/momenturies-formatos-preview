/* Píxel personalizado de GA4 para el checkout de Shopify (checkout.momenturies.com) · 16-nov-2026
   Dónde va: Shopify → Configuración → Eventos de clientes → Añadir píxel personalizado → «GA4 checkout».
     · Permiso: Obligatorio → marcar solo «Analíticas».
     · Venta de datos: «Los datos recopilados no se consideran venta de datos».
     · Pegar este archivo entero → Guardar → Conectar.
   Qué manda: add_shipping_info, add_payment_info y purchase (con pedido, importe, envío, IVA y productos).
   begin_checkout NO: ya lo manda la web (consent.js) al pulsar «Pagar», así no se cuenta dos veces.
   Usa la cookie _ga de .momenturies.com que pone la web, para que la compra quede en la misma visita. */
const GA4 = 'G-S59KRN2H2Q';

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

const listo = (async () => {
  let clientId;
  try {
    const ga = await browser.cookie.get('_ga');               // GA1.1.123456789.1700000000
    if (ga) clientId = ga.split('.').slice(-2).join('.');
  } catch (e) {}
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', GA4, Object.assign({ send_page_view: false, cookie_domain: 'momenturies.com' }, clientId ? { client_id: clientId } : {}));
})();

const num = (m) => (m && typeof m.amount === 'number' ? m.amount : 0);
function items(checkout) {
  return (checkout.lineItems || []).map((l) => ({
    item_id: (l.variant && l.variant.product && l.variant.product.id) || (l.variant && l.variant.sku) || '',
    item_name: (l.variant && l.variant.product && l.variant.product.title) || l.title,
    item_variant: l.variant && l.variant.title,
    price: num(l.variant && l.variant.price),
    quantity: l.quantity,
  }));
}
function base(checkout) {
  return { currency: checkout.currencyCode || 'EUR', value: num(checkout.totalPrice), items: items(checkout) };
}
async function enviar(nombre, params, ctx) {
  await listo;
  gtag('event', nombre, Object.assign({ page_location: ctx.document.location.href, page_title: ctx.document.title }, params));
}

analytics.subscribe('checkout_shipping_info_submitted', (e) => {
  const c = e.data.checkout;
  enviar('add_shipping_info', Object.assign(base(c), { shipping_tier: c.delivery && c.delivery.selectedDeliveryOptions && c.delivery.selectedDeliveryOptions[0] && c.delivery.selectedDeliveryOptions[0].title }), e.context);
});

analytics.subscribe('payment_info_submitted', (e) => {
  const c = e.data.checkout;
  enviar('add_payment_info', Object.assign(base(c), { payment_type: c.transactions && c.transactions[0] && c.transactions[0].gateway }), e.context);
});

analytics.subscribe('checkout_completed', (e) => {
  const c = e.data.checkout;
  enviar('purchase', Object.assign(base(c), {
    transaction_id: (c.order && c.order.id) || c.token,
    tax: num(c.totalTax),
    shipping: num(c.shippingLine && c.shippingLine.price),
    coupon: (c.discountApplications || []).map((d) => d.title).filter(Boolean).join(',') || undefined,
  }), e.context);
});
