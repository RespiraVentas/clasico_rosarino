// Configuración de Playwright (la herramienta que abre un navegador de verdad
// y usa la página como lo haría una persona).
const { defineConfig, devices } = require("@playwright/test");
const { PUERTO } = require("./sitio.config");

const EN_GITHUB = !!process.env.CI;

module.exports = defineConfig({
  testDir: ".",
  timeout: 45_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: EN_GITHUB,
  retries: EN_GITHUB ? 1 : 0,
  workers: EN_GITHUB ? 2 : undefined,
  reporter: [
    ["list"],
    ...(EN_GITHUB ? [["github"]] : []),
    ["html", { outputFolder: "informe", open: "never" }],
    ["./lib/resumen.js"],
  ],
  use: {
    baseURL: `http://localhost:${PUERTO}`,
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
    // Sin animaciones: los números aparecen al instante y los tests son estables.
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node servidor.js",
    url: `http://localhost:${PUERTO}/`,
    reuseExistingServer: !EN_GITHUB,
    timeout: 20_000,
  },
  projects: [
    {
      // Revisa archivos y datos sin abrir el navegador. Es lo más rápido.
      name: "datos-y-links",
      testMatch: "verificador/**/*.spec.js",
    },
    {
      name: "escritorio",
      testMatch: "navegador/**/*.spec.js",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 860 } },
    },
    {
      name: "celular",
      testMatch: "navegador/**/*.spec.js",
      // Pixel 7: pantalla de celular, táctil, con el mismo navegador (Chrome).
      use: { ...devices["Pixel 7"] },
    },
  ],
});
