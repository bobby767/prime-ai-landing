#!/bin/bash
# Fal backend for the scroll-world chain. Sourced by the run scripts.
WORK=/home/ubuntu/Prime_AI/Landingpage/scroll-world
: "${FAL_MODEL:=bytedance/seedance-2.0/image-to-video}"
: "${FAL_RATE:=0.014}"      # USD per 1k tokens, seedance-2.0
: "${VRES:=480p}"; : "${VRATIO:=16:9}"; : "${DIVE_DUR:=8}"; : "${CONN_DUR:=5}"
# SFX cuelga de los ficheros de SALIDA, nunca de los prompts. Vacio = la cadena 16:9
# de siempre, byte por byte. Con SFX=_9x16 la tirada vertical escribe al lado en vez
# de encima: el juego 480p apaisado no esta en git (.gitignore lo excluye a proposito)
# y costo $10.34 — una tirada que lo pisara no se puede deshacer.
: "${SFX:=}"
# Los stills son otro modelo: gpt-image-2 no hace video y seedance no hace imagenes.
: "${IMG_MODEL:=openai/gpt-image-2}"; : "${IMG_W:=1536}"; : "${IMG_H:=1024}"

fal_img() { # localPng -> inline data URI (JPEG, keeps request small)
  printf 'data:image/jpeg;base64,%s' \
    "$(ffmpeg -v error -y -i "$1" -vf "scale='min(1536,iw)':-2" -q:v 2 -f mjpeg - | base64 | tr -d '\n')"
}
fal_run() { # bodyJson outJson   (never -f on submit: the 422 reason is in the body)
  code=$(curl -sS -X POST "https://queue.fal.run/$FAL_MODEL" \
         -H "Authorization: Key $FAL_KEY" -H "Content-Type: application/json" \
         -d @"$1" -o "$2.sub" -w '%{http_code}')
  if [ "$code" != "200" ]; then
    printf '{"error":"submit HTTP %s","detail":%s}' "$code" "$(jq -Rs . < "$2.sub")" > "$2"; return 1; fi
  # Poll the URLs FAL RETURNS. Do not rebuild them from $FAL_MODEL: fal strips the
  # /image-to-video sub-path, so a reconstructed URL 404s, jq yields an EMPTY status
  # (not "none"), no terminal case matches, and the loop burns its full budget while
  # the job has actually completed. Cost us one 21-minute no-op.
  st=$(jq -r '.status_url' "$2.sub"); rs=$(jq -r '.response_url' "$2.sub")
  for i in $(seq 1 150); do
    s=$(curl -sS -H "Authorization: Key $FAL_KEY" "$st" | jq -r '.status // "none"')
    case "$s" in
      COMPLETED) break ;;
      FAILED|ERROR|none|"") printf '{"error":"status=%s"}' "$s" > "$2"; return 1 ;;
    esac
    sleep 8
  done
  [ "$s" = "COMPLETED" ] || { printf '{"error":"poll timeout, last=%s"}' "$s" > "$2"; return 1; }
  curl -sS -H "Authorization: Key $FAL_KEY" "$rs" > "$2"
}
fal_cost() { # mp4 -> USD, billed off ACTUAL dims not the requested tier
  w=$(ffprobe -v error -select_streams v -show_entries stream=width  -of csv=p=0 "$1")
  h=$(ffprobe -v error -select_streams v -show_entries stream=height -of csv=p=0 "$1")
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")
  awk -v w="$w" -v h="$h" -v d="$d" -v r="$FAL_RATE" 'BEGIN{printf "%.3f",(w*h*d*24/1024)/1000*r}'
}
gen_dive() { # name
  fal_img "$WORK/still/$1$SFX.png" > "$WORK/vid/dive_$1$SFX.uri"
  jq -n --arg p "$(cat "$WORK/prompts/dive_$1.txt")" --rawfile u "$WORK/vid/dive_$1$SFX.uri" \
        --arg r "$VRES" --arg d "$DIVE_DUR" --arg a "$VRATIO" \
    '{prompt:$p,image_url:$u,resolution:$r,duration:$d,aspect_ratio:$a,generate_audio:false}' \
    > "$WORK/vid/dive_$1$SFX.body.json"
  fal_run "$WORK/vid/dive_$1$SFX.body.json" "$WORK/vid/dive_$1$SFX.json" || { echo "dive $1$SFX SUBMIT-FAIL $(jq -c . "$WORK/vid/dive_$1$SFX.json"|cut -c1-200)"; return 1; }
  u=$(jq -r '.video.url // empty' "$WORK/vid/dive_$1$SFX.json")
  [ -z "$u" ] && { echo "dive $1$SFX FAIL $(jq -c . "$WORK/vid/dive_$1$SFX.json"|cut -c1-200)"; return 1; }
  curl -fsSL "$u" -o "$WORK/vid/dive_$1$SFX.mp4"; echo "dive $1$SFX ok \$$(fal_cost "$WORK/vid/dive_$1$SFX.mp4")"
}
gen_conn() { # i startPng endPng
  fal_img "$2" > "$WORK/vid/conn_$1$SFX.s.uri"; fal_img "$3" > "$WORK/vid/conn_$1$SFX.e.uri"
  jq -n --arg p "$(cat "$WORK/prompts/conn_$1.txt")" \
        --rawfile s "$WORK/vid/conn_$1$SFX.s.uri" --rawfile e "$WORK/vid/conn_$1$SFX.e.uri" \
        --arg r "$VRES" --arg d "$CONN_DUR" --arg a "$VRATIO" \
    '{prompt:$p,image_url:$s,end_image_url:$e,resolution:$r,duration:$d,aspect_ratio:$a,generate_audio:false}' \
    > "$WORK/vid/conn_$1$SFX.body.json"
  fal_run "$WORK/vid/conn_$1$SFX.body.json" "$WORK/vid/conn_$1$SFX.json" || { echo "conn $1$SFX SUBMIT-FAIL $(jq -c . "$WORK/vid/conn_$1$SFX.json"|cut -c1-200)"; return 1; }
  u=$(jq -r '.video.url // empty' "$WORK/vid/conn_$1$SFX.json")
  [ -z "$u" ] && { echo "conn $1$SFX FAIL $(jq -c . "$WORK/vid/conn_$1$SFX.json"|cut -c1-200)"; return 1; }
  curl -fsSL "$u" -o "$WORK/vid/conn_$1$SFX.mp4"; echo "conn $1$SFX ok \$$(fal_cost "$WORK/vid/conn_$1$SFX.mp4")"
}

# El paso 1 de la cadena, que hasta ahora se hacia a mano y por eso no se podia
# repetir. Mismo cuerpo que las 6 llamadas de la primera tirada (image_size +
# num_images + prompt), leido de still/obra.body.json.
# OJO: gpt-image-2 NO devuelve coste en la respuesta — no hay campo que leer, ni
# aqui ni en la primera tirada. La cifra real solo esta en el panel de Fal.
gen_still() { # name
  jq -n --arg p "$(cat "$WORK/prompts/still_$1.txt")" \
        --argjson w "$IMG_W" --argjson h "$IMG_H" \
    '{prompt:$p,image_size:{width:$w,height:$h},num_images:1}' \
    > "$WORK/still/$1$SFX.body.json"
  FAL_MODEL="$IMG_MODEL" fal_run "$WORK/still/$1$SFX.body.json" "$WORK/still/$1$SFX.json" \
    || { echo "still $1$SFX SUBMIT-FAIL $(jq -c . "$WORK/still/$1$SFX.json"|cut -c1-200)"; return 1; }
  u=$(jq -r '.images[0].url // empty' "$WORK/still/$1$SFX.json")
  [ -z "$u" ] && { echo "still $1$SFX FAIL $(jq -c . "$WORK/still/$1$SFX.json"|cut -c1-200)"; return 1; }
  curl -fsSL "$u" -o "$WORK/still/$1$SFX.png"
  echo "still $1$SFX ok $(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$WORK/still/$1$SFX.png")"
}
