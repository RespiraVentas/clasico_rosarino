// La tabla "Todos los clásicos": que muestre cada partido con su fecha,
// resultado y ganador correctos, que se pueda ordenar, ver más filas y abrir
// el detalle de goleadores.

const { test, expect } = require("@playwright/test");
const { fechaCorta } = require("../lib/datos");
const { DATOS, abrir, esperarListo, verTodasLasFilas } = require("./ayuda");

const PILL = { RC: "Central", NOB: "Newell's", E: "Empate", "-": "Sin result." };
const porFecha = (orden) => DATOS.map((p, i) => ({ ...p, _i: i })).sort((a, b) => (a.f < b.f ? -orden : a.f > b.f ? orden : 0));

test.beforeEach(async ({ page }) => {
  await abrir(page);
  await esperarListo(page);
  await page.locator("#partidos").scrollIntoViewIfNeeded();
});

test("muestra 50 partidos y 'Ver más' agrega de a 50 hasta completar", async ({ page }) => {
  const filas = page.locator("#tabla tbody.mt");
  await expect(filas).toHaveCount(Math.min(50, DATOS.length));
  if (DATOS.length > 50) {
    await expect(page.locator("#moreBtn")).toContainText(`quedan ${DATOS.length - 50}`);
    await page.locator("#moreBtn").click();
    await expect(filas).toHaveCount(Math.min(100, DATOS.length));
  }
  await verTodasLasFilas(page);
  await expect(filas).toHaveCount(DATOS.length);
  await expect(page.locator("#moreBtn")).toHaveCount(0);
});

test("cada fila coincide con los datos: fecha, ganador y goles (todas las filas)", async ({ page }) => {
  await verTodasLasFilas(page);
  const filas = await page.locator("#tabla tbody.mt").evaluateAll((bs) => bs.map((b) => ({
    id: +b.dataset.id,
    fecha: b.querySelector(".c-f .d1").textContent.trim(),
    pill: b.querySelector(".c-g .pill").textContent.trim(),
    goles: [...b.querySelectorAll(".c-r .g")].map((g) => g.textContent.trim()),
    local: b.querySelector(".c-r .tl").textContent.trim(),
  })));
  const esperado = porFecha(-1); // más recientes primero (orden inicial)
  expect(filas.map((f) => f.id), "El orden inicial no es 'más recientes primero'").toEqual(esperado.map((p) => p._i));
  const errores = [];
  for (const f of filas) {
    const p = DATOS[f.id];
    if (f.fecha !== fechaCorta(p.f)) errores.push(`${p.f}: la tabla dice fecha ${f.fecha}`);
    if (f.pill !== PILL[p.g]) errores.push(`${p.f}: la tabla dice ganador "${f.pill}" y los datos ${p.g}`);
    const local = p.loc === "RC" ? "Central" : "Newell's";
    if (f.local !== local) errores.push(`${p.f}: la tabla muestra local a ${f.local} y los datos a ${local}`);
    if (p.j) {
      const esp = p.loc === "RC" ? [p.rc, p.nob] : [p.nob, p.rc];
      if (f.goles.join("-") !== esp.join("-")) errores.push(`${p.f}: la tabla dice ${f.goles.join("-")} y los datos ${esp.join("-")}`);
    }
  }
  expect(errores, errores.join("\n")).toEqual([]);
});

test("ordenar con la lista 'Ordenar por'", async ({ page }) => {
  test.skip(test.info().project.name !== "celular", "la lista 'Ordenar por' solo aparece en pantallas chicas");
  const primeraFecha = () => page.locator("#tabla tbody.mt").first().locator(".c-f .d1");
  await page.locator("#sortM").selectOption("f:1");
  await expect(primeraFecha()).toHaveText(fechaCorta(porFecha(1)[0].f));
  await page.locator("#sortM").selectOption("f:-1");
  await expect(primeraFecha()).toHaveText(fechaCorta(porFecha(-1)[0].f));
  // "Mejor para Central": el primero es la mayor diferencia a favor de Central.
  await page.locator("#sortM").selectOption("res:-1");
  const mejor = Math.max(...DATOS.filter((p) => p.j).map((p) => p.rc - p.nob));
  const primero = DATOS[+(await page.locator("#tabla tbody.mt").first().getAttribute("data-id"))];
  expect(primero.rc - primero.nob).toBe(mejor);
});

test("ordenar tocando los títulos de las columnas", async ({ page }) => {
  test.skip(test.info().project.name === "celular", "en celular la tabla no muestra títulos de columna (se usa 'Ordenar por')");
  const th = page.locator('th[data-sort="f"]');
  await expect(th).toHaveAttribute("aria-sort", "descending");
  await th.locator("button").click();
  await expect(th).toHaveAttribute("aria-sort", "ascending");
  await expect(page.locator("#tabla tbody.mt").first().locator(".c-f .d1")).toHaveText(fechaCorta(porFecha(1)[0].f));
  await page.locator('th[data-sort="c"] button').click();
  await expect(page.locator('th[data-sort="c"]')).toHaveAttribute("aria-sort", "ascending");
  await expect(th).not.toHaveAttribute("aria-sort", /.+/);
});

test("abrir y cerrar el detalle de un partido muestra sus goleadores", async ({ page }) => {
  const fila = page.locator("#tabla tbody.mt").first();
  const p = DATOS[+(await fila.getAttribute("data-id"))];
  const boton = fila.locator(".xbtn");
  await expect(fila.locator("tr.det")).toBeHidden();
  await boton.click();
  await expect(fila.locator("tr.det")).toBeVisible();
  await expect(boton).toHaveAttribute("aria-expanded", "true");
  for (const g of [...p.grc, ...p.gnob]) await expect(fila.locator("tr.det")).toContainText(g.j);
  await expect(fila.locator("tr.det")).toContainText(p.fx);
  await boton.click();
  await expect(fila.locator("tr.det")).toBeHidden();
  await expect(boton).toHaveAttribute("aria-expanded", "false");
});

test("desde el detalle se abre la ficha del partido", async ({ page }) => {
  const fila = page.locator("#tabla tbody.mt").first();
  const p = DATOS[+(await fila.getAttribute("data-id"))];
  await fila.locator(".xbtn").click();
  await fila.getByRole("button", { name: /Abrir ficha del partido/ }).click();
  await expect(page.locator("#sh")).toBeVisible();
  await expect(page.locator("#shBody")).toContainText(p.c);
  await page.locator("#shX").click();
  await expect(page.locator("#sh")).toBeHidden();
});
