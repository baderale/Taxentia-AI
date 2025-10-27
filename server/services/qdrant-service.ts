import { QdrantClient } from '@qdrant/js-client-rest';

export interface QdrantPoint {
  id: string | number;
  vector: number[];
  payload?: Record<string, any>;
}

export interface QdrantSearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, any>;
}

class QdrantService {
  private client: QdrantClient;
  private collectionName: string;

  constructor() {
    const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    const collectionName = process.env.QDRANT_COLLECTION_NAME || 'taxentia-authorities';

    console.log('Qdrant service initialized:', {
      url: qdrantUrl,
      collection: collectionName
    });

    this.client = new QdrantClient({ url: qdrantUrl });
    this.collectionName = collectionName;
  }

  /**
   * Initialize collection if it doesn't exist
   */
  async ensureCollection(vectorSize: number = 1536): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (col) => col.name === this.collectionName
      );

      if (!exists) {
        console.log(`Creating collection: ${this.collectionName}`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: vectorSize, // OpenAI text-embedding-3-small size
            distance: 'Cosine',
          },
        });
        console.log(`Collection ${this.collectionName} created successfully`);
      } else {
        console.log(`Collection ${this.collectionName} already exists`);
      }
    } catch (error: unknown) {
      console.error('Error ensuring collection:', error);
      if (error instanceof Error) {
        console.error('Qdrant client error details:', error.message);
      }
      throw new Error('Failed to ensure Qdrant collection exists.');
    }
  }

  /**
   * Query similar vectors
   * @param embedding - Query vector
   * @param topK - Number of results to return
   * @param filter - Optional metadata filter
   */
  async query(
    embedding: number[],
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<QdrantSearchResult[]> {
    try {
      const searchResult = await this.client.search(this.collectionName, {
        vector: embedding,
        limit: topK,
        with_payload: true,
        filter: filter,
      });

      // Transform to match Pinecone-like interface for easier migration
      return searchResult.map((result) => ({
        id: result.id,
        score: result.score,
        payload: result.payload,
      }));
    } catch (error: unknown) {
      console.error('Error querying Qdrant:', error);
      if (error instanceof Error) {
        console.error('Qdrant client error details:', error.message);
      }
      throw new Error('Failed to query Qdrant.');
    }
  }

  /**
   * Convert string ID to numeric ID for Qdrant
   * Uses a simple hash function to create consistent numeric IDs from strings
   */
  private stringToNumericId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Upsert vectors to collection
   * @param points - Array of points with id, vector, and optional payload
   */
  async upsert(points: QdrantPoint[]): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: points.map((point) => ({
          id: typeof point.id === 'string' ? this.stringToNumericId(point.id) : point.id,
          vector: point.vector,
          payload: {
            ...point.payload,
            originalId: point.id.toString() // Store original ID in payload
          },
        })),
      });
      console.log(`Successfully upserted ${points.length} points to Qdrant`);
    } catch (error: unknown) {
      console.error('Error upserting to Qdrant:', error);
      if (error instanceof Error) {
        console.error('Qdrant client error details:', error.message);
      }
      throw new Error('Failed to upsert vectors to Qdrant.');
    }
  }

  /**
   * Delete the entire collection (use with caution!)
   */
  async deleteCollection(): Promise<void> {
    try {
      await this.client.deleteCollection(this.collectionName);
      console.log(`Collection ${this.collectionName} deleted successfully`);
    } catch (error: unknown) {
      console.error('Error deleting collection:', error);
      if (error instanceof Error) {
        console.error('Qdrant client error details:', error.message);
      }
      throw new Error('Failed to delete Qdrant collection.');
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo() {
    try {
      return await this.client.getCollection(this.collectionName);
    } catch (error: unknown) {
      console.error('Error getting collection info:', error);
      if (error instanceof Error) {
        console.error('Qdrant client error details:', error.message);
      }
      throw new Error('Failed to get Qdrant collection info.');
    }
  }
}

export const qdrantService = new QdrantService();
