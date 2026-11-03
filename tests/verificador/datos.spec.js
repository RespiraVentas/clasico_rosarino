// Revisa los DATOS de los partidos (lo que viene de la planilla) sin abrir el
// navegador: que el archivo sea válido, que cada partido tenga sentido y que
// los números escritos a mano en la página coincidan con la suma de partidos.
//
// En la versión principal, un error nuevo pone el flujo en rojo.
// En las otras versiones (por ejemplo /prueba/) todo se informa como aviso.

const { test, expect } = require("@playwright/test");
const { PAGINA_PRINCIPAL, OTRAS_VERSIONES } = require("../sitio.config");
const { leerPartidos, totales, sumaGoles, quitarTildes, fechaLarga } = require("../lib/datos");
const { separarConocidas, avisar, listar } = require("../lib/fallas-conocidas");

const RESULTADOS = new Set(["RC", "NOB", "E", "-"]);
const SEDES = new Set(["RC", "NOB", "N"]);
const LOCALES = new Set(["RC", "NOB"]);
const NOMBRE = { RC: "Central", NOB: "Newell's" };

/** Primeros dos números del resultado ("2-1", "2(8)-2(7)", "0-0 (p.3-5)"). */
function golesDelTexto(r) {
  const m = /^\s*(\d+)\s*(?:\(\d+\))?\s*-\s*(\d+)/.exec(String(r));
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/**
 * Revisa todos los partidos. Devuelve { errores, avisos }.
 * Cada error tiene una clave estable (tipo + fecha) para poder marcarlo como falla conocida.
 */
function revisarPartidos(P) {
  const errores = [], avisos = [];
  const err = (p, tipo, txt) => errores.push({ clave: `datos:${tipo}:${p.f}`, detalle: `${p.f} (${p.c}): ${txt}` });
  const av = (p, txt) => avisos.push(`${p.f} (${p.c}): ${txt}`);
  const vistos = new Map();

  P.forEach((p, i) => {
    // Fecha
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(p.f));
    if (!m) { errores.push({ clave: `datos:fecha:${i}`, detalle: `Partido n.º ${i + 1}: la fecha "${p.f}" no tiene el formato AAAA-MM-DD` }); return; }
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const fecha = new Date(Date.UTC(y, mo - 1, d));
    if (fecha.getUTCMonth() !== mo - 1 || fecha.getUTCDate() !== d) err(p, "fecha", `la fecha ${p.f} no existe en el calendario`);
    if (p.fx !== fechaLarga(p.f)) err(p, "fecha-texto", `la fecha escrita dice "${p.fx}" pero debería decir "${fechaLarga(p.f)}"`);
    if (Number(p.a) !== y) err(p, "anio", `el año dice ${p.a} pero la fecha es de ${y}`);
    if (p.dec != null && p.dec !== "" && Number(p.dec) !== Math.floor(y / 10) * 10) err(p, "decada", `la década dice ${p.dec} pero el partido es de ${y}`);
    if (i > 0 && String(P[i - 1].f) > String(p.f)) err(p, "orden", `está fuera de orden (el anterior es del ${P[i - 1].f})`);

    // Campos de texto obligatorios
    if (!p.c || typeof p.c !== "string") err(p, "torneo", "no tiene torneo");
    if (!p.am || typeof p.am !== "string") err(p, "ambito", "no tiene ámbito (Nacional, Amistoso, etc.)");
    if (!p.e) av(p, "no tiene estadio (en la página aparece \"Sin dato\")");

    // Valores permitidos
    if (!RESULTADOS.has(p.g)) err(p, "ganador", `ganador desconocido "${p.g}" (se esperaba RC, NOB, E o -)`);
    if (!SEDES.has(p.sede)) err(p, "sede", `sede desconocida "${p.sede}" (se esperaba RC, NOB o N)`);
    if (!LOCALES.has(p.loc)) err(p, "local", `local desconocido "${p.loc}" (se esperaba RC o NOB)`);
    if (typeof p.j !== "boolean") err(p, "jugado", `el campo "jugado" debería ser true o false y es ${JSON.stringify(p.j)}`);
    for (const k of ["grc", "gnob"]) {
      if (!Array.isArray(p[k])) { err(p, "goleadores", `la lista de goleadores (${k}) no es una lista`); continue; }
      for (const g of p[k]) {
        if (!g || typeof g.j !== "string" || !g.j.trim()) err(p, "goleador-sin-nombre", "hay un gol sin nombre de jugador");
        else if (g.j !== g.j.trim() || /\s{2,}/.test(g.j)) err(p, "goleador-espacios", `el nombre "${g.j}" tiene espacios de más`);
        if (!(Number.isInteger(g && g.c) && g.c >= 1)) err(p, "goleador-cantidad", `la cantidad de goles de ${g && g.j} es inválida (${g && g.c})`);
      }
    }

    // Estadio y localía
    if (p.e === "Central" && p.sede !== "RC") err(p, "estadio", `el estadio es la cancha de Central pero la sede dice ${p.sede}`);
    if (p.e === "Newell's" && p.sede !== "NOB") err(p, "estadio", `el estadio es la cancha de Newell's pero la sede dice ${p.sede}`);
    if (p.sede !== "N" && LOCALES.has(p.sede) && p.sede !== p.loc) {
      av(p, `se jugó en la cancha de ${NOMBRE[p.sede]} pero figura como local ${NOMBRE[p.loc]} (puede ser correcto: revisar)`);
    }

    // Resultado
    if (p.j === true) {
      const rc = p.rc, nob = p.nob;
      if (!Number.isInteger(rc) || !Number.isInteger(nob) || rc < 0 || nob < 0) {
        err(p, "goles", `el resultado no son números válidos (Central ${rc}, Newell's ${nob})`);
      } else {
        const esperado = rc > nob ? "RC" : nob > rc ? "NOB" : "E";
        if (p.g !== esperado) err(p, "ganador", `el ganador dice ${p.g} pero el resultado es Central ${rc} - Newell's ${nob}`);
        const leido = golesDelTexto(p.r);
        const loc = p.loc === "RC" ? [rc, nob] : [nob, rc];
        if (!leido) err(p, "resultado-texto", `el resultado escrito "${p.r}" no se entiende`);
        else if (leido[0] !== loc[0] || leido[1] !== loc[1]) err(p, "resultado-texto", `el resultado escrito "${p.r}" no coincide con los goles (local ${loc[0]}, visitante ${loc[1]})`);
        const sr = sumaGoles(p.grc), sn = sumaGoles(p.gnob);
        if (sr > rc) err(p, "goleadores-de-mas", `los goleadores de Central suman ${sr} goles pero Central hizo ${rc}`);
        if (sn > nob) err(p, "goleadores-de-mas", `los goleadores de Newell's suman ${sn} goles pero Newell's hizo ${nob}`);
        if (sr < rc) av(p, `faltan goleadores de Central (${sr} de ${rc} goles con nombre)`);
        if (sn < nob) av(p, `faltan goleadores de Newell's (${sn} de ${nob} goles con nombre)`);
        if (p.pen != null) {
          if (!/^\d+-\d+$/.test(p.pen)) err(p, "penales", `los penales "${p.pen}" no tienen el formato N-N`);
          if (rc !== nob) err(p, "penales", "tiene penales pero el partido no terminó empatado");
        }
      }
    } else if (p.j === false) {
      if ((p.grc || []).length || (p.gnob || []).length) err(p, "no-jugado", "figura como no jugado pero tiene goleadores");
      if (!p.n) av(p, "figura como no jugado y no tiene nota explicando por qué");
    }

    // Partido repetido (misma fecha, torneo y resultado)
    const k = `${p.f}|${p.c}|${p.r}`;
    if (vistos.has(k)) err(p, "repetido", "está cargado dos veces");
    vistos.set(k, true);
  });

  // Un mismo jugador escrito de dos formas distintas (con y sin tilde, mayúsculas...)
  // parte sus goles en dos filas de "Goleadores históricos".
  for (const club of ["grc", "gnob"]) {
    const formas = new Map();
    for (const p of P) for (const g of p[club] || []) {
      if (!g || !g.j) continue;
      const k = quitarTildes(g.j).replace(/\s+/g, " ").trim();
      if (!formas.has(k)) formas.set(k, new Set());
      formas.get(k).add(g.j);
    }
    for (const [k, set] of formas) if (set.size > 1) {
      errores.push({ clave: `datos:nombre-distinto:${club}:${k}`, detalle: `el goleador de ${club === "grc" ? "Central" : "Newell's"} aparece escrito de ${set.size} formas: ${[...set].map((x) => `"${x}"`).join(", ")}` });
    }
  }
  return { errores, avisos };
}

/** Números escritos "a mano" en el HTML que tienen que coincidir con los datos. */
function revisarTextosFijos(html, P) {
  const errores = [];
  const t = totales(P);
  const visible = html.replace(/<script\b[\s\S]*?<\/script>/gi, "").replace(/<style\b[\s\S]*?<\/style>/gi, "").replace(/<meta[^>]*>/gi, "");
  const m = /Los (\d+) clásicos en una sola imagen/.exec(visible);
  if (m && Number(m[1]) !== t.pj) {
    errores.push({ clave: "textos:cantidad-adn", detalle: `la sección "El ADN del clásico" dice "Los ${m[1]} clásicos" pero hay ${t.pj} partidos cargados` });
  }
  const rango = `${t.desde}–${t.hasta}`;
  const titulo = (/<title>([^<]*)<\/title>/i.exec(html) || [])[1] || "";
  for (const [donde, texto] of [["el título de la pestaña", titulo], ["el pie de página", (/<footer[\s\S]*?<\/footer>/i.exec(visible) || [""])[0]]]) {
    const r = /(1[89]\d\d)\s*[–-]\s*(20\d\d)/.exec(texto);
    if (r && `${r[1]}–${r[2]}` !== rango) {
      errores.push({ clave: `textos:años:${donde}`, detalle: `${donde} dice ${r[1]}–${r[2]} pero los partidos van de ${rango}` });
    }
  }
  return errores;
}

for (const version of [PAGINA_PRINCIPAL, ...OTRAS_VERSIONES]) {
  const principal = version === PAGINA_PRINCIPAL;
  const { partidos, error, html } = leerPartidos(version);
  if (!principal && !partidos && !error) continue; // páginas sin partidos (por ejemplo /revision/)

  test.describe(`datos de ${version}${principal ? " (versión principal)" : " (otra versión: solo avisos)"}`, () => {
    test("el archivo de datos es válido", () => {
      if (!principal && error) { avisar(`${version}: ${error}`); return; }
      expect(error, error || "").toBeNull();
      expect(Array.isArray(partidos), "No se encontró la lista de partidos (const PARTIDOS = [...])").toBe(true);
      expect(partidos.length, "La lista de partidos está vacía").toBeGreaterThan(0);
    });

    test("cada partido tiene datos coherentes", () => {
      test.skip(!partidos, "sin datos");
      const { errores, avisos } = revisarPartidos(partidos);
      // En las otras versiones no se repiten los avisos: solo se informan errores.
      if (principal && avisos.length) avisar(`${version}: ${avisos.length} cosas para revisar (no son errores seguros):\n` + avisos.map((a) => "  • " + a).join("\n"));
      if (!principal) {
        if (errores.length) avisar(`${version}: ${errores.length} errores de datos:\n${listar(errores)}`);
        return;
      }
      const nuevos = separarConocidas(errores, ["datos:"]);
      expect(nuevos, `Errores en los datos:\n${listar(nuevos)}`).toEqual([]);
    });

    test("los números escritos en la página coinciden con los partidos", () => {
      test.skip(!partidos, "sin datos");
      const errores = revisarTextosFijos(html, partidos);
      if (!principal) {
        if (errores.length) avisar(`${version}:\n${listar(errores)}`);
        return;
      }
      const nuevos = separarConocidas(errores, ["textos:"]);
      expect(nuevos, listar(nuevos)).toEqual([]);
    });

    if (!principal) {
      test("diferencias con la versión principal (informativo)", () => {
        test.skip(!partidos, "sin datos");
        const base = leerPartidos(PAGINA_PRINCIPAL).partidos;
        test.skip(!base, "la versión principal no tiene datos");
        const clave = (p) => JSON.stringify(p);
        const a = new Set(base.map(clave)), b = new Set(partidos.map(clave));
        const soloAca = partidos.filter((p) => !a.has(clave(p))).length;
        const soloPrincipal = base.filter((p) => !b.has(clave(p))).length;
        if (soloAca || soloPrincipal) {
          avisar(`${version} tiene ${partidos.length} partidos y la principal ${base.length}. ${soloAca} partidos están distintos o solo acá; ${soloPrincipal} solo en la principal.`);
        } else {
          avisar(`${version} tiene exactamente los mismos ${base.length} partidos que la versión principal.`);
        }
      });
    }
  });
}

module.exports = { revisarPartidos };
