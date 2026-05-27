#!/usr/bin/env node
/**
 * CragTrails Seed Script
 *
 * Usage:
 *   npx tsx scripts/seed.ts                 # Validate + print summary
 *   npx tsx scripts/seed.ts --export-json   # Export full seed to stdout (for pipelines)
 *   npx tsx scripts/seed.ts --stats         # Detailed analytics
 *
 * Production script: validates data integrity, counts, hierarchy integrity,
 * and can be extended to write to DB or generate static JSON for the app.
 */

import { seedData, areas, routes, ticks, photos, conditionReports } from '../lib/data/seed-data';
import type { Area, Route } from '../lib/types/climbing';

const args = process.argv.slice(2);
const doExport = args.includes('--export-json');
const doStats = args.includes('--stats') || args.includes('--statistics');

function validateHierarchy() {
  const areaMap = new Map(areas.map(a => [a.id, a]));
  let errors = 0;

  for (const area of areas) {
    // Parent must exist (if not null)
    if (area.parentId && !areaMap.has(area.parentId)) {
      console.error(`[HIERARCHY ERROR] Area ${area.name} (${area.id}) references missing parent ${area.parentId}`);
      errors++;
    }
    // Ancestor chain validation
    for (const anc of area.ancestorIds) {
      if (!areaMap.has(anc)) {
        console.error(`[HIERARCHY ERROR] ${area.name} has invalid ancestor ${anc}`);
        errors++;
      }
    }
  }
  return errors;
}

function validateRoutes() {
  const areaIds = new Set(areas.map(a => a.id));
  let errors = 0;

  for (const route of routes) {
    if (!areaIds.has(route.areaId)) {
      console.error(`[ROUTE ERROR] Route "${route.name}" references unknown area ${route.areaId}`);
      errors++;
    }
    if (!route.grades.primary) {
      console.warn(`[ROUTE WARN] ${route.name} missing primary grade`);
    }
  }
  return errors;
}

function buildAreaTree(): Area[] {
  const map = new Map<string, any>(areas.map(a => [a.id, { ...a, children: [], directRoutes: [] }]));
  const roots: any[] = [];

  for (const area of areas) {
    const node = map.get(area.id)!;
    if (area.parentId) {
      const parent = map.get(area.parentId);
      if (parent) parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Attach direct routes
  for (const route of routes) {
    const areaNode = map.get(route.areaId);
    if (areaNode) areaNode.directRoutes.push(route);
  }

  return roots;
}

function printSummary() {
  console.log('\n=== CragTrails Seed Data Summary ===\n');
  console.log(`Areas:          ${areas.length} (hierarchical)`);
  console.log(`Routes:         ${routes.length}`);
  console.log(`Ticks (sample): ${ticks.length}`);
  console.log(`Photos:         ${photos.length}`);
  console.log(`ConditionReports: ${conditionReports.length}`);

  const topLevel = areas.filter(a => a.parentId === null).length;
  const withSubs = areas.filter(a => a.parentId !== null).length;
  console.log(`\nHierarchy:      ${topLevel} top-level areas, ${withSubs} child/sub-areas`);

  const styles = new Set<string>();
  routes.forEach(r => r.styles.forEach(s => styles.add(s)));
  console.log(`Climb styles:   ${Array.from(styles).join(', ')}`);

  const avgQuality = (routes.reduce((s, r) => s + r.quality, 0) / routes.length).toFixed(2);
  console.log(`Avg route quality: ${avgQuality} ★`);

  console.log('\nAreas with routes:');
  const routeCountByArea = new Map<string, number>();
  routes.forEach(r => {
    routeCountByArea.set(r.areaId, (routeCountByArea.get(r.areaId) || 0) + 1);
  });

  areas
    .filter(a => routeCountByArea.has(a.id))
    .sort((a, b) => (routeCountByArea.get(b.id)! - routeCountByArea.get(a.id)!))
    .forEach(a => {
      console.log(`  • ${a.name} — ${routeCountByArea.get(a.id)} routes`);
    });

  console.log('\nData provenance (unique sources):');
  const sources = new Set<string>();
  [...areas, ...routes].forEach(item => {
    item.metadata.sources.forEach(s => sources.add(s.provider));
  });
  console.log(`  ${Array.from(sources).join(', ')}`);
  console.log('\n✓ Seed data validated successfully.\n');
}

function printDetailedStats() {
  console.log('\n=== Detailed Statistics ===\n');

  // Hierarchy depth
  const depths = areas.map(a => a.ancestorIds.length);
  console.log(`Max hierarchy depth: ${Math.max(...depths)}`);

  // Routes per style
  const styleCounts: Record<string, number> = {};
  routes.forEach(r => r.styles.forEach(s => (styleCounts[s] = (styleCounts[s] || 0) + 1)));
  console.log('\nRoutes by style:');
  Object.entries(styleCounts).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`  ${s}: ${c}`));

  // Grade distribution (primary)
  console.log('\nGrade samples (primary):');
  routes.slice(0, 8).forEach(r => console.log(`  ${r.name}: ${r.grades.primary}`));

  // Recent condition reports
  console.log('\nRecent condition reports:');
  conditionReports
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt))
    .slice(0, 3)
    .forEach(cr => console.log(`  ${cr.reportedAt.slice(0,10)} — ${cr.status} on ${routes.find(rr => rr.id === cr.routeId)?.name}`));

  console.log('\n');
}

async function main() {
  console.log('CragTrails Seed Runner — Production Data Integrity Check');

  const hierErrors = validateHierarchy();
  const routeErrors = validateRoutes();
  const totalErrors = hierErrors + routeErrors;

  if (totalErrors > 0) {
    console.error(`\n✗ Validation failed with ${totalErrors} error(s).`);
    process.exit(1);
  }

  printSummary();

  if (doStats) printDetailedStats();

  if (doExport) {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      ...seedData,
      areaTree: buildAreaTree(),
    };
    console.log(JSON.stringify(exportPayload, null, 2));
    return;
  }

  // Future: write to DB, generate lib/data/static-seed.json, etc.
  console.log('Ready for import into app or database.\n');
}

main().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
