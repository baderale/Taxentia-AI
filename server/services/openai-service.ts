import OpenAI from "openai";
import type { Authority, TaxResponse } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const SYSTEM_PROMPT = `You are Taxentia, an AI paralegal for CPAs and tax attorneys.

Audience is professional. Use precise, authoritative language. No consumer simplifications.

Rely on primary sources first (IRC, Treasury Regs), then IRS Pubs/Forms/Instructions, then Revenue Rulings/Procedures/Notices, then Case law.

Every answer MUST include traceable legal bases with pinpoint cites (e.g., IRC §179(f)(2); Reg. §1.168(k)-2(b)(2)(i)(B); Pub. 946 (2024), ch. 2).

For the 'rationale' in each analysis step, structure the reasoning like a formal legal analysis: 1. State the controlling legal rule from the cited authorities. 2. Apply the user's facts to that rule. 3. Conclude the sub-issue. Briefly note any material ambiguities or counter-arguments.

Output a SINGLE JSON object in the exact field order and field names defined below. Produce nothing outside the JSON.

If facts are missing, state explicit assumptions in scopeAssumptions and analyze under those assumptions.

When authorities conflict or interpretation is unsettled, disclose it in analysis and reflect it in the confidence score.

Confidence scoring method: Start at 85. +5 primary statute directly on point with aligning regulation. +5 if publication aligns and no conflicting authorities. −10 for material factual assumptions. −15 for split/ambiguous authorities or unsettled law.

You must respond with valid JSON in this exact format:
{
  "conclusion": "2-4 sentences summarizing the bottom line, key conditions/limits, and immediate next steps (e.g., elections, forms, timing)",
  "authority": [
    {
      "sourceType": "irc|regs|pubs|rulings|cases",
      "citation": "string with pinpoint citation",
      "title": "string describing the authority",
      "section": "string (optional)",
      "url": "string",
      "versionDate": "string",
      "chunkId": "string (optional)"
    }
  ],
  "analysis": [
    {
      "step": "string describing reasoning step",
      "rationale": "string with detailed legal reasoning connecting facts to law, following the specified 3-part structure.",
      "authorityRefs": [0, 1, 2]
    }
  ],
  "scopeAssumptions": "string explicitly listing scope notes and factual/legal assumptions",
  "confidence": {
    "score": 0-100,
    "color": "red|amber|green (red: 0-59, amber: 60-84, green: 85-100)",
    "notes": "string with 2-5 short confidence drivers"
  },
  "disclaimer": "This analysis is for informational purposes for qualified professionals and is not legal or tax advice. All conclusions should be independently verified."
}`;

class OpenAIService {
  async generateTaxResponse(query: string, authorities: Authority[]): Promise<TaxResponse> {
    try {
      const contextText = authorities.map(auth => 
        `[${auth.sourceType.toUpperCase()}] ${auth.citation}: ${auth.content}`
      ).join('\n\n');

      const userPrompt = `Query: ${query}

Available Authorities:
${contextText}

Provide a structured tax analysis based on the provided authorities. Focus on the hierarchy: IRC sections first, then regulations, then publications, then rulings. Be precise with citations and confidence assessment.`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL_NAME || "gpt-5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent, factual responses
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No response content from OpenAI");
      }

      const parsedResponse = JSON.parse(content);
      
      // Ensure confidence color is set based on score if not provided
      if (parsedResponse.confidence && !parsedResponse.confidence.color) {
        const score = parsedResponse.confidence.score;
        parsedResponse.confidence.color = score >= 80 ? 'green' : score >= 60 ? 'amber' : 'red';
      }

      // Map provided authorities to response authorities with additional metadata
      if (parsedResponse.authority) {
        parsedResponse.authority = parsedResponse.authority.map((authRef: any) => {
          const matchingAuth = authorities.find(auth => 
            auth.citation.includes(authRef.citation) || authRef.citation.includes(auth.citation)
          );
          
          return {
            ...authRef,
            url: matchingAuth?.url || authRef.url || "#",
            versionDate: matchingAuth?.versionDate || authRef.versionDate || "2024-01-01",
            chunkId: matchingAuth?.chunkId || authRef.chunkId,
          };
        });
      }

      return parsedResponse as TaxResponse;
    } catch (error) {
      console.error("OpenAI API error:", error);
      
      // Return a fallback response in case of API failure
      return {
        conclusion: "Unable to process query due to service unavailability. Please try again or contact support for assistance with this tax question.",
        authority: authorities.slice(0, 3).map(auth => ({
          sourceType: auth.sourceType as any,
          citation: auth.citation,
          title: auth.title,
          section: auth.section || undefined,
          url: auth.url,
          versionDate: auth.versionDate,
          chunkId: auth.chunkId || undefined,
        })),
        analysis: [{
          step: "Service Error",
          rationale: "Tax analysis service is temporarily unavailable. The query could not be processed with the available authorities.",
          authorityRefs: [0]
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
}

export const openaiService = new OpenAIService();
