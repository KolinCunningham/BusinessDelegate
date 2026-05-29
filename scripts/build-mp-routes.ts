#!/usr/bin/env node
/**
 * Converts data/mountain-project/routes.jsonl → public/mp-routes.json
 *
 * Filters to routes with valid GPS, sorts by page_views desc,
 * takes top N, converts to LegacyRoute-compatible shape for the map.
 *
 * Usage:
 *   npx tsx scripts/build-mp-routes.ts
 *   npx tsx scripts/build-mp-routes.ts --limit 10000
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'data', 'mountain-project', 'routes.jsonl');
const OUTPUT = path.join(ROOT, 'public', 'mp-routes.json');

const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? parseInt(args[limitArg + 1]) : 3000;

interface MPRaw {
  id: string;
  url: string;
  name: string;
  grade: string;
  type: string;
  styles: string[];
  length_ft: string;
  pitches: string;
  gps_lat: string;
  gps_lon: string;
  fa: string;
  area_path: string;
  description: string;
  protection: string;
  page_views: string;
}

function parseGrade(raw: string): string {
  return raw.replace(/YDS$/i, '').replace(/\s+/g, '').trim() || raw;
}

function parseType(raw: string): 'Sport' | 'Trad' | 'Boulder' | 'Mixed' | 'Ice' | 'Alpine' | 'Toprope' {
  const s = raw.split(',')[0].trim().toLowerCase();
  if (s.includes('boulder')) return 'Boulder';
  if (s.includes('trad')) return 'Trad';
  if (s.includes('sport')) return 'Sport';
  if (s.includes('ice')) return 'Ice';
  if (s.includes('mixed')) return 'Mixed';
  if (s.includes('alpine') || s.includes('snow')) return 'Alpine';
  if (s === 'tr' || s.includes('toprope') || s.includes('top rope')) return 'Toprope';
  return 'Trad';
}

function difficultyColor(grade: string): 'green' | 'yellow' | 'orange' | 'red' | 'purple' {
  const g = grade.toUpperCase().replace(/\s/g, '');
  if (g.startsWith('V')) {
    const n = parseInt(g.slice(1)) || 0;
    if (n <= 2) return 'green';
    if (n <= 5) return 'yellow';
    if (n <= 7) return 'orange';
    if (n <= 9) return 'red';
    return 'purple';
  }
  const m = g.match(/5\.(\d+)([A-D]?)/i);
  if (m) {
    const n = parseInt(m[1]);
    if (n <= 9) return 'green';
    if (n === 10) return 'yellow';
    if (n === 11) return 'orange';
    if (n === 12) return 'red';
    return 'purple';
  }
  return 'green';
}

function extractCrag(areaPath: string): string {
  const parts = areaPath.split('>').map(s => s.trim()).filter(Boolean);
  return parts[parts.length - 1] || 'Unknown';
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function starsFromPageViews(pv: number): number {
  if (pv > 100000) return 5;
  if (pv > 50000) return 4.5;
  if (pv > 20000) return 4;
  if (pv > 5000) return 3.5;
  if (pv > 1000) return 3;
  return 2.5;
}

async function main() {
  console.log(`Reading ${INPUT}...`);

  const raw: Array<MPRaw & { _pv: number }> = [];

  const rl = readline.createInterface({ input: fs.createReadStream(INPUT), crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line.trim()) continue;
    const r: MPRaw = JSON.parse(line);
    const lat = parseFloat(r.gps_lat);
    const lng = parseFloat(r.gps_lon);
    if (!isFinite(lat) || !isFinite(lng) || lat === 0 || lng === 0) continue;
    raw.push({ ...r, _pv: parseInt(r.page_views) || 0 });
  }

  console.log(`${raw.length} routes with valid GPS`);

  raw.sort((a, b) => b._pv - a._pv);
  const top = raw.slice(0, LIMIT);

  const routes = top.map(r => {
    const grade = parseGrade(r.grade);
    const crag = extractCrag(r.area_path);
    const pv = r._pv;
    return {
      id: `mp_${r.id}`,
      name: r.name,
      areaId: `mp_area_${slugify(crag)}`,
      areaName: crag,
      grade,
      type: parseType(r.type),
      lat: parseFloat(r.gps_lat),
      lng: parseFloat(r.gps_lon),
      stars: starsFromPageViews(pv),
      starVotes: pv,
      ticks: Math.round(pv / 50),
      difficultyColor: difficultyColor(grade),
      photoUrl: '',
      photoUrls: [] as string[],
      fa: r.fa || 'Unknown',
      bestConditions: '',
      sources: ['mountainproject'],
      lastUpdated: '2024-01-01T00:00:00Z',
      description: r.description ? r.description.slice(0, 150) : '',
      protection: r.protection || '',
      lengthFt: r.length_ft ? parseInt(r.length_ft) || undefined : undefined,
      pitches: r.pitches ? parseInt(r.pitches) || undefined : undefined,
      url: r.url,
    };
  });

  fs.writeFileSync(OUTPUT, JSON.stringify(routes, null, 0));
  const kb = Math.round(fs.statSync(OUTPUT).size / 1024);
  console.log(`Wrote ${routes.length} routes to ${OUTPUT} (${kb} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
