// ════════════════════════════════════════════════════════════════
//  FALLAS CONOCIDAS
//  Errores reales que los tests ya encontraron y que todavía no se
//  arreglaron. Mientras estén en esta lista, el flujo NO queda en rojo
//  por ellos: aparecen como "falla conocida" en el informe.
//
//  Cuando alguien los arregla, el informe avisa "ya está arreglada:
//  se puede sacar de la lista". Sacarla no es obligatorio, pero conviene,
//  así si el error vuelve a aparecer, el test lo frena.
//
//  Un error NUEVO (que no esté acá) sí pone el flujo en rojo.
// ════════════════════════════════════════════════════════════════

const { test } = require("@playwright/test");

/** clave → explicación en lenguaje simple. Ver TESTS.md. */
const FALLAS_CONOCIDAS = {
  // (se completa más abajo, a medida que los tests encuentran errores reales)
};

/**
 * Compara los problemas encontrados contra la lista de fallas conocidas.
 * Devuelve solo los problemas NUEVOS (los que deben hacer fallar el test).
 * Anota en el informe las fallas conocidas y las que ya se arreglaron.
 *
 * @param {{clave:string, detalle:string}[]} problemas
 * @param {string|string[]} prefijo  solo se informan como "arregladas" las claves que empiezan así
 */
function separarConocidas(problemas, prefijo) {
  const info = test.info();
  const vistas = new Set();
  const nuevos = [];
  for (const p of problemas) {
    if (FALLAS_CONOCIDAS[p.clave]) {
      vistas.add(p.clave);
      info.annotations.push({ type: "falla conocida", description: `${p.clave}: ${p.detalle}` });
    } else {
      nuevos.push(p);
    }
  }
  const prefijos = [].concat(prefijo);
  for (const clave of Object.keys(FALLAS_CONOCIDAS)) {
    if (prefijos.some((x) => clave.startsWith(x)) && !vistas.has(clave)) {
      info.annotations.push({ type: "ya está arreglada", description: `${clave}: se puede sacar de tests/lib/fallas-conocidas.js` });
    }
  }
  return nuevos;
}

/**
 * Para tests de navegador que revisan una sola cosa: si la clave está en la
 * lista y el control falla, se anota como falla conocida y el test pasa.
 * Si la clave NO está en la lista, el test falla normalmente.
 */
async function controlar(clave, fn) {
  if (!FALLAS_CONOCIDAS[clave]) return fn();
  try {
    await fn();
    test.info().annotations.push({ type: "ya está arreglada", description: `${clave}: se puede sacar de tests/lib/fallas-conocidas.js` });
  } catch (e) {
    test.info().annotations.push({ type: "falla conocida", description: `${clave}: ${FALLAS_CONOCIDAS[clave]}` });
    console.warn(`⚠ Falla conocida (${clave}): ${FALLAS_CONOCIDAS[clave]}\n   ${String(e.message).split("\n")[0]}`);
  }
}

/** Avisos: cosas para revisar que no son necesariamente errores. Nunca fallan. */
function avisar(texto) {
  test.info().annotations.push({ type: "aviso", description: texto });
}

/** Mensaje legible con la lista de problemas. */
function listar(problemas) {
  return problemas.map((p) => `  • ${p.detalle}  [${p.clave}]`).join("\n");
}

module.exports = { FALLAS_CONOCIDAS, separarConocidas, controlar, avisar, listar };
