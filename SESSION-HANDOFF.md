# Session Handoff — the photoreal film got shot, assembled, deployed, and then two cache bugs made it look like nothing happened

_Last updated: 2026-08-29_

## Where it started

Opened with "where were we with the building of the page?" The previous handoff said
the film was on hold by decision; it was stale — four commits after it had already
shot five of six scenes. The user then asked to render the rest, assemble it, deploy
it, and finally push. The session's real lesson came at the end: the deploy was
correct twice and looked unchanged both times.

## Decisions locked + what shipped

- **The film is fully shot** — 6 stills, 6 dives, 5 connectors, **zero content
  refusals**, $4.84 this run. Prompts in
  `/home/ubuntu/Prime_AI/Landingpage/scroll-world/prompts/`.
- **The spec's two open questions were one question, and the spec had the fact
  wrong.** It claimed *"the job goes to whoever picked up"* lives in `furgoneta`; it
  is `cocina`'s body, `world.config.js:67`. So the connector the design meant was
  `conn_1`, and `conn_real_0.txt` — which lifts out of the *kitchen* and already
  carried the rival van — was never miswritten, only misnumbered. Renumbered to
  `conn_real_1.txt`; a new `conn_real_0.txt` lifts out of the bathroom.
- **`demo-film` reshot as `_real2`.** The `_real` still drew a legible `00:15`
  despite the style block forbidding text. A negative constraint does not beat a
  strong prior — *"screen showing an active call"* **is** a call-timer UI in the
  training data. Fixed by a competing physical fact: phone tilted so the screen is
  flat daylight glare. Same shape as the face fix in `bebd21f`. `_real` kept as
  evidence.
- **Assembly is a zero-line config diff.** `REAL=1 bash encode.sh` writes the
  photoreal clips to the **same output paths** the clay ones used, so
  `world.config.js` never learns which film is behind it. `compose.js` emits a
  byte-identical `scroll.html`.
- **Deployed** to `https://prime-ai.es/scroll/` — 17 files as `www-data:www-data
  644`. Still `noindex` and unlinked. `es.html` untouched all session.
- **Two queued fixes deliberately NOT done.** Per-scene `accent` stays terracotta
  `#C2703D`: the sky is blue in the footage now, so the warm accent is the
  complement (it is the lamplight, the film's only warm source), and going blue
  would destroy the one accent beat that works — `demo-film` turning the chrome
  `#2563EB` at the ending. `object-position: center 42%` stays: it protected a small
  centred clay island, and photoreal frames have no such single point of failure.
- **Two chained cache faults, fixed.** (1) Same filenames meant no signal the bytes
  changed -> `?v=<mtime base36>` on all 17 asset paths, stamped in `compose.js` at
  serialization. (2) That stamp lives *inside* the HTML, and nginx sent no
  `Cache-Control` for `/scroll/` -> the browser applied heuristic freshness to the
  document and never requested the versioned URLs. `add_header Cache-Control
  "no-cache"` on `location = /scroll/`. A revalidation is a measured **0-byte 304**.
- **9 commits pushed** to `origin/warm-palette` (`672edc6..c90c711`) on the user's
  go-ahead. Diff scanned for literal keys first — `FAL_KEY` appears only as a shell
  variable reference.

## Key files for next session

- `/home/ubuntu/Prime_AI/Landingpage/docs/scroll-deploy.md` — **read first.** Gained
  the cache section: both failures, why fixing one is invisible, and the honest
  verification method.
- `/home/ubuntu/Prime_AI/Landingpage/docs/superpowers/specs/2026-08-28-photoreal-film-design.md`
  — the film's design contract, updated with the full shoot and the assembly section.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/encode.sh` — the `REAL=1` mapping.
  `bash encode.sh` (no flag) restores the clay film for free.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/compose.js` — carries the `?v=`
  cache-buster; the one place every asset path reaches the page.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/run_conns_real.sh` — indexes as
  `real_N` so it cannot overwrite the gitignored $10.34 clay set.
- `/etc/nginx/sites-enabled/prime-ai-demo.conf` — the `no-cache` header. Backup:
  `/var/backups/prime-ai-demo.conf.bak-20260829-103043`.
- `/home/ubuntu/Prime_AI/clay-film-backup-2026-08-29.tar.gz` — 22M, the live clay
  film as it stood before the swap.
- Plan file: none.
- Memory files touched: none.

## Running state

- Background processes: `python3 -m http.server 8899 --bind 127.0.0.1` — **PID
  4021569**, serving `/home/ubuntu/Prime_AI/Landingpage`, loopback only. Kill:
  `kill 4021569`. Not started by this session. No `run_in_background` shells were
  used this session.
- Dev servers / ports: `http://127.0.0.1:8899/scroll.html` — loopback; reach it from
  a laptop with `ssh -L 8899:127.0.0.1:8899 ubuntu@srv1233720.hstgr.cloud`. Live
  URL: `https://prime-ai.es/scroll/`.
- Open worktrees / branches: `warm-palette`, **fully pushed**, clean working tree.
- Untracked generated assets (all gitignored): the photoreal set in
  `scroll-world/still/` and `scroll-world/vid/` (`*_real*.png`, `dive_*_real*.mp4`,
  `conn_real_*.mp4`), plus `assets/scroll/vid/` — the encoded film.
- **Fal balance $31.40 settled.** The endpoint lags a completed job by minutes; it is
  settled spend, not headroom.

## Verification — how to confirm things still work

- `node /home/ubuntu/Prime_AI/Landingpage/tests/test-scroll-page.js` — `OK`.
- `node /home/ubuntu/Prime_AI/Landingpage/tests/test-palette.js` — `OK`, 3 pages.
- `node /home/ubuntu/Prime_AI/Landingpage/tests/test-roi.js` — `OK`, 64 combinations.
- `node /home/ubuntu/Prime_AI/Landingpage/tests/test-nl-ready.js` — exits 1 with its
  5 documented blockers. **Expected.** Gates `nl.html` only.
- `curl -sSI https://prime-ai.es/scroll/ | grep -i cache-control` — `no-cache`.
- `curl -sS https://prime-ai.es/scroll/assets/scroll/vid/obra.mp4 -o /tmp/o.mp4 &&
  ffmpeg -y -ss 0 -i /tmp/o.mp4 -frames:v 1 /tmp/o.png` — a photoreal plumber under
  a sink, not a clay diorama.
- **Do not verify a deploy with a headless browser.** It always starts with an empty
  cache, so it confirms the server and not what a returning visitor sees. That is
  exactly how this session declared a deploy good twice while the user saw the old
  film. Use a private window, or the curl-and-extract-a-frame check above.
- `git show HEAD:es.html | md5sum` vs `md5sum /var/www/prime-ai/es/index.html` —
  identical. `/es/` 301s to the apex, so `curl` needs `-L`.

## Deferred + open questions

- Deferred: **1080p re-render** — ~$50 against a $31.40 balance, so it needs a top-up
  first.
- Deferred: **shortening the film** from 14.4 screens — free, `diveScroll`/
  `connScroll` in `world.config.js`, unrelated to the video.
- Deferred: `prefers-reduced-motion`, still never observed working. The Swedish is
  still unreviewed.
- Deferred: a site-wide `Cache-Control` policy in nginx — only `location = /scroll/`
  was given one, since a whole-site change was not needed for this bug.
- Open: **does the browser voice demo actually connect?** `.llamar` is the only way a
  visitor can try the product, prominent on desktop and mobile, and end-to-end has
  never been verified. Needs a microphone — 30 seconds of the user's time, and it
  outranks anything left on the film.
- Open: **Zadarma** — `…630`/`…604` still stuck in `checking`. The user is handling
  this themselves and declined the `…604` re-route on 2026-08-28. Do not re-offer
  unasked.
- Open: **is the film worth more investment?** Umami showed 1-19 visitors/day, mostly
  2-4, and `/scroll/` is still `noindex` and unlinked. Raised in a prior session,
  still unresolved.

## Pick up here

The film is done and live; the highest-value open item is not the film. Ask the user
to spend 30 seconds testing the `.llamar` browser voice demo end to end with a
microphone — it is the only way a visitor can try the product and it has never been
verified.
