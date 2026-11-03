// Servidor web mínimo para los tests: sirve la carpeta del sitio (la raíz del
// repositorio) en http://localhost:PUERTO, igual que lo haría GitHub Pages.
// No usa ninguna librería externa. No se publica ni lo usa la página.

const http = require("http");
const fs = require("fs");
const path = require("path");
const { PUERTO } = require("./sitio.config");

// SITIO_RAIZ permite apuntar a otra carpeta (se usa para probar los propios tests).
const RAIZ = process.env.SITIO_RAIZ ? path.resolve(process.env.SITIO_RAIZ) : path.resolve(__dirname, "..");
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const servidor = http.createServer((req, res) => {
  let ruta;
  try {
    ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch {
    res.writeHead(400).end("Dirección inválida");
    return;
  }
  let archivo = path.join(RAIZ, ruta);
  if (!archivo.startsWith(RAIZ)) {
    res.writeHead(403).end();
    return;
  }
  // Una carpeta sin barra final redirige, como GitHub Pages.
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) {
    if (!ruta.endsWith("/")) {
      res.writeHead(301, { Location: ruta + "/" }).end();
      return;
    }
    archivo = path.join(archivo, "index.html");
  }
  fs.readFile(archivo, (err, datos) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("No encontrado: " + ruta);
      return;
    }
    const tipo = TIPOS[path.extname(archivo).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": tipo, "Cache-Control": "no-store" }).end(datos);
  });
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  console.log(`Sitio servido en http://localhost:${PUERTO}/ (carpeta ${RAIZ})`);
});
