/* photo-handoff.js — pasar LAS FOTOS del cliente de una página a otra sin perder resolución.
   (11-oct: antes solo dejaba elegir una; ahora las que quiera, y se guarda la lista.)
   La landing la guarda al elegirla y la página de producto la recoge y abre el editor con ella.

   Se usa IndexedDB (no localStorage) a propósito: guarda el File original tal cual, sin
   convertirlo a texto ni reducirlo, así la foto que llega a imprenta es la del móvil.

   En la página que ENVÍA (la landing):
     <script src="photo-handoff.js"></script>
     y en el enlace:  <a href="cuadro.html" data-photo-pick>Crear mi cuadro</a>
     (sin JS el enlace sigue funcionando: lleva a la página de producto de siempre)

   En la página que RECOGE (las de producto): basta con cargarlo antes de editor.js.
   editor.js llama a MOMENTURIES_PHOTO.take() al arrancar. */
(function () {
  var DB = 'momenturies', STORE = 'handoff', KEY = 'photo';

  function open() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(STORE, mode), s = t.objectStore(STORE), out;
        out = fn(s);
        t.oncomplete = function () { db.close(); res(out && out.result !== undefined ? out.result : undefined); };
        t.onerror = function () { db.close(); rej(t.error); };
      });
    });
  }

  /* almacén genérico sobre la misma base de datos (lo usa el autoguardado del editor) */
  window.MOMENTURIES_STORE = {
    put: function (k, v) { return tx('readwrite', function (s) { s.put(v, k); }); },
    get: function (k) { return tx('readonly', function (s) { return s.get(k); }).catch(function () { return undefined; }); },
    del: function (k) { return tx('readwrite', function (s) { s.delete(k); }).catch(function () {}); }
  };

  var API = {
    put: function (file) { return tx('readwrite', function (s) { s.put(file, KEY); }); },
    // devuelve lo guardado (un File o una lista de File) y lo borra: solo se recoge una vez
    take: function () {
      return tx('readonly', function (s) { return s.get(KEY); }).then(function (file) {
        if (file) tx('readwrite', function (s) { s.delete(KEY); }).catch(function () {});
        return file || null;
      }).catch(function () { return null; });
    }
  };
  window.MOMENTURIES_PHOTO = API;

  // ── enlaces que piden la foto antes de navegar ──────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    var links = [].slice.call(document.querySelectorAll('[data-photo-pick]'));
    if (!links.length || !window.indexedDB) return;

    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.multiple = true; input.hidden = true;
    document.body.appendChild(input);
    var dest = 'cuadro.html';

    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        dest = a.getAttribute('href') || dest;
        input.value = '';
        input.click();
      });
    });

    input.addEventListener('change', function () {
      var files = [].slice.call(input.files || []);
      if (!files.length) return;
      links.forEach(function (a) { a.classList.add('is-loading'); });
      API.put(files)
        .then(function () { location.href = dest + (dest.indexOf('?') < 0 ? '?' : '&') + 'foto=1'; })
        .catch(function () { location.href = dest; });   // si IndexedDB falla, se va igual
    });
  });
})();
