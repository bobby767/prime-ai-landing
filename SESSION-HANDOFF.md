# Session Handoff — mobile chrome shipped; photoreal film blocked on a content policy, not on money

_Last updated: 2026-08-28_

## Where it started

Picked up the previous handoff's "Pick up here": finish the mobile chrome fix on
`/scroll/`. That shipped early. The session then turned into a full redirection of the
film — the user asked for photoreal humans and a busy city instead of the clay diorama
— which was brainstormed, grilled, and part-tested before a hard model constraint was
found. It closed on a broader "what would you improve" review that moved off the film
entirely.

## Decisions locked + what shipped

- **Mobile chrome fixed and deployed** (`0fe7f92`). The missing third part belonged in
  `compose.js`, not the engine: `body.sw-playing .cta-movil{display:none}` (0,2,0 beats
  the 0,1,0 of `display:flex` in `@media (max-width:767px)`, so no `!important`).
  Verified live at 390x844 — skip ends 371 (was clipped at 413), CTA and brand hidden
  under 700px (the CTA's right edge had been at 611 on a 390px screen, swallowed by
  `overflow-x:hidden`), `scrollWidth` equals the viewport, and `.cta-movil` returns past
  the film and on skip. Also verified 360x780 and 701x844 — 701 was the untested band
  (CTA still shown, scene nav already hidden); CTA ends 666 of 701.
- **The film stays on phones.** `/scroll/` is `noindex` **and unlinked** — nothing in
  `es.html` or nginx points at it. Hiding the film on mobile would defeat the draft's
  only purpose. This settles the previous handoff's open question.
- **Render chain does portrait** (`50f881e`). `SFX` hangs off output filenames only,
  never prompts; empty = the landscape chain byte for byte, which protects the
  gitignored $10.34 set that cannot be regenerated for free.
  New `gen_still()` — step 1 of a "reproducible" chain had been done by hand.
- **Two latent bugs fixed in that pass.** `run_dives.sh` rendered **5 of 6** (obra was
  launched by hand in the first run and never returned to the script, so the
  reproduction command in `docs/scroll-deploy.md` would have left `conn_0` without an
  endpoint). `encode.sh` stretched portrait posters via `scale=1536:-2`.
- **Seedance will not animate an identifiable face** (`bba68b7`) — the most important
  finding of the session. Measured, three inputs, same pipeline:

  | input still | result |
  |---|---|
  | woman on the phone, face visible in profile | `content_policy_violation` |
  | plumber, head inside the sink cabinet, no face | renders |
  | rooftops at blue hour, no people | renders |

  Photoreal is still viable, but the film must be shot face-occluded — over the
  shoulder, from behind, hands only — with "his face is never visible at any point"
  written into the prompt explicitly.
- **A content rejection costs $0**, and arrives as a **COMPLETED** job with
  `detail[].type = content_policy_violation`, NOT a FAILED status. Check the body.
- **Balance endpoint found** (`f090ceb`) — `GET
  https://rest.alpha.fal.ai/billing/user_balance`. Prices anything Fal will not
  itemise; closed the three-session-old "stills cost unmeasured" question at
  **$0.166 each**.
- **`object-fit:contain` is right for a 9:16 clip and wrong for a 16:9 one.** A 390x844
  phone is 9:19.5, so even portrait leaves a gap — but it lands top and bottom, and
  those edges measure <=14 from `#FAF8F5` (which is `--sw-bg`), so the letterbox is
  invisible and the island survives at 100% instead of 71-79% under cover. **Not
  shipped**: against the current 16:9 clips it shrinks the film to a 224px stamp.
- **17 commits pushed** to `origin/warm-palette` on the user's go-ahead. Zero unpushed.
- **Deliberately did NOT put a phone number on the live page.** `…604` is not a working
  replacement for `…630` — stuck in `checking` since 23 Aug **and** routed to bare SIP
  `605899` instead of `@sip.retellai.com`. Publishing it would have shipped a second
  dead number.

## Design agreed for the photoreal film (never written as a spec — this is the only record)

Classified architectural. Approved by the user in brainstorming, then the session
pivoted before the spec file was written.

- Photoreal Andalusian city at **blue hour**. Cool comes from the sky and shadows;
  warmth only from lit windows. Cool + contrast cannot come from the architecture,
  which is warm ochre and terracotta.
- **Scenes stay interiors; the void between them becomes the city.** Connectors rise
  out through a window, over rooftops (terraces, aircon units, laundry, satellite
  dishes, palms), every window lit warm amber, then descend into the next interior.
  Rival van in the street below on connector 2, after "the job goes to whoever picked
  up".
- **Clock advances** dusk -> night -> dawn, resolving to bright paper at the exit. The
  `#FAF8F5` handoff constraint becomes the ending.
- **Palette change is film-only.** `es.html` untouched, `test-palette.js` unchanged.
  The film adopts the page's existing `--accent: #2563EB` as the sky. NOTE:
  `--sw-accent` has **26 usages** in the engine and drives the scrollbar, route markers
  and hint, not just imagery — turning it blue changes the chrome too. Raised, not
  resolved.
- **Scenes 3/4/6 (centralita, agenda, demo) collapse onto a real phone** — ringing and
  answered untouched; the booking arriving as a message; a hand holding the live call.
  They had no photoreal form: scene 6 was explicitly "floating in soft plain #FAF8F5
  space", defined by the void being removed.
- `object-position: center 42%` (46%/44% at breakpoints) is tuned for the clay island
  and must be re-derived against photoreal footage.

## Key files for next session

- `/home/ubuntu/Prime_AI/Landingpage/docs/scroll-deploy.md` — **read first.** Gained
  three sections this session: the portrait 9:16 chain, the photoreal content-policy
  rules, and the balance/retry traps.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/fal.sh` — `SFX`, `gen_still()`,
  `IMG_W`/`IMG_H`.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/prompts/` — `still_obra_real.txt` and
  `dive_obra_real.txt` (accepted); `still_rooftop_real.txt` and `dive_rooftop_real.txt`
  (accepted); `still_cocina_real.txt` and `dive_cocina_real.txt` (**refused by the
  filter, kept as evidence of what does not pass**); `conn_real_0.txt` (written, never
  rendered).
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/compose.js` — the build; carries the
  `sw-playing` rule.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/world.config.js` — film copy, four
  languages. Text is edited here, not in `scroll.html`.
- `/home/ubuntu/Prime_AI/Voice_agent/src/zadarma.ts` — `numbers()` gives authoritative
  number state; `route()` would fix `…604`. Run with
  `bun --env-file=/home/ubuntu/Prime_AI/outreach-engine/.env`.
- Plan file: none.
- Memory files touched: none.

## Running state

- Background processes: `python3 -m http.server 8899 --bind 127.0.0.1` — **PID
  4021569**, serving `/home/ubuntu/Prime_AI/Landingpage`, loopback only.
  Kill: `kill 4021569`. Not started by this session. Two `run_in_background` tasks
  (`bx9fh72lu`, `bkzo7nkfb`) both completed; nothing of theirs is still alive.
- Dev servers / ports: `http://127.0.0.1:8899/scroll.html` — loopback, reachable from a
  laptop only via `ssh -L 8899:127.0.0.1:8899 ubuntu@srv1233720.hstgr.cloud`.
  Live URL: `https://prime-ai.es/scroll/`.
- Open worktrees / branches: `warm-palette`, **fully pushed**, clean working tree.
- A Playwright browser is open at `https://prime-ai.es/es/?lang=es`, viewport
  **390x844**, with the voice-demo panel left open.
- Untracked generated assets (all gitignored, none in git): 6 x
  `scroll-world/still/*_9x16.png`; `scroll-world/still/{obra,cocina,rooftop}_real.png`;
  `scroll-world/vid/dive_obra_real.mp4`; `scroll-world/vid/dive_rooftop_real.mp4`.
- **Fal balance $42.02.** Spent $5.02 this session — $2.76 necessary and **$2.26
  wasted** by a retry loop whose success-check grepped log text, never matched, and
  re-rendered an already-finished clip three times.

## Verification — how to confirm things still work

- `node /home/ubuntu/Prime_AI/Landingpage/tests/test-scroll-page.js` — `OK`.
- `node /home/ubuntu/Prime_AI/Landingpage/tests/test-palette.js` — `OK`, 3 pages.
- `node /home/ubuntu/Prime_AI/Landingpage/tests/test-roi.js` — `OK`, 64 combinations.
- `node /home/ubuntu/Prime_AI/Landingpage/tests/test-nl-ready.js` — exits 1 with its 5
  documented blockers. **Expected.** It gates `nl.html` only.
- `git show HEAD:es.html | diff - /var/www/prime-ai/es/index.html` — empty. The live
  Spanish page was untouched for the whole session.
- `diff /home/ubuntu/Prime_AI/Landingpage/scroll.html /var/www/prime-ai/es/scroll/index.html`
  — empty. Same for `assets/scroll/scrub-engine.js`. Deploying needs root:
  `sudo install -o www-data -g www-data -m 644 <src> <dst>`.
- `curl -sS -H "Authorization: Key $FAL_KEY" https://rest.alpha.fal.ai/billing/user_balance`
  — a plain USD number, currently ~42.
- A flapping `403 "Exhausted balance"` on a healthy balance is stale node state, not the
  account. Retry the **submit** (a failed submit has queued nothing, so it cannot
  duplicate work) and test success by **the output file existing**, never by grepping
  the log line.

## Deferred + open questions

- ~~Deferred: the design above was never written as a spec.~~ **DONE 2026-08-28**
  (`982640b`) — `docs/superpowers/specs/2026-08-28-photoreal-film-design.md`. That file
  now supersedes the design section above, and corrects two things it got wrong: the
  cocina *still* was never refused (only the dive was, on `loc ["body","image_url"]`),
  and `--sw-accent` is already per-scene so a blue palette needs no global edit.
- Deferred: **`cocina` reframe untested** — the one scene written around a face. Needs
  re-shooting over-the-shoulder or from behind. Still is $0.166; the dive is $1.13 only
  if it passes, since a rejection is free.
- Deferred: **mobile crop still unfixed** — the thing that started the session. The
  chrome around it was fixed. Now waits on the photoreal style settling, so it is not
  solved twice against a style that may be rejected.
- Deferred: 1080p render (~$50, pure pixel count, same for 9:16 and 16:9); shortening
  the film from 14.4 screens (free — `diveScroll`/`connScroll` in `world.config.js`,
  unrelated to the video); `prefers-reduced-motion` still never observed working;
  the Swedish is unreviewed.
- Open: **is the film worth continuing at all?** Verified from Umami this session —
  **1-19 visitors/day, mostly 2-4, ~105 distinct over 19 days**, and `/scroll/` is
  noindex and unlinked. Raised with the user, not resolved.
- Open: **Zadarma support ticket** for `…630` and `…604`, stuck in `checking` for 7 and
  5 days. `checking-wrongs` returns empty for both, so there is nothing to fix from this
  side. User's action.
- Open: **re-route `…604`** from `605899` to `@sip.retellai.com` so it works the moment
  checking clears. Offered; needs explicit go-ahead as it is live telephony config.
- Open: **does the browser voice demo actually connect?** The panel opens clean, no
  console errors, with correct AI disclosure — but end-to-end needs a microphone and was
  NOT verified. 30 seconds of the user's time, and it outranks the film if broken.
- Corrected in session, for the record: I claimed the page had no way to try the
  product. That was wrong. `.llamar` ("Escúchala contestar — sin teléfono") is prominent
  on desktop **and** mobile, and mobile correctly shows it instead of the dead number.

## Pick up here

The film is **on hold by decision, not by blocker** (user, 2026-08-28): 2-4 visitors/day
to a page that is `noindex` and unlinked does not justify a ~$20-50 re-render against a
$42.02 balance. The design is now safely in
`docs/superpowers/specs/2026-08-28-photoreal-film-design.md` — read that, not the
design section above.

So the film is no longer the top of the list. What is, in order:

1. **Does the browser voice demo actually connect?** `.llamar` is the only way a
   visitor can try the product, it is prominent on desktop and mobile, and end-to-end
   was never verified. Needs a microphone — 30 seconds of the user's time.
2. **Zadarma** — user's action on the `…630`/`…604` tickets. The `…604` re-route was
   offered and the user declined it on 2026-08-28: they are handling Zadarma
   themselves. Do not re-offer unasked.
3. The film, only if `/scroll/` ever gets linked. Cheapest next step is the face-free
   `cocina` reframe: free if refused, ~$1.30 if it passes.
