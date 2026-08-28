#!/bin/bash
# Connectors. THE LAW: endpoints are the neighbouring dives' ACTUAL RENDERED frames,
# never the stills — two renders of "the same" diorama never match, and that
# mismatch is the visible pop at the seam.
cd /home/ubuntu/Prime_AI/Landingpage/scroll-world && source fal.sh
ORDER=(obra cocina centralita agenda furgoneta demo)
for i in 0 1 2 3 4; do
  a=${ORDER[$i]}; b=${ORDER[$((i+1))]}
  ffmpeg -v error -y -sseof -0.15 -i "vid/dive_$a$SFX.mp4" -frames:v 1 -q:v 2 "frames/${a}${SFX}_last.png"
  ffmpeg -v error -y -ss 0      -i "vid/dive_$b$SFX.mp4" -frames:v 1 -q:v 2 "frames/${b}${SFX}_first.png"
done
for i in 0 1 2 3 4; do
  a=${ORDER[$i]}; b=${ORDER[$((i+1))]}
  gen_conn "$i" "frames/${a}${SFX}_last.png" "frames/${b}${SFX}_first.png" & sleep 3
done
wait
