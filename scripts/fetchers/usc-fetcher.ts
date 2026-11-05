import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';

export interface USCSection {
  citation: string;
  section: string;
  title: string;
  text: string;
  url: string;
  versionDate?: string;
}

// Used only if the download page can't be read. Update it when a newer release is known.
const FALLBACK_RELEASE = { congress: '119', law: '136' };

const BLOCK_TAGS = /<\/?(?:subsection|paragraph|subparagraph|clause|subclause|item|subitem|chapeau|continuation|content|p|tr)\b[^>]*>/g;
const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|\w+);/g, (match, code: string) => {
    if (code.startsWith('#x')) return String.fromCodePoint(parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(1), 10));
    return ENTITIES[code] ?? match;
  });
}

/** Turns one section's XML into readable text, keeping words and references in their original order. */
function xmlToText(xml: string): string {
  const text = xml
    .replace(/<\/heading>/g, ' ')
    .replace(/<\/(?:td|th)>/g, ' ')
    .replace(BLOCK_TAGS, '\n\n')
    .replace(/<[^>]+>/g, '');
  return decodeEntities(text)
    .replace(/[ \t\u00a0\u202f]+/g, ' ')
    .replace(/ *\n\s*/g, '\n\n')
    .trim();
}

export class USCFetcher {
  private baseUrl = 'https://uscode.house.gov/download';
  private release = FALLBACK_RELEASE;

  /** Finds the current release, such as Public Law 119-136, from the official download page. */
  private async findLatestRelease(): Promise<{ congress: string; law: string }> {
    try {
      const page = await axios.get<string>(`${this.baseUrl}/download.shtml`, {
        headers: { 'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)' },
        timeout: 30000,
      });
      const match = String(page.data).match(/Public Law (\d+)-(\d+)/);
      if (match) return { congress: match[1], law: match[2] };
      console.warn('⚠️ No release found on the download page, using the fallback release');
    } catch (error) {
      console.warn('⚠️ Could not read the download page, using the fallback release');
    }
    return FALLBACK_RELEASE;
  }

  /**
   * Download Title 26 XML from uscode.house.gov with retry logic
   */
  async downloadTitle26XML(): Promise<string> {
    console.log('📥 Downloading US Code Title 26 XML (ZIP file)...');

    this.release = await this.findLatestRelease();
    const { congress, law } = this.release;
    console.log(`📌 Using release Public Law ${congress}-${law}`);

    const maxRetries = 3;
    const timeouts = [180000, 300000, 420000]; // 3min, 5min, 7min
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const timeout = timeouts[attempt];
        console.log(`🔄 Attempt ${attempt + 1}/${maxRetries} (timeout: ${timeout / 1000}s)...`);

        // The actual download URL for Title 26 XML (it's a ZIP file!)
        const downloadUrl = `${this.baseUrl}/releasepoints/us/pl/${congress}/${law}/xml_usc26@${congress}-${law}.zip`;

        const response = await axios.get(downloadUrl, {
          responseType: 'arraybuffer',
          headers: {
            'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)',
            'Accept-Encoding': 'gzip, deflate',
          },
          timeout: timeout,
          maxRedirects: 5,
        });

        console.log('✅ Downloaded Title 26 ZIP successfully');

        // Extract XML from ZIP
        const zip = new AdmZip(Buffer.from(response.data));
        const zipEntries = zip.getEntries();

        console.log(`📦 ZIP contains ${zipEntries.length} files`);

        // Find the main XML file (usually usc26.xml or similar)
        const xmlEntry = zipEntries.find(
          (entry) => entry.entryName.endsWith('.xml') && !entry.entryName.includes('/')
        );

        if (!xmlEntry) {
          throw new Error('No XML file found in ZIP archive');
        }

        console.log(`📄 Extracting ${xmlEntry.entryName}...`);
        const xmlContent = zip.readAsText(xmlEntry);

        console.log('✅ Extracted XML successfully');
        return xmlContent;
      } catch (error) {
        lastError = error as Error;
        if (axios.isAxiosError(error)) {
          const errorMsg = error.code === 'ECONNABORTED' ? 'timeout' : error.message;
          console.error(`❌ Attempt ${attempt + 1} failed: ${errorMsg}`);

          // If this isn't the last attempt, wait before retrying
          if (attempt < maxRetries - 1) {
            const waitTime = (attempt + 1) * 5000; // 5s, 10s
            console.log(`⏳ Waiting ${waitTime / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        } else {
          throw error;
        }
      }
    }

    // All retries failed
    if (axios.isAxiosError(lastError)) {
      console.error('❌ Failed to download USC Title 26 after all retries:', lastError.message);
      throw new Error(`Failed to download USC Title 26: ${lastError.message}`);
    }
    throw lastError || new Error('Failed to download USC Title 26');
  }

  /**
   * Extracts current sections from the USLM XML. Each section is found by its identifier, so
   * it doesn't matter how deeply it is nested. Repealed, renumbered, omitted and reserved
   * sections are skipped, and so are editorial notes and source credits.
   */
  async parseTitle26XML(xmlContent: string): Promise<USCSection[]> {
    console.log('🔍 Parsing Title 26 XML...');

    const starts = Array.from(
      xmlContent.matchAll(/<section\b[^>]*\bidentifier="\/us\/usc\/t26\/s([^"\/]+)"[^>]*>/g),
    );
    if (starts.length === 0) {
      throw new Error('Failed to parse Title 26 XML: no sections found');
    }

    const { congress, law } = this.release;
    const sections: USCSection[] = [];

    starts.forEach((start, index) => {
      if (/\bstatus="/.test(start[0]) || start[1].includes('...')) return;

      const from = start.index! + start[0].length;
      const to = starts[index + 1]?.index ?? xmlContent.length;
      let body = xmlContent.slice(from, to);

      const endMarkers = ['<notes', '<sourceCredit'].map((tag) => body.indexOf(tag)).filter((at) => at >= 0);
      if (endMarkers.length > 0) {
        body = body.slice(0, Math.min(...endMarkers));
      } else if (body.includes('</section>')) {
        body = body.slice(0, body.lastIndexOf('</section>'));
      }

      const sectionNum = start[1].replace(/[\u2013\u2014]/g, '-');
      const heading = body.match(/<heading[^>]*>([\s\S]*?)<\/heading>/);
      const text = xmlToText(body);
      if (text.length <= 50) return;

      sections.push({
        citation: `26 U.S.C. § ${sectionNum}`,
        section: sectionNum,
        title: heading ? decodeEntities(heading[1].replace(/<[^>]+>/g, '')).trim().replace(/\.$/, '') : `Section ${sectionNum}`,
        text,
        url: `https://www.law.cornell.edu/uscode/text/26/${sectionNum}`,
        versionDate: `Public Law ${congress}-${law}`,
      });
    });

    console.log(`✅ Parsed ${sections.length} current sections from ${starts.length} in Title 26`);
    return sections;
  }

  async fetchAll(): Promise<USCSection[]> {
    console.log('🚀 Starting USC Title 26 fetch...');

    const xmlContent = await this.downloadTitle26XML();
    const sections = await this.parseTitle26XML(xmlContent);

    return sections;
  }

  /**
   * Save XML to file for debugging
   */
  async saveXMLToFile(xmlContent: string, filename: string = 'title26.xml'): Promise<void> {
    const filepath = path.join(process.cwd(), 'data', filename);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, xmlContent);
    console.log(`💾 Saved XML to ${filepath}`);
  }
}
