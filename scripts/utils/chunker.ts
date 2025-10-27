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

      // If paragraph itself is too large, split it by sentences
      if (paragraph.length > this.maxChunkSize) {
        const sentences = this.splitIntoSentences(paragraph);

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > this.maxChunkSize && currentChunk.length > 0) {
            chunks.push({
              text: currentChunk.trim(),
              metadata: {
                ...metadata,
                chunk_index: chunkIndex,
                total_chunks: 0,
              },
              id: this.generateChunkId(metadata, chunkIndex),
            });

            chunkIndex++;
            const overlap = this.getLastWords(currentChunk, this.overlapSize);
            currentChunk = overlap + ' ' + sentence;
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      } else {
        // Normal paragraph handling
        if (currentChunk.length + paragraph.length > this.maxChunkSize && currentChunk.length > 0) {
          chunks.push({
            text: currentChunk.trim(),
            metadata: {
              ...metadata,
              chunk_index: chunkIndex,
              total_chunks: 0,
            },
            id: this.generateChunkId(metadata, chunkIndex),
          });

          chunkIndex++;
          const overlap = this.getLastWords(currentChunk, this.overlapSize);
          currentChunk = overlap + ' ' + paragraph;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
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
   * Split text into sentences for finer-grained chunking
   */
  private splitIntoSentences(text: string): string[] {
    // Split on sentence boundaries (. ! ?) followed by space and capital letter
    // Also handle common abbreviations
    const sentences = text.match(/[^.!?]+[.!?]+(?=\s+[A-Z]|$)/g) || [text];

    return sentences.map((s) => s.trim()).filter((s) => s.length > 0);
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
