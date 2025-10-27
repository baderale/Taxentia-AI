#!/usr/bin/env tsx
import 'dotenv/config';
import { AuthorityIngestionPipeline } from './ingest-authorities.js';

/**
 * Weekly scheduler for Qdrant data updates
 * Runs every Sunday at 2:00 AM to fetch fresh IRS bulletins
 *
 * To use this:
 * 1. On Windows: Use Task Scheduler to run this script
 * 2. On Linux/Mac: Use crontab with: 0 2 * * 0 npm run schedule:updates
 */

class QdrantUpdateScheduler {
  private pipeline: AuthorityIngestionPipeline;

  constructor() {
    this.pipeline = new AuthorityIngestionPipeline();
  }

  /**
   * Calculate milliseconds until next Sunday 2:00 AM
   */
  private getNextRunTime(): number {
    const now = new Date();
    const nextRun = new Date(now);

    // Set to 2:00 AM
    nextRun.setHours(2, 0, 0, 0);

    // If it's before 2 AM on a Sunday, use this Sunday
    const dayOfWeek = now.getDay();
    const hoursUntilTarget = (nextRun.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (dayOfWeek === 0 && hoursUntilTarget > 0) {
      // It's Sunday and 2 AM hasn't passed
      return nextRun.getTime() - now.getTime();
    }

    // Calculate days until next Sunday
    const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
    nextRun.setDate(now.getDate() + daysUntilSunday);
    nextRun.setHours(2, 0, 0, 0);

    return nextRun.getTime() - now.getTime();
  }

  /**
   * Format milliseconds to human-readable time
   */
  private formatDelay(ms: number): string {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  }

  /**
   * Run the update process
   */
  async runUpdate(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 STARTING WEEKLY QDRANT UPDATE');
    console.log('='.repeat(70));
    console.log(`📅 Update started at: ${new Date().toISOString()}\n`);

    try {
      // Ensure collection exists
      console.log('🔧 Ensuring Qdrant collection exists...');
      const { qdrantService } = await import('../server/services/qdrant-service.js');
      await qdrantService.ensureCollection(1536);

      // Update recent IRS bulletins (fetch last 5 bulletins)
      console.log('\n📬 Updating IRS Bulletins (last 5)...');
      await this.pipeline.ingestIRB('recent', 5);

      console.log('\n✅ Weekly update completed successfully!');
      console.log(`📅 Update completed at: ${new Date().toISOString()}\n`);
    } catch (error) {
      console.error('\n❌ Weekly update failed:', error);
      process.exit(1);
    }
  }

  /**
   * Start the scheduler (runs once per week)
   */
  async start(): Promise<void> {
    const firstRun = this.getNextRunTime();
    const nextRunDate = new Date(Date.now() + firstRun);

    console.log('\n' + '='.repeat(70));
    console.log('⏰ QDRANT WEEKLY SCHEDULER STARTED');
    console.log('='.repeat(70));
    console.log(`🕐 Current time: ${new Date().toISOString()}`);
    console.log(`📅 Next update: ${nextRunDate.toISOString()}`);
    console.log(`⏳ Time until next update: ${this.formatDelay(firstRun)}`);
    console.log('='.repeat(70) + '\n');

    // Run immediately if requested via environment variable
    if (process.env.RUN_NOW === 'true') {
      console.log('⚡ RUN_NOW flag set - executing update immediately\n');
      await this.runUpdate();
    }

    // Schedule the update
    setInterval(async () => {
      try {
        await this.runUpdate();
      } catch (error) {
        console.error('❌ Scheduled update failed:', error);
      }
    }, 7 * 24 * 60 * 60 * 1000); // Run every 7 days (1 week)
  }
}

/**
 * Main entry point
 */
async function main() {
  const scheduler = new QdrantUpdateScheduler();
  await scheduler.start();

  // Keep the process alive
  console.log('✨ Scheduler is running. Press Ctrl+C to stop.\n');
  process.on('SIGINT', () => {
    console.log('\n👋 Scheduler stopped.');
    process.exit(0);
  });
}

main();
