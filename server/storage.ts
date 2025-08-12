import { type User, type InsertUser, type TaxQuery, type InsertTaxQuery, type Authority, type InsertAuthority } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Tax query methods
  getTaxQuery(id: string): Promise<TaxQuery | undefined>;
  getTaxQueriesByUser(userId: string): Promise<TaxQuery[]>;
  createTaxQuery(query: InsertTaxQuery): Promise<TaxQuery>;

  // Authority methods
  getAuthority(id: string): Promise<Authority | undefined>;
  getAuthorities(sourceTypes?: string[]): Promise<Authority[]>;
  createAuthority(authority: InsertAuthority): Promise<Authority>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private taxQueries: Map<string, TaxQuery> = new Map();
  private authorities: Map<string, Authority> = new Map();

  constructor() {
    // Initialize with some mock authorities
    this.initializeMockAuthorities();
  }

  private initializeMockAuthorities() {
    const mockAuthorities: InsertAuthority[] = [
      {
        sourceType: "irc",
        citation: "IRC §195(a)",
        title: "Start-up expenditures",
        section: "195(a)",
        url: "https://www.law.cornell.edu/uscode/text/26/195",
        content: "Except as otherwise provided in this section, no deduction shall be allowed for start-up expenditures.",
        versionDate: "2024-01-01",
        chunkId: "irc-195-a-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §195(b)",
        title: "Start-up expenditures - Election",
        section: "195(b)",
        url: "https://www.law.cornell.edu/uscode/text/26/195",
        content: "A taxpayer may elect to deduct so much of his start-up expenditures as does not exceed $5,000, reduced (but not below zero) by the amount by which such start-up expenditures exceed $50,000.",
        versionDate: "2024-01-01",
        chunkId: "irc-195-b-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §195(c)",
        title: "Start-up expenditures - Definitions",
        section: "195(c)",
        url: "https://www.law.cornell.edu/uscode/text/26/195",
        content: "For purposes of this section, the term 'start-up expenditure' means any amount paid or incurred in connection with investigating the creation or acquisition of an active trade or business.",
        versionDate: "2024-01-01",
        chunkId: "irc-195-c-001"
      },
      {
        sourceType: "pubs",
        citation: "IRS Pub. 535",
        title: "Business Expenses",
        section: "Chapter 8",
        url: "https://www.irs.gov/publications/p535",
        content: "Start-up costs are the expenses incurred before you actually begin business operations. These costs include expenses for creating your business and expenses for investigating the possibility of creating your business.",
        versionDate: "2024-01-01",
        chunkId: "pub-535-ch8-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §280A",
        title: "Home office deduction",
        section: "280A",
        url: "https://www.law.cornell.edu/uscode/text/26/280A",
        content: "No deduction otherwise allowable under this chapter shall be allowed with respect to the use of a dwelling unit which is used by the taxpayer during the taxable year as a residence.",
        versionDate: "2024-01-01",
        chunkId: "irc-280a-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §199A",
        title: "Qualified business income deduction",
        section: "199A",
        url: "https://www.law.cornell.edu/uscode/text/26/199A",
        content: "In the case of a taxpayer other than a corporation, there shall be allowed as a deduction for any taxable year an amount equal to the lesser of the combined qualified business income amount, or 20 percent of the excess of the taxable income of the taxpayer.",
        versionDate: "2024-01-01",
        chunkId: "irc-199a-001"
      }
    ];

    mockAuthorities.forEach(auth => {
      this.createAuthority(auth);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      subscription: insertUser.subscription || "free",
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Tax query methods
  async getTaxQuery(id: string): Promise<TaxQuery | undefined> {
    return this.taxQueries.get(id);
  }

  async getTaxQueriesByUser(userId: string): Promise<TaxQuery[]> {
    return Array.from(this.taxQueries.values())
      .filter(query => query.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createTaxQuery(insertQuery: InsertTaxQuery): Promise<TaxQuery> {
    const id = randomUUID();
    const query: TaxQuery = {
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
  async getAuthority(id: string): Promise<Authority | undefined> {
    return this.authorities.get(id);
  }

  async getAuthorities(sourceTypes?: string[]): Promise<Authority[]> {
    const allAuthorities = Array.from(this.authorities.values());
    
    if (sourceTypes && sourceTypes.length > 0) {
      return allAuthorities.filter(auth => sourceTypes.includes(auth.sourceType));
    }
    
    return allAuthorities;
  }

  async createAuthority(insertAuthority: InsertAuthority): Promise<Authority> {
    const id = randomUUID();
    const authority: Authority = {
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
