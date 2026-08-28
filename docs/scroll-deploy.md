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

## Lo que NO habla cuatro idiomas

`es.html` cambia a EN/NL/SV con `traducir()` sobre atributos `data-en`. El motor se
construye su propio DOM desde un objeto JS, asi que `traducir()` no lo alcanza: al
pulsar la bandera inglesa **la pagina se traduce y la pelicula se queda en espanol**.
Comprobado. Escribir esa copia es trabajo de redaccion, no de codigo — y la NL/SV sin
revisar por un nativo esta vetada por `tests/test-nl-ready.js`, asi que no se traduce
a maquina.

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
