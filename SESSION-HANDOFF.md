# Session Handoff — the landing page's phone number was dead, and buying a new one exposed what the screen cannot prove

_Last updated: 2026-08-23_

## Where it started

Dan wanted to buy a new Zadarma DID for the landing page and asked to be "100% sure" it
could connect to a real phone before paying. Investigating that turned up the real problem:
the number already on `/es/`, `+34 951 870 630`, had never worked — Zadarma left it in
`status: checking` since purchase on 21-08. Dan confirmed by dialling it. The session became:
prove the failure, get the dead number off a live public page, build the pre-purchase screen,
buy a replacement, and be honest about the residual that no check can close.

## Decisions locked + what shipped

- **`+34 951 870 630` is dead, evidenced not assumed** — Zadarma `status: checking` while the
  other three DIDs are `on`; its entire call log is one entry (`disposition: undefined`, 4
  billseconds) against `answered` with normal durations on working lines. `wrongs 0` returns
  `[]`, so no document was rejected.
- **The number is off the live page** — `/home/ubuntu/Prime_AI/Landingpage/es.html`, one
  `LÍNEA MUERTA` block at the end of the stylesheet, commit `954aed8`. Wins by source order,
  not specificity; moving it up the file disables it silently. No HTML changed, every `tel:`
  href intact, revert is one deletion. Deployed by `cp` to `/var/www/prime-ai/es/index.html`
  and verified on `https://prime-ai.es/`. **Not pushed to GitHub.**
- **`zadarma.ts screen <direction-id>` added** — `/home/ubuntu/Prime_AI/Voice_agent/src/zadarma.ts`,
  commit `37e6026`. Probes every buyable DID against Retell's global registry
  (`import-phone-number` does no ownership check, so it answers pre-purchase), deletes the
  probe in a `finally`, shouts a copy-pasteable curl if the delete fails. `cnmc()` maps the
  block; `pick()` rejects candidates one digit from a DID in service.
- **Bought `+34 951 870 604`** (id `845059`), screened clean, CNMC `951#87` VOICE CLOUD
  wholesale. **Charged €10.20 — three months upfront, not €3.40.** Balance now €9.40.
  Currently `status: checking`. Not routed, not imported to Retell, not on the page.
- **Zadarma ticket drafted, NOT sent** — `/home/ubuntu/Prime_AI/docs/2026-08-23-zadarma-ticket-630.md`,
  commit `4032878`. Must go from Dan's account.
- **Durable activation watcher** — `/home/ubuntu/Prime_AI/Voice_agent/watch-did.sh`, commit
  `f3b10a5`, cron every 10 min, Discord once per number, sentinel in
  `/var/tmp/zadarma-did-watch/`. **It was never armed**, fixed 2026-08-23 15:22 in commit
  `c673f57`: the script called `bun`, cron's PATH has no `~/.bun/bin`, so every run exited
  127 and `|| exit 0` turned that into silence. "Alarm proven end-to-end against `…551`"
  was true only of a by-hand run in an interactive shell — a different PATH, therefore a
  different program than the one cron executes. Now an absolute `$BUN` with an `-x` guard
  that exits 1 loudly, and the cron line appends to `/var/tmp/zadarma-did-watch/cron.log`
  instead of `/dev/null`. Re-proven under the captured cron environment.
- **Two corrections made mid-session, both the agent's own.** (1) A real mobile number was
  committed into `es.html` and deployed live ~14:44–14:50; redacted, commit amended before
  any push. (2) That number, `+34 673 708 089`, is Dan's **own test phone**, not a member of
  the public — it appears across `Prime_AI/docs/handoffs/`. The claim "a real visitor rang and
  got nothing" was wrong and had reached the commit message, the page comment, memory, and the
  Zadarma ticket. All four corrected.

## Key files for next session

- `/home/ubuntu/Prime_AI/Voice_agent/src/zadarma.ts` — the CLI driving everything; read the
  `screen`, `order` and `wrongs` doc comments before touching a DID.
- `/home/ubuntu/Prime_AI/docs/2026-08-23-zadarma-ticket-630.md` — unsent ticket, plus "notes
  for me" covering the 21-11 autorenew trap on `…630`.
- `/home/ubuntu/Prime_AI/Voice_agent/watch-did.sh` — how activation gets noticed.
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — the `LÍNEA MUERTA` block, near line 1611.
- Plan file: none.
- Memory files touched:
  `/home/ubuntu/.claude/projects/-home-ubuntu-Prime-AI-Landingpage/memory/landing-page-public-number.md`
  (rewritten — `…630` marked dead, the Retell screen demoted from sufficient to
  necessary-only, the test-phone misread recorded).

## Running state

- Background processes: Monitor task `bdtdenu4a` was **still running** (not expired) and,
  because cron was dead, was the only thing actually watching. Stopped 2026-08-23 15:21.
  Cron `*/10 * * * * /home/ubuntu/Prime_AI/Voice_agent/watch-did.sh
  >>/var/tmp/zadarma-did-watch/cron.log 2>&1` is now the sole watcher and is verified working;
  remove with `crontab -l | grep -v watch-did | crontab -`.
- Dev servers / ports: none. The `python3 -m http.server 8899` preview was stopped; port
  confirmed not listening.
- Open worktrees / branches: `warm-palette` in `/home/ubuntu/Prime_AI/Landingpage`,
  **2 commits ahead of `origin/warm-palette`, unpushed**. `master` in `/home/ubuntu/Prime_AI`.

## Verification — how to confirm things still work

- `cd /home/ubuntu/Prime_AI/Voice_agent && bun --env-file=/home/ubuntu/Prime_AI/outreach-engine/.env run src/zadarma.ts numbers`
  — `…604` and `…630` show `checking`; `…451`, `…551`, `…128` show `on`.
- `curl -s https://prime-ai.es/ | grep -c "951 870 630"` — expect **`5`**, not 0. The fix
  is CSS-only and deliberately leaves the HTML alone, so the digits stay in the source and
  are hidden by `display:none`. An earlier version of this line said "expect 0", which
  would read as a regression every time. What actually proves it: the `LÍNEA MUERTA` block
  exists **and** no later rule re-shows `.tel-movil` / `.tel-escritorio` —
  `L=$(curl -s https://prime-ai.es/ | grep -n "LÍNEA MUERTA" | cut -d: -f1)` then check
  nothing after line `$L` sets those classes back to a visible display.
- `curl -s https://prime-ai.es/ | grep -c "LÍNEA MUERTA"` — expect `1`.
- `cd /home/ubuntu/Prime_AI/Voice_agent && bun test src/zadarma.test.ts` — 9 pass.
- Alarm test — **must run under cron's environment, not your shell**, or it proves nothing
  (that is precisely how the dead watcher passed):
  `env -i HOME=/home/ubuntu PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/games:/usr/local/games:/snap/bin SHELL=/bin/sh DID_WATCH=34951870551 /home/ubuntu/Prime_AI/Voice_agent/watch-did.sh && ls /var/tmp/zadarma-did-watch/`
  — fires a real Discord ping and writes `34951870551.done`; delete that sentinel afterwards.
- `cat /var/tmp/zadarma-did-watch/cron.log` — expect empty. Any line in it is a real fault.

## Deferred + open questions

- Deferred: routing `…604` to Retell and importing it — blocked until Zadarma reports
  `status: on`. Order sequence is route → import/bind → **ring from a mobile** → watch
  `zadarma.ts log` for strays → only then onto the page.
- Deferred: `…630` autorenew is still `true` and it renews 2026-11-21. If Zadarma cannot fix
  it, run `zadarma.ts autorenew 34951870630 off` before that date.
- Open: **is `…604` previously used? Unknown and unprovable pre-activation.** The Retell probe
  excludes the `…128` failure; CNMC only speaks to the block. Web search was disproven as a
  method — the control `…128`, which provably has a prior owner, returns "no results".
  Detection is post-activation: watch the call log for inbound calls neither Dan nor the agent
  placed.
- Open: the Zadarma ticket needs Dan to send it.
- Open: whether to push `warm-palette` to GitHub.

## Pick up here

Wait for the Discord ping saying `…604` left `checking`, then run route → Retell import → ring
test; if no ping has arrived and `…630` is also still stuck, the Zadarma ticket is the
unblocker and it is still unsent.
