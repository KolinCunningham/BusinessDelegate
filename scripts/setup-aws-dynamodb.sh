#!/bin/bash
#
# CragTrails - AWS DynamoDB Free Tier Setup Script
#
# This creates the tables needed for persistent user data (Ticks, Wishlist, Goals, Photos, ConditionReports).
# Everything stays within the AWS Always Free Tier for DynamoDB (25GB storage, 25 RCU/WCU, 200M requests/month).
#
# Requirements:
# - AWS CLI installed and configured (`aws configure`)
# - An AWS account (new accounts get 12-month free tier + Always Free services)
#
# Usage:
#   chmod +x scripts/setup-aws-dynamodb.sh
#   ./scripts/setup-aws-dynamodb.sh
#
# After running:
# 1. Note the table names.
# 2. Create an IAM user with permissions ONLY to these tables (least privilege).
# 3. Add the access keys to Vercel as:
#    AWS_ACCESS_KEY_ID
#    AWS_SECRET_ACCESS_KEY
#    AWS_REGION (e.g. us-east-1)
#
# The app can then use DynamoDB via the AWS SDK from Vercel serverless functions.

set -e

REGION=${AWS_REGION:-us-east-1}
TABLE_PREFIX="cragtrails"

echo "Creating CragTrails DynamoDB tables in region: $REGION (Always Free Tier compatible)"
echo ""

# 1. Ticks table (user sends)
aws dynamodb create-table \
  --table-name "${TABLE_PREFIX}-ticks" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --tags Key=Project,Value=CragTrails Key=Environment,Value=Production

echo "✓ Created ${TABLE_PREFIX}-ticks"

# 2. User profiles / goals / wishlist (simple key-value per user)
aws dynamodb create-table \
  --table-name "${TABLE_PREFIX}-users" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --tags Key=Project,Value=CragTrails

echo "✓ Created ${TABLE_PREFIX}-users"

# 3. Community condition reports (global, not per-user)
aws dynamodb create-table \
  --table-name "${TABLE_PREFIX}-condition-reports" \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --tags Key=Project,Value=CragTrails

echo "✓ Created ${TABLE_PREFIX}-condition-reports"

# 4. User photos (if they want to store metadata; actual images can go to S3 free tier)
aws dynamodb create-table \
  --table-name "${TABLE_PREFIX}-photos" \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=id,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region $REGION \
  --tags Key=Project,Value=CragTrails

echo "✓ Created ${TABLE_PREFIX}-photos"

echo ""
echo "✅ All tables created successfully within AWS Always Free Tier limits."
echo ""
echo "Next steps:"
echo "1. Go to AWS IAM → Create a new user with Programmatic access"
echo "2. Attach a policy that ONLY allows access to the four tables above (use least-privilege JSON)"
echo "3. Add the keys to your Vercel project environment variables"
echo "4. Set AWS_REGION=us-east-1 (or your chosen region)"
echo ""
echo "Example minimal IAM policy (replace ACCOUNT_ID and TABLE_PREFIX):"
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
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/cragtrails-ticks",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/cragtrails-ticks/index/*",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/cragtrails-users",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/cragtrails-condition-reports",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/cragtrails-photos"
      ]
    }
  ]
}
POLICY

echo ""
echo "You can now implement the DynamoDB adapter in the app (see scripts/ or lib/db/)."