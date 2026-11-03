// Capturas de antes y después para el pull request.
// Uso: node capturas.js <url> <carpeta> <sufijo>
const { chromium } = require('playwright');
const fs = require('fs');
const [url, out, suf] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, locale: 'es-AR', isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(url); await p.waitForTimeout(600);

  // 1. Desglose por ámbito (360 px): primeras dos tarjetas
  await p.locator('#ambito').scrollIntoViewIfNeeded();
  const t = await p.locator('#ambBody tr.r').nth(0).boundingBox();
  const t2 = await p.locator('#ambBody tr.r').nth(1).boundingBox();
  await p.screenshot({ path: `${out}/01-ambito-${suf}.png`, clip: { x: 0, y: t.y - 8, width: 360, height: t2.y + t2.height - t.y + 16 } });

  // 2. Búsqueda con apóstrofo de celular
  await p.fill('#q', 'Newell’s'); await p.waitForTimeout(400);
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.f-foot').scrollIntoView({ block: 'start' }); window.scrollBy(0, -20); });
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${out}/02-busqueda-${suf}.png`, clip: { x: 0, y: 0, width: 360, height: 420 } });
  await p.fill('#q', ''); await p.waitForTimeout(300);

  // 3. Eje de La carrera
  await p.locator('#carYrs').scrollIntoViewIfNeeded();
  const y = await p.locator('#carYrs').boundingBox();
  await p.screenshot({ path: `${out}/03-carrera-${suf}.png`, clip: { x: 0, y: y.y - 70, width: 360, height: 110 } });

  // 4. Columna de Newell's en Goles que valieron un clásico
  const col = p.locator('.dec2 .col2.nob');
  await col.scrollIntoViewIfNeeded();
  const cb = await col.boundingBox();
  await p.screenshot({ path: `${out}/04-contraste-${suf}.png`, clip: { x: 0, y: cb.y, width: 360, height: Math.min(330, cb.height) } });

  await b.close();
})();
