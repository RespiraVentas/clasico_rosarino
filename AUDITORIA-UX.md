# Auditoría de uso, celular, velocidad y accesibilidad

Fecha: 3 de noviembre de 2026 · Versión revisada: la de `index.html` en la rama principal (commit `44c0c55`).

## Antes de leer: por qué las correcciones vienen como parches y no tocan `index.html`

El propio `index.html` aclara que **lo genera "Actualizar web.bat" a partir del Excel y de una plantilla** que está en tu computadora y no en este repositorio. El programa reemplaza el bloque de datos de la plantilla y vuelve a escribir la página entera en cada actualización. El historial lo confirma: la actualización del 9 de octubre reemplazó `index.html` completo (más de 1.400 líneas).

Por eso, cualquier arreglo hecho directamente en `index.html` **se borraría en la próxima actualización**. Como pedía el encargo, no se tocó ninguna página publicada. Cada corrección quedó como un parche en `mejoras-ux/parches/`, para aplicar **en la plantilla**:

- Cada parche cambia solo el diseño o el código, **nunca el bloque de datos**, y no depende de la dirección de la página. Se comprobó que se aplican sin errores sobre una copia de `index.html` con los datos y la dirección reemplazados por marcas (o sea, una plantilla simulada), y también sobre `prueba/index.html`.
- `todo-junto.patch` reúne los siete en uno solo.

**Cómo aplicarlos (lo puede hacer una sesión de Claude Code abierta en tu PC):** pedile *"aplicá los parches de `mejoras-ux/parches/` (del 01 al 07) a la plantilla que usa Actualizar web.bat"*. Si los aplica a mano en la consola, el comando es `git apply --ignore-whitespace ruta/al/parche.patch`, ejecutado en la carpeta de la plantilla (`--ignore-whitespace` evita problemas si la plantilla tiene saltos de línea de Windows). Después alcanza con correr "Actualizar web.bat" como siempre.

### Qué versión es la principal

| Carpeta | Qué es | Criterio |
|---|---|---|
| `/` (`index.html`) | **La principal.** | Es la única sin `noindex`, su `og:url` apunta a la raíz y recibe las actualizaciones "de producción". |
| `/prueba/` | La versión de prueba de la misma plantilla. | Tiene `<meta name="robots" content="noindex">` y `og:url` a `/prueba/`. Fuera de esas dos líneas es idéntica a la principal, así que tiene los mismos problemas y los mismos parches le sirven. |
| `/revision/` | El formulario interno para revisar el Excel. | Tiene `noindex` y no es parte del sitio público. Se auditó igual (ver abajo). |

No se borró, movió ni fusionó ninguna versión.

## Cómo se probó

- El sitio se sirvió en local y se recorrió con Chromium sin interfaz (Playwright), con configuración regional `es-AR`.
- **Anchos de pantalla:** 360, 390, 768 y 1280 px, con capturas de página completa. En cada ancho se buscaron desbordes horizontales, elementos fuera de pantalla, textos cortados y zonas táctiles chicas.
- **Accesibilidad:** axe-core 4.10 en 360 y 1280 px, más un recorrido de 400 pasos con Tab para revisar que el foco se viera en cada elemento.
- **Interacción:** buscadores con acentos, mayúsculas, espacios, búsqueda vacía, símbolos (`% < " \ .*`), apóstrofos, guiones y búsquedas sin resultados; combinaciones de filtros sin resultados; botón "Limpiar"; ordenamientos; "Ver 50 más"; trivia completa; "Tu clásico" con fechas límite (hoy, 1880, futuras); "Comparar épocas" con el rango invertido; navegación a secciones con desplazamiento suave y con `#ancla` en la dirección.
- **Panel de datos:** se abrieron 63 datos tocables de todas las secciones con el teclado. En cada uno se revisó que el panel tuviera contenido válido, que el foco quedara adentro, que se cerrara con Escape y que el foco volviera al dato.
- **Velocidad:** se usó un servidor local **con compresión gzip, como GitHub Pages**, con red de celular emulada (150 ms de latencia y 1,6 Mbps) y CPU 4 veces más lenta. Cada número es la mediana de 5 cargas.

Los scripts están en `mejoras-ux/herramientas/`. Necesitan Node, Playwright y, para `audit.js`, el paquete `axe-core`.

## Hallazgos, ordenados por impacto

### Corregidos (en parches)

| # | Impacto | Problema | Dónde | Parche |
|---|---|---|---|---|
| 1 | **Alto** | En "Desglose por ámbito", con anchos de hasta 860 px (todos los celulares y tablets), las etiquetas de las tarjetas mostraban **códigos internos ("L370", "L366"…)** en lugar de "PJ", "Central", "Emp." y "Newell's". Además, tocar "Goles" abría un panel que decía *"Esta lista ya no está disponible"*. Causa: la etiqueta y el sistema de "todo clickeable" usaban el mismo atributo `data-l`, y el segundo pisaba al primero. | Sección 15 | `01-ambito-etiquetas` |
| 2 | **Alto** | **Buscar «Newell’s» con el teclado del celular daba 0 resultados.** El iPhone y muchos Android escriben el apóstrofo tipográfico ’ en lugar de '. Lo mismo pasaba con «newells» (sin apóstrofo) y con «1–0» (guion largo, el mismo que muestra la página). Ahora los tres casos dan los mismos resultados que «Newell's» y «1-0» (180 y 69 partidos). Afecta a los tres buscadores: partidos, goleadores y el filtro del panel. | Secciones 16 y 17, y el panel | `02-busqueda-apostrofos` |
| 3 | Medio | El panel que se abre al tocar un dato se anuncia como ventana modal, pero **con Tab el foco se escapaba a la página de atrás**, que no se ve. Se reprodujo en 12 secciones. Ahora el resto de la página queda inerte mientras el panel está abierto, y al cerrarlo el foco vuelve al dato que lo abrió. | Toda la página | `03-panel-foco` |
| 4 | Medio | **Contraste insuficiente** del texto chico sobre el rojo de Newell's (subtítulos, renglones y nombres): 3,4:1 y 4,3:1, cuando el mínimo es 4,5:1. Se pasó a blanco pleno solo en esa columna, sin cambiar el rojo. axe pasó de 18 fallas de contraste a 1, que es un falso positivo (ver "Sin resolver"). | Sección 10, "Goles que valieron un clásico" | `04-contraste-newells` |
| 5 | Bajo | En el gráfico "La carrera", **los años del eje se pisaban** en 360–768 px y se leía «20002020» y «19001920». Ahora se ocultan los años intermedios que no entran (el primero y el último quedan siempre), y se recalcula al girar la pantalla. | Sección 3 | `05-carrera-anios` |
| 6 | Bajo | No había enlace **"Saltar al contenido"**: con teclado, para llegar al contenido había que pasar por todos los botones del encabezado. Se agregó uno, invisible hasta que se llega con Tab. | Arriba de todo | `06-saltar-al-contenido` |
| 7 | Bajo | El cuadro de lectura de "Década por década" era un `<aside>` dentro de la sección, y los lectores de pantalla lo anunciaban como una región aparte. Pasa a `<div>`, sin cambio visual. | Sección 5 | `07-resumen-decadas-aside` |

Las capturas de antes y después están en `mejoras-ux/capturas/`.

### Revisado y sin problemas

- **Desbordes:** ninguno en las tres páginas y los cuatro anchos. El ancho de la página nunca supera el de la pantalla, y la tabla de partidos se convierte en tarjetas en celular.
- **Errores de JavaScript:** ninguno en consola durante todas las pruebas, ni antes ni después.
- **Foco de teclado:** visible en los 400 elementos recorridos con Tab, y todos tienen nombre accesible. Los campos tienen `<label>`.
- **Buscadores:** acentos, ñ, mayúsculas y espacios de más funcionan bien. Los símbolos no rompen nada y muestran el mensaje "Ningún clásico". "Limpiar filtros" deja todo como al principio.
- **Imágenes:** la página no tiene ninguna `<img>`, así que no hacía falta carga diferida. `compartir.png` (224 KB) solo se usa como vista previa al compartir y el navegador no la descarga.
- **Navegación:** el botón "buscar partidos" y las direcciones con `#seccion` llegan exactamente a la sección, en 390 y en 1280 px. Con los parches aplicados, las 20 entradas del menú "Secciones" también llegan exactamente a su sección.

### Velocidad: medición antes y después

| Medida (celular emulado, gzip) | Antes | Después |
|---|---|---|
| Descargas | 1 (todo en un archivo) | 1 |
| Peso transferido | 72 KB (344 KB sin comprimir) | 73 KB (346 KB) |
| Primer contenido visible | ~0,40 s | ~0,41 s |
| Página lista (DOMContentLoaded) | ~1,25 s | ~1,26 s |
| Bloqueo del hilo principal (TBT) | ~600 ms | ~600 ms |

La diferencia está dentro del margen de error: los parches no agregan peso. La página **ya es liviana** (un solo archivo, sin fuentes, sin imágenes y sin scripts externos), y los scripts van al final, así que no demoran la primera pintura. El JavaScript propio tarda unos 70 ms en una PC; el resto del bloqueo es el navegador acomodando una página muy larga, de unos 6.200 elementos.

Se probaron dos mejoras y **se descartaron a propósito**:

- **`content-visibility: auto` en las secciones de abajo.** Bajaba el bloqueo de 574 a 319 ms, pero **rompía la navegación**: el botón "buscar partidos" terminaba 2.700 px más abajo de la sección, y otros saltos quedaban corridos. No vale la pena.
- **Reutilizar el formateador de números.** No mostró ninguna diferencia medible, así que no se cambió.

## Sin resolver (queda para decidir)

1. **Controles anidados (medio, accesibilidad).** Varias tarjetas tocables ("Un día como hoy", "Récords", la barra del balance y otras) tienen `role="button"` y adentro un botón "Compartir". axe marca 35 casos (`nested-interactive`) y 34 de rol no permitido en ese tipo de elemento (`aria-allowed-role`). Algunos lectores de pantalla no anuncian el botón de adentro. Arreglarlo exige reestructurar esas tarjetas, por ejemplo con un botón o enlace principal y la tarjeta como contenedor normal, y tocar el manejador de teclado que depende de `role="button"`. Es un cambio de estructura más grande que un arreglo puntual, así que se deja documentado.
2. **Cuadraditos de "El ADN del clásico" (bajo).** Los 371 cuadraditos solo se pueden tocar con el mouse o el dedo; no se llega a ellos con el teclado. Hacerlos enfocables obligaría a pasar 371 veces Tab. Con teclado, la etiqueta de cada década abre la misma lista, así que hay una alternativa. Se deja así.
3. **"107" en negro sobre rojo en la portada (falso positivo).** axe lo marca porque calcula mal el fondo degradado y cree que es azul. Medido sobre la captura, el contraste es de 3:1 a 3,9:1 según la zona, justo en el mínimo para texto grande. Es parte de la identidad visual (Newell's en negro y rojo), así que no se tocó.
4. **Zonas táctiles chicas (bajo).** En 360 px, los cuadros de "Año por año" miden 23 × 34 px y los años del eje de "La carrera" tienen 21 px de alto. Cumplen la excepción de espaciado de WCAG 2.2 (hay al menos 24 px entre centros), y agrandarlos cambiaría el diseño de la grilla. Los enlaces dentro del texto ("131 veces") también entran en la excepción.
5. **Tipografía en Android (bajo, diseño).** Los títulos usan Impact, que viene en Windows, Mac y iPhone pero **no en Android**. Ahí se ven con la fuente común del sistema, más ancha y menos "de tribuna". Resolverlo implica incluir una fuente web, con algo más de peso. Es una decisión de diseño y no se tocó.
6. **"De 1900 a 2029" en el resumen de décadas (bajo, texto).** El rango muestra la década completa aunque los datos llegan hasta 2026. Es correcto como década, pero puede confundir. Es texto y no se cambió.
7. **`/revision/` (bajo).** Le falta un `<main>`, y axe marca 58 bloques fuera de regiones. No tiene otros problemas, ni desbordes ni zonas táctiles chicas. Como es un formulario interno con `noindex`, probablemente también generado por el programa, no se tocó.
8. **Aplicar los parches.** Hasta que no se apliquen en la plantilla y se vuelva a correr "Actualizar web.bat", el sitio publicado sigue con los problemas 1 a 7 de la tabla de arriba.
