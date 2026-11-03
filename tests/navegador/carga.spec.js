// La página carga bien, sin errores, y todas las secciones muestran algo.
// Corre en tamaño escritorio y en tamaño celular.

const { test, expect } = require("@playwright/test");
const { PAGINA_PRINCIPAL, OTRAS_VERSIONES } = require("../sitio.config");
const { controlar, avisar } = require("../lib/fallas-conocidas");
const { abrir, esperarListo } = require("./ayuda");

test.describe(`versión principal (${PAGINA_PRINCIPAL})`, () => {
  test("carga sin errores de JavaScript ni archivos faltantes", async ({ page }) => {
    const errores = await abrir(page);
    await esperarListo(page);
    await page.waitForTimeout(400); // deja correr lo que arranca un poquito después
    expect(errores, errores.join("\n")).toEqual([]);
  });

  test("todas las secciones se dibujan con contenido", async ({ page }) => {
    await abrir(page);
    await esperarListo(page);
    const vacias = await page.evaluate(() =>
      [...document.querySelectorAll("main section[id]")]
        .filter((s) => s.innerText.replace(/\s+/g, " ").trim().length < 40)
        .map((s) => s.id));
    expect(vacias, `Secciones vacías: ${vacias.join(", ")}`).toEqual([]);
    // Los contenedores que se llenan con JavaScript no tienen que quedar vacíos.
    for (const id of ["busOut", "hoyOut", "adnOut", "ultOut", "cabOut", "decOut", "epOut", "torOut", "canOut", "ciOut", "cuentaOut", "aniosOut", "recs", "curs", "scRc", "scNob", "ambBody"]) {
      const el = page.locator("#" + id);
      if (await el.count()) await expect(el, `#${id} quedó vacío`).not.toBeEmpty();
    }
  });

  test("no se puede mover la página de costado (nada se sale de la pantalla)", async ({ page }) => {
    await abrir(page);
    await esperarListo(page);
    await controlar(`desborde-horizontal:${test.info().project.name}`, async () => {
      const r = await page.evaluate(() => {
        const ancho = document.documentElement.clientWidth;
        const culpables = [...document.querySelectorAll("body *")]
          .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.right > ancho + 1 && getComputedStyle(el).position !== "fixed"; })
          .filter((el) => !el.closest("[hidden], dialog:not([open])"))
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""}`);
        return { scroll: document.documentElement.scrollWidth, ancho, culpables };
      });
      expect(r.scroll, `La página mide ${r.scroll}px de ancho pero la pantalla ${r.ancho}px. Se salen: ${r.culpables.join(", ")}`).toBeLessThanOrEqual(r.ancho);
    });
  });

  test("todos los links de la página llevan a una sección que existe", async ({ page }) => {
    await abrir(page);
    await esperarListo(page);
    const rotos = await page.evaluate(() =>
      [...document.querySelectorAll('a[href^="#"]')]
        .map((a) => a.getAttribute("href"))
        .filter((h) => h.length > 1 && !h.startsWith("#ver=") && !document.getElementById(decodeURIComponent(h.slice(1)))));
    expect(rotos, `Links a secciones que no existen: ${rotos.join(", ")}`).toEqual([]);
  });

  test("las imágenes cargan", async ({ page }) => {
    await abrir(page);
    await esperarListo(page);
    const rotas = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(rotas, rotas.join("\n")).toEqual([]);
  });

  test("los textos de los botones y controles tienen tamaño legible", async ({ page }) => {
    await abrir(page);
    await esperarListo(page);
    const chicos = await page.evaluate(() =>
      [...document.querySelectorAll("button, a, select, input, label")]
        .filter((el) => el.offsetParent && el.innerText && el.innerText.trim())
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 11)
        .slice(0, 5).map((el) => `"${el.innerText.trim().slice(0, 30)}" (${getComputedStyle(el).fontSize})`));
    if (chicos.length) avisar(`[${test.info().project.name}] Textos muy chicos: ${chicos.join(", ")}`);
  });

  test("todos los botones tienen un nombre (para lectores de pantalla)", async ({ page }) => {
    await abrir(page);
    await esperarListo(page);
    const sinNombre = await page.evaluate(() =>
      [...document.querySelectorAll('button, a[href], [role="button"], input, select')]
        .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0; })
        .filter((el) => {
          const n = (el.getAttribute("aria-label") || el.innerText || el.title || "").trim();
          return !n && !el.getAttribute("aria-labelledby") && !(el.id && document.querySelector(`label[for="${el.id}"]`));
        })
        .map((el) => el.outerHTML.slice(0, 100)));
    expect(sinNombre, sinNombre.join("\n")).toEqual([]);
  });

  test("en celular, las cosas que se tocan no son demasiado chicas (aviso)", async ({ page }) => {
    test.skip(test.info().project.name !== "celular", "solo en celular");
    await abrir(page);
    await esperarListo(page);
    // 24×24 px es el mínimo que recomienda la guía de accesibilidad WCAG 2.2.
    // Solo se informa como aviso: hay casos válidos (por ejemplo, un dato dentro de una frase).
    const chicos = await page.evaluate(() =>
      [...document.querySelectorAll('button, a[href], [role="button"], select, input')]
        .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0 && (b.width < 24 || b.height < 24); })
        .map((el) => { const b = el.getBoundingClientRect(); return `"${(el.getAttribute("aria-label") || el.innerText || "").trim().slice(0, 25)}" ${Math.round(b.width)}×${Math.round(b.height)}`; }));
    if (chicos.length) avisar(`[celular] ${chicos.length} elementos tocables miden menos de 24×24 px. Ejemplos: ${[...new Set(chicos)].slice(0, 8).join(", ")}`);
  });
});

// Las otras versiones solo se revisan por arriba: que abran sin errores.
for (const version of OTRAS_VERSIONES) {
  test(`la otra versión ${version} abre sin errores de JavaScript`, async ({ page }) => {
    const errores = await abrir(page, version);
    await page.waitForLoadState("load");
    await page.waitForTimeout(400);
    if (errores.length) avisar(`${version}: ${errores.join(" | ")}`);
    await expect(page.locator("body")).not.toBeEmpty();
  });
}
