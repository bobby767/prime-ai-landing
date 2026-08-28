#!/usr/bin/env node
/* Compone scroll.html = es.html + la pelicula encima.
 *
 *     node scroll-world/compose.js
 *
 * POR QUE SE GENERA Y NO SE COPIA A MANO: es.html es la pagina viva y cambia. Una
 * copia pegada de sus 170 KB se quedaria vieja el mismo dia. Aqui hay una sola
 * fuente para el texto de marketing (es.html) y otra para el de la pelicula
 * (world.config.js); esto solo las junta.
 *
 * Lo que hace, en orden:
 *   1. noindex  — es.html se indexa, este borrador NO puede aparecer en Google al
 *      lado de la pagina real.
 *   2. tokens --sw-* en el <head>. --sw-bg es #FAF8F5 y --paper de es.html es
 *      oklch(0.9798 0.0045 78.3): las dos dan rgb(250,248,245) exactas, medido en
 *      el navegador. Por eso el relevo no parpadea. Si alguien toca una, tiene que
 *      tocar la otra.
 *   3. #top + #world como primeros hijos del <body>. El motor exige que el
 *      contenido normal sea el hermano SIGUIENTE de #world: asi detecta que hay
 *      pagina debajo y se aparta al acabar. Si se mete algo entre medias, la
 *      pelicula se queda pegada y tapa la pagina.
 *   4. el motor + el mount al final del <body>.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'es.html');
const OUT = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'scroll.html');
const config = require('./world.config.js');

// El CSS del motor vive dentro de un template literal, asi que un solo acento
// grave en un comentario lo parte en dos y la pagina se despliega sin motor.
// Paso una vez por aqui. Se comprueba antes de componer nada.
const ENGINE = path.join(ROOT, 'assets/scroll/scrub-engine.js');
try {
  new Function(fs.readFileSync(ENGINE, 'utf8'));
} catch (e) {
  throw new Error(`compose: scrub-engine.js no compila (${e.message}) — busca un acento grave suelto en un comentario`);
}

let html = fs.readFileSync(SRC, 'utf8');

// Cada marcador se comprueba: si es.html cambia de forma, esto para en seco en vez
// de escribir un scroll.html silenciosamente roto.
const need = (marker) => {
  const n = html.split(marker).length - 1;
  if (n !== 1) throw new Error(`compose: esperaba 1 "${marker}" en es.html, encontrado ${n}`);
};
['<head>', '</head>', '<body>', '</body>'].forEach(need);

// es.html se sirve en la raiz (/), pero esta pagina vive en /scroll/. Sus rutas
// relativas (demo-call.mp4 pesa 22 MB) apuntarian a /scroll/demo-call.mp4 y darian
// 404 — en local no se nota porque ahi la pagina esta en la raiz igual que es.html.
// Se pasan a absolutas en vez de copiar el video: se sirve el mismo fichero.
// OJO: esto va ANTES de inyectar nada nuestro. El <script> del motor SI es relativo
// a proposito (/scroll/assets/...) y no debe tocarse.
const rewritten = [];
html = html.replace(
  /(\s(?:src|href|poster)=")(?!https?:|\/|#|mailto:|tel:|data:)([^"]+)"/g,
  (m, pre, val) => { rewritten.push(val); return `${pre}/${val}"`; });

if (/name="robots"/.test(html)) throw new Error('compose: es.html ya trae un meta robots; revisalo a mano');

html = html.replace('</head>', `  <!-- GENERADO por scroll-world/compose.js — no editar scroll.html a mano. -->
  <meta name="robots" content="noindex, nofollow" />
  <style>
    /* Mismos valores que --paper de es.html. Ver la cabecera de compose.js. */
    :root, .sw-root {
      --sw-bg:       #FAF8F5;
      --sw-ink:      #221D19;
      --sw-ink-soft: #6B5F54;
      --sw-accent:   #C2703D;
      --sw-font-display: 'Space Grotesk', sans-serif;
      --sw-font-body: 'Outfit', sans-serif;
    }
  </style>
</head>`);

html = html.replace('<body>', `<body>

  <div id="top"></div>
  <!-- El contenido normal de es.html empieza justo despues de #world y NO debe
       separarse de el: el motor mira nextElementSibling para saber que hay pagina
       debajo. -->
  <div id="world"></div>`);

// El motor va ANTES del <script> de es.html, no al final del body. Ese script lee
// ?lang / localStorage y llama a traducir() nada mas cargar; si la pelicula todavia
// no existe, sus data-en no estan en el DOM y se queda en espanol mientras el resto
// de la pagina ya esta en ingles. Montando antes, traducir() la barre con todo lo
// demas. #world esta arriba del body, asi que aqui ya existe.
const HOST_SCRIPT = '  <script>\n    (function () {';
need(HOST_SCRIPT);
html = html.replace(HOST_SCRIPT, `  <script src="assets/scroll/scrub-engine.js"></script>
  <script>
    mountScrollWorld(document.getElementById('world'), ${JSON.stringify(config, null, 2).replace(/\n/g, '\n    ')});
  </script>

${HOST_SCRIPT}`);

fs.writeFileSync(OUT, html);
console.log(`compose: scroll.html escrito — ${config.sections.length} escenas sobre ${(html.length / 1024).toFixed(0)} KB de es.html`);
console.log(`compose: rutas relativas pasadas a absolutas: ${rewritten.length ? rewritten.join(', ') : 'ninguna'}`);
