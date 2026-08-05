# Receptionist Warm Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat two-tone light palette in `receptionist.html` with a six-step warm scale, three inverted anchor sections, and zero banned patterns.

**Architecture:** Single-file change. All colour flows from `:root` custom properties; no rule outside `:root` may contain a colour literal except the logo SVG. Section rhythm is applied by assigning one background token per section. Children of inverted sections get scoped overrides under the section class.

**Tech Stack:** Plain HTML/CSS in one file. Node (no framework, no dependencies) for the two test scripts, matching the existing `test-roi.js` convention.

## Global Constraints

- Target file is `receptionist.html` only. Do not modify `variant-a-dark-closer.html`, `variant-b-proof-machine.html`, `variant-c-speed-killer.html`, or `index.html`.
- Never write `#000`, `#fff`, `rgba(0,0,0,x)`, or `rgba(255,255,255,x)`. Every neutral is tinted toward hue ~50.
- Amber (`--amber`) as a text colour: permitted on `--ink` / `--ink-deep` at any size; permitted on `--paper` / `--shell` only at ≥24px or ≥18.66px bold; **never** as text on `--sand` (2.95:1, fails AA-large).
- Blue (`--accent`) is for buttons, links, and form affordances only. It is not a decorative colour.
- The logo SVG at lines 1471-1480 keeps `#0891B2`. It is an exempt brand mark. Do not tokenise or recolour it.
- The 5 `DEMO-NUMBER` markers must remain exactly 5. This change must not touch them.
- No em dashes in any copy added or edited.
- `node test-roi.js` must return `OK — 64 combinations checked` after every task.

---

### Task 1: Palette contrast test harness

Builds the check that every later task is graded against. Written first so it fails against the current file and passes only once the palette lands.

**Files:**
- Create: `test-palette.js`
- Test: itself (self-checking script, run directly)

**Interfaces:**
- Consumes: nothing.
- Produces: `node test-palette.js` exits 0 on pass, 1 with a printed failure list on fail. Later tasks run this as their gate.

- [ ] **Step 1: Write the failing test**

Create `test-palette.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-palette.js`

Expected: FAIL. The current file has no `--paper` token, 8 `backdrop-filter` declarations, 4 side-stripes, 6 `rgba(0,0,0,x)`, 14 accent rgba, and 2 dead tokens. Confirm the output names these. If it passes, the script is broken.

- [ ] **Step 3: Commit the failing test**

```bash
git add test-palette.js
git commit -m "test: add palette contrast and banned-pattern guard

Fails against the current file by design: documents the 2-tone palette,
dead tokens, and dark-theme residue the warm-palette pass removes."
```

---

### Task 2: Token layer

**Files:**
- Modify: `receptionist.html:19-64` (the `:root` block, colour tokens only — leave `--font-*`, `--space-*`, `--max-width`, `--radius` untouched)

**Interfaces:**
- Consumes: nothing.
- Produces: tokens `--paper`, `--shell`, `--sand`, `--clay`, `--ink`, `--ink-deep`, `--amber`, `--text-primary`, `--text-secondary`, `--text-on-ink`, `--text-on-accent`, `--accent`, `--accent-hover`, `--surface-hover`, `--shadow-sm`, `--shadow-md`, `--shadow-lift`, `--tint-amber`, `--tint-accent`, `--tint-on-ink`. Every later task uses these names.

- [ ] **Step 1: Replace the colour half of `:root`**

Replace lines 20-35 (from `--bg-primary:` through `--shadow-md:`) with:

```css
      /* Warm neutral scale. Every value carries its hex in a comment because
         test-palette.js checks contrast without an oklch conversion library. */
      --paper:     oklch(0.98 0.006 70);  /* #FAF8F5 */
      --shell:     oklch(0.96 0.008 70);  /* #F5F1EA */
      --sand:      oklch(0.93 0.012 68);  /* #EBE5DC */
      --clay:      oklch(0.87 0.016 65);  /* #DED6CA */
      --ink:       oklch(0.19 0.014 48);  /* #221D19 */
      --ink-deep:  oklch(0.14 0.012 45);  /* #171310 */

      /* Amber carries money. Text-safe on ink at any size; on paper/shell only
         at >=24px or >=18.66px bold; never as type on sand (2.95:1). */
      --amber:     oklch(0.62 0.12 50);   /* #C2703D */

      /* Blue is buttons, links, and form affordances. Not decoration. */
      --accent:       #2563EB;
      --accent-hover: #1D4ED8;
      /* Text sitting ON the accent colour. Must not follow --text-primary,
         or blue buttons end up with dark text when the theme is light. */
      --text-on-accent: var(--paper);

      --text-primary:   oklch(0.19 0.014 48);  /* #221D19 */
      --text-secondary: oklch(0.48 0.02 55);   /* #6B5F54 */
      --text-on-ink:    oklch(0.75 0.015 60);  /* #B8ABA0 */

      --border-subtle: var(--clay);
      --border-strong: oklch(0.80 0.02 62);    /* #C9BCAC */
      --surface-hover: oklch(0.19 0.014 48 / 0.04);

      /* Tints, replacing 14 hardcoded rgba(37,99,235,x) sites. */
      --tint-amber:   oklch(0.62 0.12 50 / 0.10);
      --tint-accent:  oklch(0.55 0.22 264 / 0.08);
      --tint-on-ink:  oklch(0.98 0.006 70 / 0.07);

      /* Warm shadows. The old values were rgba(15,23,42,x) cool slate. */
      --shadow-sm:   0 1px 2px oklch(0.19 0.014 48 / 0.05), 0 1px 3px oklch(0.19 0.014 48 / 0.07);
      --shadow-md:   0 4px 12px oklch(0.19 0.014 48 / 0.07), 0 2px 4px oklch(0.19 0.014 48 / 0.05);
      --shadow-lift: 0 12px 32px oklch(0.19 0.014 48 / 0.12);
```

Delete `--bg-primary`, `--bg-card`, `--bg-subtle`, and `--brand-cyan`. They are replaced by the scale above; `--brand-cyan` had zero `var()` references.

- [ ] **Step 2: Repoint every reference to the deleted tokens**

The tokens deleted in Step 1 must not leave dangling `var()` references, or this
task's commit ships a visibly broken page. Repoint all of them here, in the same
commit:

- `body` (~79) and `.nav` (~106): `var(--bg-primary)` → `var(--paper)`
- `.stats` (~313): `var(--bg-primary)` → leave for Task 3, which assigns `--ink`
- All 9 `var(--bg-card)` references → `var(--paper)`. Task 3 then overrides the
  two that sit inside ink bands.

Run `grep -c 'var(--bg-primary)\|var(--bg-card)\|var(--bg-subtle)\|var(--brand-cyan)' receptionist.html`
and confirm it returns `0` before committing.

- [ ] **Step 2b: Delete the dead `.glass-card` rule**

`.glass-card` is declared at ~300 and applied to zero elements — confirmed with
`grep -n 'glass-card' receptionist.html`, which returns only the CSS rule itself.
Delete the entire rule and its `GLASSMORPHISM` comment banner (~297-306).

This removes two of the eight `backdrop-filter` declarations that Task 4 would
otherwise have to strip.

- [ ] **Step 3: Run the ROI regression guard**

Run: `node test-roi.js`
Expected: `OK — 64 combinations checked`

- [ ] **Step 4: Run the palette test**

Run: `node test-palette.js`
Expected: still FAIL, but the contrast and dead-token lines are now gone. Remaining failures should be only the ban patterns and the `var(--bg-card)` references that Task 3 fixes. Confirm no contrast failure appears — if one does, the hex comments do not match the oklch values.

- [ ] **Step 5: Commit**

```bash
git add receptionist.html
git commit -m "Replace flat 2-tone palette with warm 6-step scale

Adds paper/shell/sand/clay/ink/ink-deep tinted toward hue 50, plus amber
as the money colour. Deletes --bg-subtle and --brand-cyan, both declared
with zero var() references. Retints shadows from cool slate to warm."
```

---

### Task 3: Section rhythm and dark-band inversion

**Files:**
- Modify: `receptionist.html` — section rules for `.stats` (~311), `.problem` (~369), `.solution` (~416), `.bonus` (~485), `.roi` (~541), `.video` (~730), `.faq` (~822), `.final-cta` (~910), `.footer` (~966), and every `var(--bg-card)` reference

**Interfaces:**
- Consumes: all tokens from Task 2.
- Produces: `.stats`, `.roi`, `.final-cta` carry `background: var(--ink)`; `.footer` carries `var(--ink-deep)`. Task 5 relies on these three class names when scoping icon colours.

- [ ] **Step 1: Assign one background per section**

Apply exactly this map. Sections not listed inherit `--paper` from `body` and need no rule.

```css
    .stats     { background: var(--ink); }
    .problem   { background: var(--shell); }
    .bonus     { background: var(--sand); }
    .roi       { background: var(--ink); }
    .video     { background: var(--shell); }
    .faq       { background: var(--shell); }
    .final-cta { background: var(--ink); }
    .footer    { background: var(--ink-deep); border-top: none; }
```

`.hero`, `.solution`, `.proof`, `.qualify` stay on `--paper` — do not add rules for them.

- [ ] **Step 2: Lift the cards that sit inside ink bands**

Task 2 already repointed all `var(--bg-card)` references to `var(--paper)`. Only
the two card types inside inverted bands need overriding — a paper card on an ink
band would read as a hole punched in the section:

```css
    .stats .stat-card,
    .roi .roi-card     { background: oklch(0.98 0.006 70 / 0.05);
                         border-color: oklch(0.98 0.006 70 / 0.14); }
```

Do not add a `.glass-card` rule. Task 2 Step 2b deleted it as dead code.

- [ ] **Step 3: Invert type inside the ink bands**

```css
    .stats, .roi, .final-cta { color: var(--paper); }

    .stats .stat-label,
    .roi .roi-card h2,
    .final-cta h2            { color: var(--paper); }

    .stats .stat-source,
    .roi .roi-step-label,
    .final-cta .scarcity-line,
    .final-cta .unity-line   { color: var(--text-on-ink); }

    /* Amber is AA-normal on ink (4.51:1), so the money figures move to it. */
    .stats .stat-number,
    .roi .roi-step-value,
    .roi .roi-result-number  { color: var(--amber); }

    .roi .roi-result         { border-top-color: oklch(0.98 0.006 70 / 0.14);
                               border-bottom-color: oklch(0.98 0.006 70 / 0.14); }

    .footer, .footer a, .footer-contact a, .footer-response {
                               color: var(--text-on-ink); }
    .footer a:hover, .footer-contact a:hover { color: var(--paper); }
```

- [ ] **Step 4: Verify no unreadable pair remains**

Run: `node test-palette.js`
Expected: contrast pairs pass. Ban failures remain (Task 4 clears them).

Then open `http://127.0.0.1:9876/receptionist.html` and confirm by eye that text in the stats, ROI, final-CTA, and footer bands is light on dark with nothing invisible.

- [ ] **Step 5: Run the ROI regression guard**

Run: `node test-roi.js`
Expected: `OK — 64 combinations checked`

- [ ] **Step 6: Commit**

```bash
git add receptionist.html
git commit -m "Add section rhythm: three inverted anchor bands

stats, roi, and final-cta invert to ink; problem/video/faq step down to
shell; bonus to sand. 27% of the page body is dark, landing on the three
sections that carry the argument. Money figures move to amber, which is
AA-normal on ink at 4.51:1."
```

---

### Task 4: Remove banned patterns

**Files:**
- Modify: `receptionist.html` lines ~113, ~300-306, ~322-327, ~337, ~490-496, ~505, ~548-549, ~672-674, ~682, ~842, ~849, ~852-854, ~1017, ~1403

**Interfaces:**
- Consumes: `--clay`, `--sand`, `--ink-deep`, `--shadow-lift`, `--accent` from Task 2.
- Produces: nothing new. Purely subtractive.

- [ ] **Step 1: Fix the nav double shadow**

At line ~112, `.nav.scrolled` sets `box-shadow` twice — the light value is overridden by a dark-theme leftover. Replace the whole rule:

```css
    .nav.scrolled {
      box-shadow: var(--shadow-md);
    }
```

- [ ] **Step 2: Strip the remaining dead `backdrop-filter` rules**

Task 2 Step 2b already removed `.glass-card` and its two declarations. Delete both
the `backdrop-filter: blur(12px);` and `-webkit-backdrop-filter: blur(12px);`
lines from the three rules that remain: `.stat-card`, the rule at ~492, and
`.roi-card`.

All sit on opaque backgrounds where blur renders nothing while still forcing a GPU
compositing layer.

Confirm with `grep -c backdrop-filter receptionist.html`, which must return `0`.

- [ ] **Step 3: Replace the four black hover shadows**

Lines ~337, ~505, ~682, ~849 each carry `box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);`. A 30%-black 40px blur is a grey smudge on a light page. Replace each with:

```css
      box-shadow: var(--shadow-lift);
```

- [ ] **Step 4: Replace the four side-stripes**

At ~495 and ~674, replace `border-left: 4px solid var(--accent);` with a full border and a fill:

```css
      border: 1px solid var(--clay);
      background: var(--sand);
```

At ~842 replace `border-left: 3px solid transparent;` with `border: 1px solid var(--clay);` and at ~854 replace `border-left: 3px solid #2563EB;` with `border-color: var(--accent);`.

- [ ] **Step 5: Replace the black overlay**

At ~1017, `.form-overlay` uses `background: rgba(0, 0, 0, 0.7);`. Replace:

```css
      background: oklch(0.14 0.012 45 / 0.72);
```

- [ ] **Step 6: Tokenise the scroll-progress gradient**

At ~1403 replace the hardcoded hex:

```css
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
```

- [ ] **Step 7: Verify the bans are gone**

Run: `node test-palette.js`

Expected: the `backdrop-filter`, `side-stripe`, `rgba(0,0,0,x)`, and hex-literal lines are all absent. The `rgba(37,99,235,x)` line remains — Task 5 clears it.

- [ ] **Step 8: Commit**

```bash
git add receptionist.html
git commit -m "Remove dark-theme residue and banned patterns

Strips 8 backdrop-filter declarations rendering nothing over opaque
backgrounds, 4 side-stripe borders, 6 rgba(0,0,0,x) shadows and overlays
including the .nav.scrolled double-declaration, and 2 hardcoded hexes."
```

---

### Task 5: Retire the fourteen blue tints and the inline SVG blues

**Files:**
- Modify: `receptionist.html` lines ~178, ~253, ~338, ~477, ~506, ~575, ~644, ~683, ~708, ~850, ~930, ~931, ~1133, ~1254, and SVG attributes at 1548-1570, 1617-1629, 1734-1742, 1886-1888

**Interfaces:**
- Consumes: `--tint-amber`, `--tint-accent`, `--tint-on-ink`, `--clay`, `--amber`, `--accent`.
- Produces: nothing new.

- [ ] **Step 1: Map each tint site**

Apply exactly this table. The rule is: keep blue where the element is interactive, use amber or clay where it is decorative, use the on-ink tint where the element sits inside an inverted band.

| Line | Selector | Current | Replace with |
|---|---|---|---|
| 178 | `.btn-primary:hover` | `0 8px 32px rgba(37,99,235,.4)` | `0 8px 24px oklch(0.55 0.22 264 / 0.32)` |
| 253 | `.hero::before` | `rgba(37,99,235,.15)` radial | `oklch(0.62 0.12 50 / 0.13)` |
| 338 | `.stat-card:hover` | `border-color: rgba(37,99,235,.3)` | `border-color: oklch(0.98 0.006 70 / 0.28)` |
| 477 | `.steps-connector` | `rgba(37,99,235,.3)` | `var(--clay)` |
| 506 | `.bonus-card:hover` | `border-color: rgba(37,99,235,.3)` | `border-color: var(--amber)` |
| 575 | `.roi-step` | `rgba(37,99,235,.08)` | `var(--tint-on-ink)` |
| 644 | `.founder-photo` | `rgba(37,99,235,.12)` | `var(--tint-amber)` |
| 683 | `.case-study-card:hover` | `border-color: rgba(37,99,235,.3)` | `border-color: var(--amber)` |
| 708 | `.country-tag` | `rgba(37,99,235,.12)` | `var(--tint-amber)` |
| 850 | `.faq-item:hover` | `border-color: rgba(37,99,235,.3)` | `border-color: var(--border-strong)` |
| 930 | `.guarantee-badge` | `rgba(37,99,235,.1)` | `var(--tint-on-ink)` |
| 931 | `.guarantee-badge` | `border 1px rgba(37,99,235,.25)` | `1px solid oklch(0.98 0.006 70 / 0.18)` |
| 1133 | `.radio-card:hover` | `rgba(37,99,235,.06)` | `var(--tint-accent)` |
| 1254 | `.results-followup` | `rgba(37,99,235,.08)` | `var(--tint-amber)` |

Lines 338, 575, 930, and 931 use on-ink values because `.stat-card`, `.roi-step`, and `.guarantee-badge` all live inside sections that Task 3 inverted.

- [ ] **Step 2: Make the inline SVG icons inherit their surface**

Eighteen SVG attributes hardcode `#2563EB`. Three of them (1886-1888) sit in `final-cta`, now an ink band, where blue measures 3.24:1 and goes murky.

Replace every `stroke="#2563EB"` with `stroke="currentColor"` and every `fill="#2563EB"` with `fill="currentColor"` at lines 1548, 1549, 1555, 1556, 1562, 1563, 1569, 1570, 1617, 1621, 1625, 1629, 1734, 1738, 1742, 1886, 1887, 1888.

Then set the colour on the parent classes so each icon picks up its own section:

```css
    .check-icon, .qualify-icon { color: var(--accent); }
    .final-cta svg             { color: var(--amber); }
```

**Do not touch lines 1471-1480.** That is the logo SVG and `#0891B2` is an exempt brand mark.

- [ ] **Step 3: Verify**

Run: `node test-palette.js`
Expected: `OK — 12 contrast pairs, 8 ban rules, N tokens checked`

Run: `node test-roi.js`
Expected: `OK — 64 combinations checked`

Run: `grep -c '#0891B2' receptionist.html`
Expected: `11` — one `:root` deletion from the original 12, leaving 10 logo lines plus the footer hover which Task 3 already repointed. If this returns anything else, the logo was modified.

- [ ] **Step 4: Commit**

```bash
git add receptionist.html
git commit -m "Retire 14 hardcoded blue tints and 18 inline SVG blues

Decorative blue becomes amber or clay; tints inside the three inverted
bands become on-ink washes. SVG icons switch to currentColor so they
inherit their section instead of going murky on dark. Logo SVG exempt."
```

---

### Task 6: Visual verification

**Files:**
- Create: none. Verification only.

**Interfaces:**
- Consumes: the finished page.
- Produces: a pass/fail judgement and screenshots for review.

- [ ] **Step 1: Confirm the preview server is up**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:9876/receptionist.html`
Expected: `200`. If not, restart with:
`setsid python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage &`

- [ ] **Step 2: Screenshot desktop and mobile**

Use the Playwright MCP browser tools. Navigate to `http://127.0.0.1:9876/receptionist.html`, screenshot full-page at 1440px wide, then resize to 390px and screenshot again.

- [ ] **Step 3: Check the rhythm reads correctly**

Against the desktop screenshot confirm:
- Three dark bands appear, at stats, ROI, and final-CTA, with the footer darker still.
- No two adjacent sections share a background tone.
- No text sits invisibly on its background in any band.
- No grey smudge under the nav when scrolled.

- [ ] **Step 4: Run the full verification set**

```bash
node test-roi.js
node test-palette.js
grep -c DEMO-NUMBER receptionist.html   # expect 5
git status -sb
```

- [ ] **Step 5: Commit any fixes, then report**

Report to the user: before/after screenshots, the passing test output, and confirmation that the demo-number launch blocker is still open and unaddressed by this work.

---

## Self-Review

**Spec coverage.** Token layer → Task 2. Section rhythm → Task 3. Amber contrast constraint → encoded in Task 1's `PAIRS` table and the `--amber` on `--sand` assertion. Ban removals table → Task 4, all five rows. The 14 blue tints, which the spec implied but did not enumerate → Task 5. Verification steps 1-5 → Tasks 1 and 6. The logo-cyan exemption, decided after the spec was written → Global Constraints and Task 5 Step 2.

**Gap found and closed:** the spec's ban table listed 5 patterns but did not mention the four `rgba(0,0,0,0.3)` hover shadows or the 18 inline SVG blues. Both are now covered by Tasks 4 and 5. The spec's ban table should be treated as superseded by this plan's Task 4 and Task 5 tables.

**Type consistency.** Token names used in Tasks 3, 4, and 5 all appear in Task 2's Produces block. `--shadow-lift` is introduced in Task 2 and consumed only in Task 4. `--tint-on-ink` is introduced in Task 2 and consumed in Tasks 3 and 5. No name appears in a later task that an earlier task did not define.

**Known ordering hazard.** `node test-palette.js` fails at the end of Tasks 2 and 3 by design — it only passes after Task 5. Each task states the expected partial failure so an implementer does not mistake it for a regression.
