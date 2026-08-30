# Session Handoff — WhatsApp/Instagram/LinkedIn added, the number got its +34, and the film became the front door

_Last updated: 2026-08-30_

## Where it started

User asked for three things on the landing page: a WhatsApp button people can message
directly, a link to Prime's Instagram, and LinkedIn. LinkedIn already existed in the
footer. The session then grew twice: first "always show +34 because people come from
Holland, Sweden and England, and always include the scroll version", then "make the
WhatsApp clearer, upstairs, green". Each addition exposed a hidden assumption in the
existing code rather than needing new code.

## Decisions locked + what shipped

- **Three social links in the footer** (`.pie-social` in
  `/home/ubuntu/Prime_AI/Landingpage/es.html`). User chose "footer row only" over a
  floating bubble, and "keep personal LinkedIn" (`linkedin.com/in/danielkooij`)
  over a company page. Each link has a `data-umami-event`.
- **The WhatsApp number is `34647599453`** — `PERISKOPE_PHONE` from
  `/home/ubuntu/Prime_AI/outreach-engine/.env`, the handset Periskope has linked by
  QR. **Trap: `.env.example` and `.env.clinic` have that key BLANK.** A careless grep
  reads the wrong line. Confirmed identical in the 08-14 and 08-28 backups. It is the
  same inbox as outbound outreach — a decision, not an oversight.
- **The prefill message is the only translated HREF on the page.** It cannot live in
  the markup: it goes percent-encoded and `tests/test-palette.js` bans `%` in the body
  (the agent may not cite a percentage). `ponerWa()` builds it at runtime from
  `T[idioma].wa`, so the text lives in one place per language and the number in one
  place total. Loosening the compliance ban was rejected as the wrong direction.
- **`+34` on all 5 displayed numbers, all 4 languages.** Adding four characters
  overflowed the page at 320px Spanish — root cause was `.btn` having no `max-width`,
  so an `inline-flex` could not shrink below its content and left its parent silently.
  Guard went on the shared `.btn`, not on the one button that overflowed.
- **The film is now served at `/`** (which is where `/es/` rewrites to). `PUBLIC=1`
  on `compose.js` emits it: no `noindex`, and `BASE=/scroll/`. `/scroll/` still serves
  the `noindex` draft, so only one URL is indexable and the preview workflow survives.
- **`compose.js` had a hidden assumption about its own mount point** and it broke
  production for under a minute. Asset paths resolve against the DOCUMENT's URL; the
  generator assumed `/scroll/`. Served at `/`, `assets/scroll/x` became
  `/assets/scroll/x` — the apex returned **200, weighed 187 KB, and painted zero
  scenes**. `BASE` now prefixes BOTH the engine `<script>` and every mp4/webp in the
  config. Fixing only the script would have left 11 silent 404s.
- **`compose.js` refuses to write a page whose assets are not on disk** — 18 paths
  resolved back to files. That failure class previously had no detector before the
  browser. Verified by deleting `obra.mp4` and watching the build fail.
- **Green WhatsApp CTA in the hero** (`.btn-wa`) + **floating green bubble during the
  film** (`.burbuja-wa`). The bubble is gated on `body.sw-playing`, the class the
  engine already sets and `compose.js` already uses to hide `.cta-movil`. It therefore
  cannot outlive the film and never meets the fixed 80px bar or the hero button.
- **`--wa: oklch(0.761 0.2015 149.7); /* #25D366 */`** — real WhatsApp green, with
  **ink** text (8.42:1). Paper on this green is **1.87:1**, the classic failure of this
  button; `.btn` text is 16px, which WCAG grades as normal text needing 4.5.
- **`tests/test-palette.js` now reads `.btn-wa`'s OWN declared color/background
  tokens** instead of asserting a hand-written pair. Measured: the hand-written pair
  stayed green while `color: var(--text-on-accent)` shipped 1.87:1. The check is tied
  to the button — a page with `.btn-wa` must define `--wa`; a page defining `--wa`
  without the button is flagged as a hue with no job.
- **nginx `location = /` gained `Cache-Control: no-cache`** — mandatory now, since the
  `?v=` stamps live inside the HTML. Backup:
  `/etc/nginx/backups/prime-ai-demo.conf.bak-20260830-060229`.
- **6 commits this session, 9 pushed** (`c90c711..1f61c29` on `origin/warm-palette`) —
  three predated this session and had never been pushed. Diff scanned for keys first.

## Key files for next session

- `/home/ubuntu/Prime_AI/Landingpage/docs/scroll-deploy.md` — **read first.** Gained
  the "la película pasa a ser la página principal" section: the exact deploy command,
  why `PUBLIC=1` changes two things and both are required, the rollback line, and the
  measured page weight.
- `/home/ubuntu/Prime_AI/Landingpage/scroll-world/compose.js` — `PUBLIC`, `BASE`, and
  the asset-existence guard. The `BASE` comment explains the outage.
- `/home/ubuntu/Prime_AI/Landingpage/es.html` — source of truth for BOTH pages.
  `scroll.html` is generated from it; its own header says do not edit it by hand.
- `/home/ubuntu/Prime_AI/Landingpage/tests/test-palette.js` — the `.btn-wa` block near
  `PAIRS` reads the button's declaration; do not replace it with a static pair.
- `/etc/nginx/sites-available/prime-ai-demo.conf` — **not in git.** `location = /`
  and `location = /scroll/`.
- Plan file: none.
- Memory files touched: none.

## Running state

- Background processes: **none started by this session.** The local preview on port
  8901 was stopped. Other `http.server` processes on 9876, 8080 and 8899 belong to
  other sessions/projects and were not touched — leave them alone.
- Dev servers / ports: none of this session's. To preview:
  `python3 -m http.server 8901 --bind 127.0.0.1` from
  `/home/ubuntu/Prime_AI/Landingpage`.
- Open worktrees / branches: branch `warm-palette`, clean, level with
  `origin/warm-palette` at `1f61c29`. No worktrees.

## Verification — how to confirm things still work

- `cd /home/ubuntu/Prime_AI/Landingpage && node tests/test-palette.js` — `OK`, and
  `es:` must read **14 contrast pairs, 40 tokens** (13/39 means `--wa` or `.btn-wa`
  was lost).
- `node tests/test-scroll-page.js` — `OK`, scroll.html still reproducible from source.
- `PUBLIC=1 node scroll-world/compose.js /tmp/x.html` — prints
  `18 assets del motor comprobados en disco, BASE="/scroll/"`. An empty BASE here
  means the apex build would 404 its own engine.
- `curl -s https://prime-ai.es/ | grep -c 'name="robots"'` — **0** (apex indexable).
  `curl -s https://prime-ai.es/scroll/ | grep -c 'name="robots"'` — **1** (draft hidden).
- `curl -sSI https://prime-ai.es/ | grep -i cache-control` — `no-cache`.
- **Do not verify a deploy with a headless browser's md5 alone, and do not verify page
  layout against the local flat file.** Both failed this session: the apex returned a
  correct md5 while painting zero scenes, and the hero button measured above-the-fold
  locally while sitting 12703px down live. Render the live URL and count
  `.sw-scene.has-clip` (expect 11).

## Deferred + open questions

- **Open: the Instagram handle `primeai.solutions` is unverified.** `instagram.com`
  answers this host with 429 + a login wall whether or not an account exists. It is
  live and pushed on the user's word alone. One tap on a phone settles it.
- Deferred: **no mobile video encode.** `clipM` is never set in
  `scroll-world/world.config.js`, so phones download the same clips as desktops —
  3.1 MB to land, 22.5 MB to scroll the whole film, 0.7 MB under
  `prefers-reduced-motion` (measured 2026-08-30 at 390px). This is the obvious lever
  before pointing paid traffic at the film.
- **Explicitly NOT to be built by an agent: the WhatsApp AI responder.** The user
  said "we will build that, wait don't — I will build that." When it exists, the
  hero button and bubble labels ("Escríbeme" / "Message me") promise a **person**,
  and that copy is the first thing to rewrite. A comment in `es.html` says so.
- Deferred (inherited, still true): 1080p re-render (~$50), shortening the film from
  14.4 screens, Swedish copy unreviewed, site-wide `Cache-Control` policy — only
  `location = /` and `location = /scroll/` have one.
- Noted: `prefers-reduced-motion` **does work** — 0 clips, 0.7 MB, observed
  2026-08-30. The previous handoff listed it as never observed working.

## Pick up here

Nothing is broken and everything is deployed and pushed. Most likely next action:
confirm the Instagram handle with the user and, if wrong, fix `es.html`, rebuild with
`PUBLIC=1`, redeploy both pages. After that, the mobile encode (`clipM`) is the
highest-value open item.
