/* ==========================================================================
   Detección de idioma por país/navegador
   - Se ejecuta pronto (en <head>, defer corto) para enrutar al idioma adecuado.
   - Español por defecto. NUNCA euskara por defecto.
   - El euskara solo se sirve si el usuario lo elige explícitamente.
   - Respeta la elección previa guardada y no redirige en bucle.
   ==========================================================================
   Estructura prevista de idiomas (cuando se generen):
     /            -> Español (raíz, por defecto)
     /en/         -> Inglés
     /fr/         -> Francés
     /eu/         -> Euskara  (solo manual, nunca auto)
   De momento solo existe Español; este script queda listo para activar el
   resto cambiando AVAILABLE.
*/
(function () {
  "use strict";

  // Idiomas realmente publicados. Añadir "en", "fr", "eu" cuando existan.
  var AVAILABLE = ["es"]; // p.ej. ["es","en","fr","eu"]
  var DEFAULT = "es";
  // Idiomas que NUNCA deben activarse por detección automática:
  var NEVER_AUTO = ["eu"];

  try {
    var path = location.pathname;
    // Prefijo de idioma actual en la URL, si lo hay
    var seg = path.split("/").filter(Boolean)[0] || "";
    var currentLang = AVAILABLE.indexOf(seg) !== -1 ? seg : DEFAULT;

    // 1) Si el usuario ya eligió idioma, respetarlo y no redirigir.
    var saved = localStorage.getItem("cde_lang");
    if (saved && AVAILABLE.indexOf(saved) !== -1) {
      // Si está en un idioma distinto al guardado, no forzamos: respeta navegación manual.
      return;
    }

    // 2) Detectar idioma del navegador (proxy del país/preferencia del usuario).
    var nav = (navigator.languages && navigator.languages[0]) || navigator.language || DEFAULT;
    var lang = nav.slice(0, 2).toLowerCase();

    // Nunca auto-euskara (ni ningún idioma de NEVER_AUTO).
    if (NEVER_AUTO.indexOf(lang) !== -1) lang = DEFAULT;

    // Si el idioma detectado no está publicado, caer a español.
    if (AVAILABLE.indexOf(lang) === -1) lang = DEFAULT;

    // 3) Redirigir solo si difiere del idioma de la página actual y existe destino.
    if (lang !== currentLang) {
      // Construir destino: raíz para 'es', /xx/ para el resto.
      // (Activar cuando existan las carpetas de idioma.)
      // var target = lang === DEFAULT ? "/" : "/" + lang + "/";
      // location.replace(target);
    }
    // Guardar idioma efectivo para futuras visitas.
    localStorage.setItem("cde_lang", currentLang);
  } catch (e) {
    /* sin-op: ante cualquier fallo, se queda en español */
  }
})();
