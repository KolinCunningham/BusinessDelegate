# CragTrails AWS Free-Tier DynamoDB Infrastructure (Terraform)
#
# Account: 140023298371
# Region: us-east-1 (default)
# Billing: PAY_PER_REQUEST (on-demand) — stays inside Always Free Tier forever for realistic usage.
#
# This is the Skeptical-CEO-preferred approach over the bash script:
# - Reproducible
# - Version controlled
# - Easy to extend (add GSIs, TTL, PITR later)
# - No manual drift
#
# Usage:
#   cd infra/terraform
#   terraform init
#   terraform plan -var="aws_account_id=140023298371"
#   terraform apply
#
# Then use the outputs or hard-coded names to configure IAM + Vercel.
#
# Tables exactly match the data model in lib/types/climbing.ts + current app needs
# (user-owned Ticks/Wishlist/Goals/Photos by Clerk userId; community ConditionReports).
#
# NO EC2, Lambda@Edge, or paid services. Pure DynamoDB + Vercel Serverless.

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_account_id" {
  description = "Your AWS Account ID (140023298371 for this CragTrails instance)"
  type        = string
  default     = "140023298371"
}

variable "region" {
  description = "AWS Region (us-east-1 recommended; DynamoDB free tier is regional)"
  type        = string
  default     = "us-east-1"
}

variable "table_prefix" {
  description = "Prefix for all table names (matches DYNAMODB_TABLE_PREFIX env var)"
  type        = string
  default     = "cragtrails"
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "CragTrails"
      Environment = "Production"
      ManagedBy   = "Terraform"
      CostCenter  = "FreeTier"
    }
  }
}

# ============================================================================
# TABLE 1: Ticks — User-owned ascent log (primary: "my logbook")
# ============================================================================
resource "aws_dynamodb_table" "ticks" {
  name         = "${var.table_prefix}-ticks"
  billing_mode = "PAY_PER_REQUEST" # Critical for free tier + auto scaling

  hash_key  = "userId"
  range_key = "id"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  # Future: add GSI on routeId if "who sent this route" becomes hot path
  # (costs extra storage/requests but still free at small scale)

  tags = {
    Description = "User ticks / sends. Keyed by Clerk userId from @clerk/nextjs"
  }
}

# ============================================================================
# TABLE 2: Users — Lightweight per-user profile data (wishlist + goals)
# ============================================================================
resource "aws_dynamodb_table" "users" {
  name         = "${var.table_prefix}-users"
  billing_mode = "PAY_PER_REQUEST"

  hash_key = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Description = "Per-Clerk-user data: wishlist (route IDs), goals, prefs. One item per user."
  }
}

# ============================================================================
# TABLE 3: Condition Reports — Community / global data
# Design supports the #1 access pattern: "conditions for this specific route"
# ============================================================================
resource "aws_dynamodb_table" "condition_reports" {
  name         = "${var.table_prefix}-condition-reports"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "routeId"
  range_key = "id"

  attribute {
    name = "routeId"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  # No GSI yet. For "all recent reports" admin view, occasional Scan is acceptable
  # while table is small (< 25GB free tier). Add GSI on reportedAt later only if proven hot.

  tags = {
    Description = "Community ConditionReport entities (lib/types/climbing.ts). Query by routeId for modals."
  }
}

# ============================================================================
# TABLE 4: Photos — User photo metadata only (NEVER store image bytes here)
# ============================================================================
resource "aws_dynamodb_table" "photos" {
  name         = "${var.table_prefix}-photos"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "userId"
  range_key = "id"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Description = "User-uploaded photo metadata (url, caption, routeId etc). Images live in S3/Blob/CDN."
  }
}

# ============================================================================
# Outputs for easy wiring into Vercel env + IAM policy generation
# ============================================================================
output "table_names" {
  value = {
    ticks              = aws_dynamodb_table.ticks.name
    users              = aws_dynamodb_table.users.name
    condition_reports  = aws_dynamodb_table.condition_reports.name
    photos             = aws_dynamodb_table.photos.name
  }
  description = "Exact table names to use in lib/db/dynamodb.ts and IAM policies"
}

output "least_privilege_iam_policy" {
  value = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:DescribeTable"
        ]
        Resource = [
          "arn:aws:dynamodb:${var.region}:${var.aws_account_id}:table/${aws_dynamodb_table.ticks.name}",
          "arn:aws:dynamodb:${var.region}:${var.aws_account_id}:table/${aws_dynamodb_table.ticks.name}/index/*",
          "arn:aws:dynamodb:${var.region}:${var.aws_account_id}:table/${aws_dynamodb_table.users.name}",
          "arn:aws:dynamodb:${var.region}:${var.aws_account_id}:table/${aws_dynamodb_table.condition_reports.name}",
          "arn:aws:dynamodb:${var.region}:${var.aws_account_id}:table/${aws_dynamodb_table.photos.name}"
        ]
      },
      {
        Effect   = "Deny"
        Action   = "dynamodb:*"
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestedRegion" = var.region
          }
        }
      }
    ]
  })
  description = "Ready-to-attach IAM policy JSON for the IAM User/Role used by Vercel. Uses your real Account ID."
}

output "next_steps" {
  value = <<-EOT
    1. terraform apply completed.
    2. Copy the "least_privilege_iam_policy" output into AWS IAM when creating the user for Vercel.
    3. Set these in Vercel Environment Variables (Production + Preview):
       AWS_REGION=${var.region}
       DYNAMODB_TABLE_PREFIX=${var.table_prefix}
       (plus your AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY from the locked-down IAM user)
    4. See docs/AWS-FREE-SETUP.md for full migration from localStorage + Clerk userId wiring.
    5. (Optional but recommended) Add Point-in-Time Recovery + TTL on old reports later via TF.
  EOT
}