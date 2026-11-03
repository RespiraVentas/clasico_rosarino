// Funciones compartidas por los tests de navegador.

const { expect } = require("@playwright/test");
const { PAGINA_PRINCIPAL } = require("../sitio.config");
const { leerPartidos } = require("../lib/datos");

const DATOS = leerPartidos(PAGINA_PRINCIPAL).partidos || [];

/**
 * Abre una página y va guardando los errores de JavaScript, los mensajes de
 * error de la consola y los archivos locales que no cargaron.
 */
async function abrir(page, ruta = PAGINA_PRINCIPAL) {
  const errores = [];
  page.on("pageerror", (e) => errores.push(`Error de JavaScript: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errores.push(`Consola: ${m.text()}`); });
  page.on("requestfailed", (r) => { if (esLocal(r.url())) errores.push(`No cargó ${r.url()}: ${r.failure()?.errorText}`); });
  page.on("response", (r) => { if (esLocal(r.url()) && r.status() >= 400) errores.push(`${r.status()} al pedir ${r.url()}`); });
  // Bloquear todo lo que no sea el sitio local: los tests no dependen de internet.
  await page.route((url) => !esLocal(url.href), (route) => route.abort());
  await page.goto(ruta);
  return errores;
}

function esLocal(url) {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(url) || url.startsWith("data:") || url.startsWith("blob:");
}

/** Espera a que la página termine de dibujar los datos (el contador con números). */
async function esperarListo(page) {
  await expect(page.locator("#counter b")).toHaveText(/\d/);
}

/** Lee un número como "1.026" o "371" (formato argentino). */
async function numero(locator) {
  const t = (await locator.innerText()).trim();
  const m = /-?[\d.]+/.exec(t.replace(/\s/g, ""));
  if (!m) throw new Error(`No hay un número en "${t}"`);
  return Number(m[0].replace(/\./g, ""));
}

/** Cantidad que muestra el contador de "Todos los clásicos". */
async function contador(page) {
  return numero(page.locator("#counter b"));
}

/** Escribe en el buscador de partidos y espera a que la tabla se actualice. */
async function buscar(page, texto, esperado) {
  await page.locator("#q").fill(texto);
  // La página espera 160 ms después de la última tecla antes de filtrar.
  await page.waitForTimeout(350);
  if (esperado != null) await expect(page.locator("#counter b")).toHaveText(String(esperado));
}

/** Toca "Ver 50 más" hasta que la tabla muestre todas las filas del recorte. */
async function verTodasLasFilas(page) {
  for (let i = 0; i < 50; i++) {
    const mas = page.locator("#moreBtn");
    if (!(await mas.count())) return;
    const antes = await page.locator("#tabla tbody.mt").count();
    await mas.click();
    await expect(page.locator("#tabla tbody.mt")).not.toHaveCount(antes);
  }
  throw new Error("El botón 'Ver más' no termina nunca");
}

module.exports = { DATOS, abrir, esperarListo, numero, contador, buscar, verTodasLasFilas };
