# Analytics — Umami, self-hosted

_Set up 2026-08-10._ Before this date the landing page had **no** analytics at all;
the only record of a visit was a line in nginx's shared `access.log`, which cannot
reliably tell prime-ai.es traffic apart from Footfay's (both serve paths under
`/es/`, and the log format carries no `Host` field).

## Where it lives

| Thing | Where |
|---|---|
| Dashboard | <https://analytics.srv1233720.hstgr.cloud> |
| Login | user `admin`, password in `/etc/umami/umami.env` (root, mode 600) |
| Container | `umami`, image `ghcr.io/umami-software/umami:postgresql-latest` (v3.2.0) |
| Listens on | `127.0.0.1:3025` — host networking, `HOSTNAME` pinned so it is NOT publicly bound |
| Database | PostgreSQL `umami`, role `umami` — the Postgres already on this box |
| Website ID | `dd0fa268-a3be-4a04-8dd2-ba5daafba0cf` |
| nginx (dashboard) | `/etc/nginx/sites-available/umami.conf` |
| nginx (collector) | two `location` blocks inside `prime-ai-demo.conf` |

Read the password with:

```sh
sudo grep UMAMI_ADMIN_PASSWORD /etc/umami/umami.env
```

**The default `admin`/`umami` login was rotated during setup** and verified dead
(old password → 401, new → 200). If you ever rebuild the container against a
fresh database, Umami recreates that default — rotate it again before the vhost
goes public.

## Why Umami and not Plausible

Plausible self-hosted requires ClickHouse, a second database engine, for a page
that sees single-digit visits a day. Umami runs on the PostgreSQL that is already
here. Docker matches what the box already does (grafana, n8n, victoriametrics).

## Why the tracker is proxied through prime-ai.es

The page loads `/s/t.js` and posts to `/s/api/send` — **both on prime-ai.es
itself**, proxied by nginx to `127.0.0.1:3025`. Not `analytics.srv…` directly.

A script served from a hostname containing "analytics" is blocked by every major
filter list. The visitors this page is written for are exactly the ones who would
then go uncounted. Same-origin also means no CORS preflight and no third-party
request leaving the page at all, which is what makes the "no cookies, nothing
leaves this server" line in the privacy notice true.

Two **explicit** `location` blocks, never a `/s/` prefix proxy — a prefix would
put the whole Umami app, dashboard and login included, on prime-ai.es.

`/s/api/send` is not a name anyone chose: the tracker hard-codes
`${data-host-url}/api/send`, so only the script's own filename could be renamed.

### X-Forwarded-For is load-bearing

Umami derives country and its daily visitor hash from the client IP. Without
`X-Forwarded-For` on both blocks, every visitor is this server and the dashboard
reads one visitor a day forever.

## The bot filter, and why a test can look like a failure

Umami drops requests whose User-Agent looks like a bot **and still returns HTTP
200**. So "the POST succeeded" proves nothing.

This bit during setup: a Playwright visit fired `/s/api/send`, got 200, and left
no row — because headless Chrome's UA contains `HeadlessChrome`. Isolated by
sending one identical payload under each UA:

```
HeadlessChrome UA -> HTTP 200, NO row
Chrome UA        -> HTTP 200, row stored
```

That filter is the point — it is the thing raw nginx logs could not do. But it
means **you cannot verify this with a headless browser.** Verify with curl and a
normal UA, or a real browser.

## Verifying it still works

```sh
# 1. the script is reachable and is JS, not an HTML error page
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://prime-ai.es/s/t.js
#    expect: 200 application/javascript

# 2. the live page still carries the tag (it is deployed from a COPY, see below).
#    Match the TAG, not the path — the Spanish comment above it names the path
#    too, so a bare `grep -c 's/t.js'` returns 2 and tells you nothing.
curl -s https://prime-ai.es/es/ | grep -c '<script defer src="/s/t.js"'
#    expect: 1

# 3. an event actually lands — 200 alone is not proof, check the row count
sudo -u postgres psql -d umami -tAc 'select count(*) from website_event'
```

## Deploying a page change

The live pages are served from `/var/www/prime-ai/`, **not** from this repo — this
tree sits on a feature branch and a checkout would swap the live pages. To ship an
`es.html` edit:

```sh
sudo cp -a /var/www/prime-ai/es/index.html /var/www/prime-ai/es/index.html.bak-$(date +%Y%m%d-%H%M%S)
sudo install -o www-data -g www-data -m 644 es.html /var/www/prime-ai/es/index.html
```

## Privacy

Umami is cookieless and stores no IP, which is why there is **no consent banner**.
That is disclosed in the privacy notice at `/voice/privacidad`, which is generated
by `Voice_agent/src/demo.ts` (`privacyPageHtml`) and pinned by a test in
`build.test.ts`. If the tracker is ever swapped for one that sets a cookie, that
text becomes false and a banner becomes mandatory.

## Not done

- **`nl.html` has no tag.** It is not deployed and is blocked on other things; it
  would also need its own website entry (different domain) rather than reusing
  this website ID.
- **No `$host` in nginx's log format.** Still worth doing — it would make every
  vhost separable in `access.log` for free — but analytics supersedes it for this
  page's purposes.
- **No goal/event tracking on the demo button.** Umami records the page view, not
  whether anyone pressed "call". Adding it is a `data-umami-event` attribute on
  the button.
