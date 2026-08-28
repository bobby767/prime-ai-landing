# Session Handoff — mobile chrome fixed and deployed; the 9:16 render is blocked on an empty Fal balance

_Last updated: 2026-08-28_

## Where it started

Picked up from the previous handoff to choose among three deferred items; user chose the
free hint fix. That led to a much larger question — whether the scroll page could carry
the information from the live `es.html` — answered "yes, with an exit", built as option
A, then extended with a skip control and full four-language support. A second sitting
on 2026-08-28 finished the mobile chrome and shipped it, then started the 9:16 render
and hit an empty Fal balance. See "Session of 2026-08-28 (second half)" below — where
it disagrees with anything above, it is newer and it wins.

## Decisions locked + what shipped

- **Hint fix (commit `5b5a474`)** — the handoff's diagnosis was wrong. Not the light
  island edge: measured background under the hint is `rgb(175,139,110)`,
  `--sw-ink-soft` was **1.99:1**. Now `--sw-ink` (5.36:1) + a `--sw-bg` halo on
  `.sw-hint` itself so the mouse glyph's border and `::after` get it too.
- **`scroll.html` is now GENERATED, not written (commit `cff7fa5`)** —
  `node scroll-world/compose.js` joins `es.html` + `scroll-world/world.config.js`.
  Editing `scroll.html` by hand is pointless; `tests/test-scroll-page.js` fails if it
  drifts. `es.html` is the live page and changes; a pasted copy would be stale same-day.
- **The film now exits** — every engine layer is `position:fixed`; it stayed glued to
  the screen forever and painted over anything below the container (proven: a
  full-height section appended after `#world` sits in the viewport and is invisible).
  Fades across the last `vh`, at two speeds (text clears in the first 45%, image
  dissolves to the end, because at a flat 50% both headlines were legible on top of
  each other). Only activates when `container.nextElementSibling` exists, so a
  film-only page still ends on its last frame and CTA.
- **`overflow-x` goes on `body`, NEVER on `html`** — the engine's
  `html,body{overflow-x:hidden}` was killing `es.html`'s sticky nav. `clip` does **not**
  help; only removing it from the root does. Measured three ways: `navTop` −1800 with
  the rule, 11476 with the sheet disabled, 0 with the root set to visible.
- **Relative paths rewritten at build time (commit `2817600`)** — `demo-call.mp4`
  (22 MB) and its poster would have 404'd at `/scroll/`. Invisible in local testing,
  where the test page sits at the root exactly like `es.html`. Confirmed against the
  live host: `/demo-call.mp4` 206, `/scroll/demo-call.mp4` 404.
- **`@layer` was quietly losing every fight (commit `126866e`)** — the engine wrapped
  its whole stylesheet in `@layer sw`; a layered rule loses to ANY unlayered rule
  regardless of specificity, so `es.html`'s `*{padding:0}` beat
  `.sw-topbar{padding:clamp(...)}` (topbar with no padding, nav pill collapsed, CTA
  jammed on the edge). Now only the `.sw-root` tokens rule is layered — which is all
  the layer was ever for.
- **"Saltar a la web" skip control** — the film is **14.4 screens / ~114 wheel
  notches**; there was no way out. Jumps with `behavior:'instant'` on purpose
  (`es.html` sets `scroll-behavior:smooth`, and a smooth 13.000 px scroll makes the
  engine rewind every clip on the way).
- **Four languages, 39 strings x ES/EN/NL/SV (commits `72966be`, `dac7770`)** — config
  values accept `'text'` or `{es,en,nl,sv}`; the engine paints Spanish and hangs
  `data-en/nl/sv` on the LEAF element (never a wrapper — `traducir()` rewrites
  innerHTML). No change to `es.html`: its `traducir()` does
  `querySelectorAll('[data-en]')` on every flag press. The engine `<script>` moved
  **before** `es.html`'s script so a cold `?lang=xx` load translates the film too.
- **Flags in the film's topbar press the page's own `.idioma-btn`** — one language
  system, not two that drift. Active flag follows a `MutationObserver` on
  `aria-pressed`. No flags render if the host page has none.
- **I was wrong that Dutch was blocked** — `test-nl-ready.js` gates `nl.html`
  (prime-ai.nl data controller, privacy notice, nginx), NOT the language switcher.
  `es.html` already ships 105 NL + 105 SV strings in production. A Spanish film above a
  Dutch page was the inconsistent state.
- **Register copied from live copy** — the AI is "haar" in Dutch, "den" in Swedish.
  If that changes in `es.html` it must change in `world.config.js`.
- **Dead CTA fixed** — the topbar CTA pointed at `#demo`; the engine never puts scene
  `id`s in the DOM, so it had been dead since first deploy. Now the booking link.
- **Scene nav hides below 1080px** — flags (160px) + skip (118px) filled a topbar that
  was already full; at 880px the CTA ran to 1005px and `overflow-x:hidden` swallowed it
  with no trace. Verified 861–1440px.

## Key files for next session

- `/home/ubuntu/Prime_AI/Landingpage/docs/scroll-deploy.md` — **read first.** Now covers
  the exit and its two rules, the `overflow-x` and `@layer` traps, relative paths, the
  language mechanism, and the topbar width budget.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/compose.js` — the build. Rewrites
  relative paths to absolute, inserts the engine BEFORE `es.html`'s script, and refuses
  to build if the engine does not parse.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/world.config.js` — all film copy in
  four languages. **This is where text is edited**, not `scroll.html`.
- `/home/ubuntu/Prime_AI/Landingpage/assets/scroll/scrub-engine.js` — committed and
  deployed as of `0fe7f92`. No longer pending.
- `/home/ubuntu/Prime_AI/Landingpage/tests/test-scroll-page.js` — new. Four checks, all
  mutation-tested to prove they actually fail.
- `/home/ubuntu/Prime_AI/Landingpage/scroll.html` — GENERATED. Do not hand-edit.
- Plan file: none.
- Memory files touched: none.

## Running state

- Background processes: `python3 -m http.server 8899 --bind 127.0.0.1` — **PID
  4021569**, serving `/home/ubuntu/Prime_AI/Landingpage`, loopback only.
  Kill: `kill 4021569` (or `pkill -f "http.server 8899"`). Not started by this session;
  still in use for local testing.
- Dev servers / ports: `http://127.0.0.1:8899/scroll.html` — loopback, reachable from a
  laptop only via `ssh -L 8899:127.0.0.1:8899 ubuntu@srv1233720.hstgr.cloud`.
  Live URL: `https://prime-ai.es/scroll/`.
- Open worktrees / branches: branch `warm-palette`, **8 commits unpushed** and never
  pushed — user has not authorised a push.
- Engine and `scroll.html` are committed AND deployed; repo and `/var/www/` agree.
  Deploying needs root: `sudo install -o www-data -g www-data -m 644 <src> <dst>`.
- A Playwright browser session is open at `https://prime-ai.es/scroll/?lang=sv`, with
  the viewport still set to **390x844**.

## Verification — how to confirm things still work

- `node tests/test-scroll-page.js` — `OK`.
  Passes even with the pending engine edits, because `scroll.html` only references the
  engine by `<script src>` and is unaffected by them.
- `node tests/test-palette.js` — `OK` on en/es/nl, 3 pages.
- `node tests/test-roi.js` — `OK`, 64 combinations; worked example 3000 EUR, top of
  range 59.950 EUR (both confirmed live in the browser this session).
- `node tests/test-nl-ready.js` — exits 1 with its 5 documented blockers. **Expected.**
  It gates `nl.html` and has nothing to do with the film's languages.
- `git show HEAD:es.html | diff - /var/www/prime-ai/es/index.html` — empty. The live
  Spanish page was untouched for the whole session.
- `diff scroll.html /var/www/prime-ai/es/scroll/index.html` — empty.
- `diff assets/scroll/scrub-engine.js /var/www/prime-ai/es/scroll/assets/scroll/scrub-engine.js`
  — **DIFFERS.** Expected: this is the pending mobile work.
- `curl -sS -o /dev/null -w "%{http_code}\n" https://prime-ai.es/scroll/` — 200.
  Also `/` 200, `/en/` 302, `/es/` 301.
- Languages live: `https://prime-ai.es/scroll/?lang=` es/en/nl/sv each switch the film,
  hint, skip and CTA together with the page.

## Deferred + open questions

- ~~Mobile is live and broken~~ — the chrome half is FIXED and deployed (`0fe7f92`).
  The crop half remains: the clip is **864x496** (not 1536x882, that was the still) and
  `object-fit:cover` at 390x844 shows **27% of the frame width**. Decided and in
  progress: native 9:16 chain, blocked on the Fal balance.
- Settled: the film **stays** on phones. `/scroll/` is noindex and unlinked, so hiding
  it there would defeat the draft's only purpose.
- Deferred: **1080p final render** (~$50), `VRES=1080p`. Recommendation stands: settle
  the film's length first — as an intro it may want 3-4 scenes rather than 6, which
  would shrink that bill instead of spending it. Start tracking `assets/scroll/vid/` in
  git at that point.
- Deferred: **shortening the film** — 14.4 screens is too long. Free: `diveScroll`,
  `connScroll` and each section's `scroll` in `world.config.js`. No re-render; the
  scroll distance is unrelated to the video.
- Deferred: `prefers-reduced-motion` fallback still never observed working; the harness
  does not expose emulation for it. Not claimed as working.
- Open: **who reviews the Swedish.** Dan can read the Dutch himself (39 short lines in
  `world.config.js`). The Swedish is unreviewed — the same standard as the Swedish
  already live on `es.html`, so not a new risk, but not a verified one either.
- Open: **eight commits sit unpushed** on `warm-palette`. Push needs the user's go-ahead.
- Open: **stills cost unmeasured** — Fal returns no cost field for `openai/gpt-image-2`
  (confirmed again this session: the response carries `content_type` and `file_name` and
  nulls for everything else). 7 + 6 images now generated. The balance ran out during the
  second batch, so the dashboard figure is also the answer to how much they cost.

## Session of 2026-08-28 (second half)

- **Mobile chrome is fixed and LIVE** (commit `0fe7f92`). The missing third part is in
  `compose.js`, not the engine: `body.sw-playing .cta-movil{display:none}`. Verified on
  `https://prime-ai.es/scroll/` at 390x844 — skip ends at 371 (was clipped at 413), the
  booking CTA and brand name are hidden under 700px (the CTA's right edge had been at
  611px on a 390px screen, swallowed by `overflow-x:hidden`), `scrollWidth` equals the
  viewport, and `.cta-movil` is gone during the film and back at 764 once past it, both
  by scrolling and via the skip button. 360x780 and 701x844 also checked — 701 was the
  worst case of a band nobody had measured (CTA still shown, scene nav already hidden);
  it ends at 666 of 701.
- **`/scroll/` is noindex AND unlinked.** Nothing in `es.html` or nginx points at it.
  That settles the "should the film show on phones" question: hiding it would defeat the
  draft's only purpose. Decision: keep it, fix the crop properly.
- **The render chain does portrait now** (commit `50f881e`) — `SFX`, `gen_still()`, and
  two bugs found on the way: `run_dives.sh` rendered 5 of 6 (obra was never returned to
  the script), and `encode.sh` stretched portrait posters. See `docs/scroll-deploy.md`.
- **`object-fit:contain` is the right answer for a 9:16 clip** — not cover. Measured, and
  written up in the doc. Do NOT ship the contain rule before the 9:16 clips exist.
- **BLOCKED: the Fal balance is exhausted.** The 6 portrait stills went through; every
  dive submit came back `403 "User is locked. Reason: Exhausted balance."` **Nothing was
  rendered and nothing was billed for video.** Top up at fal.ai/dashboard/billing, then:

      cd scroll-world
      SFX=_9x16 VRATIO=9:16 bash run_dives.sh    # $6.79
      SFX=_9x16 VRATIO=9:16 bash run_conns.sh    # $3.55
      SFX=_9x16             bash encode.sh

  Then the parts that do not exist yet: a portrait `clip`/`still` sibling per section in
  `world.config.js`, an orientation pick at mount in the engine, and the `contain` rule.
- Landscape 480p set verified intact by md5 after the failed run. It is gitignored and
  cost $10.34; `SFX` exists so it cannot be overwritten.
- Still open: **7 commits unpushed** on `warm-palette` (was 6). Push needs a go-ahead.

## Pick up here

Top up the Fal balance, then run the three portrait commands above ($10.34 total). When
the clips land, wire them in: a portrait sibling per section in `world.config.js`, an
orientation pick at mount in the engine, and `object-fit:contain` under the portrait
media query — the three pieces the doc's new "portrait (9:16) chain" section describes.
