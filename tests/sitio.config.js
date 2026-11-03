// ════════════════════════════════════════════════════════════════
//  QUÉ VERSIÓN DEL SITIO SE REVISA
//  Es lo único que hay que tocar si la versión principal cambia.
// ════════════════════════════════════════════════════════════════
//
// PAGINA_PRINCIPAL: carpeta de la versión que se considera "la web real".
//   "/"         → el index.html de la raíz del repositorio (opción actual)
//   "/prueba/"  → la versión de prueba
//
// También se puede cambiar sin editar este archivo, al correr los tests:
//   PAGINA=/prueba/ npm test
//
// Sobre la versión principal corren TODOS los tests (navegador + datos), y si
// algo falla, el flujo queda en rojo.
// Las OTRAS_VERSIONES se revisan solo con controles livianos (que carguen sin
// errores, links e imágenes). Sus problemas de datos se informan como avisos
// y nunca ponen el flujo en rojo.

const PAGINA_PRINCIPAL = normalizar(process.env.PAGINA || "/");

const TODAS_LAS_VERSIONES = ["/", "/prueba/", "/revision/"];

const OTRAS_VERSIONES = TODAS_LAS_VERSIONES.filter((v) => v !== PAGINA_PRINCIPAL);

// Puerto del servidor local donde se sirve el sitio durante los tests.
// No depende de ningún dominio: los tests nunca entran a internet.
const PUERTO = Number(process.env.PUERTO || 4173);

function normalizar(p) {
  let s = String(p).trim();
  if (!s.startsWith("/")) s = "/" + s;
  if (!s.endsWith("/") && !s.endsWith(".html")) s += "/";
  return s;
}

module.exports = { PAGINA_PRINCIPAL, OTRAS_VERSIONES, TODAS_LAS_VERSIONES, PUERTO };
