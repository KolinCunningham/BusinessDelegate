/**
 * CragTrails DynamoDB Adapter (Free Tier Compatible)
 *
 * This provides a thin persistence layer over Amazon DynamoDB.
 * Designed to stay within AWS Always Free Tier.
 *
 * Environment variables needed:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION (e.g. us-east-1)
 *
 * Usage:
 *   import { db } from '@/lib/db/dynamodb'
 *   const ticks = await db.getTicksForUser(userId)
 *
 * Current implementation is minimal but production-ready for small scale.
 * All writes are eventually consistent within free limits.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || 'cragtrails';
const isEnabled = !!process.env.AWS_ACCESS_KEY_ID;

const client = isEnabled
  ? DynamoDBDocumentClient.from(new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    }))
  : null;

export const db = {
  isEnabled,

  async getTicksForUser(userId: string) {
    if (!client) return [];
    const result = await client.send(
      new QueryCommand({
        TableName: `${TABLE_PREFIX}-ticks`,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      })
    );
    return result.Items || [];
  },

  async saveTick(tick: any) {
    if (!client) return;
    await client.send(
      new PutCommand({
        TableName: `${TABLE_PREFIX}-ticks`,
        Item: {
          ...tick,
          updatedAt: new Date().toISOString(),
        },
      })
    );
  },

  async getUserData(userId: string) {
    if (!client) return null;
    const result = await client.send(
      new GetCommand({
        TableName: `${TABLE_PREFIX}-users`,
        Key: { userId },
      })
    );
    return result.Item || { wishlist: [], goals: [] };
  },

  async saveUserData(userId: string, data: { wishlist?: string[]; goals?: any[] }) {
    if (!client) return;
    await client.send(
      new UpdateCommand({
        TableName: `${TABLE_PREFIX}-users`,
        Key: { userId },
        UpdateExpression: 'SET wishlist = :w, goals = :g, updatedAt = :u',
        ExpressionAttributeValues: {
          ':w': data.wishlist || [],
          ':g': data.goals || [],
          ':u': new Date().toISOString(),
        },
      })
    );
  },

  // Add similar methods for photos and condition reports as needed
  // (condition reports can stay global or be sharded)
};

export default db;