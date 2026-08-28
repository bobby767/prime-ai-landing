# Session Handoff — Directory cleanup, then a scroll-world draft page deployed to /scroll/

_Last updated: 2026-08-28_

## Where it started

Two unrelated asks in sequence. First: the repo root was "too full" — 65 screenshots
(20 MB) mixed in with the four HTML pages that actually deploy. Second: locate a skill
in the vault from a Nate Herk note about a one-person marketing team, then implement his
method on the landing page. The skill turned out to be `scroll-world`; the constraint
that shaped everything after was that Higgsfield's OAuth login cannot be completed on a
headless server, so the whole build ran on Fal.

## Decisions locked + what shipped

- **Screenshots grouped, not deleted** — 65 files into
  `/home/ubuntu/Prime_AI/Landingpage/screenshots/{hero,card,video,lang,phone,prueba,variants,sections,full-page}/`;
  `.gitignore` took `screenshots/` + `*.png`. Commit `1e8c722`.
- **Test scripts moved to `tests/`** — all three read their pages through `__dirname`, so
  each gained `/../`; runnable commands in `docs/nl-deploy.md` and this file updated. The
  archived plan/spec under `docs/superpowers/` deliberately still say `node test-roi.js` —
  they record what was run in August, not what to run now.
- **New page, live one untouched** — the user chose this over editing `es.html`.
  `/home/ubuntu/Prime_AI/Landingpage/scroll.html`.
- **Warm clay diorama · fly-through (architecture B) · desktop-only · draft-first** — the
  four interview answers that drove the build.
- **Fal-only backend** — `monid` not installed, `higgsfield` not authenticated, `codex`
  absent. Stills `openai/gpt-image-2`, chain `bytedance/seedance-2.0/image-to-video`.
  Note both slugs take NO sub-path on submit (`/text-to-image` 404s at execution).
- **Stayed on `seedance-2.0` at 480p rather than `-mini`** — one model across previz and
  final so seam character doesn't shift. Cost $10.30 not the ~$8 quoted; user was told.
- **No `tel:` link on the new page** — all six on `es.html` point at `951 870 630`, still
  dead and still hidden by the `LÍNEA MUERTA` block. Only CTA is
  `https://cal.eu/prime.ai/intro-wa`.
- **Deployed** to `/var/www/prime-ai/es/scroll/`, `noindex, nofollow`, unlinked from
  anywhere. Commits `72db511` (build) and `4613e48` (deploy + docs).
- **nginx exact-match block added** — `location = /scroll/` in
  `/etc/nginx/sites-available/prime-ai-demo.conf`, because the shared
  `location / { try_files $uri @app; }` has no `$uri/` and no `index`, so the directory URL
  404'd with the file in place. Backup in `/etc/nginx/backups/`.
- **Draft clips stay out of git** — `assets/scroll/vid/` ignored; 22 MB about to be
  replaced by the 1080p render.
- `TheVault/DailyNotes/2026-08-28.md` gained one line.

## Key files for next session

- `/home/ubuntu/Prime_AI/Landingpage/docs/scroll-deploy.md` — **read first.** Deployed
  tree, the nginx block and why it exists, the 1080p re-render command, the seam law,
  rollback.
- `/home/ubuntu/Prime_AI/Landingpage/scroll.html` — the page; byte-identical to the
  deployed `index.html`.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/fal.sh` — chain helpers. Holds the fixed
  `fal_run`; its comment explains why polling URLs must come from the submit body and not
  be rebuilt from `$FAL_MODEL`.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/prompts/` — preamble + 6 still + 6 dive +
  5 connector prompts. The preamble is byte-identical across all stills on purpose.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/{run_dives.sh,run_conns.sh,encode.sh}`
- `/home/ubuntu/TheVault/Research/Nate Herk/Nate Herk - Claude as a One Person Marketing Team.md`
  — source note for the method.
- Plan file: none.
- Memory files touched: none.

## Running state

- Background processes: `python3 -m http.server 8899 --bind 127.0.0.1` — **PID 4021569**,
  serving `/home/ubuntu/Prime_AI/Landingpage`, bound to VPS loopback only.
  Kill: `kill 4021569` (or `pkill -f "http.server 8899"`). No longer needed now that the
  page is deployed.
- Dev servers / ports: `http://127.0.0.1:8899/scroll.html` — VPS loopback, reachable from a
  laptop only via `ssh -L 8899:127.0.0.1:8899 ubuntu@srv1233720.hstgr.cloud`.
  Live URL: `https://prime-ai.es/scroll/`.
- Open worktrees / branches: branch `warm-palette`, three commits ahead and **not pushed** —
  `1e8c722`, `72db511`, `4613e48`.
- A Playwright browser session is open at `https://prime-ai.es/scroll/`.

## Verification — how to confirm things still work

- `cd /home/ubuntu/Prime_AI/Landingpage && node tests/test-palette.js` — `OK` on en/es/nl,
  3 pages.
- `node tests/test-roi.js` — `OK`.
- `node tests/test-nl-ready.js` — exits 1 with its 5 documented blockers (expected; it
  gates the undeployed NL page).
- `git show HEAD:es.html | diff - /var/www/prime-ai/es/index.html` — empty; live Spanish
  page unchanged.
- `diff scroll.html /var/www/prime-ai/es/scroll/index.html` — empty.
- `curl -sS -o /dev/null -w "%{http_code}\n" https://prime-ai.es/scroll/` — 200.
  Also `/` 200, `/en/` 302, `/es/` 301.
- `curl -sS -r 0-99 -o /dev/null -w "%{http_code}\n" https://prime-ai.es/scroll/assets/scroll/vid/obra.mp4`
  — 206 (nginx serves byte ranges).

## Deferred + open questions

- Deferred: **1080p final render** — `VRES=1080p` in `fal.sh`, same prompts, same model,
  ~$50. Start tracking `assets/scroll/vid/` in git at that point.
- Deferred: **native 9:16 mobile chain** — user chose desktop-only. On a phone the 16:9
  film centre-crops and loses the diorama island, which is most of the concept. Roughly
  another chain's cost.
- ~~Deferred: the `baja para entrar` hint~~ — **done 2026-08-28.** It was not the light
  island edge: measured, the floor under it is `rgb(175,139,110)` and `--sw-ink-soft` sat
  at 1.99:1. Now `--sw-ink` (5.36:1) plus a `--sw-bg` halo on `.sw-hint` itself, so the
  mouse glyph's border and `::after` wheel get it too. Engine-only change; `scroll.html`
  untouched.
- Deferred: `prefers-reduced-motion` fallback never observed working; the harness doesn't
  expose emulation for it. Not claimed as working.
- Open: **which of the two remains next** — 1080p or the mobile chain. The hint fix was
  chosen and is done; these two were not re-asked.
- Open: **stills cost is unmeasured** — Fal returns no cost field for `openai/gpt-image-2`;
  7 images were generated (6 + one `agenda` re-roll). Read the real figure off the Fal
  dashboard rather than estimating it.
- Open: the `warm-palette` commits sit unpushed. Push not attempted — needs your go-ahead.

## Pick up here

Ask which of the two remaining deferred items to do; if told "1080p": set `VRES=1080p` in
`/home/ubuntu/Prime_AI/Landingpage/scroll-world/fal.sh`, run `run_dives.sh` →
`run_conns.sh` → `encode.sh`, re-verify the seams, redeploy to
`/var/www/prime-ai/es/scroll/`, and start tracking `assets/scroll/vid/`.
