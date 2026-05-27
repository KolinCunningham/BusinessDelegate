/**
 * CragTrails — Unified Climbing Data Model
 * Merged from OpenBeta (CC0), Mountain Project (historical), TheCrag, and user contributions.
 * Hierarchical Areas + rich Route fields + social entities (Ticks, Photos, ConditionReports).
 *
 * Design goals:
 * - Enable region-wide queries ("all 5.10 trad in Yosemite Valley")
 * - Full provenance & attribution for legal/commercial trust
 * - Support multi-grade systems, rich beta, real-time conditions
 * - Future-proof for TheCrag API (when accessible) + OpenBeta GraphQL sync
 */

export type UUID = string; // Branded in future with branded-types lib if needed

export type ClimbStyle =
  | 'trad'
  | 'sport'
  | 'boulder'
  | 'bigwall'
  | 'aid'
  | 'ice'
  | 'mixed'
  | 'toprope'
  | 'alpine';

export type TickStyle =
  | 'onsight'
  | 'flash'
  | 'redpoint'
  | 'pinkpoint'
  | 'toprope'
  | 'aid'
  | 'attempt'
  | 'solo';

export type RouteCondition =
  | 'dry'
  | 'damp'
  | 'wet'
  | 'icy'
  | 'snow'
  | 'closed'
  | 'beta_update'
  | 'seepage'
  | 'good';

export type DataProvider =
  | 'openbeta'
  | 'mountainproject'
  | 'thecrag'
  | 'user'
  | 'manual'
  | 'guidebook';

export interface SourceAttribution {
  provider: DataProvider;
  externalId?: string;
  url?: string;
  /** Human-readable attribution line, e.g. "CC0 via OpenBeta contributors" */
  attribution: string;
  importedAt: string; // ISO
}

export interface Area {
  id: UUID;
  name: string;
  /** Direct parent for tree traversal. null = top-level region/crag */
  parentId: UUID | null;
  /** Denormalized ancestor path for O(1) "in region" queries (critical for UX) */
  ancestorIds: UUID[];
  country: string;
  stateOrRegion?: string;
  lat: number;
  lng: number;
  /** Approximate bounding box for map clustering */
  bounds?: {
    neLat: number;
    neLng: number;
    swLat: number;
    swLng: number;
  };
  description?: string;
  accessInfo?: string; // Permits, restrictions, approach notes
  bestSeason?: string[]; // e.g. ["Apr", "May", "Sep", "Oct"]
  rockType?: string;
  metadata: {
    sources: SourceAttribution[];
    createdAt: string;
    updatedAt: string;
  };
}

export interface GradeSet {
  yds?: string; // "5.10c" or "5.14a"
  french?: string; // "7a+"
  font?: string; // "6C+"
  vScale?: string; // "V8" for boulders
  aid?: string; // "C2"
  uiaa?: string;
  /** Primary display grade for the app (usually YDS or French) */
  primary: string;
}

export interface Route {
  id: UUID;
  name: string;
  areaId: UUID; // Immediate containing area (El Capitan, not whole Yosemite)
  styles: ClimbStyle[];
  grades: GradeSet;
  lengthMeters?: number;
  pitches?: number;
  /** Free-text or structured gear list. Rich enough for rack calc */
  protection?: string;
  fa?: string; // "Lynn Hill 1993 (FFA). Original: Harding et al. 1958"
  description: string; // Markdown-ready, multi-paragraph beta
  /** Specific hazards (loose rock, R/X, seasonal closures, polished feet) */
  hazards?: string[];
  bestSeason?: string[];
  quality: number; // 0-5 averaged stars from community
  /** First-ascent / historical notes */
  history?: string;
  metadata: {
    sources: SourceAttribution[];
    lastUpdated: string;
    /** For future OpenBeta/TheCrag sync */
    externalRefs: Record<string, string>;
  };
}

export interface Tick {
  id: UUID;
  routeId: UUID;
  /** For demo/seed we use stable pseudonyms; real app = auth user id */
  userId: string;
  userName: string;
  date: string; // ISO date
  style: TickStyle;
  /** Climber's opinion of grade at time of ascent */
  gradeOpinion?: string;
  quality?: number; // 1-5
  notes?: string;
  partners?: string[];
  source?: DataProvider;
}

export interface Photo {
  id: UUID;
  routeId?: UUID;
  areaId?: UUID;
  url: string; // High-res public or signed URL
  thumbnailUrl?: string;
  caption?: string;
  photographer?: string;
  takenAt?: string;
  license: string; // "CC0 OpenBeta" | "Unsplash" | "User upload (CC-BY-NC)"
  metadata: {
    sources: SourceAttribution[];
    width?: number;
    height?: number;
  };
}

export interface ConditionReport {
  id: UUID;
  routeId: UUID;
  reportedAt: string; // ISO
  userId: string;
  userName: string;
  status: RouteCondition;
  /** Short actionable report: "Seep at pitch 3 crux, rest of route bomber" */
  description: string;
  /** Optional: observed grade change, beta note, closure details */
  details?: {
    tempC?: number;
    recentRain?: boolean;
    fixedGearStatus?: string;
  };
}

/** Utility type for building area trees in UI */
export interface AreaTree extends Area {
  children: AreaTree[];
  routes: Route[];
}

/** Source attribution helper for merged records */
export function makeAttribution(
  provider: DataProvider,
  externalId?: string,
  url?: string,
  attribution?: string
): SourceAttribution {
  return {
    provider,
    externalId,
    url,
    attribution: attribution || `${provider} data`,
    importedAt: new Date().toISOString(),
  };
}
