/**
 * Text chunking utilities for creating optimal vector embeddings
 */

export interface Chunk {
  text: string;
  metadata: Record<string, any>;
  id: string;
}

export class TextChunker {
  private maxChunkSize: number;
  private overlapSize: number;

  constructor(maxChunkSize: number = 2000, overlapSize: number = 200) {
    this.maxChunkSize = maxChunkSize;
    this.overlapSize = overlapSize;
  }

  /**
   * Chunk a document while preserving context
   * For legal documents, we want to keep sections together when possible
   */
  chunkDocument(text: string, metadata: Record<string, any>): Chunk[] {
    const chunks: Chunk[] = [];

    // If text is short enough, return as single chunk
    if (text.length <= this.maxChunkSize) {
      chunks.push({
        text: text.trim(),
        metadata,
        id: this.generateChunkId(metadata, 0),
      });
      return chunks;
    }

    // Split into paragraphs first
    const paragraphs = text.split(/\n\n+/);
    let currentChunk = '';
    let chunkIndex = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();

      // If adding this paragraph would exceed max size, save current chunk
      if (currentChunk.length + paragraph.length > this.maxChunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          metadata: {
            ...metadata,
            chunk_index: chunkIndex,
            total_chunks: 0, // Will be updated later
          },
          id: this.generateChunkId(metadata, chunkIndex),
        });

        chunkIndex++;

        // Start new chunk with overlap from previous chunk
        const overlap = this.getLastWords(currentChunk, this.overlapSize);
        currentChunk = overlap + ' ' + paragraph;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        text: currentChunk.trim(),
        metadata: {
          ...metadata,
          chunk_index: chunkIndex,
          total_chunks: 0,
        },
        id: this.generateChunkId(metadata, chunkIndex),
      });
    }

    // Update total_chunks in all chunks
    chunks.forEach((chunk) => {
      chunk.metadata.total_chunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Get last N characters of text, breaking at word boundary
   */
  private getLastWords(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    const substring = text.slice(-maxLength);
    const firstSpace = substring.indexOf(' ');

    return firstSpace === -1 ? substring : substring.slice(firstSpace + 1);
  }

  /**
   * Generate unique chunk ID
   */
  private generateChunkId(metadata: Record<string, any>, chunkIndex: number): string {
    const source = metadata.source_type || 'unknown';
    const citation = metadata.citation?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown';
    return `${source}-${citation}-chunk-${chunkIndex}`;
  }

  /**
   * Batch chunks for efficient processing
   */
  batchChunks<T>(items: T[], batchSize: number = 100): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }

    return batches;
  }
}
