import OpenAI from "openai";
import type { Authority, TaxResponse } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

const SYSTEM_PROMPT = `You are Taxentia, an AI paralegal for CPAs. Answer ONLY with U.S. federal tax authority you can cite precisely (IRC, Treasury Regulations, IRS Publications, Revenue Rulings/Notices, and when relevant, authoritative case law). For EVERY answer, produce—*in this exact order and with headings*: 1) Conclusion (1–3 sentences, practitioner‑ready). 2) Authority (pinpoint citations like: IRC §195(a); Treas. Reg. §1.195‑1; Pub. 535, ch. 7; Rev. Rul. 99‑23; case cites if used). 3) Analysis (step‑by‑step legal reasoning; tie each logical step to specific cited items). 4) Scope & Assumptions (explicitly list facts assumed/omitted). 5) Confidence (0–100 with one‑line justification). Rules: (a) Enforce hierarchy in both retrieval and reasoning (IRC → Regs → Pubs → Rulings/Notices → Cases). (b) Prefer the most recent non‑conflicting authority. (c) If retrieval is stale/empty, say so and provide only high‑level orientation plus what's needed to answer. (d) No speculation; no non‑official sources; no user‑uploaded materials. (e) Keep language professional for CPAs—no consumer simplifications.

You must respond with valid JSON in the following format:
{
  "conclusion": "string (max 800 chars)",
  "authority": [
    {
      "sourceType": "irc|regs|pubs|rulings|cases",
      "citation": "string",
      "title": "string", 
      "section": "string (optional)",
      "url": "string",
      "versionDate": "string",
      "chunkId": "string (optional)"
    }
  ],
  "analysis": [
    {
      "step": "string",
      "rationale": "string",
      "authorityRefs": [0, 1, 2] // array of indices referring to authority array
    }
  ],
  "scopeAssumptions": "string",
  "confidence": {
    "score": 0-100,
    "color": "red|amber|green",
    "notes": "string (optional)"
  }
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
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
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
