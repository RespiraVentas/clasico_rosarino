// Moverse por el sitio: menú de secciones, links internos, links compartidos
// (#ver=...), el panel que se abre al tocar un dato y el botón "atrás".

const { test, expect } = require("@playwright/test");
const { PAGINA_PRINCIPAL } = require("../sitio.config");
const { goleadores } = require("../lib/datos");
const { DATOS, abrir, esperarListo } = require("./ayuda");

const enPantalla = (page, sel) => page.locator(sel).evaluate((el) => {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
});

test.beforeEach(async ({ page }) => {
  await abrir(page);
  await esperarListo(page);
});

test("el menú '☰ Secciones' lista todas las secciones y lleva a cada una", async ({ page }) => {
  const secciones = await page.locator("main section[id]:has(.sec-head h2)").evaluateAll((ss) => ss.map((s) => s.id));
  expect(secciones.length).toBeGreaterThan(5);
  for (const id of [secciones[1], secciones[secciones.length - 1], "partidos"]) {
    await page.locator(".flot .menu").click();
    await expect(page.locator("#sh")).toBeVisible();
    await expect(page.locator("#shBody [data-ir]")).toHaveCount(secciones.length + 1); // + "Volver al principio"
    await page.locator(`#shBody [data-ir="${id}"]`).click();
    await expect(page.locator("#sh")).toBeHidden();
    await expect.poll(() => enPantalla(page, "#" + id), { message: `La sección #${id} no quedó en pantalla` }).toBe(true);
  }
});

test("el botón de la portada 'clásicos · buscar partidos' lleva a la tabla", async ({ page }) => {
  await page.locator(".hero-cta").click();
  await expect(page).toHaveURL(/#partidos$/);
  await expect.poll(() => enPantalla(page, "#partidos")).toBe(true);
});

test("buscador rápido: 'Buscá un partido' lleva al buscador y 'Buscá un año' abre los años", async ({ page }) => {
  await page.locator('[data-bus="par"]').click();
  await expect(page.locator("#q")).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('[data-bus="anio"]').click();
  await expect(page.locator("#sh")).toBeVisible();
  await expect(page.locator("#shT")).toHaveText("Elegí un año");
});

test("tocar un dato abre el panel; 'Volver' y 'Cerrar' funcionan, y el botón atrás del navegador lo cierra", async ({ page }) => {
  // Abrir la lista de victorias de Central desde 'Según cómo se cuente'.
  await page.locator("#cuentaOut .cta-r:not(.h)").first().locator(".c.rc-t.tap").click();
  await expect(page.locator("#sh")).toBeVisible();
  const filas = page.locator("#shBody .pn-row");
  await expect(filas.first()).toBeVisible();
  // Desde la lista, abrir un partido: aparece "Volver".
  await filas.first().click();
  await expect(page.locator("#shBack")).toBeVisible();
  await page.locator("#shBack").click();
  await expect(page.locator("#shBack")).toBeHidden();
  await expect(page.locator("#sh")).toBeVisible();
  // Atrás del navegador: cierra el panel sin salir de la página.
  await page.goBack();
  await expect(page.locator("#sh")).toBeHidden();
  await expect(page.locator("#counter b")).toHaveText(/\d/);
  // Escape también cierra.
  await page.locator(".flot .menu").click();
  await expect(page.locator("#sh")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#sh")).toBeHidden();
});

test.describe("links compartidos (#ver=...)", () => {
  test("un link a un partido abre ese partido", async ({ page }) => {
    const p = DATOS[DATOS.length - 1];
    await page.goto(`${PAGINA_PRINCIPAL}#ver=${encodeURIComponent("p:" + p.f)}`);
    await expect(page.locator("#sh")).toBeVisible();
    await expect(page.locator("#shBody")).toContainText(p.c);
    await expect(page.locator("#shBody")).toContainText(p.fx);
  });

  test("un link a un goleador abre su ficha", async ({ page }) => {
    const [nombre, goles] = goleadores(DATOS, "NOB")[0];
    await page.goto(`${PAGINA_PRINCIPAL}#ver=${encodeURIComponent("j:NOB|" + nombre)}`);
    await expect(page.locator("#sh")).toBeVisible();
    await expect(page.locator("#shBody")).toContainText(nombre);
    await expect(page.locator("#shBody")).toContainText(String(goles));
  });

  test("un link a una sección la muestra", async ({ page }) => {
    await page.goto(`${PAGINA_PRINCIPAL}#ver=s:goleadores`);
    await expect.poll(() => enPantalla(page, "#goleadores")).toBe(true);
  });

  test("un link roto o viejo no rompe la página", async ({ page }) => {
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    for (const ver of ["p:1800-01-01", "j:RC|Nadie", "l:x~zzz", "s:no-existe", "%E0%A4%A"]) {
      await page.goto(`${PAGINA_PRINCIPAL}#ver=${ver}`);
      await expect(page.locator("#counter b")).toHaveText(/\d/);
      await expect(page.locator("#sh")).toBeHidden();
    }
    expect(errores, errores.join("\n")).toEqual([]);
  });

  test("'Compartir' arma un link que, al abrirlo, muestra lo mismo", async ({ page }) => {
    // Se intercepta la ventana de compartir para leer el link sin salir a internet.
    await page.evaluate(() => {
      window.__compartido = [];
      window.open = (u) => { window.__compartido.push(String(u)); return null; };
      if (navigator.share) navigator.share = (d) => { window.__compartido.push(d.text); return Promise.resolve(); };
    });
    const fila = page.locator("#tabla tbody.mt").first();
    const p = DATOS[+(await fila.getAttribute("data-id"))];
    await fila.locator(".xbtn").click();
    await fila.getByRole("button", { name: /Abrir ficha del partido/ }).click();
    await page.locator("#shBody [data-share]").first().click();
    const texto = decodeURIComponent((await page.evaluate(() => window.__compartido)).join(" "));
    const m = /#ver=([^\s&]+)/.exec(texto);
    expect(m, `El texto compartido no tiene link directo: ${texto.slice(0, 200)}`).toBeTruthy();
    // Se abre ese mismo link en una pestaña nueva, pero en el sitio local (sin depender del dominio).
    const otra = await page.context().newPage();
    await abrir(otra, `${PAGINA_PRINCIPAL}#ver=${m[1]}`); // m[1] ya viene codificado, igual que en el link real
    await expect(otra.locator("#sh")).toBeVisible();
    await expect(otra.locator("#shBody")).toContainText(p.fx);
  });
});

test("'Tu clásico': con una fecha de nacimiento cuenta los partidos desde ese día", async ({ page }) => {
  const fecha = "1990-05-20";
  await page.locator("#tcF").fill(fecha);
  const desde = DATOS.filter((p) => p.f >= fecha && ["RC", "NOB", "E"].includes(p.g));
  await expect(page.locator("#tcOut")).toContainText(`se jugaron ${desde.length} clásicos`);
  const kp = page.locator("#tcOut .tc-kp b");
  await expect(kp.nth(0)).toHaveText(String(desde.filter((p) => p.g === "RC").length));
  await expect(kp.nth(1)).toHaveText(String(desde.filter((p) => p.g === "E").length));
  await expect(kp.nth(2)).toHaveText(String(desde.filter((p) => p.g === "NOB").length));
});

test("buscador de goleadores: sugiere nombres y abre la ficha con sus goles", async ({ page }) => {
  const [nombre, goles] = goleadores(DATOS, "RC")[0];
  await page.locator("#jq").fill(nombre.split(" ").slice(-1)[0]);
  await expect(page.locator("#jqSug button").first()).toBeVisible();
  await expect(page.locator("#jqSug")).toContainText(nombre);
  await page.locator("#jqSug button", { hasText: nombre }).first().click();
  await expect(page.locator("#sh")).toBeVisible();
  await expect(page.locator("#shBody")).toContainText(nombre);
  await expect(page.locator("#shBody")).toContainText(String(goles));
  await page.locator("#shX").click();
  await page.locator("#jq").fill("zzzz");
  await expect(page.locator("#jqSug")).toContainText("No hay goleadores");
});
