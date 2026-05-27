'use server';

import { currentUser } from '@clerk/nextjs/server';
import { db as dynamoDb } from '@/lib/db/dynamodb';
import type { Tick } from '@/lib/types/climbing';

// Server-only persistence actions for real Clerk users.
// These are safe because they run only on the server.
// Client components call them via 'use server' import.

export async function loadPersonalData() {
  const user = await currentUser();
  const enabled = dynamoDb.isEnabled ? dynamoDb.isEnabled() : !!process.env.AWS_ACCESS_KEY_ID;

  if (!user || !enabled) {
    return { source: 'local' as const };
  }

  try {
    const [rawTicks, userData] = await Promise.all([
      dynamoDb.getTicksForUser ? dynamoDb.getTicksForUser(user.id) : Promise.resolve([]),
      dynamoDb.getUserData ? dynamoDb.getUserData(user.id) : Promise.resolve({ wishlist: [], goals: [] }),
    ]);

    return {
      source: 'dynamo' as const,
      ticks: rawTicks as Tick[],
      wishlist: (userData as any)?.wishlist ?? [],
      goals: (userData as any)?.goals ?? [],
    };
  } catch (err) {
    console.error('[Persistence] loadPersonalData failed (falling back to local):', err);
    return { source: 'local' as const };
  }
}

export async function persistTick(tick: any) {
  const user = await currentUser();
  const enabled = dynamoDb.isEnabled ? dynamoDb.isEnabled() : !!process.env.AWS_ACCESS_KEY_ID;

  if (!user || !enabled) return;

  try {
    await dynamoDb.saveTick({ ...tick, userId: user.id });
  } catch (err) {
    console.error('[Persistence] persistTick failed (non-fatal):', err);
  }
}

export async function persistUserProfile(data: { wishlist?: string[]; goals?: any[] }) {
  const user = await currentUser();
  const enabled = dynamoDb.isEnabled ? dynamoDb.isEnabled() : !!process.env.AWS_ACCESS_KEY_ID;

  if (!user || !enabled) return;

  try {
    await dynamoDb.saveUserData(user.id, {
      wishlist: data.wishlist ?? [],
      goals: data.goals ?? [],
    });
  } catch (err) {
    console.error('[Persistence] persistUserProfile failed (non-fatal):', err);
  }
}
