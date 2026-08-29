#!/bin/bash
# Photoreal connectors. Same LAW as run_conns.sh: endpoints are the neighbouring
# dives' ACTUAL RENDERED frames, never the stills.
# Index is "real_N" so outputs land at vid/conn_real_N.* and CANNOT overwrite the
# clay conn_0..4.mp4 — that landscape set is gitignored, cost $10.34 and is not
# reproducible for free.
cd /home/ubuntu/Prime_AI/Landingpage/scroll-world && source fal.sh
ORDER=(obra_real cocina_real2 centralita_real agenda_real furgoneta_real demo-film_real2)
for i in ${1:-0 1 2 3 4}; do
  a=${ORDER[$i]}; b=${ORDER[$((i+1))]}
  ffmpeg -v error -y -sseof -0.15 -i "vid/dive_$a.mp4" -frames:v 1 -q:v 2 "frames/${a}_last.png"
  ffmpeg -v error -y -ss 0      -i "vid/dive_$b.mp4" -frames:v 1 -q:v 2 "frames/${b}_first.png"
done
for i in ${1:-0 1 2 3 4}; do
  a=${ORDER[$i]}; b=${ORDER[$((i+1))]}
  gen_conn "real_$i" "frames/${a}_last.png" "frames/${b}_first.png" & sleep 3
done
wait
