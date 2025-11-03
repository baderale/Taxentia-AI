import axios from 'axios';
import * as cheerio from 'cheerio';

// Re-export the interface for consistency
export interface USCSection {
  citation: string;
  section: string;
  title: string;
  text: string;
  url: string;
}

/**
 * Fetches US Code Title 26 sections from Cornell Legal Information Institute (LII)
 * Uses HTML scraping as fallback when house.gov ZIP downloads fail
 */
export class CornellLIIFetcher {
  private baseUrl = 'https://www.law.cornell.edu/uscode/text/26';
  private requestDelay = 10000; // milliseconds between requests (rate limiting per robots.txt)

  constructor() {}

  /**
   * Fetch all Title 26 sections from Cornell LII using direct iteration
   * Note: Cornell's navigation is hierarchical (5 levels deep), but we can access
   * sections directly via URL pattern: /uscode/text/26/{number}
   */
  async fetchAll(): Promise<USCSection[]> {
    console.log('🚀 Starting Cornell LII Title 26 fetch...');
    console.log('📋 Using direct iteration approach (sections 1-9834)');
    console.log('⏱️  Rate limit: 10 seconds between requests per robots.txt');

    const sections: USCSection[] = [];
    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;

    // Known USC Title 26 section range
    // Most sections are in the 1-9834 range based on typical USC structure
    const MAX_SECTION = 9834;

    try {
      console.log(`📚 Attempting to fetch up to ${MAX_SECTION} sections...`);

      for (let sectionNum = 1; sectionNum <= MAX_SECTION; sectionNum++) {
        try {
          const section = await this.fetchSectionByNumber(sectionNum.toString());

          if (section) {
            sections.push(section);
            successCount++;

            // Log progress every 100 sections
            if (sectionNum % 100 === 0) {
              console.log(`  Progress: ${sectionNum}/${MAX_SECTION} checked | ✅ ${successCount} found | ⏭️  ${notFoundCount} skipped | ❌ ${errorCount} errors`);
            }
          } else {
            notFoundCount++;
          }
        } catch (error) {
          // Handle 404s and other errors gracefully
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            notFoundCount++;
          } else {
            errorCount++;
            if (errorCount % 10 === 0) {
              console.warn(`⚠️ ${errorCount} errors encountered (continuing...)`);
            }
          }
        }

        // Rate limiting: wait between requests (except for last one)
        if (sectionNum < MAX_SECTION) {
          await this.delay(this.requestDelay);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('📊 Cornell LII Fetch Complete');
      console.log('='.repeat(60));
      console.log(`✅ Successfully fetched: ${successCount} sections`);
      console.log(`⏭️  Not found (404s): ${notFoundCount} sections`);
      console.log(`❌ Errors: ${errorCount} sections`);
      console.log('='.repeat(60) + '\n');

      if (sections.length === 0) {
        throw new Error('No sections found - Cornell LII may be unreachable or structure changed');
      }

      return sections;
    } catch (error) {
      console.error('❌ Failed to fetch Cornell LII Title 26:', error);
      throw new Error(`Failed to fetch from Cornell LII: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch an individual section from Cornell LII
   */
  private async fetchSection(url: string, sectionNum: string, sectionTitle: string): Promise<USCSection | null> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)',
        },
        timeout: 15000, // 15 second timeout per section
      });

      const $ = cheerio.load(response.data);

      // Extract the section title (try multiple selectors)
      let title = sectionTitle;
      const titleSelectors = [
        'h1.title',
        'h1',
        '.section-title',
        'h2.title',
      ];

      for (const selector of titleSelectors) {
        const titleText = $(selector).first().text().trim();
        if (titleText && titleText.length > 0 && titleText.length < 500) {
          // Clean up the title (remove section number prefix if present)
          title = titleText.replace(/^§\s*\d+[A-Za-z]?\.\s*/, '').trim();
          if (title.length > 0) break;
        }
      }

      // Extract the section content (try multiple selectors)
      let text = '';
      const contentSelectors = [
        '.content',
        '#content',
        '.field-item',
        'article',
        'main',
        '.section-content',
      ];

      for (const selector of contentSelectors) {
        const contentElement = $(selector).first();
        if (contentElement.length > 0) {
          // Remove unwanted elements (navigation, headers, footers)
          contentElement.find('nav, header, footer, .nav, .breadcrumb, script, style').remove();

          // Get text content
          text = contentElement.text().trim();

          // Clean up whitespace
          text = text.replace(/\s+/g, ' ').trim();

          if (text.length > 100) break; // Found substantial content
        }
      }

      // Fallback: get all text if no selector worked
      if (text.length < 100) {
        $('script, style, nav, header, footer').remove();
        text = $('body').text().trim().replace(/\s+/g, ' ');
      }

      // Validate that we got meaningful content
      if (text.length < 50) {
        console.warn(`⚠️ Section ${sectionNum} has insufficient content (${text.length} chars)`);
        return null;
      }

      return {
        citation: `26 U.S.C. § ${sectionNum}`,
        section: sectionNum,
        title: title || `Section ${sectionNum}`,
        text: text,
        url: url,
      };
    } catch (error) {
      console.warn(`Failed to fetch section ${sectionNum} from ${url}:`, error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  }

  /**
   * Delay helper for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch a specific section by number (useful for testing)
   */
  async fetchSectionByNumber(sectionNum: string): Promise<USCSection | null> {
    const url = `${this.baseUrl}/${sectionNum}`;
    return this.fetchSection(url, sectionNum, `Section ${sectionNum}`);
  }
}
