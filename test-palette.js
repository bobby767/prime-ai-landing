// Palette + banned-pattern + claim guard for BOTH landing pages.
// No deps, same convention as test-roi.js. Run: node test-palette.js
//
// One guard for two pages rather than a second copy of it: receptionist.html
// (English, clinics, deploys to /en/) and es.html (Spanish, trades, deploys to
// /es/) share the palette verbatim, so the colour and banned-CSS checks are
// identical and only the copy rules differ. PAGE below picks which page the
// shared block is currently reading; the per-page rules live at the bottom.
const fs = require('fs');
const read = f => fs.readFileSync(`${__dirname}/${f}`, 'utf8');
const PAGES = { en: read('receptionist.html'), es: read('es.html') };
const fail = [];

// Addresses proven to actually receive mail. Declared up here because two
// separate checks need it — the sweep over every address on both pages, near
// the bottom of this file, and the /es/ footer deletion-route check. The full
// reasoning, and why this list is meant to be awkward to extend, is with the
// sweep; the short version is that a dead address does not refuse a deletion
// request, it loses it. Do not add an entry until a real message has been
// delivered to it and read.
//   support@prime-ai.es  accepted by Proton's MX, 2026-08-07. This is what the
//                        pages now show. Evidence, stated exactly, because it
//                        is one step short of the bar written above: a real
//                        SMTP session over verified TLS to mail.protonmail.ch
//                        answered "250 2.1.5 Ok" for it, while a bogus address
//                        on the SAME domain in the SAME session got "550 5.1.1
//                        Address does not exist". The control matters — without
//                        it a server that accepts everything looks identical to
//                        one that accepts this. What is NOT yet confirmed is a
//                        message read in the inbox, so a mailbox that exists
//                        but is not visible to Dan would still slip through.
//   oscarinfo@proton.me  delivers (Proton). No longer on either page, kept here
//                        because /voice/privacidad still names it and it is a
//                        verified-good address to fall back to.
//   dan@prime-ai.es      NOT on the list and NOT a typo for the above. It was
//                        the plan until Dan created support@ instead. Proton
//                        answers 550 for it — the domain routes, the mailbox
//                        was never created. Note the DMARC record still sends
//                        aggregate reports to rua=mailto:dan@prime-ai.es, which
//                        therefore bounce; that is a DNS fix, not a code one.
const MAIL_OK = ['support@prime-ai.es', 'oscarinfo@proton.me'];
let PAGE = 'en';
let src = PAGES.en;
// Prefix every shared-block failure with the page it came from, or a palette
// error on one page reads as an error on the other.
const flag = m => fail.push(PAGE === 'en' ? m : `[${PAGE}] ${m}`);

// ---- WCAG contrast -------------------------------------------------
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05); };

// ---- shared: palette, contrast, banned CSS -------------------------
// Runs once per page. Everything in here is identical for both because both
// inline the same :root block; a divergence in the palette IS a finding, which
// is why this is one function over two pages rather than two hand-kept copies.
const seen = {};
function sharedChecks() {
  // ---- read :root tokens ---------------------------------------------
  const root = src.match(/:root\s*\{([\s\S]*?)\n\s*\}/);
  if (!root) flag('no :root block found');
  const tok = {};
  // Capture the declaration AND the rest of its line. oklch() tokens carry their
  // hex in a trailing comment that sits after the semicolon, so a pattern ending
  // at the semicolon would never see it and every contrast check would report a
  // missing hex regardless of the palette being correct.
  //
  // The value class excludes \n on purpose, and that is load-bearing. It used to
  // be [^;]+, which crosses newlines — so prose inside a :root comment that
  // happened to read "--clay:" would start a match there and run on to the NEXT
  // semicolon, swallowing the following real declaration whole. The consequence
  // was silent in the worst way: the named token got a garbage value, the token
  // after it was never registered at all, and hexOf() then returned nothing for
  // both, which the contrast loop treats as "exempt, skip" rather than as an
  // error. The guard printed OK while checking strictly fewer pairs than it
  // claimed. This is not hypothetical — it happened to --clay and --terra in
  // es.html on 2026-08-07, and the only reason it surfaced was the token COUNT
  // in the summary line not going up when a token was added.
  //
  // No real token value spans a newline in either page (verified against both
  // before tightening this), so nothing legitimate is lost. Keep the count in
  // the summary line: it is the only thing that makes this class of miss visible.
  for (const m of (root ? root[1] : '').matchAll(/(--[\w-]+)\s*:\s*([^;\n]+);([^\n]*)/g)) {
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
      flag(`${name}: oklch renders ${got} but its comment claims ${want} (off by ${diff} per channel). The page and this guard disagree.`);
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
    // The stat numbers in #cifras on es.html. Large display type, so 3.0 is
    // the bar it has to clear, and it sits at 4.13. Amber is what normally
    // carries a figure on this page, but amber on sand is 2.95 and fails even
    // for large text — the constraint asserted just below. Blue is what is
    // left that reads on a warm mid-tone, which is why the numbers are blue
    // and not the usual amber.
    ['--accent',         '--sand',     3.0],  // large text only (#cifras)
  ];

  for (const [fg, bg, min] of PAIRS) {
    const a = hexOf(fg), b = hexOf(bg);
    if (!a || !b) { flag(`missing token or hex comment: ${fg} / ${bg}`); continue; }
    const r = ratio(a, b);
    if (r < min) flag(`contrast ${fg} on ${bg} = ${r.toFixed(2)}:1, need ${min}:1`);
  }

  // Amber must NOT be usable as body text on sand. Assert the constraint is real,
  // so a future palette tweak that silently makes it passable gets flagged.
  // Never fall back to a passing value when a hex is missing: a check that skips
  // itself silently is worse than no check at all.
  {
    const a = hexOf('--amber'), s = hexOf('--sand');
    if (!a || !s) {
      flag('cannot check the --amber on --sand constraint: missing hex for --amber or --sand');
    } else {
      const r = ratio(a, s);
      if (r >= 3.0) flag(`--amber on --sand is now ${r.toFixed(2)}:1; the spec assumes it is unusable as type. Update the spec before relaxing this.`);
    }
  }

  // ---- dead tokens ----------------------------------------------------
  for (const name of Object.keys(tok)) {
    const uses = (src.match(new RegExp(`var\\(${name}\\b`, 'g')) || []).length;
    if (uses === 0) flag(`token ${name} declared but never referenced`);
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
    if (n) flag(`${n} × ${label}`);
  }

  // Colour literals in CSS, excluding :root. The logo SVG is exempt but lives in
  // the body, not the stylesheet, so it is out of this slice already.
  const cssNoRoot = css.replace(/:root\s*\{[\s\S]*?\n\s*\}/, '');
  const literals = cssNoRoot.match(/#[0-9A-Fa-f]{6}/g) || [];
  if (literals.length) flag(`${literals.length} hex literal(s) in CSS outside :root: ${[...new Set(literals)].join(', ')}`);

  seen[PAGE] = { pairs: PAIRS.length, bans: BANS.length, tokens: Object.keys(tok).length };
}

for (const [name, text] of Object.entries(PAGES)) {
  PAGE = name;
  src = text;
  sharedChecks();
}
PAGE = 'en';
src = PAGES.en;

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
// Comment-stripped ON PURPOSE, and all three of the checks below are defeated
// without it. receptionist.html mentions /voice/privacidad in a comment at
// line 29 — about 2,160 lines ABOVE the panel — so an unscoped search finds
// that one and reports the route present no matter what the panel contains.
// It writes <dialog> in a comment at line 1365, so scoping from the first
// match spans ~800 lines and swallows everything between. And the comment now
// sitting in the panel QUOTES the controller line it replaced, so a check for
// the literal name passes on the explanation of its own removal. The ES side
// hit the first two of these for real; this is the same body-building step it
// uses (test-palette.js:316).
const enBody = src.replace(/<!--[\s\S]*?-->/g, '');
const noticeAt = enBody.indexOf('class="call-notice"');
const startAt = enBody.indexOf('id="callStart"');
if (noticeAt === -1) fail.push('no AI/recording disclosure in the call panel');
else if (startAt === -1 || noticeAt > startAt) fail.push('the disclosure sits below the start button: the press is the consent');
for (const phrase of ['not a person', 'recorded']) {
  if (!enBody.includes(phrase)) fail.push(`disclosure no longer says "${phrase}"`);
}
// 'Daniel Kooij' used to be in that list. Dan removed it from this panel on
// 2026-08-07, matching the /es/ change in 943fb53. The requirement changed
// shape rather than weakening: the route to the controller must EXIST in the
// panel and must sit ABOVE the button, because the press is the consent and a
// route that only appears after it is not a route.
//
// What this cannot check is what /voice/privacidad actually serves. If that
// page is emptied or moved, art. 13 stops being satisfied anywhere in the flow
// and this guard stays green. On /en/ that blind spot is WIDER than on /es/:
// /es/ still carries the full controller line in its page footer, and this
// page has no footer copy at all, so /voice/privacidad is the single point of
// failure — and it is Spanish-only.
const enDialogAt = enBody.indexOf('<dialog');
const enPrivacyAt = enDialogAt === -1 ? -1 : enBody.indexOf('/voice/privacidad', enDialogAt);
if (enPrivacyAt === -1) {
  fail.push('the call panel has no route to the data controller — /voice/privacidad is the only place the name and address still live');
} else if (startAt !== -1 && enPrivacyAt > startAt) {
  fail.push('the route to the data controller (/voice/privacidad) sits below the start button — the press is the consent, so it has to be reachable before it');
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

// ---- es.html ---------------------------------------------------------
// The Spanish page is held to the rule the old /voice page was held to by
// build.test.ts, and it is stricter than the English page's: no euro sign, no
// percentage and no guarantee in the body copy at all. It has no calculator and
// no stats bar precisely because both would output figures it may not assert.
//
// BODY copy only. The stylesheet is full of legitimate percentages (width:100%)
// and the favicon data URI is full of escaped ones, so <head>, <style>, <script>
// and HTML comments all come out before anything is counted. build.test.ts bans
// '%' from demoPageHtml()'s CSS too; that is a stricter rule than this file
// needs, because that page's CSS is hand-written to avoid them and this one's is
// shared with the English page.
{
  const es = PAGES.es;
  const body = es
    .slice(es.indexOf('<body'))
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // ⚠ The blanket euro and guarantee bans were narrowed on 2026-08-06, when
  // Dan added the 30-day money-back guarantee and the missed-call sum. Read
  // this before widening or deleting either — the original rule was not
  // squeamishness, it was that the prospect hears sales-agent.ts thirty
  // seconds after reading this page.
  //
  // What actually holds, and what the agent is actually bound by:
  //   - It may not quote a price, a fee, or HOW THE PRICING WORKS. Not a
  //     number, not a range, not a shape. "It depends on how many calls you
  //     get" is a pricing MODEL and is banned exactly like a figure, because
  //     an agent invented one out loud on call_03a1953f.
  //   - It may not promise a result, a percentage, a number of bookings or a
  //     timeline.
  //   - A money-back guarantee is a commercial TERM, not a promised result,
  //     which is the line that lets it exist here at all — and the agent now
  //     carries it in the facts it may confirm.
  //   - Arithmetic on figures the VISITOR supplied is not an invented figure.
  //     It is the same sum the agent is instructed to do out loud.
  // So: euros are permitted where the visitor's own numbers or the guarantee
  // put them, and a price FOR THE SERVICE is still banned outright.
  const ES_BANS = [
    [/%/,                       'a percentage: the agent may not promise or cite one'],
    [/€\s*[\d.,]+\s*(al mes|\/\s*mes|mensual|a month|per month|monthly)/i,
                                'a monthly price for the service — the agent may not quote one'],
    [/[\d.,]+\s*€\s*(al mes|\/\s*mes|mensual|a month|per month|monthly)/i,
                                'a monthly price for the service — the agent may not quote one'],
    [/\b(desde|from)\s+€?\s*[\d]/i,
                                'a "from €X" price for the service'],
    [/\b(cuota mensual|setup fee|monthly fee|subscription fee|precio de alta)\b/i,
                                'a named fee for the service'],
    // The pricing MODEL ban, which is the one that is easy to break by
    // accident because it reads like helpful honesty rather than a price.
    // GAP CLOSED 2026-08-06. This used to require a price word in the same
    // sentence, because the "¿Cuánto cuesta?" FAQ opened "Depende de cuántas
    // llamadas te entran" — word for word the example sales-agent.ts:942 names
    // as a banned pricing MODEL ("not a number, not a range, not a shape") —
    // and failing the build on copy was Dan's call, not this file's. Dan made
    // that call: the FAQ now says "depende de lo que necesites", which is the
    // one answer the agent is permitted to give, so page and call agree.
    //
    // The narrow version is therefore gone rather than kept alongside. It
    // could only fire when a price word sat in the same sentence, and the
    // sentence that actually shipped the violation had none — it would have
    // stayed green through the entire failure it was named after.
    //
    // Both shapes are banned unconditionally now: price varying by call
    // VOLUME and price varying by rule COMPLEXITY. Neither appears anywhere
    // on the page in any other context (verified), so there is nothing
    // legitimate for this to catch by accident.
    [/\b(depende de cu[áa]nt[oa]s (llamadas|reglas)|depends on how many calls|lo complicad[ao]s? que sean tus reglas|how complicated your rules)\b/i,
                                'a pricing model (price varying by call volume or rule complexity) — banned exactly like a figure, and the agent may not repeat it'],
    [/gratis|sin coste/i,       'a free-of-charge claim, which is a price claim'],
    [/\bfree of charge\b|\bno cost\b/i, 'an English free-of-charge claim, which is a price claim'],
    // The English page's vertical. Catching it here is the cheap way to notice
    // someone has translated the wrong page into this one.
    // The English page's vertical. Still banned, but the reason changed on
    // 2026-08-06: es.html is no longer "the trades page", it sells to any
    // Málaga business. /en/ is still clinics, so this is still the cheap way
    // to notice someone has translated the wrong page into this one.
    [/paciente|cl[íi]nica|tratamiento/i, 'clinic vocabulary on es.html — that is /en/\'s vertical, not this one'],
  ];
  for (const [re, label] of ES_BANS) {
    if (re.test(body)) fail.push(`[es] ${label} (matched ${re})`);
  }

  // ── NO OCCUPATION IS NAMED, ANYWHERE ─────────────────────────────────
  // Added 2026-08-06, the same day the page stopped naming trades, because
  // nothing was keeping it that way: reverting both halves of that change
  // left this file green and exit 0.
  //
  // The page had named plumbers in three places, and they were found in two
  // separate passes — which is why this bans the vocabulary outright instead
  // of listing the strings that happened to ship:
  //   meta description   "Para fontaneros, reformas y negocios de Málaga"
  //   missed-calls list  "una avería" / "a leak"
  //   emergency FAQ      "en tu oficio" / "in your trade"
  //
  // The first pass fixed the description and reported the body as clean. It
  // was not; the grep behind that claim looked for trade NAMES (fontanero,
  // plumber) and the page was narrowed by the trade's WORK. A ban listing
  // only what shipped would repeat that mistake in a new vocabulary.
  const OCCUPATION = [
    [/fontaner[oa]s?/i,                  'fontaneros'],
    [/\bplumb(er|ers|ing)\b/i,           'plumbers'],
    [/albañil(es)?/i,                    'albañiles'],
    [/\breformas\b/i,                    'reformas as a trade'],
    [/\bbuilders\b/i,                    'builders'],
    [/\btrades(man|men|people)?\b/i,     'trades'],
    [/\ben tu oficio\b|\bin your trade\b/i, 'a trade named as the reader\'s own'],
    [/\buna aver[íi]a\b/i,               '"una avería" — repair-trade framing, narrower than it looks'],
    [/inside a leak/i,                   '"a leak" — the English that quietly narrowed this page to plumbers'],
  ];

  // CHECKED TWICE, ON PURPOSE. `body` starts at <body> and strips <script>,
  // so it can see neither the <meta name="description"> in the head nor the
  // T.es/T.en.descripcion strings the language switch swaps in. That blind
  // spot is exactly how "the visible copy names no trade" was true while
  // every search result still promised a plumber page. The descriptions get
  // their own pass.
  const descriptions = [
    ...[...es.matchAll(/<meta name="description" content="([^"]*)"/g)].map((m) => m[1]),
    ...[...es.matchAll(/descripcion:\s*(['"])([\s\S]*?)\1/g)].map((m) => m[2]),
  ];
  // Never let this check pass by finding nothing. If the markup is reshaped
  // so the strings stop matching, that is a silent hole, not a green build —
  // the same rule the --amber/--sand check above follows.
  if (descriptions.length !== 4) {
    fail.push(
      `[es] expected 4 description strings (the static meta, T.es, T.en, T.nl), found ${descriptions.length} — ` +
        'the occupation check cannot confirm it covered them, so it is not reporting green',
    );
  }

  for (const [re, label] of OCCUPATION) {
    if (re.test(body)) {
      fail.push(`[es] ${label} in the page copy — this page sells to "negocios de Málaga" and names no occupation (matched ${re})`);
    }
    if (re.test(descriptions.join(' \0 '))) {
      fail.push(`[es] ${label} in a meta description — the search snippet must not promise a page the visitor does not land on (matched ${re})`);
    }
  }

  // Art. 50 + art. 13 rest on this page alone once a visitor presses the
  // button: the agent does not speak the notice (demo.ts:246) and the press IS
  // the consent, so the recording fact cannot be disclosed after it.
  const avisoAt = body.indexOf('class="aviso"');
  const irAt = body.indexOf('id="ir"');
  if (avisoAt === -1) fail.push('[es] no AI/recording disclosure in the call panel');
  else if (irAt === -1 || avisoAt > irAt) fail.push('[es] the disclosure sits below the start button: pressing it is the consent');
  // 'Daniel Kooij' used to be in this list. Dan removed it from the panel on
  // 2026-08-07: introducing himself as the data controller to someone who only
  // wants to hear the agent was noise. The controller identity has NOT been
  // dropped, it has moved to the second layer — /voice/privacidad carries the
  // name, address and email, verified on the live page rather than assumed.
  //
  // So the requirement here changed shape rather than weakening: the link must
  // exist AND must sit above the button, because the press is the consent and a
  // route to the controller that appears afterwards is not a route at all. What
  // this cannot check is what the linked page actually says. If
  // /voice/privacidad is ever emptied or moved, art. 13 quietly stops being
  // satisfied anywhere in the flow and this guard will still be green. That is
  // the known blind spot of layered disclosure; it is a live dependency, not a
  // one-off edit.
  for (const phrase of ['Es una IA, no una persona', 'La llamada se graba', '/voice/privacidad']) {
    if (!body.includes(phrase)) fail.push(`[es] the disclosure no longer carries "${phrase}"`);
  }
  // Scoped to the <dialog> ON PURPOSE. The first /voice/privacidad in the
  // document belongs to the FOOTER, which sits above the dialog in the source,
  // so an unscoped indexOf compares the footer's link against the panel's
  // button and passes no matter where the panel's own link is. That is exactly
  // how this check was first written, and it reported green while the panel's
  // link sat below the button.
  const dialogAt = body.indexOf('<dialog');
  const privacidadAt = dialogAt === -1 ? -1 : body.indexOf('/voice/privacidad', dialogAt);
  if (privacidadAt === -1) {
    fail.push('[es] the call panel has no route to the data controller — /voice/privacidad is the only place the name and address still live');
  } else if (irAt !== -1 && privacidadAt > irAt) {
    fail.push('[es] the route to the data controller (/voice/privacidad) sits below the start button — the press is the consent, so it has to be reachable before it');
  }
  if (!/Hablar con la IA \(se graba\)/.test(body)) {
    fail.push('[es] the start button label no longer says the call is recorded');
  }

  // The footer, after Dan took his name and city out of it on 2026-08-07.
  //
  // What left the page was the controller's IDENTITY. What must not leave is
  // the ROUTE — the address to write to and the link to the notice — because
  // that is now the only thing on any page of this site that lets a visitor
  // act on the recording. The identity itself moved one layer down to
  // /voice/privacidad, which is served by a DIFFERENT repository
  // (Voice_agent/src/demo.ts, PM2 prime-voice). Verified 2026-08-07: that page
  // returns 200 and carries the name, Fuengirola, Málaga and the email.
  //
  // This check cannot see any of that. It proves the footer still offers a way
  // out; it cannot prove anything is on the other end of the link. If
  // /voice/privacidad is emptied or moved, art. 13 stops being satisfied across
  // the whole site and this stays green. That is a live cross-repo dependency,
  // not a one-off edit, and the deploy that breaks it will not touch this file.
  {
    const pie = body.match(/<footer class="pie"[\s\S]*?<\/footer>/);
    if (!pie) {
      fail.push('[es] no <footer class="pie"> found — the deletion route lives there');
    } else {
      // The footer holds its content TWICE: as live markup, and escaped inside
      // data-en for the language swap. Checking the raw footer therefore proves
      // nothing — a regex matches whichever copy it hits first and cannot say
      // which. Deleting the visible link leaves English-mode visitors fine and
      // strands Spanish-mode ones, and vice versa, so both layers are asserted
      // separately. Written this way after the single-layer version passed with
      // the visible mailto and the visible privacy link both deleted.
      const unescape = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      const layers = {
        // visible: the same markup with EVERY translation attribute removed.
        // Both of them, and that is not tidiness: leaving data-nl in means the
        // Dutch payload's own mailto satisfies this check, and deleting the
        // visible Spanish link goes green. Exactly the failure the two-layer
        // split was written for, one language later.
        'Spanish (visible markup)': pie[0].replace(/\sdata-(?:en|nl)="[^"]*"/g, ''),
        // translated: the concatenated payloads of each language, unescaped
        'English (data-en payload)': [...pie[0].matchAll(/\sdata-en="([^"]*)"/g)]
          .map(m => unescape(m[1])).join('\n'),
        'Dutch (data-nl payload)': [...pie[0].matchAll(/\sdata-nl="([^"]*)"/g)]
          .map(m => unescape(m[1])).join('\n'),
      };
      for (const [layer, f] of Object.entries(layers)) {
        if (!f.trim()) continue;  // no data-en in the footer at all is legitimate
        const mail = f.match(/mailto:([^"'?>\s&]+)/);
        if (!mail) {
          fail.push(`[es] the footer's ${layer} no longer offers an email address to ask for the recording to be deleted — with the controller name gone from the page, this is the only route left on it`);
        } else if (!MAIL_OK.includes(mail[1])) {
          fail.push(`[es] the footer's ${layer} offers ${mail[1]} for deletion requests, which is not on the delivering-address allowlist — a deletion request sent there is not refused, it is lost`);
        }
        if (!f.includes('/voice/privacidad')) {
          fail.push(`[es] the footer's ${layer} no longer links to /voice/privacidad — that page is now the ONLY place the data controller is identified anywhere on this site`);
        }
      }
    }
  }

  // The frame, positively. Same three load-bearing ideas as the English page.
  const ES_MUST = [
    [/cuando no puedes cogerlo/i,          'the hero does not say it answers WHEN YOU CANNOT — the whole positioning'],
    [/Ni l[íi]nea nueva, ni aparato nuevo/i, 'the "nothing changes on your side" promise is gone from the steps'],
    [/el tel[ée]fono suena igual/i,        'the page no longer names the call the person on the phone could not get to'],
    [/no lo sustituye/i,                   'the "it does not replace anyone" section is gone'],
  ];
  for (const [re, label] of ES_MUST) {
    if (!re.test(body)) fail.push(`[es] ${label}`);
  }

  // The panel is the only conversion path on this page besides the cal link, so
  // these have to exist for any of its buttons to do anything.
  for (const need of ['id="panel"', 'id="ir"', "'/voice/token'", "'/voice/retell.js'"]) {
    if (!es.includes(need)) fail.push(`[es] call panel is missing ${need}`);
  }
  const disparadores = (es.match(/class="[^"]*llamar/g) || []).length;
  if (disparadores < 3) fail.push(`[es] only ${disparadores} buttons open the call panel; expected at least 3 (nav, hero, cierre)`);
  if (!/lang="es"/.test(es)) fail.push('[es] the page does not declare lang="es"');

  // ---- the guarantee, the sum, and the outcome ------------------------
  // All three were added 2026-08-06 at Dan's request. Each carries a way to
  // break quietly, so each gets a check.

  // The guarantee is a commercial term the agent now confirms out loud. The
  // page and the agent must say the SAME term: a page that grows a condition
  // ("on annual plans") or a different window is a page the call contradicts.
  for (const phrase of ['Garantía de 30 días', 'Thirty days, money back']) {
    if (!body.includes(phrase)) fail.push(`[es] the guarantee no longer says "${phrase}"`);
  }
  if (!/te devuelvo hasta el último euro/i.test(body) || !/you get every euro back/i.test(body)) {
    fail.push('[es] the guarantee no longer promises the money back in both languages');
  }
  // The qualification gate the guarantee leans on. sales-agent.ts: "a
  // guarantee on a low-inbound business is a loaded gun — the machine has
  // nothing to eat, so it cannot deliver and the client churns angry." The
  // page offsets that by telling low-volume businesses this is not for them.
  // Delete that line and the guarantee is uncovered, so this fails with it.
  if (!/dos o tres llamadas a la semana/i.test(body) || !/two or three calls a week/i.test(body)) {
    fail.push('[es] the "not for you if you get two or three calls a week" qualifier is gone — the 30-day guarantee depends on it (sales-agent.ts: a guarantee on a low-inbound business cannot be delivered)');
  }

  // The sum must stay the agent's sum. These three constants are the whole
  // model and they are duplicated from sales-agent.ts PITCH_STATE by
  // necessity — different repo, no shared module. test-roi.js checks the
  // arithmetic; this checks nobody quietly made the number bigger.
  if (!/var DIAS_LABORABLES = 20;/.test(es)) {
    fail.push('[es] the working-month is no longer 20 days — the agent says 20 out loud');
  }
  if (!/var PROPORCION_QUE_RESERVA = 1 \/ 3;/.test(es)) {
    fail.push('[es] the booking share is no longer a third — the agent announces a third as its own rough assumption');
  }
  // No preselected answer. A figure on screen before the visitor has said
  // anything is the page inventing a number about their business, which is
  // the one thing the agent may never do.
  if (/<input[^>]*name="(llamadas|precio)"[^>]*\schecked/i.test(body)) {
    fail.push('[es] a calculator option ships preselected — the sum must show nothing until the visitor gives both figures');
  }
  for (const need of ['name="llamadas"', 'name="precio"', 'id="cifra"']) {
    if (!body.includes(need)) fail.push(`[es] the missed-call sum is missing ${need}`);
  }
  // The framing rule, which is the easiest of all of these to lose in an
  // edit: what the sum shows is what is being MISSED, never what Prime AI
  // hands back. sales-agent.ts bans the second reading outright.
  if (!/no lo que te devolvemos/i.test(es) || !/not what we hand back/i.test(es)) {
    fail.push('[es] the sum no longer says the figure is what is being missed rather than what Prime AI returns');
  }
  for (const claim of [
    /te ahorras/i, /ahorrar[áa]s/i, /you will save/i, /you'll save/i,
    /recuperamos/i, /we recover/i, /we will get you/i, /te devolvemos ese dinero/i,
  ]) {
    if (claim.test(body)) {
      fail.push(`[es] the page claims Prime AI recovers or saves the money (${claim}) — provable is "this is what is walking past", not "we get you this"`);
    }
  }

  // ---- the ES/EN switch ----------------------------------------------
  // One page, two languages: Spanish in the markup, English in data-en. The
  // direction is the rule being enforced here, not a detail. nginx sends the
  // bare domain to this page, so Spanish has to be what renders with no
  // JavaScript having run; if English were the markup, the default language
  // would depend on a script, and the swap would capture English into
  // data-es on first use and lose the Spanish permanently.
  const enValues = [...body.matchAll(/data-en="([^"]*)"/g)].map(m => m[1]);
  const nlValues = [...body.matchAll(/data-nl="([^"]*)"/g)].map(m => m[1]);

  // Counting data-en attributes cannot catch the failure that actually
  // happens — a NEW Spanish string added with no English — because the count
  // simply does not move. So this checks the containers that carry copy: if
  // an element has one of these classes, it is visible prose by definition
  // and must have an English half. Adding a section without its data-en now
  // fails here instead of shipping a Spanish paragraph inside an English page.
  const TRANSLATABLE = [
    'rotulo', 'respuesta-txt', 'llamar', 'marbete', 'titular',
    'entrada', 'letra-chica', 'unidad', 'aviso', 'panel-chica',
  ];
  for (const cls of TRANSLATABLE) {
    const tags = body.match(new RegExp(`<[^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`, 'g')) || [];
    if (!tags.length) fail.push(`[es] no .${cls} on the page — the translation check for it is now inert`);
    for (const tag of tags) {
      if (!tag.includes('data-en=')) {
        fail.push(`[es] a .${cls} carries no data-en, so it stays Spanish when the page switches: ${tag.slice(0, 70)}`);
      }
      if (!tag.includes('data-nl=')) {
        fail.push(`[es] a .${cls} carries no data-nl, so it stays Spanish when the page switches to Dutch: ${tag.slice(0, 70)}`);
      }
    }
  }

  // The one that catches the drift nobody means to cause. English arrived
  // first and is on all 96 strings, so [data-en] IS the list of translatable
  // copy — and traducir() iterates exactly that list. An element that gains a
  // data-en without a data-nl therefore renders its Spanish inside a Dutch
  // page (the fallback keeps it readable rather than printing "undefined"),
  // and nothing about the page looks broken enough to notice. Asserted per
  // TAG rather than by comparing counts: equal counts prove nothing when one
  // element has both and the next has neither.
  for (const tag of body.match(/<[^>]*\sdata-en="[^"]*"[^>]*>/g) || []) {
    if (!/\sdata-nl="/.test(tag)) {
      fail.push(`[es] this element has English but no Dutch, so it stays Spanish for a Dutch visitor: ${tag.slice(0, 90)}`);
    }
  }
  if (/\sdata-es="/.test(body)) {
    fail.push('[es] a data-es is baked into the markup — Spanish belongs in the element itself; data-es is written at runtime and only after the first switch');
  }
  for (const [re, label] of [
    [/data-idioma="es"/, 'the ES button'],
    [/data-idioma="en"/, 'the EN button'],
    [/data-idioma="nl"/, 'the NL button'],
  ]) {
    if (!re.test(body)) fail.push(`[es] the language switch is missing ${label}`);
  }
  if (enValues.some(v => v.trim() === '')) {
    fail.push('[es] a data-en is empty — switching to English would blank that element');
  }
  if (nlValues.some(v => v.trim() === '')) {
    fail.push('[es] a data-nl is empty — switching to Dutch would blank that element');
  }

  // Spanish left inside an English string. Accents are useless as a signal
  // (Málaga is in the English copy too), so this looks for punctuation and
  // function words that no English sentence contains.
  const SPANISH_IN_EN = /[¿¡ñ]|\b(que|para|los|las|con|una|tus|del)\b/i;
  for (const v of enValues) {
    if (SPANISH_IN_EN.test(v)) {
      fail.push(`[es] untranslated Spanish inside a data-en: "${v.slice(0, 60)}…"`);
    }
  }

  // Same idea for the Dutch, minus "los" — which is an ordinary Dutch word
  // (loose, undone) and would fire on correct copy. Spanish that got left in
  // never arrives as a lone "los" anyway; it arrives as a whole clause, and
  // the other seven words catch a clause.
  const SPANISH_IN_NL = /[¿¡ñ]|\b(que|para|las|con|una|tus|del)\b/i;
  for (const v of nlValues) {
    if (SPANISH_IN_NL.test(v)) {
      fail.push(`[es] untranslated Spanish inside a data-nl: "${v.slice(0, 60)}…"`);
    }
  }

  // The same four load-bearing ideas as ES_MUST, in the English half. A
  // translation may be looser than the Spanish anywhere else; not here.
  const EN_MUST = [
    [/when you can't pick up/i,     'the English hero does not say it answers WHEN YOU CANNOT — the whole positioning'],
    [/No new line, no new handset/i, 'the English "nothing changes on your side" promise is gone from the steps'],
    [/the phone rings just the same|the phone rings anyway/i, 'the English copy no longer names the call the person on the phone could not get to'],
    [/does not replace them/i,      'the English "it does not replace anyone" section is gone'],
  ];
  for (const [re, label] of EN_MUST) {
    if (!re.test(body)) fail.push(`[es] ${label}`);
  }

  // Art. 50 + art. 13 again, in English. The press IS the consent, so an
  // English visitor has to be told the same three things before pressing:
  // that it is an AI, that the call is recorded, and who holds the recording.
  for (const phrase of ['This is an AI, not a person', 'The call is recorded', 'Talk to the AI (recorded)']) {
    if (!body.includes(phrase)) {
      fail.push(`[es] the English disclosure no longer carries "${phrase}" — pressing the button is the consent in both languages`);
    }
  }

  // ---- the Dutch half -------------------------------------------------
  // The same four load-bearing ideas as ES_MUST and EN_MUST. A third
  // language is where a page starts saying three slightly different things.
  const NL_MUST = [
    [/als jij niet kunt opnemen/i,  'the Dutch hero does not say it answers WHEN YOU CANNOT — the whole positioning'],
    [/Geen nieuwe lijn, geen nieuw toestel/i, 'the Dutch "nothing changes on your side" promise is gone from the steps'],
    [/gaat de telefoon (?:toch|net zo goed) over/i, 'the Dutch copy no longer names the call the person on the phone could not get to'],
    [/vervangt (?:dit )?die persoon niet/i, 'the Dutch "it does not replace anyone" section is gone'],
  ];
  for (const [re, label] of NL_MUST) {
    if (!re.test(body)) fail.push(`[es] ${label}`);
  }

  // Art. 50 + art. 13 in Dutch. Three languages now reach the same button and
  // the press is the consent in all three.
  for (const phrase of ['Dit is een AI, geen mens', 'Het gesprek wordt opgenomen', 'Praat met de AI (wordt opgenomen)']) {
    if (!body.includes(phrase)) {
      fail.push(`[es] the Dutch disclosure no longer carries "${phrase}" — pressing the button is the consent in all three languages`);
    }
  }

  // ---- Dutch page, non-Dutch line -------------------------------------
  // THE ONE THAT MATTERS ON THIS PAGE. There are two published agents,
  // Spanish and English, and neither speaks Dutch — Retell will not swap a
  // voice or a language per call, so a third language is a third agent and
  // nobody has built it. A Dutch page in front of an English line is honest
  // only while it SAYS so, before the button, and while the button actually
  // asks for English.
  //
  // Both halves are asserted because either one alone rots quietly. Drop the
  // sentence and a Dutch reader presses expecting Dutch. Drop the mapping
  // and... the call still lands on the English agent, via demo.ts's default
  // branch — which is exactly why it is asserted: the fallback makes the
  // deliberate choice invisible, so the only thing keeping it deliberate is
  // this check failing when someone deletes it as redundant. When the Dutch
  // agent exists, both of these come out in the same commit as NL_AGENT_ID.
  {
    // From `es`, not `body` — `body` strips <script> entirely. Whole-line //
    // comments come out first: this file has been green twice on a string
    // that only existed in a comment explaining the string.
    const script = (es.match(/<script>[\s\S]*<\/script>/) || [''])[0]
      .replace(/^\s*\/\/.*$/gm, '');
    if (!/lang:\s*idioma === 'nl' \? 'en' : idioma/.test(script)) {
      fail.push("[es] the call no longer asks for English when the page is Dutch — demo.ts maps anything that is not 'es' onto the English agent, so this does not throw, it just stops being on purpose");
    }
    // The panel notice is the last thing read before the press.
    const aviso = body.match(/class="aviso"[^>]*data-nl="([^"]*)"/);
    if (!aviso) {
      fail.push('[es] the call panel notice has no data-nl — the Dutch visitor gets the Spanish disclosure');
    } else if (!/in het Engels/i.test(aviso[1])) {
      fail.push('[es] the Dutch call-panel notice no longer says the demo answers in English — the page is Dutch, the line is not, and this sentence is the whole of that admission');
    }
  }
}

// ---- deliverable email addresses -------------------------------------
// Every address on these pages is a contact route someone is invited to use to
// exercise a right: art. 13 identifies the controller by it, and both call
// panels offer email as the way to opt out of being recorded. An address that
// does not receive is therefore worse than an ugly one that does — the request
// is not refused, it is silently lost, and the sender believes it arrived.
//
// This is not hypothetical. dan@primeai.agency sat in the /en/ footer, in both
// the href and the label, until 2026-08-07. primeai.agency returns NXDOMAIN —
// the domain is not registered — so every one of those mails bounced for as
// long as the page has been up, and nothing here noticed.
//
// So: an allowlist, deliberately awkward to extend. Do NOT add an address here
// because it looks right or because the domain is yours. Add it only after a
// real message has been delivered to it and read. Checked 2026-08-07:
//   oscarinfo@proton.me   delivers (Proton).
//   dan@prime-ai.es       does NOT. The domain resolves and serves this site,
//                         but it publishes no MX record, and the VPS Postfix
//                         (srv1233720.hstgr.cloud) answers "454 Relay access
//                         denied" for it. It is the address Dan wants; it goes
//                         in this list the day Proton custom-domain is live and
//                         a test mail has actually arrived, and not before.
// john@example.com is exempt: it is the placeholder attribute on a form input,
// never presented as a way to reach anyone.
//
// MAIL_OK itself is declared at the top of this file, because the /es/ footer
// check needs it too and that one runs earlier.
for (const [page, html] of Object.entries(PAGES)) {
  const body = html.replace(/<!--[\s\S]*?-->/g, '');
  const found = new Set();
  // Both the mailto: target and any address printed as visible text — the dead
  // one was in both places, and fixing only the href would leave the page
  // telling people to write to an address that does not exist.
  // The & is in the exclusion class because es.html stores an escaped copy of
  // this markup in a data-en attribute, where the closing quote is &quot; — so
  // a class that allows & swallows the entity and reports a nonsense address.
  for (const m of body.matchAll(/mailto:([^"'?>\s&]+)/g)) found.add(m[1]);
  for (const m of body.matchAll(/[\w.%+-]+@[\w.-]+\.[a-z]{2,}/gi)) {
    if (!/placeholder="[^"]*$/.test(body.slice(Math.max(0, m.index - 200), m.index))) found.add(m[0]);
  }
  for (const addr of found) {
    if (addr === 'john@example.com') continue;
    if (!MAIL_OK.includes(addr)) {
      fail.push(`[${page}] ${addr} is not on the delivering-address allowlist. Either it does not receive mail, or it was never verified. Send a real message to it and read it before adding it to MAIL_OK — this page offers it as the route to opt out of a recording and to reach the data controller.`);
    }
  }
}

// ---- report ----------------------------------------------------------
if (fail.length) { console.error('FAIL\n' + fail.map(f => '  - ' + f).join('\n')); process.exit(1); }
const summary = Object.entries(seen)
  .map(([p, c]) => `${p}: ${c.pairs} contrast pairs, ${c.bans} ban rules, ${c.tokens} tokens`)
  .join('  |  ');
console.log(`OK  ${summary}`);
