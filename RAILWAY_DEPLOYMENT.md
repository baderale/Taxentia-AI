# Railway Deployment Guide

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
