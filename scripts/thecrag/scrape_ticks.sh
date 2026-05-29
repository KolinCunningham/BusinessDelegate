#!/usr/bin/env bash
# Scrapes full tick list (all routes the user has climbed)
export PATH="$PATH:/Users/caesar/Downloads/vibatchium-master/.venv/bin"
BASE="/Users/caesar/Desktop/thecrag_scrape"
LOG="$BASE/scrape.log"
SESSION="tc_ticks"

log() { echo "[$(date '+%H:%M:%S')] [ticks] $*" | tee -a "$LOG"; }

vb --session "$SESSION" start --headless 2>>"$LOG"
vb --session "$SESSION" storage restore --path "$BASE/data/session_cookies.json" 2>>"$LOG"

PAGE=1
ALL_TICKS=()

while true; do
  URL="https://www.thecrag.com/en/user/ktcunningham06/ticks?page=$PAGE"
  log "Scraping ticks page $PAGE — $URL"
  vb --session "$SESSION" go "$URL" 2>>"$LOG"
  sleep 2

  HTML=$(vb --session "$SESSION" html 2>>"$LOG")
  TEXT=$(vb --session "$SESSION" text 2>>"$LOG")

  echo "$TEXT" > "$BASE/data/ticks_page_${PAGE}.txt"
  echo "$HTML" > "$BASE/data/ticks_page_${PAGE}.html"
  vb --session "$SESSION" screenshot --path "$BASE/screenshots/ticks_p${PAGE}.png" 2>>"$LOG"

  # Check if there's a next page
  if ! echo "$HTML" | grep -q 'rel="next"\|page=[0-9]*.*next\|Next page'; then
    log "No more tick pages after page $PAGE"
    break
  fi

  PAGE=$((PAGE + 1))
  # Safety cap — don't loop forever
  if [ "$PAGE" -gt 50 ]; then
    log "Hit 50 page cap on ticks"
    break
  fi
done

log "Tick scrape done — $PAGE pages"
vb --session "$SESSION" stop 2>>"$LOG" || true
