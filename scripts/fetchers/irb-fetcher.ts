import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface IRBDocument {
  citation: string;
  type: 'revenue_ruling' | 'revenue_procedure' | 'notice' | 'announcement' | 'treasury_decision';
  number: string;
  title: string;
  text: string;
  bulletinNumber: string;
  bulletinDate: string;
  url: string;
}

export interface BulletinInfo {
  number: string;
  year: string;
  htmlUrl: string;
  pdfUrl: string;
}

export class IRBFetcher {
  private baseUrl = 'https://www.irs.gov/irb';

  /**
   * Get list of all bulletins from the main IRB page
   */
  async getBulletinList(maxPages: number = 5): Promise<BulletinInfo[]> {
    console.log('📥 Fetching IRS bulletin list...');

    const bulletins: BulletinInfo[] = [];

    try {
      // Fetch main page
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)',
        },
      });

      const $ = cheerio.load(response.data);

      // Parse bulletin table
      // Look for links with pattern like "Internal Revenue Bulletin: 2025-44"
      $('a').each((_, element) => {
        const text = $(element).text().trim();
        const href = $(element).attr('href');

        const match = text.match(/Internal Revenue Bulletin:\s*(\d{4})-(\d+)/);
        if (match && href) {
          const year = match[1];
          const number = match[2];

          bulletins.push({
            number: `${year}-${number}`,
            year,
            htmlUrl: href.startsWith('http') ? href : `https://www.irs.gov${href}`,
            pdfUrl: `https://www.irs.gov/pub/irs-irbs/irb${year.slice(2)}-${number}.pdf`,
          });
        }
      });

      console.log(`✅ Found ${bulletins.length} bulletins`);
      return bulletins;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Failed to fetch bulletin list:', error.message);
        throw new Error(`Failed to fetch bulletin list: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse a single bulletin HTML page
   */
  async parseBulletin(bulletin: BulletinInfo): Promise<IRBDocument[]> {
    console.log(`🔍 Parsing bulletin ${bulletin.number}...`);

    const documents: IRBDocument[] = [];

    try {
      const response = await axios.get(bulletin.htmlUrl, {
        headers: {
          'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)',
        },
      });

      const $ = cheerio.load(response.data);

      // Extract revenue rulings (using name attribute)
      $('a[name*="REV-RUL"], a[name*="Rev-Rul"]').each((_, element) => {
        const name = $(element).attr('name');
        const match = name?.match(/REV-RUL-(\d{4}-\d+)/i);

        if (match) {
          const number = match[1];
          const $anchor = $(element);
          const h2 = $anchor.closest('h2');
          const title = h2.text().replace(/Rev\.\s*Rul\.\s*\d{4}-\d+/i, '').trim() || 'Revenue Ruling';
          const text = this.extractSectionText($, $anchor);

          if (text && text.length > 50) {
            documents.push({
              citation: `Rev. Rul. ${number}`,
              type: 'revenue_ruling',
              number,
              title,
              text,
              bulletinNumber: bulletin.number,
              bulletinDate: bulletin.year,
              url: `${bulletin.htmlUrl}#${name}`,
            });
          }
        }
      });

      // Extract revenue procedures (using name attribute)
      $('a[name*="REV-PROC"], a[name*="Rev-Proc"]').each((_, element) => {
        const name = $(element).attr('name');
        const match = name?.match(/REV-PROC-(\d{4}-\d+)/i);

        if (match) {
          const number = match[1];
          const $anchor = $(element);
          const h2 = $anchor.closest('h2');
          const title = h2.text().replace(/Rev\.\s*Proc\.\s*\d{4}-\d+/i, '').trim() || 'Revenue Procedure';
          const text = this.extractSectionText($, $anchor);

          if (text && text.length > 50) {
            documents.push({
              citation: `Rev. Proc. ${number}`,
              type: 'revenue_procedure',
              number,
              title,
              text,
              bulletinNumber: bulletin.number,
              bulletinDate: bulletin.year,
              url: `${bulletin.htmlUrl}#${name}`,
            });
          }
        }
      });

      // Extract notices (using name attribute, both NOTICE and NOT formats)
      $('a[name*="NOTICE"], a[name*="NOT-"]').each((_, element) => {
        const name = $(element).attr('name');
        const match = name?.match(/(?:NOTICE|NOT)-(\d{4}-\d+)/i);

        if (match) {
          const number = match[1];
          const $anchor = $(element);
          const h2 = $anchor.closest('h2');
          const title = h2.text().replace(/Notice\s*\d{4}-\d+/i, '').trim() || 'Notice';
          const text = this.extractSectionText($, $anchor);

          if (text && text.length > 50) {
            documents.push({
              citation: `Notice ${number}`,
              type: 'notice',
              number,
              title,
              text,
              bulletinNumber: bulletin.number,
              bulletinDate: bulletin.year,
              url: `${bulletin.htmlUrl}#${name}`,
            });
          }
        }
      });

      // Extract Treasury Decisions (using name attribute)
      $('a[name*="TD-"]').each((_, element) => {
        const name = $(element).attr('name');
        const match = name?.match(/TD-(\d+)/i);

        if (match) {
          const number = match[1];
          const $anchor = $(element);
          const h2 = $anchor.closest('h2');
          const title = h2.text().replace(/T\.D\.\s*\d+/i, '').trim() || 'Treasury Decision';
          const text = this.extractSectionText($, $anchor);

          if (text && text.length > 50) {
            documents.push({
              citation: `T.D. ${number}`,
              type: 'treasury_decision',
              number,
              title,
              text,
              bulletinNumber: bulletin.number,
              bulletinDate: bulletin.year,
              url: `${bulletin.htmlUrl}#${name}`,
            });
          }
        }
      });

      console.log(`✅ Found ${documents.length} documents in bulletin ${bulletin.number}`);
      return documents;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ Failed to parse bulletin ${bulletin.number}:`, error.message);
        return []; // Return empty array instead of throwing to continue processing other bulletins
      }
      throw error;
    }
  }

  /**
   * Extract text content from a section
   * IRB HTML structure: <h2> with anchor is followed by </div></div></div> then <div class="sect1"> with content
   */
  private extractSectionText($: cheerio.CheerioAPI, anchor: cheerio.Cheerio): string {
    // The anchor is inside an <h2> which is the heading
    // After the heading's parent divs close, there's a <div class="sect1"> with the content

    const h2 = anchor.closest('h2');
    if (!h2.length) return '';

    // Find the next sect1 div after this heading
    // We need to traverse up and find the next sect1 sibling
    let current = h2.parent();
    let nextSect1 = null;

    // Navigate up through the div hierarchy
    for (let i = 0; i < 5; i++) {
      const nextSiblings = current.nextAll('div.sect1');
      if (nextSiblings.length > 0) {
        nextSect1 = nextSiblings.first();
        break;
      }
      current = current.parent();
      if (!current.length || current.prop('tagName') === 'BODY') break;
    }

    if (!nextSect1 || !nextSect1.length) {
      // Fallback: try to find content in any nearby divs
      const parent = h2.parent();
      const nextDivs = parent.nextAll('div').slice(0, 3);
      return nextDivs.text().replace(/\s+/g, ' ').trim();
    }

    // Extract text from the sect1 div, stopping at the next document heading
    let text = '';
    nextSect1.find('p, div.sect2, div.sect3').each((_, el) => {
      const $el = $(el);
      // Stop if we hit another document (would have h2 with anchor)
      if ($el.find('a[name*="TD-"], a[name*="NOT-"], a[name*="REV-"]').length > 0) {
        return false;
      }
      text += $el.text() + '\n';
    });

    // Clean up extra whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Fetch recent bulletins (e.g., last N bulletins)
   */
  async fetchRecent(count: number = 10): Promise<IRBDocument[]> {
    console.log(`🚀 Fetching ${count} most recent IRS bulletins...`);

    const bulletins = await this.getBulletinList();
    const recentBulletins = bulletins.slice(0, count);

    const allDocuments: IRBDocument[] = [];

    for (const bulletin of recentBulletins) {
      const documents = await this.parseBulletin(bulletin);
      allDocuments.push(...documents);

      // Add delay to be respectful to IRS servers
      await this.delay(1000);
    }

    console.log(`✅ Fetched ${allDocuments.length} documents from ${count} bulletins`);
    return allDocuments;
  }

  /**
   * Fetch all available bulletins (WARNING: This will take a long time!)
   */
  async fetchAll(): Promise<IRBDocument[]> {
    console.log('🚀 Fetching ALL IRS bulletins... (this may take hours)');

    const bulletins = await this.getBulletinList();
    const allDocuments: IRBDocument[] = [];

    for (let i = 0; i < bulletins.length; i++) {
      const bulletin = bulletins[i];
      console.log(`Processing ${i + 1}/${bulletins.length}: ${bulletin.number}`);

      const documents = await this.parseBulletin(bulletin);
      allDocuments.push(...documents);

      // Add delay to be respectful to IRS servers
      await this.delay(2000);

      // Save progress every 10 bulletins
      if ((i + 1) % 10 === 0) {
        await this.saveProgress(allDocuments, i + 1);
      }
    }

    console.log(`✅ Fetched ${allDocuments.length} documents from ${bulletins.length} bulletins`);
    return allDocuments;
  }

  /**
   * Save progress to file
   */
  private async saveProgress(documents: IRBDocument[], count: number): Promise<void> {
    const filepath = path.join(process.cwd(), 'data', `irb-progress-${count}.json`);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(documents, null, 2));
    console.log(`💾 Saved progress: ${documents.length} documents (${count} bulletins processed)`);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
