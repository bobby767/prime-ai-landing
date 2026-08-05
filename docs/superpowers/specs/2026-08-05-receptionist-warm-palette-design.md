# Receptionist Page — Warm Palette and Depth Pass

**Date:** 2026-08-05
**Status:** Approved, awaiting implementation plan
**Deliverable:** `receptionist.html` (CSS only), `PRODUCT.md`
**Supersedes:** the colour section of `2026-08-04-ai-receptionist-landing-design.md`

## Problem

The page reads as flat and glaring. The cause is measurable, not a matter of
taste.

Eleven `<section>` elements share two background tones: `--bg-primary: #FAFAFA` and
`--bg-card: #FFFFFF`. The step between them is 2% lightness, which is below the
threshold at which a reader perceives a section boundary. The page therefore
presents as one continuous white field.

Two declared variables are never referenced:

| Variable | Value | Usages |
|---|---|---|
| `--bg-subtle` | `#F1F5F9` | 0 |
| `--brand-cyan` | `#0891B2` | 0 |

Because cyan is dead, every coloured element on the page is the same hue —
`rgba(37, 99, 235, x)` at eight different opacities. The page is monochrome by
construction, which is why adding "more colour" was the user's instinct.

Both neutrals are untinted grey. Pure grey beside a saturated blue reads as
cheap; tinting neutrals toward a brand hue is what makes a palette feel
deliberate.

### Dark-theme residue

The 2026-08-04 light conversion left artefacts that independently contribute to
the unpolished impression:

| Artefact | Count | Why it is wrong |
|---|---|---|
| `.nav.scrolled` sets `box-shadow` twice | 1 | The light value `var(--shadow-sm)` is immediately overridden by `0 2px 16px rgba(0,0,0,0.5)`, a 50%-black shadow authored for the dark page. Renders a hard grey bar under the nav. |
| `backdrop-filter: blur(12px)` | 8 | Applied to `.glass-card`, whose background is opaque `var(--bg-card)`. Blur behind an opaque surface renders nothing while still forcing each element onto its own GPU compositing layer. |
| `border-left: 4px solid var(--accent)` | 4 | Side-stripe accent. |
| `background: rgba(0, 0, 0, 0.7)` | 1 | Form-panel overlay in pure black. |
| Hardcoded `#2563EB` | 2 | Bypasses the token layer. |
| `rgba(15, 23, 42, x)` shadows | ~6 | Cool slate shadows under a warm palette. |

## Decisions

Three forks were resolved with the user before design.

**Direction: light with dark anchors.** Not a reversion to dark. High-ticket
medical and legal buyers read dark marketing pages as agency or crypto work;
that was the original rationale for the light conversion and it still holds.
What was missing was depth, not darkness.

**Palette: warm ink and amber, blue demoted.** Blue-and-cyan-on-white is the
first-order category reflex for clinics and law firms. A palette guessable from
the industry alone is the training-data default, and competitors all land on it.
Blue is retained where it does real work — buttons and links, where it is the
learned affordance for "clickable" — and removed everywhere else.

**Scope: colour plus the banned patterns, `receptionist.html` only.** The
residue above is not a colour problem and would survive a colour-only pass.
Variants A/B/C are excluded: different offer, currently live, deferred pending
conversion data.

## Token layer

All neutrals tinted toward hue ~50 (warm). No pure white, no pure black.

| Token | OKLCH | ≈ Hex | Role |
|---|---|---|---|
| `--paper` | `oklch(0.98 0.006 70)` | `#FAF8F5` | lightest — hero, solution, proof, qualify |
| `--shell` | `oklch(0.96 0.008 70)` | `#F5F1EA` | second step — problem, video, faq |
| `--sand` | `oklch(0.93 0.012 68)` | `#EBE5DC` | third step — bonus, card wells |
| `--clay` | `oklch(0.87 0.016 65)` | `#DED6CA` | borders |
| `--ink` | `oklch(0.19 0.014 48)` | `#221D19` | dark anchor bands |
| `--ink-deep` | `oklch(0.14 0.012 45)` | `#171310` | footer |
| `--amber` | `oklch(0.62 0.12 50)` | `#C2703D` | money figures, stat numbers, eyebrows |
| `--accent` | unchanged | `#2563EB` | buttons and links only |

`--brand-cyan` is deleted. Amber assumes the second-colour role and cyan had
zero usages, so retaining it would preserve a variable no rule references.

`--bg-subtle` is deleted; `--shell` and `--sand` replace it with actual usage.

### Amber contrast constraint

Amber on paper measures approximately 4.4:1. That satisfies WCAG AA for large
text (≥24px, or ≥18.66px bold) and fails it for body copy.

**Rule: amber is permitted on stat numbers, ROI figures, and section eyebrows
only. Never on a paragraph, never on small labels, never on form help text.**

If amber is later wanted in body copy it must first be darkened to roughly
`oklch(0.52 0.13 50)`, which reaches ~7:1 at the cost of some warmth. This is a
deliberate deferral, not an oversight.

Shadows are retinted from `rgba(15, 23, 42, x)` to a warm equivalent derived
from `--ink`.

## Section rhythm

```
nav        paper       sticky, warm shadow
hero       paper       ░
stats      INK    ███  anchor 1 — amber figures
problem    shell  ▒
solution   paper  ░
bonus      sand   ▓
roi        INK    ███  anchor 2 — amber money
proof      paper  ░
video      shell  ▒
qualify    paper  ░
faq        shell  ▒
final-cta  INK    ███  anchor 3
footer     ink-deep ████
```

Three inverted bands across eleven sections, 27% of the page body. Below roughly
20% the anchors read as accidents; above roughly 35% the page reads as striped.
The footer is dark as well, but as page chrome rather than as a fourth anchor.

The three anchors land on the sections carrying the argument: the statistic that
opens it, the money in the middle, the ask at the end. Rhythm follows the
argument rather than alternating mechanically.

## Ban removals

| Pattern | Replacement |
|---|---|
| 4 × side-stripe `border-left` | full `1px solid var(--clay)` border with `var(--sand)` fill |
| 8 × `backdrop-filter` | deleted, along with the now-empty glassmorphism rule block |
| `rgba(0, 0, 0, 0.7)` overlay | `oklch(0.14 0.012 45 / 0.72)` |
| `.nav.scrolled` double shadow | single warm-tinted shadow; the dark-theme line is removed |
| 2 × hardcoded `#2563EB` | `var(--accent)` |

## Verification

1. `node test-roi.js` returns `OK — 64 combinations checked`. This is a
   regression guard: the change is CSS-only and must not affect the calculator.
2. `grep -c DEMO-NUMBER receptionist.html` still returns `5`. The demo number
   remains a separate, open launch blocker.
3. Contrast-check every text-on-background pair that changed. Body text ≥4.5:1,
   large text ≥3:1. Amber pairs audited against the constraint above.
4. Screenshot all eleven sections plus nav and footer at desktop and mobile
   widths, compared against the current build.
5. `grep -c 'backdrop-filter\|border-left: 4px' receptionist.html` returns `0`.

## Out of scope

- Variants A/B/C — different offer, live, deferred pending conversion data.
- Spacing rhythm and card-grid rework — considered and declined for this pass to
  keep the diff reviewable. Section padding remains near-uniform.
- The demo phone number — still an open launch blocker, unrelated to this work.
- Form backend — still client-side only.
