// Los números que muestra la página (victorias, empates, goles, totales por
// ámbito y por década...) tienen que coincidir con la suma de los partidos.
// La cuenta "esperada" se hace acá, por separado, sin usar el código de la página.

const { test, expect } = require("@playwright/test");
const { totales, goleadores } = require("../lib/datos");
const { DATOS, abrir, esperarListo, numero } = require("./ayuda");

const T = totales(DATOS);
const fmt = (n) => Number(n).toLocaleString("es-AR");

test.beforeEach(async ({ page }) => {
  await abrir(page);
  await esperarListo(page);
});

test("portada: victorias, empates y total de clásicos", async ({ page }) => {
  await expect(page.locator("#hRc")).toHaveText(fmt(T.rc));
  await expect(page.locator("#hNob")).toHaveText(fmt(T.nob));
  await expect(page.locator("#hE")).toHaveText(`${fmt(T.e)} empate${T.e === 1 ? "" : "s"}`);
  await expect(page.locator("#hTot")).toHaveText(fmt(T.pj));
  await expect(page.locator("#yDesde")).toHaveText(String(T.desde));
  await expect(page.locator("#yHasta")).toHaveText(String(T.hasta));
});

test("balance histórico: totales, porcentajes y goles", async ({ page }) => {
  await expect(page.locator("#bTot")).toHaveText(fmt(T.pj));
  await expect(page.locator("#kRc")).toHaveText(fmt(T.rc));
  await expect(page.locator("#kE")).toHaveText(fmt(T.e));
  await expect(page.locator("#kNob")).toHaveText(fmt(T.nob));
  await expect(page.locator("#gRc")).toHaveText(fmt(T.golesRc));
  await expect(page.locator("#gNob")).toHaveText(fmt(T.golesNob));
  const conRes = T.rc + T.e + T.nob;
  await expect(page.locator("#pRc")).toHaveText(Math.round((T.rc / conRes) * 100) + "%");
  await expect(page.locator("#pNob")).toHaveText(Math.round((T.nob / conRes) * 100) + "%");
  // Victorias + empates + sin resultado = total
  expect(T.rc + T.e + T.nob + T.sinResultado).toBe(T.pj);
  const dif = T.rc - T.nob;
  await expect(page.locator("#bLead")).toContainText(dif > 0 ? `Central +${dif}` : dif < 0 ? `Newell's +${-dif}` : "Igualdad");
  await expect(page.locator("#fInfo")).toHaveText(`${fmt(T.pj)} partidos en el dataset`);
});

test("tabla por ámbito: cada fila y la suma coinciden con los partidos", async ({ page }) => {
  const filas = page.locator("#ambBody tr");
  await expect(filas).toHaveCount(T.ambitos.size);
  let suma = 0;
  for (let i = 0; i < T.ambitos.size; i++) {
    const tds = filas.nth(i).locator("td");
    const am = (await tds.nth(0).textContent()).trim(); // textContent: la página lo muestra en mayúsculas con CSS
    const esp = T.ambitos.get(am);
    expect(esp, `La página muestra un ámbito "${am}" que no está en los datos`).toBeTruthy();
    const pj = await numero(tds.nth(1));
    expect.soft(pj, `PJ de ${am}`).toBe(esp.pj);
    expect.soft(await numero(tds.nth(2)), `victorias de Central en ${am}`).toBe(esp.rc);
    expect.soft(await numero(tds.nth(3)), `empates en ${am}`).toBe(esp.e);
    expect.soft(await numero(tds.nth(4)), `victorias de Newell's en ${am}`).toBe(esp.nob);
    expect.soft((await tds.nth(5).innerText()).replace(/\s/g, ""), `goles en ${am}`).toBe(`${esp.golesRc}–${esp.golesNob}`);
    suma += pj;
  }
  expect(suma, "La suma de PJ por ámbito no da el total de clásicos").toBe(T.pj);
});

test("década por década: cada columna coincide con los partidos", async ({ page }) => {
  const etiquetas = await page.locator("#cols .col").evaluateAll((bs) => bs.map((b) => b.getAttribute("aria-label")));
  let suma = 0;
  for (const lab of etiquetas) {
    const dec = Number(/Década de (\d{4})/.exec(lab)[1]);
    const esp = T.decadas.get(dec) || { t: 0, rc: 0, e: 0, nob: 0 };
    if (!esp.t) { expect.soft(lab).toContain("sin partidos"); continue; }
    expect.soft(lab, `década de ${dec}`).toBe(`Década de ${dec}: ${esp.t} clásicos. Central ${esp.rc}, empates ${esp.e}, Newell's ${esp.nob}`);
    suma += esp.t;
  }
  expect(suma, "Las décadas no suman el total").toBe(T.pj);
});

test("'Según cómo se cuente': cada forma de contar coincide con los partidos", async ({ page }) => {
  const of = (p) => p.am !== "Amistoso";
  const formas = [
    ["Toda la historia", DATOS],
    ["Solo oficiales", DATOS.filter(of)],
    ["Amateurismo", DATOS.filter((p) => of(p) && p.f < "1931-06-22")],
    ["Profesionalismo", DATOS.filter((p) => of(p) && p.f >= "1931-06-22")],
    ["Desde 1939", DATOS.filter((p) => of(p) && p.f >= "1939-01-01")],
  ];
  const filas = page.locator("#cuentaOut .cta-r:not(.h)");
  await expect(filas).toHaveCount(formas.length);
  for (let i = 0; i < formas.length; i++) {
    const [nombre, lista] = formas[i];
    const f = filas.nth(i);
    await expect(f.locator(".n b")).toHaveText(nombre);
    const c = f.locator(".c");
    const cuenta = (g) => lista.filter((p) => p.g === g).length;
    expect.soft(await numero(c.nth(0)), `${nombre}: partidos`).toBe(lista.length);
    expect.soft(await numero(c.nth(1)), `${nombre}: ganó Central`).toBe(cuenta("RC"));
    expect.soft(await numero(c.nth(2)), `${nombre}: empates`).toBe(cuenta("E"));
    expect.soft(await numero(c.nth(3)), `${nombre}: ganó Newell's`).toBe(cuenta("NOB"));
  }
});

test("los botones 'Todos / Solo oficiales' muestran la cantidad correcta", async ({ page }) => {
  const sw = page.locator("#buscador .ofsw");
  await expect(sw.locator('[data-of="0"] small')).toHaveText(fmt(T.pj));
  await expect(sw.locator('[data-of="1"] small')).toHaveText(fmt(T.pj - T.amistosos));
});

test("goleadores históricos: el ranking coincide con los goles de los partidos", async ({ page }) => {
  for (const [club, id] of [["RC", "#scRc"], ["NOB", "#scNob"]]) {
    const esp = goleadores(DATOS, club).slice(0, 12);
    const filas = page.locator(`${id} .srow`);
    await expect(filas).toHaveCount(esp.length);
    for (let i = 0; i < esp.length; i++) {
      // Con empates en la cantidad, el orden es alfabético; se compara la cantidad de goles.
      expect.soft(await numero(filas.nth(i).locator(".gl")), `${club} puesto ${i + 1}`).toBe(esp[i][1]);
    }
    const nombres = await filas.locator(".nm").allInnerTexts();
    for (const [j, g] of esp) if (esp.filter((x) => x[1] === g).length === 1) expect.soft(nombres, `${club}: falta ${j}`).toContain(j);
  }
});
