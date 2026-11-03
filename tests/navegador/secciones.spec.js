// Secciones interactivas: un día como hoy, año por año, década por década,
// cábalas, comparar épocas, curiosidades y trivia.
// Además de revisar números, se fija que tocar todo no produzca errores.

const { test, expect } = require("@playwright/test");
const { PAGINA_PRINCIPAL } = require("../sitio.config");
const { totales } = require("../lib/datos");
const { DATOS, abrir, esperarListo } = require("./ayuda");

const T = totales(DATOS);
let errores;

test.beforeEach(async ({ page }) => {
  errores = await abrir(page);
  await esperarListo(page);
});
test.afterEach(async () => {
  expect(errores, "Hubo errores de JavaScript durante el test:\n" + errores.join("\n")).toEqual([]);
});

test.describe("un día como hoy", () => {
  // Se fija la fecha de la computadora para que el test dé siempre lo mismo.
  for (const caso of ["con clásicos", "sin clásicos"]) {
    test(`un día ${caso} ese día del año`, async ({ page }) => {
      const conPartido = DATOS[DATOS.length - 1].f; // el último clásico
      let dia = conPartido.slice(5);
      if (caso === "sin clásicos") {
        const usados = new Set(DATOS.map((p) => p.f.slice(5)));
        for (let d = new Date(Date.UTC(2001, 0, 1)); ; d.setUTCDate(d.getUTCDate() + 1)) {
          const k = d.toISOString().slice(5, 10);
          if (!usados.has(k)) { dia = k; break; }
        }
      }
      await page.clock.setFixedTime(new Date(`2030-${dia}T12:00:00-03:00`));
      errores.push(...(await abrir(page)));
      await esperarListo(page);
      const n = DATOS.filter((p) => p.f.slice(5) === dia).length;
      if (n) {
        await expect(page.locator("#hoyOut")).toContainText(`${n} clásico${n === 1 ? "" : "s"}`);
        await expect(page.locator("#hoyOut .hoy-c")).toHaveCount(n);
      } else {
        await expect(page.locator("#hoyOut")).toContainText("Nunca se jugó un clásico");
        await expect(page.locator("#hoyOut .hoy-c")).toHaveCount(3);
      }
    });
  }
});

test("año por año: cada año tiene la cantidad de clásicos correcta y abre sus partidos", async ({ page }) => {
  const botones = page.locator("#aniosOut button.an");
  const anios = new Set(DATOS.map((p) => p.a));
  await expect(botones).toHaveCount(anios.size);
  const etiquetas = await botones.evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label")));
  for (const lab of etiquetas) {
    const [, y, n] = /^(\d{4}): (\d+) clásico/.exec(lab);
    expect.soft(Number(n), `año ${y}`).toBe(DATOS.filter((p) => p.a === Number(y)).length);
  }
  const ultimo = Math.max(...anios);
  await page.locator("#aniosOut button.an", { hasText: String(ultimo) }).first().click();
  await expect(page.locator("#sh")).toBeVisible();
  await expect(page.locator("#shBody .pn-row")).toHaveCount(DATOS.filter((p) => p.a === ultimo).length);
});

test("década por década: tocar una columna muestra su detalle, y otra vez abre sus partidos", async ({ page }) => {
  const col = page.locator("#cols .col").last();
  const dec = Math.max(...T.decadas.keys());
  await col.click();
  await expect(page.locator("#readout")).toContainText(`Década de ${dec}`);
  await expect(page.locator("#readout")).toContainText(`${T.decadas.get(dec).t} clásicos`);
  await col.click();
  await expect(page.locator("#sh")).toBeVisible();
  await expect(page.locator("#shBody .pn-row")).toHaveCount(T.decadas.get(dec).t);
});

test("cábalas: todas las pestañas se dibujan", async ({ page }) => {
  const pestañas = page.locator("#cabOut [data-cab]");
  const n = await pestañas.count();
  expect(n).toBeGreaterThan(1);
  for (let i = 0; i < n; i++) {
    await page.locator("#cabOut [data-cab]").nth(i).click();
    await expect(page.locator("#cabOut [data-cab]").nth(i)).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#cabT")).not.toBeEmpty();
  }
});

test("comparar épocas: cambiar los años recalcula los números", async ({ page }) => {
  const sel = page.locator("#epad");
  const anios = [...new Set(DATOS.map((p) => p.a))].sort((a, b) => a - b);
  await sel.selectOption(String(anios[0]));
  await page.locator("#epah").selectOption(String(anios[anios.length - 1]));
  // Período completo = todos los clásicos (sin el filtro de oficiales).
  await expect(page.locator("#epOut .ep-c").first()).toContainText(`${DATOS.length} clásicos`);
  const kp = page.locator("#epOut .ep-c").first().locator(".ep-kp b");
  await expect(kp.nth(0)).toHaveText(String(T.rc));
  await expect(kp.nth(1)).toHaveText(String(T.e));
  await expect(kp.nth(2)).toHaveText(String(T.nob));
});

test("curiosidades: 'Ver otras curiosidades' cambia sin errores", async ({ page }) => {
  await expect(page.locator("#curs")).not.toBeEmpty();
  for (let i = 0; i < 5; i++) await page.locator("#curMas").click();
  await expect(page.locator("#curs")).not.toBeEmpty();
});

test("trivia: se puede jugar una partida completa de 10 preguntas", async ({ page }) => {
  await page.locator("#tvGo").click();
  for (let i = 1; i <= 10; i++) {
    await expect(page.locator("#tv .tv-top span").first()).toHaveText(`Pregunta ${i} de 10`);
    const ops = page.locator("#tv .tv-op");
    expect(await ops.count(), `La pregunta ${i} tiene menos de 2 opciones`).toBeGreaterThanOrEqual(2);
    const textos = await ops.allInnerTexts();
    expect(new Set(textos).size, `La pregunta ${i} tiene opciones repetidas: ${textos.join(" / ")}`).toBe(textos.length);
    await ops.first().click();
    await expect(page.locator("#tvRes")).toContainText(/¡Bien!|No\./);
    await page.locator("#tvNext").click();
  }
  await expect(page.locator("#tv .tv-fin")).toHaveText(/^\d+\/10$/);
});

test("el historial completo carga igual en la versión elegida aunque se entre con '/index.html'", async ({ page }) => {
  test.skip(!PAGINA_PRINCIPAL.endsWith("/"), "la versión principal ya es un archivo");
  errores.push(...(await abrir(page, PAGINA_PRINCIPAL + "index.html")));
  await expect(page.locator("#counter b")).toHaveText(String(DATOS.length));
});
