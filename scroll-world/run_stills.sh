#!/bin/bash
# Paso 1 de la cadena: los 6 stills de los que arrancan los dives.
#
#     bash run_stills.sh                      # 1536x1024, el juego apaisado
#     SFX=_9x16 IMG_W=1024 IMG_H=1536 bash run_stills.sh
#
# La primera tirada se hizo a mano y por eso no se podia repetir; esto es la misma
# llamada que quedo grabada en still/obra.body.json, con las medidas por variable.
# Los prompts NO cambian entre apaisado y vertical: dicen "floating as a small
# rounded island ... centered composition", que es lo mismo en los dos formatos.
cd /home/ubuntu/Prime_AI/Landingpage/scroll-world
source fal.sh
for s in obra cocina centralita agenda furgoneta demo; do gen_still "$s" & sleep 3; done
wait
