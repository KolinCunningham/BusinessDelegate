#!/bin/bash
#
# CragTrails - AWS DynamoDB Free Tier Setup Script (Personalized)
#
# User's AWS Account: 140023298371
# Region default: us-east-1 (DynamoDB Always Free Tier applies globally but tables are regional)
#
# Creates 4 tables for persistent user data following lib/types/climbing.ts model:
# - Ticks (user-owned, keyed by Clerk userId)
# - Users (wishlist + goals per Clerk userId)
# - ConditionReports (community/global, queryable per route)
# - Photos (user photo metadata; images stored separately)
#
# Billing: PAY_PER_REQUEST (on-demand) — stays in generous Always Free Tier:
#   25 GB storage + 200M read/write requests/month + 25 RCU/25 WCU provisioned fallback.
#   For a small climbing community app this is effectively free for life at realistic scale.
#
# NO EC2, NO ECS, NO always-on servers. Pure serverless from Vercel -> DynamoDB.
#
# SECURITY: Script outputs a tight least-privilege IAM policy using your real Account ID.
#
# BETTER PRACTICE (recommended): Do not rely on this bash script long-term.
#   Use the Terraform in docs/AWS-FREE-SETUP.md (or infra/terraform/) for reproducibility,
#   drift detection, and team use. Terraform is the skeptical-CEO-approved path here.
#
# Requirements:
# - AWS CLI v2 installed and `aws configure` with credentials for account 140023298371
# - IAM permissions to create DynamoDB tables (or admin for first run)
#
# Usage:
#   chmod +x scripts/setup-aws-dynamodb.sh
#   AWS_REGION=us-east-1 ./scripts/setup-aws-dynamodb.sh
#
# After running:
# 1. Verify tables in AWS Console → DynamoDB (us-east-1)
# 2. Create least-privilege IAM User (or Role) using the printed policy below.
# 3. Add to Vercel (Project Settings → Environment Variables):
#      AWS_ACCESS_KEY_ID=AKIA...
#      AWS_SECRET_ACCESS_KEY=...
#      AWS_REGION=us-east-1
#      DYNAMODB_TABLE_PREFIX=cragtrails
# 4. (Strongly recommended) Rotate keys periodically or migrate to OIDC-federated role.
#
# The improved adapter at lib/db/dynamodb.ts is now production-viable for small scale.

set -e

REGION=${AWS_REGION:-us-east-1}
TABLE_PREFIX="cragtrails"

# Idempotent helper: makes the script safe to re-run (production-ready).
# Checks existence first; never fails on "table already exists".
safe_create_table() {
  local table_name="$1"
  shift
  if aws dynamodb describe-table --table-name "$table_name" --region "$REGION" >/dev/null 2>&1; then
    echo "→ Table $table_name already exists — skipping (safe re-run)"
  else
    aws dynamodb create-table "$@" --region "$REGION" --tags Key=Project,Value=CragTrails Key=Environment,Value=Production
    echo "✓ Created $table_name"
  fi
}

echo "Creating CragTrails DynamoDB tables in region: $REGION (Always Free Tier compatible)"
echo ""

# 1. Ticks table (user sends)
safe_create_table "${TABLE_PREFIX}-ticks" \
  --table-name "${TABLE_PREFIX}-ticks" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# 2. User profiles / goals / wishlist (simple key-value per user)
safe_create_table "${TABLE_PREFIX}-users" \
  --table-name "${TABLE_PREFIX}-users" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# 3. Community condition reports (global/community data)
# Design: PK=routeId + SK=id allows efficient Query for "conditions on this climb"
# (primary access pattern in route modals). Small scans acceptable initially for "latest global".
# Includes userId for moderation/ownership per lib/types/climbing.ts ConditionReport.
safe_create_table "${TABLE_PREFIX}-condition-reports" \
  --table-name "${TABLE_PREFIX}-condition-reports" \
  --attribute-definitions \
    AttributeName=routeId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=routeId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

# 4. User photos metadata (actual image bytes NOT stored in DynamoDB — 400KB item limit + cost)
# Store URLs (S3, Vercel Blob, external CDN, or data: URLs for tiny prototypes).
# PK=userId + SK=id supports per-user photo gallery + "my uploads".
# routeId/areaId attrs allow linking to climbs (per climbing.ts Photo model).
safe_create_table "${TABLE_PREFIX}-photos" \
  --table-name "${TABLE_PREFIX}-photos" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST

echo ""
echo "✅ DynamoDB tables ensured (idempotent) in $REGION within AWS Always Free Tier limits."
echo "   Account: 140023298371 | Tables use PAY_PER_REQUEST (on-demand)."
echo ""
echo "Next steps (least-privilege, security-first):"
echo "1. In AWS Console (IAM) → Users → Create user (Programmatic access)"
echo "2. Attach the EXACT policy printed below (no AdministratorAccess!)"
echo "   - This policy ONLY touches your 4 CragTrails tables in us-east-1."
echo "3. Create access key for the new user → copy ID + Secret."
echo "4. In Vercel dashboard (your project): Settings → Environment Variables → Add:"
echo "     AWS_ACCESS_KEY_ID=AKIA..."
echo "     AWS_SECRET_ACCESS_KEY=..."
echo "     AWS_REGION=us-east-1"
echo "     DYNAMODB_TABLE_PREFIX=cragtrails   (optional, default matches)"
echo "5. Redeploy on Vercel. Then gradually wire lib/db/dynamodb.ts calls (see docs/AWS-FREE-SETUP.md)"
echo ""
echo "LONG-TERM AUTH RECOMMENDATION (Skeptical CEO):"
echo "  Long-lived IAM User keys are a liability. Migrate to:"
echo "  - IAM Role + OIDC trust (Vercel can assume via custom integration or GitHub OIDC)"
echo "  - Or AWS IAM Roles Anywhere if running outside Lambda."
echo "  Rotate keys every 90 days minimum while using this pattern."
echo ""
echo "Example LEAST-PRIVILEGE IAM policy for Account 140023298371 (copy-paste ready):"
cat << 'POLICY'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:140023298371:table/cragtrails-ticks",
        "arn:aws:dynamodb:us-east-1:140023298371:table/cragtrails-ticks/index/*",
        "arn:aws:dynamodb:us-east-1:140023298371:table/cragtrails-users",
        "arn:aws:dynamodb:us-east-1:140023298371:table/cragtrails-condition-reports",
        "arn:aws:dynamodb:us-east-1:140023298371:table/cragtrails-photos"
      ]
    },
    {
      "Effect": "Deny",
      "Action": "dynamodb:*",
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
POLICY

echo ""
echo "Terraform (RECOMMENDED for reproducibility) is documented in docs/AWS-FREE-SETUP.md"
echo "Run it instead of (or after) this script for production-grade infra."
echo ""
echo "You can now improve + wire the DynamoDB adapter (lib/db/dynamodb.ts) + switch from localStorage."
echo "Full step-by-step + migration guide: docs/AWS-FREE-SETUP.md"