# Weekly Qdrant Updates Configuration

Taxentia-AI automatically updates IRS bulletin data every week to keep the vector database current with the latest tax authorities.

## Overview

- **Schedule:** Every Sunday at 2:00 AM
- **What updates:** Latest 5 IRS bulletins (Rev. Rulings, Rev. Procedures, Notices, Treasury Decisions)
- **Purpose:** Keep Qdrant vector database fresh with recent tax guidance
- **Estimated time:** 5-10 minutes per update
- **Cost:** ~$0.01-0.02 per update (OpenAI embeddings)

## Setup Instructions

### Option 1: Windows Task Scheduler (Recommended for Windows)

1. **Open Task Scheduler:**
   ```
   taskschd.msc
   ```

2. **Create a Basic Task:**
   - Name: `Taxentia-AI Weekly Update`
   - Description: Updates IRS bulletins in Qdrant

3. **Set the Trigger:**
   - Trigger: `Weekly`
   - Recur every: `1` week
   - Day: `Sunday`
   - Start time: `2:00 AM`

4. **Set the Action:**
   - Program/script: `%COMSPEC%` (Windows command interpreter)
   - Add arguments: `/c "C:\Path\To\Taxentia-AI\scripts\schedule-weekly-update.bat"`
   - Start in: `C:\Path\To\Taxentia-AI`

5. **Set Conditions:**
   - ✅ Wake the computer to run this task (if applicable)
   - ✅ Run only if the computer is idle (optional)

6. **Set Settings:**
   - Run task as soon as possible after a scheduled start is missed
   - If the task fails, restart every 1 hour (up to 3 times)

### Option 2: Linux/Mac Crontab

1. **Open crontab editor:**
   ```bash
   crontab -e
   ```

2. **Add this line (Sunday 2:00 AM):**
   ```cron
   0 2 * * 0 cd /path/to/Taxentia-AI && npm run schedule:updates >> /var/log/taxentia-updates.log 2>&1
   ```

3. **Or use the batch runner:**
   ```cron
   0 2 * * 0 /path/to/Taxentia-AI/scripts/schedule-weekly-update.sh
   ```

### Option 3: Keep Process Running (Always-On)

For server deployments or always-on environments:

```bash
npm run schedule:updates &
```

This keeps the scheduler running in memory and executes every 7 days.

**Note:** Use a process manager like `pm2` or `systemd` for production:

```bash
pm2 start "npm run schedule:updates" --name "taxentia-updates"
pm2 save
pm2 startup
```

## Manual Execution

### Run the scheduled update now:
```bash
npm run schedule:updates:now
```

### Run IRS bulletin update only:
```bash
npm run ingest:irb 5
```

### Update all sources (USC, CFR, IRS):
```bash
npm run ingest:all
```

## Monitoring Updates

### View Qdrant collection status:
```bash
npm run inspect:qdrant
```

Output shows:
- Total points in collection
- Sample data preview
- Vector statistics

### Monitor the update logs:

**Windows:**
- Check Event Viewer → Windows Logs → Application for task execution details
- Or redirect output to a log file in the batch script

**Linux/Mac:**
```bash
tail -f /var/log/taxentia-updates.log
```

## What Gets Updated

Each weekly update ingests:

1. **Recent IRS Bulletins** (last 5)
   - Revenue Rulings
   - Revenue Procedures
   - Notices
   - Treasury Decisions
   - Announcements

2. **Processing:**
   - Downloaded from `irs.gov`
   - Chunked into 2000-char segments
   - Embedded using OpenAI text-embedding-3-small
   - Upserted to Qdrant (new vectors replace old ones)

## Data Retention

- **Automatic deduplication:** Qdrant prevents duplicate vectors
- **Full history maintained:** Old data remains unless explicitly removed
- **Growing collection:** Qdrant grows with each update
- **Current size:** ~4,100+ vectors (all unique)

## Advanced: Custom Update Schedule

Edit `scripts/schedule-qdrant-updates.ts` to change:

```typescript
// Line ~80: Change update frequency
setInterval(async () => {
  await this.runUpdate();
}, 7 * 24 * 60 * 60 * 1000); // Change 7 to desired days
```

Or modify the batch script to run different commands:

**Monthly full update (on first Sunday):**
```batch
if "%day_of_month%"=="1" (
  npm run ingest:all
) else (
  npm run ingest:irb 5
)
```

## Troubleshooting

### Updates not running (Windows)
1. Check Task Scheduler History for errors
2. Verify the batch file path is correct
3. Run the batch file manually to test
4. Check that Node.js is in system PATH:
   ```bash
   node --version
   ```

### Updates not running (Linux/Mac)
1. Check if cron daemon is running:
   ```bash
   ps aux | grep cron
   ```
2. Verify crontab entry:
   ```bash
   crontab -l
   ```
3. Check cron logs:
   ```bash
   log show --predicate 'process == "cron"' --last 1h  # macOS
   grep CRON /var/log/syslog  # Linux
   ```

### Embedding API errors
- Check `OPENAI_API_KEY` is set and valid
- Monitor your OpenAI API quota and rate limits
- The update includes retry logic with exponential backoff

### Qdrant connection errors
- Ensure Qdrant is running: `docker-compose ps`
- Check Qdrant URL in `.env`: `QDRANT_URL=http://localhost:6333`
- Verify Qdrant collection exists: `npm run inspect:qdrant`

## Cost Tracking

Each weekly update costs approximately:
- **5 IRS bulletins** ≈ 400-600 chunks
- **Embeddings cost** ≈ $0.01-0.02 (based on OpenAI pricing)
- **Annual cost** ≈ $0.52-1.04 for weekly updates

## Performance Impact

- **Execution time:** 5-10 minutes
- **Qdrant impact:** Minimal (batch upserts)
- **No impact on query performance:** Updates happen in background
- **Database growth:** ~400-600 new vectors per week

## Maintenance

### Monthly: Full source update (optional)

Once per month, update all sources:

```bash
npm run ingest:all
```

This re-ingests:
- US Code Title 26 (1,612 sections)
- CFR Title 26 (Treasury Regulations)
- IRS Bulletins (recent 20)

**Note:** CFR fetcher needs XML parsing fixes (future enhancement)

### Quarterly: Data cleanup

Inspect collection health:
```bash
npm run inspect:qdrant
```

Review and remove duplicate or low-quality vectors if needed.

---

**Last Updated:** October 27, 2025
**Status:** ✅ Production Ready
