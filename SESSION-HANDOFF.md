# Session Handoff — The Netherlands page built, and expressive mode turned on live

_Last updated: 2026-08-09_

## Where it started
Picked up from the previous handoff's "Pick up here": start the separate Netherlands
page from the Dutch copy stranded in `db07bb0`. Reading the code first shrank the job —
the previous handoff claimed the NL page needs "its own market figures", and it does not:
`es.html` asserts zero market statistics by design. Mid-session Dan changed subject and
asked whether the landing page agent had "the expressive thing" on. It did not; that
became the second piece of work, and the only one that reached production.

## Decisions locked + what shipped
- **`a84f7e7` (Landingpage, `warm-palette`) — the Netherlands page. NOT DEPLOYED.**
  `/home/ubuntu/Prime_AI/Landingpage/nl.html`, 2418 lines. `/es/` in Dutch for
  Rotterdam on prime-ai.nl. Built by baking `db07bb0`'s 96 `data-nl` attributes into the
  markup, then deleting the toggle apparatus entirely.
- **Dan's four answers that shaped it:** domain `prime-ai.nl` (register it); city
  **Rotterdam**; **Dutch-only, no language toggle**; controller is **a Dutch entity, details
  to follow**. The demo stays English by precedent — no Dutch Retell agent exists.
- **Single-language is structural, not cosmetic.** Gone: `traducir()`, the pills, the
  indexed `T` table, `localStorage`, `?lang`, every `data-*` attribute. `?lang=` now does
  nothing on that page; `?c=` still works. It also deletes a failure class — the `/es/`
  footer's two-layer check exists because an unstripped attribute lets the wrong language's
  mailto satisfy the right language's assertion, and there are no attributes here.
- **The previous handoff was wrong about market figures.** `#cifras` cards are labelled
  *"no es una estadística"* and the ROI calculator only multiplies numbers the visitor
  types. Rotterdam is the ONLY market claim changed, in three places that must agree.
- **One line deliberately not localised:** the biography reads *"aan de Spaanse kust"*.
  Dan rang businesses on the Costa del Sol, not Rotterdam; the literal Dutch
  (*"hier in de buurt"*) was true on `/es/` and would have implied fieldwork he never did.
- **`85ae78f` (Voice_agent, `voice-agent-v1`) — expressive mode, PUBLISHED AND LIVE.**
  `enable_expressive_mode: true` + `expressive_emotion_tags` added to `salesAgentPayload`.
  It lived only in `publish-lead.ts`'s `NATURAL` (the cartesia-Isabel intake agent);
  nothing imported it into `sales-agent.ts`.
- **Set in `salesAgentPayload`, not hand-listed in the update path** — `agentUpdatePayload`
  derives from it, so the field reaches existing agents. That exact drift bit twice before
  (`voice_temperature` 2026-08-06, `webhook_url` 2026-08-08).
- **Tags nailed shut to `empathetic/pause/emphasis`.** `happy`/`excited` cut: the page is
  built on underclaiming, and an agent sounding delighted while refusing to quote a number
  reads as a salesman. `voice_temperature` deliberately left at 0.5 — one knob at a time.
- **I corrected myself on the voices mid-session.** They are **`11labs-Willa`** (EN) and
  **`11labs-Santiago`, persona Alejandro, male** (ES). I had said `retell-Willa` and
  `cartesia-Isabel`, reading `publish.ts`'s constants — that file is the *clinic demo*
  publisher. This mattered: it voided the reassurance that the EN voice was safely a
  platform voice.
- **`test-nl-ready.js` is a second guard on purpose.** Folding the NL deploy blockers into
  `test-palette.js` would have made it red every run and taught everyone to ignore it.

## Key files for next session
- `/home/ubuntu/Prime_AI/Landingpage/nl.html` — the page. Its top comment block documents
  all three deploy blockers and the `db07bb0` provenance. Read before editing anything.
- `/home/ubuntu/Prime_AI/Landingpage/docs/nl-deploy.md` — the nginx block (written, NOT
  installed), deploy steps, verification, and the five blockers as a table.
- `/home/ubuntu/Prime_AI/Landingpage/test-nl-ready.js` — the deploy gate. **Exits 1 by
  design.** Verified it flips to 0 when all five clear.
- `/home/ubuntu/Prime_AI/Landingpage/test-palette.js` — now guards THREE pages.
  `MAIL_OK` still at the top (declaring it lower is a TDZ `ReferenceError`).
- `/home/ubuntu/Prime_AI/Voice_agent/src/sales-agent.ts` — `EXPRESSIVE_TAGS` ~line 1516,
  `salesAgentPayload` below it. The docblock records the unresolved platform-voice question.
- `/home/ubuntu/Prime_AI/Voice_agent/src/demo.ts` — line 56 `agent_override` ignores
  `voice_id`/`language`; line 939 any non-`es` maps to the English agent silently; line
  1164 `?lang` whitelist is en-or-es. All three block a third language.
- Plan file: none drove this session.
- Memory files touched: **none written.** Read `prime-voice-env-file.md` to locate
  `RETELL_API_KEY` in `/home/ubuntu/Prime_AI/outreach-engine/.env`.
- Reusable scratch: `readback.ts` in
  `/tmp/claude-1000/-home-ubuntu-Prime-AI-Landingpage/fc2d92ff-17d1-458e-bfb2-a87441aef35c/scratchpad/`
  — reads expressive fields off both live agents. Scratchpad is session-scoped; copy it
  into the repo if it is worth keeping.

## Running state
- Background processes: **PID 305506** —
  `python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage`,
  confirmed alive. Kill with `kill 305506`. Pre-existing, not started this session.
  **Publicly reachable — port 9876, plain HTTP, no TLS**, and it now serves `nl.html` too.
  No `run_in_background` shells were started this session.
- Dev servers / ports: `http://127.0.0.1:9876/nl.html`. PM2 `prime-voice` on `:3023/voice`.
- Open worktrees / branches: Landingpage on **`warm-palette`, 28 ahead of origin**;
  Voice_agent on **`voice-agent-v1`, 45 ahead of origin**. **Neither pushed.**
- A Playwright MCP browser is open at `http://127.0.0.1:9876/nl.html`, viewport 1280x900.
- **36 untracked screenshots in the Landingpage root** — pre-existing debris, deliberately
  excluded from `a84f7e7`. My two from this session were deleted.
- Untracked `outreach-engine/campaigns/*.csv` in the Voice_agent repo, excluded from
  `85ae78f`. Pre-existing.

## Verification — how to confirm things still work
- `node test-palette.js` — expect `OK` and **`43 tokens` en, `39 tokens` es, `39 tokens`
  nl**. A drop means the token regex silently ate one; that count is the only visible
  symptom of the whole failure class.
- `node test-roi.js` — expect `OK — 64 combinations checked`.
- `node test-nl-ready.js` — **expect exit 1 and 5 blockers. That is correct.** Exit 0
  before the Dutch entity exists means a check was weakened.
- `diff <(curl -s https://prime-ai.es/es/) <(git show 10d26a1:es.html)` — expect no output.
  `/es/` was NOT touched this session; `es.html` is still byte-identical to `10d26a1`.
- Expressive mode on the live agents — read back, never trust publish's output, which
  prints `updated` either way:
  `cd /home/ubuntu/Prime_AI/Voice_agent && bun --env-file=/home/ubuntu/Prime_AI/outreach-engine/.env run <scratchpad>/readback.ts`
  Expect `true` and `["empathetic","pause","emphasis"]` on
  `agent_365110c5e7174c245faa0aa30d` (EN) and `agent_d591526dbfd45aa59effa61f60` (ES).
- `cd /home/ubuntu/Prime_AI/Voice_agent && bun test src/build.test.ts` — expect
  **180 pass, 0 fail**. Full `bun test` shows **4 pre-existing failures in
  `publish-lead.test.ts`** (Grúas Francis prompt), unrelated; verified 4 before and 4 after
  this session's change.
- Republish both web agents: `bun --env-file=... run src/sales-agent.ts` (no flag = web,
  does BOTH EN and ES, by design there is no flag for one).
- **`grep` in these repos is a shell function wrapping ugrep with `-I`**, so it silently
  skips any file `file` calls binary, exiting 1 exactly like a real zero. Use
  `command grep` to bypass.
- **Put any check containing single quotes in a script file** — bash single-quoting ate
  two checks in the previous session.

## Deferred + open questions
- **Open, blocking `nl.html`: the Dutch entity's legal name and registered address.**
  Dan chose "a Dutch entity — I'll give you the details" and the details never arrived.
  Written nowhere; the footer carries a `TODO-BLOQUEANTE-NL` marker instead. On
  prime-ai.es NO page names the controller — it exists only at `/voice/privacidad`, behind
  that hostname — so copying the notice across leaves the Dutch page with no layer naming
  it at all.
- **Open: does expressive mode actually PERFORM, or is it stored-but-inert?** The read-back
  proves the config landed on both agents and settles that `11labs-` voices accept the
  field. It does not prove the synthesiser performs the tags; those two look identical over
  the API. Needs an ear on a recording — press the button on `/es/` and on `?lang=es`.
- **Open: push both repos?** 28 and 45 commits unpushed. Never asked for.
- **Open: the 36 untracked screenshots** — delete or `.gitignore`? Asked five times across
  sessions, still no answer.
- **Open, unchanged: the PHONE twin still speaks `oscarinfo@proton.me`**
  (`agent_fcbf6c22d64c0d7b4ab237eb35`). Harmless while `list-phone-numbers` returns `[]`.
  It was NOT republished this session (separate `--phone` run) but will now also pick up
  expressive mode whenever it is, along with its bans-scoped-to-pitch-state defect.
- Deferred: **the NL deploy itself** — 5 blockers, `docs/nl-deploy.md` has the nginx block
  unenabled. The one that breaks the product silently is the demo backend: `/voice/retell.js`
  and `POST /voice/token` are same-origin, and prime-ai.nl inherits none of prime-ai.es's
  proxy. `demo.ts` performs no Origin/Host validation (checked), so a proxy is sufficient.
- Deferred: **the Dutch voice agent** — a third *published* Retell agent, not a per-call
  override. When it exists, change `lang: 'en'` in `nl.html` plus `demo.ts:939` and `:1164`.
- Deferred: **native review of the 96 Dutch strings.** Blocker 5. They were live on `/es/`
  for ~31 minutes and no native speaker has read them; on `nl.html` they are the whole page.
- Deferred: **the 4 failing `publish-lead.test.ts` tests.** Pre-existing, untouched.

## Pick up here
Nothing is in flight and both repos are committed and clean. The most likely next action is
whichever Dan answers first: supply the Dutch entity's details to clear `nl.html`'s main
blocker, or listen to a recording to confirm expressive mode is performing rather than
merely stored.
