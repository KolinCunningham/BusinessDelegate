/**
 * CragTrails DynamoDB Adapter — Production-viable, Always Free Tier
 *
 * SECURITY CRITICAL:
 *   - This module MUST ONLY be imported from Server Actions, Route Handlers, or API routes.
 *   - NEVER import directly in Client Components ('use client'). AWS credentials would leak.
 *   - Recommended: Add `import 'server-only'` at the top of any Server Action that uses this.
 *     (npm i server-only  — tiny zero-runtime dep, worth it for enforcement)
 *
 * Environment (Vercel):
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION=us-east-1
 *   DYNAMODB_TABLE_PREFIX=cragtrails   (optional)
 *
 * Tables (created via scripts/setup-aws-dynamodb.sh or infra/terraform/):
 *   - cragtrails-ticks             (userId PK + id SK)
 *   - cragtrails-users             (userId PK) — wishlist + goals
 *   - cragtrails-condition-reports (routeId PK + id SK) — community data
 *   - cragtrails-photos            (userId PK + id SK) — metadata only
 *
 * All operations use PAY_PER_REQUEST (on-demand). Stays inside AWS Always Free Tier
 * (25 GB + 200M requests/mo) for the lifetime of a small-to-medium climbing community app.
 *
 * Data model: Follows lib/types/climbing.ts (Tick, Photo, ConditionReport) + legacy
 * app/page.tsx shapes for gradual migration. Clerk user.id is the ownership key.
 *
 * Error handling: Never swallows errors silently in production paths. Returns safe defaults
 * when DB disabled (dev/demo mode). Structured logging via console for Vercel logs.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

// Import canonical types (preferred). Legacy Tick/ConditionReport shapes in app/page.tsx
// are close enough for now; adapter normalizes lightly on read where safe.
import type {
  Tick as CanonicalTick,
  Photo as CanonicalPhoto,
  ConditionReport as CanonicalConditionReport,
} from '@/lib/types/climbing';

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'cragtrails';
const REGION = process.env.AWS_REGION || 'us-east-1';

// Singleton client (lazy + safe for serverless)
let client: DynamoDBDocumentClient | null = null;

function getClient(): DynamoDBDocumentClient | null {
  if (client) return client;
  const hasCreds = !!process.env.AWS_ACCESS_KEY_ID;
  if (!hasCreds) {
    console.warn('[DynamoDB] No AWS credentials found. Running in localStorage/demo mode.');
    return null;
  }
  client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: REGION,
      // In production you can add request timeout, retries here for resilience
    })
  );
  return client;
}

export const isDynamoEnabled = () => !!process.env.AWS_ACCESS_KEY_ID;

/** Lightweight error wrapper for consistent Vercel logging + caller handling */
class DynamoError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'DynamoError';
  }
}

function handleError(op: string, err: unknown): never {
  console.error(`[DynamoDB:${op}] Error:`, err);
  throw new DynamoError(`DynamoDB ${op} failed`, op, err);
}

// ============================================================================
// TICKS (user-owned logbook)
// ============================================================================

export async function getTicksForUser(userId: string): Promise<CanonicalTick[]> {
  const c = getClient();
  if (!c || !userId) return [];

  try {
    const result = await c.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}-ticks`,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        // ConsistentRead: true, // only if you need absolute latest (costs more RCUs)
      })
    );
    // Return as-is; UI can map if legacy fields differ
    return (result.Items || []) as CanonicalTick[];
  } catch (err) {
    handleError('getTicksForUser', err);
  }
}

export async function saveTick(tick: Partial<CanonicalTick> & { userId: string; id: string }): Promise<void> {
  const c = getClient();
  if (!c) return;

  const now = new Date().toISOString();
  const item = {
    ...tick,
    createdAt: (tick as any).createdAt || now,
    updatedAt: now,
  };

  try {
    await c.send(
      new PutCommand({
        TableName: `${TABLE_PREFIX}-ticks`,
        Item: item,
        // ConditionExpression can be added for optimistic concurrency if needed
      })
    );
  } catch (err) {
    handleError('saveTick', err);
  }
}

export async function deleteTick(userId: string, id: string): Promise<void> {
  const c = getClient();
  if (!c) return;

  try {
    await c.send(
      new DeleteCommand({
        TableName: `${TABLE_PREFIX}-ticks`,
        Key: { userId, id },
      })
    );
  } catch (err) {
    handleError('deleteTick', err);
  }
}

// ============================================================================
// USER DATA (wishlist + goals + future prefs) — one item per Clerk user
// ============================================================================

export interface UserProfileData {
  wishlist?: string[]; // route IDs
  goals?: Array<{ id: string; label: string; target: number; current: number }>;
  updatedAt?: string;
}

export async function getUserData(userId: string): Promise<UserProfileData> {
  const c = getClient();
  if (!c || !userId) return { wishlist: [], goals: [] };

  try {
    const result = await c.send(
      new GetCommand({
        TableName: `${TABLE_PREFIX}-users`,
        Key: { userId },
        ConsistentRead: true, // cheap for single item
      })
    );
    const item = result.Item as UserProfileData | undefined;
    return item || { wishlist: [], goals: [] };
  } catch (err) {
    handleError('getUserData', err);
  }
}

export async function saveUserData(userId: string, data: UserProfileData): Promise<void> {
  const c = getClient();
  if (!c || !userId) return;

  const now = new Date().toISOString();

  try {
    await c.send(
      new UpdateCommand({
        TableName: `${TABLE_PREFIX}-users`,
        Key: { userId },
        UpdateExpression: 'SET wishlist = :w, goals = :g, updatedAt = :u',
        ExpressionAttributeValues: {
          ':w': data.wishlist ?? [],
          ':g': data.goals ?? [],
          ':u': now,
        },
      })
    );
  } catch (err) {
    handleError('saveUserData', err);
  }
}

// ============================================================================
// CONDITION REPORTS (community / global data)
// ============================================================================

export async function getConditionReportsForRoute(routeId: string): Promise<CanonicalConditionReport[]> {
  const c = getClient();
  if (!c || !routeId) return [];

  try {
    const result = await c.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}-condition-reports`,
        KeyConditionExpression: 'routeId = :rid',
        ExpressionAttributeValues: { ':rid': routeId },
        ScanIndexForward: false, // newest first if you sort SK by time
      })
    );
    return (result.Items || []) as CanonicalConditionReport[];
  } catch (err) {
    handleError('getConditionReportsForRoute', err);
  }
}

export async function saveConditionReport(
  report: Partial<CanonicalConditionReport> & { routeId: string; id: string; userId: string }
): Promise<void> {
  const c = getClient();
  if (!c) return;

  const now = new Date().toISOString();
  const item = {
    ...report,
    reportedAt: report.reportedAt || now,
    createdAt: (report as any).createdAt || now,
    updatedAt: now,
  };

  try {
    await c.send(
      new PutCommand({
        TableName: `${TABLE_PREFIX}-condition-reports`,
        Item: item,
      })
    );
  } catch (err) {
    handleError('saveConditionReport', err);
  }
}

// Optional: lightweight global recent feed (small Scan is fine while table << 1GB; unordered until GSI).
export async function getRecentConditionReports(limit = 20): Promise<CanonicalConditionReport[]> {
  const c = getClient();
  if (!c) return [];

  try {
    // Use Scan for global "recent" feed while table is small (no GSI yet).
    // Limit is best-effort; results are not ordered by time (add GSI + Query when volume justifies).
    const result = await c.send(
      new ScanCommand({
        TableName: `${TABLE_PREFIX}-condition-reports`,
        Limit: limit,
      })
    );
    return (result.Items || []) as CanonicalConditionReport[];
  } catch (err) {
    handleError('getRecentConditionReports', err);
  }
}

// ============================================================================
// PHOTOS (user metadata only — images elsewhere)
// ============================================================================

export async function getPhotosForUser(userId: string): Promise<CanonicalPhoto[]> {
  const c = getClient();
  if (!c || !userId) return [];

  try {
    const result = await c.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}-photos`,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      })
    );
    return (result.Items || []) as CanonicalPhoto[];
  } catch (err) {
    handleError('getPhotosForUser', err);
  }
}

export async function savePhotoMetadata(
  photo: Partial<CanonicalPhoto> & { userId: string; id: string }
): Promise<void> {
  const c = getClient();
  if (!c) return;

  const now = new Date().toISOString();
  const item = {
    ...photo,
    createdAt: (photo as any).createdAt || now,
    updatedAt: now,
  };

  try {
    await c.send(
      new PutCommand({
        TableName: `${TABLE_PREFIX}-photos`,
        Item: item,
      })
    );
  } catch (err) {
    handleError('savePhotoMetadata', err);
  }
}

export async function deletePhoto(userId: string, id: string): Promise<void> {
  const c = getClient();
  if (!c) return;

  try {
    await c.send(
      new DeleteCommand({
        TableName: `${TABLE_PREFIX}-photos`,
        Key: { userId, id },
      })
    );
  } catch (err) {
    handleError('deletePhoto', err);
  }
}

// ============================================================================
// BATCH HELPERS (for future bulk import / moderation flows)
// ============================================================================

export async function batchWriteTicks(items: any[]): Promise<void> {
  const c = getClient();
  if (!c || items.length === 0) return;

  // DynamoDB batch write limit = 25 items per request. Chunk if needed.
  const chunks = [];
  for (let i = 0; i < items.length; i += 25) {
    chunks.push(items.slice(i, i + 25));
  }

  for (const chunk of chunks) {
    const requestItems: any = {
      [`${TABLE_PREFIX}-ticks`]: chunk.map((item) => ({
        PutRequest: { Item: { ...item, updatedAt: new Date().toISOString() } },
      })),
    };

    try {
      await c.send(new BatchWriteCommand({ RequestItems: requestItems }));
    } catch (err) {
      handleError('batchWriteTicks', err);
    }
  }
}

// ============================================================================
// LEGACY COMPAT + MIGRATION HELPERS (for gradual switch from localStorage)
// ============================================================================

/** Returns true when real DB is configured and reachable for the given operation */
export const db = {
  isEnabled: isDynamoEnabled,

  // Back-compat shims (used by early wiring code)
  async getTicksForUser(userId: string) {
    return getTicksForUser(userId);
  },
  async saveTick(tick: any) {
    return saveTick(tick);
  },
  async getUserData(userId: string) {
    return getUserData(userId);
  },
  async saveUserData(userId: string, data: any) {
    return saveUserData(userId, data);
  },
};

export default db;

/**
 * SWITCHING FROM localStorage (see docs/AWS-FREE-SETUP.md for full guide):
 *
 * 1. In Server Actions (or a thin API route):
 *      import { saveTick } from '@/lib/db/dynamodb';
 *      'use server';
 *      export async function logSendAction(tick) {
 *        const { userId } = await currentUser(); // Clerk
 *        await saveTick({ ...tick, userId });
 *      }
 *
 * 2. On client (page.tsx etc):
 *      - Keep local state + optimistic UI for joy (10yo experience)
 *      - On submit, call Server Action which hits real DB
 *      - On load (useEffect), if Clerk signed in + db enabled, hydrate from DB
 *        and optionally merge/migrate old localStorage once.
 *
 * 3. Fallback pattern (recommended):
 *      const useDb = isDynamoEnabled() && !!clerkUserId;
 *      const data = useDb ? await db.get... : localStorage fallback;
 *
 * Never block the UI on DB calls. Always keep the delightful instant feedback.
 */