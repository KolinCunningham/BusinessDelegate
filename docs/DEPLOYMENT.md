# Deployment Guide

This guide explains how to deploy CragTrails to production (Vercel recommended) and keep it running smoothly.

## Recommended: One-Click Deploy to Vercel

The fastest way to get a live version:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKolinCunningham%2Fcragtrails)

After clicking:
1. Vercel will automatically fork the repo and start building.
2. In ~1-2 minutes you'll get a public URL like `https://cragtrails-abc123.vercel.app`.
3. Update this README with your new live URL and commit.

**Current official live site:** https://cragtrails.vercel.app

## Manual Deployment (Vercel CLI)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link the project (first time only)
vercel link

# 4. Deploy
vercel --prod
```

## Environment Variables

CragTrails is designed to work with zero environment variables for the basic demo.

For future features you will likely need:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Your production domain (e.g. `https://cragtrails.app`) | Recommended |
| `DATABASE_URL` | Postgres connection string (for real user data) | Future |
| `CLERK_SECRET_KEY` | Clerk authentication secret | Future (auth) |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Future (auth) |

Add these in the Vercel dashboard under **Settings → Environment Variables**.

## Custom Domain (Recommended for Production)

The project is already prepared for a custom domain (see `metadataBase` in `app/layout.tsx` which points at `https://cragtrails.app`).

### Recommended Domain
- `cragtrails.app` (clean and brandable)
- Or `app.cragtrails.app` if you want to keep the apex for something else

### Step-by-step

1. **Buy the domain**
   - Recommended registrars: Namecheap, Cloudflare, or Porkbun (good prices + easy DNS).
   - Get `cragtrails.app` if available.

2. **Add the domain in Vercel**
   - Go to your Vercel project → **Settings → Domains**
   - Enter your domain (e.g. `cragtrails.app` or `www.cragtrails.app`)
   - Click **Add**

3. **Configure DNS**
   Vercel will show you exactly what to add. Common options:
   - **For apex domain** (`cragtrails.app`): Use Vercel’s nameservers (best) **or** add the A records they provide.
   - **For subdomain** (`app.cragtrails.app`): Usually just one `CNAME` record pointing to `cname.vercel-dns.com`.

4. **Wait for propagation** (usually 5–30 minutes, sometimes up to a few hours).

5. **Vercel will automatically provision HTTPS** (no extra work needed).

### Project-Specific Gotchas

**1. Update environment variables (important)**
In Vercel → **Settings → Environment Variables**, set:
```
NEXT_PUBLIC_APP_URL=https://cragtrails.app
```
(Replace with your actual domain)

**2. Clerk Authentication**
Since you’re using Clerk (Apple, Google, Facebook, Email login):
- Go to your Clerk dashboard → **Settings → Domains**
- Add your production domain (e.g. `https://cragtrails.app`)
- Also add it under **Allowed origins** / **Redirect URLs** if prompted.

**3. Metadata & SEO**
The app already has `metadataBase: new URL("https://cragtrails.app")` in `app/layout.tsx`.  
Once your custom domain is live and verified, you can leave it as-is (or update it if you chose a different domain).

**4. Update references (after domain is live)**
- Update the live link in `README.md`
- Update any social/og image URLs if you have custom ones

---

## Free "For Life" Database on AWS (Optional but Recommended for Real Users)

The app currently uses localStorage + demo profiles for user data (ticks, wishlist, goals, condition reports). For real persistence across devices + real Clerk-authenticated users (userId as ownership key), add a backend.

**Strongly recommended (and the only realistic "free for life") option:**

- **Amazon DynamoDB** (AWS Always Free Tier — **not** the 12-month new-account tier)
  - 25 GB of storage
  - 200 million read/write requests per month
  - 25 RCU + 25 WCU provisioned (fallback)
  - More than enough for years of a healthy small climbing community app.

- Everything else stays on Vercel (Server Actions / serverless functions call DynamoDB directly). **Zero always-on servers, zero EC2/ECS/Lambda cold-start costs.**

- Tables follow the canonical model in `lib/types/climbing.ts` (Ticks, Photos, ConditionReport + user wishlist/goals).

**Your Account ID for all policies and Terraform: `140023298371`**

### Recommended Setup Path (Security + Reproducibility First)

1. **Preferred: Use Terraform** (see `infra/terraform/main.tf` + `docs/AWS-FREE-SETUP.md`)
   ```bash
   cd infra/terraform
   terraform init
   terraform apply -var="aws_account_id=140023298371"
   ```
   This creates the exact 4 tables with correct keys, tags, and PAY_PER_REQUEST billing. It also prints the ready-to-use least-privilege IAM policy.

2. **Alternative (quick & dirty)**: Run the personalized script
   ```bash
   ./scripts/setup-aws-dynamodb.sh
   ```
   It now hard-codes your Account ID (140023298371) and prints the exact policy.

3. Create a **least-privilege IAM User** (or Role) in AWS IAM using the policy output by Terraform/script. Example policy is also reproduced in `docs/AWS-FREE-SETUP.md`.

4. Add these **exact** environment variables in Vercel (Project → Settings → Environment Variables, apply to Production + Preview):
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_REGION=us-east-1
   DYNAMODB_TABLE_PREFIX=cragtrails   # optional but recommended
   ```

5. The production-ready adapter lives at `lib/db/dynamodb.ts` (fully typed against climbing.ts, proper error handling, all missing methods for Photos + ConditionReports, batch helpers, and migration guidance).

**This architecture is production-viable today at small scale and scales cleanly later** (add GSIs, TTL, global tables, or DAX only when metrics prove you need them — all still cheap).

**Long-term auth note (Skeptical CEO):** Long-lived access keys are a smell. Plan to migrate to OIDC-assumable IAM Role (Vercel + AWS federation) within 6–12 months.

See the full step-by-step, exact IAM policy for 140023298371, Terraform usage, table design rationale, photo storage options, and the localStorage → real DB migration plan (with Clerk userId wiring + optimistic UI patterns) in:

**`docs/AWS-FREE-SETUP.md`** (the single source of truth for this setup).

### Quick Test After Adding Domain
Visit `https://yourdomain.com` — it should load the same site as the vercel.app URL.

If Clerk login buttons break after the domain change, the most common fix is adding the new domain in the Clerk dashboard (step 2 above).

## Updating the Live URL in README

After you deploy, edit the following line in `README.md`:

```markdown
**Current recommended live link** (update this after you deploy):
→ [Your Live CragTrails](https://your-actual-url.vercel.app)
```

Then commit and push.

## Preview Deployments

Every pull request automatically gets a unique preview URL from Vercel. This is extremely useful for testing changes before merging.

## Troubleshooting

**Build fails?**
- Make sure you're on the latest `main` branch
- Run `npm run build` locally first to see errors

**Images not loading?**
- We use `picsum.photos` for demo images (they are public)

**Want to connect a real database?**
See the "Next Steps" section in the main README.

## Questions?

Open an issue or follow the Skeptical CEO contribution process in `CONTRIBUTING.md`.

---

**Maintained with ❤️ by the CragTrails team** (and a bunch of skeptical AI agents).