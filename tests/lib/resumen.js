// Al terminar, junta en un solo lugar las fallas conocidas, los avisos y las
// fallas ya arregladas, para leerlos sin abrir el informe completo.
// En GitHub, además, lo escribe en el "Summary" de la ejecución.

const fs = require("fs");

const TITULOS = {
  "falla conocida": "⚠️ Fallas conocidas (no ponen el flujo en rojo)",
  "ya está arreglada": "✅ Fallas conocidas que ya no aparecen (se pueden sacar de la lista)",
  aviso: "ℹ️ Avisos para revisar (no son errores seguros)",
};

class Resumen {
  constructor() {
    this.notas = new Map(Object.keys(TITULOS).map((k) => [k, new Set()]));
    this.fallidos = [];
  }
  onTestEnd(test, result) {
    const proyecto = test.parent.project()?.name || "";
    for (const a of test.annotations.concat(result.annotations || [])) {
      if (this.notas.has(a.type)) this.notas.get(a.type).add(a.description);
    }
    if (result.status !== "passed" && result.status !== "skipped" && test.outcome() === "unexpected" && result.retry === test.retries) {
      this.fallidos.push(`[${proyecto}] ${test.titlePath().slice(2).join(" › ")}`);
    }
  }
  onEnd(result) {
    const partes = [];
    if (this.fallidos.length) {
      partes.push(`### ❌ Tests que fallaron (${this.fallidos.length})\n` + this.fallidos.map((f) => `- ${f}`).join("\n"));
    }
    for (const [tipo, set] of this.notas) {
      if (!set.size) continue;
      partes.push(`### ${TITULOS[tipo]}\n` + [...set].map((d) => "- " + d.replace(/\n/g, "\n  ")).join("\n"));
    }
    const texto = `## Resultado de los tests: ${result.status === "passed" ? "todo bien ✅" : "hay problemas ❌"}\n\n` + (partes.join("\n\n") || "Sin avisos.");
    console.log("\n" + texto + "\n");
    if (process.env.GITHUB_STEP_SUMMARY) {
      try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, texto + "\n"); } catch { /* sin resumen */ }
    }
  }
  printsToStdio() { return true; }
}

module.exports = Resumen;
