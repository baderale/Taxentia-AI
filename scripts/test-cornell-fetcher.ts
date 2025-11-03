#!/usr/bin/env tsx
/**
 * Quick test script for Cornell LII fetcher
 * Tests fetching a few sample sections
 */

import { CornellLIIFetcher } from './fetchers/cornell-lii-fetcher.js';

async function main() {
  console.log('🧪 Testing Cornell LII Fetcher...\n');

  const fetcher = new CornellLIIFetcher();

  // Test with a few well-known sections
  const testSections = ['61', '179', '401'];

  for (const sectionNum of testSections) {
    try {
      console.log(`\n📥 Fetching section ${sectionNum}...`);
      const section = await fetcher.fetchSectionByNumber(sectionNum);

      if (section) {
        console.log(`✅ Successfully fetched section ${sectionNum}`);
        console.log(`   Citation: ${section.citation}`);
        console.log(`   Title: ${section.title}`);
        console.log(`   URL: ${section.url}`);
        console.log(`   Text length: ${section.text.length} characters`);
        console.log(`   Text preview: ${section.text.substring(0, 200)}...`);
      } else {
        console.log(`❌ Failed to fetch section ${sectionNum} (returned null)`);
      }
    } catch (error) {
      console.error(`❌ Error fetching section ${sectionNum}:`, error);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎉 Test complete!');
}

main().catch(console.error);
