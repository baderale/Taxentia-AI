import { randomUUID } from "crypto";
import * as cheerio from 'cheerio';
export class MemStorage {
    users = new Map();
    taxQueries = new Map();
    authorities = new Map();
    constructor() {
        // Now initialized via the async initialize() method
    }
    async initialize() {
        console.log("Initializing and fetching authorities...");
        await this.initializeAuthorities();
        console.log("Initialization complete.");
    }
    async initializeAuthorities() {
        const authoritySources = [
            {
                sourceType: "irc",
                citation: "IRC §195(a)",
                title: "Start-up expenditures",
                section: "195(a)",
                url: "https://www.law.cornell.edu/uscode/text/26/195",
                chunkId: "irc-195-a-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §195(b)",
                title: "Start-up expenditures - Election",
                section: "195(b)",
                url: "https://www.law.cornell.edu/uscode/text/26/195",
                chunkId: "irc-195-b-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §195(c)",
                title: "Start-up expenditures - Definitions",
                section: "195(c)",
                url: "https://www.law.cornell.edu/uscode/text/26/195",
                chunkId: "irc-195-c-001"
            },
            {
                sourceType: "pubs",
                citation: "IRS Pub. 535",
                title: "Business Expenses",
                section: "Chapter 8",
                url: "https://www.irs.gov/publications/p535",
                chunkId: "pub-535-ch8-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §280A",
                title: "Home office deduction",
                section: "280A",
                url: "https://www.law.cornell.edu/uscode/text/26/280A",
                chunkId: "irc-280a-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §199A",
                title: "Qualified business income deduction",
                section: "199A",
                url: "https://www.law.cornell.edu/uscode/text/26/199A",
                chunkId: "irc-199a-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §167(a)",
                title: "Depreciation deduction allowance",
                section: "167(a)",
                url: "https://www.law.cornell.edu/uscode/text/26/167",
                chunkId: "irc-167-a-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §168(a)",
                title: "MACRS - Accelerated Cost Recovery System",
                section: "168(a)",
                url: "https://www.law.cornell.edu/uscode/text/26/168",
                chunkId: "irc-168-a-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §168(b)",
                title: "MACRS - Applicable depreciation method",
                section: "168(b)",
                url: "https://www.law.cornell.edu/uscode/text/26/168",
                chunkId: "irc-168-b-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §168(c)",
                title: "MACRS - Applicable recovery period",
                section: "168(c)",
                url: "https://www.law.cornell.edu/uscode/text/26/168",
                chunkId: "irc-168-c-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §168(e)",
                title: "MACRS - Classification of property",
                section: "168(e)",
                url: "https://www.law.cornell.edu/uscode/text/26/168",
                chunkId: "irc-168-e-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §179(a)",
                title: "Section 179 election to expense",
                section: "179(a)",
                url: "https://www.law.cornell.edu/uscode/text/26/179",
                chunkId: "irc-179-a-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §179(b)",
                title: "Section 179 dollar limitation",
                section: "179(b)",
                url: "https://www.law.cornell.edu/uscode/text/26/179",
                chunkId: "irc-179-b-001"
            },
            {
                sourceType: "irc",
                citation: "IRC §168(k)",
                title: "Bonus depreciation",
                section: "168(k)",
                url: "https://www.law.cornell.edu/uscode/text/26/168",
                chunkId: "irc-168-k-001"
            },
            {
                sourceType: "regs",
                citation: "Treas. Reg. §1.167(a)-1",
                title: "Depreciation in general",
                section: "1.167(a)-1",
                url: "https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/section-1.167_a_-1",
                chunkId: "reg-167-a-1-001"
            },
            {
                sourceType: "regs",
                citation: "Treas. Reg. §1.168(b)-1",
                title: "MACRS depreciation methods",
                section: "1.168(b)-1",
                url: "https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/section-1.168_b_-1",
                chunkId: "reg-168-b-1-001"
            },
            {
                sourceType: "pubs",
                citation: "IRS Pub. 946",
                title: "How To Depreciate Property",
                section: "Chapter 1",
                url: "https://www.irs.gov/publications/p946",
                chunkId: "pub-946-ch1-001"
            },
            {
                sourceType: "pubs",
                citation: "IRS Pub. 946",
                title: "MACRS Depreciation Tables",
                section: "Appendix A",
                url: "https://www.irs.gov/publications/p946",
                chunkId: "pub-946-app-a-001"
            }
        ];
        for (const source of authoritySources) {
            try {
                console.log(`Fetching ${source.url}...`);
                const response = await fetch(source.url);
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${source.url}: ${response.statusText}`);
                }
                const html = await response.text();
                const $ = cheerio.load(html);
                // Generic content extraction, may need refinement for each source type
                const content = $('body').text().replace(/\s\s+/g, ' ').trim();
                if (content) {
                    await this.createAuthority({
                        ...source,
                        content,
                        versionDate: new Date().toISOString().split('T')[0], // Use fetch date as version
                    });
                }
                else {
                    console.warn(`Could not extract content from ${source.url}`);
                }
            }
            catch (error) {
                console.error(`Error processing authority from ${source.url}:`, error);
            }
        }
    }
    // User methods
    async getUser(id) {
        return this.users.get(id);
    }
    async getUserByUsername(username) {
        return Array.from(this.users.values()).find((user) => user.username === username);
    }
    async createUser(insertUser) {
        const id = randomUUID();
        const user = {
            ...insertUser,
            id,
            subscription: insertUser.subscription || "free",
            createdAt: new Date()
        };
        this.users.set(id, user);
        return user;
    }
    // Tax query methods
    async getTaxQuery(id) {
        return this.taxQueries.get(id);
    }
    async getTaxQueriesByUser(userId) {
        return Array.from(this.taxQueries.values())
            .filter(query => query.userId === userId)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    async createTaxQuery(insertQuery) {
        const id = randomUUID();
        const query = {
            ...insertQuery,
            id,
            response: insertQuery.response || null,
            confidence: insertQuery.confidence || 0,
            confidenceColor: insertQuery.confidenceColor || "red",
            retrievedIds: insertQuery.retrievedIds || null,
            createdAt: new Date().toISOString()
        };
        this.taxQueries.set(id, query);
        return query;
    }
    // Authority methods
    async getAuthority(id) {
        return this.authorities.get(id);
    }
    async getAuthorities(sourceTypes) {
        const allAuthorities = Array.from(this.authorities.values());
        if (sourceTypes && sourceTypes.length > 0) {
            return allAuthorities.filter(auth => sourceTypes.includes(auth.sourceType));
        }
        return allAuthorities;
    }
    async createAuthority(insertAuthority) {
        const id = randomUUID();
        const authority = {
            ...insertAuthority,
            id,
            section: insertAuthority.section || null,
            chunkId: insertAuthority.chunkId || null
        };
        this.authorities.set(id, authority);
        return authority;
    }
}
export const storage = new MemStorage();
