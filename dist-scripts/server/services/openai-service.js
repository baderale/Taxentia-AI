import OpenAI from "openai";
import { pineconeService } from "./pinecone-service";
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
    async generateTaxResponse(query) {
        try {
            // 1. Generate embedding for the query
            const queryEmbedding = await this.generateEmbedding(query);
            // 2. Query Pinecone to get relevant context
            const searchResults = await pineconeService.query(queryEmbedding, 5);
            console.log(`Retrieved ${searchResults.length} results from Pinecone`);
            // 3. Construct context from retrieved chunks
            let contextText = searchResults
                .map((match) => match.metadata?.text)
                .filter(text => text) // Remove any undefined/null text
                .join('\n\n');
            // Truncate context if too long (leave room for system prompt + user query)
            const MAX_CONTEXT_LENGTH = 8000; // Conservative limit
            if (contextText.length > MAX_CONTEXT_LENGTH) {
                contextText = contextText.substring(0, MAX_CONTEXT_LENGTH) + "...[truncated]";
                console.log(`Context truncated to ${MAX_CONTEXT_LENGTH} characters`);
            }
            console.log(`Context length: ${contextText.length} characters`);
            const authorities = searchResults.map((match) => {
                return {
                    sourceType: match.metadata?.sourceType,
                    citation: match.metadata?.citation,
                    title: match.metadata?.title,
                    section: match.metadata?.section,
                    url: match.metadata?.url,
                    versionDate: match.metadata?.versionDate,
                    chunkId: match.id,
                    content: match.metadata?.text,
                };
            });
            const userPrompt = `Query: ${query}

Available Authorities:
${contextText}

Provide a structured tax analysis based on the provided authorities. Focus on the hierarchy: IRC sections first, then regulations, then publications, then rulings. Be precise with citations and confidence assessment.`;
            // 4. Generate the final response
            console.log("Calling OpenAI with model:", process.env.OPENAI_MODEL_NAME || "gpt-4-turbo");
            console.log("User prompt length:", userPrompt.length);
            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL_NAME || "gpt-4-turbo",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" },
                max_completion_tokens: 2000,
                temperature: 0.1,
            });
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
                parsedResponse.authority = parsedResponse.authority.map((authRef) => {
                    const matchingAuth = authorities.find(auth => auth.citation.includes(authRef.citation) || authRef.citation.includes(auth.citation));
                    return {
                        ...authRef,
                        url: matchingAuth?.url || authRef.url || "#",
                        versionDate: matchingAuth?.versionDate || authRef.versionDate || "2024-01-01",
                        chunkId: matchingAuth?.chunkId || authRef.chunkId,
                    };
                });
            }
            return parsedResponse;
        }
        catch (error) {
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
                    color: "red",
                    notes: "Service error - unable to provide reliable analysis"
                }
            };
        }
    }
    async generateEmbedding(text) {
        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: text,
            });
            return response.data[0].embedding;
        }
        catch (error) {
            console.error("Error generating embedding:", error);
            throw new Error("Failed to generate embedding.");
        }
    }
}
export const openaiService = new OpenAIService();
