# Deploying nl.html to prime-ai.nl

_Written 2026-08-09. **Nothing here has been executed.** The domain is not
registered, the nginx block is not installed, and `nl.html` is not deployed._

Gate: `node test-nl-ready.js` — exits 1 today with 5 blockers, exits 0 when the
page is genuinely deployable. Do not deploy while it is red; it is red for
reasons that are invisible in a browser.

## What nl.html is

`/es/` rendered in Dutch, for Rotterdam, as a **single-language page**. Derived
from `git show db07bb0:es.html` — the reverted third-language commit — by baking
its 96 `data-nl` attributes into the markup and deleting the whole toggle
apparatus: `traducir()`, the pills, the indexed `T` table, `localStorage`,
`?lang`, and every `data-*` attribute.

Consequence worth knowing: **`?lang=` does nothing on this page.** A campaign
link carrying it opens in Dutch, which is correct — the domain already states
the language. `?c=` (which business the link came from) is still read.

## The five blockers

| # | Blocker | Who can clear it |
|---|---|---|
| 1 | Data controller for the Dutch entity is unnamed | Dan — legal declaration, not a guessable string |
| 2 | `/voice/privacidad` 404s on a new domain, and is in Spanish | Dan + whoever writes the Dutch notice |
| 3 | Contact mailto is `@prime-ai.es` — possibly the wrong legal person | Dan |
| 4 | No nginx server block for `prime-ai.nl` | This document, once the domain exists |
| 5 | The Dutch copy has never been read by a native speaker | A native speaker |

### On blocker 2, which is the one that bites quietly

On `prime-ai.es`, **no page names the data controller.** The name, address and
email exist only at `/voice/privacidad`, which is served by a *different repo*
(`Voice_agent/src/demo.ts`, PM2 `prime-voice`) behind `server_name prime-ai.es`.
That is fine there because the route answers 200.

`prime-ai.nl` inherits none of it. Copy the link across unchanged and the page
has **no layer anywhere** that names the controller — not a worse layer, none.
`test-palette.js` cannot catch this: it can only see that the link exists, never
what is on the other side of it. Hence `test-nl-ready.js`.

### On blocker 4, which is the one that breaks the product

The demo imports `/voice/retell.js` and mints through `POST /voice/token`,
**same origin**. On `prime-ai.es` that works because of one line —
`location / { proxy_pass http://127.0.0.1:3023 }`. Without it the script 404s
and the button does not degrade gracefully: there is no call at all.

Verified 2026-08-09: `demo.ts` performs **no `Origin` or `Host` validation** on
`POST /voice/token` (`PUBLIC_ORIGIN` is used only in the boot log, line 1229),
so proxying from a second hostname is sufficient. No backend change needed.

## The nginx block

Not installed. Save as `/etc/nginx/sites-available/prime-ai-nl.conf` and symlink
into `sites-enabled/` once the domain resolves and a certificate exists.

```nginx
# prime-ai.nl — the Dutch landing page. Its own domain and not a /nl/ path on
# prime-ai.es, because the Netherlands is a separate market with a separate
# controller, and a Dutch prospect should not read a .es URL.
server {
    server_name prime-ai.nl www.prime-ai.nl;

    # Apex lands on the page itself. No /es/-style language prefix and no
    # redirect: this domain serves exactly one page in exactly one language,
    # so a prefix would be a directory with nothing to choose between.
    location = / {
        root /var/www/prime-ai-nl;
        index index.html;
    }

    # Same-origin backend for the demo. This is the whole reason the block
    # cannot be a bare static-file server: /voice/retell.js and POST
    # /voice/token must answer on THIS hostname. Same Bun app as prime-ai.es —
    # it does not branch on Host, so one process serves both domains.
    location /voice {
        proxy_pass http://127.0.0.1:3023;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        # Load-bearing, exactly as on prime-ai.es: the app's per-IP rate limit
        # collapses to one shared bucket without this, so the 4th visitor in an
        # hour gets a 429.
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Deliberately NOT `location / { proxy_pass ... }` like prime-ai.es has.
    # That domain proxies everything unmatched to the Bun app because the app
    # owns routes beyond /voice there. Here the only dynamic surface is the
    # demo, so anything else is a 404 rather than a surprise route inherited
    # from another market's app.
    location / {
        root /var/www/prime-ai-nl;
        try_files $uri $uri/ =404;
    }

    listen [::]:443 ssl;
    listen 443 ssl;
    # certbot --nginx -d prime-ai.nl -d www.prime-ai.nl  fills these in.
}

server {
    if ($host = www.prime-ai.nl) { return 301 https://$host$request_uri; }
    if ($host = prime-ai.nl)     { return 301 https://$host$request_uri; }
    server_name prime-ai.nl www.prime-ai.nl;
    listen 80;
    listen [::]:80;
    return 404;
}
```

## Deploy steps, once the gate is green

Deploy from a **copy**, never from `/home/ubuntu/Prime_AI/Landingpage` — that
tree sits on a feature branch and a checkout would silently swap the live page.
Same rule the `prime-ai.es` config states for `/es/` and `/en/`.

```bash
node test-palette.js      # expect OK, 3 pages
node test-roi.js          # expect OK
node test-nl-ready.js     # must be exit 0

sudo mkdir -p /var/www/prime-ai-nl
sudo cp /var/www/prime-ai-nl/index.html \
        /var/www/prime-ai-backups/nl-index.html.bak-$(date +%Y%m%d-%H%M%S)  # if one exists
sudo install -o www-data -g www-data -m 644 nl.html /var/www/prime-ai-nl/index.html
sudo nginx -t && sudo systemctl reload nginx
```

**Verify any backup by diffing it against git before trusting its filename.**

## Verification after deploy

```bash
diff <(curl -s https://prime-ai.nl/) nl.html          # expect no output
curl -s -o /dev/null -w '%{http_code}\n' https://prime-ai.nl/voice/retell.js   # expect 200
curl -s -X POST https://prime-ai.nl/voice/token -H 'content-type: application/json' \
     -d '{"c":"test","lang":"en"}' | head -c 200      # expect a token, not a 404
```

Then, in a browser, press the demo button and confirm a call connects **and
answers in English**. That is not a defect: no Dutch Retell agent is published,
Retell ignores per-call `voice_id`/`language` overrides (`demo.ts:56`), so a
third language is a third *published agent*. The page states this twice before
the button — the panel notice and `T.enLinea` — because pressing the button is
the consent, and a language surprise there cannot be fixed by talking.

Single-language invariants, all enforced by `test-palette.js`:

```bash
command grep -c 'data-en=\|data-nl=' nl.html    # expect 0
command grep -c 'Rotterdam' nl.html             # the 3 market claims must agree
```

Note `command grep`: bare `grep` in this repo is a shell function wrapping ugrep
with `-I`, which silently skips anything `file` calls binary and exits 1 exactly
like a real zero.

## Still deferred

- **The Dutch voice agent.** A third *published* Retell agent — Dutch voice,
  `nl-NL`, translated `GREETING`/prompt. Not a per-call override.
  When it exists: change `lang: 'en'` to `'nl'` in `nl.html`, and also
  `demo.ts:939` (any non-`es` currently maps to the English agent, silently) and
  the `?lang` whitelist at `demo.ts:1164` (en-or-es only, so lead shortlinks
  cannot carry a third language).
- **Native review of the 96 Dutch strings.** Blocker 5.
