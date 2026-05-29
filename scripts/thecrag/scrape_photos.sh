#!/usr/bin/env bash
# Harvests photo URLs from all scraped route files
# Runs after area scrapers have produced HTML files
export PATH="$PATH:/Users/caesar/Downloads/vibatchium-master/.venv/bin"
BASE="/Users/caesar/Desktop/thecrag_scrape"
LOG="$BASE/scrape.log"
SESSION="tc_photos"

log() { echo "[$(date '+%H:%M:%S')] [photos] $*" | tee -a "$LOG"; }

# Wait for area scrapers to produce some HTML files first
sleep 30

vb --session "$SESSION" start --headless 2>>"$LOG"
vb --session "$SESSION" storage restore --path "$BASE/data/session_cookies.json" 2>>"$LOG"

PHOTO_OUT="$BASE/data/all_photo_urls.txt"
> "$PHOTO_OUT"

# Scan all saved HTML files for image URLs
for HTML_FILE in "$BASE/data/"*.html; do
  [ -f "$HTML_FILE" ] || continue
  grep -oE 'https?://[^"'\'']+\.(jpg|jpeg|png|webp)' "$HTML_FILE" >> "$PHOTO_OUT" 2>/dev/null || true
done

# Also check route JSON files
for ROUTE_FILE in "$BASE/routes/"*.json; do
  [ -f "$ROUTE_FILE" ] || continue
  grep -oE 'https?://[^"'\'']+\.(jpg|jpeg|png|webp)' "$ROUTE_FILE" >> "$PHOTO_OUT" 2>/dev/null || true
done

sort -u "$PHOTO_OUT" > "$BASE/data/photo_urls_unique.txt"
COUNT=$(wc -l < "$BASE/data/photo_urls_unique.txt")
log "Found $COUNT unique photo URLs → $BASE/data/photo_urls_unique.txt"

# Visit each route's photo gallery page to get full-res URLs
# (thecrag photo galleries are at /photos on each route/area page)
GALLERY_COUNT=0
for JSON_FILE in "$BASE/routes/"*.json; do
  [ -f "$JSON_FILE" ] || continue
  URL=$(grep -o '"url": "[^"]*"' "$JSON_FILE" | head -1 | sed 's/"url": "//;s/"//')
  [ -z "$URL" ] && continue

  GALLERY_URL="${URL%/}/photos"
  log "Gallery: $GALLERY_URL"
  vb --session "$SESSION" go "$GALLERY_URL" 2>>"$LOG" || continue
  sleep 1

  GHTML=$(vb --session "$SESSION" html 2>>"$LOG" || echo "")
  echo "$GHTML" | grep -oE 'https?://[^"'\'']+\.(jpg|jpeg|png|webp)' >> "$PHOTO_OUT" 2>/dev/null || true

  GALLERY_COUNT=$((GALLERY_COUNT + 1))
  [ "$GALLERY_COUNT" -ge 100 ] && break  # cap to avoid burning time
done

sort -u "$PHOTO_OUT" > "$BASE/data/photo_urls_unique.txt"
FINAL_COUNT=$(wc -l < "$BASE/data/photo_urls_unique.txt")
log "Final photo URL count: $FINAL_COUNT"

vb --session "$SESSION" stop 2>>"$LOG" || true
