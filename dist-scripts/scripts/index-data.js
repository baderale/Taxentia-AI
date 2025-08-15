import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { openaiService } from '../server/services/openai-service.js';
import { pineconeService } from '../server/services/pinecone-service.js';
// Function to read and parse authorities.md
async function getUrlsFromMarkdown(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const urls = [];
    // Regex to find URLs in markdown format: [text](url) or just raw URLs
    const urlRegex = /(https?:\/\/[^\s)]+)/g;
    let match;
    while ((match = urlRegex.exec(content)) !== null) {
        urls.push(match[1]);
    }
    return urls;
}
// Function to fetch content from a URL
async function fetchContentFromUrl(url) {
    try {
        console.log(`Fetching content from: ${url}`);
        const response = await axios.get(url, { timeout: 10000 }); // 10 seconds timeout
        const $ = cheerio.load(response.data);
        // Attempt to extract main content from common elements
        let mainContent = '';
        // Prioritize common article/main content selectors
        const selectors = [
            'article',
            'main',
            '.main-content',
            '#main-content',
            '.article-content',
            '#article-content',
            'p', // Fallback to all paragraphs
        ];
        for (const selector of selectors) {
            $(selector).each((i, elem) => {
                mainContent += $(elem).text().trim() + '\n\n';
            });
            if (mainContent.length > 0)
                break; // Stop if we found content
        }
        // Clean up extra whitespace and newlines
        mainContent = mainContent.replace(/\s\s+/g, ' ').trim();
        if (mainContent.length === 0) {
            console.warn(`No main content found for ${url}. Returning full body text.`);
            return $('body').text().replace(/\s\s+/g, ' ').trim();
        }
        return mainContent;
    }
    catch (error) { // Explicitly type as unknown
        console.error(`Error fetching content from ${url}:`, error instanceof Error ? error.message : error);
        return null;
    }
}
// Function to chunk text (rewritten for robustness)
function chunkText(text, chunkSize = 500) {
    const chunks = [];
    // Split by common sentence endings, then filter out empty strings and trim
    const sentences = text.split(/([.?!\s*])/).filter(s => s.trim().length > 0);
    let currentChunk = '';
    for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= chunkSize) {
            currentChunk += sentence;
        }
        else {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
    }
    return chunks;
}
// Main indexing function
async function indexData() {
    try {
        // Load environment variables (important for Pinecone and OpenAI keys)
        require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
        const authoritiesFilePath = path.resolve(__dirname, '../authorities.md');
        const urls = await getUrlsFromMarkdown(authoritiesFilePath);
        if (urls.length === 0) {
            console.warn('No URLs found in authorities.md. Exiting.');
            return;
        }
        console.log(`Found ${urls.length} URLs to index.`);
        for (const url of urls) {
            const content = await fetchContentFromUrl(url);
            if (content) {
                const chunks = chunkText(content);
                console.log(`Processing ${chunks.length} chunks for ${url}`);
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const embedding = await openaiService.generateEmbedding(chunk);
                    // Prepare metadata for Pinecone
                    const metadata = {
                        url: url,
                        chunk_index: i,
                        text: chunk,
                        // Add more metadata if available from parsing (e.g., title, section)
                    };
                    // Upsert to Pinecone
                    // Pinecone requires IDs for each vector. We can generate a unique ID.
                    const vectorId = `${url}-${i}`;
                    await pineconeService.upsert([
                        {
                            id: vectorId,
                            values: embedding,
                            metadata: metadata,
                        },
                    ]);
                    console.log(`Indexed chunk ${i + 1} for ${url}`);
                }
            }
        }
        console.log('Indexing complete!');
    }
    catch (error) {
        console.error('Error during indexing process:', error);
    }
}
// Execute the main function
indexData();
