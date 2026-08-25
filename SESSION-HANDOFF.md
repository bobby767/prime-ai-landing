# Session Handoff — the demo funnel was counting hangups, and the page's own cross-check could not have caught it

_Last updated: 2026-08-25_

## Where it started

Dan asked why the voice agent is very quiet on his phone. That investigation ran to a
confirmed-mechanism-but-unconfirmed-device state and stalled on a test only he can run. Two
unrelated asks followed — the status of the replacement Zadarma DID, and visitor numbers — and
the visitor query surfaced a real instrumentation bug, which became the session's only shipped
change.

## Decisions locked + what shipped

- **The demo funnel is fixed and live.** `#ir` starts the call *and* hangs it up; it carried
  `data-umami-event`, which fires on every click, so hangups counted as attempts. Measured:
  73 presses vs 47 `POST /voice/token` mints, 20-24 Aug. Three JS-emitted events now replace
  it — `demo-boton-hablar` (after the `stopCall()` return, starts only), `demo-en-linea` (on
  `call_ready`), `demo-falla` with `motivo: micro|ocupado|token|otro`. Commit `08b58a0`,
  **not pushed**.
- **The cross-check `es.html:2311` proposed was itself broken** — nginx logs UTC, Umami
  buckets Europe/Madrid, so days do not line up. The whole funnel now lives in Umami;
  drop-off is `hablar - en-linea - falla`, and the residual is calls hanging on "conectando"
  with no error, the one failure with no event of its own.
- **Deployed** to `/var/www/prime-ai/es/index.html`, verified by `curl` of the live site
  (md5 `e41d17ad2903cba4c5c36d96f45e573e`). Backup at
  `/var/backups/prime-ai/es/index.html.bak-20260825-075211`.
- **Mobile volume: root cause narrowed, NOT confirmed.** Nothing in the stack attenuates —
  the page has no volume code, the SDK uses `webAudioMix:false` so the agent track goes to a
  bare `<audio>` at `volume=1` with no GainNode, and the Retell agent `volume` field is
  deliberately unset (`build.test.ts:2644`). The source is measurably quiet: -19 to -31 dB
  RMS, 12 dB spread, one turn peaking at -0.9 dBFS (`sales-agent.ts:956`). Leading hypothesis
  is `echoCancellation:true` putting Android into communication mode, routing output to the
  earpiece on the call-volume slider. **Awaiting Dan's test — see Open below.**
- **Correction made mid-session, the agent's own.** I told Dan that Chrome on Android exposes
  `setSinkId` so a routing fix might be possible. It does not — output routing there is
  system-settings-only, the same dead end as iOS. There is no software reroute on either
  platform. Dan picked "Android / Chrome" while that wrong claim was on screen; it was
  corrected in the next turn before anything was built on it.
- **Zadarma `+34 951 870 604` is still `checking`** (day 2 since purchase), `...630` still
  `checking` (day 3) while `...451 / ...128 / ...551` are all `on`. Balance EUR 9.40. Nothing
  to put on the page. `status: on` would still not be the green light — `...630` was bound in
  Retell and returned success on order and never rang once. The ring test is the only proof.
- **The DID watcher is genuinely armed**, re-proved rather than trusted: `watch-did.sh` run
  under `env -i` with cron's exact PATH, and the Zadarma read succeeded. Cron fired 19:10 on
  24 Aug; `cron.log` is 0 bytes and no sentinels exist in `/var/tmp/zadarma-did-watch/`,
  which is correct because there has been no flip to announce.
- **Analytics baseline established.** Self-hosted Umami. 1-4 visitors/day; 16 on 24 Aug of
  which ~3 were Dan's own testing; 46 visitors total since tracking began 10 Aug. Week's
  referrers: 22 direct, 2 facebook.com, 1 Instagram.

## Key files for next session

- `/home/ubuntu/Prime_AI/Landingpage/es.html` — `pista()` sits next to `di()`; the three call
  sites; the comment block above `#ir` (~line 2311) explains why the attribute is absent and
  must stay absent.
- `/home/ubuntu/Prime_AI/Landingpage/test-palette.js` — 5 new assertions in the `[es]`
  section, each mutation-tested this session.
- `/home/ubuntu/Prime_AI/Voice_agent/src/sales-agent.ts` lines 940-1000 — the
  `VOICE_TEMPERATURE` docblock carrying the dB measurements and the two knobs already ruled
  out (`volume`, `speech_normalization`). Read before touching anything about loudness.
- `/home/ubuntu/Prime_AI/Voice_agent/public/retell.js` — vendored SDK build;
  `echoCancellation` is hardcoded in `startCall`'s `audioCaptureDefaults`. Regeneration
  recipe is in `Voice_agent/src/demo.ts` lines 35-44. Not in package.json by design.
- `/home/ubuntu/Prime_AI/docs/2026-08-23-zadarma-ticket-630.md` — still unsent, must go from
  Dan's account.
- `/home/ubuntu/Prime_AI/Voice_agent/watch-did.sh` — how DID activation gets noticed.
- Plan file: none.
- Memory files touched:
  `/home/ubuntu/.claude/projects/-home-ubuntu-Prime-AI-Landingpage/memory/landing-page-analytics.md`
  (new) and `MEMORY.md` (one line appended).

## Running state

- Background processes: none.
- Dev servers / ports: none started by this session. Pre-existing services only — Umami
  container on `127.0.0.1:3025`, voice app on `127.0.0.1:3023`.
- Open worktrees / branches: on `warm-palette`, ahead of `origin/warm-palette` by 2
  (`08b58a0` plus this handoff commit). Nothing pushed.

## Verification — how to confirm things still work

- `cd /home/ubuntu/Prime_AI/Landingpage && node test-palette.js` — exits 0, prints
  `OK  en: ... | es: ... | nl: ...`.
- `curl -s https://prime-ai.es/ | md5sum` — `e41d17ad2903cba4c5c36d96f45e573e`, matching
  `es.html`.
- `cd /home/ubuntu/Prime_AI/Landingpage && git show HEAD:es.html | diff - /var/www/prime-ai/es/index.html`
  — empty, i.e. live matches the commit. (Run before any redeploy: it also catches a
  hand-edit made directly on `/var/www`, which has happened before.)
- `node /tmp/claude-1000/-home-ubuntu-Prime-AI-Landingpage/c16d75f4-f973-4b66-9121-54a8e3389eef/scratchpad/hangup.js`
  — prints `PASS`; start fires `demo-boton-hablar` + `demo-en-linea`, hangup fires nothing.
  Stubs the SDK and token route so no call is billed. **That scratchpad is session-scoped and
  may already be gone**; the test's shape is reconstructible from commit `08b58a0`'s message.
- `cd /home/ubuntu/Prime_AI/Voice_agent && bun --env-file=/home/ubuntu/Prime_AI/outreach-engine/.env run src/zadarma.ts numbers`
  — current status of `...604` and `...630`.
- Rollback of the deploy, one command:
  `sudo install -o www-data -g www-data -m 644 /var/backups/prime-ai/es/index.html.bak-20260825-075211 /var/www/prime-ai/es/index.html`

## Deferred + open questions

- **Open, and blocking the volume fix:** during a call on Dan's Android, does pressing the
  volume rocker show a **Call** slider or a **Media** slider? Call means communication-mode
  routing, and the only levers are level (compressor + makeup gain in `es.html`) or
  `echoCancellation:false` in the vendored SDK — which trades echo for volume and would make
  the agent interrupt itself on speakerphone. Media means routing is fine and the low volume
  is purely source level.
- Deferred: the compressor + ~10 dB makeup gain fix. Device-independent, fixes the measured
  12 dB wander, does not clip the -0.9 dBFS peak. Not built pending the answer above. Caveat
  to test on a real phone: piping a WebRTC remote stream into Web Audio needs the original
  `<audio>` element kept alive and muted, or Chrome collects the stream and the result is
  silence rather than quiet.
- Deferred: `git push` of `08b58a0` — needs Dan's say-so.
- Deferred: sending the Zadarma ticket for `...630`. Three days in `checking` is a stronger
  case than one.
- Note for whoever reads the dashboard next: historical `demo-boton-hablar` counts mixed
  starts with hangups and are **not** comparable to counts from 25 Aug onward. Expect roughly
  a halving — that is the fix landing, not traffic falling. Baseline is 1-4 visitors/day, so
  allow about a week before the `motivo` split means anything.

## Pick up here

Ask Dan for the volume-slider reading from his Android, then build either the compressor +
makeup-gain fix in `es.html` or the `echoCancellation` change in the vendored SDK depending on
the answer.
