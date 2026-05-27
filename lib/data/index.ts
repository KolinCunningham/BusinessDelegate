export * from './seed-data';

import type { Route as CanonicalRoute, SourceAttribution } from '../types/climbing';

/**
 * CLEAN ADAPTER LAYER — Data Integration
 * 
 * Bridges the canonical rich model (lib/types/climbing.ts + lib/data/seed-data.ts)
 * to the running app's view model and UI needs.
 * 
 * - Preserves all send/logbook/wishlist/pyramid features (no breakage to existing flows)
 * - Mandatory source attribution made simple and delightful for cards + modals
 * - 10yo-friendly: attribution is reassuring, never noisy or complex
 * 
 * All functions are pure. No side effects. Designed for easy future swap to real DB.
 */

// Human-friendly short label for visible badges (used in route cards + modals)
export function formatAttribution(sources: SourceAttribution[] | string[] | undefined): string {
  if (!sources || sources.length === 0) return 'Community';
  const labels = (sources as any[]).map((s: any) => {
    if (typeof s === 'string') {
      if (s === 'openbeta') return 'OpenBeta';
      if (s === 'mountainproject') return 'MP';
      if (s === 'thecrag') return 'TheCrag';
      return s;
    }
    // Rich SourceAttribution object
    const p = s.provider;
    if (p === 'openbeta') return 'OpenBeta';
    if (p === 'mountainproject') return 'MP';
    if (p === 'thecrag') return 'TheCrag';
    if (p === 'user') return 'Climbers like you';
    return p || 'Community';
  });
  // Dedupe while preserving order
  const unique = Array.from(new Set(labels));
  return unique.join(' + ');
}

// Short delightful badge text for 10yo-friendly UI (prominent but tiny)
export function getSourceBadge(sources: SourceAttribution[] | string[] | undefined): string {
  const label = formatAttribution(sources);
  if (label.includes('OpenBeta')) return 'OpenBeta';
  if (label.includes('MP')) return 'Community + MP';
  if (label.includes('TheCrag')) return 'TheCrag';
  return label;
}

// Full friendly sentence for modals (trust-building, never scary)
export function getAttributionLine(sources: SourceAttribution[] | string[] | undefined): string {
  const base = formatAttribution(sources);
  return `Sourced from ${base} • Community reviewed`;
}
