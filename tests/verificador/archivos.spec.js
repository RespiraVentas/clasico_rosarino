// Revisa los archivos del sitio SIN abrir el navegador:
// links internos rotos, imágenes faltantes, estructura básica de cada página
// y que el JavaScript de cada página no tenga errores de escritura.

const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { RAIZ } = require("../lib/datos");
const { separarConocidas, avisar, listar } = require("../lib/fallas-conocidas");

// Todas las páginas .html del repositorio (salvo las carpetas que no se publican como sitio).
const IGNORAR = new Set([".git", ".github", "node_modules", "tests"]);
function paginas(dir = RAIZ) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORAR.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...paginas(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out.sort();
}
const rel = (p) => path.relative(RAIZ, p).split(path.sep).join("/");

/** El HTML sin lo que está dentro de <script> y <style> (ahí hay plantillas, no links reales). */
const sinCodigo = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "");
const idsDe = (html) => new Set([...sinCodigo(html).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const meta = (html, prop) => {
  const m = new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]*content="([^"]*)"`, "i").exec(html);
  return m ? m[1] : null;
};
const decodificar = (s) => s.replace(/&amp;/g, "&");

const PAGINAS = paginas();

test("hay páginas para revisar", () => {
  expect(PAGINAS.length, "No se encontró ningún .html en el repositorio").toBeGreaterThan(0);
});

for (const archivo of PAGINAS) {
  const nombre = rel(archivo);

  test.describe(nombre, () => {
    const html = fs.readFileSync(archivo, "utf8");

    test("estructura básica de la página", () => {
      const faltan = [];
      if (!/^\s*<!doctype html>/i.test(html)) faltan.push("falta <!doctype html> al principio");
      if (!/<meta charset="utf-8">/i.test(html)) faltan.push('falta <meta charset="utf-8"> (acentos y ñ pueden verse mal)');
      if (!/<meta name="viewport"/i.test(html)) faltan.push("falta <meta name=\"viewport\"> (en celular se vería chiquito)");
      if (!/<title>[^<]+<\/title>/i.test(html)) faltan.push("falta el <title>");
      if (!/<\/html>\s*$/i.test(html)) faltan.push("el archivo no termina en </html>: puede haber quedado cortado");
      const problemas = faltan.map((d) => ({ clave: `estructura:${nombre}:${d.split(" ")[1]}`, detalle: `${nombre}: ${d}` }));
      const nuevos = separarConocidas(problemas, `estructura:${nombre}:`);
      expect(nuevos, listar(nuevos)).toEqual([]);
    });

    test("el JavaScript no tiene errores de escritura", () => {
      const problemas = [];
      const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
      scripts.forEach((m, i) => {
        if (/\bsrc=/.test(m[1]) || /type="(?!text\/javascript|module)/.test(m[1])) return;
        try {
          new vm.Script(m[2], { filename: `${nombre} (script ${i + 1})` });
        } catch (e) {
          problemas.push({ clave: `js:${nombre}:${i + 1}`, detalle: `${nombre}, script ${i + 1}: ${e.message}` });
        }
      });
      const nuevos = separarConocidas(problemas, `js:${nombre}:`);
      expect(nuevos, listar(nuevos)).toEqual([]);
    });

    test("no hay dos elementos con el mismo id", () => {
      const vistos = new Map();
      for (const m of sinCodigo(html).matchAll(/\sid="([^"]+)"/g)) vistos.set(m[1], (vistos.get(m[1]) || 0) + 1);
      const problemas = [...vistos].filter(([, n]) => n > 1).map(([id, n]) => ({ clave: `id-repetido:${nombre}:${id}`, detalle: `${nombre}: el id "${id}" aparece ${n} veces` }));
      const nuevos = separarConocidas(problemas, `id-repetido:${nombre}:`);
      expect(nuevos, listar(nuevos)).toEqual([]);
    });

    test("links internos e imágenes apuntan a cosas que existen", () => {
      const problemas = [];
      const ids = idsDe(html);
      const dir = path.dirname(archivo);
      const enlaces = [...sinCodigo(html).matchAll(/<(a|link|img|script|source|iframe)\b[^>]*?\s(href|src)="([^"]*)"/gi)];
      for (const [, tag, , crudo] of enlaces) {
        const url = decodificar(crudo.trim());
        if (!url || /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(url)) continue; // externos: no se revisan
        const [ruta, ancla] = url.split("#");
        if (!ruta) {
          if (ancla && !ids.has(decodeURIComponent(ancla))) {
            problemas.push({ clave: `link:${nombre}:#${ancla}`, detalle: `${nombre}: el link "#${ancla}" no lleva a ninguna parte (no hay id="${ancla}")` });
          }
          continue;
        }
        let destino = path.join(ruta.startsWith("/") ? RAIZ : dir, decodeURIComponent(ruta.split("?")[0]));
        if (ruta.endsWith("/") || (fs.existsSync(destino) && fs.statSync(destino).isDirectory())) destino = path.join(destino, "index.html");
        if (!fs.existsSync(destino)) {
          const que = tag.toLowerCase() === "img" ? "imagen" : "link";
          const roto = que === "imagen" ? "rota" : "roto";
          problemas.push({ clave: `${que}:${nombre}:${ruta}`, detalle: `${nombre}: ${que} ${roto} a "${ruta}" (no existe ${rel(destino)})` });
        } else if (ancla && destino.endsWith(".html") && !idsDe(fs.readFileSync(destino, "utf8")).has(ancla)) {
          problemas.push({ clave: `link:${nombre}:${url}`, detalle: `${nombre}: el link "${url}" apunta a una sección que no existe` });
        }
      }

      // Imagen para compartir (og:image). Es una dirección completa; para no depender
      // del dominio, se la ubica en el repositorio relativa a og:url de la misma página.
      const ogImg = meta(html, "og:image");
      const ogUrl = meta(html, "og:url");
      if (ogImg) {
        let local = null;
        try {
          const img = new URL(ogImg), base = new URL(ogUrl || "");
          if (img.origin === base.origin) {
            const relativa = path.posix.relative(base.pathname.endsWith("/") ? base.pathname : path.posix.dirname(base.pathname), img.pathname);
            local = path.join(dir, relativa);
          }
        } catch { /* sin og:url válido */ }
        if (!/^https?:/i.test(ogImg)) local = path.join(dir, ogImg);
        if (local == null) avisar(`${nombre}: no se pudo ubicar en el repositorio la imagen para compartir ${ogImg}`);
        else if (!fs.existsSync(local)) {
          problemas.push({ clave: `imagen:${nombre}:og:image`, detalle: `${nombre}: falta la imagen para compartir (${rel(local)})` });
        } else if (local.endsWith(".png")) {
          // Tamaño real del PNG contra el declarado. Solo aviso (es tema de vista previa, no de la página).
          const b = fs.readFileSync(local);
          const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
          const dw = meta(html, "og:image:width"), dh = meta(html, "og:image:height");
          if ((dw && +dw !== w) || (dh && +dh !== h)) avisar(`${nombre}: la imagen para compartir mide ${w}×${h} pero la página dice ${dw}×${dh}`);
        }
      }

      const nuevos = separarConocidas(problemas, [`link:${nombre}:`, `imagen:${nombre}:`]);
      expect(nuevos, listar(nuevos)).toEqual([]);
    });
  });
}

test("no hay archivos de imagen vacíos o dañados", () => {
  const problemas = [];
  const recorrer = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (IGNORAR.has(e.name)) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) { recorrer(p); continue; }
      const ext = path.extname(e.name).toLowerCase();
      if (![".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(ext)) continue;
      const b = fs.readFileSync(p);
      const firmas = { ".png": [0x89, 0x50, 0x4e, 0x47], ".jpg": [0xff, 0xd8], ".jpeg": [0xff, 0xd8], ".gif": [0x47, 0x49, 0x46], ".webp": [0x52, 0x49, 0x46, 0x46] };
      const ok = b.length > 100 && firmas[ext].every((x, i) => b[i] === x);
      if (!ok) problemas.push({ clave: `imagen-dañada:${rel(p)}`, detalle: `${rel(p)} está vacía o no es una imagen ${ext} válida` });
    }
  };
  recorrer(RAIZ);
  const nuevos = separarConocidas(problemas, "imagen-dañada:");
  expect(nuevos, listar(nuevos)).toEqual([]);
});
