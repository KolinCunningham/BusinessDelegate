#!/usr/bin/env python3
"""Merges all scraped JSON files + tick/GPS data into master output files."""
import json, csv, os, glob, re
from pathlib import Path

BASE = Path("/Users/caesar/Desktop/thecrag_scrape")
ROUTES_DIR = BASE / "routes"
DATA_DIR = BASE / "data"

routes = []

# Load all route JSON files
for f in sorted(ROUTES_DIR.glob("route_*.json")):
    try:
        with open(f) as fp:
            r = json.load(fp)
        routes.append(r)
    except Exception as e:
        print(f"Skip {f.name}: {e}")

# Load GPS data
gps_map = {}
gps_file = DATA_DIR / "gps_coords.csv"
if gps_file.exists():
    with open(gps_file) as fp:
        reader = csv.DictReader(fp)
        for row in reader:
            if row.get("area_url"):
                gps_map[row["area_url"].strip()] = {
                    "lat": row.get("lat", "").strip(),
                    "lng": row.get("lng", "").strip(),
                }

# Load photo URLs
photo_file = DATA_DIR / "photo_urls_unique.txt"
all_photos = set()
if photo_file.exists():
    all_photos = set(photo_file.read_text().splitlines())

# Load tick pages to extract ticked routes
tick_routes = set()
for tick_txt in sorted(DATA_DIR.glob("ticks_page_*.txt")):
    content = tick_txt.read_text(errors="ignore")
    # thecrag tick entries typically show route name + grade
    tick_routes.update(re.findall(r'\b(5\.[0-9]+[a-d+/-]*|V[0-9]+[+-]?|[3-9][abc+/-]+)\b', content))

# Enrich routes with GPS and photo data
for r in routes:
    area_url = r.get("area_url", "")
    if area_url in gps_map:
        r["gps"] = gps_map[area_url]

    # Find matching photos from photo URL list
    route_url = r.get("url", "")
    route_slug = route_url.split("/")[-1] if route_url else ""
    r["photos"] = [p for p in all_photos if route_slug and route_slug in p][:10]

print(f"Total routes: {len(routes)}")
print(f"Routes with GPS: {sum(1 for r in routes if r.get('gps', {}).get('lat'))}")
print(f"Routes with photos: {sum(1 for r in routes if r.get('photos'))}")
print(f"Total unique photo URLs: {len(all_photos)}")

# Write master JSON
master_json = BASE / "routes_master.json"
with open(master_json, "w") as fp:
    json.dump({
        "total_routes": len(routes),
        "total_photos": len(all_photos),
        "routes": routes,
        "all_photo_urls": sorted(all_photos),
    }, fp, indent=2)
print(f"Wrote: {master_json}")

# Write master CSV
master_csv = BASE / "routes_master.csv"
fieldnames = ["name", "grade", "url", "area_url", "lat", "lng", "photo_urls", "scrape_time"]
with open(master_csv, "w", newline="") as fp:
    writer = csv.DictWriter(fp, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for r in routes:
        gps = r.get("gps", {})
        writer.writerow({
            "name": r.get("name", "").strip(),
            "grade": r.get("grade", ""),
            "url": r.get("url", ""),
            "area_url": r.get("area_url", ""),
            "lat": gps.get("lat", ""),
            "lng": gps.get("lng", ""),
            "photo_urls": r.get("photo_urls", ""),
            "scrape_time": r.get("scrape_time", ""),
        })
print(f"Wrote: {master_csv}")

# Also write photo URL list as its own CSV for easy import
photo_csv = BASE / "photos_master.csv"
with open(photo_csv, "w", newline="") as fp:
    writer = csv.writer(fp)
    writer.writerow(["photo_url"])
    for url in sorted(all_photos):
        writer.writerow([url])
print(f"Wrote: {photo_csv}")

print("Done.")
