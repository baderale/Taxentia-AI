#!/usr/bin/env tsx
import 'dotenv/config';
import { USCFetcher } from './fetchers/usc-fetcher.js';
import { CFRFetcher } from './fetchers/cfr-fetcher.js';
import { IRBFetcher } from './fetchers/irb-fetcher.js';
import { TextChunker } from './utils/chunker.js';
import { EmbeddingsService } from './utils/embeddings.js';
import { qdrantService } from '../server/services/qdrant-service.js';
import type { QdrantPoint } from '../server/services/qdrant-service.js';

/**
 * Main ingestion orchestrator
 * Fetches data from all three official tax authority sources
 */

interface IngestionStats {
  source: string;
  documentsProcessed: number;
  chunksCreated: number;
  vectorsUploaded: number;
  duration: number;
  estimatedCost: number;
}

class AuthorityIngestionPipeline {
  private chunker: TextChunker;
  private embeddings: EmbeddingsService;
  private stats: IngestionStats[] = [];

  constructor() {
    this.chunker = new TextChunker(2000, 200);
    this.embeddings = new EmbeddingsService();
    // Note: EmbeddingsService handles batching internally with token limits
  }

  /**
   * Ingest US Code Title 26
   */
  async ingestUSC(skipIfExists: boolean = false): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📚 INGESTING US CODE TITLE 26');
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();
    const fetcher = new USCFetcher();

    try {
      // Fetch sections
      const sections = await fetcher.fetchAll();
      console.log(`📊 Retrieved ${sections.length} sections`);

      if (sections.length === 0) {
        console.warn('⚠️  No sections found - may need to adjust XML parsing');
        return;
      }

      // Chunk documents
      const allChunks = [];
      for (const section of sections) {
        const chunks = this.chunker.chunkDocument(section.text, {
          source_type: 'usc',
          citation: section.citation,
          section: section.section,
          title: section.title,
          url: section.url,
        });
        allChunks.push(...chunks);
      }

      console.log(`📦 Created ${allChunks.length} chunks`);

      // Estimate cost
      const { tokens, cost } = this.embeddings.estimateCost(allChunks);
      console.log(`💰 Estimated cost: ${tokens.toLocaleString()} tokens ≈ $${cost.toFixed(4)}`);

      // Generate embeddings
      const embeddedChunks = await this.embeddings.generateEmbeddings(allChunks);

      // Upload to Qdrant
      await this.uploadToQdrant(embeddedChunks, 'usc');

      // Record stats
      this.stats.push({
        source: 'US Code Title 26',
        documentsProcessed: sections.length,
        chunksCreated: allChunks.length,
        vectorsUploaded: embeddedChunks.length,
        duration: Date.now() - startTime,
        estimatedCost: cost,
      });

      console.log('✅ US Code Title 26 ingestion complete!\n');
    } catch (error) {
      console.error('❌ Failed to ingest US Code Title 26:', error);
      throw error;
    }
  }

  /**
   * Ingest CFR Title 26 (Treasury Regulations)
   */
  async ingestCFR(skipIfExists: boolean = false): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📚 INGESTING CFR TITLE 26 (TREASURY REGULATIONS)');
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();
    const fetcher = new CFRFetcher();

    try {
      // Fetch regulations
      const regulations = await fetcher.fetchAll();
      console.log(`📊 Retrieved ${regulations.length} regulations`);

      if (regulations.length === 0) {
        console.warn('⚠️  No regulations found - may need to adjust XML parsing');
        return;
      }

      // Chunk documents
      const allChunks = [];
      for (const regulation of regulations) {
        const chunks = this.chunker.chunkDocument(regulation.text, {
          source_type: 'cfr',
          citation: regulation.citation,
          part: regulation.part,
          section: regulation.section,
          title: regulation.title,
          url: regulation.url,
        });
        allChunks.push(...chunks);
      }

      console.log(`📦 Created ${allChunks.length} chunks`);

      // Estimate cost
      const { tokens, cost } = this.embeddings.estimateCost(allChunks);
      console.log(`💰 Estimated cost: ${tokens.toLocaleString()} tokens ≈ $${cost.toFixed(4)}`);

      // Generate embeddings in batches to avoid memory issues
      const batchSize = 1000;
      let embeddedChunks = [];

      for (let i = 0; i < allChunks.length; i += batchSize) {
        const batch = allChunks.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allChunks.length / batchSize)}`);

        const batchEmbedded = await this.embeddings.generateEmbeddings(batch);
        embeddedChunks.push(...batchEmbedded);

        // Upload batch to Qdrant immediately to save memory
        await this.uploadToQdrant(batchEmbedded, 'cfr');
      }

      // Record stats
      this.stats.push({
        source: 'CFR Title 26',
        documentsProcessed: regulations.length,
        chunksCreated: allChunks.length,
        vectorsUploaded: embeddedChunks.length,
        duration: Date.now() - startTime,
        estimatedCost: cost,
      });

      console.log('✅ CFR Title 26 ingestion complete!\n');
    } catch (error) {
      console.error('❌ Failed to ingest CFR Title 26:', error);
      throw error;
    }
  }

  /**
   * Ingest IRS Bulletins (Revenue Rulings & Procedures)
   */
  async ingestIRB(mode: 'recent' | 'all' = 'recent', count: number = 10): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log(`📚 INGESTING IRS BULLETINS (${mode === 'recent' ? `${count} most recent` : 'ALL'})`);
    console.log('='.repeat(60) + '\n');

    const startTime = Date.now();
    const fetcher = new IRBFetcher();

    try {
      // Fetch documents
      const documents = mode === 'recent'
        ? await fetcher.fetchRecent(count)
        : await fetcher.fetchAll();

      console.log(`📊 Retrieved ${documents.length} documents`);

      if (documents.length === 0) {
        console.warn('⚠️  No documents found');
        return;
      }

      // Chunk documents
      const allChunks = [];
      for (const document of documents) {
        const chunks = this.chunker.chunkDocument(document.text, {
          source_type: document.type,
          citation: document.citation,
          number: document.number,
          title: document.title,
          bulletin_number: document.bulletinNumber,
          bulletin_date: document.bulletinDate,
          url: document.url,
        });
        allChunks.push(...chunks);
      }

      console.log(`📦 Created ${allChunks.length} chunks`);

      // Estimate cost
      const { tokens, cost } = this.embeddings.estimateCost(allChunks);
      console.log(`💰 Estimated cost: ${tokens.toLocaleString()} tokens ≈ $${cost.toFixed(4)}`);

      // Generate embeddings
      const embeddedChunks = await this.embeddings.generateEmbeddings(allChunks);

      // Upload to Qdrant
      await this.uploadToQdrant(embeddedChunks, 'irb');

      // Record stats
      this.stats.push({
        source: `IRS Bulletins (${mode})`,
        documentsProcessed: documents.length,
        chunksCreated: allChunks.length,
        vectorsUploaded: embeddedChunks.length,
        duration: Date.now() - startTime,
        estimatedCost: cost,
      });

      console.log('✅ IRS Bulletins ingestion complete!\n');
    } catch (error) {
      console.error('❌ Failed to ingest IRS Bulletins:', error);
      throw error;
    }
  }

  /**
   * Upload embedded chunks to Qdrant
   */
  private async uploadToQdrant(embeddedChunks: any[], sourcePrefix: string): Promise<void> {
    console.log(`☁️  Uploading ${embeddedChunks.length} vectors to Qdrant...`);

    // Convert to Qdrant points
    const points: QdrantPoint[] = embeddedChunks.map((chunk) => ({
      id: chunk.id,
      vector: chunk.embedding,
      payload: {
        text: chunk.text,
        ...chunk.metadata,
      },
    }));

    // Upload in batches of 100
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await qdrantService.upsert(batch);
      console.log(`  Uploaded batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)}`);
    }

    console.log(`✅ Uploaded ${points.length} vectors to Qdrant`);
  }

  /**
   * Print summary statistics
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 INGESTION SUMMARY');
    console.log('='.repeat(60) + '\n');

    let totalDocs = 0;
    let totalChunks = 0;
    let totalVectors = 0;
    let totalCost = 0;
    let totalDuration = 0;

    for (const stat of this.stats) {
      console.log(`\n${stat.source}:`);
      console.log(`  Documents: ${stat.documentsProcessed.toLocaleString()}`);
      console.log(`  Chunks: ${stat.chunksCreated.toLocaleString()}`);
      console.log(`  Vectors: ${stat.vectorsUploaded.toLocaleString()}`);
      console.log(`  Duration: ${(stat.duration / 1000).toFixed(1)}s`);
      console.log(`  Est. Cost: $${stat.estimatedCost.toFixed(4)}`);

      totalDocs += stat.documentsProcessed;
      totalChunks += stat.chunksCreated;
      totalVectors += stat.vectorsUploaded;
      totalCost += stat.estimatedCost;
      totalDuration += stat.duration;
    }

    console.log('\n' + '-'.repeat(60));
    console.log('\nTOTALS:');
    console.log(`  Documents: ${totalDocs.toLocaleString()}`);
    console.log(`  Chunks: ${totalChunks.toLocaleString()}`);
    console.log(`  Vectors: ${totalVectors.toLocaleString()}`);
    console.log(`  Total Duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`  Total Est. Cost: $${totalCost.toFixed(2)}`);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  const pipeline = new AuthorityIngestionPipeline();

  // Ensure Qdrant collection exists
  console.log('🔧 Ensuring Qdrant collection exists...');
  await qdrantService.ensureCollection(1536);

  try {
    switch (command) {
      case 'usc':
        await pipeline.ingestUSC();
        break;

      case 'cfr':
        await pipeline.ingestCFR();
        break;

      case 'irb':
        const count = parseInt(args[1]) || 10;
        await pipeline.ingestIRB('recent', count);
        break;

      case 'irb-all':
        await pipeline.ingestIRB('all');
        break;

      case 'all':
        console.log('🚀 Starting full ingestion of all sources...\n');
        await pipeline.ingestUSC();
        await pipeline.ingestCFR();
        await pipeline.ingestIRB('recent', 20); // Recent 20 bulletins
        break;

      case 'test':
        console.log('🧪 Running test ingestion (small sample)...\n');
        await pipeline.ingestIRB('recent', 2); // Just 2 bulletins for testing
        break;

      case 'help':
      default:
        console.log(`
Taxentia-AI Authority Ingestion Pipeline
=========================================

Usage: npm run ingest:authorities [command] [options]

Commands:
  usc              Ingest US Code Title 26
  cfr              Ingest CFR Title 26 (Treasury Regulations)
  irb [count]      Ingest recent IRS bulletins (default: 10)
  irb-all          Ingest ALL IRS bulletins (WARNING: Takes hours!)
  all              Ingest all sources (USC + CFR + recent IRB)
  test             Test with small sample (2 bulletins only)
  help             Show this help message

Examples:
  npm run ingest:authorities usc
  npm run ingest:authorities irb 20
  npm run ingest:authorities all

Environment Variables Required:
  OPENAI_API_KEY           OpenAI API key
  QDRANT_URL              Qdrant server URL (default: http://localhost:6333)
  QDRANT_COLLECTION_NAME  Collection name (default: taxentia-authorities)
        `);
        return;
    }

    pipeline.printSummary();
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  }
}

main();
