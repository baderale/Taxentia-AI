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
  private requestDelay = 100; // milliseconds between requests (rate limiting)

  constructor() {}

  /**
   * Fetch all Title 26 sections from Cornell LII
   */
  async fetchAll(): Promise<USCSection[]> {
    console.log('🚀 Starting Cornell LII Title 26 fetch...');
    console.log('📥 Fetching table of contents from Cornell LII...');

    try {
      // Step 1: Fetch the main Title 26 page to get list of sections
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)',
        },
        timeout: 30000, // 30 second timeout
      });

      const $ = cheerio.load(response.data);
      const sectionLinks: Array<{ section: string; url: string; title: string }> = [];

      // Parse the table of contents to extract section links
      // Cornell uses different HTML structures, so we need to be flexible
      console.log('🔍 Parsing table of contents...');

      // Look for section links in the main content area
      // Cornell typically uses <li> or <a> elements with section numbers
      $('a[href*="/uscode/text/26/"]').each((i, element) => {
        const href = $(element).attr('href');
        const text = $(element).text().trim();

        if (href && href.includes('/uscode/text/26/')) {
          // Extract section number from URL
          const match = href.match(/\/uscode\/text\/26\/(\d+[A-Za-z]?)/);
          if (match && match[1]) {
            const sectionNum = match[1];
            const fullUrl = href.startsWith('http') ? href : `https://www.law.cornell.edu${href}`;

            // Skip if we already have this section
            if (!sectionLinks.find(link => link.section === sectionNum)) {
              sectionLinks.push({
                section: sectionNum,
                url: fullUrl,
                title: text || `Section ${sectionNum}`,
              });
            }
          }
        }
      });

      console.log(`✅ Found ${sectionLinks.length} section links`);

      if (sectionLinks.length === 0) {
        console.warn('⚠️ No section links found in table of contents');
        console.warn('This might indicate a change in Cornell LII HTML structure');
        throw new Error('No sections found in Cornell LII table of contents');
      }

      // Step 2: Fetch each section (with rate limiting)
      const sections: USCSection[] = [];
      let successCount = 0;
      let failCount = 0;

      console.log(`📚 Fetching ${sectionLinks.length} sections...`);

      for (let i = 0; i < sectionLinks.length; i++) {
        const link = sectionLinks[i];

        try {
          const section = await this.fetchSection(link.url, link.section, link.title);
          if (section) {
            sections.push(section);
            successCount++;

            // Log progress every 100 sections
            if ((i + 1) % 100 === 0) {
              console.log(`  Progress: ${i + 1}/${sectionLinks.length} sections fetched`);
            }
          }
        } catch (error) {
          failCount++;
          console.warn(`⚠️ Failed to fetch section ${link.section}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Rate limiting: wait between requests
        if (i < sectionLinks.length - 1) {
          await this.delay(this.requestDelay);
        }
      }

      console.log(`✅ Successfully fetched ${successCount} sections`);
      if (failCount > 0) {
        console.warn(`⚠️ Failed to fetch ${failCount} sections`);
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
    console.log(`📥 Fetching section ${sectionNum} from Cornell LII...`);
    return this.fetchSection(url, sectionNum, `Section ${sectionNum}`);
  }
}
