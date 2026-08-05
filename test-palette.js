// Palette + banned-pattern guard for receptionist.html.
// No deps, same convention as test-roi.js. Run: node test-palette.js
const fs = require('fs');
const src = fs.readFileSync(__dirname + '/receptionist.html', 'utf8');
const fail = [];

// ---- WCAG contrast -------------------------------------------------
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05); };

// ---- read :root tokens ---------------------------------------------
const root = src.match(/:root\s*\{([\s\S]*?)\n\s*\}/);
if (!root) fail.push('no :root block found');
const tok = {};
for (const m of (root ? root[1] : '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tok[m[1]] = m[2].trim();

// Hex value per token. oklch() values carry a trailing /* #RRGGBB */ comment
// so this script can check them without a colour-space library.
const hexOf = name => {
  const v = tok[name];
  if (!v) return null;
  const direct = v.match(/#[0-9A-Fa-f]{6}/);
  return direct ? direct[0].toUpperCase() : null;
};

const PAIRS = [
  ['--text-primary',   '--paper',    4.5],
  ['--text-primary',   '--shell',    4.5],
  ['--text-primary',   '--sand',     4.5],
  ['--text-secondary', '--paper',    4.5],
  ['--text-secondary', '--shell',    4.5],
  ['--text-secondary', '--sand',     4.5],
  ['--accent',         '--paper',    4.5],
  ['--paper',          '--ink',      4.5],
  ['--paper',          '--ink-deep', 4.5],
  ['--text-on-ink',    '--ink',      4.5],
  ['--amber',          '--ink',      4.5],
  ['--amber',          '--paper',    3.0],  // large text only
];

for (const [fg, bg, min] of PAIRS) {
  const a = hexOf(fg), b = hexOf(bg);
  if (!a || !b) { fail.push(`missing token or hex comment: ${fg} / ${bg}`); continue; }
  const r = ratio(a, b);
  if (r < min) fail.push(`contrast ${fg} on ${bg} = ${r.toFixed(2)}:1, need ${min}:1`);
}

// Amber must NOT be usable as body text on sand — assert the constraint is real,
// so a future palette tweak that silently makes it passable gets flagged for review.
const amberSand = (hexOf('--amber') && hexOf('--sand')) ? ratio(hexOf('--amber'), hexOf('--sand')) : 0;
if (amberSand >= 3.0) fail.push(`--amber on --sand is now ${amberSand.toFixed(2)}:1; spec assumes it is unusable as type. Update the spec before relaxing this.`);

// ---- dead tokens ----------------------------------------------------
for (const name of Object.keys(tok)) {
  const uses = (src.match(new RegExp(`var\\(${name}\\b`, 'g')) || []).length;
  if (uses === 0) fail.push(`token ${name} declared but never referenced`);
}

// ---- banned patterns ------------------------------------------------
const css = src.slice(src.indexOf('<style>'), src.indexOf('</style>'));
const BANS = [
  [/backdrop-filter/g,                 'backdrop-filter (dead over opaque bg)'],
  [/border-left:\s*[2-9]px/g,          'side-stripe border-left'],
  [/border-right:\s*[2-9]px/g,         'side-stripe border-right'],
  [/rgba\(\s*0\s*,\s*0\s*,\s*0/g,      'rgba(0,0,0,x) — use a tinted ink'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255/g,'rgba(255,255,255,x) — use a tinted paper'],
  [/rgba\(\s*37,\s*99,\s*235/g,        'hardcoded accent rgba — use a token'],
  [/rgba\(\s*15,\s*23,\s*42/g,         'cool slate shadow — retint warm'],
  [/background-clip:\s*text/g,         'gradient text'],
];
for (const [re, label] of BANS) {
  const n = (css.match(re) || []).length;
  if (n) fail.push(`${n} × ${label}`);
}

// Colour literals in CSS, excluding :root. The logo SVG is exempt but lives in
// the body, not the stylesheet, so it is out of this slice already.
const cssNoRoot = css.replace(/:root\s*\{[\s\S]*?\n\s*\}/, '');
const literals = cssNoRoot.match(/#[0-9A-Fa-f]{6}/g) || [];
if (literals.length) fail.push(`${literals.length} hex literal(s) in CSS outside :root: ${[...new Set(literals)].join(', ')}`);

// ---- launch guard ----------------------------------------------------
const demo = (src.match(/DEMO-NUMBER/g) || []).length;
if (demo !== 5) fail.push(`expected 5 DEMO-NUMBER markers, found ${demo}`);

// ---- report ----------------------------------------------------------
if (fail.length) { console.error('FAIL\n' + fail.map(f => '  - ' + f).join('\n')); process.exit(1); }
console.log(`OK — ${PAIRS.length} contrast pairs, ${BANS.length} ban rules, ${Object.keys(tok).length} tokens checked`);
