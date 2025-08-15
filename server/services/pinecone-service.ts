import { Pinecone, PineconeRecord } from '@pinecone-database/pinecone';
// No Vector import needed if using PineconeRecord for upsert

class PineconeService {
  private pinecone: Pinecone;
  private indexName: string;

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!apiKey || !indexName) {
      console.error('Pinecone environment variables missing:', {
        apiKey: apiKey ? '***' + apiKey.substring(apiKey.length - 4) : 'MISSING',
        indexName: indexName || 'MISSING'
      });
      throw new Error('Pinecone API key or index name not set in environment variables.');
    }
    console.log('Pinecone service initialized for index:', indexName);

    this.pinecone = new Pinecone({ apiKey });
    this.indexName = indexName;
  }

  async query(embedding: number[], topK: number = 5) {
    try {
      const index = this.pinecone.index(this.indexName); // Pass index name as string
      const results = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true, // Ensure we get the text content back
      });

      return results.matches || [];
    } catch (error: unknown) { // Explicitly type as unknown
      console.error("Error querying Pinecone:", error);
      if (error instanceof Error) {
        console.error("Pinecone client error details:", error.message);
      }
      // Check if error has a 'response' property (common for HTTP errors)
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object' && (error as any).response !== null && 'data' in (error as any).response) {
        console.error("Pinecone API response error:", (error as any).response.data);
      }
      throw new Error("Failed to query Pinecone.");
    }
  }

  async upsert(vectors: PineconeRecord[]): Promise<void> { // Use PineconeRecord[] for upsert
    try {
      const index = this.pinecone.index(this.indexName); // Pass index name as string
      await index.upsert(vectors);
    } catch (error: unknown) { // Explicitly type as unknown
      console.error("Error upserting to Pinecone:", error);
      if (error instanceof Error) {
        console.error("Pinecone client error details:", error.message);
      }
      // Check if error has a 'response' property (common for HTTP errors)
      if (typeof error === 'object' && error !== null && 'response' in error && typeof (error as any).response === 'object' && (error as any).response !== null && 'data' in (error as any).response) {
        console.error("Pinecone API response error:", (error as any).response.data);
      }
      throw new Error("Failed to upsert vectors to Pinecone.");
    }
  }
}

export const pineconeService = new PineconeService();
