#!/usr/bin/env bash
# Harvests GPS coordinates from /guide pages of all scraped areas
export PATH="$PATH:/Users/caesar/Downloads/vibatchium-master/.venv/bin"
BASE="/Users/caesar/Desktop/thecrag_scrape"
LOG="$BASE/scrape.log"
SESSION="tc_maps"
GPS_OUT="$BASE/data/gps_coords.csv"

log() { echo "[$(date '+%H:%M:%S')] [maps] $*" | tee -a "$LOG"; }

# Wait for login session to save cookies
sleep 10

vb --session "$SESSION" start --headless 2>>"$LOG"
vb --session "$SESSION" storage restore --path "$BASE/data/session_cookies.json" 2>>"$LOG"

echo "area_name,area_url,lat,lng,guide_url" > "$GPS_OUT"

COUNT=0
for HTML_FILE in "$BASE/data/"*.html; do
  [ -f "$HTML_FILE" ] || continue

  # Get area URL from filename
  SAFE=$(basename "$HTML_FILE" .html)
  AREA_URL=$(grep -oP 'href="https://www\.thecrag\.com[^"]*"' "$HTML_FILE" | head -1 | \
    sed 's/href="//;s/"//' || echo "")

  # Try to reconstruct URL from safe name
  if [ -z "$AREA_URL" ]; then
    AREA_PATH=$(echo "$SAFE" | sed 's/-/\//g;s/^/https:\/\/www.thecrag.com\//')
    AREA_URL="$AREA_PATH"
  fi

  GUIDE_URL="${AREA_URL%/}/guide"
  log "GPS check: $GUIDE_URL"

  vb --session "$SESSION" go "$GUIDE_URL" 2>>"$LOG" || continue
  sleep 1

  GUIDE_HTML=$(vb --session "$SESSION" html 2>>"$LOG" || echo "")

  # Multiple GPS extraction strategies
  LAT=""
  LNG=""

  # Strategy 1: JSON-LD or meta geo tags
  LAT=$(echo "$GUIDE_HTML" | grep -oE '"latitude"[[:space:]]*:[[:space:]]*[-0-9.]+' | head -1 | grep -oE '[-0-9.]+$' || echo "")
  LNG=$(echo "$GUIDE_HTML" | grep -oE '"longitude"[[:space:]]*:[[:space:]]*[-0-9.]+' | head -1 | grep -oE '[-0-9.]+$' || echo "")

  # Strategy 2: Google Maps embed URL
  if [ -z "$LAT" ]; then
    MAPS_URL=$(echo "$GUIDE_HTML" | grep -oE 'maps\.google\.[^"]+' | head -1 || echo "")
    if [ -n "$MAPS_URL" ]; then
      LAT=$(echo "$MAPS_URL" | grep -oE 'q=[-0-9.]+' | sed 's/q=//' || echo "")
      LNG=$(echo "$MAPS_URL" | grep -oE ',[-0-9.]+' | head -1 | sed 's/,//' || echo "")
    fi
  fi

  # Strategy 3: data-lat / data-lng attributes
  if [ -z "$LAT" ]; then
    LAT=$(echo "$GUIDE_HTML" | grep -oE 'data-lat="[-0-9.]+"' | head -1 | grep -oE '[-0-9.]+' || echo "")
    LNG=$(echo "$GUIDE_HTML" | grep -oE 'data-lng="[-0-9.]+"' | head -1 | grep -oE '[-0-9.]+' || echo "")
  fi

  # Get area name from page title
  AREA_NAME=$(vb --session "$SESSION" title 2>>"$LOG" | sed 's/ | theCrag.*//' || echo "$SAFE")

  echo "\"$AREA_NAME\",\"$AREA_URL\",\"$LAT\",\"$LNG\",\"$GUIDE_URL\"" >> "$GPS_OUT"
  log "  $AREA_NAME — lat=$LAT lng=$LNG"

  COUNT=$((COUNT + 1))
  [ "$COUNT" -ge 200 ] && break  # cap
done

log "GPS scrape done — $COUNT areas → $GPS_OUT"
vb --session "$SESSION" stop 2>>"$LOG" || true
