# Quick Start: Data Ingestion

## 🚀 Get Started in 5 Minutes

### Step 1: Ensure Qdrant is Running
```bash
docker-compose up -d qdrant
```

### Step 2: Test the System
```bash
npm run ingest:test
```

This will:
- ✅ Download 2 IRS bulletins
- ✅ Parse ~30-50 documents
- ✅ Create embeddings
- ✅ Upload to Qdrant
- ⏱️ Takes 1-2 minutes
- 💰 Costs ~$0.01

### Step 3: Verify in Qdrant
Open http://localhost:6333/dashboard and check your collection has vectors.

### Step 4: Ingest Real Data

**Option A: IRS Bulletins Only (Recommended First)**
```bash
npm run ingest:irb
```
- 10 most recent bulletins
- ~500-1000 documents
- 5-10 minutes
- ~$0.20

**Option B: All Three Sources**
```bash
npm run ingest:all
```
- US Code + CFR + IRS Bulletins
- ~50,000-100,000 documents
- 3-5 hours
- ~$6-12

## 📅 Set Up Weekly Updates

### Windows Task Scheduler

1. Open Task Scheduler → Create Basic Task
2. **Name**: Taxentia Weekly Update
3. **Trigger**: Weekly, Sunday, 2:00 AM
4. **Action**: Start a program
5. **Program**: `D:\Taxentia-AI\scripts\schedule-weekly-update.bat`
6. **Start in**: `D:\Taxentia-AI`
7. ✅ Done!

## 🎯 Recommended Workflow

**Week 1:**
```bash
npm run ingest:test          # Test (1 min)
npm run ingest:irb           # IRS bulletins (10 min)
```

**Week 2:**
```bash
npm run ingest:usc           # US Code (30-60 min)
```

**Week 3:**
```bash
npm run ingest:cfr           # Treasury Regs (2-4 hours)
```

**Week 4+:**
```bash
# Automated weekly: just IRS bulletins
# Schedule runs automatically every Sunday
```

## 📊 Commands Cheat Sheet

| Command | What it does | Time | Cost |
|---------|-------------|------|------|
| `npm run ingest:test` | Test with 2 bulletins | 1-2 min | $0.01 |
| `npm run ingest:irb` | Recent 10 bulletins | 5-10 min | $0.20 |
| `npm run ingest:usc` | US Tax Code | 30-60 min | $1 |
| `npm run ingest:cfr` | Treasury Regs | 2-4 hrs | $5-10 |
| `npm run ingest:all` | Everything | 3-5 hrs | $6-12 |

## ❓ Need Help?

See full documentation: [docs/INGESTION.md](./INGESTION.md)
