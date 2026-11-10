/* lazy-bg.js (10-nov-2026): los fondos de debajo de la primera pantalla llevan data-bg en vez de background-image
   (los pone _perf.py) y se descargan cuando se acercan a la pantalla. Sin IntersectionObserver, todos al cargar. */
(function () {
  var put = function (el) { el.style.backgroundImage = 'url(' + el.getAttribute('data-bg') + ')'; el.removeAttribute('data-bg'); };
  var all = function () { return [].slice.call(document.querySelectorAll('[data-bg]')); };
  if (!('IntersectionObserver' in window)) { all().forEach(put); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { put(e.target); io.unobserve(e.target); } });
  }, { rootMargin: '600px 300px' });
  var mira = function () { all().forEach(function (el) { if (!el.__lazyBg) { el.__lazyBg = 1; io.observe(el); } }); };
  mira();
  /* lo que se pinta después con JS (carruseles, filtros) también */
  if ('MutationObserver' in window) new MutationObserver(mira).observe(document.body, { childList: true, subtree: true });
})();
