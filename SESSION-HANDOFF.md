# Session Handoff — Deployed the guarantee agent + page, then replaced the logo with a wordmark

_Last updated: 2026-08-06_

## Where it started
Picked up the previous handoff's "Pick up here": publish the voice agent with the
money-back guarantee rule, then deploy `es.html` — in that order, so the page
never promises 30 days money back while the agent still defers to Dan.
Mid-session the user asked for logo suggestions ("looks very bad"), then asked a
strategy question about per-niche landing pages. The governing constraint
throughout: a visitor presses "Talk to the AI" and reaches `sales-agent.ts` ~30
seconds later, so the page may not claim what the call must refuse to repeat.

## Decisions locked + what shipped
- **FAQ pricing wording fixed BEFORE either deploy** — `71f996d`. `¿Cuánto cuesta?`
  opened "Depende de cuántas llamadas te entran", verbatim the example
  `sales-agent.ts:942` bans as a pricing MODEL. Survivable while the ban lived in
  the pitch state; publishing promoted it always-on, so the agent would be
  hard-forbidden from repeating the page. Both languages now say "depende de lo
  que necesites" — the one answer the agent may give.
- **The guard's `⚠ KNOWN GAP` is closed, not narrowed** —
  `/home/ubuntu/Prime_AI/Landingpage/test-palette.js`. The old rule required a
  price word in the same sentence; the sentence that shipped the violation had
  none, so it would have stayed green through the whole failure it was named
  after. Both shapes now banned outright. Verified to fail on the old wording.
- **Deployed in the locked order** — Retell PATCH (`agent_365110c5…`, in place,
  same `agent_id`) → `pm2 restart prime-voice` → `es.html`. All ten prompt probes
  verified at the Retell API, not assumed.
- **Voice_agent work committed** — `772d0ba` in `/home/ubuntu/Prime_AI-voiceagent`.
  The prior handoff recorded `prompt.ts` as unrelated pre-existing WIP; that was
  wrong — same-day, cites `call_cdbb713e`, and `build.test.ts` spans both it and
  the guarantee, so no split by file was possible.
- **Logo: ring-and-dot deleted, wordmark only** — `ca2277c`. Five treatments
  rendered in the real nav at real size; user picked B. `AI` steps back by weight
  500 vs 700 (not colour), `letter-spacing: -0.02em` added to match `h1/h2/h3`,
  favicon now a `P` on ink. `--logo-cyan` deleted from both pages — it was the one
  colour explicitly exempted from the palette guard, so removing it made the guard
  stricter for free (tokens 44→43, 39→38).
- **The repo was BEHIND production on both pages** — `434f569`, `27b04ec`.
  Deploying either file as it stood would have been a revert: `receptionist.html`
  had **zero** of the two `cal.eu/prime.ai/intro-wa` booking anchors live `/en/`
  carries, and `sales-agent.ts:880` tells the agent to close on "the button on the
  page". Three hand-edits existed only on `/var/www` and had never reached git.
- **The Spanish dialog anchor was fixed, not copied** — the deployed markup puts
  `data-en` on the inner `<a>` and leaves `.panel-chica` bare, which fails the
  repo's own guard. `traducir()` walks `[data-en]` and replaces `innerHTML`, so
  swapping the `<p>` detaches that `<a>`; it worked only by accident of document
  order. Deploying fixed what was live.
- **Deploy gate replaced, not loosened** — line-counting flagged 2+2 false losses
  (my own rewritten comment, an orphaned `}`). Replaced with a semantic gate:
  every link and visible text run in live must exist in the repo. Returned 0/0 on
  both pages.
- **Per-niche landing pages: answered, nothing built.** `build.test.ts:1154`
  (`── THE ONE PAGE ──`) records nine per-trade variants killed 2026-08-04 because
  art. 50 disclosure and recording consent render per-page — a variant dropping
  one "was not a cosmetic regression, it was an unlawful page."

## Key files for next session
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — the deliverable. Read its header
  comment block first.
- `/home/ubuntu/Prime_AI/Landingpage/receptionist.html` — `/en/`. Now carries both
  booking anchors and the same wordmark.
- `/home/ubuntu/Prime_AI/Landingpage/test-palette.js` — one guard for both pages;
  the pricing-model gap is now closed.
- `/home/ubuntu/Prime_AI-voiceagent/Voice_agent/src/sales-agent.ts` —
  `general_prompt` holds the always-on bans, the guarantee and the ordering rule.
  Also the publish CLI (`import.meta.main`).
- `/home/ubuntu/Prime_AI-voiceagent/Voice_agent/src/build.test.ts` — line 1154
  `── THE ONE PAGE ──` is the record of why per-niche pages were killed.
- `/home/ubuntu/Prime_AI-voiceagent/SESSION-HANDOFF.md` — a **concurrent**
  session's handoff (`34c1828`, 03:38). Read it before touching Voice_agent.
- Plan file: none drove this session.
- Memory files touched: none. Vault daily note updated at
  `/home/ubuntu/TheVault/DailyNotes/2026-08-06.md`.

## Running state
- Background processes: **PID 305506** —
  `python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage`.
  Kill with `kill 305506`. Pre-existing, not started this session.
  **It is publicly reachable** — port 9876 open, plain HTTP, no TLS.
- Dev servers / ports: `http://127.0.0.1:9876/es.html`, also
  `http://srv1233720.hstgr.cloud:9876/`. PM2 `prime-voice` online on `:3023/voice`.
- Open worktrees / branches: `Landingpage` on **`warm-palette`**, 30 commits ahead
  of master, **unpushed**. `Prime_AI-voiceagent` on **`voice-agent-build`**, clean
  tree.
- A Playwright MCP browser session is open at `https://prime-ai.es/es/`.
- **A concurrent Claude session was active in `Prime_AI-voiceagent` and on
  `/var/www` this session** (commits `e4e6515`, `c4b3660`, `34c1828`). It has since
  committed. Re-check live files before any deploy.

## Verification — how to confirm things still work
- `cd /home/ubuntu/Prime_AI/Landingpage && node test-palette.js` — expect `OK`,
  exit 0.
- `node test-roi.js` — expect `OK — 64 combinations checked` and
  `OK — es.html sum: 16 combinations, agrees with sales-agent.ts`.
- `cd /home/ubuntu/Prime_AI-voiceagent/Voice_agent && bun test` — expect
  **140 pass, 0 fail**.
- `curl -s https://prime-ai.es/es/ | grep -c 'cal.eu/prime.ai/intro-wa'` — expect
  `2`. Same on `/en/`.
- `curl -s https://prime-ai.es/es/ | grep -c '%3EP%3C'` — expect `1` (favicon
  "P"). Same on `/en/`.
- `curl -s https://prime-ai.es/es/ | grep -c 'Depende de cu'` — expect `0` (banned
  pricing model gone).
- `curl -sI https://prime-ai.es/ | grep -i location` — expect
  `https://prime-ai.es/es/`.
- Retell guarantee still published: GET
  `/get-agent/agent_365110c5e7174c245faa0aa30d` → `response_engine.llm_id` → GET
  `/get-retell-llm/{id}`, expect `general_prompt` to contain
  `The ONE guarantee you may confirm is the money-back one`.
- Rollback:
  `sudo install -o www-data -g www-data -m 644 /var/www/prime-ai-backups/es-index.html.bak-20260806-032801 /var/www/prime-ai/es/index.html`
  (and `en-index.html.bak-20260806-032801` → `/var/www/prime-ai/en/index.html`).

## Deferred + open questions
- **Open: the meta description still says "fontaneros, reformas" / "plumbers,
  builders and trades".** This is the only place the page narrows to a niche —
  visible body copy has zero trade words. User raised it, I offered the fix, no
  answer given. 3 strings in `es.html`: the initial `<meta name="description">`
  plus the two `descripcion:` values the language toggle swaps.
- **Open: `warm-palette` is unpushed**, 30 commits ahead of master, and now
  further diverged.
- Deferred: `receptionist.html` warm-palette Tasks 3-6, paused from an earlier
  session, untouched again.
- Deferred: the phone twin (`PHONE — Prime AI Receptionist Demo`) was not
  republished and still has the bans scoped to the pitch state.
  `list-phone-numbers` is empty — attached to nothing, unreachable.
- Deferred: SEO — English exists only in `data-en` attributes, so crawlers will
  not index it as English. A real `/en-trades/` page is the fix if that traffic
  matters.
- Deferred: `/voice/privacidad` is Spanish-only; the English consent link is
  labelled "(in Spanish)". Lives in the Bun app, not this repo.
- Deferred: per-niche landing pages — answered as "not yet, and generate from one
  source if ever". Nothing built.

## Pick up here
Broaden the three meta-description strings in
`/home/ubuntu/Prime_AI/Landingpage/es.html` so the page stops narrowing to
plumbers in search results, then redeploy `/es/` — re-diffing against the live
file first, because a concurrent session has been hand-editing `/var/www`.
