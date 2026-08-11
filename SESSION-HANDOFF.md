# Session Handoff — the demo agent stopped giving up, and the page learned to count

_Last updated: 2026-08-11_

## Where it started
Picked up from the previous handoff with both its candidate actions blocked on Dan.
He changed subject twice instead: first to make the landing-page agent never give up
selling, then — after asking how many visits the page had today — to discover it had
no analytics at all. Both shipped and are live; the NL page and the Dutch entity were
never touched.

## Decisions locked + what shipped
- **`11ce7e0` (Voice_agent) — the web demo never runs out of goes. PUBLISHED AND LIVE.**
  The two-go budget is replaced by a size ladder that never terminates: full reframe
  after the first no, short one after the second, **LIGHT TOUCH** (one sentence, door
  on the latch, asks nothing) from the third onwards, forever.
- **Deleting the budget was the obvious move and the wrong one.** Unlimited goes at
  *full* size is an agent that repeats itself until the visitor leaves — same lost
  booking, slower route. The no-count survives and now SIZES the go instead of ending
  it, plus "never the same reframe twice".
- **`end_call` on web: four cases → three.** A no is no longer one at any count;
  neither is being told to stop (drops to light touch, stays on the line). Still ends
  on sustained abuse, a done booking, and the clock.
- **PHONE IS DELIBERATELY UNTOUCHED and proven so** — byte-identical before/after, EN
  and ES, across general prompt, states, tools, greeting. Web's visitor pressed a
  button and is capped at 8 min; phone is an unsolicited call that will not take no,
  which the prompt already argues against and which is regulated. **If these are ever
  recollapsed, collapse onto the PHONE rule.**
- **`PITCH_STATE` -> `pitchState(mode)`** — six ternaries in reading order, not two
  copies that drift. Expression body so 240 array lines keep their indentation.
  **These arrays are `join('\n')`ed, so wrap position IS content** — the first attempt
  moved phone by 2 bytes purely from rewrapping. Tool descriptions use `join(' ')` and
  were immune.
- **`4170d60` + `b8b1388` (Landingpage) — Umami analytics. LIVE.** Self-hosted, on the
  Postgres already here. Plausible rejected: needs ClickHouse for a page seeing ~4
  visits/day.
- **Tracker proxied through prime-ai.es** (`/s/t.js`, `/s/api/send` -> `127.0.0.1:3025`),
  not the analytics hostname — a script from a host containing "analytics" is blocked
  by every filter list. **Two explicit `location` blocks, never a `/s/` prefix** (a
  prefix would put Umami's dashboard on prime-ai.es). `X-Forwarded-For` is
  load-bearing: without it every visitor is this server.
- **Default `admin`/`umami` rotated and proven dead** (old -> 401, new -> 200). Someone
  was already on that login page while I worked.
- **`0b0ee34` (Voice_agent) — privacy notice discloses the counter.** Cookieless, no IP
  stored, so no consent banner; a test pins all four claims because that is WHY there
  is no banner.
- **`b8b1388` — five `data-umami-event` attributes**, named by position
  (nav/portada/movil/cierre) so the split shows how far down the page people get.
  `demo-boton-hablar` counts the **press, not a connected call**; the real count is
  `POST /voice/token` in nginx's log, and the gap is the drop-off.
- **Yesterday's log-based visit count: 1377 -> really about 4.** The rest was Footfay
  (shares `/es/` paths), Googlebot, Bingbot, ChatGPT-User, a scanner rotating three
  UAs in one second, and a local monitor curling every 5 min.
- **Both branches pushed** (`dde454b..b8b1388`, `a95a04e..0b0ee34`), clean
  fast-forwards, verified 0-ahead/0-behind by re-fetch.

## Key files for next session
- `/home/ubuntu/Prime_AI/Landingpage/docs/analytics.md` — the whole Umami setup,
  credentials location, the bot-filter trap, deploy steps. **Read before touching
  analytics.**
- `/home/ubuntu/Prime_AI/Voice_agent/src/sales-agent.ts` — `pitchState(mode)` ~line
  840; its docblock records why the channels differ and which way to collapse them.
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — the 5 tracking attributes and the
  analytics `<script defer>` in `<head>`.
- `/home/ubuntu/Prime_AI/Voice_agent/src/demo.ts` — `privacyPageHtml()` ~line 866.
- `/etc/umami/umami.env` (root, 600) — admin password + website ID.
  `/etc/nginx/sites-available/umami.conf`, and the `/s/` blocks inside
  `/etc/nginx/sites-enabled/prime-ai-demo.conf`.
- `/var/www/prime-ai/es/index.html` — **the live page, deployed from a COPY, not from
  this repo.** Backups `index.html.bak-*` alongside.
- Plan file: none drove this session.
- Memory files touched: **none written.**

## Running state
- Background processes: **PID 305506** —
  `python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage`,
  confirmed alive. Kill with `kill 305506`. Pre-existing, publicly reachable, plain
  HTTP. **No `run_in_background` shells were started this session.**
- Docker: container **`umami`**, up 8h, `--restart unless-stopped`, listening
  `127.0.0.1:3025`. Logs: `sudo docker logs umami`.
- Dev servers / ports: dashboard https://analytics.srv1233720.hstgr.cloud ;
  PM2 `prime-voice` on `:3023/voice` — **restarted this session** (count 12->13).
- Open worktrees / branches: Landingpage `warm-palette`, Voice_agent `voice-agent-v1`
  — **both pushed, 0 ahead, 0 behind.**
- A Playwright MCP browser is open at `https://prime-ai.es/es/`, viewport 1280x900.
- 36 untracked screenshots in the Landingpage root; untracked
  `outreach-engine/campaigns/*.csv` in Voice_agent. Both pre-existing.

## Verification — how to confirm things still work
- `node test-palette.js` — expect `OK` and **43/39/39 tokens** en/es/nl.
- `node test-roi.js` — expect **two** OK blocks; line 1 is `OK — 64 combinations
  checked`. **Do not truncate with `tail`** — that hides the first block and reads as
  a different program.
- `node test-nl-ready.js` — **expect exit 1, 5 blockers.** Check `$?` before any pipe;
  `| tail` reports tail's status, not the script's.
- `cd /home/ubuntu/Prime_AI/Voice_agent && bun test` — expect **233 pass, 0 fail**. The
  4 `publish-lead.test.ts` failures the last handoff called pre-existing are **gone**,
  fixed by a commit that landed after `85ae78f`.
- `curl -s https://prime-ai.es/es/ | grep -c '<script defer src="/s/t.js"'` — expect
  **1**. Matching the bare path returns 2 (the Spanish comment names it too).
- `sudo -u postgres psql -d umami -tAc 'select count(*) from website_event'` — the only
  real proof an event landed.
- **Umami drops bot UAs while still returning HTTP 200.** A headless browser fires the
  beacon, gets 200, and leaves no row. **You cannot verify this with Playwright** — use
  curl with a normal Chrome UA, or prove wiring in the browser and storage with curl
  separately.
- Read expressive/prompt state off the LIVE agents, never trust publish's output:
  scratch script `readback-nogiveup.ts` in
  `/tmp/claude-1000/-home-ubuntu-Prime-AI-Landingpage/a6a8bc62-87e0-4432-a0f8-6f02de6edb60/scratchpad/`
  — checks all three agents. Scratchpad is session-scoped; copy it into the repo if it
  is worth keeping.
- **`grep` here is a shell function wrapping ugrep with `-I`**; use `command grep`.
  Note `sudo command grep` FAILS — `command` is a shell builtin sudo cannot exec.

## Deferred + open questions
- **Open: does expressive mode actually PERFORM, or is it stored-but-inert?** Unchanged
  from last session; still needs an ear on a recording. The same call would also
  exercise the new never-give-up behaviour.
- **Open, blocking `nl.html`: the Dutch entity's legal name and registered address.**
  Untouched this session; still 5 blockers, `test-nl-ready.js` still exits 1.
- **Open: should the phone agent also stop giving up?** Asked, never answered. It still
  stops at three nos.
- **Open: the 36 untracked screenshots** — delete or `.gitignore`? Asked six times
  across sessions.
- Deferred: **`nl.html` has no tracking tag** — not deployed, and would need its own
  Umami website entry (different domain) rather than reusing this website ID.
- Deferred: **`$host` in nginx's log format.** Still worth doing — it would make every
  vhost separable in the shared `access.log` — but analytics supersedes it for this page.
- Deferred: **`/es/?lang=en` is not a separate page to Umami** — both languages land in
  one bucket. Splitting needs a second website entry or a custom event.
- Deferred: the PHONE twin still speaks `oscarinfo@proton.me`
  (`agent_fcbf6c22d64c0d7b4ab237eb35`); it will also pick up expressive mode whenever it
  is next republished.
- Note: **other sessions are actively committing to both repos.** 7 of the 9
  Voice_agent commits pushed were not from this session.

## Pick up here
Nothing is in flight; both repos are clean, committed and pushed. The highest-value
next action is to press the demo button on https://prime-ai.es/es/ and listen — one
call settles both the expressive-mode question and whether the never-give-up ladder
sounds persistent rather than pushy. Failing that, check the Umami dashboard, which
will have roughly a day of real data by now.
