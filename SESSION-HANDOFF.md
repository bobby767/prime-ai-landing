# Session Handoff — the film got half as heavy on phones, and one promise turned out to have six wordings

_Last updated: 2026-08-30_

> **This session spans TWO repos.** `/home/ubuntu/Prime_AI/Landingpage` (own repo, branch
> `warm-palette`) and `/home/ubuntu/Prime_AI` (branch `voice-agent-v1` — contains
> `outreach-engine/`, `Voice_agent/`, `docs/`, `Onboarding/`). Everything below gives
> absolute paths because of that.

## Where it started

Picked up the previous handoff's two open items: confirm the Instagram handle, then do
the deferred mobile video encode. Both closed. The user then asked for a knowledge base
for a WhatsApp agent that answers questions and books into Cal.com — and asked to be
interviewed for it. Researching what the KB would need turned up a live commercial
inconsistency that had nothing to do with WhatsApp, and fixing that took the rest of the
session.

## Decisions locked + what shipped

### Mobile encode (Landingpage, `7d71581`, deployed + pushed)

- **`clipMobile`/`connectorsMobile` now set** in
  `/home/ubuntu/Prime_AI/Landingpage/scroll-world/world.config.js`. Files are
  `<name>.m.mp4` beside the desktop ones; `encode.sh` builds them.
- **Resolution is UNCHANGED — only bitrate (crf 28 vs 20) and GOP (`-g 4` vs `-g 8`).**
  This was measured, not assumed. A phone at 390px already upscales these 864×496 clips
  ~5× because `object-fit: cover` fits the viewport HEIGHT and discards 73% of the width,
  so resolution is already the binding constraint. On `furgoneta.mp4` (3.02 MB):
  640×368 crf 24 → 1.47 MB **SSIM 0.9588**; 864×496 crf 28 → 1.59 MB **SSIM 0.9703**;
  648×372 crf 26 → 1.28 MB **SSIM 0.9538**. Downscaling buys 0.12 MB and costs real
  sharpness. Do not "optimise" this by lowering resolution — it was tried and measured.
- **Cropping the frame is ruled out**, not merely unchosen: the engine's `isMobile()` is
  `coarse pointer OR ≤860px`, which also catches a phone held LANDSCAPE, where a
  vertically-cropped clip breaks.
- Measured on the LIVE apex: landing **3.1 → 1.75 MB**, whole film **22.5 → 11.17 MB**,
  desktop untouched at 22.34 MB.
- `compose.js` needed no change — its guard regex-matches every `assets/scroll/` string in
  the emitted HTML, so the new paths were stamped and disk-checked automatically. It now
  reports **29 assets, not 18**.
- New test `/home/ubuntu/Prime_AI/Landingpage/tests/test-mobile-clips.py` watches the
  NETWORK at 390px+touch vs 1440px. It exists because this is a silent failure:
  `clipMobile` is optional, a mistyped path throws nothing, the engine falls back to the
  desktop clip and the page works perfectly while the phone pays double.

### Instagram (closed)

`primeai.solutions` **confirmed correct by the user**. It cannot be verified from this
host — instagram.com answers this VPS with 429 + a login wall regardless. Do not curl it
and conclude it is broken.

### WhatsApp agent knowledge base (Prime_AI repo, `a11bdb9` + `026c432` + `8225e72`)

Questions doc: `/home/ubuntu/Prime_AI/docs/whatsapp-agent-kb-questions.md`.

**Most of the KB already exists and must be inherited, not rewritten:**
`Voice_agent/src/sales-agent.ts` (4,817 lines — objections, reframes, hard bans),
`outreach-engine/src/pricing.ts` (prices), `Voice_agent/src/booking.ts` (728 lines —
**Cal.com create/cancel/reschedule already built and working**), `Prime_AI/PRODUCT.md`.

`booking.ts` is a custom route rather than Retell's built-in Cal tool for a real reason:
Retell hardcodes `api.cal.com`, the account is on EU data residency (`api.cal.eu`), and
the key 401s there identically to a fake one. Do not rediscover this.

Settled by the user this session:
- **Price: no number.** It depends, Dan works it out. Instead of claiming it is cheap it
  **leads with the guarantee** — chosen because every part is already true and published.
- **Identity: opens as Prime AI's assistant, NOT as Dan.** Consequence: the hero/bubble
  copy "Escríbeme" / "Message me" in `es.html` now promises a person and **must be
  rewritten**. Not done yet.
- **Booking: creates only, and only after qualifying.** Cancel/reschedule NOT granted.
- **Inbox:** goes silent in a thread once Dan replies by hand; Discord ping on handoff;
  never sells to a signed client. Handling replies to cold outreach was NOT selected —
  treat as out of scope, confirm.
- **Languages: Spanish, English, Dutch, Swedish.** Detects from the message, switches if
  they switch. **Rule: never translate a commitment on the fly.** `PRICE_LINE` exists only
  in es/en, so an improvised Dutch refund promise would be a legal commitment invented in
  a language Dan cannot read — and on WhatsApp it is screenshottable and permanent. The
  voice agents already solved this: they cite the page rather than state terms
  (`SWEDEN.guarantee` → "every krona back … printed on the page … prime-ai.es/?lang=sv").
  `es.html` renders the guarantee in all four, Swedish correctly says *varenda krona*.

### The guarantee had SIX wordings — now 30 days everywhere (`2c01067`)

Found while checking a drafted KB line. `prime-ai.es` has always said **30 días, "te
devuelvo hasta el último euro"**, and `sales-agent.ts` cites the page, so the site and all
four voice agents already agreed. Five other surfaces did not:

| Surface | Said before |
|---|---|
| `outreach-engine/src/pricing.ts` `PRICE_LINE` (WhatsApp + email, from `34647599453`) | 60 días, "el último mes no lo pagas" |
| `outreach-engine/src/audit/report.ts` | 60 días, "si no notas la diferencia, lo quitamos" |
| `Onboarding/CLIENT-ONBOARDING.md` stage 6 | 60 días, one month |
| `PRIME-CONTEXT.md` | 60 días — **and pre-08-28 prices 297/397/694** |
| `outreach-engine/docs/acquisition-pipeline.md` | same |

All now 30 days + full refund. `es.html` needed NO change. The two stale docs now carry
99/149/248. **The Loom script needed no edit** — it reads `PRICE_LINE`.

**Side effect worth keeping:** the old wording promised a RESULT ("si en 60 días no hay
más llamadas atendidas"), which `sales-agent.ts` forbids its own agents from doing. The
page's wording is a condition on the product. Aligning the window removed a promised
result.

**Guards now check BOTH directions** — new text present AND old text absent. One test's
comment already read "It drifted once already"; this was the second time. Asserting only
the new wording lets the old one reappear elsewhere and still pass.
`copy.test.ts`'s per-product split was rewritten: the guarantee clause is now identical in
all three products, so the split is asserted on the DESCRIPTION, where it now lives.

## Key files for next session

- `/home/ubuntu/Prime_AI/docs/whatsapp-agent-kb-questions.md` — **read first.** Decisions
  taken, and the questions still open.
- `/home/ubuntu/Prime_AI/Voice_agent/src/sales-agent.ts` — the sales brain the WhatsApp
  agent should share, not copy.
- `/home/ubuntu/Prime_AI/Voice_agent/src/booking.ts` — Cal.eu booking, already built.
- `/home/ubuntu/Prime_AI/outreach-engine/src/pricing.ts` — prices + the single guarantee
  wording. Everything downstream re-exports from here.
- `/home/ubuntu/Prime_AI/Landingpage/docs/scroll-deploy.md` — deploy commands, the weight
  table, and **why blob: URLs must be excluded when measuring**.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/encode.sh` — the mobile encode block and
  the SSIM numbers behind it.
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — source of truth for both pages; holds the
  "Escríbeme" copy that now needs rewriting.
- Plan file: none.
- Memory files touched: none.

## Running state

- Background processes: **none.** Nothing was started with `run_in_background`; every
  check ran in the foreground under `timeout`.
- Dev servers / ports: **none persistent.** `tests/test-mobile-clips.py` starts and stops
  its own server on 8913; scratchpad measurement scripts used 8914/8915 and exited.
  Other `http.server` processes on 9876/8080/8899 belong to other sessions — leave alone.
- Open worktrees / branches: **none.** Two repos, both clean:
  `/home/ubuntu/Prime_AI/Landingpage` on `warm-palette`, level with origin at `e93cc1f`.
  `/home/ubuntu/Prime_AI` on `voice-agent-v1`, **23 commits ahead of origin, NOT pushed**
  (4 are this session's: `a11bdb9`, `2c01067`, `026c432`, `8225e72`).

## Verification — how to confirm things still work

- `cd /home/ubuntu/Prime_AI/outreach-engine && bun test` — **540 pass, 0 fail.**
- `node tests/test-palette.js` — `OK`, `es:` must
  read **14 contrast pairs, 40 tokens**.
- `node tests/test-scroll-page.js` — `OK`.
- `python3 tests/test-mobile-clips.py` — `OK`; phone must fetch 11 `.m.mp4` and **zero**
  `.mp4`, 11 scenes each side.
- `PUBLIC=1 node scroll-world/compose.js /tmp/x.html` — **29 assets**, `BASE="/scroll/"`.
  A drop back to 18 means the mobile keys were lost.
- `curl -s https://prime-ai.es/ | grep -c 'name="robots"'` → **0**; `/scroll/` → **1**.
- `grep -rn "60 días\|60 days" /home/ubuntu/Prime_AI/outreach-engine/src --include=*.ts`
  → only inside test comments. Any hit in non-test source is the drift returning.
- **When measuring page weight, discard `blob:` URLs.** The engine fetches each clip once
  and hands it to the `<video>` as a blob; counting every response reports exactly double
  (20.25 MB instead of 11.36). The `prefers-reduced-motion` path has no clips and is the
  control: 0.72 MB.
- **Do not verify a deploy with a headless browser's md5 alone, and do not verify layout
  against the local flat file.** Render the live URL and count `.sw-scene.has-clip` (11).

## Deferred + open questions

- **Open, and blocking the KB: what is the qualification bar before the agent may book?**
  The user chose "books only after qualifying" but has not said what qualifying means.
  It matters: `sales-agent.ts` calls a guarantee on a low-inbound business "a loaded gun
  — the machine has nothing to eat, so it cannot deliver and the client churns angry",
  and `es.html` already says two or three calls a week means it is not for you. Needs:
  which facts are required (trade? missed calls/week? decision-maker? town?) and the pass
  mark. Asked twice, not yet answered.
- Open: the remaining KB questions in the doc — which product leads (PRODUCT.md rules
  "one product per call, trades get the contestador first"), out-of-hours behaviour, what
  it may send, whether it handles replies to cold outreach.
- Open: **"Escríbeme" / "Message me" in `es.html` must be rewritten** now that the agent
  is not Dan. Consequence of a decision already taken; not started.
- Assumed, reversible: ambiguous openers ("ok", "hola", emoji) default to Spanish.
- **Explicitly NOT to be built by an agent: the WhatsApp responder itself.** The user said
  "we will build that, wait don't — I will build that." This session built the knowledge
  base and the questions, not the responder.
- Deferred: `PRIME-CONTEXT.md` lines ~149/513/572/712 still cite 397/297/694 inside
  strategy notes and revenue projections. **Left deliberately** — they record reasoning at
  a point in time and rewriting them would falsify the record. `Content/*.html` ad and
  social scripts also carry 397 € and 60 días; those are real prospect-facing collateral
  and are a separate cleanup the user should scope.
- Deferred (inherited): 1080p re-render — note `Voice_agent`'s sibling
  `scroll-world/dives_9x16.log` shows the last Fal run died on **"Exhausted balance"**, so
  the account needs a top-up before ANY render. Also: shortening the film from 14.4
  screens, Swedish copy still unreviewed by a speaker (now matters slightly more, since
  the agent will point Swedes at that page), site-wide `Cache-Control`.

## Pick up here

Ask the user what the qualification bar is — which facts the agent must establish before
booking, and the pass mark — since that is the one answer blocking the knowledge base from
being written. Nothing is broken; the Prime_AI repo has 23 unpushed commits awaiting the
user's call.
