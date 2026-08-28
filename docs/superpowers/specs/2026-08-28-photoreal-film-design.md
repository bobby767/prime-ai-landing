# Scroll Film — Photoreal Redirection

**Date:** 2026-08-28
**Status:** Approved in brainstorming, **not scheduled**. No render budget committed.
**Deliverable:** `scroll-world/prompts/*_real.txt`, `scroll-world/world.config.js`
(`accent`, copy), regenerated `assets/scroll/{still,vid}/`. No change to `es.html`.
**Supersedes:** nothing. The clay diorama film stays live until this is rendered.

## Why this file exists

The design below was approved by the user in a brainstorming session, then the
session pivoted before it was written down. It survived only inside
`SESSION-HANDOFF.md`, which is rewritten every session. Three findings in it were
paid for with real render spend and are not reproducible for free.

**This is a record, not a work order.** The user's decision on 2026-08-28 was
*write the spec, do not spend*. See "Should this be built at all".

## Problem

The current film is a clay diorama. The user asked for photoreal humans in a busy
city instead. Photoreal is achievable, but a hard model constraint discovered
mid-session changes how every scene with a person must be framed.

## The content-policy constraint

Measured, three inputs, same pipeline, on `2026-08-28`:

| input still | still renders? | dive renders? |
|---|---|---|
| `cocina` — woman on the phone, face visible in profile | **yes** (`cocina_real.png`, 2.0 MB) | **no** |
| `obra` — plumber, head inside the sink cabinet, no face | yes | yes (`dive_obra_real.mp4`) |
| `rooftop` — rooftops at blue hour, no people | yes | yes (`dive_rooftop_real.mp4`) |

The image model generates faces without complaint. The **video** step refuses to
accept a face as input. The exact refusal, from `vid/dive_cocina_real.json`:

```json
{"detail":[{"loc":["body","image_url"],
  "type":"content_policy_violation",
  "msg":"The images or videos provided may contain likenesses of real people or
         other private information that cannot be processed.",
  "ctx":{"extra_info":{"reason":"partner_validation_failed"}}}]}
```

Three things follow, and each one is load-bearing:

1. **`loc` is `["body","image_url"]`** — the filter fires on the *input still*, not
   on the prompt. Rewriting prompt wording cannot get a face past it. The still
   itself must not contain one.
2. **`reason: partner_validation_failed`** — this is the upstream partner rejecting
   it, not Fal. It is not a setting, a tier, or an account flag.
3. **A refusal costs $0** because it is rejected at validation, before any GPU
   work — and it arrives as a **COMPLETED** job whose body carries `detail[]`,
   **not** as a FAILED status. Any success check keyed on HTTP status or a
   `FAILED` string will read a refusal as a success. Check for the **output file**.
   (A log-grep success check burned $2.26 on 2026-08-28 re-rendering a clip that
   had already finished.)

A successful dive body is 179 bytes and has `video.url`. A refused one is 329 KB —
it echoes the base64 input image back inside `detail[].input.image_url`. **Size
alone distinguishes them** without parsing.

### Shooting rule

Every scene with a person is shot **face-occluded**: over the shoulder, from
behind, from above, hands only, or head inside the work. The occlusion is written
into the still prompt explicitly and positively — the accepted `obra` prompt does
it three times over:

> "his face is completely hidden behind the cabinet door and not visible at all …
> Only his back, his dusty knees and one outstretched hand are in frame … Candid,
> unposed, **no face visible anywhere in the frame**."

Negative phrasing alone ("no face") is not what passed; the accepted prompt also
states positively what *is* in frame. Keep both halves.

## Look

- Photoreal Andalusian city at **blue hour**. The cool comes from the sky and the
  shadows; the only warm source is lit windows and lamps. This is forced, not
  stylistic: the architecture is warm ochre and terracotta, so cool and contrast
  cannot come from the buildings.
- The shared style block is already fixed and identical across all `*_real.txt`
  prompts. It is the second paragraph of every file. Do not drift it per scene —
  the film's coherence depends on it being byte-identical.
- **Clock advances** dusk -> night -> dawn, resolving to bright paper at the exit.
  The `#FAF8F5` handoff into `es.html` stops being a constraint to work around and
  becomes the ending.

## Structure

**Scenes stay interiors; the void between them becomes the city.** Connectors rise
out through a window, cross the rooftops — terraces, aircon units, laundry,
satellite dishes, palms, every window lit warm amber — then descend into the next
interior. `conn_real_0.txt` is written to this shape and has never been rendered.

Six scenes, five connectors. `connectors[i]` sits between `sections[i]` and
`sections[i+1]`:

| # | between | note |
|---|---|---|
| `conn_0` | obra -> cocina | |
| `conn_1` | cocina -> centralita | |
| `conn_2` | centralita -> agenda | |
| `conn_3` | agenda -> furgoneta | |
| `conn_4` | furgoneta -> demo-film | resolves to dawn / bright paper |

**Scenes 3/4/6 collapse onto a real phone.** `centralita`, `agenda` and `demo-film`
have no photoreal form — `demo-film` was explicitly authored as "floating in soft
plain `#FAF8F5` space", i.e. defined by the absence of a world. Photoreal removes
the void that defined them. They become, respectively: a phone ringing and
answered (copy untouched), the booking arriving as a message, and a hand holding
the live call.

`obra` and `cocina` keep their existing framing and copy. `furgoneta` is a van at a
door at nine in the morning — the only daylight scene, and the one the dawn clock
is built to arrive at.

## Accent — corrects a warning in the handoff

`SESSION-HANDOFF.md` warns that `--sw-accent` "has 26 usages in the engine and
drives the scrollbar, route markers and hint, not just imagery — turning it blue
changes the chrome too". The count is right (26 in `assets/scroll/scrub-engine.js`,
1 in `compose.js`) but the risk is overstated, because the accent is **already
per-scene**:

- `world.config.js` gives each section its own `accent`.
- `scrub-engine.js:353` writes the nearest section's accent onto the container as
  you scroll; `:227`, `:239`, `:249` write it onto the scene, copy and route dot.
- Five scenes are `#C2703D` (terracotta). `demo-film` is **already `#2563EB`** — the
  page's blue. The chrome already turns blue at the end of the film today.

So a blue-hour palette does not need a global edit and introduces no new
mechanism. It is a per-scene `accent` change in `world.config.js`, and the chrome
tracks it for free. The `.sw-root` default `#8a7bb5` at `:461` is a fallback that
nothing reaches.

### Background token trap

`--sw-bg` has two values and the wrong one is easier to find:

| where | value | wins? |
|---|---|---|
| `assets/scroll/scrub-engine.js:461` (`.sw-root`) | `#F5EDE0` | no — fallback only |
| `scroll-world/compose.js:70` (built `<head>`) | `#FAF8F5` | **yes** |

The effective background is `#FAF8F5`, matching `--paper` in `es.html`. Anyone
grepping the engine finds `#F5EDE0` and is wrong.

## Framing to re-derive

`object-position: center 42%` (`scrub-engine.js:495`, with `46%` at `:561` and `44%`
at `:568`) is tuned to the clay island and **must be re-derived against photoreal
footage**. It cannot be carried over.

Related and still open: `object-fit: contain` is correct for a 9:16 clip and wrong
for a 16:9 one. On a 390x844 phone (9:19.5) even portrait leaves a gap, but it
lands top and bottom against `#FAF8F5` at a measured delta of <=14, so the
letterbox is invisible and the subject survives at 100% instead of the 71-79% that
`cover` gives. **Not shipped** — against the current 16:9 clips it shrinks the film
to a 224px stamp. It becomes correct only once portrait clips exist.

## Costs

| item | price |
|---|---|
| still | $0.166 |
| dive, 480p | $1.13 |
| content refusal | $0.00 |
| full 1080p re-render | ~$50 (pure pixel count; same for 9:16 and 16:9) |

Balance: `GET https://rest.alpha.fal.ai/billing/user_balance` returns a plain USD
number. $42.02 as of 2026-08-28. A flapping `403 "Exhausted balance"` on a healthy
balance is stale node state, not the account — retry the **submit** (a failed
submit has queued nothing, so it cannot duplicate work).

## Should this be built at all

The honest case against, verified from Umami on 2026-08-28:

- **1–19 visitors/day, mostly 2–4; ~105 distinct over 19 days.**
- `/scroll/` is `noindex` **and unlinked** — nothing in `es.html` or nginx points at
  it. Its real audience is approximately zero.
- A full photoreal re-render is 6 stills + 6 dives + 5 connectors. At 480p that is
  roughly $20; at 1080p roughly $50, against a $42.02 balance.

Against that: the film is the only asset that explains the product as a story, and
the work to date is already sunk.

**Decision 2026-08-28: write this spec, spend nothing.** Revisit if `/scroll/` ever
gets linked, or if traffic justifies it. The cheap next step, whenever it comes, is
the `cocina` reframe — free if the filter refuses, ~$1.30 if it passes.

## Open questions

- **Rival van placement.** The approved design puts a rival van in the street below
  "on connector 2, after *the job goes to whoever picked up*". These conflict: the
  line about the job going to someone else is in `furgoneta` (index 4), so
  "after" it means `conn_4`, whereas `conn_2` sits between `centralita` and
  `agenda` — *before* it. `still_rooftop_real.txt` and `conn_real_0.txt` both
  already contain "a white work van parked in a narrow street". Unresolved; pick
  one before rendering.
- **`conn_real_0.txt` lifts out of *the kitchen***, but `conn_0` sits between `obra`
  and `cocina`. Either the file is misnamed for `conn_1`, or the photoreal scene
  order differs from the clay one. Unresolved.
- **`cocina` reframe untested.** It is the one scene written around a face. Needs
  re-shooting over-the-shoulder or from behind before its dive can exist.

## Out of scope

- `es.html`, `nl.html`, `receptionist.html`, `test-palette.js` — **untouched**. The
  palette change is film-only.
- Shortening the film from 14.4 screens (`diveScroll`/`connScroll` in
  `world.config.js`). Free, unrelated to the video, and independent of this spec.
- The mobile crop fix. Deliberately deferred so it is not solved twice against a
  style that may yet be rejected.
- `prefers-reduced-motion`, still never observed working.
