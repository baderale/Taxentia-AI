import OpenAI from 'openai';
import type { Chunk } from './chunker.js';

export interface EmbeddedChunk extends Chunk {
  embedding: number[];
}

export class EmbeddingsService {
  private openai: OpenAI;
  private model: string = 'text-embedding-3-small';
  private batchSize: number = 100; // OpenAI allows up to 2048 inputs per request

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate embeddings for a batch of chunks
   */
  async generateEmbeddings(chunks: Chunk[]): Promise<EmbeddedChunk[]> {
    console.log(`🔮 Generating embeddings for ${chunks.length} chunks...`);

    const embeddedChunks: EmbeddedChunk[] = [];
    const batches = this.batchChunks(chunks, this.batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`  Processing batch ${i + 1}/${batches.length} (${batch.length} chunks)`);

      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch.map((chunk) => chunk.text),
          encoding_format: 'float',
        });

        // Combine chunks with their embeddings
        for (let j = 0; j < batch.length; j++) {
          embeddedChunks.push({
            ...batch[j],
            embedding: response.data[j].embedding,
          });
        }

        // Add small delay between batches to avoid rate limits
        if (i < batches.length - 1) {
          await this.delay(100);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(`❌ Failed to generate embeddings for batch ${i + 1}:`, error.message);
          throw error;
        }
        throw error;
      }
    }

    console.log(`✅ Generated ${embeddedChunks.length} embeddings`);
    return embeddedChunks;
  }

  /**
   * Generate embedding for a single text (used for queries)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      if (error instanceof Error) {
        console.error('❌ Failed to generate embedding:', error.message);
        throw error;
      }
      throw error;
    }
  }

  /**
   * Batch chunks into groups
   */
  private batchChunks<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate estimated cost for embeddings
   * text-embedding-3-small: $0.02 per 1M tokens
   */
  estimateCost(chunks: Chunk[]): { tokens: number; cost: number } {
    // Rough estimate: 1 token ≈ 4 characters
    const totalChars = chunks.reduce((sum, chunk) => sum + chunk.text.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    const cost = (estimatedTokens / 1_000_000) * 0.02;

    return { tokens: estimatedTokens, cost };
  }
}
