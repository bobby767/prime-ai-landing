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
 *     PUBLIC=1 node scroll-world/compose.js scroll-public.html
 *
 * Lo que hace, en orden:
 *   1. noindex  — POR DEFECTO. Un borrador no puede aparecer en Google al lado de
 *      la pagina real. Con PUBLIC=1 no se pone, y ESA salida es la que se sirve en
 *      la raiz. El default sigue siendo el borrador a proposito: quien componga sin
 *      pensar obtiene la version que no se indexa, que es el fallo barato. Nunca
 *      pueden estar las dos indexadas — misma copia en dos URLs — asi que servir la
 *      publica en / obliga a que /scroll/ redirija, y no a que sirva lo mismo.
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

// PUBLIC=1 = esta salida se sirve en la RAIZ y si se indexa.
const PUBLIC = process.env.PUBLIC === '1';

// BASE existe porque las rutas de los assets se resuelven contra la URL del
// DOCUMENTO, y este generador daba por supuesto que el documento vive en
// /scroll/. Ahi «assets/scroll/x» es /scroll/assets/scroll/x y todo cuadra. Servido
// en la raiz es /assets/scroll/x, que no existe: 404 del motor, mountScrollWorld
// undefined, cero escenas. La pagina se desplegaba entera y en blanco.
// Vacio por defecto —relativo— para que /scroll/ y el servidor local sigan
// funcionando igual; absoluto solo en la publica, que es la unica que se sirve
// desde otra ruta. Los ficheros no se duplican: /scroll/assets/ los sirve el
// `location /` general, y se comprueba abajo que no falte ninguno.
const BASE = PUBLIC ? '/scroll/' : '';

// CACHE-BUSTER. encode.sh escribe SIEMPRE el mismo nombre (obra.mp4 vale para la
// plastilina y para el fotorrealista), que es justo lo que hace que cambiar de
// pelicula no toque world.config.js ni scroll.html. El precio lo pago aqui: nginx
// no manda Cache-Control, solo etag + last-modified, asi que el navegador aplica
// frescura HEURISTICA (~10% de la edad del fichero) y puede no revalidar en horas.
// Medido el 2026-08-29: se desplegaron los 11 clips fotorrealistas, el servidor los
// servia correctos, y el navegador seguia pintando los de plastilina.
// El sello sale del mtime real de los ficheros, no de una constante a mano: cambia
// solo cuando cambian los bytes, y nadie tiene que acordarse de subirlo.
const stamp = (() => {
  let m = 0;
  for (const d of ['assets/scroll/vid', 'assets/scroll/still']) {
    const dir = path.join(ROOT, d);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) m = Math.max(m, fs.statSync(path.join(dir, f)).mtimeMs);
  }
  return Math.round(m / 1000).toString(36);
})();
const bust = (v) =>
  Array.isArray(v)              ? v.map(bust) :
  v && typeof v === 'object'    ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, bust(x)])) :
  typeof v === 'string' && /^assets\/scroll\/.+\.(mp4|webp)$/.test(v) ? `${BASE}${v}?v=${stamp}` :
  v;

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

const robots = PUBLIC ? '' : '\n  <meta name="robots" content="noindex, nofollow" />';

html = html.replace('</head>', `  <!-- GENERADO por scroll-world/compose.js — no editar a mano. -->${robots}
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

    /* La otra mitad del gancho body.sw-playing que pone el motor. .cta-movil es
       lo unico position:fixed de es.html (z-index 999, 80px pegados abajo) y
       flotaba sobre la pelicula las 14 pantallas, tapando la pista de scroll.
       Se va mientras la pelicula esta puesta y vuelve sola al salir.
       0,2,0 le gana al 0,1,0 del display:flex de @media (max-width:767px), asi
       que no hace falta !important. Va aqui y no en el motor porque el motor no
       sabe nada de es.html: el dice "estoy puesta", la pagina decide que esconde. */
    body.sw-playing .cta-movil { display: none; }
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
html = html.replace(HOST_SCRIPT, `  <script src="${BASE}assets/scroll/scrub-engine.js"></script>
  <script>
    mountScrollWorld(document.getElementById('world'), ${JSON.stringify(bust(config), null, 2).replace(/\n/g, '\n    ')});
  </script>

${HOST_SCRIPT}`);

// TODA ruta de asset del motor tiene que existir en disco. El 2026-08-30 la
// version publica se desplego con el <script> del motor apuntando a
// /assets/scroll/scrub-engine.js —que no existe— y el resultado fue una pagina
// que devolvia 200, pesaba 187 KB y no pintaba una sola escena. Nada la habria
// cazado antes del navegador. Esto la caza aqui: se recogen las rutas tal cual
// van a salir, se les quita BASE y el ?v=, y se comprueba el fichero.
const refs = [...new Set(
  [...html.matchAll(/"([^"]*assets\/scroll\/[^"]+)"/g)].map(m => m[1])
)];
const missing = refs.filter(r => {
  const rel = r.replace(/\?v=[^"]*$/, '').replace(BASE, '').replace(/^\//, '');
  return !fs.existsSync(path.join(ROOT, rel));
});
if (missing.length) throw new Error(
  `compose: ${missing.length} asset(s) que la pagina pide NO existen en disco:\n  ` +
  missing.join('\n  ') + `\n(BASE=${JSON.stringify(BASE)} — si esta vacio la pagina SOLO funciona servida en /scroll/)`);

fs.writeFileSync(OUT, html);
console.log(`compose: ${refs.length} assets del motor comprobados en disco, BASE=${JSON.stringify(BASE)}`);
console.log(`compose: scroll.html escrito — ${config.sections.length} escenas sobre ${(html.length / 1024).toFixed(0)} KB de es.html`);
console.log(`compose: rutas relativas pasadas a absolutas: ${rewritten.length ? rewritten.join(', ') : 'ninguna'}`);
