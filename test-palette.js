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
// Capture the declaration AND the rest of its line. oklch() tokens carry their
// hex in a trailing comment that sits after the semicolon, so a pattern ending
// at the semicolon would never see it and every contrast check would report a
// missing hex regardless of the palette being correct.
for (const m of (root ? root[1] : '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);([^\n]*)/g)) {
  tok[m[1]] = { value: m[2].trim(), comment: (m[3] || '').trim() };
}

// Hex value per token, read from the value itself or from its trailing comment.
const hexOf = name => {
  const t = tok[name];
  if (!t) return null;
  const direct = (t.value + ' ' + t.comment).match(/#[0-9A-Fa-f]{6}/);
  return direct ? direct[0].toUpperCase() : null;
};

// ---- oklch vs hex-comment agreement ---------------------------------
// The browser renders the oklch value; every check below measures the hex
// comment. If the two disagree, this script grades a colour the page never
// shows, and it does so silently, which is the one way a guard can be worse
// than no guard. Convert each oklch back to sRGB and require agreement.
const l2s = c => { const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255))); };
const oklch2hex = (L, C, H) => {
  const A = C * Math.cos(H * Math.PI / 180), B = C * Math.sin(H * Math.PI / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  const r =  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  return '#' + [r, g, b].map(v => l2s(v).toString(16).padStart(2, '0').toUpperCase()).join('');
};
const TOLERANCE = 2;  // per channel, for rounding only
for (const [name, t] of Object.entries(tok)) {
  const ok = t.value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)\s*$/);
  const hx = t.comment.match(/#[0-9A-Fa-f]{6}/);
  if (!ok || !hx) continue;  // alpha variants and plain hex tokens are exempt
  const got = oklch2hex(+ok[1], +ok[2], +ok[3]);
  const want = hx[0].toUpperCase();
  const diff = Math.max(...[1, 3, 5].map(i =>
    Math.abs(parseInt(got.slice(i, i + 2), 16) - parseInt(want.slice(i, i + 2), 16))));
  if (diff > TOLERANCE) {
    fail.push(`${name}: oklch renders ${got} but its comment claims ${want} (off by ${diff} per channel). The page and this guard disagree.`);
  }
}

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

// Amber must NOT be usable as body text on sand. Assert the constraint is real,
// so a future palette tweak that silently makes it passable gets flagged.
// Never fall back to a passing value when a hex is missing: a check that skips
// itself silently is worse than no check at all.
{
  const a = hexOf('--amber'), s = hexOf('--sand');
  if (!a || !s) {
    fail.push('cannot check the --amber on --sand constraint: missing hex for --amber or --sand');
  } else {
    const r = ratio(a, s);
    if (r >= 3.0) fail.push(`--amber on --sand is now ${r.toFixed(2)}:1; the spec assumes it is unusable as type. Update the spec before relaxing this.`);
  }
}

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
  [/rgba\(\s*0\s*,\s*0\s*,\s*0/g,      'rgba(0,0,0,x): use a tinted ink'],
  [/rgba\(\s*255\s*,\s*255\s*,\s*255/g,'rgba(255,255,255,x): use a tinted paper'],
  [/rgba\(\s*37,\s*99,\s*235/g,        'hardcoded accent rgba: use a token'],
  [/rgba\(\s*15,\s*23,\s*42/g,         'cool slate shadow: retint warm'],
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
// The demo CTA is not a phone number and no longer a link either: the call
// runs on this page, in the #callDialog panel. So the thing to guard is that
// no dead phone link or placeholder number reaches a prospect, that every
// CTA still opens the panel, and that nothing sends a visitor off to /voice.
// Matched on href="tel: rather than tel:, or the comment in receptionist.html
// explaining this would count as a violation of itself.
const deadTel = (src.match(/href="tel:/g) || []).length;
if (deadTel) fail.push(`${deadTel} tel: link(s): the demo CTA should open the call panel`);

const placeholder = (src.match(/XXXX|\+31 ?6 ?X/g) || []).length;
if (placeholder) fail.push(`${placeholder} placeholder phone number(s) still in the page`);

const offPage = (src.match(/href="\/voice"/g) || []).length;
if (offPage) fail.push(`${offPage} CTA(s) still navigate to /voice: the call belongs on this page`);

const triggers = (src.match(/class="[^"]*call-trigger/g) || []).length;
if (triggers !== 4) fail.push(`expected 4 CTAs opening the call panel, found ${triggers}`);

// The panel is where the call is minted from, so these three have to exist for
// any of those triggers to do anything.
for (const need of ['id="callDialog"', 'id="callStart"', "'/voice/token'"]) {
  if (!src.includes(need)) fail.push(`call panel is missing ${need}`);
}

// AI Act art. 50 + GDPR art. 13 rest on this page alone: the agent does not
// speak the notice (Voice_agent/src/demo.ts:246) and the press IS the consent,
// so the AI fact, the recording fact and the controller must be in the panel,
// and the recording fact must sit ABOVE the button that starts the call.
const noticeAt = src.indexOf('class="call-notice"');
const startAt = src.indexOf('id="callStart"');
if (noticeAt === -1) fail.push('no AI/recording disclosure in the call panel');
else if (startAt === -1 || noticeAt > startAt) fail.push('the disclosure sits below the start button: the press is the consent');
for (const phrase of ['not a person', 'recorded', 'Daniel Kooij']) {
  if (!src.includes(phrase)) fail.push(`disclosure no longer says "${phrase}"`);
}
if (!/Talk to the AI \(recorded\)/.test(src)) fail.push('the start button label no longer carries the recording fact');

// ---- the frame -------------------------------------------------------
// Everything below this line guards the POSITIONING, which is the easiest
// thing on the page to lose and the hardest to notice losing. Dan,
// 2026-08-05: the pitch is the missed call, never the receptionist. A page
// that argues about a salary makes the owner picture a firing, and they stop
// thinking about the calls that are the reason to buy. Ported from the
// Spanish page at /voice, which was already framed this way.
//
// Comments in receptionist.html explain what was removed and therefore name
// the banned phrases, so everything here reads the page as a visitor does:
// HTML comments stripped out first.
const visible = src.replace(/<!--[\s\S]*?-->/g, '');

const FRAME_BANS = [
  [/AI receptionist/i,                    'the product is called an "AI receptionist": it is a phone line, not a person'],
  [/replaces? (your|a|the|any) receptionist/i, 'a replace-the-receptionist claim'],
  [/costs less than the receptionist/i,   'pricing the system against a salary'],
  [/versus \d+ with a receptionist/i,     'an hours-versus-a-human comparison'],
  [/€\s?(2,118|1,603|2,791)/,            'a receptionist salary figure — this page does not argue salary'],
  [/employer social security|gross,? which is/i, 'salary arithmetic'],
  // Wrong market. This page sells in Málaga; it was written with Indeed NL
  // figures and a "Can it handle Dutch?" FAQ, and shipped that way.
  [/Netherlands|Dutch|Indeed NL/,        'Dutch-market residue'],
];
for (const [re, label] of FRAME_BANS) {
  if (re.test(visible)) fail.push(`${label} (matched ${re})`);
}

// The frame is not only an absence. These three carry it, and a rewrite that
// drops them leaves a page with nothing positive in the position.
const FRAME_MUST = [
  [/when you can'?t pick it up/i,       'the hero does not say it answers WHEN YOU CAN\'T — the whole positioning'],
  [/No new line, no new handset/i,      'the "nothing changes on your side" promise is gone from the steps'],
  [/the phone rings anyway/i,           'the pain list no longer names the call the receptionist could not get to'],
];
for (const [re, label] of FRAME_MUST) {
  if (!re.test(visible)) fail.push(label);
}

// ---- what the page may claim -----------------------------------------
// A visitor now presses a button on THIS page and talks to the agent in
// sales-agent.ts thirty seconds later. That agent's HARD RULES forbid it from
// quoting a price or a monthly figure, promising a percentage, a revenue figure
// or a timeline, and inventing any figure about the prospect's business — "no
// industry averages, no assumed prices", in those words. demo.ts:263 records
// the consequence for the page: one that promises what the call must then
// refuse to repeat is worse than a plainer one. The Spanish page at /voice was
// held to this by build.test.ts from the start; when the call moved onto this
// page, this page inherited the obligation and nothing was checking it.
//
// The line drawn, which is narrower than "no numbers":
//   ALLOWED  — published stats with their source visible (62%, 21x)
//   ALLOWED  — a worked example whose assumptions are on screen and editable
//   ALLOWED  — figures the visitor typed into the calculator themselves
//   BANNED   — a figure asserted about them, an invented price, any promise
const CLAIM_BANS = [
  [/guarantee[ds]?\b/i,               'a guarantee: the agent may not promise an outcome, so the page may not either'],
  [/we'?ll keep optimising/i,         'an open-ended performance promise'],
  [/spots? remaining|spots? left/i,   'unverifiable scarcity'],
  [/€[\d,]+ ?(value|\/mo value)/i,    'an invented price tag on a deliverable'],
  [/(is|are) losing (somewhere )?around €/i, 'a euro figure asserted about the visitor rather than calculated from their input'],
  [/at the average, it'?s over €/i,   'an extrapolation stacked on an assumed job value'],
];
for (const [re, label] of CLAIM_BANS) {
  if (re.test(visible)) fail.push(`${label} (matched ${re})`);
}

// The two euro figures that ARE allowed are the worked example's, and they are
// only allowed because its assumptions are visible and editable. If that
// sentence goes, the figures stop being an example and become a claim.
if (/€13,125/.test(visible) && !/assumptions, shown openly/.test(visible)) {
  fail.push('the €13,125 worked example lost the line that shows its assumptions — without it the figure reads as a claim');
}

// Both published stats must keep their citation on screen. An uncited 62% is
// indistinguishable from an invented one.
for (const [stat, source] of [['62%', '411 Locals'], ['21x', 'Harvard Business Review']]) {
  if (visible.includes(stat) && !visible.includes(source)) {
    fail.push(`${stat} appears without its source (${source}) — an uncited statistic is an invented one`);
  }
}

// ---- report ----------------------------------------------------------
if (fail.length) { console.error('FAIL\n' + fail.map(f => '  - ' + f).join('\n')); process.exit(1); }
console.log(`OK: ${PAIRS.length} contrast pairs, ${BANS.length} ban rules, ${Object.keys(tok).length} tokens checked`);
