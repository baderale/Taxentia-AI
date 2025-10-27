// Service to fetch and parse IRC Title 26 XML
import https from 'https';
import AdmZip from 'adm-zip';

const IRC_ZIP_URL = 'https://uscode.house.gov/download/releasepoints/us/pl/119/36/xml_usc26@119-36.zip';

interface IrcSection {
  section: string;
  citation: string;
  title: string;
  text: string;
  url: string;
  versionDate: string;
}

async function downloadFile(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          downloadFile(redirectUrl).then(resolve).catch(reject);
          return;
        }
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

export async function fetchIrcSections(): Promise<IrcSection[]> {
  console.log('📥 Downloading IRC Title 26 XML from:', IRC_ZIP_URL);

  // Download ZIP
  const zipBuffer = await downloadFile(IRC_ZIP_URL);
  console.log(`📦 Downloaded ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  // Extract ZIP
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();
  console.log(`📂 ZIP contains ${zipEntries.length} files`);

  // Find all XML files
  const xmlFiles = zipEntries.filter(entry =>
    entry.entryName.toLowerCase().endsWith('.xml')
  );
  console.log(`📄 Found ${xmlFiles.length} XML files`);

  if (xmlFiles.length === 0) {
    throw new Error('No XML files found in ZIP');
  }

  // Parse all XML files
  const allSections: IrcSection[] = [];

  for (const xmlFile of xmlFiles) {
    const xmlContent = xmlFile.getData().toString('utf-8');
    console.log(`  Processing ${xmlFile.entryName} (${(xmlContent.length / 1024).toFixed(0)} KB)`);

    // Parse sections using regex
    // USLM format: <section identifier="/us/usc/t26/sXXX" number="XXX">
    const sectionRegex = /<section[^>]+identifier="\/us\/usc\/t26\/s([\d]+[A-Za-z]?)"[^>]*>(.*?)<\/section>/gs;

    let match;
    while ((match = sectionRegex.exec(xmlContent)) !== null) {
      const sectionNum = match[1];
      const sectionContent = match[2];

      // Extract heading
      const headingMatch = /<heading>(.*?)<\/heading>/s.exec(sectionContent);
      const heading = headingMatch ? headingMatch[1].replace(/<[^>]+>/g, '').trim() : '';

      // Extract text content (remove all XML tags)
      const textContent = sectionContent
        .replace(/<heading>.*?<\/heading>/gs, '')
        .replace(/<num[^>]*>.*?<\/num>/gs, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Only include sections with actual content
      if (textContent.length > 50) {
        allSections.push({
          section: sectionNum,
          citation: `IRC §${sectionNum}`,
          title: heading || `Section ${sectionNum}`,
          text: textContent.substring(0, 2000), // Limit for embedding
          url: `https://www.law.cornell.edu/uscode/text/26/${sectionNum}`,
          versionDate: '2025-09-05' // PL 119-36 date
        });
      }
    }
  }

  // Sort by section number
  allSections.sort((a, b) => {
    const aNum = parseInt(a.section.replace(/[^0-9]/g, ''));
    const bNum = parseInt(b.section.replace(/[^0-9]/g, ''));
    return aNum - bNum;
  });

  console.log(`✅ Parsed ${allSections.length} IRC sections`);
  console.log(`   First: ${allSections[0]?.citation}`);
  console.log(`   Last: ${allSections[allSections.length - 1]?.citation}`);

  return allSections;
}
