# Auditoría de datos, links y SEO — Clásico Rosarino

Fecha: 3 de noviembre de 2026.
Qué se revisó: todo el repositorio. Son 3 páginas (`index.html`, `prueba/index.html` y `revision/index.html`), 2 imágenes y `.nojekyll`. Se miraron los 371 partidos tal como están publicados (datos del 09/10/2026).

> **No se cambió ningún dato histórico.** Cada posible error queda listado con su ubicación y el motivo de la duda, para que decida el dueño. Las páginas tampoco se tocaron a mano, porque las genera un programa (ver punto 1).

---

## Resumen

| # | Tema | Impacto | Cantidad | ¿Qué se hizo? |
|---|------|---------|----------|---------------|
| D1 | Gol en contra marcado como "(e.g.)": un jugador de Newell's figura como goleador de Central | **Alto** | 1 partido | Para decidir (Excel o programa) |
| D2 | Goleadores que podrían estar en el equipo equivocado | **Alto** | 2 partidos seguros de revisar, y 2 jugadores más | Para decidir |
| D3 | Victorias por incomparecencia contadas como victorias en el balance | **Alto** | 5 partidos (3 de Central, 2 de Newell's) | Para decidir el criterio |
| D4 | Un mismo jugador escrito de varias formas (reparte sus goles en el ranking) | **Alto** | 8 casos probables | Para decidir |
| D5 | Partidos con goles sin goleador | Medio | 19 partidos, 62 goles (39 de Central y 23 de Newell's) | Para completar |
| D6 | Definiciones por penales: la web las cuenta como empate y el Excel como victoria | Medio | 3 partidos | Para decidir el criterio |
| D7 | El estadio no coincide con el local | Medio | 7 partidos | Para verificar |
| D8 | Dos partidos el mismo día | Bajo | 1 fecha | Para verificar |
| D9 | Nombres con solo apellido o con inicial | Bajo | 35 nombres | Para completar si se puede |
| D10 | Formato desparejo (tildes, instancias, penales, estadios) | Bajo | ~15 casos | Para unificar en el Excel |
| L1 | Links internos rotos | — | 0 | Nada que corregir |
| L2 | Imágenes faltantes | — | 0 (hay 1 imagen duplicada que no se usa) | Documentado |
| S1 | Sin JavaScript, la página muestra "0 victorias" y "0 clásicos" | **Alto (SEO)** | Toda la página | Cambio para el programa |
| S2 | Faltan la canónica, los datos estructurados, `robots.txt` y `sitemap.xml` | **Alto (SEO)** | — | Archivos agregados en `seo/` y `robots.txt` |
| S3 | Título mejorable, favicon que Google no puede mostrar y detalles menores | Medio/Bajo | — | Cambio para el programa |

**Lo que está bien** (se revisó y no aparecieron errores):
- Las 371 fechas existen, están en orden cronológico y ninguna es futura. La fecha escrita ("18 de junio de 1905") coincide en todos los casos con la fecha, el año y la década.
- Los 364 partidos jugados tienen un resultado que coincide con los goles de cada equipo y con quién fue local. El ganador coincide siempre con el marcador.
- En ningún partido los goles cargados por jugador superan el resultado.
- No hay partidos duplicados: cuando coinciden competencia, año y resultado, son la ida y la vuelta.
- Cada competencia tiene siempre el mismo ámbito (Nacional, Regional, Amistoso…).
- Los totales y estadísticas de la web **no pueden desfasarse de los partidos**: la página los calcula en el momento a partir de la lista de partidos. Totales actuales: 371 clásicos, 364 jugados, Central 134 victorias, Newell's 107 y 128 empates, con 2 sin resultado. Goles: Central 555 y Newell's 471. (Los desfasajes entre la hoja "Resumen por Competencia" del Excel y los datos, por ejemplo 370 contra 371 partidos, ya figuran en `/revision/` y no afectan a la web.)
- La versión principal y la de prueba tienen exactamente los mismos 371 partidos.

---

## 1. Cómo se genera el sitio (importante antes de corregir)

- `index.html` y `prueba/index.html` **los genera un programa local del dueño** ("Actualizar web.bat"), que no está en este repositorio. El programa toma una plantilla, le pone los datos del Excel (`const PARTIDOS = [...]`), completa la dirección de la página en `og:url` y sube el resultado con un commit "Actualizacion dd/mm/aaaa hh:mm". Lo dice la propia página: *"Los datos los pone 'Actualizar web.bat' desde el Excel"*. Todos los commits desde el 07/10/2026, salvo el primero, tienen ese formato.
- `revision/index.html` también es automático: es un formulario armado por *"una revisión automática"* del Excel (22/10/2026).
- **Consecuencia:** cualquier arreglo hecho a mano en esas tres páginas se pierde en la próxima actualización. Por eso este pull request **no las modifica**. Lo que dependa de ellas está explicado como cambio para la plantilla o el programa (punto 5).
- Los archivos nuevos de este PR (`robots.txt`, `seo/` y este informe) no los toca el programa, porque sus commits solo cambian las páginas que genera. **Conviene confirmarlo:** si el programa borrara del repositorio los archivos que no conoce, estos desaparecerían en la próxima actualización.

### Qué es cada versión

| Dirección | Qué es | Cómo se sabe |
|-----------|--------|--------------|
| `/` (`index.html`) | **La versión principal**, la que se comparte | No tiene `noindex`, su `og:url` es la raíz y la última actualización es del 09/10/2026 a las 14:55 |
| `/prueba/` | **Versión de prueba** de la misma plantilla, que se publica antes que la principal | Tiene `<meta name="robots" content="noindex">` y su `og:url` termina en `/prueba/`. Fuera de esas 2 líneas y los datos, es idéntica a la principal. Se actualizó 2 minutos antes (09/10, 14:53) |
| `/revision/` | **No es una versión del sitio**: es un formulario para que el dueño revise posibles errores del Excel y mande las respuestas por WhatsApp o mail | Tiene `noindex` y fue creado el 22/10/2026 |

No se borró ni se fusionó ninguna. Las tres son públicas: cualquiera que tenga el link puede abrirlas.

---

## 2. Datos de partidos — posibles errores para decidir

Cada partido se identifica por **fecha + competencia**, porque es lo único que no cambia. El número de fila del Excel puede variar: dentro de cada año, el Excel ordena por día y no por fecha completa (ítem 4 de `/revision/`). Cuando el caso ya figura en `/revision/`, se indica.

### D1 · Gol en contra escrito "(e.g.)" — Alto
- **14/11/1926, Copa Nicasio Vila 1926 (4-2).** Entre los goles de Central figura **"Miguel Castagno (e.g.)"**. El programa reconoce los goles en contra escritos como "(a.g.)" o "(e.c.)", pero no "(e.g.)". Por eso en la web aparece como **goleador de Central** (puesto 106 del ranking de Central), con el "(e.g.)" dentro del nombre y sin la marca de gol en contra.
- **Para corregir:** en el Excel, escribirlo como "(e.c.)" igual que los demás (ítem 18 de `/revision/`), o que el programa también reconozca "(e.g.)".

### D2 · Goleadores que podrían estar en el equipo equivocado — Alto
| Partido | Qué dice | Por qué hay duda |
|---------|----------|------------------|
| **08/07/1934, Torneo Luciano Molinas 1934 (2-3)** | Gabino Ballesteros, gol para **Central**. Juan Cagnotti, gol para **Newell's** | Los otros 6 goles de Ballesteros (1934–1936) son todos para Newell's, y los otros 3 de Cagnotti (1934–1935) son para Central. Parecen intercambiados. |
| **30/06/1968, Torneo Metropolitano 1968 (1-1)** | Julio César Fernández, gol para **Central**. José Agustín Mesiano, gol para Newell's | El 14/04/1968, en el mismo torneo, Julio César Fernández hizo el gol de **Newell's**. Además, es la fila donde el Excel pone a Newell's como local y también como visitante (ítem 1 de `/revision/`), lo que pudo mezclar los goles de cada lado. |
| Juan Francia | Goles para Newell's el 04/08/1918 (Copa de Honor) y el 18/11/1928 (Nicasio Vila). Goles para Central en 1923, 1930 y 1931 | Puede ser real si jugó en los dos clubes, pero conviene confirmarlo. |
| Humberto Fiore | Goles para Newell's en 1943–1944 y para Central el 11/04/1954 | Probablemente sea un pase real. Solo para confirmar. |

### D3 · Victorias por incomparecencia — Alto (cambia el balance)
En la web, estos 5 partidos **no jugados** suman como victoria en el balance histórico y en todos los totales:
- Central (3): 21/11/1914 (Copa Damas de Caridad, final), 27/05/1917 (Nicasio Vila) y 25/11/1923 (Nicasio Vila).
- Newell's (2): 18/06/1911 y 08/08/1920 (Nicasio Vila).

El Excel los marca como "RC (incomparecencia rival)", y su resumen los manda a "Otros" (ítem 14 de `/revision/`). El programa los convierte en victorias. **Hay que decidir el criterio:** si se cuentan o no, y en ese caso, aclararlo en la web. Los 2 partidos "no disputados: ambos sancionados" (27/11/1988 y 20/05/1990) no suman para nadie, lo cual parece correcto.

### D4 · El mismo jugador escrito de varias formas — Alto (reparte sus goles en el ranking)
| Variantes | Goles hoy | Efecto |
|-----------|-----------|--------|
| **José Fabbrini** / José Fabrini (Newell's, 1935–1938) | 8 + 2 | Juntos sumarían 10 y empatarían el **2.º puesto** de Newell's con Santamaría. Hoy figura 5.º |
| **Harry Hayes** / Juan Enrique Hayes (Central; "Juan Enrique" solo el 19/07/1909 y el 09/06/1918) | 23 + 3 | "Harry" suele citarse como el apodo de Juan Enrique Hayes. Si es la misma persona, serían 26 |
| **Ennis Hayes** / Ernesto Hayes (Central; "Ernesto" solo el 29/06/1916) | 8 + 2 | Serían 10 (ítem 19 de `/revision/`) |
| Plinio Guiribaldi / Ghiribaldi (Newell's, 1935 y 1937) | 1 + 1 | Distinta grafía del apellido |
| Eduardo Bellotti (1954) / Juan Emilio Bellotti (1955), Newell's | 2 + 1 | ¿La misma persona? |
| Hugo Sánchez (16/10/1977) / Hugo Paulino Sánchez (01/10/1978), Newell's | 1 + 1 | Probablemente la misma persona |
| Florencio Sarasíbar (01/11/1925) / Félix Sarasíbar (14/11/1926), Central | 1 + 1 | ¿La misma persona o hermanos? |
| Francisco Rodríguez (1938) / Francisco Rodrígues y Antonio Rodrígues (1960), Central | — | "Rodrígues" puede ser correcto si eran brasileños (ítem 20 de `/revision/`) |

Enrique Ricardo Hayes (1935–1940) es de otra época y no parece la misma persona que los Hayes de 1909–1920.

### D5 · Partidos con goles sin goleador — Medio
Son 19 partidos y 62 goles sin autor: 39 de Central y 23 de Newell's. La web los muestra como "Goleador sin registrar". Es correcto, pero esos goles no entran en el ranking. El resultado está escrito tal como figura en los datos, con el **local primero**.

| Fecha | Competencia | Resultado | Goles sin goleador |
|-------|-------------|-----------|--------------------|
| 13/08/1905 | Copa Santiago Pinasco 1905 | 2-2 | 2 de Central y 2 de Newell's |
| 28/04/1907 | Amistoso | 0-10 | 10 de Central |
| 24/11/1913 | Torneo C.A. Provincial | 1-0 | 1 de Central |
| 17/10/1915 | Copa Nicasio Vila 1915 | 0-6 | 6 de Central (en el Excel dice "(sin datos)") |
| 16/04/1916 | Amistoso | 4-2 | 4 de Central y 2 de Newell's |
| 30/07/1916 | Copa Nicasio Vila 1916 | 4-0 | 4 de Central |
| 31/08/1919 | Copa Nicasio Vila 1919 | 1-1 | 1 de Central y 1 de Newell's |
| 26/01/1935 | Copa Olinto Gallo | 2-4 | 4 de Central y 2 de Newell's |
| 23/10/1938 | Torneo Semana Rosario | 0-2 | 2 de Central |
| 28/01/1939 | Copa La Bengasina | 1-1 | 1 de Newell's |
| 21/12/1939 | Copa Carlos Colombres | 2-0 | 2 de Newell's |
| 17/12/1944 | Partido a beneficio | 2-3 | 2 de Newell's |
| 01/11/1945 | Copa Colaboración Monumento Gral. Las Heras | 3-2 | 3 de Newell's |
| 19/03/1946 | Amistoso | 3-5 | 5 de Newell's |
| 12/02/1949 | Copa Expresidentes | 2-2 | 2 de Newell's |
| 17/03/1953 | Torneo Agremiados | 3-2 | 2 de Central |
| 22/03/1964 | Copa Semino | 1-1 | 1 de Newell's |
| 07/11/1968 | Amistoso | 2-0 | 2 de Central |
| 07/03/1999 | Torneo Clausura 1999 | 4-1 | 1 de Central (ítem 3 de `/revision/`) |

### D6 · Penales — Medio (criterio)
| Partido | Resultado | Penales | En la web | En el resumen del Excel |
|---------|-----------|---------|-----------|-------------------------|
| 15/08/1974, Copa Gral. Perón | 2-2 | 8-7 (Central) | Empate | Victoria de Central |
| 27/01/2000, Copa Revancha | 1-1 | 6-7 (Newell's) | Empate | Victoria de Newell's |
| 30/07/2016, Copa Santa Fe 2016, cuartos de final, vuelta | 0-0 | 3-5 (Newell's) | Empate | Victoria de Newell's |

Contarlos como empate es lo habitual en las estadísticas, pero hay que elegir un criterio y usarlo en las dos partes (ítem 7 de `/revision/`). Además, el resultado está escrito de dos formas, "2(8)-2(7)" y "0-0 (p.3-5)" (ítem 13). En los tres casos Central fue local, así que no queda claro si los penales se escriben como "local-visitante" o como "Central-Newell's". Conviene definirlo antes del próximo partido que se defina por penales.

### D7 · El estadio no coincide con el local — Medio (afecta la sección "Canchas" y las estadísticas de local)
| Partido | Estadio | Local |
|---------|---------|-------|
| 13/08/1905, Copa Santiago Pinasco 1905 | Central | Newell's |
| 29/06/1916, Copa de Honor 1916 (octavos) | Newell's | Central |
| 06/10/1929, Copa Alfredo J. Rouillon | Newell's | Central |
| 03/08/1930, Copa Rosario | Central | Newell's |
| 25/05/1977, Metropolitano 1977 | Newell's | Central |
| 14/05/1978, Metropolitano 1978 | Newell's | Central |
| 23/06/1996, Clausura 1996 | Central | Newell's |

Los de 1977 y 1978 pueden ser reales, por las obras del Mundial 78 (ítem 8 de `/revision/`). Además, el **28/04/1907 (Amistoso, 0-10) no tiene estadio** (ítem 12).

### D8 · Dos partidos el mismo día — Bajo
- **27/05/1917:** un partido de la Copa Nicasio Vila 1917 "no jugado, ganó Central por incomparecencia" y un amistoso jugado (2-0). Puede ser real, si el amistoso se jugó en lugar del oficial, pero conviene confirmarlo (ítem 9 de `/revision/`).
- Competencias con nombre de un año jugadas al año siguiente: **11/01/1920 Nicasio Vila 1919** (desempate) y **10/01/1926 Copa Estímulo 1925** (final). Probablemente estén bien (ítem 10).

### D9 · Nombres incompletos — Bajo
- **Solo apellido (17):** Adroaldo, Biasetti (gol en contra de 1954), Cardozo, Conceiçao, Costa, Córdoba, Diogo, Eduardo, Ghiribaldi, González (1963), Gómez (1964), Hernández, Puggione, Pérez (1938), Tacchi, Urquiza y Zateli.
- **Con inicial (18), casi todos de 2004–2013:** A. Donatti, A. Ortega, C. Araujo, C. González, D. Braghieri, D. Chitzoff, E. Garay, E. Zelaya, G. Núñez, H. Boado, J. Achucarro, J. Boghossian, J. Maidana, M. Arzuaga, P. Wanchope, R. Schiavi, S. Salcedo y Ó. Cardozo (ítem 21 de `/revision/`). Con nombre completo serían más fáciles de encontrar en el buscador de la web.

### D10 · Formato desparejo — Bajo (no cambia resultados)
- Tildes: "Rubén Muñóz" (Muñoz), "Joaquin Torres" (Joaquín) y "Felix Ferreyra" (Félix). "Conceiçao" se escribe "Conceição" en portugués.
- Instancias escritas de varias formas: "Primera fase - 7ª", "Primera fase - 2ª fecha", "Primera Fase - F.1" y "Primera Fase" frente a "Primera fase". La fecha del torneo aparece a veces sola ("6ª fecha") (ítems 15 y 16 de `/revision/`).
- Temporadas: "Liguilla Pre-Libertadores 1988-89" y "Campeonato 1988/89" (ítem 17).
- Estadios neutrales sin ciudad: "Atlanta", "Arsenal", "River Plate", "Vélez Sarsfield" y "Ferro Carril Oeste" no dicen la ciudad, a diferencia de "Talleres (Córdoba)". "Central Córdoba" se puede confundir con "Central" (ítem 22). "Ind. Rivadavia (Mendoza)" está abreviado.

---

## 3. Links e imágenes

- **Anclas internas:** los links a secciones (`#partidos` y los demás) apuntan a secciones que existen. **0 rotos** en las tres páginas.
- **Links externos:** 3 (el artículo de Wikipedia, su historial y la licencia CC BY-SA 4.0), bien escritos. No se pudieron abrir desde este entorno porque no tiene salida a internet hacia esos sitios.
- **Links para compartir:** la página arma los links para compartir con la dirección de `og:url`. Están bien. En `/prueba/` apuntan a `/prueba/`, lo cual es correcto para probar.
- **Imágenes:** no hay `<img>`, porque los gráficos son SVG decorativos marcados `aria-hidden`, así que no hace falta `alt`. La imagen para compartir, `compartir.png`, existe y mide 1200×630, como declara la página. **`prueba/compartir.png` es una copia idéntica que no se usa:** la versión de prueba apunta a la imagen de la raíz. No se borró, porque podría usarla el programa.

---

## 4. SEO — configuración inicial

El sitio todavía no tiene dominio propio ni SEO configurado, así que esto es una puesta en marcha, no una revisión.

### Dirección del sitio (el único valor a completar)
El programa **ya tiene un único valor** con la dirección del sitio: es el que escribe en `og:url`, hoy `https://respiraventas.github.io/clasico_rosarino/` (la dirección gratuita de GitHub Pages, no un dominio propio). La propuesta es usar **ese mismo valor** para todo lo que necesita la dirección:

| Dónde | Cómo queda |
|-------|-----------|
| `og:url`, `og:image` y los links para compartir | Ya lo usan |
| Canónica, datos estructurados e imagen para X (`seo/plantillas/head-seo.html`) | Marcador `__DIRECCION_DEL_SITIO__` |
| `sitemap.xml` (`seo/plantillas/sitemap.xml`) | Marcador `__DIRECCION_DEL_SITIO__` |
| Línea `Sitemap:` de `robots.txt` (`seo/plantillas/robots.txt`) | Marcador `__DIRECCION_DEL_SITIO__` |

**Regla:** la dirección va completa y **terminada en "/"**, por ejemplo `https://ejemplo.com.ar/`. Cuando haya dominio propio, se cambia ese único valor en el programa y se actualiza todo junto. No se inventó ningún dominio.

### Archivos agregados en este PR
- `robots.txt` (raíz): permite todo y no depende de la dirección. **Aviso:** los buscadores solo leen `robots.txt` en la raíz de un dominio. Mientras el sitio esté en `respiraventas.github.io/clasico_rosarino/`, este archivo no tiene efecto. Queda listo para cuando haya dominio propio. No bloquea `/prueba/` ni `/revision/`: esas páginas ya tienen `noindex`, y si se bloquearan, el buscador no podría leer ese aviso.
- `seo/plantillas/robots.txt`: la versión con la línea `Sitemap:`, para que el programa la complete y la copie a la raíz.
- `seo/plantillas/sitemap.xml`: un sitemap con una sola dirección, la principal. Se puede cargar en Google Search Console aunque no haya dominio propio. Si el programa quiere, puede agregar `<lastmod>` con la fecha de cada actualización.
- `seo/plantillas/head-seo.html`: bloque para pegar en el `<head>` de la plantilla. Incluye la canónica, `robots`, los datos para X/Twitter y datos estructurados (JSON-LD) de tipo `WebSite` y `Dataset`, que aplican porque el historial es un conjunto de datos con licencia CC BY-SA. Se validó que el JSON-LD y el XML están bien formados. No se agregó autor (`creator`) para no inventarlo: si el dueño quiere figurar, se agrega ahí.

### S1 · Sin JavaScript, la página dice "0 victorias" — Alto
Todo el contenido (números, partidos, goleadores) lo dibuja JavaScript al abrir la página. Sin JavaScript, que es como la leen muchos buscadores, las vistas previas y los lectores de enlaces, el texto dice: *"Rosario Central 0 victorias VS 0 empates … Newell's Old Boys 0 victorias · 0 clásicos · buscar partidos"*. Google suele ejecutar JavaScript, pero puede mostrar esos ceros en el resultado de búsqueda, y los demás buscadores casi seguro.
**Cambio para el programa:** que escriba los números reales en la plantilla, igual que hoy escribe "Los 371 clásicos". Por ejemplo, `<span class="big" id="hRc">134</span>` en lugar de `0`, y lo mismo en `hNob`, `hE` y `hTot`. La página los recalcula igual al abrirse. Mejor todavía: que agregue una lista simple de los partidos (fecha, competencia y resultado) dentro de `<noscript>`. Así cada partido queda como texto que los buscadores pueden encontrar ("clásico rosarino 1974", por ejemplo).

### S2 · Falta lo básico — Alto
- No hay `<link rel="canonical">`. **Va en `head-seo.html`.**
- No hay datos estructurados. **Van en `head-seo.html`.**
- No había `robots.txt` ni `sitemap.xml`. **Agregados**, ver arriba.
- Los encabezados están bien: un solo `<h1>` ("Clásico Rosarino"), un `<h2>` por sección (20) y `<h3>`/`<h4>` adentro. `lang="es-AR"` está bien puesto.

### S3 · Mejoras de texto y detalles — Medio/Bajo
- **Título:** hoy es "Clásico Rosarino · 1905–2026" y no dice "historial" ni el nombre de los clubes, que es lo que se busca. Propuesta: `Historial del Clásico Rosarino: Central vs Newell's (1905–2026)`, con 63 caracteres. El año final lo sigue poniendo el programa.
- **Descripción:** está bien (144 caracteres). Si el programa puede, agregar el balance actual: "…Central 134, Newell's 107 y 128 empates…".
- **Favicon:** es un SVG incrustado (`data:`), que Google no muestra en los resultados. Conviene un archivo `favicon.png` o `.ico` (de 48×48 o más) referenciado con `<link rel="icon" href="favicon.png">`.
- **Comentario mal reemplazado (línea 8):** el programa reemplaza el marcador de dirección también dentro de un comentario, que queda como *"https://respiraventas.github.io/clasico_rosarino/ lo completa el programa…"*. No se ve en la página. Solo hay que cambiar el texto del comentario en la plantilla.
- **Comentario viejo (línea ~1488):** "Cuando cargues los 370…". Ya son 371. Es solo un comentario.
- **Versión de prueba:** está bien que tenga `noindex`. No debería llevar canónica ni datos estructurados (el bloque `head-seo.html` es solo para la principal).

---

## 5. Qué habría que cambiar en el programa ("Actualizar web.bat") y en la plantilla

Ordenado por impacto:
1. **Datos (D1):** reconocer "(e.g.)" como gol en contra, o avisar si aparece entre paréntesis algo que no reconoce.
2. **Criterio de victorias (D3 y D6):** decidir si las incomparecencias y los penales suman como victoria, y usar el mismo criterio en la web y en el Excel.
3. **SEO S1:** escribir en la plantilla los números reales del balance y, si se puede, la lista de partidos en `<noscript>`.
4. **SEO S2:** pegar `seo/plantillas/head-seo.html` en el `<head>` de la plantilla principal (no en la de prueba), y reemplazar `__DIRECCION_DEL_SITIO__` por el mismo valor que hoy usa para `og:url`.
5. **robots.txt y sitemap:** en cada actualización de la versión principal, tomar `seo/plantillas/robots.txt` y `seo/plantillas/sitemap.xml`, reemplazar `__DIRECCION_DEL_SITIO__` y guardarlos en la raíz como `robots.txt` y `sitemap.xml`.
6. **Título y favicon (S3).**
7. **Controles automáticos al generar:** que el programa avise, antes de publicar, si en algún partido los goles cargados no suman el resultado, si un jugador aparece en los dos equipos en el mismo año o si el estadio no coincide con el local. Son los chequeos de este informe, y evitarían que estos casos lleguen a la web.

---

## Cómo se hizo
Se extrajo la lista `PARTIDOS` de `index.html` y de `prueba/index.html` (son idénticas). Después se cruzaron, partido por partido, la fecha, la fecha escrita, el año y la década, el resultado, los goles de cada equipo, el local, el ganador, los penales, el estadio y la suma de goles por jugador. Los nombres de los goleadores se compararon sin tildes ni mayúsculas, por parecido de escritura y por apellido, y se buscó cada jugador en los dos equipos. Las anclas se cruzaron contra los `id` de cada página, y las imágenes contra los archivos del repositorio. Se tomaron en cuenta los ítems que ya estaban en `/revision/`, para no duplicarlos y para indicar cuáles todavía se ven en la web.
