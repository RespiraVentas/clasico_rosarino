// Buscador y filtros de "Todos los clásicos": cada filtro tiene que dejar
// exactamente los partidos que corresponden, según los datos.

const { test, expect } = require("@playwright/test");
const { goleadores, quitarTildes } = require("../lib/datos");
const { DATOS, abrir, esperarListo, contador, buscar, numero, verTodasLasFilas } = require("./ayuda");

const cuenta = (fn) => DATOS.filter(fn).length;
const anotó = (nombre) => (p) => [...p.grc, ...p.gnob].some((g) => g.j === nombre);

test.beforeEach(async ({ page }) => {
  await abrir(page);
  await esperarListo(page);
  await page.locator("#partidos").scrollIntoViewIfNeeded();
});

test("sin filtros, el contador muestra todos los clásicos y 'Limpiar' está apagado", async ({ page }) => {
  expect(await contador(page)).toBe(DATOS.length);
  await expect(page.locator("#clearBtn")).toBeDisabled();
  await expect(page.locator("#cutbar")).not.toHaveClass(/\bon\b/);
});

test("buscar un goleador trae todos los partidos donde hizo goles", async ({ page }) => {
  // El buscador deja los partidos que tienen TODAS las palabras escritas (en
  // goleadores, torneo, estadio, fecha...). Por eso "Manuel González" también trae
  // partidos de "Gerardo Manuel González": eso es esperado.
  for (const club of ["RC", "NOB"]) {
    const [nombre] = goleadores(DATOS, club)[0]; // el máximo goleador de cada club, según los datos
    await buscar(page, nombre);
    await verTodasLasFilas(page);
    const filas = await page.locator("#tabla tbody.mt").evaluateAll((bs) => bs.map((b) => ({ id: +b.dataset.id, txt: b.textContent })));
    expect(filas.length).toBe(await contador(page));
    const ids = new Set(filas.map((f) => f.id));
    const suyos = DATOS.map((p, i) => [p, i]).filter(([p]) => anotó(nombre)(p));
    const faltan = suyos.filter(([, i]) => !ids.has(i)).map(([p]) => p.f);
    expect(faltan, `Al buscar "${nombre}" faltan partidos donde hizo goles`).toEqual([]);
    const palabras = quitarTildes(nombre).split(/\s+/);
    const sobran = filas.filter((f) => !palabras.every((w) => quitarTildes(f.txt).includes(w))).map((f) => DATOS[f.id].f);
    expect(sobran, `Al buscar "${nombre}" aparecen partidos que no tienen esas palabras`).toEqual([]);
  }
});

test("el buscador no distingue mayúsculas ni tildes", async ({ page }) => {
  await buscar(page, "Di María");
  const conTilde = await contador(page);
  expect(conTilde).toBeGreaterThan(0);
  await buscar(page, "DI MARIA", conTilde);
  await buscar(page, "di maria", conTilde);
});

test("una búsqueda sin resultados muestra el aviso 'Ningún clásico'", async ({ page }) => {
  await buscar(page, "zzzz palabra que no existe", 0);
  await expect(page.locator("#empty")).toBeVisible();
  await expect(page.locator("#tabla")).toBeHidden();
  await expect(page.locator("#clearBtn")).toBeEnabled();
});

test("filtro por ámbito, década, año y torneo", async ({ page }) => {
  await page.locator("#fAm").selectOption("Amistoso");
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.am === "Amistoso")));
  await page.locator("#fAm").selectOption("");

  await page.locator("#fDec").selectOption("1930");
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => Math.floor(p.a / 10) * 10 === 1930)));
  await page.locator("#fDec").selectOption("");

  const ultimoAnio = Math.max(...DATOS.map((p) => p.a));
  await page.locator("#fAnio").selectOption(String(ultimoAnio));
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.a === ultimoAnio)));
  await page.locator("#fAnio").selectOption("");

  const torneo = DATOS[DATOS.length - 1].c;
  await page.locator("#fC").selectOption(torneo);
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.c === torneo)));
});

test("las listas de filtros tienen todas las opciones de los datos, sin repetir", async ({ page }) => {
  const opciones = async (sel) => (await page.locator(`${sel} option`).allTextContents()).slice(1);
  const am = await opciones("#fAm");
  expect(new Set(am).size, "Ámbitos repetidos").toBe(am.length);
  expect(am.sort()).toEqual([...new Set(DATOS.map((p) => p.am))].sort());
  const tor = await opciones("#fC");
  expect(new Set(tor).size, "Torneos repetidos").toBe(tor.length);
  expect(tor.length).toBe(new Set(DATOS.map((p) => p.c)).size);
  const anios = await opciones("#fAnio");
  expect(anios.length).toBe(new Set(DATOS.map((p) => p.a)).size);
});

test("los botones de Resultado y Localía filtran bien, y se pueden combinar", async ({ page }) => {
  const chip = (grupo, v) => page.locator(`.chips[data-group="${grupo}"] .chip[data-v="${v}"]`);
  await chip("res", "RC").click();
  await expect(chip("res", "RC")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.g === "RC")));
  await chip("res", "E").click();
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.g === "RC" || p.g === "E")));
  await chip("res", "E").click(); // se desmarca
  await chip("loc", "N").click();
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.g === "RC" && p.sede === "N")));
  await chip("loc", "N").click();
  await chip("loc", "NOB").click();
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.g === "RC" && p.sede !== "N" && p.loc === "NOB")));
});

test("filtrar también cambia los números del balance (no solo la tabla)", async ({ page }) => {
  await page.locator(`.chips[data-group="res"] .chip[data-v="NOB"]`).click();
  const n = cuenta((p) => p.g === "NOB");
  await expect(page.locator("#counter b")).toHaveText(String(n));
  await expect(page.locator("#bTot")).toHaveText(String(n));
  await expect(page.locator("#kNob")).toHaveText(String(n));
  await expect(page.locator("#kRc")).toHaveText("0");
  await expect(page.locator("#cutbar")).toHaveClass(/\bon\b/);
  await expect(page.locator("#cutTxt")).toContainText(`${n} de ${DATOS.length}`);
});

test("'Solo oficiales' y 'Desde cuándo contar' filtran bien", async ({ page }) => {
  const sw = page.locator("#filtros .ofsw-f");
  await sw.locator('[data-of="1"]').click();
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.am !== "Amistoso")));
  await sw.locator('[data-of="0"]').click();
  const eras = page.locator("#filtros .erasw-f");
  await eras.locator('[data-era="amateur"]').click();
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.f < "1931-06-22")));
  await eras.locator('[data-era="afa"]').click();
  await expect(page.locator("#counter b")).toHaveText(String(cuenta((p) => p.f >= "1939-01-01")));
  await eras.locator('[data-era=""]').click();
  await expect(page.locator("#counter b")).toHaveText(String(DATOS.length));
});

test("'Limpiar filtros' vuelve todo a cero", async ({ page }) => {
  await buscar(page, "Final");
  await page.locator("#fAm").selectOption("Nacional");
  await page.locator(`.chips[data-group="res"] .chip[data-v="E"]`).click();
  expect(await contador(page)).toBeLessThan(DATOS.length);
  await page.locator("#clearBtn").click();
  await expect(page.locator("#counter b")).toHaveText(String(DATOS.length));
  await expect(page.locator("#q")).toHaveValue("");
  await expect(page.locator("#fAm")).toHaveValue("");
  await expect(page.locator("#filtros .chip[aria-pressed=true]")).toHaveCount(0);
  await expect(page.locator("#clearBtn")).toBeDisabled();
  expect(await numero(page.locator("#bTot"))).toBe(DATOS.length);
});
