#!/usr/bin/env node
/**
 * CragTrails — Mountain Project → DynamoDB Import Pipeline
 *
 * Streams routes.jsonl line-by-line (no full 130K load into memory),
 * converts to the app's DynamoDB schema, and batch-writes 25 items at a time.
 *
 * Usage:
 *   npx tsx scripts/import-mp-to-dynamo.ts
 *   npx tsx scripts/import-mp-to-dynamo.ts --limit 1000        # dry-run / test
 *   npx tsx scripts/import-mp-to-dynamo.ts --force             # overwrite existing items
 *   npx tsx scripts/import-mp-to-dynamo.ts --limit 500 --force
 *
 * Prerequisites:
 *   1. Table created:  ./scripts/create-mp-table.sh
 *   2. AWS credentials in env:
 *        AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION=us-east-1
 *      (or IAM role / local DynamoDB endpoint via DYNAMODB_ENDPOINT)
 *
 * Local DynamoDB (Docker):
 *   docker run -p 8000:8000 amazon/dynamodb-local
 *   DYNAMODB_ENDPOINT=http://localhost:8000 npx tsx scripts/import-mp-to-dynamo.ts --limit 100
 *
 * Output:
 *   Progress logged every 1000 routes.
 *   Final summary: imported / skipped / errors counts.
 */

import * as fs from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROUTES_FILE =
  process.env.MP_ROUTES_FILE ||
  path.join(process.env.HOME || '/Users/caesar', 'Desktop/mountain-project-scrape/mp_scraper/routes.jsonl');

const TABLE_NAME = 'mp-routes';
const BATCH_SIZE = 25; // DynamoDB hard limit
const LOG_EVERY = 1000;

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const limitArg = args.find((a) => a.startsWith('--limit'));
const LIMIT = limitArg ? parseInt(limitArg.split('=')[1] ?? args[args.indexOf(limitArg) + 1] ?? '0', 10) : 0;

// ---------------------------------------------------------------------------
// Raw MP route shape (from routes.jsonl)
// ---------------------------------------------------------------------------

interface RawMPRoute {
  id: string;
  url: string;
  name: string;
  grade: string;         // e.g. "5.9YDS", "V6YDS"
  type: string;          // e.g. "Trad, 80 ft (24 m)", "Boulder"
  styles?: string[];
  length_ft?: string;
  pitches?: string;
  grade_roman?: string;
  gps_lat?: string;
  gps_lon?: string;
  fa?: string;
  area_path?: string;    // "All Locations > Utah > ..."
  description?: string;
  protection?: string;
  page_views?: string | number;
}

// ---------------------------------------------------------------------------
// App DynamoDB schema
// ---------------------------------------------------------------------------

interface MPRouteItem {
  id: string;
  name: string;
  grade: string;
  type: string;
  lat: number;
  lng: number;
  fa: string;
  area_path: string;
  area_id: string;
  description: string;
  protection: string;
  page_views: number;
  url: string;
  source: 'mountainproject';
  imported_at: string;
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

/**
 * Clean grade: strip trailing "YDS" or other suffixes, trim whitespace.
 * "5.9YDS" → "5.9"   "V6YDS" → "V6"   "5.12aYDS" → "5.12a"
 */
function cleanGrade(raw: string): string {
  if (!raw) return '';
  return raw.replace(/YDS$/i, '').trim();
}

/**
 * Extract primary climb type from the type field.
 * "Trad, 80 ft (24 m)" → "Trad"
 * "Sport" → "Sport"
 * "Boulder" → "Boulder"
 */
function cleanType(raw: string): string {
  if (!raw) return '';
  return raw.split(',')[0].trim();
}

/**
 * Derive area_id from area_path: last non-empty segment, slug-ified.
 * "All Locations > Utah > Joe's Valley > Left Fork" → "left-fork"
 */
function areaIdFromPath(areaPath: string): string {
  if (!areaPath) return 'unknown';
  const segments = areaPath.split('>').map((s) => s.trim()).filter(Boolean);
  const last = segments[segments.length - 1] || 'unknown';
  // Slug: lowercase, replace non-alphanumeric with hyphens, collapse duplicates
  return last
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toNumber(val: string | number | undefined, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function convertRoute(raw: RawMPRoute): MPRouteItem {
  const areaPath = raw.area_path || '';
  return {
    id: raw.id,
    name: raw.name || '',
    grade: cleanGrade(raw.grade),
    type: cleanType(raw.type),
    lat: toNumber(raw.gps_lat),
    lng: toNumber(raw.gps_lon),
    fa: raw.fa || '',
    area_path: areaPath,
    area_id: areaIdFromPath(areaPath),
    description: raw.description || '',
    protection: raw.protection || '',
    page_views: toNumber(raw.page_views),
    url: raw.url || '',
    source: 'mountainproject',
    imported_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// DynamoDB client
// ---------------------------------------------------------------------------

function buildClient(): DynamoDBDocumentClient {
  const endpoint = process.env.DYNAMODB_ENDPOINT;
  const region = process.env.AWS_REGION || 'us-east-1';

  const rawClient = new DynamoDBClient({
    region,
    ...(endpoint ? { endpoint } : {}),
  });

  return DynamoDBDocumentClient.from(rawClient, {
    marshallOptions: { removeUndefinedValues: true },
  });
}

// ---------------------------------------------------------------------------
// Existence check (skip if already imported and --force not set)
// ---------------------------------------------------------------------------

async function itemExists(client: DynamoDBDocumentClient, id: string): Promise<boolean> {
  const result = await client.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
      // Only project the PK — minimise RCU cost
      ProjectionExpression: 'id',
    })
  );
  return !!result.Item;
}

// ---------------------------------------------------------------------------
// Batch write with unprocessed-items retry
// ---------------------------------------------------------------------------

async function batchWrite(client: DynamoDBDocumentClient, items: MPRouteItem[]): Promise<void> {
  let requestItems: Record<string, any[]> = {
    [TABLE_NAME]: items.map((item) => ({ PutRequest: { Item: item } })),
  };

  let attempts = 0;
  const MAX_ATTEMPTS = 5;

  while (Object.keys(requestItems).length > 0 && attempts < MAX_ATTEMPTS) {
    attempts++;
    const response = await client.send(new BatchWriteCommand({ RequestItems: requestItems }));

    const unprocessed = response.UnprocessedItems ?? {};
    if (Object.keys(unprocessed).length === 0) break;

    // Exponential back-off before retry
    const delay = Math.min(100 * Math.pow(2, attempts), 3000);
    await new Promise((res) => setTimeout(res, delay));
    requestItems = unprocessed;
  }

  if (attempts === MAX_ATTEMPTS) {
    throw new Error(`Batch write failed after ${MAX_ATTEMPTS} attempts — unprocessed items remain`);
  }
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

async function main() {
  console.log('CragTrails — Mountain Project → DynamoDB Import');
  console.log(`Source:  ${ROUTES_FILE}`);
  console.log(`Table:   ${TABLE_NAME}`);
  console.log(`Force:   ${FORCE ? 'yes (overwrite existing)' : 'no (skip existing)'}`);
  console.log(`Limit:   ${LIMIT > 0 ? LIMIT : 'none (full import)'}`);
  console.log('');

  // Verify file exists
  if (!fs.existsSync(ROUTES_FILE)) {
    console.error(`ERROR: Routes file not found: ${ROUTES_FILE}`);
    console.error('Set MP_ROUTES_FILE env var to override the default path.');
    process.exit(1);
  }

  // Verify AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID && !process.env.DYNAMODB_ENDPOINT) {
    console.error('ERROR: No AWS credentials found.');
    console.error('Set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY, or');
    console.error('use DYNAMODB_ENDPOINT=http://localhost:8000 for local DynamoDB.');
    process.exit(1);
  }

  const client = buildClient();

  // Counters
  let total = 0;
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const startTime = Date.now();

  // Buffer for current batch
  const batch: MPRouteItem[] = [];

  /**
   * Flush the current batch to DynamoDB.
   * In --force mode: write unconditionally.
   * Otherwise: filter to items not already in the table (GetItem per item — minimal RCU).
   */
  async function flushBatch() {
    if (batch.length === 0) return;

    let toWrite = batch.splice(0); // drain buffer

    if (!FORCE) {
      // Check each item individually; skip existing ones
      const filtered: MPRouteItem[] = [];
      for (const item of toWrite) {
        try {
          const exists = await itemExists(client, item.id);
          if (exists) {
            skipped++;
          } else {
            filtered.push(item);
          }
        } catch (err) {
          console.warn(`[WARN] Existence check failed for ${item.id}: ${err}`);
          filtered.push(item); // attempt write anyway
        }
      }
      toWrite = filtered;
    }

    if (toWrite.length === 0) return;

    try {
      await batchWrite(client, toWrite);
      imported += toWrite.length;
    } catch (err) {
      console.error(`[ERROR] Batch write failed: ${err}`);
      errors += toWrite.length;
    }
  }

  // Stream lines
  const rl = readline.createInterface({
    input: fs.createReadStream(ROUTES_FILE, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Respect --limit
    if (LIMIT > 0 && total >= LIMIT) break;

    total++;

    let raw: RawMPRoute;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      console.warn(`[WARN] Invalid JSON on line ${total}: ${trimmed.slice(0, 80)}…`);
      errors++;
      continue;
    }

    // Skip routes without an id
    if (!raw.id) {
      console.warn(`[WARN] Route on line ${total} has no id — skipping`);
      errors++;
      continue;
    }

    const item = convertRoute(raw);
    batch.push(item);

    // Flush when batch is full
    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
    }

    // Progress logging
    if (total % LOG_EVERY === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = (total / parseFloat(elapsed)).toFixed(0);
      console.log(
        `[${new Date().toISOString()}] Processed ${total.toLocaleString()} | ` +
        `imported=${imported.toLocaleString()} skipped=${skipped.toLocaleString()} errors=${errors} | ` +
        `${rate} routes/s`
      );
    }
  }

  // Flush any remaining items
  await flushBatch();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log('=== Import Complete ===');
  console.log(`Total processed:  ${total.toLocaleString()}`);
  console.log(`Imported:         ${imported.toLocaleString()}`);
  console.log(`Skipped (exists): ${skipped.toLocaleString()}`);
  console.log(`Errors:           ${errors}`);
  console.log(`Elapsed:          ${elapsed}s`);
  console.log('');

  if (errors > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
