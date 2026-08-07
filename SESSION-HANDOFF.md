# Session Handoff — Deployed the hero three times before measuring the right thing, then took Dan's name off the call panel

_Last updated: 2026-08-07_

## Where it started
Picked up the previous handoff's "Pick up here": deploy `fac442e` (hero warmth + the
two-card stats band) to `/es/`. That was twenty minutes. The rest of the session came out
of Dan looking at the result and saying "looks exactly the same" — twice — which was
correct both times and was not a caching problem. Governing constraint unchanged:
pressing the button reaches the agent in ~30 seconds, so the page may not claim what the
call must refuse to repeat.

## Decisions locked + what shipped

Six commits. **Three deployed (`fac442e`, `44a0187`, `951aded`); `943fb53` is committed
and NOT deployed.**

- **`fac442e` deployed, then `44a0187`, then `951aded`.** Each one: diff live against the
  previously deployed commit to rule out a hand-edit, backup, install, then verify the
  served bytes are byte-identical to the commit. Backups written this session:
  `-20260807-040307` = `f8783a5`, `-20260807-042235` = `fac442e`,
  `-20260807-043924` = `44a0187`.
- **The previous handoff's rollback line was wrong — `8a76af7`.** It named
  `es-index.html.bak-20260806-073111` as the way back to `f8783a5`; diffed against git
  that file is **`0256e4a`**, so running it would have silently dropped the proof section
  along with the hero. Every backup is now identified by diffing against git, never by
  reading its timestamp.
- **Hero attempt 2 — `44a0187`, deployed.** Inverted the halo: the first version put
  `--clay` (the deepest token) in the *centre*, behind the headline, and left the edges
  light. New token `--terra` (`#D0BDAB`), the only one below clay, because
  paper/shell/sand/clay all sit inside ten points of lightness. Ending the vignette on
  clay also works and needs no new token but reaches 60 levels instead of 90.
- **Hero attempt 3 — `951aded`, deployed. This is the one that worked.** An ink call-card
  on screen one: status dot, 28-bar waveform, caption. Not a tint.
  - **The number that explains three rounds of confusion:** dark-pixel coverage in screen
    one was **4.7% before any of this work and still exactly 4.7% after BOTH washes.**
    They only re-tinted near-white; they added no visual mass at all. With the card it is
    9.9%, and mean L* went 94.3 → 87.0.
  - **The ceiling was structural, not a tuning problem.** Any ground dark enough to
    register sits under the text — the one light variant that cleared the perceptual bar
    (ΔL* −11.8) failed all three text checks. An object carries its own ground:
    `--paper`/`--ink` and `--text-on-ink`/`--ink` are already `PAIRS` entries, so the card
    adds no unguarded contrast surface. Rendered live: 15.75:1 and 7.45:1.
  - **The card quotes nothing the agent says.** That would be the page asserting what the
    call must repeat, and `ES_AGENT_ID` is the open unverified item. "Contestado — de día,
    de noche o en domingo" is already live verbatim in `#cifras`: new claim surface zero.
  - Waveform keyframes **rest at `scaleY(1)` and dip at 50%**, not the reverse. The global
    reduced-motion block forces `animation-iteration-count: 1`, which freezes an element
    on its 100% frame; resting at full height makes the frozen frame a correct static
    waveform instead of 28 slivers. Verified under emulated reduced motion.
  - Mobile: **trimming padding-TOP is what moved the card.** Adding padding-bottom was
    tried first and did nothing — with the card in place `.alto`'s height comes from its
    content (794) rather than `min-height` (675), so bottom padding only extends the
    section downward. The card was 27px under the 80px sticky CTA bar; now 13px clear.
- **Dan's name out of the call panel — `943fb53`, COMMITTED, NOT DEPLOYED.** Dan: "this is
  a conversational AI, the call is being recorded, that's it." The identity is demoted to
  the second layer, not deleted: `/voice/privacidad` carries the name, address and email,
  checked against the live page rather than assumed.
  - **The link moved above the button.** With the name written into the panel its position
    was irrelevant; now the link *is* the identity, and a route to the controller that
    appears after the press is not a route — pressing is the consent.
  - The guard asserted the literal string `'Daniel Kooij'`. Replaced rather than deleted:
    it now requires the panel to have a route to the controller **and** for that route to
    precede the button. Both failure modes are proven to fail the build.

**Three checks failed silently this session, all the same shape — answering a question
adjacent to the one being asked. This is the session's through-line:**

- `test-palette.js`'s token pattern used `[^;]+`, which crosses newlines, so prose in a
  `:root` comment reading `--clay:` started a match and ran to the next semicolon,
  swallowing the `--terra` declaration whole. `--clay` got a garbage value, `--terra` was
  never registered, and because `hexOf` returned nothing for both, the contrast loop
  treats them as *exempt and skips them* — while printing `OK`. Now `[^;\n]+`. **The only
  symptom was the token count in the summary line not going up. Do not drop that count.**
- My own new consent check passed green while the panel's privacy link still sat below the
  button, because the first `/voice/privacidad` in the document belongs to the **footer**,
  which precedes the dialog in source order. It was comparing the footer's link against
  the panel's button. Now scoped to `<dialog>`.
- **I reported a live AA failure that never existed.** `letra chica` on `fac442e` was
  **5.00:1 and passing**, not the 4.48:1 I claimed. My percentile sampler took a
  2nd-percentile pixel in a text block as "the text" and the 95th as "the ground" — on
  antialiased type over a gradient that is a half-lit glyph edge against the lightest
  patch of ground, which deflates the ratio every time. The same sampler invented a "blue
  text at 4.40:1" that turned out to be the CTA button's shadow bleeding into the sample
  band. **Nothing on this page has ever failed AA.** `44a0187` is still a real improvement
  (~4.8 → ~5.6 across the three secondary elements) but it fixed no failure, and its
  commit message overstates that; the message cannot be edited without a rewrite, so
  `8e9192e` is the correction of record. What actually works: text colour from the
  **declared token** (known exactly) and ground from the **modal pixel** under the block.
  Treat any contrast figure in this repo dated before `8e9192e` as unverified.

## Key files for next session
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — the deliverable. The `.llamada` CSS block
  and the `<dialog class="panel">` comment both carry reasoning that cannot be
  reconstructed from the code.
- `/home/ubuntu/Prime_AI/Landingpage/test-palette.js` — one guard for both pages. Token
  regex at ~line 40 (the newline fix), ES consent checks at ~line 447.
- `/home/ubuntu/Prime_AI/Landingpage/receptionist.html` — `/en/`. Still has
  `Daniel Kooij` in its panel.
- `/home/ubuntu/Prime_AI-voiceagent/Voice_agent/src/demo.ts` — line 565 is the `/voice/`
  page's controller notice; lines 52 and 66 hold `AGENT_ID` and `ES_AGENT_ID`.
- Plan file: none drove this session.
- Memory files touched: none.

## Running state
- Background processes: **PID 305506** —
  `python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage`,
  confirmed alive. Kill with `kill 305506`. Pre-existing, not started this session.
  **Publicly reachable** — port 9876, plain HTTP, no TLS. No `run_in_background` shells
  were started this session.
- Dev servers / ports: `http://127.0.0.1:9876/es.html`. PM2 `prime-voice` on
  `:3023/voice`.
- Open worktrees / branches: `Landingpage` on **`warm-palette`**, **12 commits ahead of
  `origin/warm-palette`** — not pushed this session. `Prime_AI-voiceagent` on
  `voice-agent-build`, untouched this session.
- A Playwright MCP browser is open at `http://127.0.0.1:9876/es.html?lang=en`.
- **36 untracked screenshots in the repo root** — my debris. Dan has been asked twice
  about delete vs `.gitignore`; no answer.
- Live `/es/` = **`7a6654d`** (deployed 2026-08-07 06:27, verified byte-identical to the
  commit; `943fb53` deployed 05:56 was the step before). Live `/en/` = unchanged, **still
  shows the name**; `190c477` is committed and NOT deployed.

## Verification — how to confirm things still work
- `cd /home/ubuntu/Prime_AI/Landingpage && node test-palette.js` — expect `OK`, exit 0,
  and **`39 tokens` for es**. A count of 38 means the token regex has silently eaten one
  again; that count is the only visible symptom of the whole failure class.
- `node test-roi.js` — expect `OK — 64 combinations checked` and
  `OK — es.html sum: 16 combinations, agrees with sales-agent.ts`.
- **The consent guard bites** — both must exit 1: (a) move the panel's
  `/voice/privacidad` line below the `id="ir"` button, (b) separately, delete it. Expect
  `route to the data controller ... sits below the start button` and
  `the call panel has no route to the data controller`.
- `curl -s https://prime-ai.es/es/ | grep -c 'class="llamada"'` → `1`, and
  `curl -s https://prime-ai.es/es/ | grep -o '<i></i>' | wc -l` → `28`.
- `curl -s https://prime-ai.es/es/ | grep -c 'linkedin.com/in/danielkooij'` → `1`. **That
  URL is UNVERIFIED.** LinkedIn answers HTTP 999 to anything without a browser session, so
  it cannot be checked from here. It was not invented — it came from the `/en/` footer,
  where it was already live — but if the handle is wrong it is now wrong on both pages.
  The link must also stay OUTSIDE the `data-en` div: `traducir()` swaps `innerHTML`, so
  markup inside would have to be repeated escaped in the attribute. Regression test is to
  click the ES/EN toggle and confirm the icon and href survive.
- `curl -s https://prime-ai.es/es/ | grep -c 'id="cifras"'` → `1`; `id="prueba"` → `1`;
  `cal.eu/prime.ai/intro-wa` → **`3`, not `2`**. The `2` written here was wrong: it is the
  number of rendered links, but the command counts raw string occurrences, and the panel's
  line carries the href twice (the real one plus its escaped copy in `data-en`). It was
  already `3` on `951aded`; nothing regressed.
- `curl -s https://prime-ai.es/es/ | perl -0777 -pe 's/<!--.*?-->//gs' | sed -n '/<body/,$p' | perl -0777 -pe 's/<script.*?<\/script>//gs' | grep -c '%'` → `0`.
- `curl -s https://prime-ai.es/es/ | perl -0777 -pe 's/<!--.*?-->//gs' | grep -ciE 'fontaner|plumbers|oficio|una avería|inside a leak'` → `0`.
- `curl -s https://prime-ai.es/voice/privacidad | grep -c 'Daniel Kooij'` — must be
  **≥1**. This is now the only controller disclosure in the call flow; if it reaches 0,
  art. 13 is unsatisfied and `test-palette.js` will still report green. Layered
  disclosure is a live dependency, not a one-off edit.
- Rollback one step from live (`7a6654d`) to `943fb53`:
  `sudo install -o www-data -g www-data -m 644 /var/www/prime-ai-backups/es-index.html.bak-20260807-062713 /var/www/prime-ai/es/index.html`
  — that file is **`943fb53`**, verified by diffing against git before use. Further back:
  `-20260807-055651` is `951aded`, `-20260807-043924` is `44a0187`. Verify any backup by
  diffing it against git before trusting its filename.
- **`grep` in this repo is a shell function wrapping ugrep with `-I`**, so it silently
  skips any file that `file` calls binary — exiting 1, which reads exactly like a real
  zero. `test-palette.js` was in that state until `0b298b7` because of one raw NUL byte.
  If a `grep` result ever contradicts `sed`/`Read`, check `file <path>` before believing
  the grep; use `command grep` to bypass the wrapper.

## Deferred + open questions
- ~~Open: deploy `943fb53` now, or batch it?~~ **Answered: deploy now. Done** — live `/es/`
  is `943fb53`.
- ~~Open: the name is still in three other places.~~ **Answered: `/en/` call panel only.
  Done in `190c477`, not deployed.** The handoff mislabelled these: `demo.ts:565` is a
  `<footer class="pie">`, not a call panel, and `es.html:1951` is the `.pie` footer too.
  Only `receptionist.html` was the twin of the panel Dan objected to. Both footers keep
  the name deliberately — they are the second layer that makes removing it from the panels
  safe.
- **Open, and now load-bearing: `/en/` has no controller record at all.** `/es/` kept its
  footer copy; `receptionist.html` never had one, so after `190c477` an English visitor's
  only route to the controller is `/voice/privacidad`, which is **Spanish-only**. The gap
  predates the commit; the commit makes it the single point of failure. Fix is an English
  privacy page or a footer on `/en/`. Not chosen by me.
- **Open: deploy `190c477` to `/en/`?** Not asked — Dan approved the `/es/` deploy only.
- **Open, highest downside: `ES_AGENT_ID` is unverified.** `/es/` routes to
  `agent_d591526dbfd45aa59effa61f60` (`demo.ts:66`). It is unknown whether it carries the
  money-back guarantee rule and the pricing bans. No `RETELL_API_KEY` exists in
  `Prime_AI-voiceagent/Voice_agent/.env*`, so it could not be checked at the API. The page
  may only promise what the call will repeat.
- **Open: may the 62% and 21x stat cards come to `/es/`?** Needs a decision on narrowing
  `ES_BANS`, which forbids `%` outright. Asked across two sessions; unanswered.
- **Open: push `warm-palette`?** 12 commits ahead of origin; never asked in either session.
- Deferred: `/en/` has never been swept with the all-strings occupation check, and its
  hero has never been checked for the composite-contrast blind spot — `PAIRS` is equally
  blind there and `receptionist.html` has its own gradients.
- Deferred: `es.html:85` still claims the page has no ROI calculator and no stats bar.
  Both halves are now false.
- Deferred: vault daily note `/home/ubuntu/TheVault/DailyNotes/2026-08-07.md` was updated
  twice this session but does not cover the call card or the panel name removal.
- Deferred, unchanged: `receptionist.html` warm-palette Tasks 3-6; the phone twin
  (`PHONE — Prime AI Receptionist Demo`) still has its bans scoped to the pitch state and
  is attached to no number; `/voice/privacidad` is Spanish-only; `/en-trades/` if English
  organic traffic matters.

## Pick up here
Both blocking questions are answered and both edits are done. Next: decide whether to
deploy `190c477` to `/en/`, and — before or with it — close the `/en/` controller gap,
since that page now has no controller record of its own and points only at a Spanish-only
privacy page. Then `warm-palette` is **12 commits ahead of origin** (re-check with
`git rev-list --count origin/warm-palette..HEAD`) and has never been pushed; that has gone
unasked for two sessions.
