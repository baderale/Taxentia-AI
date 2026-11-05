# Railway Deployment Guide

## Current Deployment (November 5, 2026)

**Done**
- Railway project `taxentia` on the Hobby plan, with `taxentia`, `qdrant`, `Postgres` and `taxentia-cron-irb` services
- `www.taxentia.ai` connected through a GoDaddy CNAME, with a valid certificate, and `taxentia.ai` forwarded to it with a GoDaddy 301
- `SESSION_SECRET`, `ADMIN_SECRET` and the OpenRouter key set
- Redesigned interface, Postgres account storage and the `/admin` user page deployed on November 5, 2026
- Tax data loaded: Internal Revenue Code (1,900 current sections, 7,309 chunks, about $0.06, 14 minutes), Treasury Regulations and IRS Bulletins. Qdrant holds 29,121 vectors
- Answers now receive each passage labeled with its citation, and are told to cite only those sources
- Admin routes locked behind `ADMIN_SECRET`, and saved queries limited to their owner
- Weekly IRS bulletin job set up: `npm run ingest:irb -- 5`, Mondays at 08:00 UTC, no automatic restart

**Still open**
- Test a real tax question end to end with an account on the live site
- Confirm the weekly job's first scheduled run
- Set a monthly spending limit on the OpenRouter key
- Qdrant point IDs are 32-bit hashes of chunk IDs, so a few chunks overwrite each other. About 31 of 7,309 Code chunks were lost this way. Switching to UUID-based IDs would fix it, but needs a full reload

**OpenRouter settings on the `taxentia` service**
```bash
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL_NAME=openai/gpt-4o-mini
OPENAI_EMBEDDING_MODEL=openai/text-embedding-3-small
EMBEDDING_PROVIDER_IGNORE=openai
```

`EMBEDDING_PROVIDER_IGNORE` is a comma-separated list of OpenRouter providers to skip for embeddings. It is set to `openai` because OpenRouter was sending embedding requests through an outdated OpenAI key saved on the account, which returned 401 errors. With OpenAI skipped, requests route to Azure and still return 1536-dimension vectors.

**Costs measured or estimated on November 5, 2026**
- Railway: estimated $10-16 a month
- Treasury Regulations: 6,015 regulations, 20,016 chunks, about $0.16
- IRS Bulletins: 26 documents, 1,851 chunks, about $0.02
- Each answer: estimated $0.0015

**Loading the Internal Revenue Code**
- `npm run ingest:usc` downloads the official Title 26 file from uscode.house.gov and finds the current release on the download page, falling back to the release set in `scripts/fetchers/usc-fetcher.ts`
- It skips repealed, renumbered, omitted and reserved sections, plus editorial notes, and labels each chunk with its section number
- To run it on Railway, POST `{"type":"usc","secret":"<ADMIN_SECRET>"}` to `/api/taxentia/admin/ingest`. A redeploy stops a running load
- The earlier Cornell LII job was removed, because it skipped sections with letters and took about 27 hours

**Managing users**
- **People sign up themselves** at `https://www.taxentia.ai/auth?mode=signup`
- **Create or reset a user** at `https://www.taxentia.ai/admin`. The admin key is the `ADMIN_SECRET` variable on the `taxentia` service in Railway. Generated passwords are shown once
- **View the tables** in Railway under the `Postgres` service, on the Data tab: `users`, `tax_queries` and `user_sessions`
- Passwords are stored only as bcrypt hashes, and saved questions and answers are in `tax_queries`

**Things to know**
- This project ignored `railway.json`. The start command and health check are set directly on the service, so changing the file has no effect here.
- `railway redeploy` reuses the previous deployment's settings. Use `railway up` after changing them.
- Railway is not connected to GitHub. Pushing to GitHub does not deploy; run `railway up --service taxentia`.
- Postgres has no public proxy. Schema changes must run inside Railway's private network. To apply one, temporarily set the start command to `npx drizzle-kit push && npm run start`, run `railway up`, then set it back to `npm run start`.
- Set `ADMIN_SECRET`. If it is missing, the admin routes reject every request, including ingestion.
- The Qdrant image must be v1.15.5 or close to it. v1.13.6 didn't work with the app's client version.
- Keys added in the Railway dashboard stay staged until the change is deployed. Check that they were applied.
- curl can return an HTTP/2 protocol error against the Railway URL. Add `--http1.1` when testing routes.
- Always set `SESSION_SECRET`. If it is missing, the app falls back to a publicly known default.
- GoDaddy cannot point the root domain directly at Railway, so the root domain forwards to `www`.

The steps below are the original guide from November 2025.

## Prerequisites
1. Railway account at https://railway.app
2. Railway CLI installed: `npm install -g @railway/cli`
3. OpenAI API key
4. Qdrant instance (Railway service or Qdrant Cloud)

## Initial Setup

### 1. Login to Railway
```bash
railway login
```

### 2. Link Your Project
```bash
cd D:\Taxentia-AI
railway link
```

### 3. Add PostgreSQL Database
In Railway dashboard:
- Click "New" → "Database" → "PostgreSQL"
- Railway will automatically set `DATABASE_URL` environment variable

### 4. Configure Environment Variables

#### Required Variables
```bash
railway variables set OPENAI_API_KEY="your-openai-api-key-here"
railway variables set QDRANT_URL="http://your-qdrant-url:6333"
railway variables set SESSION_SECRET=$(openssl rand -hex 32)
railway variables set NODE_ENV="production"
railway variables set OPENAI_MODEL_NAME="gpt-4o-mini"
railway variables set QDRANT_COLLECTION_NAME="taxentia-authorities"
```

#### Optional Variables
```bash
railway variables set GOVINFO_API_KEY="your-govinfo-api-key"
```

### 5. Push Database Schema
After environment variables are set:
```bash
# Generate migrations
npm run db:generate

# Push schema to Railway PostgreSQL
npm run db:push
```

Or manually using Railway CLI:
```bash
railway run npm run db:push
```

### 6. Deploy Qdrant Vector Database

#### Option A: Deploy to Railway (Recommended)
1. Create new service in Railway
2. Use Docker deployment
3. Deploy Qdrant image: `qdrant/qdrant:latest`
4. Set internal URL as `QDRANT_URL`

#### Option B: Use Qdrant Cloud
1. Sign up at https://cloud.qdrant.io
2. Create cluster
3. Get API URL and set as `QDRANT_URL`

### 7. Index Tax Authority Data
After Qdrant is running:
```bash
# Run locally or via Railway
railway run npm run ingest:all
```

This will:
- Fetch USC Title 26 sections
- Fetch CFR Title 26 regulations
- Fetch IRS Bulletins
- Generate embeddings using OpenAI
- Store vectors in Qdrant

Expected time: 10-30 minutes depending on data volume

### 8. Deploy Application
```bash
railway up
```

Or push to git and Railway will auto-deploy.

## Deployment Verification

### Check Deployment Status
```bash
railway status
```

### View Logs
```bash
# Deployment logs
railway logs

# Build logs
railway logs --type build

# Filter for errors
railway logs --filter @level:error
```

### Test Health Endpoint
```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-03T...",
  "database": "connected",
  "qdrant": "connected"
}
```

### Test Tax Query
```bash
curl -X POST https://your-app.railway.app/api/taxentia/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the startup expenditure deduction rules?"}' \
  -b "connect.sid=your-session-cookie"
```

## Troubleshooting

### Database Connection Errors
```bash
# Verify DATABASE_URL is set
railway variables | grep DATABASE_URL

# Test database connection
railway run npm run db:push
```

### Qdrant Connection Errors
```bash
# Check Qdrant URL
railway variables | grep QDRANT_URL

# Test Qdrant connection
railway run npm run inspect:qdrant
```

### Build Failures
```bash
# View detailed build logs
railway logs --type build

# Check Node version compatibility
railway logs | grep "node version"
```

### Startup Crashes
Common causes:
1. **Missing DATABASE_URL** - Add PostgreSQL service
2. **Missing OPENAI_API_KEY** - Set environment variable
3. **Qdrant not accessible** - Check QDRANT_URL and firewall rules
4. **Database tables don't exist** - Run `npm run db:push`

### Performance Issues
- Check Qdrant has indexed data: `npm run inspect:qdrant`
- Verify OpenAI API key has credits
- Monitor Railway resource usage in dashboard

## Maintenance

### Update Tax Authority Data
```bash
# Re-index all authorities
railway run npm run ingest:all

# Or schedule as cron job in Railway
```

### Database Migrations
When schema changes:
```bash
npm run db:generate
railway run npm run db:push
```

### View Database
```bash
npm run db:studio
```

## Cost Optimization

### Railway Free Tier
- $5 monthly credit
- Enough for development/testing
- Upgrade to Hobby ($5/month) for production

### OpenAI Costs
- GPT-4o Mini: ~$0.15 per 1000 queries
- Embeddings: ~$0.02 per 1000 queries
- Budget for demo: $10-20/month

### Qdrant
- Railway: ~$2-5/month for small dataset
- Qdrant Cloud free tier: 1GB storage

## Production Checklist

- [ ] DATABASE_URL configured (PostgreSQL addon)
- [ ] OPENAI_API_KEY set with active credits
- [ ] SESSION_SECRET set (cryptographically secure)
- [ ] QDRANT_URL pointing to running instance
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Qdrant data indexed (`npm run ingest:all`)
- [ ] Health check endpoint returns healthy
- [ ] Test query returns structured response
- [ ] Custom domain configured (optional)
- [ ] Monitoring/alerts set up
- [ ] Backup strategy for PostgreSQL

## Support Resources

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Qdrant Docs: https://qdrant.tech/documentation
- OpenAI API Docs: https://platform.openai.com/docs
