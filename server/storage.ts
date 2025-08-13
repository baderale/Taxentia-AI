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
      },
      {
        sourceType: "irc",
        citation: "IRC §167(a)",
        title: "Depreciation deduction allowance",
        section: "167(a)",
        url: "https://www.law.cornell.edu/uscode/text/26/167",
        content: "There shall be allowed as a depreciation deduction a reasonable allowance for the exhaustion, wear and tear (including a reasonable allowance for obsolescence) of property used in the trade or business or held for the production of income.",
        versionDate: "2024-01-01",
        chunkId: "irc-167-a-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §168(a)",
        title: "MACRS - Accelerated Cost Recovery System",
        section: "168(a)",
        url: "https://www.law.cornell.edu/uscode/text/26/168",
        content: "Except as otherwise provided in this section, the depreciation deduction provided by section 167(a) for any tangible property shall be determined by using the applicable depreciation method, the applicable recovery period, and the applicable convention.",
        versionDate: "2024-01-01",
        chunkId: "irc-168-a-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §168(b)",
        title: "MACRS - Applicable depreciation method",
        section: "168(b)",
        url: "https://www.law.cornell.edu/uscode/text/26/168",
        content: "For purposes of this section, the applicable depreciation method is the 200 percent declining balance method, switching to the straight line method for the first taxable year for which using the straight line method with respect to the adjusted basis as of the beginning of such year will yield a larger allowance.",
        versionDate: "2024-01-01",
        chunkId: "irc-168-b-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §168(c)",
        title: "MACRS - Applicable recovery period",
        section: "168(c)",
        url: "https://www.law.cornell.edu/uscode/text/26/168",
        content: "The applicable recovery period for any property is the period prescribed for such property. For 5-year property, the applicable recovery period is 5 years. For 7-year property, the applicable recovery period is 7 years.",
        versionDate: "2024-01-01",
        chunkId: "irc-168-c-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §168(e)",
        title: "MACRS - Classification of property",
        section: "168(e)",
        url: "https://www.law.cornell.edu/uscode/text/26/168",
        content: "For purposes of this section, property is classified as 3-year property, 5-year property, 7-year property, 10-year property, 15-year property, 20-year property, or nonresidential real property based on its class life and nature.",
        versionDate: "2024-01-01",
        chunkId: "irc-168-e-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §179(a)",
        title: "Section 179 election to expense",
        section: "179(a)",
        url: "https://www.law.cornell.edu/uscode/text/26/179",
        content: "A taxpayer may elect to treat the cost of any section 179 property as an expense which is not chargeable to capital account. Any cost so treated shall be allowed as a deduction for the taxable year in which the property is placed in service.",
        versionDate: "2024-01-01",
        chunkId: "irc-179-a-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §179(b)",
        title: "Section 179 dollar limitation",
        section: "179(b)",
        url: "https://www.law.cornell.edu/uscode/text/26/179",
        content: "The aggregate cost which may be taken into account under subsection (a) for any taxable year shall not exceed $1,160,000 for 2024 ($1,220,000 for 2025).",
        versionDate: "2024-01-01",
        chunkId: "irc-179-b-001"
      },
      {
        sourceType: "irc",
        citation: "IRC §168(k)",
        title: "Bonus depreciation",
        section: "168(k)",
        url: "https://www.law.cornell.edu/uscode/text/26/168",
        content: "In the case of qualified property, the depreciation deduction provided by section 167(a) for the taxable year in which such property is placed in service shall be increased by an amount equal to the applicable percentage of the adjusted basis of such property.",
        versionDate: "2024-01-01",
        chunkId: "irc-168-k-001"
      },
      {
        sourceType: "regs",
        citation: "Treas. Reg. §1.167(a)-1",
        title: "Depreciation in general",
        section: "1.167(a)-1",
        url: "https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/section-1.167_a_-1",
        content: "The depreciation allowance provided by section 167(a) is that amount which should be set aside for the taxable year in accordance with a reasonably consistent plan so that the aggregate of the amounts set aside, plus the salvage value, will, at the end of the estimated useful life of the depreciable property, equal the cost or other basis of the property.",
        versionDate: "2024-01-01",
        chunkId: "reg-167-a-1-001"
      },
      {
        sourceType: "regs",
        citation: "Treas. Reg. §1.168(b)-1",
        title: "MACRS depreciation methods",
        section: "1.168(b)-1",
        url: "https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/section-1.168_b_-1",
        content: "The applicable depreciation method for property other than residential rental property and nonresidential real property is the 200 percent declining balance method, switching to the straight line method for the first taxable year for which using the straight line method will yield a larger allowance.",
        versionDate: "2024-01-01",
        chunkId: "reg-168-b-1-001"
      },
      {
        sourceType: "pubs",
        citation: "IRS Pub. 946",
        title: "How To Depreciate Property",
        section: "Chapter 1",
        url: "https://www.irs.gov/publications/p946",
        content: "You can deduct the cost of business or investment property over a number of years by taking depreciation deductions. For property placed in service after 1986, you generally use the Modified Accelerated Cost Recovery System (MACRS).",
        versionDate: "2024-01-01",
        chunkId: "pub-946-ch1-001"
      },
      {
        sourceType: "pubs",
        citation: "IRS Pub. 946",
        title: "MACRS Depreciation Tables",
        section: "Appendix A",
        url: "https://www.irs.gov/publications/p946",
        content: "The MACRS percentage table shows the percentage of the property's basis that you can deduct each year. For 5-year property using half-year convention: Year 1: 20%, Year 2: 32%, Year 3: 19.2%, Year 4: 11.52%, Year 5: 11.52%, Year 6: 5.76%.",
        versionDate: "2024-01-01",
        chunkId: "pub-946-app-a-001"
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
