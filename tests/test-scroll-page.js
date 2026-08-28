#!/usr/bin/env node
/* Comprueba la pagina compuesta (pelicula encima + es.html debajo).
 *
 *     node tests/test-scroll-page.js
 *
 * Las tres cosas que se rompen solas aqui, y por que cada una importa. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const scroll = fs.readFileSync(path.join(ROOT, 'scroll.html'), 'utf8');
const engine = fs.readFileSync(path.join(ROOT, 'assets/scroll/scrub-engine.js'), 'utf8');
const fail = [];

// 1. scroll.html se GENERA. Si alguien lo edita a mano, el siguiente compose se lo
//    lleva por delante sin avisar. Se recompone a un temporal y se compara.
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'scroll-')), 'out.html');
execFileSync('node', [path.join(ROOT, 'scroll-world/compose.js'), tmp]);
if (fs.readFileSync(tmp, 'utf8') !== scroll) {
  fail.push('scroll.html no coincide con lo que genera compose.js.\n' +
            '      O se edito a mano (los cambios van en es.html o en world.config.js),\n' +
            '      o falta ejecutar: node scroll-world/compose.js');
}

// 2. El motor se aparta al final SOLO si detecta contenido debajo, y lo detecta con
//    nextElementSibling. Si algo se cuela entre #world y el contenido, la pelicula
//    se queda pegada tapando la pagina entera.
const m = scroll.match(/<div id="world"><\/div>\s*(?:<!--[\s\S]*?-->\s*)*<(\w+)/);
if (!m) fail.push('no encuentro #world seguido de un elemento — el contenido de es.html debe ser su hermano siguiente');
else if (m[1].toLowerCase() === 'script') fail.push('detras de #world hay un <script>, no contenido: el motor no vera pagina debajo');

// 3. overflow-x en el <html> mata el position:sticky del nav de es.html. Medido:
//    con la regla, el nav se despega; sin ella, navTop=0. hidden y clip valen igual
//    de mal en la raiz.
if (/html\s*,\s*body\s*\{[^}]*overflow-x/.test(engine)) {
  fail.push('el motor pone overflow-x en html,body — eso rompe el sticky de la pagina de debajo; va solo en body');
}

// 4. La pagina se sirve en /scroll/ y es.html en la raiz. Una ruta relativa aqui es
//    un 404 en produccion que en local NO se ve (en local esta en la raiz igual que
//    es.html). El unico relativo legitimo es el del motor, que si cuelga de /scroll/.
const rel = [...scroll.matchAll(/\s(?:src|href|poster)="(?!https?:|\/|#|mailto:|tel:|data:)([^"]+)"/g)]
  .map(m => m[1])
  .filter(v => !v.startsWith('assets/scroll/'));
if (rel.length) {
  fail.push(`rutas relativas que darian 404 en /scroll/: ${[...new Set(rel)].join(', ')}\n` +
            '      compose.js deberia haberlas pasado a absolutas');
}

// 5. El CSS del motor vive en un template literal: un acento grave suelto en un
//    comentario lo parte y la pagina se despliega sin motor.
try { new Function(engine); } catch (e) { fail.push(`scrub-engine.js no compila: ${e.message}`); }

if (fail.length) {
  console.error(`\nFALLA — ${fail.length}:`);
  fail.forEach((f, i) => console.error(`  ${i + 1}. ${f}`));
  process.exit(1);
}
console.log(`OK — scroll.html reproducible desde es.html + world.config.js, #world seguido de <${m[1]}>, sticky a salvo, sin rutas relativas rotas, motor compila`);
