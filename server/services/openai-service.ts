import OpenAI from "openai";
import type { Authority, TaxResponse } from "@shared/schema";
import { pineconeService } from "./pinecone-service";
import { ScoredPineconeRecord } from "@pinecone-database/pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const SYSTEM_PROMPT = `You are Taxentia, an AI tax research assistant for CPAs, tax attorneys, and Enrolled Agents.

PROFESSIONAL STANDARDS:
- Use precise, authoritative language suitable for professional client consultation
- Provide actionable guidance with specific procedural steps
- Include current effective dates and version information for all authorities
- Generate direct URLs to exact cited provisions when possible

AUTHORITY HIERARCHY:
Primary: IRC sections and Treasury Regulations (highest weight)
Secondary: IRS Publications, Forms, Instructions 
Administrative: Revenue Rulings, Procedures, Notices
Judicial: Tax Court, Circuit Court, Supreme Court decisions

CITATION REQUIREMENTS:
- Pinpoint citations with subsection specificity (e.g., "IRC §179(f)(2)(A)(i)")
- Include current effective dates and version years
- Provide direct URLs to exact provisions when available
- Cross-reference related authorities in furtherReading

ANALYSIS STRUCTURE:
Each analysis step: 1) State controlling legal rule 2) Apply facts to rule 3) Conclude sub-issue 4) Note procedural requirements/deadlines

CONFIDENCE SCORING:
Start at 85. +5 primary authority directly on point. +5 no conflicting sources. -10 material assumptions. -15 split authorities/unsettled law.

TOKEN OPTIMIZATION: Be comprehensive but concise. Focus on directly relevant authorities and analysis.

JSON RESPONSE FORMAT:
{
  "conclusion": "2-4 sentences: bottom line, conditions/limits, immediate next steps",
  "authority": [
    {
      "sourceType": "irc|regs|pubs|rulings|cases",
      "citation": "Precise pinpoint citation with subsections",
      "title": "Descriptive title",
      "section": "Section identifier (optional)",
      "subsection": "Subsection identifier (optional)",
      "url": "General authority URL",
      "directUrl": "Direct link to exact provision (optional)",
      "versionDate": "Publication/effective date",
      "effectiveDate": "Current effective date (optional)",
      "chunkId": "Reference ID (optional)"
    }
  ],
  "analysis": [
    {
      "step": "Analysis step description",
      "rationale": "Legal reasoning: rule → application → conclusion",
      "authorityRefs": [0, 1, 2],
      "proceduralNotes": "Forms, deadlines, elections (optional)"
    }
  ],
  "scopeAssumptions": "Explicit assumptions and scope limitations",
  "confidence": {
    "score": 0-100,
    "color": "red|amber|green (red: 0-59, amber: 60-84, green: 85-100)",
    "notes": "2-5 confidence drivers"
  },
  "furtherReading": [
    {
      "citation": "Related authority citation",
      "title": "Authority title", 
      "url": "Link to authority",
      "relevance": "Why relevant to query"
    }
  ],
  "proceduralGuidance": {
    "forms": ["Relevant tax forms"],
    "deadlines": ["Key deadlines/elections"],
    "elections": ["Available tax elections"]
  },
  "disclaimer": "This analysis is for informational purposes for qualified tax professionals and is not legal or tax advice. All conclusions should be independently verified and professional judgment applied."
}`;

class OpenAIService {
  async generateTaxResponse(query: string): Promise<TaxResponse> {
    try {
      // 1. Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // 2. Query Pinecone to get relevant context
      const searchResults = await pineconeService.query(queryEmbedding, 5);
      console.log(`Retrieved ${searchResults.length} results from Pinecone`);

      // 3. Construct context from retrieved chunks
      let contextText = searchResults
        .map((match: ScoredPineconeRecord) => match.metadata?.text)
        .filter(text => text) // Remove any undefined/null text
        .join('\n\n');
      
      // Optimize context length for token efficiency while maintaining quality
      const MAX_CONTEXT_LENGTH = 12000; // Increased limit for better context
      if (contextText.length > MAX_CONTEXT_LENGTH) {
        // Smart truncation: preserve complete authority sections
        const authorities = contextText.split('\n\n');
        let truncatedContext = '';
        for (const authority of authorities) {
          if ((truncatedContext + authority).length <= MAX_CONTEXT_LENGTH) {
            truncatedContext += authority + '\n\n';
          } else {
            break;
          }
        }
        contextText = truncatedContext + "...[remaining authorities truncated for efficiency]";
        console.log(`Context smartly truncated to ${contextText.length} characters`);
      }
      
      console.log(`Context length: ${contextText.length} characters`);
      
      const authorities = searchResults.map((match: ScoredPineconeRecord) => {
        return {
          sourceType: match.metadata?.sourceType,
          citation: match.metadata?.citation,
          title: match.metadata?.title,
          section: match.metadata?.section,
          url: match.metadata?.url,
          directUrl: this.generateDirectUrl(match.metadata?.sourceType, match.metadata?.citation, match.metadata?.url),
          versionDate: match.metadata?.versionDate,
          effectiveDate: this.getEffectiveDate(match.metadata?.sourceType, match.metadata?.versionDate),
          chunkId: match.id,
          content: match.metadata?.text,
        } as Authority;
      });

      const userPrompt = `Tax Query: ${query}

Retrieved Authority Context:
${contextText}

INSTRUCTIONS: Analyze using authority hierarchy (IRC→Regs→Pubs→Rulings→Cases). Generate precise pinpoint citations. Include direct URLs when possible. Provide actionable procedural guidance. Be comprehensive but token-efficient.`;

      // 4. Generate the final response
      const modelName = process.env.OPENAI_MODEL_NAME || "gpt-4-turbo";
      console.log("Calling OpenAI with model:", modelName);
      console.log("User prompt length:", userPrompt.length);
      
      // Try with JSON mode first, fallback without it if not supported
      let response;
      try {
        response = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 3000, // Increased for comprehensive responses
          temperature: 0.1,
        });
      } catch (error: any) {
        if (error?.error?.code === 'unsupported_parameter' && error?.error?.param === 'response_format') {
          console.log("JSON mode not supported, falling back to regular mode");
          response = await openai.chat.completions.create({
            model: modelName,
            messages: [
              { role: "system", content: SYSTEM_PROMPT + "\n\nIMPORTANT: You must respond with valid JSON only, no other text." },
              { role: "user", content: userPrompt }
            ],
            max_completion_tokens: 3000, // Increased for comprehensive responses
            temperature: 0.1,
          });
        } else {
          throw error;
        }
      }

      console.log("OpenAI response received. Choices length:", response.choices?.length);
      console.log("First choice:", response.choices?.[0]);
      
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        console.error("OpenAI response structure:", JSON.stringify(response, null, 2));
        throw new Error("No response content from OpenAI");
      }
      
      console.log("Content received, length:", content.length);

      const parsedResponse = JSON.parse(content);
      
      if (parsedResponse.confidence && !parsedResponse.confidence.color) {
        const score = parsedResponse.confidence.score;
        parsedResponse.confidence.color = score >= 80 ? 'green' : score >= 60 ? 'amber' : 'red';
      }

      if (parsedResponse.authority) {
        parsedResponse.authority = parsedResponse.authority.map((authRef: any) => {
          const matchingAuth = authorities.find(auth => 
            auth.citation?.includes(authRef.citation) || authRef.citation?.includes(auth.citation)
          );
          
          return {
            ...authRef,
            url: matchingAuth?.url || authRef.url || "#",
            directUrl: matchingAuth?.directUrl || authRef.directUrl || this.generateDirectUrl(authRef.sourceType, authRef.citation, authRef.url),
            versionDate: matchingAuth?.versionDate || authRef.versionDate || "2025-01-01",
            effectiveDate: matchingAuth?.effectiveDate || authRef.effectiveDate || this.getEffectiveDate(authRef.sourceType, authRef.versionDate),
            chunkId: matchingAuth?.chunkId || authRef.chunkId,
          };
        });
      }

      return parsedResponse as TaxResponse;
    } catch (error) {
      console.error("OpenAI API error:", error);
      
      return {
        conclusion: "Unable to process query due to service unavailability. Please try again or contact support for assistance with this tax question.",
        authority: [],
        analysis: [{
          step: "Service Error",
          rationale: "Tax analysis service is temporarily unavailable. The query could not be processed with the available authorities.",
          authorityRefs: []
        }],
        scopeAssumptions: "Analysis limited due to service unavailability. Professional review recommended.",
        confidence: {
          score: 0,
          color: "red" as const,
          notes: "Service error - unable to provide reliable analysis"
        }
      };
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding.");
    }
  }

  // Generate direct URLs to specific provisions
  private generateDirectUrl(sourceType?: string, citation?: string, baseUrl?: string): string | undefined {
    if (!sourceType || !citation || !baseUrl) return undefined;
    
    try {
      switch (sourceType.toLowerCase()) {
        case 'irc':
          // Extract section number from IRC citation (e.g., "IRC §179(f)(2)" -> "179")
          const ircMatch = citation.match(/§(\d+)/);
          if (ircMatch && baseUrl.includes('cornell.edu')) {
            return `https://www.law.cornell.edu/uscode/text/26/${ircMatch[1]}`;
          }
          if (ircMatch && baseUrl.includes('uscode.house.gov')) {
            return `https://uscode.house.gov/view.xhtml?req=granuleid%3AUSC-prelim-title26-section${ircMatch[1]}&num=0&edition=prelim`;
          }
          break;
          
        case 'regs':
          // Extract regulation number from citation (e.g., "Reg. §1.179-1" -> "1.179-1")
          const regMatch = citation.match(/§(\d+\.\d+[^,\s]*)/);
          if (regMatch && baseUrl.includes('ecfr.gov')) {
            return `https://www.ecfr.gov/current/title-26/chapter-I/subchapter-A/part-1/section-${regMatch[1]}`;
          }
          break;
          
        case 'pubs':
          // IRS Publications - try to extract publication number
          const pubMatch = citation.match(/Pub(?:lication)?\s+(\d+)/i);
          if (pubMatch && baseUrl.includes('irs.gov')) {
            return `https://www.irs.gov/publications/p${pubMatch[1]}`;
          }
          break;
          
        case 'rulings':
          // Revenue Rulings/Procedures format varies
          if (baseUrl.includes('irs.gov/irb')) {
            return baseUrl; // IRB links are usually direct
          }
          break;
          
        case 'cases':
          // Case law - return base URL as direct linking varies by court
          return baseUrl;
      }
    } catch (error) {
      console.warn(`Error generating direct URL for ${citation}:`, error);
    }
    
    return undefined;
  }

  // Get effective date based on source type and version
  private getEffectiveDate(sourceType?: string, versionDate?: string): string | undefined {
    if (!sourceType || !versionDate) return undefined;
    
    try {
      const date = new Date(versionDate);
      const currentYear = new Date().getFullYear();
      
      switch (sourceType.toLowerCase()) {
        case 'irc':
          // IRC sections are usually current as of latest tax law changes
          return `Current as of ${currentYear}`;
          
        case 'regs':
          // Regulations show effective date
          return `Effective ${versionDate}`;
          
        case 'pubs':
          // Publications are annual or periodic
          const year = date.getFullYear();
          return `${year} Tax Year`;
          
        case 'rulings':
          // Rulings show issuance date
          return `Issued ${versionDate}`;
          
        case 'cases':
          // Cases show decision date
          return `Decided ${versionDate}`;
      }
    } catch (error) {
      console.warn(`Error determining effective date for ${sourceType}:`, error);
    }
    
    return undefined;
  }
}

export const openaiService = new OpenAIService();