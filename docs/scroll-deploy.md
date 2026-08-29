# scroll-world draft — deploy notes

_Status 2026-08-28: **deployed** at <https://prime-ai.es/scroll/> as a 480p draft,
`noindex, nofollow`, unlinked from anywhere. Not the finished thing._

The page is `scroll.html`: six clay-diorama scenes joined into one continuous
camera flight, scrubbed by scroll position, **and then the whole of `es.html`
underneath it**. Built with the `scroll-world` skill. It is still a **separate
page** — it does not touch `es.html`, and the live
`/var/www/prime-ai/es/index.html` is unchanged by any of this.

## scroll.html se GENERA — no se edita

```bash
node scroll-world/compose.js     # es.html + world.config.js -> scroll.html
node tests/test-scroll-page.js   # comprueba que scroll.html es reproducible
```

`es.html` es la pagina viva y cambia; una copia pegada de sus 170 KB se quedaria
vieja el mismo dia. Por eso hay dos fuentes y un compositor:

| fuente | que hay dentro |
|---|---|
| `es.html` | todo el marketing: calculadora, demo en directo, precios, 4 idiomas |
| `scroll-world/world.config.js` | la copia de las 6 escenas de la pelicula |
| `scroll-world/compose.js` | las junta y escribe `scroll.html` |

Editar `scroll.html` a mano no sirve de nada: el siguiente `compose.js` se lo lleva.
`tests/test-scroll-page.js` falla si alguien lo intenta.

## El relevo (la pelicula se aparta)

Todas las capas del motor son `position:fixed`, asi que sin nada mas la pelicula
se queda pegada a la pantalla para siempre y tapa la pagina de debajo — comprobado:
la seccion esta en el viewport y no se ve. El motor ahora se desvanece en el ultimo
`vh` del track y entrega la pagina.

Dos reglas que cuestan caras si se tocan:

1. **El contenido tiene que ser el hermano SIGUIENTE de `#world`.** Asi es como el
   motor detecta que hay pagina debajo (`nextElementSibling`). Si se mete algo en
   medio, no se aparta y tapa la pagina entera. Solo se activa si hay algo debajo:
   una pagina que sea nada mas la pelicula sigue terminando en su ultimo fotograma.
2. **`overflow-x` va en el `<body>` y nunca en el `<html>`.** Cualquier valor que no
   sea `visible` en la raiz cambia el scrollport y despega el `nav` sticky de
   `es.html`. `clip` tampoco vale. Medido en el navegador: con la regla en la raiz
   `navTop=-1800`, sin ella `navTop=0`.

El fundido va a dos velocidades: el texto de la pelicula se va en el primer 45% del
relevo y la imagen aguanta hasta el final, porque a media opacidad se leian a la vez
el titular de la pelicula y el de la pagina, uno encima del otro.

Los fondos empalman sin parpadeo: `--sw-bg` (#FAF8F5) y el `--paper` de `es.html`
(`oklch(0.9798 0.0045 78.3)`) dan los dos `rgb(250,248,245)` exactos, medido en el
navegador. Si alguien toca uno, tiene que tocar el otro.

## La salida, y por que hace falta

La pelicula dura **14,4 pantallas de scroll** (12.960 px a 900 px de alto): unas 114
muescas de rueda antes de que aparezca la web. Funciona, pero quien solo quiere la
pagina se queda dentro sin saber como salir. Por eso el motor pinta **Saltar a la
web** en la barra de arriba, que salta directo al contenido de debajo. Solo aparece
si hay algo debajo a lo que saltar.

El salto es `behavior:'instant'` a proposito: `es.html` pone `scroll-behavior:smooth`
y un scroll suave de 13.000 px obliga al motor a rebobinar todos los clips por el
camino.

**Acortar la pelicula es gratis** — la distancia de scroll son numeros en
`world.config.js` (`diveScroll`, `connScroll` y el `scroll` de cada escena), no tiene
nada que ver con el video. No hay que volver a renderizar nada.

## @layer: la trampa que solo aparece al componer

El motor metia TODA su hoja en `@layer sw`. Una regla en capa pierde contra
cualquier regla sin capa **pase lo que pase con la especificidad**, asi que al juntarlo
con `es.html` su reset `*{padding:0}` le ganaba a `.sw-topbar{padding:clamp(...)}`:
barra sin padding, pildora del nav aplastada y boton pegado al borde. En la pagina
suelta no se veia, porque no habia otra hoja contra la que perder.

Ahora **solo la primera regla** (los tokens `.sw-root{--sw-*}`) va en la capa, que es
para lo unico que hacia falta: que los tokens del anfitrion manden sobre los valores
por defecto. El resto va sin capa y gana por especificidad como cualquier CSS normal.
Comprobado que la pagina de debajo no cambia: todos sus `oklch` siguen intactos y lo
unico que hereda del motor es el fondo del `body`, que es exactamente el mismo color.

## Rutas relativas: el 404 que en local no se ve

`es.html` se sirve en la raiz (`/`), esta pagina en `/scroll/`. Sus rutas relativas
(`demo-call.mp4`, 22 MB, y su poster) apuntarian a `/scroll/demo-call.mp4` → 404.
En local NO se nota, porque ahi la pagina de prueba esta en la raiz igual que es.html.

`compose.js` las pasa a absolutas en vez de copiar el video: se sirve el mismo
fichero. Lo dice al componer:

```
compose: rutas relativas pasadas a absolutas: demo-call-poster.jpg, demo-call.mp4
```

Lo unico que sigue siendo relativo a proposito es `assets/scroll/...`, que si cuelga
de `/scroll/`. `tests/test-scroll-page.js` falla si aparece cualquier otra.

## Idiomas: la pelicula tambien

Cualquier texto de `world.config.js` acepta `'texto'` o `{es, en, nl, sv}`. El motor
pinta el espanol y cuelga los `data-en` / `data-nl` / `data-sv` al lado. No hace falta
tocar `es.html`: su `traducir()` hace `querySelectorAll('[data-en]')` **cada vez** que
se pulsa una bandera, asi que barre la pelicula con el resto de la pagina.

Tres reglas que hacen que funcione:

1. **Los `data-*` van en la hoja del texto** (`h2`, `p`, `span`, `li`), nunca en un
   envoltorio. `traducir()` reescribe `innerHTML`; colgarlo de `.sw-copy` se llevaria
   por delante todo lo de dentro.
2. **El `<script>` del motor va ANTES del `<script>` de es.html** (lo hace
   `compose.js`). Ese script llama a `traducir()` nada mas cargar; si la pelicula aun
   no existe, sus `data-en` no estan en el DOM y se queda en espanol con la pagina ya
   en ingles. Comprobado en las dos ordenes.
3. **Las banderas de la barra de la pelicula no traducen nada**: pulsan las
   `.idioma-btn` de la pagina de debajo. Un solo sistema de idiomas. La bandera activa
   se sincroniza con un `MutationObserver` sobre su `aria-pressed`, asi sigue siendo
   correcta se pulse arriba o abajo. Si no hay `.idioma-btn` en la pagina, no se
   pintan.

**Los cuatro idiomas completos: 39 cadenas x ES/EN/NL/SV**, ni una suelta.

Sobre el holandes: `tests/test-nl-ready.js` **no** tiene nada que ver con esto. Ese
gate es de `nl.html`, la pagina del mercado holandes en prime-ai.nl, y lo que bloquea
son el responsable del tratamiento, el aviso de privacidad y el nginx de ese dominio.
El selector de idioma de `es.html` es otra cosa: ya sirve **105 cadenas en NL y 105 en
SV en produccion** desde antes de todo esto. Dejar la pelicula en espanol encima de una
pagina en holandes era el estado incoherente, no lo contrario.

El registro se copio del que ya va vivo en `es.html`: la IA es **"haar"** en holandes y
**"den"** en sueco. Si eso cambia en `es.html`, hay que cambiarlo aqui.

Quien revise: el holandes lo puede leer Dan. El sueco esta al mismo nivel que el sueco
que ya se sirve en `es.html` — nadie lo ha revisado en ninguno de los dos sitios.

## La barra de arriba va justa

Las banderas (160 px) y el salto (118 px) llenaron una barra que ya iba llena. A 880 px
el boton de reservar se salia a 1005 px y el `overflow-x:hidden` del body se lo tragaba
**sin dejar rastro**. El nav de escenas se esconde ahora por debajo de 1080 px: es un
adorno, y las banderas, el salto y el CTA no lo son. Comprobado de 861 a 1440 px.

## What is deployed where

```
/var/www/prime-ai/es/scroll/
├── index.html                        # byte-identical to repo scroll.html (GENERADO)
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

## The portrait (9:16) chain, for phones

A phone crops the 16:9 film to ruin. Measured on the live page at 390x844: the clip
is **864x496**, `object-fit:cover` shows **27% of the frame width**, and 39-48% of the
diorama island survives depending on the scene. The island IS the concept.

`object-fit:contain` on the 16:9 clip is not the answer — it gives a 224px band on an
844px screen, with 310px of dead space above and below. The island becomes a stamp.

**The answer is a 9:16 source plus `contain`, and it works because of the background.**
A 390x844 phone is 9:19.5, taller than 9:16, so even a portrait clip does not fill it.
But the gap lands top and bottom, and those edges are already the page colour —
measured on the portrait stills, the top and bottom 8 rows deviate from #FAF8F5 by at
most 14 (sum of |RGB - 250,248,245|; under 10 is invisible). `--sw-bg` is that exact
colour, so the letterbox is not visible and the island survives at **100%** instead of
71-79% under cover. The sides are dirty (up to 142, the island touches them) and it
does not matter: in a taller box the gap is never at the sides.

So: render 9:16, then `object-fit:contain` under a portrait media query. Do NOT ship
the contain rule before the 9:16 clips exist — against the 16:9 clips it makes the
phone strictly worse.

### Running it

`SFX` hangs off the OUTPUT filenames only, never the prompts. Empty (the default) is
the landscape chain byte for byte. The 480p landscape set is NOT in git (.gitignore
excludes it on purpose) and cost $10.34, so a run that overwrote it could not be undone
— hence the suffix rather than a second working directory.

```
SFX=_9x16 IMG_W=1024 IMG_H=1536 bash run_stills.sh
SFX=_9x16 VRATIO=9:16          bash run_dives.sh
SFX=_9x16 VRATIO=9:16          bash run_conns.sh
SFX=_9x16                      bash encode.sh
```

The prompts do not change between landscape and portrait. They already say "floating
as a small rounded island ... centered composition", which is format-agnostic — only
`image_size` on the still call differs.

### What it costs, from the actual logs

| | each | x | total |
|---|---|---|---|
| dive (8s) | $1.131 | 6 | $6.79 |
| connector (5s) | $0.709 | 5 | $3.55 |
| | | | **$10.34** at 480p |

Billing is `w*h*duration*24/1024/1000*rate` — pure pixel count. So 9:16 costs the SAME
as 16:9 at the same tier, and 1080p is ~4.9x either way (~$50).

Stills return no cost field at all; `gpt-image-2` gives you `content_type` and
`file_name` and nulls for the rest. **But the balance is readable**, which is how you
price anything Fal will not itemise — take it before and after and subtract:

    curl -sS -H "Authorization: Key $FAL_KEY" https://rest.alpha.fal.ai/billing/user_balance

Plain number, USD, and it goes **negative** when the account is overdrawn. Worth
checking BEFORE a run: a locked account rejects paid submits with

    403 {"detail":"User is locked. Reason: Exhausted balance."}

and the failure looks like a code problem when it is not. Note that an empty-body submit
is NOT a valid check for this — it renders nothing, so it costs nothing, so the balance
gate lets it through with a 200 and it even reports COMPLETED. Only a job that would
actually cost money gets refused. Read the balance instead.

## Photoreal: what the model will and will not do

**Seedance will not animate an identifiable face.** It will happily *generate* a
photoreal person as a still, then refuse to move them:

    content_policy_violation — "The images or videos provided may contain
    likenesses of real people or other private information"

Measured, not guessed. Same pipeline, same settings, three inputs:

| input still | animates? |
|---|---|
| woman on the phone, face visible in profile | **REJECTED** |
| plumber with head inside the sink cabinet, no face in frame | accepted |
| rooftops at blue hour, no people | accepted |

So photoreal is possible, but the film has to be shot the way a documentary
cameraman shoots someone who has not signed a release: over the shoulder, from
behind, hands only, face turned away or occluded. Write "his face is never visible
at any point" into the prompt explicitly — it is the difference between a clip and
a refusal.

Two things that make this cheap to work with:

- **A content rejection costs $0.** The job runs, fails its input check and bills
  nothing, so probing what the filter accepts is free when the answer is no. Only
  success costs money.
- The rejection arrives as a COMPLETED job with `detail[].type` =
  `content_policy_violation`, NOT as a failed status. Check the response body, not
  the status field.

**Stills cost $0.166 each** (gpt-image-2, 1536x1024), measured by balance delta.
That figure was an open question for three sessions because the response carries no
cost field.

### The flapping 403

After a top-up, `403 "User is locked. Reason: Exhausted balance."` keeps appearing
on *some* submits while others succeed, with a healthy balance. It is stale state on
individual nodes, not the account. Retry the SUBMIT — a failed submit has queued
nothing, so a retry cannot duplicate work.

**Retry on the output FILE existing, never on grepping the log line.** A mis-escaped
grep for the success string cost $2.26 in duplicate renders: the check never matched,
so the loop re-rendered a clip that had already succeeded, three times.

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

## Caché — por qué un despliegue correcto se veía viejo (2026-08-29)

Se desplegaron los once clips fotorrealistas. El servidor los servía correctos —
los md5 de los once por HTTPS coincidían con el build, y una petición con un etag
viejo devolvía `200` con los bytes nuevos — y aun así el navegador seguía pintando
la película de plastilina. Dos veces.

Son **dos** fallos de caché encadenados, y arreglar solo el primero no se nota:

1. `encode.sh` escribe siempre el mismo nombre (`obra.mp4` vale para las dos
   películas). Eso es justo lo que hace que cambiar de película no toque
   `world.config.js` ni `scroll.html` — y también lo que deja al navegador sin
   ninguna señal de que los bytes han cambiado.
   → `compose.js` cuelga `?v=<mtime en base36>` de las 17 rutas al serializar la
   config. Cubre `clip`, `still`, `connectors` y las variantes móviles de una vez.

2. Pero ese sello vive **dentro** del HTML. Nginx no mandaba `Cache-Control` en
   `/scroll/`, solo `etag` + `last-modified`, así que el navegador aplicaba frescura
   **heurística** (~10% de la edad del fichero) y podía no revalidar el documento
   durante horas. Un HTML cacheado nunca llega a pedir las URLs nuevas, así que el
   punto 1 por sí solo no arregla nada.
   → `add_header Cache-Control "no-cache";` en el bloque `location = /scroll/` de
   `/etc/nginx/sites-enabled/prime-ai-demo.conf`. `no-cache` no es "no guardes", es
   "pregunta antes de usarlo": con el etag la respuesta normal es un **304 de 0
   bytes**, no 182 KB. Copia previa en `/var/backups/prime-ai-demo.conf.bak-*`.

**Cómo comprobar un despliegue sin engañarse.** Un navegador headless siempre arranca
sin caché, así que confirma el servidor y **no** lo que ve una persona que ya visitó
la página. La prueba honesta es una **ventana privada**, o `curl` del fichero y mirar
un fotograma:

    curl -sS https://prime-ai.es/scroll/assets/scroll/vid/obra.mp4 -o /tmp/o.mp4
    ffmpeg -y -ss 0 -i /tmp/o.mp4 -frames:v 1 /tmp/o.png

Quien despliega tiene siempre el fichero nuevo en su propia caché, que es
exactamente por qué este fallo es invisible desde ese lado.
