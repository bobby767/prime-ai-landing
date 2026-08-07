# Session Handoff — Took the plumber out of the Spanish page, then gave the hero something to look at

_Last updated: 2026-08-07_

## Where it started
Picked up the previous handoff's "Pick up here": broaden the three meta-description
strings in `es.html` so the page stops narrowing to plumbers in search results, then
redeploy `/es/`. That took twenty minutes; the rest of the session came out of Dan
reading the result and finding what the first pass had missed. Governing constraint
throughout, unchanged: a visitor presses "Talk to the AI" and reaches the agent ~30
seconds later, so the page may not claim what the call must refuse to repeat.

## Decisions locked + what shipped

Six commits. **`fac442e` was deployed on 2026-08-07** (see "Deployed since" at the
bottom); everything below is otherwise as written at handoff time.

- **Meta description broadened — `81fa5b3`, DEPLOYED.** All three strings now end
  "Para negocios de Málaga" / "For businesses in Málaga", verbatim the marbete already
  in the ALTO section, so snippet and first-thing-under-the-fold say the same words.
  Three strings move together: the static `<meta>` (what a no-JS visitor gets) plus
  `T.es.descripcion` and `T.en.descripcion`.
- **The copy was still addressed to plumbers — `0256e4a`, DEPLOYED.** I reported
  "visible body copy has zero trade words". That was wrong, and Dan found it. Three
  strings were trade-coded: the missed-calls list opened with hands inside `una avería`
  / `a leak`, the next line drove to the `siguiente aviso`, and the emergency FAQ said
  `en tu oficio` / `in your trade`. Now `un trabajo que no puedes dejar a medias` /
  `a job you can't walk away from`, `siguiente trabajo`, `en tu negocio`.
  - **Why the check failed:** the grep behind the claim looked for trade NAMES
    (fontanero, plumber, reforma). The page was narrowed by the trade's WORK. A
    negative claim is only as good as the vocabulary you thought to search.
  - **The English had been narrowing the page on its own.** `avería` covers
    electricians, aircon, appliance repair, mechanics, pool maintenance. `a leak`
    covers plumbers. A translation did that; nobody decided it.
- **Proof section ported from `/en/` — `f8783a5`, DEPLOYED.** New `#prueba` between
  `nadie` and `encaje`, the same slot it holds in English. Dropped `/en/`'s
  "Clinic and trade results coming soon" placeholder (a promised result proves
  nothing, and brushes the promise ban). Reused `.paso` and `.paso-num` from "Cómo
  funciona", so new CSS is only the quote, signature and country pills.
  - CSS bug caught in the browser, not review: `.prueba p` is class+element and
    outranks a bare `.prueba-cita`, so the quote silently stayed body-grey. It is
    `p.prueba-cita` now.
- **The guard now holds the line — `dde454b`, test-only, no page change.** Proved the
  need first: reverting both halves of the morning's work left `test-palette.js` green
  at exit 0. Bans the vocabulary, not the strings that shipped. **Checked twice on
  purpose** — `body` starts at `<body>` and strips `<script>`, so it can see neither
  the head `<meta>` nor the `T.es`/`T.en` strings; that blind spot is exactly how
  "the visible copy names no trade" was true while every search result promised a
  plumber page. A description count that is not 3 fails the build rather than passing
  green on nothing found.
- **`warm-palette` pushed.** Was 36 commits ahead of master with **no upstream at
  all** — this created `origin/warm-palette`, it did not update one. Verified by
  comparing local and remote SHAs, not by trusting the push output.
- **Hero + half the stats bar — `fac442e`, DEPLOYED 2026-08-07.** Dan: "the hero
  is completely white, give it some life."
  - `.alto` had no background and stood 92vh, so screen one was an empty sheet. Now a
    diagonal wash plus a blurred `--clay` halo, and 80vh so the sand band clears the
    fold. The wash alone was invisible: paper/shell/sand all sit between 0.92 and 0.98
    lightness. Clay at 0.879 is the deepest light token there is.
  - **Only two of `/en/`'s four stat cards may exist here.** 62% and 21x cannot come:
    `ES_BANS` forbids the `%` character on this page outright. I had told Dan the guard
    permitted them — wrong, I had read `/en/`'s rule. The two that travelled are the
    ones `/en/` had already rewritten for this same reason
    (`receptionist.html:1719` records card three holding a salary, then €13,125/mo,
    both wrong because a stat card reads as a fact the agent must refuse to repeat).
  - **Fixed a bug rather than porting it:** `/en/` renders
    `<div data-target="2">0 rings</div>`, so scripts-off reads "0 rings and someone has
    picked up" — the opposite of the claim. Here the markup is true and JS only
    animates it.
  - Numbers are blue, not amber: amber on sand is 2.95:1 and fails even large text.
    Added `--accent`/`--sand` at 3.0 to `PAIRS` so the substitute stays checked.
  - Counter has **its own observer**. Hanging it off the shared reveal observer was the
    smaller diff and was wrong: at 80vh the band is 28% visible on load, so threshold
    0.1 fired immediately and spent the animation with the numbers below the fold.
- **Why `/en/` and `/es/` differ, answered, nothing built.** `/en/` is the older
  cold-outreach page for clinics (2802 lines); `es.html` came later (1852). The
  structural difference: `es.html` has **3** section classes (`alto`, `banda` with tone
  modifiers, `cierre`), `/en/` has **11** bespoke ones. They already share 38 design
  tokens; `/en/` adds 5. Extending the Spanish page is cheap, restructuring the English
  one is not.

## Key files for next session
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — the deliverable. Read the header
  comment block first; it now carries the write-the-moment rule and the
  translation-narrows-silently trap.
- `/home/ubuntu/Prime_AI/Landingpage/test-palette.js` — one guard for both pages.
  `ES_BANS` (`/%/` at the top) is what blocks the two remaining stat cards.
- `/home/ubuntu/Prime_AI/Landingpage/receptionist.html` — `/en/`. Line 1719's comment
  is the record of why a stat card became a product fact.
- `/home/ubuntu/Prime_AI-voiceagent/Voice_agent/src/demo.ts` — lines 52 and 66 hold
  `AGENT_ID` and `ES_AGENT_ID`. Read before assuming which agent `/es/` reaches.
- Plan file: none drove this session.
- Memory files touched: none.

## Running state
- Background processes: **PID 305506** —
  `python3 -m http.server 9876 --bind 0.0.0.0 --directory /home/ubuntu/Prime_AI/Landingpage`.
  Kill with `kill 305506`. Pre-existing, not started this session. **Publicly
  reachable** — port 9876 open, plain HTTP, no TLS. No `run_in_background` shells were
  started this session.
- Dev servers / ports: `http://127.0.0.1:9876/es.html`. PM2 `prime-voice` on
  `:3023/voice`.
- Open worktrees / branches: `Landingpage` on **`warm-palette`**, now **pushed** and
  tracking `origin/warm-palette` at `fac442e`. `Prime_AI-voiceagent` on
  `voice-agent-build` — untouched this session, but it gained commits `0090522` and
  `42e4eea` from a concurrent session.
- A Playwright MCP browser is open at `http://127.0.0.1:9876/es.html`.
- **12 untracked screenshots in the repo root** (`hero-*.png`, `prueba-*.png`,
  `cifras.png`, `anchor-check.png`) — my debris, not pushed. Dan was asked about
  deleting vs `.gitignore`; no answer.
- Live `/es/` = **`44a0187`**. Backups, each identified by diffing against git rather
  than by its timestamp: `-20260807-042235` = `fac442e`, `-20260807-040307` = `f8783a5`,
  `-20260806-073111` = `0256e4a`, plus `-20260806-034627` and `-20260806-035748`.

## Verification — how to confirm things still work
- `cd /home/ubuntu/Prime_AI/Landingpage && node test-palette.js` — expect `OK`, exit 0,
  and `13 contrast pairs, 8 ban rules` on both pages.
- `node test-roi.js` — expect `OK — 64 combinations checked` and
  `OK — es.html sum: 16 combinations, agrees with sales-agent.ts`.
- **The occupation guard actually bites** — this is the check worth re-running, because
  it is the one that was silently absent:
  `cp es.html /tmp/x.html && sed -i 's/Para negocios de Málaga\./Para fontaneros, reformas y negocios de Málaga./' es.html && node test-palette.js; echo $?` →
  expect `1` and a `[es] fontaneros in a meta description` line. Restore with
  `cp /tmp/x.html es.html`.
- `curl -s https://prime-ai.es/es/ | grep -c 'id="prueba"'` — expect `1`.
- `curl -s https://prime-ai.es/es/ | grep -c 'id="cifras"'` — expect `1` (was `0` before
  `fac442e` shipped).
- `curl -s https://prime-ai.es/es/ | grep -c 'cal.eu/prime.ai/intro-wa'` — expect `2`.
  Same on `/en/`.
- `curl -sI https://prime-ai.es/ | grep -i location` — expect `https://prime-ai.es/es/`.
- Occupation words absent from shipped copy:
  `curl -s https://prime-ai.es/es/ | perl -0777 -pe 's/<!--.*?-->//gs' | grep -ciE 'fontaner|plumbers|oficio|una avería|inside a leak'` — expect `0`.
- Rollback one step, to `fac442e` (keeps stats band + proof, reverts only the hero
  vignette — note this reinstates the 4.48:1 letra chica):
  `sudo install -o www-data -g www-data -m 644 /var/www/prime-ai-backups/es-index.html.bak-20260807-042235 /var/www/prime-ai/es/index.html`
- Rollback further, to `f8783a5` (drops hero + stats band, keeps the proof section):
  `sudo install -o www-data -g www-data -m 644 /var/www/prime-ai-backups/es-index.html.bak-20260807-040307 /var/www/prime-ai/es/index.html`
  - Backups verified against git, because the filename does not say what is inside:
    `-20260807-040307` = `f8783a5`, `-20260806-073111` = **`0256e4a`**. The previous
    handoff named `073111` as the rollback target; that is one commit too far back and
    would silently also drop the proof section.

## Deferred + open questions
- **Open: may the 62% and 21x stat cards come to `/es/`?** `ES_BANS` forbids `%`
  outright, but `sales-agent.ts:1035` bans *promising* a percentage as a performance
  outcome — the same logic that lets the money-back guarantee exist as "a fixed
  commercial term rather than a promised result". A sourced industry statistic is not a
  promise, which is why `/en/` allows it with a mandatory citation check. So the ES rule
  is broader than the constraint it protects. Narrowing it loosens a deliberate guard;
  Dan was asked and has not answered.
- **Open: the Spanish agent is unverified.** `/es/` routes to `ES_AGENT_ID =
  agent_d591526dbfd45aa59effa61f60` (`demo.ts:66`), a second agent from the concurrent
  session's `0090522`/`42e4eea`. Every verification step in the previous handoff targets
  `agent_365110c5e7174c245faa0aa30d`. No `RETELL_API_KEY` exists in
  `Prime_AI-voiceagent/Voice_agent/.env*`, so it could not be checked at the API.
  **It is unknown whether the twin carries the money-back guarantee rule and the pricing
  bans.** `demo.ts:56` claims "same prompt" and the publish CLI looks like it updates
  both; neither was proven.
- **Open: how bold should the hero get?** It is warmer but this palette is warm-light by
  design. The options offered were an amber word in the headline (costs the documented
  "amber is what carries the money" semantic) or a dark hero (a bigger change). No
  answer.
- **Open: `/en/`'s headline may be the same class of bug just fixed.** "Your Phone Rang
  200 Times Last Month. You Answered 76 of Them." is a figure asserted about the
  visitor's business. Both pages call the same agent. The guard's `CLAIM_BANS` regexes
  do not match that phrasing, so it passes green. The 62% mechanism is cited directly
  below, so it may be read as illustration — Dan's call, flagged not fixed.
- Deferred: `es.html:85` still says "there is no ROI calculator here and no stats bar".
  The stats-bar half is about to be false too once `fac442e` ships; the calculator half
  is already false (`#cuenta` exists).
- Deferred: `/en/` has never been swept with the all-strings check for its own
  occupation problem. It is clinic-framed so its equivalent would be patient-coded,
  which is correct for its vertical — but unverified, and I was wrong about exactly this
  twice on `es.html`.
- Deferred: vault daily note at `/home/ubuntu/TheVault/DailyNotes/2026-08-06.md` covers
  the meta-description and de-trading work only. The proof section, the occupation
  guard, the push and the hero/stats work are not in it.
- Deferred, unchanged from before: `receptionist.html` warm-palette Tasks 3-6; the phone
  twin (`PHONE — Prime AI Receptionist Demo`) still has its bans scoped to the pitch
  state and is attached to no number; `/voice/privacidad` is Spanish-only; `/en-trades/`
  if English organic traffic matters.

## Deployed since — 2026-08-07

`fac442e` is live. The prior "Pick up here" is done; nothing about it is outstanding.

- Pre-flight held: live `index.html` was byte-identical to `git show f8783a5:es.html`,
  so no concurrent hand-edit. Working tree `es.html` was byte-identical to
  `fac442e:es.html`. Both guards green (`13 contrast pairs, 8 ban rules` on both pages;
  `64 combinations` + `es.html sum: 16`).
- Backed up to `es-index.html.bak-20260807-040307`, installed, and confirmed the
  deployed file is byte-identical to `fac442e:es.html`.
- Live checks: `id="cifras"` 1, `id="prueba"` 1, cal link 2, root redirect to `/es/`,
  occupation words 0, and **`%` in the live rendered body 0** — the `ES_BANS` rule the
  stat cards were trimmed to satisfy holds against what is actually served, not just
  against the file.
- Verified in the browser, not only by curl: the hero carries the wash and halo and the
  sand band clears the fold at 1440×900 and 390×844.
- **Counter proven end to end, since it was the one piece with a live failure mode.**
  At load the markup already reads `2 tonos` / `168 horas`, so scripts-off is correct
  (this is the `/en/` `0 rings` bug not being ported). Sampling across a scroll shows
  it reset to `0` only once the grid was really visible, count up, and land on 168 —
  so the `threshold: 0.6` on `.cifras` is doing the job the shared 0.1 observer could
  not.

## Then `44a0187` — the hero again, because the first one was not visible

Dan looked at deployed `fac442e` and said "looks exactly the same". He was right, and
the deploy was fine — the served bytes matched `fac442e` exactly. The change was simply
below the threshold of sight. Measured on background pixels with text excluded:
`f8783a5` span **0.0** (a single flat colour), `fac442e` **37.4**, `44a0187` **90.3**.

- **The first hero bought warmth by darkening the ground under the text.** It put
  `--clay` — the deepest token available — in the CENTRE, behind the headline, and left
  the edges light. `44a0187` inverts it: depth at the edges, centre lightens.
- **That first version was a live AA failure.** `letra chica` measured **4.48:1** on
  deployed `fac442e`. The inverted version improves every line instead of degrading it:
  marbete 4.98→5.70, entrada 5.00→5.67, letra chica 4.48→**4.69**. Verified on rendered
  pixels at 1440×900 and 390×844, then again on the live URL after deploy.
- **`PAIRS` structurally cannot catch this.** It compares token against token; a
  gradient with a blurred halo composited over it produces colours that are not any
  token. Only the rendered pixel shows it. Worth knowing before trusting a green guard
  on anything involving a gradient.
- **New token `--terra` (`#D0BDAB`)**, the only one below clay. paper/shell/sand/clay
  all sit within ten points of lightness, so no rearrangement of those four is visible.
  Ending the vignette on clay also works and needs no new token, but reaches 60 not 90 —
  recorded in the token's comment if the palette rule is ever enforced strictly.
- **A guard bug, found by hitting it.** `test-palette.js`'s token pattern used `[^;]+`,
  which crosses newlines, so prose in a `:root` comment reading `--clay:` started a match
  and ran to the next semicolon, swallowing the declaration after it. `--clay` got a
  garbage value, `--terra` was never registered, and because `hexOf` returned nothing for
  both, the contrast loop treated them as exempt and **skipped them silently while
  printing OK**. Now `[^;\n]+`. Proven with the same poisoned comment: old → `38 tokens,
  OK`; new → `39 tokens, OK`.
  - **The only symptom was the token count not going up.** That number in the summary
    line is the sole thing that makes this class of miss visible — do not drop it.

## Pick up here
Nothing is queued. `/es/` is at `44a0187` and verified. What is left needs Dan:

1. **The Spanish agent is still unverified** — `ES_AGENT_ID` may or may not carry the
   money-back guarantee rule and the pricing bans. This is the one with real downside:
   the page can only promise what the call will repeat.
2. **Do the 62% and 21x cards come to `/es/`?** Needs a decision on narrowing `ES_BANS`.
3. **Is the hero bold enough now?** It is 2.4× the depth of what Dan called invisible,
   and it is live — so this is now answerable by looking rather than by argument.
4. Unblocked and doable without Dan: sweep `/en/` with the all-strings occupation check
   (deferred twice, and the same class of miss was found twice on `es.html`); fix
   `es.html:85`, which still claims the page has no ROI calculator and no stats bar —
   both halves are now false; and **check whether `/en/`'s hero has the same composite
   contrast problem**, since `PAIRS` is equally blind there and `receptionist.html` has
   its own gradients.
