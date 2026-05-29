#!/usr/bin/env bash
# =============================================================================
# theCrag Master Scraper
# Run AFTER connecting VPN. Spins up 8 parallel vb sessions.
# Output: Desktop/thecrag_scrape/data/, routes/, screenshots/
# =============================================================================
set -euo pipefail

export PATH="$PATH:/Users/caesar/Downloads/vibatchium-master/.venv/bin"
BASE="/Users/caesar/Desktop/thecrag_scrape"
LOG="$BASE/scrape.log"
USERNAME="ktcunningham06"
PASSWORD="gazniv-1fodpo-ribRam"
LOGIN_URL="https://www.thecrag.com/en/user/login"
PROFILE_URL="https://www.thecrag.com/en/user/ktcunningham06"
TICKS_URL="https://www.thecrag.com/en/user/ktcunningham06/ticks"

mkdir -p "$BASE/data" "$BASE/screenshots" "$BASE/routes"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

# ---------------------------------------------------------------------------
# STEP 0: Verify IP is clean before burning the 30 min window
# ---------------------------------------------------------------------------
log "=== PREFLIGHT CHECK ==="
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.thecrag.com/en/home" || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
  log "ERROR: Got HTTP $HTTP_CODE from thecrag.com — IP still blocked or site down."
  log "Connect VPN and re-run. Aborting."
  exit 1
fi
log "IP clean — got HTTP 200. Starting scrape."

# ---------------------------------------------------------------------------
# STEP 1: Login with main session
# ---------------------------------------------------------------------------
log "=== LOGIN ==="
vb --session tc_main start --headless 2>>"$LOG"
vb --session tc_main go "$LOGIN_URL" 2>>"$LOG"
sleep 2

# Map the login form
vb --session tc_main map 2>>"$LOG" > "$BASE/data/login_map.txt"

# Fill credentials — try label selectors first, fallback to common field names
vb --session tc_main fill "@label:Username" "$USERNAME" 2>>"$LOG" || \
  vb --session tc_main fill "@placeholder:Username" "$USERNAME" 2>>"$LOG" || \
  vb --session tc_main fill "input[name=username]" "$USERNAME" 2>>"$LOG" || \
  vb --session tc_main fill "#id_username" "$USERNAME" 2>>"$LOG"

vb --session tc_main fill "@label:Password" "$PASSWORD" 2>>"$LOG" || \
  vb --session tc_main fill "@placeholder:Password" "$PASSWORD" 2>>"$LOG" || \
  vb --session tc_main fill "input[name=password]" "$PASSWORD" 2>>"$LOG" || \
  vb --session tc_main fill "#id_password" "$PASSWORD" 2>>"$LOG"

# Submit
vb --session tc_main click "@role:button[name=Login]" 2>>"$LOG" || \
  vb --session tc_main click "@role:button[name=Sign in]" 2>>"$LOG" || \
  vb --session tc_main click "input[type=submit]" 2>>"$LOG" || \
  vb --session tc_main click "button[type=submit]" 2>>"$LOG"

sleep 3

# Verify login worked
CURRENT_URL=$(vb --session tc_main url 2>>"$LOG")
TITLE=$(vb --session tc_main title 2>>"$LOG")
log "After login — URL: $CURRENT_URL | Title: $TITLE"
vb --session tc_main screenshot --path "$BASE/screenshots/after_login.png" 2>>"$LOG"

if echo "$CURRENT_URL" | grep -q "login"; then
  log "ERROR: Still on login page — check credentials or CF challenge appeared"
  vb --session tc_main screenshot --path "$BASE/screenshots/login_failed.png" 2>>"$LOG"
  exit 1
fi
log "Login successful."

# Export session cookies so parallel sessions can reuse them
vb --session tc_main storage export --path "$BASE/data/session_cookies.json" 2>>"$LOG"
log "Session cookies saved."

# ---------------------------------------------------------------------------
# STEP 2: Grab user profile + area list (main session)
# ---------------------------------------------------------------------------
log "=== USER PROFILE ==="
vb --session tc_main go "$PROFILE_URL" 2>>"$LOG"
sleep 2
vb --session tc_main text > "$BASE/data/profile.txt" 2>>"$LOG"
vb --session tc_main screenshot --path "$BASE/screenshots/profile.png" 2>>"$LOG"
vb --session tc_main html > "$BASE/data/profile.html" 2>>"$LOG"

# Extract area links from profile
log "Extracting user area links..."
grep -oE 'href="[^"]*climbing[^"]*"' "$BASE/data/profile.html" | \
  sed 's/href="//;s/"//' | \
  sort -u > "$BASE/data/user_areas.txt" 2>>"$LOG" || true

AREA_COUNT=$(wc -l < "$BASE/data/user_areas.txt" 2>/dev/null || echo 0)
log "Found $AREA_COUNT area links on profile."

# ---------------------------------------------------------------------------
# STEP 3: Scrape tick list (all routes user has climbed)
# ---------------------------------------------------------------------------
log "=== TICK LIST ==="
bash "$BASE/scrape_ticks.sh" &
TICKS_PID=$!
log "Tick scraper running in background (PID $TICKS_PID)"

# ---------------------------------------------------------------------------
# STEP 4: Spin up 6 parallel area scrapers
# ---------------------------------------------------------------------------
log "=== SPINNING UP PARALLEL AREA SCRAPERS ==="

# Split area list into chunks for parallel workers
split -n l/6 "$BASE/data/user_areas.txt" "$BASE/data/areas_chunk_" 2>/dev/null || {
  # If not enough areas, just run 2 workers
  cp "$BASE/data/user_areas.txt" "$BASE/data/areas_chunk_aa"
  touch "$BASE/data/areas_chunk_ab"
}

WORKERS=()
for i in 1 2 3 4 5 6; do
  CHUNK_FILE="$BASE/data/areas_chunk_$(printf '%02d' $i 2>/dev/null || echo "aa")"
  # Find the actual chunk file
  CHUNK=$(ls "$BASE/data/areas_chunk_"* 2>/dev/null | sed -n "${i}p")
  if [ -n "$CHUNK" ] && [ -s "$CHUNK" ]; then
    log "Starting worker $i for chunk: $CHUNK"
    VIBATCHIUM_SESSION="tc_worker_$i" bash "$BASE/scrape_area.sh" "$CHUNK" "$i" &
    WORKERS+=($!)
  fi
done

# Photo harvester (session 7)
bash "$BASE/scrape_photos.sh" &
PHOTOS_PID=$!
log "Photo harvester running (PID $PHOTOS_PID)"

# GPS/maps harvester (session 8)
bash "$BASE/scrape_maps.sh" &
MAPS_PID=$!
log "GPS harvester running (PID $MAPS_PID)"

# ---------------------------------------------------------------------------
# STEP 5: Wait for all workers, then merge
# ---------------------------------------------------------------------------
log "=== WAITING FOR ALL WORKERS ==="
wait $TICKS_PID && log "Ticks done." || log "Ticks worker exited with error."
wait $PHOTOS_PID && log "Photos done." || log "Photos worker exited with error."
wait $MAPS_PID && log "Maps done." || log "Maps worker exited with error."
for PID in "${WORKERS[@]}"; do
  wait "$PID" && log "Worker done." || log "Worker exited with error."
done

# ---------------------------------------------------------------------------
# STEP 6: Merge all data
# ---------------------------------------------------------------------------
log "=== MERGING DATA ==="
python3 "$BASE/merge.py" 2>>"$LOG"

log "=== DONE ==="
log "Output: $BASE/routes_master.json"
log "Output: $BASE/routes_master.csv"
log "Screenshots: $BASE/screenshots/"
