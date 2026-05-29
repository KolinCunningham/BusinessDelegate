#!/bin/bash
#
# CragTrails — Create Mountain Project routes table in DynamoDB
#
# Table: mp-routes
# PK:   id (string) — Mountain Project route ID, e.g. "105942550"
# GSI1: area_id-index  on area_id  (query all routes in an area)
# GSI2: grade-index    on grade    (filter by grade)
#
# Billing: PAY_PER_REQUEST — stays inside AWS Always Free Tier for realistic scale.
#
# Usage:
#   chmod +x scripts/create-mp-table.sh
#   AWS_REGION=us-east-1 ./scripts/create-mp-table.sh
#
# Re-run safe: checks existence before creating.

set -e

REGION=${AWS_REGION:-us-east-1}
TABLE_NAME="mp-routes"

echo "Creating table: $TABLE_NAME in region: $REGION"
echo ""

# Idempotent: skip if table already exists
if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "→ Table $TABLE_NAME already exists — skipping (safe re-run)"
else
  aws dynamodb create-table \
    --table-name "$TABLE_NAME" \
    --region "$REGION" \
    --attribute-definitions \
      AttributeName=id,AttributeType=S \
      AttributeName=area_id,AttributeType=S \
      AttributeName=grade,AttributeType=S \
    --key-schema \
      AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --global-secondary-indexes \
      '[
        {
          "IndexName": "area_id-index",
          "KeySchema": [{"AttributeName": "area_id", "KeyType": "HASH"}],
          "Projection": {"ProjectionType": "ALL"}
        },
        {
          "IndexName": "grade-index",
          "KeySchema": [{"AttributeName": "grade", "KeyType": "HASH"}],
          "Projection": {"ProjectionType": "ALL"}
        }
      ]' \
    --tags Key=Project,Value=CragTrails Key=Environment,Value=Production Key=Source,Value=MountainProject

  echo "✓ Created $TABLE_NAME"
fi

echo ""
echo "✅ mp-routes table ensured in $REGION"
echo ""
echo "Next: run the import pipeline:"
echo "  npx tsx scripts/import-mp-to-dynamo.ts --limit 1000   # test run"
echo "  npx tsx scripts/import-mp-to-dynamo.ts                # full import (~130K routes)"
echo "  npx tsx scripts/import-mp-to-dynamo.ts --force        # re-import / overwrite existing"
echo ""
echo "IAM policy additions needed (add to your existing cragtrails policy or create a new one):"
cat << 'POLICY'
{
  "Effect": "Allow",
  "Action": [
    "dynamodb:PutItem",
    "dynamodb:GetItem",
    "dynamodb:BatchWriteItem",
    "dynamodb:DescribeTable",
    "dynamodb:Query"
  ],
  "Resource": [
    "arn:aws:dynamodb:us-east-1:140023298371:table/mp-routes",
    "arn:aws:dynamodb:us-east-1:140023298371:table/mp-routes/index/*"
  ]
}
POLICY
