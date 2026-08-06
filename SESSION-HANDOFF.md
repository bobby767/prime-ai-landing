# Session Handoff — Spanish-default bilingual landing page, then money/guarantee/contrast pass

_Last updated: 2026-08-06_

## Where it started
User asked for the landing page to default to Spanish with a toggle to English.
Investigation found `es.html` (trades, Málaga) and `receptionist.html` (clinics,
English) are explicitly **not** translations — the ES file's own header forbids
treating them as such. User chose a true in-place toggle (one page, both
languages) over linking the two pages. A second request followed: add a
money-saved section, a 30-day money-back guarantee, a "more clients" outcome,
and more colour contrast.

The governing constraint throughout: a visitor presses "Talk to the AI" on this
page and reaches `sales-agent.ts` ~30 seconds later, so the page may not claim
what the call must then refuse to repeat.

## Decisions locked + what shipped
- **Bilingual in place, Spanish in markup / English in `data-en`** —
  `/home/ubuntu/Prime_AI/Landingpage/es.html`, commit `fb9947e`. The direction is
  load-bearing: nginx sends the apex here, so Spanish must render with zero JS
  executed. Switcher swaps via `innerHTML`, captures ES into `data-es` lazily on
  first swap (safe only because the first swap is always ES→EN).
- **nginx root needed no change** — `location = / { return 302 /es/; }` already
  existed in `/etc/nginx/sites-available/prime-ai-demo.conf` from 2026-08-05.
  Verified live. No nginx edit made, no reload.
- **Deployed the bilingual page only** — `es.html` at `fb9947e` copied to
  `/var/www/prime-ai/es/index.html`. Live and verified. Backup at
  `/var/www/prime-ai-backups/es-index.html.bak-20260806-021026`. Backup was
  deliberately moved out of the web root, where it was publicly fetchable.
- **The sum mirrors the agent's arithmetic, not the EN page's** — missed
  calls/day × 20 working days → a third of those → at the cheapest thing a
  customer books. Taken from `sales-agent.ts` PITCH_STATE so the page and the
  call cannot produce different figures from the same two answers. No option
  ships preselected; rounding only ever goes down.
- **Framing is "what's walking past you", never "what you save"** — the agent is
  banned from implying Prime AI recovers that money. The guard fails on eight
  phrasings of the banned version.
- **Guarantee split from performance guarantee** — a money-back *term* is a fixed
  commercial fact and is now confirmable by the agent; a *performance* guarantee
  stays banned. Edit in
  `/home/ubuntu/Prime_AI-voiceagent/Voice_agent/src/sales-agent.ts`,
  **uncommitted**.
- **Three dark anchor bands + amber for money** — applied the approved
  2026-08-05 spec, which had never been implemented on this page. Amber on ink
  is the only surface where it clears AA at normal size (4.51:1 measured).
- **Commits `8e01166` + `c9f7434` are NOT deployed.** Live `/es/` currently has
  the bilingual toggle only.

## Key files for next session
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — the deliverable. Read its header
  comment block first; it documents the bilingual rule, the
  no-price/no-percentage/no-guarantee rule, and the `/voice/privacidad` gap.
- `/home/ubuntu/Prime_AI-voiceagent/Voice_agent/src/sales-agent.ts` — lines
  ~933-965, "WHAT YOU MAY NEVER PROMISE". Contains the uncommitted guarantee
  edit **and** pre-existing WIP that is not from this session.
- `/home/ubuntu/Prime_AI/Landingpage/test-palette.js` — one guard for both pages.
  Its ES block carries a documented `⚠ KNOWN GAP` about the pricing-model
  contradiction below.
- `/home/ubuntu/Prime_AI/Landingpage/test-roi.js` — now covers both the EN model
  and the ES `loQueSeEscapa` sum, including that rounding may only shrink.
- `/home/ubuntu/Prime_AI-voiceagent/Voice_agent/src/build.test.ts` — new test
  `the money-back guarantee is confirmable, the performance guarantee is not`.
  Uncommitted. Verified to fail when the rule is removed.
- `/etc/nginx/sites-available/prime-ai-demo.conf` — routing. Read the comments
  before touching; they explain why both pages must stay on this host.
- The previous handoff (paused warm-palette redesign of `receptionist.html`,
  Tasks 3-6 never started) is in git history at the commit before this one. That
  work is still paused and was untouched this session.
- Plan file: none drove this session.
- Memory files touched: none.

## Running state
- Background processes: **PID 305506** —
  `python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage`.
  Kill with `kill 305506`. Not started this session; pre-existing and verified
  serving 200. **It is publicly reachable** — port 9876 open, plain HTTP, no TLS.
- Dev servers / ports: `http://127.0.0.1:9876/es.html`, also
  `http://srv1233720.hstgr.cloud:9876/`.
- Open worktrees / branches: `Landingpage` on **`warm-palette`**, 12 commits
  ahead of master, **unpushed**. `Voice_agent` on **`voice-agent-build`** with 3
  modified files uncommitted (`sales-agent.ts`, `build.test.ts`, `prompt.ts` —
  only the first two were touched this session).
- A Playwright MCP browser session is open at
  `http://127.0.0.1:9876/es.html?lang=en`.

## Verification — how to confirm things still work
- `cd /home/ubuntu/Prime_AI/Landingpage && node test-palette.js` — expect `OK`,
  exit 0.
- `node test-roi.js` — expect `OK — 64 combinations checked` and
  `OK — es.html sum: 16 combinations, agrees with sales-agent.ts`.
- `cd /home/ubuntu/Prime_AI-voiceagent/Voice_agent && bun test` — expect
  **140 pass, 0 fail**.
- `curl -sI https://prime-ai.es/ | grep -i location` — expect
  `https://prime-ai.es/es/`.
- `curl -s https://prime-ai.es/es/ | grep -c data-idioma` — expect `2`, proving
  the bilingual toggle is live.
- `curl -s https://prime-ai.es/es/ | grep -c 'id="cifra"'` — expect `0`, proving
  the sum and guarantee are **not** live.
- `curl -s -o /dev/null -w "%{http_code}" https://prime-ai.es/en/` — expect
  `200`; the clinic page was not touched.
- Rollback for the live Spanish page:
  `sudo install -o www-data -g www-data -m 644 /var/www/prime-ai-backups/es-index.html.bak-20260806-021026 /var/www/prime-ai/es/index.html`

## Deferred + open questions
- **Open: deploy order is a hard constraint.** Publish the agent *before* the
  page. Deploying `8e01166` alone creates a window where the page promises 30
  days money back and the agent still defers to Dan — the bait-and-switch the
  guarantee exists to remove.
- **Open: the FAQ states a banned pricing model.** The answer to
  `¿Cuánto cuesta?` opens `Depende de cuántas llamadas te entran`, which is word
  for word the example `sales-agent.ts:942` bans as a pricing model ("not a
  number, not a range, not a shape"). Pre-existing, inherited by the English
  translation. Copy change is Dan's call, so the guard deliberately does not
  fail on it.
- **Open: `Voice_agent` has mixed uncommitted work.** The guarantee edit sits in
  the same two files as pre-existing WIP, so nothing was committed there rather
  than sweeping someone else's work into a commit. Dan to separate.
- **Open: the qualification-gate risk.** `sales-agent.ts` calls a guarantee on a
  low-inbound business "a loaded gun: the machine has nothing to eat, so it
  cannot deliver and the client churns angry". Mitigated on-page by "this is not
  for you if you get two or three calls a week", and `test-palette.js` fails if
  that line is ever removed — but offering it is a business decision Dan has now
  confirmed twice.
- Deferred: `/voice/privacidad` is Spanish-only. The English consent link is
  labelled "(in Spanish)". The page lives in the Bun app, not this repo.
- Deferred: the English consent wording has no counterpart in `demo.ts`, so the
  two can drift. The Spanish is still copied verbatim from `demoPageHtml()`.
- Deferred: SEO — English exists only in attributes, so crawlers will not index
  it as English content. A real `/en-trades/` page is the fix if that traffic
  matters.
- Deferred: `receptionist.html` warm-palette Tasks 3-6, still paused from the
  prior session and untouched here.
- Deferred: `warm-palette` is unpushed and has now diverged further from what is
  deployed.

## Pick up here
Publish the voice agent with the guarantee rule, then deploy `es.html` to
`/var/www/prime-ai/es/index.html` — in that order — or resolve the
`¿Cuánto cuesta?` pricing-model wording first if Dan wants that fixed before
either goes out.
