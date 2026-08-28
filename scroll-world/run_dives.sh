#!/bin/bash
# Los 6 dives. Independientes entre si (cada uno arranca de su propio still), asi
# que pueden ir en paralelo.
#
#     bash run_dives.sh                                  # apaisado
#     SFX=_9x16 VRATIO=9:16 bash run_dives.sh            # vertical
#
# Antes decia "los 5 restantes" y se dejaba obra fuera: se habia lanzado a mano en
# la primera tirada y nunca volvio aqui. Con eso, el comando de reproduccion de
# docs/scroll-deploy.md renderizaba 5 de 6 y el conn_0 se quedaba sin su extremo.
cd /home/ubuntu/Prime_AI/Landingpage/scroll-world
source fal.sh
for s in obra cocina centralita agenda furgoneta demo; do gen_dive "$s" & sleep 3; done
wait
