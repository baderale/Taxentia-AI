import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs/promises';
import * as path from 'path';
import AdmZip from 'adm-zip';

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
      ignoreDeclaration: true, // Ignore <?xml?> declaration
    });
  }

  /**
   * Download Title 26 XML from uscode.house.gov
   */
  async downloadTitle26XML(): Promise<string> {
    console.log('📥 Downloading US Code Title 26 XML (ZIP file)...');

    try {
      // The actual download URL for Title 26 XML (it's a ZIP file!)
      const downloadUrl = `${this.baseUrl}/releasepoints/us/pl/119/36/xml_usc26@119-36.zip`;

      const response = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Taxentia-AI/1.0 (Tax Research Application)',
        },
        timeout: 300000, // 5 minute timeout (large file download)
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

      // Navigate USLM XML structure: uscDoc → main → title → subtitle → chapter → subchapter → part → section
      const uscDoc = parsed.uscDoc;
      if (!uscDoc) {
        throw new Error('Invalid USLM XML: missing uscDoc root element');
      }

      const main = uscDoc.main;
      if (!main) {
        throw new Error('Invalid USLM XML: missing main element');
      }

      const title = main.title;
      if (!title) {
        throw new Error('Invalid USLM XML: missing title element');
      }

      // Extract sections recursively from the title
      this.extractSections(title, sections);

      console.log(`✅ Parsed ${sections.length} sections from Title 26`);
      return sections;
    } catch (error) {
      console.error('❌ Failed to parse XML:', error);
      throw new Error('Failed to parse Title 26 XML');
    }
  }

  /**
   * Recursively extract sections from USLM XML structure
   * USLM hierarchy: title → subtitle → chapter → subchapter → part → section
   */
  private extractSections(node: any, sections: USCSection[]): void {
    if (!node) return;

    // Check if this node contains sections
    if (node.section) {
      const sectionArray = Array.isArray(node.section) ? node.section : [node.section];

      for (const section of sectionArray) {
        // Extract section number from num element or @_identifier
        let sectionNum = '';
        if (section.num) {
          if (typeof section.num === 'object' && section.num['@_value']) {
            sectionNum = section.num['@_value'];
          } else if (typeof section.num === 'string') {
            sectionNum = section.num.replace(/§\s*/g, '').trim();
          }
        }
        if (!sectionNum && section['@_identifier']) {
          // Extract section number from identifier like "/us/usc/t26/s1"
          const match = section['@_identifier'].match(/\/s(\d+[A-Za-z]?)/);
          if (match) sectionNum = match[1];
        }

        // Extract heading
        let heading = '';
        if (section.heading) {
          heading = typeof section.heading === 'string' ? section.heading : this.extractTextContent(section.heading);
        }

        // Extract text content
        const content = this.extractTextContent(section);

        if (sectionNum && content && content.length > 50) {
          sections.push({
            citation: `26 U.S.C. § ${sectionNum}`,
            section: sectionNum,
            title: heading.trim(),
            text: content,
            url: `https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title26-section${sectionNum}`,
          });
        }
      }
    }

    // Recursively traverse the hierarchical structure
    // Process: subtitle → chapter → subchapter → part (each may contain sections)
    const hierarchyKeys = ['subtitle', 'chapter', 'subchapter', 'part'];

    for (const key of hierarchyKeys) {
      if (node[key]) {
        const children = Array.isArray(node[key]) ? node[key] : [node[key]];
        for (const child of children) {
          this.extractSections(child, sections);
        }
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
