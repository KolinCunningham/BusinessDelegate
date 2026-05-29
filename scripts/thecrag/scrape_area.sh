#!/usr/bin/env bash
# Scrapes a list of area URLs, extracting route names, grades, descriptions, GPS
# Usage: scrape_area.sh <chunk_file> <worker_id>
export PATH="$PATH:/Users/caesar/Downloads/vibatchium-master/.venv/bin"
BASE="/Users/caesar/Desktop/thecrag_scrape"
LOG="$BASE/scrape.log"
CHUNK_FILE="${1:-}"
WORKER_ID="${2:-1}"
SESSION="tc_worker_${WORKER_ID}"

log() { echo "[$(date '+%H:%M:%S')] [worker_${WORKER_ID}] $*" | tee -a "$LOG"; }

if [ -z "$CHUNK_FILE" ] || [ ! -f "$CHUNK_FILE" ]; then
  log "No chunk file — exiting"
  exit 0
fi

vb --session "$SESSION" start --headless 2>>"$LOG"
vb --session "$SESSION" storage restore --path "$BASE/data/session_cookies.json" 2>>"$LOG"

while IFS= read -r AREA_PATH; do
  [ -z "$AREA_PATH" ] && continue

  # Build full URL if path only
  if [[ "$AREA_PATH" != http* ]]; then
    URL="https://www.thecrag.com${AREA_PATH}"
  else
    URL="$AREA_PATH"
  fi

  # Safe filename from URL
  SAFE=$(echo "$URL" | sed 's|https://www.thecrag.com||;s|/|-|g;s|[^a-zA-Z0-9_-]||g')
  OUTFILE="$BASE/routes/${SAFE}.json"

  [ -f "$OUTFILE" ] && log "Skip (already done): $URL" && continue

  log "Scraping area: $URL"
  vb --session "$SESSION" go "$URL" 2>>"$LOG" || { log "Nav failed: $URL"; continue; }
  sleep 2

  # Screenshot
  vb --session "$SESSION" screenshot --path "$BASE/screenshots/${SAFE}.png" 2>>"$LOG" || true

  # Grab text and HTML
  TEXT=$(vb --session "$SESSION" text 2>>"$LOG" || echo "")
  HTML=$(vb --session "$SESSION" html 2>>"$LOG" || echo "")

  # Store raw HTML for later parsing
  echo "$HTML" > "$BASE/data/${SAFE}.html"

  # Also hit the /guide page for GPS
  GUIDE_URL="${URL%/}/guide"
  vb --session "$SESSION" go "$GUIDE_URL" 2>>"$LOG" || true
  sleep 1
  GUIDE_HTML=$(vb --session "$SESSION" html 2>>"$LOG" || echo "")
  GUIDE_TEXT=$(vb --session "$SESSION" text 2>>"$LOG" || echo "")

  # Extract GPS from guide page (lat/lng patterns)
  LAT=$(echo "$GUIDE_HTML" | grep -oE '"latitude"[[:space:]]*:[[:space:]]*[-0-9.]+' | head -1 | grep -oE '[-0-9.]+$' || \
        echo "$GUIDE_HTML" | grep -oE 'lat[itude]*[^-0-9]*[-0-9]{1,3}\.[0-9]+' | head -1 | grep -oE '[-0-9.]+$' || echo "")
  LNG=$(echo "$GUIDE_HTML" | grep -oE '"longitude"[[:space:]]*:[[:space:]]*[-0-9.]+' | head -1 | grep -oE '[-0-9.]+$' || \
        echo "$GUIDE_HTML" | grep -oE 'lng[itude]*[^-0-9]*[-0-9]{1,3}\.[0-9]+' | head -1 | grep -oE '[-0-9.]+$' || echo "")

  # Extract route names (class="name" in list items)
  ROUTES=$(echo "$HTML" | grep -oE 'class="name"[^>]*>[^<]+' | sed 's/class="name"[^>]*>//;s/<.*//' | tr '\n' '|' || echo "")

  # Save structured JSON
  cat > "$OUTFILE" <<EOF
{
  "url": "$URL",
  "scrape_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "worker": "$WORKER_ID",
  "gps": {
    "lat": "$LAT",
    "lng": "$LNG"
  },
  "guide_text": $(echo "$GUIDE_TEXT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo '""'),
  "page_text": $(echo "$TEXT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo '""'),
  "route_names_raw": "$ROUTES"
}
EOF

  log "Saved: $OUTFILE (lat=$LAT, lng=$LNG)"

  # Scrape individual route detail pages within this area
  ROUTE_LINKS=$(echo "$HTML" | grep -oE 'href="(/en/climbing/[^"]+/route[^"]*|[^"]*route[^"]*)"' | \
    sed 's/href="//;s/"//' | sort -u | head -30)

  ROUTE_NUM=0
  while IFS= read -r RPATH; do
    [ -z "$RPATH" ] && continue
    [[ "$RPATH" != http* ]] && RPATH="https://www.thecrag.com${RPATH}"
    RSAFE=$(echo "$RPATH" | sed 's|https://www.thecrag.com||;s|/|-|g;s|[^a-zA-Z0-9_-]||g')
    ROUTEFILE="$BASE/routes/route_${RSAFE}.json"
    [ -f "$ROUTEFILE" ] && continue

    vb --session "$SESSION" go "$RPATH" 2>>"$LOG" || continue
    sleep 1
    RTEXT=$(vb --session "$SESSION" text 2>>"$LOG" || echo "")
    RHTML=$(vb --session "$SESSION" html 2>>"$LOG" || echo "")

    # Extract photo URLs
    PHOTOS=$(echo "$RHTML" | grep -oE '(https?://[^"]+\.(jpg|jpeg|png|webp))' | sort -u | tr '\n' ',' || echo "")

    # Extract grade (common patterns: 5.X, VX, 6a, 7b+, etc)
    GRADE=$(echo "$RTEXT" | grep -oE '\b(5\.[0-9]+[a-d+/-]*|V[0-9]+[+-]?|[3-9][abc+/-]+)\b' | head -1 || echo "")

    # Extract route name from title
    RNAME=$(vb --session "$SESSION" title 2>>"$LOG" | sed 's/ | theCrag.*//' || echo "")

    cat > "$ROUTEFILE" <<EOF
{
  "url": "$RPATH",
  "area_url": "$URL",
  "name": $(echo "$RNAME" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null || echo '""'),
  "grade": "$GRADE",
  "photo_urls": "$PHOTOS",
  "scrape_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "text": $(echo "$RTEXT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo '""')
}
EOF
    ROUTE_NUM=$((ROUTE_NUM + 1))
    log "  Route $ROUTE_NUM: $RNAME ($GRADE)"
  done <<< "$ROUTE_LINKS"

done < "$CHUNK_FILE"

log "Worker $WORKER_ID done."
vb --session "$SESSION" stop 2>>"$LOG" || true
