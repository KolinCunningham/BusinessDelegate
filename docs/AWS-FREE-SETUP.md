# CragTrails AWS Free Tier Database Setup

**Account ID:** `140023298371`  
**Default Region:** `us-east-1`  
**Target:** Vercel (Next.js Server Actions) + DynamoDB only. No EC2, no ECS, no paid always-on services.

This document is the single source of truth for the **free-for-life** (or as close as AWS realistically allows) persistence layer. It follows the Skeptical CEO governance model: practical, minimal, security-first, and brutally honest about limitations.

## Why DynamoDB + Vercel (and Nothing Else)

- DynamoDB **Always Free Tier** (post-12-month) is genuinely generous: 25 GB storage + 200 million requests/month.
- For a climbing app (even with hundreds of active users logging sends, photos metadata, and condition reports), this is effectively unlimited for years.
- All user-owned data (Ticks, Wishlist, Goals) is naturally partitioned by Clerk `userId`.
- Community data (ConditionReports) uses efficient access patterns.
- Photos = **metadata only**. Image bytes live elsewhere (see below).
- The frontend (and all delightful 10-year-old-friendly UX) stays 100% on Vercel. Zero backend servers to pay for or maintain.

**Anything else (RDS, EC2, ECS Fargate, even "serverless" Aurora) will eventually cost real money or expire.** We reject them.

## Exact DynamoDB Tables (PAY_PER_REQUEST)

All tables use **on-demand billing** (`PAY_PER_REQUEST`). Created with Terraform (recommended) or the updated script.

| Table                        | Partition Key | Sort Key | Purpose                                      | Access Pattern                          |
|------------------------------|---------------|----------|----------------------------------------------|-----------------------------------------|
| `cragtrails-ticks`           | `userId` (S)  | `id` (S) | User ascent logs (Clerk userId owns)        | Query by userId → full personal logbook |
| `cragtrails-users`           | `userId` (S)  | —        | Wishlist (route IDs) + yearly goals         | GetItem by userId                       |
| `cragtrails-condition-reports` | `routeId` (S) | `id` (S) | Community condition / beta reports          | Query by routeId (shown in modals)      |
| `cragtrails-photos`          | `userId` (S)  | `id` (S) | User photo metadata + captions (no bytes)   | Query by userId                         |

**Design notes (practical, not over-engineered):**
- Condition reports use `routeId` as PK because "show conditions for this climb" is the dominant read path in the UI.
- No GSIs initially (adds cost + complexity). Add only when real usage data proves a hot path (e.g. "latest global reports").
- All items carry `createdAt` / `updatedAt` (ISO strings).
- Follows shapes from `lib/types/climbing.ts` (Tick, Photo, ConditionReport) + the legacy shapes still used in `app/page.tsx`.

## Step-by-Step Setup (Your Account: 140023298371)

### 1. Prerequisites
- AWS CLI v2 configured for account `140023298371`
- `aws configure` (or SSO) with permissions to create DynamoDB tables
- Git clone of the repo

### 2. Preferred Path: Terraform (Reproducible & Auditable)

```bash
cd infra/terraform

# Review what will be created
terraform init
terraform plan -var="aws_account_id=140023298371" -var="region=us-east-1"

# Create the tables + get the exact IAM policy
terraform apply -var="aws_account_id=140023298371"
```

Terraform will output:
- Exact table names
- A complete least-privilege IAM policy JSON ready to paste into AWS
- Next-step instructions

**This is the long-term correct approach.** The bash script is a convenience shim.

### 3. Quick Path: Bash Script (Still Uses Your Real Account ID)

```bash
chmod +x scripts/setup-aws-dynamodb.sh
AWS_REGION=us-east-1 ./scripts/setup-aws-dynamodb.sh
```

The script now:
- Hard-codes account `140023298371`
- Uses improved schema for condition reports
- Prints the exact least-privilege policy for your account

### 4. Create the IAM User / Credentials (Least Privilege — Non-Negotiable)

1. AWS Console → IAM → Users → Create user
2. Name: `cragtrails-vercel-prod` (or similar)
3. Attach **only** the policy printed by Terraform or the script (never AdministratorAccess).
4. Create access key (Programmatic access).
5. **Immediately** store the ID + secret. You will never see the secret again.

**Exact minimal policy for 140023298371 (us-east-1 only):**

```json
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
```

### 5. Vercel Environment Variables

In your Vercel project dashboard (or via `vercel env add`):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION=us-east-1`
- `DYNAMODB_TABLE_PREFIX=cragtrails` (optional)

Redeploy after adding. The adapter (`lib/db/dynamodb.ts`) detects credentials automatically and falls back gracefully when missing.

**Security note:** These are long-lived keys. Rotate them every 60–90 days. Future work: replace with OIDC web identity federation so Vercel can assume a role with no static secrets.

## Wiring Real Data (Migration from localStorage)

The improved `lib/db/dynamodb.ts` contains full JSDoc + migration helpers at the bottom.

**Core principles (Skeptical CEO approved):**
- Never break the existing joyful UX (big SEND IT buttons, instant confetti, toasts, 10yo-friendly everything).
- Keep optimistic client state + localStorage as the happy path for logged-in demo users.
- On real Clerk sign-in + Dynamo enabled: hydrate from DB, then write-through on every important action via **Server Actions**.
- One-time migration: on first real login, copy existing localStorage data into the user's Dynamo records (optional, user-initiated).

**High-level pattern (implement in `app/page.tsx` gradually):**

```tsx
// In a Server Action file (e.g. app/actions/logbook.ts)
'use server';
import { saveTick, saveUserData } from '@/lib/db/dynamodb';
import { currentUser } from '@clerk/nextjs/server';

export async function logSend(tickData: any) {
  const user = await currentUser();
  if (!user) throw new Error('Not signed in');
  await saveTick({ ...tickData, userId: user.id, userName: user.fullName || 'Climber' });
  // return success for optimistic UI
}
```

Client side keeps using the same state + effects for delight. Just swap the persistence calls behind the scenes when `db.isEnabled && clerkUser`.

Full concrete migration steps + code snippets live in the comments of `lib/db/dynamodb.ts`.

## Photo Storage Reality Check

DynamoDB items are limited to 400 KB. We store **metadata only** (url, caption, dimensions, routeId, license, photographer, takenAt).

**Realistic free/cheap options for the actual image bytes (in priority order for this project):**

1. **Vercel Blob** (easiest integration, generous free allowance for small apps, then cheap).
2. External free image hosts (temporary, not production-trustworthy).
3. AWS S3 + CloudFront (Standard tier gives 5 GB free for 12 months only, then real cost; use Lifecycle rules + intelligent tiering).
4. User-provided public URLs only (no upload in v1).

**Never store user-uploaded images as base64 in Dynamo or in the main DB.**

The `cragtrails-photos` table is ready the moment you pick an image strategy.

## Production Readiness & Monitoring

- Error handling + typed errors in the adapter (see `DynamoError`).
- All writes include timestamps.
- Batch helpers exist for future bulk ops.
- Tables are tagged for easy filtering in Cost Explorer (even on free tier).
- On Vercel: logs from the adapter appear in the Functions tab.
- Add CloudWatch Alarms only after you have real traffic (throttling on free tier is the main signal).

## Risks & Honest Limitations of the "Free" Setup (CEO Summary)

**Strengths:**
- Truly stays free at small-to-medium scale for a very long time.
- Excellent fit for user-partitioned data + occasional community writes.
- Zero operational burden beyond AWS IAM hygiene.
- Easy to later add paid capacity, global tables, or streams when justified by metrics.

**Real risks / limitations you must accept:**
- **Long-lived IAM keys** are the current weak point (mitigated by the ultra-tight policy + region deny). Plan the OIDC migration.
- **No strong consistency** by default (eventual). Fine for climbing logs and condition reports; add `ConsistentRead: true` on the single-item `users` table reads if you ever need it.
- **Photos/images** require a separate strategy. The "free" story is incomplete without one.
- **Scan on condition-reports** for global "latest" views will become expensive/slow only after you have tens or hundreds of thousands of reports (at which point you are successful enough to pay for a cheap GSI).
- **No built-in full-text search** or complex joins. If you ever need "search all ticks by notes", you will need OpenSearch or similar (paid).
- **Data export / backup** is your responsibility (DynamoDB PITR is cheap but not free; enable only when you have real user data worth protecting).
- **Multi-region / disaster recovery** is not free. For a climbing guide, us-east-1 + regular exports is more than sufficient for years.
- **Clerk user lifecycle** (account deletion) is not yet wired — you will accumulate orphan data over time. Plan a cleanup job later.

This is **not** a toy setup. It is a deliberately minimal, production-capable foundation that refuses to spend money until real usage proves the value.

## Files You Should Know

- `scripts/setup-aws-dynamodb.sh` — personalized quick-start script (Account 140023298371)
- `infra/terraform/main.tf` — the real infrastructure definition (use this)
- `lib/db/dynamodb.ts` — the improved, typed, documented adapter with migration guidance
- `lib/types/climbing.ts` — the source of truth data model
- `docs/DEPLOYMENT.md` — high-level reference (now points here)

## Questions? Governance?

All changes to this setup go through the same Skeptical CEO process as everything else (see `CONTRIBUTING.md` and `AGENTS.md`).

**Built by Skeptical Agents. Free where it makes sense. Paid only when the data proves it is worth it.**

— CragTrails Infrastructure (under Skeptical CEO oversight)