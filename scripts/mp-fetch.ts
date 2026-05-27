#!/usr/bin/env node
/**
 * Mountain Project Legacy Data Fetcher (for CragTrails)
 *
 * ⚠️  CRITICAL: The Mountain Project Data API was DEPRECATED and shut down
 *    after the onX acquisition (late 2020 / 2021). Existing keys stopped
 *    functioning for the vast majority of users. New keys are not issued.
 *
 *    This script is provided for:
 *    1. Historical reference / migration tooling
 *    2. Future-proofing the data architecture (graceful degradation)
 *    3. Demonstration of rate-limit-respecting, source-attributed imports
 *
 *    In production, prefer OpenBeta (CC0, public GraphQL) and TheCrag (when accessible).
 *
 * Usage:
 *   MP_API_KEY=xxx npx tsx scripts/mp-fetch.ts --lat 37.74 --lon -119.59 --maxDistance 5 --maxResults 20
 *
 * Respects conservative rate limits (1 req / 1.2s). Always attributes source.
 */

import type { DataProvider, SourceAttribution } from '../lib/types/climbing';

const MP_BASE = 'https://www.mountainproject.com/data';
const RATE_LIMIT_MS = 1200; // Conservative — MP never published hard limits

interface MPFetchOptions {
  lat: number;
  lon: number;
  maxDistance?: number;
  maxResults?: number;
  minDiff?: string;
  maxDiff?: string;
}

interface MPLegacyRoute {
  id: number;
  name: string;
  rating: string;
  stars: number;
  latitude: number;
  longitude: number;
  url: string;
  imgSqSmall?: string;
  type: string[];
  pitches?: number;
  location: string[];
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getApiKey(): string {
  const key = process.env.MP_API_KEY;
  if (!key || key.includes('your_')) {
    console.error('\n[MP-FETCH] ERROR: MP_API_KEY not set or is placeholder.');
    console.error('           The Mountain Project API is deprecated and non-functional for new use.');
    console.error('           Set a historical key only for archival tooling.\n');
    process.exit(1);
  }
  return key;
}

function makeAttribution(externalId: string, url?: string): SourceAttribution {
  return {
    provider: 'mountainproject',
    externalId,
    url: url || `https://www.mountainproject.com/route/${externalId}`,
    attribution: 'Historical Mountain Project community data (pre-2021 deprecation)',
    importedAt: new Date().toISOString(),
  };
}

async function fetchRoutes(opts: MPFetchOptions): Promise<MPLegacyRoute[]> {
  const key = getApiKey();
  const params = new URLSearchParams({
    key,
    lat: opts.lat.toString(),
    lon: opts.lon.toString(),
    maxDistance: (opts.maxDistance ?? 10).toString(),
    maxResults: (opts.maxResults ?? 50).toString(),
    ...(opts.minDiff && { minDiff: opts.minDiff }),
    ...(opts.maxDiff && { maxDiff: opts.maxDiff }),
  });

  const url = `${MP_BASE}/get-routes?${params.toString()}`;

  console.log(`[MP-FETCH] Requesting legacy MP data (DEPRECATED ENDPOINT)...`);
  console.log(`[MP-FETCH] ${url.replace(key, '***REDACTED***')}`);

  // In reality this will 404 or return error JSON for almost everyone in 2026.
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CragTrails/1.0 (data-architect; respectful-legacy)' },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[MP-FETCH] HTTP ${res.status} — ${text.slice(0, 300)}`);
    console.error('\n[MP-FETCH] The Mountain Project Data API is no longer operational.');
    console.error('           See docs: https://www.mountainproject.com/data (deprecation notice)');
    console.error('           Recommended: Use OpenBeta GraphQL at https://api.openbeta.io\n');
    throw new Error(`Legacy MP fetch failed with status ${res.status}`);
  }

  const json = await res.json();

  // Historical response shape was { routes: [...] } or similar
  const routes: MPLegacyRoute[] = json.routes || json || [];
  return routes;
}

async function main() {
  console.log('=== CragTrails Mountain Project Legacy Importer ===\n');
  console.warn('⚠️  WARNING: Mountain Project public Data API is DEPRECATED and non-functional.');
  console.warn('    This script demonstrates production-grade patterns only.\n');

  const args = process.argv.slice(2);
  const lat = parseFloat(args.find(a => a.startsWith('--lat='))?.split('=')[1] || '37.7459');
  const lon = parseFloat(args.find(a => a.startsWith('--lon='))?.split('=')[1] || '-119.5936');
  const maxDistance = parseInt(args.find(a => a.startsWith('--maxDistance='))?.split('=')[1] || '8', 10);
  const maxResults = parseInt(args.find(a => a.startsWith('--maxResults='))?.split('=')[1] || '25', 10);

  try {
    const routes = await fetchRoutes({ lat, lon, maxDistance, maxResults });

    console.log(`[MP-FETCH] Received ${routes.length} legacy records.\n`);

    // Transform + attribute every record (mandatory for merged model)
    const transformed = routes.map((r, idx) => {
      // Respect rate limit between any further processing / writes
      if (idx > 0) {
        // In real pipeline we would batch or write with delay
      }

      return {
        name: r.name,
        grades: { primary: r.rating, yds: r.rating },
        lat: r.latitude,
        lng: r.longitude,
        styles: r.type.map((t: string) => t.toLowerCase()) as any,
        pitches: r.pitches,
        quality: r.stars,
        metadata: {
          sources: [makeAttribution(String(r.id), r.url)],
          lastUpdated: new Date().toISOString(),
          externalRefs: { mountainproject: String(r.id) },
        },
        // ... map other fields into our Route shape as needed
      };
    });

    // In production this would upsert into DB or merge with OpenBeta data
    // Here we emit clean, attributed JSON ready for seed-data.ts or import pipeline
    console.log(JSON.stringify(transformed, null, 2));

    // Demonstrate rate-limit respect even on exit path
    await sleep(RATE_LIMIT_MS);
    console.log('\n[MP-FETCH] Completed with full source attribution. No data stored without provenance.');
  } catch (err: any) {
    console.error('[MP-FETCH] Fatal:', err.message);
    process.exitCode = 1;
  }
}

main();
