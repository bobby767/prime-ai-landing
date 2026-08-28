#!/bin/bash
# Remaining 5 dives. Independent of each other (each starts from its own still),
cd /home/ubuntu/Prime_AI/Landingpage/scroll-world
# so unlike architecture A these CAN run concurrently.
source fal.sh
for s in cocina centralita agenda furgoneta demo; do gen_dive "$s" & sleep 3; done
wait
