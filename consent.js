/* consent.js — aviso de cookies + analítica (Google Analytics 4 y píxel de Meta), en todas las páginas.
   Mientras GA4 y PIXEL estén vacíos no hace nada: sin analítica no hace falta aviso (solo hay almacenamiento técnico).
   Al rellenarlos: aviso con Aceptar / Rechazar al mismo nivel; nada se carga hasta Aceptar.
   GA4 va con Consent Mode v2 (todo «denied» hasta aceptar). La elección se guarda 6 meses en localStorage.
   Cualquier enlace con data-cookies vuelve a abrir el aviso (lo hay en cookies.html). */
(function(){
  var GA4 = '';      // p. ej. 'G-XXXXXXXXXX'
  var PIXEL = '';    // p. ej. '1234567890123456'
  var CLAVE = 'mm-cookies', DURA = 182 * 864e5;

  if(!GA4 && !PIXEL) return;

  function leer(){ try { var v = JSON.parse(localStorage.getItem(CLAVE)); return v && Date.now() - v.t < DURA ? v.ok : null; } catch(e){ return null; } }
  function guardar(ok){ try { localStorage.setItem(CLAVE, JSON.stringify({ ok:ok, t:Date.now() })); } catch(e){} }
  function js(src){ var s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ dataLayer.push(arguments); };
  var cargado = false;
  function activar(){
    if(cargado) return; cargado = true;
    if(GA4){
      gtag('consent', 'update', { analytics_storage:'granted', ad_storage:'granted', ad_user_data:'granted', ad_personalization:'granted' });
      js('https://www.googletagmanager.com/gtag/js?id=' + GA4);
      gtag('js', new Date()); gtag('config', GA4);
    }
    if(PIXEL){
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', PIXEL); fbq('track', 'PageView');
    }
  }
  if(GA4) gtag('consent', 'default', { analytics_storage:'denied', ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied' });

  var en = (document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'es').slice(0, 2) === 'en';
  var T = en
    ? { p:'We use our own and third-party cookies to measure visits and improve our ads. Nothing is turned on until you say yes.', si:'Accept', no:'Reject', mas:'Cookie policy' }
    : { p:'Usamos cookies propias y de terceros para medir las visitas y mejorar nuestros anuncios. No se activa nada hasta que aceptes.', si:'Aceptar', no:'Rechazar', mas:'Política de cookies' };

  var caja;
  function aviso(){
    if(caja){ caja.hidden = false; return; }
    var st = document.createElement('style');
    st.textContent = '.mmck{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483000;max-width:560px;margin:0 auto;background:#fff;color:#1a1a1a;'
      + 'border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.18);padding:18px 20px;font:14px/1.5 var(--font-sans,system-ui,sans-serif)}'
      + '.mmck p{margin:0 0 14px}.mmck a{color:inherit}.mmck-b{display:flex;gap:10px;align-items:center;flex-wrap:wrap}'
      + '.mmck button{flex:1 1 120px;font:inherit;font-weight:700;padding:11px 18px;border-radius:999px;border:1.5px solid #1a1a1a;cursor:pointer}'
      + '.mmck .si{background:#1a1a1a;color:#fff}.mmck .no{background:#fff;color:#1a1a1a}.mmck-m{flex-basis:100%;font-size:12.5px;opacity:.7}';
    document.head.appendChild(st);
    caja = document.createElement('div'); caja.className = 'mmck'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-label', 'Cookies');
    caja.innerHTML = '<p>' + T.p + '</p><div class="mmck-b"><button class="no" type="button">' + T.no + '</button><button class="si" type="button">' + T.si
      + '</button><a class="mmck-m" href="cookies.html">' + T.mas + '</a></div>';
    caja.querySelector('.si').onclick = function(){ guardar(true); caja.hidden = true; activar(); };
    caja.querySelector('.no').onclick = function(){ guardar(false); caja.hidden = true; if(cargado) location.reload(); };
    document.body.appendChild(caja);
  }

  document.addEventListener('click', function(e){ var a = e.target.closest && e.target.closest('[data-cookies]'); if(a){ e.preventDefault(); aviso(); } });
  var ok = leer();
  if(ok === true) activar();
  else if(ok === null){ if(document.body) aviso(); else document.addEventListener('DOMContentLoaded', aviso); }
})();
