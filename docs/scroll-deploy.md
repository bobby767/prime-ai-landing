# scroll-world draft — deploy notes

_Status 2026-08-28: **deployed** at <https://prime-ai.es/scroll/> as a 480p draft,
`noindex, nofollow`, unlinked from anywhere. Not the finished thing._

The page is `scroll.html`: six clay-diorama scenes joined into one continuous
camera flight, scrubbed by scroll position. Built with the `scroll-world` skill.
It is a **separate page** — it does not touch `es.html`, and the live
`/var/www/prime-ai/es/index.html` is unchanged by any of this.

## What is deployed where

```
/var/www/prime-ai/es/scroll/
├── index.html                        # byte-identical to repo scroll.html
└── assets/scroll/
    ├── scrub-engine.js
    ├── still/*.webp                  # 6 posters, from the clips' ACTUAL first frames
    └── vid/*.mp4                      # 11 clips: 6 dives + 5 connectors, 22 MB
```

The relative asset paths are why the tree is nested this way: the deployed
`index.html` is the same bytes as the repo file, so the usual drift check works
on it exactly as it does on `es.html`:

```bash
diff scroll.html /var/www/prime-ai/es/scroll/index.html    # expect empty
```

## The nginx block, and why it exists

`location / { try_files $uri @app; }` has **no `$uri/` and no `index`**, so a
request for `/scroll/` did not resolve to `index.html` — it fell through to the
Bun app and returned 404, even with the file correctly in place. `/scroll/index.html`
worked all along. Rather than add `$uri/` to the shared `location /` (which would
change how *every* directory under the root resolves), there is an exact-match
block that resolves only this one path:

```nginx
location = /scroll/ {
    root /var/www/prime-ai/es;
    try_files /scroll/index.html =404;
}
```

Verified after reload: `/scroll/` → 200, `/` → 200, `/en/` → 302, `/es/` → 301.

## Assets are NOT in git

`assets/scroll/vid/` is gitignored. These are throwaway 480p previz clips and
committing 22 MB that is about to be replaced is not worth the history. Track
them when the 1080p final is approved. The page, the engine, the posters, every
prompt and the render scripts ARE committed, so the clips are reproducible:

```bash
cd scroll-world
VRES=1080p bash run_dives.sh && bash run_conns.sh && bash encode.sh
```

## Re-render at 1080p

One variable. `VRES=1080p` in `fal.sh`, same prompts, same model — the model must
not change mid-chain or the seams shift character. Cost at Fal's
`w×h×24×s/1024 × $0.014/1k`: ~$5.44 a dive, ~$3.40 a connector, ~$50 the chain.
The 480p draft cost $11.46.

**The one rule if you re-render:** connectors take their start/end images from the
neighbouring dives' *actual rendered frames*, never from the stills — `run_conns.sh`
already extracts them. Two renders of the same diorama never match, and that
mismatch is what a seam pop is.

## Rollback

```bash
sudo rm -rf /var/www/prime-ai/es/scroll
sudo cp /etc/nginx/backups/prime-ai-demo.conf.bak-<stamp> \
        /etc/nginx/sites-available/prime-ai-demo.conf
sudo nginx -t && sudo systemctl reload nginx
```

Removing the directory alone is enough to take the page down; the `location`
block then just returns 404, which is what it did before.

## Known, and deliberate

- **Phones centre-crop the film.** It is a 16:9 chain; portrait crops away the
  diorama island, which is most of the idea. The fix is a native 9:16 second
  chain (~another chain's cost), not a CSS change.
- **`baja para entrar`** sits on the light island edge and is hard to read.
- **`prefers-reduced-motion` is untested** — the engine claims a stills fallback,
  but it has not been observed working here.
