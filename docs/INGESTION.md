# Tax Authority Data Ingestion System

Complete documentation for the Taxentia-AI data ingestion pipeline.

## Overview

The ingestion system fetches, parses, and indexes tax authority documents from three official U.S. government sources:

1. **US Code Title 26** (Internal Revenue Code) - uscode.house.gov
2. **CFR Title 26** (Treasury Regulations) - govinfo.gov
3. **IRS Bulletins** (Revenue Rulings & Procedures) - irs.gov/irb

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Ingestion Pipeline                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Fetch          2. Parse          3. Chunk              │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │ Download │────▶│ Extract  │────▶│ Split    │           │
│  │ XML/HTML │     │ Sections │     │ into     │           │
│  └──────────┘     └──────────┘     │ 2000 chr │           │
│                                     └──────────┘           │
│                                          │                  │
│  4. Embed          5. Store              ▼                  │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │ OpenAI   │────▶│ Qdrant   │────▶│ Vector   │           │
│  │ text-emb │     │ Upsert   │     │ Database │           │
│  │ -3-small │     └──────────┘     └──────────┘           │
│  └──────────┘                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

1. **Qdrant running** on Docker:
   ```bash
   docker-compose up -d qdrant
   ```

2. **Environment variables** set in `.env`:
   ```env
   OPENAI_API_KEY=your_key_here
   QDRANT_URL=http://localhost:6333
   QDRANT_COLLECTION_NAME=taxentia-authorities
   ```

### Test the System (Recommended First!)

Start with a small test to verify everything works:

```bash
npm run ingest:test
```

This ingests only 2 IRS bulletins (~30-50 documents) and should complete in 1-2 minutes.

### Ingest Individual Sources

#### US Code Title 26 (~5,000-10,000 sections)
```bash
npm run ingest:usc
```
- **Duration**: 30-60 minutes
- **Cost**: ~$0.50-$1.00
- **Size**: 10-50 MB download

#### CFR Title 26 (~50,000-100,000 regulations)
```bash
npm run ingest:cfr
```
- **Duration**: 2-4 hours
- **Cost**: ~$5-$10
- **Size**: 83 MB download

#### IRS Bulletins (Recent 10)
```bash
npm run ingest:irb
```
- **Duration**: 5-10 minutes
- **Cost**: ~$0.10-$0.20
- **Documents**: ~500-1000

#### IRS Bulletins (Custom count)
```bash
npm run ingest:authorities irb 20
```

### Ingest Everything

```bash
npm run ingest:all
```

This runs:
- US Code Title 26
- CFR Title 26
- Recent 20 IRS bulletins

**Total duration**: 3-5 hours
**Total cost**: ~$6-$12

## Commands Reference

### NPM Scripts

| Command | Description | Time | Cost |
|---------|-------------|------|------|
| `npm run ingest:test` | Test with 2 bulletins | 1-2 min | ~$0.01 |
| `npm run ingest:usc` | US Code Title 26 | 30-60 min | ~$1 |
| `npm run ingest:cfr` | Treasury Regulations | 2-4 hrs | ~$5-10 |
| `npm run ingest:irb` | Recent 10 bulletins | 5-10 min | ~$0.20 |
| `npm run ingest:all` | All sources | 3-5 hrs | ~$6-12 |

### CLI Arguments

```bash
npm run ingest:authorities [command] [options]
```

**Commands:**
- `usc` - Ingest US Code Title 26
- `cfr` - Ingest CFR Title 26
- `irb [count]` - Ingest recent N bulletins (default: 10)
- `irb-all` - Ingest ALL bulletins (WARNING: Takes hours!)
- `all` - Ingest all sources
- `test` - Test with small sample
- `help` - Show help

**Examples:**
```bash
# Ingest 50 recent bulletins
npm run ingest:authorities irb 50

# Ingest only US Code
npm run ingest:authorities usc

# Full help
npm run ingest:authorities help
```

## Data Structure

### Qdrant Collection Schema

```typescript
{
  collection_name: "taxentia-authorities",
  vector_size: 1536,           // OpenAI text-embedding-3-small
  distance: "Cosine",

  payload: {
    // Common fields
    text: string,              // The actual text content
    source_type: string,       // "usc" | "cfr" | "revenue_ruling" | "revenue_procedure"
    citation: string,          // e.g., "26 USC § 61"
    title: string,             // Section/regulation title
    url: string,               // Official government URL

    // Chunking metadata
    chunk_index: number,       // 0, 1, 2...
    total_chunks: number,      // Total chunks for this document

    // Source-specific fields
    section?: string,          // USC: "61"
    part?: string,             // CFR: "1"
    number?: string,           // IRB: "2025-01"
    bulletin_number?: string,  // IRB: "IRB 2025-01"
    bulletin_date?: string,    // IRB: "2025-01-06"
  }
}
```

### Example Documents

**US Code Section:**
```json
{
  "text": "Section 61 - Gross income defined. Except as otherwise provided...",
  "source_type": "usc",
  "citation": "26 USC § 61",
  "section": "61",
  "title": "Gross income defined",
  "url": "https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section61"
}
```

**CFR Regulation:**
```json
{
  "text": "§1.61-1 Gross income. (a) General definition...",
  "source_type": "cfr",
  "citation": "26 CFR § 1.61-1",
  "part": "1",
  "section": "1.61-1",
  "title": "Gross income",
  "url": "https://www.ecfr.gov/current/title-26/section-1.61-1"
}
```

**Revenue Ruling:**
```json
{
  "text": "Rev. Rul. 2025-01: Treatment of cryptocurrency staking rewards...",
  "source_type": "revenue_ruling",
  "citation": "Rev. Rul. 2025-01",
  "number": "2025-01",
  "bulletin_number": "IRB 2025-01",
  "bulletin_date": "2025-01-06",
  "url": "https://www.irs.gov/irb/2025-01_IRB#REV-RUL-2025-01"
}
```

## Chunking Strategy

Text is split into ~2000 character chunks with 200 character overlap:

- **Preserves context** across chunk boundaries
- **Paragraph-aware** - doesn't split mid-paragraph
- **Metadata preserved** - each chunk has full source information
- **Sequential IDs** - chunks are numbered for reference

## Cost Estimation

The system calculates costs before processing:

```
📊 Retrieved 5,432 sections
📦 Created 8,129 chunks
💰 Estimated cost: 2,048,250 tokens ≈ $0.0410
```

### Pricing (text-embedding-3-small)
- **$0.02 per 1M tokens**
- ~4 characters per token
- Average: **$0.001 per 50KB of text**

## Scheduling Weekly Updates

### Option 1: Windows Task Scheduler

1. Create a batch file `ingest-weekly.bat`:
```batch
@echo off
cd /d "D:\Taxentia-AI"
npm run ingest:irb 5
```

2. Open Task Scheduler → Create Basic Task:
   - **Trigger**: Weekly, Sunday 2:00 AM
   - **Action**: Start a program
   - **Program**: `C:\path\to\ingest-weekly.bat`

### Option 2: Node-cron (In-App)

Add to your Express server:

```typescript
import cron from 'node-cron';

// Every Sunday at 2 AM
cron.schedule('0 2 * * 0', async () => {
  console.log('Running weekly authority update...');
  // Run ingestion script
});
```

### Option 3: GitHub Actions

Create `.github/workflows/ingest-weekly.yml`:

```yaml
name: Weekly Authority Ingestion
on:
  schedule:
    - cron: '0 2 * * 0'  # Sunday 2 AM UTC

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run ingest:irb 5
```

## Monitoring & Logs

The ingestion system provides detailed progress output:

```
============================================================
📚 INGESTING IRS BULLETINS (10 most recent)
============================================================

📥 Fetching IRS bulletin list...
✅ Found 147 bulletins
🔍 Parsing bulletin 2025-44...
✅ Found 12 documents in bulletin 2025-44
...
📦 Created 423 chunks
💰 Estimated cost: 105,750 tokens ≈ $0.0021
🔮 Generating embeddings for 423 chunks...
  Processing batch 1/5 (100 chunks)
...
☁️  Uploading 423 vectors to Qdrant...
  Uploaded batch 1/5
...
✅ IRS Bulletins ingestion complete!

============================================================
📊 INGESTION SUMMARY
============================================================

IRS Bulletins (recent):
  Documents: 127
  Chunks: 423
  Vectors: 423
  Duration: 127.3s
  Est. Cost: $0.0021
```

## Troubleshooting

### "Failed to download XML"
- Check internet connection
- Verify URLs are accessible
- Government sites may be temporarily down

### "Failed to parse XML"
- XML structure may have changed
- Check fetcher code for updates
- Save XML to file for inspection

### "OpenAI API rate limit"
- System automatically batches requests
- Add delays between batches if needed
- Use smaller batch sizes

### "Qdrant connection failed"
- Ensure Docker container is running: `docker ps`
- Check QDRANT_URL in .env
- Verify port 6333 is accessible

### "Out of memory"
- CFR ingestion processes in batches
- Reduce batch size in code if needed
- Close other applications

## File Structure

```
scripts/
├── ingest-authorities.ts      # Main orchestrator
├── fetchers/
│   ├── usc-fetcher.ts         # US Code downloader
│   ├── cfr-fetcher.ts         # Treasury Regs downloader
│   └── irb-fetcher.ts         # IRS Bulletin scraper
└── utils/
    ├── chunker.ts             # Text chunking
    └── embeddings.ts          # OpenAI embeddings

server/services/
└── qdrant-service.ts          # Qdrant client
```

## Best Practices

### Initial Setup
1. Run `npm run ingest:test` first
2. Verify vectors in Qdrant
3. Test search queries
4. Then ingest full datasets

### Regular Updates
- **Daily**: Not needed (sources update slowly)
- **Weekly**: IRS bulletins only (`npm run ingest:irb`)
- **Monthly**: USC and CFR full refresh
- **Quarterly**: Full re-index of everything

### Cost Optimization
- Start with recent bulletins only (10-20)
- USC and CFR rarely change (monthly updates sufficient)
- Monitor OpenAI usage dashboard

### Error Recovery
- Scripts save progress periodically
- Re-running is idempotent (upserts existing vectors)
- Check logs for specific failures

## Next Steps

1. **Test the system**: `npm run ingest:test`
2. **Ingest IRS bulletins**: `npm run ingest:irb`
3. **Set up weekly schedule** (see Scheduling section)
4. **Monitor costs** in OpenAI dashboard
5. **Update USC/CFR monthly**: `npm run ingest:usc` and `npm run ingest:cfr`

## Support

For issues or questions:
- Check logs in console output
- Review this documentation
- Inspect Qdrant collection: http://localhost:6333/dashboard
- OpenAI usage: https://platform.openai.com/usage
