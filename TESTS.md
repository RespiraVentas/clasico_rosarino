# Tests automáticos del Clásico Rosarino

Este documento explica, sin tecnicismos, qué revisan los tests, cómo se usan y
qué encontraron la primera vez que se corrieron.

**En una frase:** cada vez que alguien propone un cambio con un *pull request*,
GitHub abre la página en un navegador de verdad (en tamaño computadora y en
tamaño celular), la usa como lo haría una persona y revisa los datos. Si algo
se rompió, el pull request muestra una cruz roja ❌ antes de que el cambio
llegue a la web.

---

## 1. Qué se revisa

### Los datos (sin abrir el navegador, tarda 2 segundos)

- **Que el archivo de datos sea válido**: que la lista de partidos que está
  dentro de `index.html` esté completa y bien escrita (no cortada a la mitad,
  sin comas o comillas de más).
- **Que cada partido tenga sentido**:
  - la fecha existe en el calendario y la fecha escrita ("6 de septiembre de
    2026") coincide con la fecha en números;
  - el año y la década coinciden con la fecha;
  - los partidos están en orden y ninguno está cargado dos veces;
  - el ganador coincide con el resultado (si fue 1-1, tiene que decir empate);
  - el resultado escrito coincide con los goles de cada equipo;
  - los goleadores no suman **más** goles que los que hizo el equipo;
  - los penales solo aparecen en partidos empatados;
  - si el estadio es "Central", la sede es la de Central (y lo mismo con Newell's);
  - un mismo jugador no está escrito de dos formas distintas (por ejemplo, con
    y sin tilde), porque eso partiría sus goles en dos filas.
- **Que los números escritos "a mano" en la página coincidan con los datos**:
  por ejemplo, "Los 371 clásicos en una sola imagen" tiene que decir la
  cantidad real de partidos, y "1905–2026" (en el título y el pie) tiene que
  coincidir con el primer y el último año.

### Los archivos del sitio (sin abrir el navegador)

- **Links internos rotos**: cada link que lleva a otra parte del sitio o a una
  sección (`#partidos`, `#goleadores`…) apunta a algo que existe.
- **Imágenes faltantes o dañadas**, incluida la imagen que se ve al compartir
  por WhatsApp (`compartir.png`).
- **Estructura básica de cada página** (que el archivo no esté cortado, que
  tenga título, etc.).
- **Errores de escritura en el JavaScript** de cada página (un error así deja
  la página en blanco).
- **Que no haya dos elementos con el mismo nombre interno** (rompe los links a
  secciones).

### La página en el navegador (en computadora y en celular)

- **Carga**: abre sin errores, todas las secciones muestran contenido, nada se
  sale de la pantalla de costado, todas las imágenes cargan, todos los botones
  tienen nombre (para personas que usan lector de pantalla).
- **Totales**: los números de la portada, el balance, la tabla por ámbito, la
  década por década, "Según cómo se cuente", los botones "Todos / Solo
  oficiales" y el ranking de goleadores **coinciden con la suma de los
  partidos**. La cuenta "correcta" la hacen los tests por su lado, sin usar el
  código de la página, así que si la página suma mal, se nota.
- **Buscadores y filtros**: buscar un goleador trae todos los partidos donde
  hizo goles; el buscador no distingue mayúsculas ni tildes; una búsqueda sin
  resultados muestra "Ningún clásico"; los filtros de ámbito, torneo, década,
  año, resultado, localía, "Solo oficiales" y "Desde cuándo contar" dejan
  exactamente los partidos que corresponden, y se pueden combinar; "Limpiar
  filtros" vuelve todo a cero.
- **Tabla de partidos**: muestra 50 y "Ver más" agrega de a 50; **todas** las
  filas tienen la fecha, el resultado, el local y el ganador correctos; se
  puede ordenar (con los títulos en computadora, con "Ordenar por" en celular);
  abrir una fila muestra los goleadores.
- **Navegación**: el menú "☰ Secciones" lleva a cada sección; el botón de la
  portada lleva a la tabla; el panel que se abre al tocar un dato se puede
  cerrar con "Cerrar", con "Volver", con la tecla Escape y con el botón
  "atrás" del navegador; los **links compartidos** (`#ver=...`) abren el
  partido, el goleador o la sección correcta; un link viejo o roto no rompe
  la página; el botón "Compartir" arma un link que, al abrirlo, muestra lo
  mismo.
- **Secciones interactivas**: "Un día como hoy" (con la fecha fija, en un día
  con clásicos y en uno sin), año por año, década por década, cábalas,
  comparar épocas, curiosidades, "Tu clásico", el buscador de goleadores y
  una partida completa de la trivia.

En total son **127 controles** (algunos aplican solo a computadora o solo a celular) y tardan alrededor de **1 minuto**.

### Lo que NO se revisa a propósito

- **SEO** (descripciones para Google, etiquetas para buscadores): todavía no
  hay dominio ni trabajo de SEO, así que nunca hace fallar los tests.
- **Links a otros sitios** (Wikipedia, WhatsApp): los tests no salen a
  internet, para no fallar por culpa de otra página.
- **El dominio**: los tests no dependen de ninguna dirección web. Levantan el
  sitio en la propia máquina (`http://localhost:4173`) y lo prueban ahí.

---

## 2. Qué versión del sitio se revisa (y cómo cambiarla)

En el repositorio hay tres páginas:

| Carpeta | Qué parece ser | Cómo se revisa |
|---|---|---|
| `/` (el `index.html` de la raíz) | **La versión principal** | Todos los tests. Si algo falla, cruz roja. |
| `/prueba/` | Una copia de prueba | Solo que abra sin errores, links e imágenes. Sus problemas de datos se informan como avisos, nunca como cruz roja. |
| `/revision/` | Un formulario para revisar errores del Excel | Solo que abra sin errores, links e imágenes. |

**Criterio para elegir la principal:** la del `index.html` de la raíz es la que
aparece al entrar a la dirección del sitio; no tiene la marca `noindex` (que
le pide a Google que no la muestre) y su vista previa para compartir apunta a
la raíz. En cambio, `/prueba/` se llama "prueba", tiene `noindex` y su vista
previa apunta a `/prueba/`. `/revision/` también tiene `noindex` y es un
formulario, no el sitio. Al momento de escribir esto, `/` y `/prueba/` tienen
exactamente los mismos 371 partidos.

**Para cambiar la versión principal** hay que editar una sola línea en
`tests/sitio.config.js`:

```js
const PAGINA_PRINCIPAL = normalizar(process.env.PAGINA || "/");
//                                                       ^^^ poner "/prueba/" acá
```

O, sin editar nada, correr los tests así: `PAGINA=/prueba/ npm test`.

No se borró ni se fusionó ninguna versión.

---

## 3. Cómo correrlos

### En GitHub (automático)

No hay que hacer nada. Cada pull request muestra abajo un control llamado
**"Tests del sitio"**:

- ✅ verde: todo bien.
- ❌ rojo: algo se rompió. Tocando **"Details"** se ve qué test falló y por qué,
  en español. Al final de la ejecución, en **"Summary"**, hay un resumen con
  los avisos y las fallas conocidas.
- En la ejecución también se puede bajar el **"informe-de-tests"**: es una
  página que se abre en el navegador, con capturas de pantalla de lo que falló.

También se puede correr a mano: pestaña **Actions** → **Tests del sitio** →
**Run workflow**.

**Importante:** el flujo **no corre** cuando el dueño actualiza la web directo
(con el programa de actualización). Solo corre en pull requests. No publica
nada, no escribe en el repositorio y no impide mergear: la cruz roja es solo
un aviso, salvo que alguien lo configure a propósito en *Settings → Branches*.

### En la computadora

Hace falta tener instalado [Node.js](https://nodejs.org) (versión 20 o más nueva).
Una sola vez:

```bash
cd tests
npm install
npx playwright install chromium
```

Después, cada vez que se quiera revisar:

```bash
cd tests
npm test                 # todo (1 minuto)
npm run verificar        # solo datos, links e imágenes (2 segundos, no abre navegador)
npm run navegador        # solo los tests de navegador
npm run reporte          # abre el informe con capturas de lo que falló
```

---

## 4. Qué errores reales aparecieron

La primera vez que se corrieron (3 de noviembre de 2026), **no apareció
ningún error que rompa la página o que haga que muestre un número
equivocado**: pasaron los 124 controles que aplican (los otros 3 son de computadora o de celular solamente). Los totales publicados coinciden con
la suma de los partidos, no hay links rotos ni imágenes faltantes, y
buscadores, filtros, tabla y navegación funcionan en computadora y en
celular.

Por eso la lista de **fallas conocidas está vacía** (ver punto 5).

Sí aparecieron **cosas para revisar**, que se informan como *avisos* (nunca
ponen la cruz roja, porque no son errores seguros). Los tests no las
corrigieron ni cambiaron ningún dato:

### 4.1 Partidos con goleadores incompletos (19 partidos)

Los goles con nombre son menos que los goles del partido. En la página
aparece "Goleador sin registrar". Puede ser que el dato no exista.

| Fecha | Torneo | Falta |
|---|---|---|
| 13/08/1905 | Copa Santiago Pinasco 1905 | los 2 de Central y los 2 de Newell's |
| 28/04/1907 | Amistoso | los 10 de Central |
| 24/11/1913 | Torneo C.A. Provincial | 1 de Central |
| 17/10/1915 | Copa Nicasio Vila 1915 | los 6 de Central |
| 16/04/1916 | Amistoso | los 4 de Central y los 2 de Newell's |
| 30/07/1916 | Copa Nicasio Vila 1916 | los 4 de Central |
| 31/08/1919 | Copa Nicasio Vila 1919 | 1 de Central y 1 de Newell's |
| 26/01/1935 | Copa Olinto Gallo | los 4 de Central y los 2 de Newell's |
| 23/10/1938 | Torneo Semana Rosario | los 2 de Central |
| 28/01/1939 | Copa La Bengasina | 1 de Newell's |
| 21/12/1939 | Copa Carlos Colombres | los 2 de Newell's |
| 17/12/1944 | Partido a beneficio | los 2 de Newell's |
| 01/11/1945 | Copa Colaboración Monumento Gral. Las Heras | los 3 de Newell's |
| 19/03/1946 | Amistoso | los 5 de Newell's |
| 12/02/1949 | Copa Expresidentes | los 2 de Newell's |
| 17/03/1953 | Torneo Agremiados | los 2 de Central |
| 22/03/1964 | Copa Semino | 1 de Newell's |
| 07/11/1968 | Amistoso | los 2 de Central |
| 07/03/1999 | Torneo Clausura 1999 | 1 de Central |

### 4.2 Partidos donde la cancha y el local no coinciden (7 partidos)

Se jugaron en la cancha de un club pero figura como local el otro. Puede ser
correcto (por ejemplo, si un club prestó su cancha), pero conviene confirmarlo,
porque afecta el filtro de "Localía" y las cábalas.

| Fecha | Torneo | Cancha | Figura como local |
|---|---|---|---|
| 13/08/1905 | Copa Santiago Pinasco 1905 | Central | Newell's |
| 29/06/1916 | Copa de Honor 1916 | Newell's | Central |
| 06/10/1929 | Copa Alfredo J. Rouillon | Newell's | Central |
| 03/08/1930 | Copa Rosario | Central | Newell's |
| 25/05/1977 | Torneo Metropolitano 1977 | Newell's | Central |
| 14/05/1978 | Torneo Metropolitano 1978 | Newell's | Central |
| 23/06/1996 | Torneo Clausura 1996 | Central | Newell's |

### 4.3 Un partido sin estadio

- 28/04/1907, Amistoso: no tiene estadio cargado (la página muestra "Sin dato").

### 4.4 Botones chicos en celular

En celular hay 48 cosas que se pueden tocar y miden menos de 24×24 píxeles
(lo mínimo que recomienda la guía de accesibilidad WCAG 2.2). Por ejemplo, los
años de "El ADN del clásico" (1900, 1920…, de 39×21), las décadas de "Año por
año" (1900s, 1910s…, de 44×21) y los "131 veces" de "La última vez que…" (de
16 de alto). Son difíciles de tocar con el dedo. Se informa como aviso porque
otra sesión está trabajando en la versión para celular.

### 4.5 Otras observaciones (no tienen test)

- Los partidos definidos por penales tienen el resultado escrito de tres
  formas distintas: `2(8)-2(7)` (15/08/1974), `1(6)-1(7)` (27/01/2000) y
  `0-0 (p.3-5)` (30/07/2016). Hoy no se nota en la página (ese texto solo se
  usa para el buscador), pero unificarlo en la planilla evitaría problemas.
- El buscador de partidos busca cada palabra por separado: buscar "Manuel
  González" también trae los partidos de "Gerardo Manuel González". No es un
  error, pero puede sorprender.

---

## 5. Fallas conocidas: cómo funcionan

Si un test encuentra un error real que todavía no se arregló, se lo puede
anotar en `tests/lib/fallas-conocidas.js` con una explicación. Desde ese
momento:

- ese error **no pone la cruz roja** (aparece como "⚠️ Falla conocida" en el
  resumen), así el flujo no queda en rojo por algo que ya se sabe;
- un error **nuevo** sí pone la cruz roja;
- cuando alguien lo arregla, el resumen avisa "✅ ya no aparece, se puede
  sacar de la lista". No hace falta sacarlo enseguida: el flujo sigue verde.

Ejemplo de cómo se anota (el nombre entre comillas es el que aparece entre
corchetes al final del mensaje de error):

```js
const FALLAS_CONOCIDAS = {
  "datos:ganador:2026-09-06": "El partido figura como victoria de Central pero terminó 1-1. Avisado al dueño.",
};
```

Hoy la lista está **vacía**, porque no hubo errores (ver punto 4).

---

## 6. Dónde está cada cosa

Todo lo de los tests está en la carpeta `tests/` y en
`.github/workflows/tests.yml`. **La página no usa nada de eso**: no se agregó
ninguna librería ni ningún archivo que el sitio cargue, y no se modificó
ningún archivo del sitio ni ningún dato.

| Archivo | Para qué sirve |
|---|---|
| `tests/sitio.config.js` | Qué versión se revisa (lo único que puede hacer falta tocar). |
| `tests/lib/fallas-conocidas.js` | La lista de fallas conocidas. |
| `tests/verificador/datos.spec.js` | Controles de los datos y de los números escritos a mano. |
| `tests/verificador/archivos.spec.js` | Links, imágenes, estructura y JavaScript de cada página. |
| `tests/navegador/*.spec.js` | Tests en el navegador (carga, totales, filtros, tabla, navegación, secciones). |
| `tests/servidor.js` | Un servidor mínimo que muestra el sitio en la computadora para probarlo. |
| `tests/lib/datos.js` | Lee los partidos y hace las cuentas por separado. |
| `tests/lib/resumen.js` | Arma el resumen en español del final. |
| `.github/workflows/tests.yml` | Le dice a GitHub que corra los tests en cada pull request. |

**Una aclaración sobre "lo que se publica":** GitHub Pages publica *todo* lo
que hay en la rama principal, así que una vez mergeado, alguien que escriba
la dirección exacta (por ejemplo `.../tests/package.json`) podría ver estos
archivos. No tienen nada secreto, pesan muy poco (menos de 100 KB en total; las
librerías se instalan aparte y no se suben) y ninguna página los carga ni los
enlaza, así que el visitante no nota ninguna diferencia. Si en algún momento
se quisiera que ni siquiera sean accesibles, habría que cambiar la forma de
publicar (por ejemplo, publicar solo una carpeta); eso no se hizo para no
tocar cómo publica el dueño.

### Si la página cambia

Los tests buscan las cosas por los nombres internos que ya tiene la página
(`#counter`, `#tabla`, `#q`, etc.). Si una sesión futura cambia esos nombres o
saca una sección, el test correspondiente va a fallar con un mensaje que dice
qué no encontró: hay que actualizar el test en el mismo pull request. Si el
programa de actualización del dueño agrega partidos nuevos, **no hay que
tocar nada**: los tests leen los datos de la página y recalculan todo solos.
