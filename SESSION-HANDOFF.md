# Session Handoff — A Dutch toggle on /es/, shipped and then reverted the same session

_Last updated: 2026-08-09_

## Where it started
Dan asked for a Netherlands language toggle on the landing page and possibly a Dutch voice
agent. Reading the code first changed the shape of the ask: `es.html` is one page carrying
two languages (Spanish in the markup, English in 96 `data-en` attributes swapped in place
by `traducir()`), and a third language means a third *published Retell agent*, not a config
flag. Dan chose page-toggle-only with the demo staying English — then, after it was live,
redirected: take Dutch off `/es/` entirely, because the Netherlands gets its own page on a
Dutch domain.

## Decisions locked + what shipped
- **`db07bb0` — the Dutch toggle, built, deployed, verified live.** 96 `data-nl`
  attributes, NL pill, `T.nl`, `traducir()` generalised from binary to `dataset[nuevo]`
  with a Spanish (never `undefined`) fallback, `nl-NL` currency, `?lang=nl`.
- **`10d26a1` — full revert, deployed.** Both files byte-identical to `e5a812c`, verified
  by `diff`, not by reading the patch. **Live `/es/` is `10d26a1`.** `/en/` untouched
  throughout, still `8754ec3`.
- **The Dutch copy is not lost.** All 96 strings survive in `git show db07bb0:es.html`.
  That was the reason for a revert commit over a file deletion.
- **The previous handoff was stale about live state.** It said `/es/` was `8754ec3`; it was
  actually `e5a812c` (deployed 2026-08-08, after that handoff was written). Caught by
  identifying the live file before overwriting it.
- **Guard work, all mutation-tested (10 cases, 10 caught), reverted with the rest.**
  Recorded here because the reasoning outlives the revert: the footer's two-layer check
  strips `data-en` to isolate the visible Spanish, so an unstripped `data-nl` lets the
  *Dutch* mailto satisfy the Spanish assertion — deleting the visible deletion-route link
  would have gone green.
- **A regression I caused and fixed inside `db07bb0`:** three pills grew the nav group
  85px->126px, squeezing the CTA at 320px to 48px wide with its text overflowing its own
  box. Fixed with mobile pill padding; removed again by the revert.
- **Memory written** — the Netherlands decision, since git history shows the revert but not
  the plan behind it.

## Key files for next session
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — `/es/`. Currently identical to `e5a812c`.
  The `.pie` footer and `<dialog class="panel">` comments carry reasoning not
  reconstructable from the code.
- `/home/ubuntu/Prime_AI/Landingpage/test-palette.js` — one guard for both pages. `MAIL_OK`
  at the top (declaring it lower is a TDZ `ReferenceError`).
- `/home/ubuntu/Prime_AI/Voice_agent/src/demo.ts` — line 56: `agent_override` accepts
  `voice_id`/`language` and **ignores** them, which is why a third language is a third
  agent. Line 939: any `lang` that is not `'es'` maps to the English agent, so an unknown
  language misroutes silently rather than erroring. Line 1164: `?lang` whitelist is
  en-or-es, so lead shortlinks cannot carry a third language.
- Plan file: none drove this session.
- Memory files touched:
  `/home/ubuntu/.claude/projects/-home-ubuntu-Prime-AI-Landingpage/memory/netherlands-gets-its-own-page.md`
  (new), and its index line in `MEMORY.md`.

## Running state
- Background processes: **PID 305506** —
  `python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage`,
  confirmed alive. Kill with `kill 305506`. Pre-existing, not started this session.
  **Publicly reachable — port 9876, plain HTTP, no TLS.** No `run_in_background` shells
  were started this session.
- Dev servers / ports: `http://127.0.0.1:9876/es.html`. PM2 `prime-voice` on `:3023/voice`.
- Open worktrees / branches: `Landingpage` on **`warm-palette`**, **26 commits ahead of
  `origin/warm-palette`**, never pushed.
- A Playwright MCP browser is open at `https://prime-ai.es/es/?lang=es`.
- **36 untracked screenshots in the repo root** — pre-existing debris, Dan asked about it
  three times with no answer. My three from this session were deleted.
- Deploy backups from today: `/var/www/prime-ai-backups/es-index.html.bak-20260809-145845`
  (verified `== e5a812c`) and `es-index.html.bak-20260809-152910` (verified `== db07bb0`,
  the Dutch version).

## Verification — how to confirm things still work
- `node test-palette.js` — expect `OK`, exit 0, and
  **`43 tokens` for en, `39 tokens` for es**. A drop means the token regex silently ate
  one; that count is the only visible symptom of the whole failure class.
- `node test-roi.js` — expect `OK — 64 combinations checked` and
  `OK — es.html sum: 16 combinations, agrees with sales-agent.ts`.
- `diff <(curl -s https://prime-ai.es/es/) <(git show 10d26a1:es.html)` — expect no output.
  Confirms live matches the repo with no cache in the way.
- `curl -s https://prime-ai.es/es/ | grep -c 'data-nl'` -> `0`; same for
  `data-idioma="nl"` -> `0`.
- `curl -s https://prime-ai.es/es/ | grep -o 'cal.eu/prime.ai/intro-wa' | wc -l` -> `3`;
  `grep -o 'mailto:support@prime-ai.es' | wc -l` -> `2`. **These are the two-language
  values.** They read 4 and 3 while Dutch was live — a third language adds exactly one
  payload each, which is correct, not a regression. Must be `grep -o | wc -l`, never
  `grep -c`: two of the three intro-wa occurrences share a line.
- `curl -s https://prime-ai.es/es/ | grep -c 'linkedin.com/in/danielkooij'` -> `1`. **That
  URL is still UNVERIFIED** (LinkedIn answers HTTP 999 without a browser session).
  Regression test is clicking the ES/EN toggle and confirming icon and href survive.
- Comment-stripped on live `/es/`: `Daniel Kooij` -> `0`, `Fuengirola` -> `0`,
  `oscarinfo@proton.me` -> `0`, `%` in visible body -> `0`.
- Rollback `/es/` one step:
  `sudo install -o www-data -g www-data -m 644 /var/www/prime-ai-backups/es-index.html.bak-20260809-145845 /var/www/prime-ai/es/index.html`
- **Verify any backup by diffing it against git before trusting its filename.** Both of
  today's were verified before use.
- **`grep` in this repo is a shell function wrapping ugrep with `-I`**, so it silently
  skips any file `file` calls binary, exiting 1 exactly like a real zero. Use
  `command grep` to bypass.
- **Bash single-quoting ate two of my checks this session** — a `grep` pattern and a
  `node -e` script both containing `'nl'` closed the shell string early and reported false
  negatives. Put any check containing single quotes in a script file.

## Deferred + open questions
- Deferred: **the Dutch voice agent.** Never built. It is a third published Retell agent —
  Dutch voice, `nl-NL`, translated `GREETING`/prompt — not a per-call override.
- Deferred: **the Netherlands landing page** on a Dutch domain. Needs its own market
  figures, its own privacy route under whoever the Dutch controller is, and its own domain.
  Start from `git show db07bb0:es.html` rather than a blank file.
- Deferred: **lead shortlinks cannot carry a third language** (`demo.ts:1164` whitelists
  `?lang` as en-or-es). Only matters once a third language exists somewhere.
- Open: **the Dutch translation has had no native-speaker review.** It was live for ~31
  minutes unreviewed. Irrelevant to `/es/` now, load-bearing the moment the NL page reuses
  it.
- Open: **the 36 untracked screenshots** — delete or `.gitignore`? Asked four times now, no
  answer.
- Open, unchanged from last session: **the PHONE twin still speaks `oscarinfo@proton.me`**
  (`agent_fcbf6c22d64c0d7b4ab237eb35`). Harmless today because `list-phone-numbers` returns
  `[]`. Republishing is not a no-op — that agent still has the bans-scoped-to-pitch-state
  defect.

## Pick up here
Nothing is in flight — `/es/` is live and clean at `10d26a1`, and the branch is 26 commits
unpushed. The most likely next action is starting the separate Netherlands page, pulling
the Dutch copy out of `git show db07bb0:es.html`.
