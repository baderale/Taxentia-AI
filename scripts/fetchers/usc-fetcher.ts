import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface USCSection {
  citation: string;
  section: string;
  title: string;
  text: string;
  url: string;
}

export class USCFetcher {
  private baseUrl = 'https://uscode.house.gov/download';
  private xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
  }

  /**
   * Download Title 26 XML from uscode.house.gov
   */
  async downloadTitle26XML(): Promise<string> {
    console.log('📥 Downloading US Code Title 26 XML...');

    try {
      // The actual download URL for Title 26 XML
      const downloadUrl = `${this.baseUrl}/xml/title26.xml`;

      const response = await axios.get(downloadUrl, {
        responseType: 'text',
        headers: {
          'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)',
        },
        timeout: 60000, // 60 second timeout
      });

      console.log('✅ Downloaded Title 26 XML successfully');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('❌ Failed to download USC Title 26:', error.message);
        throw new Error(`Failed to download USC Title 26: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse XML and extract sections
   */
  async parseTitle26XML(xmlContent: string): Promise<USCSection[]> {
    console.log('🔍 Parsing Title 26 XML...');

    const sections: USCSection[] = [];

    try {
      const parsed = this.xmlParser.parse(xmlContent);

      // Navigate the XML structure (this may need adjustment based on actual XML structure)
      // Typical structure: title -> subtitle -> chapter -> subchapter -> section
      const title = parsed.title || parsed;

      // Extract sections recursively
      this.extractSections(title, sections);

      console.log(`✅ Parsed ${sections.length} sections from Title 26`);
      return sections;
    } catch (error) {
      console.error('❌ Failed to parse XML:', error);
      throw new Error('Failed to parse Title 26 XML');
    }
  }

  /**
   * Recursively extract sections from XML structure
   */
  private extractSections(node: any, sections: USCSection[], parentPath = ''): void {
    if (!node) return;

    // Check if this is a section node
    if (node.section) {
      const sectionArray = Array.isArray(node.section) ? node.section : [node.section];

      for (const section of sectionArray) {
        const sectionNum = section['@_num'] || section['@_identifier'] || 'unknown';
        const heading = section.heading || section['@_heading'] || '';
        const content = this.extractTextContent(section);

        if (content && content.length > 50) { // Only include substantial sections
          sections.push({
            citation: `26 USC § ${sectionNum}`,
            section: sectionNum,
            title: heading,
            text: content,
            url: `https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section${sectionNum}`,
          });
        }
      }
    }

    // Recursively process child nodes
    for (const key in node) {
      if (typeof node[key] === 'object' && key !== '@_') {
        this.extractSections(node[key], sections, parentPath);
      }
    }
  }

  /**
   * Extract text content from a node
   */
  private extractTextContent(node: any): string {
    if (!node) return '';

    let text = '';

    if (typeof node === 'string') {
      return node;
    }

    if (node['#text']) {
      text += node['#text'] + ' ';
    }

    // Recursively extract text from children
    for (const key in node) {
      if (key !== '@_' && key !== '#text' && typeof node[key] === 'object') {
        text += this.extractTextContent(node[key]);
      }
    }

    return text.trim();
  }

  /**
   * Fetch all Title 26 sections
   */
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
