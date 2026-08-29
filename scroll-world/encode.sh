#!/bin/bash
# Step 6: encode native res, crf 20, GOP 8, faststart, no audio. Small GOP (not
# all-intra) + blob loading in the engine is what makes scrubbing smooth without
# a 25MB file per clip.
cd /home/ubuntu/Prime_AI/Landingpage/scroll-world
source fal.sh   # solo por SFX
OUT=../assets/scroll/vid; mkdir -p "$OUT"
# Que pelicula se codifica. Los nombres de SALIDA no cambian nunca — world.config.js
# apunta a assets/scroll/vid/obra.mp4 y no tiene por que enterarse de cual de las dos
# tiradas hay detras. La que se despliega es la ultima codificada.
#
#     bash encode.sh            # el diorama de plastilina
#     REAL=1 bash encode.sh     # la tirada fotorrealista
#
# Volver atras es gratis: las dos tiradas siguen en scroll-world/vid/, asi que esto
# es un ffmpeg, no un render.
declare -A SRC=([obra]=obra [cocina]=cocina [centralita]=centralita [agenda]=agenda [furgoneta]=furgoneta [demo]=demo)
CONN=conn
if [ -n "$REAL" ]; then
  SRC=([obra]=obra_real [cocina]=cocina_real2 [centralita]=centralita_real \
       [agenda]=agenda_real [furgoneta]=furgoneta_real [demo]=demo-film_real2)
  CONN=conn_real
fi
enc(){ ffmpeg -v error -y -i "$1" -an -vf "unsharp=5:5:0.8:5:5:0.0" \
  -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$2"; }
for s in obra cocina centralita agenda furgoneta demo; do
  [ -f "vid/dive_${SRC[$s]}$SFX.mp4" ] && enc "vid/dive_${SRC[$s]}$SFX.mp4" "$OUT/$s$SFX.mp4" && echo "$s$SFX $(du -h "$OUT/$s$SFX.mp4"|cut -f1)"
done
for i in 0 1 2 3 4; do
  [ -f "vid/${CONN}_$i$SFX.mp4" ] && enc "vid/${CONN}_$i$SFX.mp4" "$OUT/conn_$i$SFX.mp4" && echo "conn_$i$SFX $(du -h "$OUT/conn_$i$SFX.mp4"|cut -f1)"
done
# Posters from the ACTUAL first frames (kills the ~1% Fal zoom-out mismatch
# between a still-derived poster and the clip's real opening frame).
for s in obra cocina centralita agenda furgoneta demo; do
  [ -f "$OUT/$s$SFX.mp4" ] && ffmpeg -v error -y -ss 0 -i "$OUT/$s$SFX.mp4" -frames:v 1 \
    -vf "scale='if(gt(iw,ih),1536,-2)':'if(gt(iw,ih),-2,1536)'" -q:v 2 "frames/poster_$s$SFX.png" \
    && python3 -c "
from PIL import Image; Image.open('frames/poster_$s$SFX.png').convert('RGB').save('../assets/scroll/still/$s$SFX.webp','WEBP',quality=86,method=6)"
done
echo "posters refreshed from actual frames"
