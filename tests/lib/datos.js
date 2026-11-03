// Lee los partidos que están adentro de cada index.html y calcula los totales
// "a mano", sin usar el código de la página. Así los tests pueden comparar lo
// que muestra la web contra una cuenta hecha por separado.

const fs = require("fs");
const path = require("path");

// SITIO_RAIZ permite apuntar a otra carpeta (se usa para probar los propios tests).
const RAIZ = process.env.SITIO_RAIZ ? path.resolve(process.env.SITIO_RAIZ) : path.resolve(__dirname, "..", "..");
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** Ruta del archivo HTML de una versión ("/", "/prueba/", ...). */
function archivoDe(version) {
  const rel = version.endsWith(".html") ? version : version + "index.html";
  return path.join(RAIZ, rel.replace(/^\//, ""));
}

/**
 * Busca `const PARTIDOS = [ ... ]` en el HTML y devuelve el texto del array.
 * Recorre carácter por carácter respetando los textos entre comillas, para no
 * confundirse con corchetes que aparezcan dentro de un nombre.
 */
function textoDelArray(html) {
  const ini = html.indexOf("const PARTIDOS =");
  if (ini < 0) return null;
  const abre = html.indexOf("[", ini);
  let prof = 0, enTexto = false, escape = false;
  for (let i = abre; i < html.length; i++) {
    const c = html[i];
    if (enTexto) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') enTexto = false;
      continue;
    }
    if (c === '"') enTexto = true;
    else if (c === "[") prof++;
    else if (c === "]" && --prof === 0) return html.slice(abre, i + 1);
  }
  throw new Error("El array PARTIDOS no se cierra: falta un ']' (el archivo quedó cortado).");
}

/** Devuelve { partidos, error } de una versión. `partidos` es null si no tiene datos. */
function leerPartidos(version) {
  const html = fs.readFileSync(archivoDe(version), "utf8");
  let texto;
  try {
    texto = textoDelArray(html);
  } catch (e) {
    return { partidos: null, error: e.message, html };
  }
  if (texto == null) return { partidos: null, error: null, html };
  try {
    return { partidos: JSON.parse(texto), error: null, html };
  } catch (e) {
    return { partidos: null, error: "Los datos de partidos no son JSON válido: " + e.message, html };
  }
}

const sumaGoles = (lista) => (lista || []).reduce((s, g) => s + (Number(g.c) || 1), 0);
const quitarTildes = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Totales calculados por separado, para comparar contra la página. */
function totales(partidos) {
  const t = { pj: partidos.length, jugados: 0, rc: 0, e: 0, nob: 0, sinResultado: 0, golesRc: 0, golesNob: 0, amistosos: 0 };
  const ambitos = new Map();
  const decadas = new Map();
  for (const p of partidos) {
    if (p.j !== false) {
      t.jugados++;
      t.golesRc += Number(p.rc) || 0;
      t.golesNob += Number(p.nob) || 0;
    }
    if (p.g === "RC") t.rc++;
    else if (p.g === "NOB") t.nob++;
    else if (p.g === "E") t.e++;
    else t.sinResultado++;
    if (p.am === "Amistoso") t.amistosos++;

    const am = p.am || "Sin dato";
    if (!ambitos.has(am)) ambitos.set(am, { am, pj: 0, rc: 0, e: 0, nob: 0, golesRc: 0, golesNob: 0 });
    const a = ambitos.get(am);
    a.pj++;
    if (p.g === "RC") a.rc++; else if (p.g === "NOB") a.nob++; else if (p.g === "E") a.e++;
    if (p.j !== false) { a.golesRc += Number(p.rc) || 0; a.golesNob += Number(p.nob) || 0; }

    const d = Math.floor(Number(p.a) / 10) * 10;
    if (!decadas.has(d)) decadas.set(d, { dec: d, t: 0, rc: 0, e: 0, nob: 0 });
    const x = decadas.get(d);
    x.t++;
    if (p.g === "RC") x.rc++; else if (p.g === "NOB") x.nob++; else if (p.g === "E") x.e++;
  }
  const anios = partidos.map((p) => Number(p.a)).filter(Boolean);
  t.desde = Math.min(...anios);
  t.hasta = Math.max(...anios);
  t.ambitos = ambitos;
  t.decadas = decadas;
  return t;
}

/** Goles de cada jugador (sin goles en contra), igual que "Goleadores históricos". */
function goleadores(partidos, club) {
  const clave = club === "RC" ? "grc" : "gnob";
  const m = new Map();
  for (const p of partidos) for (const g of p[clave] || []) {
    if (g.ag || !g.j) continue;
    m.set(g.j, (m.get(g.j) || 0) + (Number(g.c) || 1));
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
}

/** "18 de junio de 1905" a partir de "1905-06-18". */
function fechaLarga(f) {
  const [y, m, d] = f.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

/** "18/06/1905" a partir de "1905-06-18" (como en la tabla). */
function fechaCorta(f) {
  const [y, m, d] = f.split("-");
  return `${d}/${m}/${y}`;
}

module.exports = { RAIZ, MESES, archivoDe, leerPartidos, totales, goleadores, sumaGoles, quitarTildes, fechaLarga, fechaCorta };
