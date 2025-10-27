import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface CFRRegulation {
  citation: string;
  part: string;
  section: string;
  title: string;
  text: string;
  url: string;
}

export class CFRFetcher {
  private baseUrl = 'https://www.govinfo.gov/bulkdata/ECFR';
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
  }

  /**
   * Download CFR Title 26 XML from govinfo.gov
   */
  async downloadTitle26XML(): Promise<string> {
    console.log('📥 Downloading CFR Title 26 XML...');

    try {
      const downloadUrl = `${this.baseUrl}/title-26/ECFR-title26.xml`;

      const response = await axios.get(downloadUrl, {
        responseType: 'text',
        headers: {
          'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)',
        },
        timeout: 120000, // 2 minute timeout (file is 83MB)
        maxContentLength: 100 * 1024 * 1024, // 100MB max
      });

      console.log('✅ Downloaded CFR Title 26 XML successfully');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Failed to download CFR Title 26:', error.message);
        throw new Error(`Failed to download CFR Title 26: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse XML and extract regulations
   */
  async parseTitle26XML(xmlContent: string): Promise<CFRRegulation[]> {
    console.log('🔍 Parsing CFR Title 26 XML...');

    const regulations: CFRRegulation[] = [];

    try {
      const parsed = this.xmlParser.parse(xmlContent);

      // Navigate the eCFR XML structure
      // Structure: TITLE -> CHAPTER -> SUBCHAPTER -> PART -> SUBPART -> SECTION
      const title = parsed.TITLE || parsed.title || parsed;

      this.extractRegulations(title, regulations);

      console.log(`✅ Parsed ${regulations.length} regulations from CFR Title 26`);
      return regulations;
    } catch (error) {
      console.error('❌ Failed to parse CFR XML:', error);
      throw new Error('Failed to parse CFR Title 26 XML');
    }
  }

  /**
   * Recursively extract regulations from XML structure
   */
  private extractRegulations(node: any, regulations: CFRRegulation[], context: any = {}): void {
    if (!node) return;

    // Track part number for context
    if (node['@_N'] && node.TAG === 'PART') {
      context.part = node['@_N'];
    }

    // Check if this is a SECTION node
    if (node.TAG === 'SECTION' || node.SECTION) {
      const sections = node.SECTION ? (Array.isArray(node.SECTION) ? node.SECTION : [node.SECTION]) : [node];

      for (const section of sections) {
        const sectionNum = section['@_N'] || section['@_num'] || 'unknown';
        const subject = section.SUBJECT || section.subject || '';
        const content = this.extractTextContent(section);

        if (content && content.length > 50) {
          const fullSection = `${context.part}.${sectionNum}`;
          regulations.push({
            citation: `26 CFR § ${fullSection}`,
            part: context.part || 'unknown',
            section: fullSection,
            title: typeof subject === 'string' ? subject : this.extractTextContent(subject),
            text: content,
            url: `https://www.ecfr.gov/current/title-26/section-${fullSection}`,
          });
        }
      }
    }

    // Recursively process child nodes
    for (const key in node) {
      if (typeof node[key] === 'object' && key !== '@_') {
        const childArray = Array.isArray(node[key]) ? node[key] : [node[key]];
        for (const child of childArray) {
          this.extractRegulations(child, regulations, { ...context });
        }
      }
    }
  }

  /**
   * Extract text content from a node
   */
  private extractTextContent(node: any): string {
    if (!node) return '';

    if (typeof node === 'string') {
      return node;
    }

    let text = '';

    if (node['#text']) {
      text += node['#text'] + ' ';
    }

    if (node.P) {
      const paragraphs = Array.isArray(node.P) ? node.P : [node.P];
      text += paragraphs.map((p: any) => this.extractTextContent(p)).join(' ');
    }

    // Recursively extract text from other children
    for (const key in node) {
      if (key !== '@_' && key !== '#text' && key !== 'P' && typeof node[key] === 'object') {
        text += this.extractTextContent(node[key]);
      }
    }

    return text.trim();
  }

  /**
   * Fetch all CFR Title 26 regulations
   */
  async fetchAll(): Promise<CFRRegulation[]> {
    console.log('🚀 Starting CFR Title 26 fetch...');

    const xmlContent = await this.downloadTitle26XML();
    const regulations = await this.parseTitle26XML(xmlContent);

    return regulations;
  }

  /**
   * Save XML to file for debugging
   */
  async saveXMLToFile(xmlContent: string, filename: string = 'cfr-title26.xml'): Promise<void> {
    const filepath = path.join(process.cwd(), 'data', filename);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, xmlContent);
    console.log(`💾 Saved XML to ${filepath}`);
  }
}
