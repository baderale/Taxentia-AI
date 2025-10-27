/**
 * Inspect Qdrant collection data
 * Usage: npx tsx scripts/inspect-qdrant.ts
 */

import { QdrantClient } from '@qdrant/js-client-rest';

const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION_NAME = 'taxentia-authorities';

async function inspectQdrant() {
  const client = new QdrantClient({ url: QDRANT_URL });

  console.log('🔍 Inspecting Qdrant Collection:', COLLECTION_NAME);
  console.log('=' .repeat(80));

  try {
    // Get collection info
    const collectionInfo = await client.getCollection(COLLECTION_NAME);
    console.log('\n📊 Collection Statistics:');
    console.log(`  Points Count: ${collectionInfo.points_count}`);
    console.log(`  Vectors Size: ${collectionInfo.config.params.vectors.size}`);
    console.log(`  Distance: ${collectionInfo.config.params.vectors.distance}`);
    console.log(`  Status: ${collectionInfo.status}`);

    // Get sample points
    console.log('\n📝 Sample Points (First 5):');
    console.log('-'.repeat(80));

    const response = await client.scroll(COLLECTION_NAME, {
      limit: 5,
      with_payload: true,
      with_vector: false,
    });

    for (let i = 0; i < response.points.length; i++) {
      const point = response.points[i];
      const payload = point.payload as any;

      console.log(`\n[${i + 1}] Point ID: ${point.id}`);
      console.log(`    Source Type: ${payload.source_type}`);
      console.log(`    Citation: ${payload.citation}`);
      console.log(`    Title: ${payload.title || 'N/A'}`);
      console.log(`    Chunk: ${payload.chunk_index + 1}/${payload.total_chunks}`);
      console.log(`    Text Length: ${payload.text?.length || 0} chars`);
      console.log(`    Text Preview: ${payload.text?.substring(0, 150)}...`);

      if (payload.bulletin_number) {
        console.log(`    Bulletin: ${payload.bulletin_number} (${payload.bulletin_date})`);
      }
      if (payload.section) {
        console.log(`    Section: ${payload.section}`);
      }
    }

    // Get breakdown by source type
    console.log('\n\n📊 Breakdown by Source Type:');
    console.log('-'.repeat(80));

    const sourceTypes = ['revenue_ruling', 'revenue_procedure', 'notice', 'treasury_decision', 'irc', 'usc'];

    for (const sourceType of sourceTypes) {
      const countResponse = await client.scroll(COLLECTION_NAME, {
        filter: {
          must: [{ key: 'source_type', match: { value: sourceType } }],
        },
        limit: 1,
        with_payload: false,
        with_vector: false,
      });

      // Count all matching points
      let count = 0;
      let offset = null;

      do {
        const batch = await client.scroll(COLLECTION_NAME, {
          filter: {
            must: [{ key: 'source_type', match: { value: sourceType } }],
          },
          limit: 100,
          offset: offset,
          with_payload: false,
          with_vector: false,
        });

        count += batch.points.length;
        offset = batch.next_page_offset;
      } while (offset);

      if (count > 0) {
        console.log(`  ${sourceType}: ${count} chunks`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Inspection complete!');
    console.log(`\n💡 View full data in dashboard: ${QDRANT_URL}/dashboard`);
  } catch (error) {
    console.error('❌ Error inspecting Qdrant:', error);
    throw error;
  }
}

inspectQdrant().catch(console.error);
