# Session Handoff — /scroll/ became the real page under a film: exit, skip, four languages; mobile fix half-done

_Last updated: 2026-08-28_

## Where it started

Picked up from the previous handoff to choose among three deferred items; user chose the
free hint fix. That led to a much larger question — whether the scroll page could carry
the information from the live `es.html` — answered "yes, with an exit", built as option
A, then extended with a skip control and full four-language support. Session ended
mid-way through fixing mobile, which is **live and broken right now**.

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
- `/home/ubuntu/Prime_AI/Landingpage/assets/scroll/scrub-engine.js` — **has
  uncommitted, undeployed changes.** See Running state.
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
- Open worktrees / branches: branch `warm-palette`, **6 commits unpushed** and never
  pushed — user has not authorised a push.
- **UNCOMMITTED + UNDEPLOYED: `assets/scroll/scrub-engine.js`.** Two half-finished
  mobile fixes were applied when the session ended:
  (a) `document.body.classList.add('sw-playing')` at mount +
      `classList.toggle('sw-playing', ex < 1)` in the exit block — a host hook so the
      page below can hide its own fixed furniture while the film is up;
  (b) `@media (max-width:700px)` rules hiding `.sw-topcta` and `.sw-brand__name` and
      shrinking `.sw-lang` / `.sw-skip` padding.
  It **parses OK** but was never composed, tested, or deployed. The deployed engine
  therefore differs from the repo.
- **The third part was never written**: `compose.js` still needs a rule along the lines
  of `body.sw-playing .cta-movil{display:none}` (specificity 0,2,0 beats the 0,1,0 that
  sets `display:flex`, so no `!important`). Without it the `sw-playing` class does
  nothing at all.
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

- **Mobile is live and broken.** Measured on the live page at 390x844:
  `.sw-topcta` right edge at **611px** (off-screen, swallowed by `overflow-x:hidden`, so
  the booking button simply does not exist on a phone); `.sw-skip` clipped at 413px;
  the brand wraps to two lines; `es.html`'s `.cta-movil` (`position:fixed`,
  `z-index:999`, 80px tall) floats over the film for all 14 screens and hides the scroll
  hint; and the film is centre-cropped from a **1536x882** source to **402x869** with
  `object-fit:cover`, losing the diorama island that is the whole concept.
- Deferred: **native 9:16 mobile chain** — the only real fix for the crop; costs a
  render. Alternative raised but NOT decided: do not show the film on phones at all
  (one line, free), which would make the mobile chrome work moot.
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
- Open: **six commits sit unpushed** on `warm-palette`. Push needs the user's go-ahead.
- Open: **stills cost unmeasured** — Fal returns no cost field for `openai/gpt-image-2`;
  7 images were generated. Read the real figure off the Fal dashboard.

## Pick up here

Finish the mobile chrome fix: add `body.sw-playing .cta-movil{display:none}` to
`compose.js`, rebuild with `node scroll-world/compose.js`, verify at 390x844 that the
skip and flags fit and the hint is clear, then deploy the engine to
`/var/www/prime-ai/es/scroll/assets/scroll/` — **or** first ask whether the film should
appear on phones at all, since hiding it there makes that work unnecessary.
