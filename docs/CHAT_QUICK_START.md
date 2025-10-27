# Chat Feature - Quick Start Guide

## TL;DR - Where Everything Lives

```
┌─────────────────────────────────────────────────────────────┐
│ BROWSER: Chat UI (React)                                    │
│ ├─ User types question                                      │
│ └─ Sends to backend via HTTP                               │
└─────────────────────────────────────────────────────────────┘
                        ↓ POST /api/taxentia/query
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: LLM Processing (Express)                           │
│ ├─ 1. Generate query embedding (text-embedding-3-small)    │
│ ├─ 2. Search Qdrant for relevant chunks (top-5)            │
│ ├─ 3. Build context from chunks                            │
│ ├─ 4. Call OpenAI LLM (GPT-5/GPT-4)                        │
│ ├─ 5. Validate response                                    │
│ ├─ 6. Save to PostgreSQL                                   │
│ └─ 7. Return JSON to client                                │
└─────────────────────────────────────────────────────────────┘
        ↓ HTTP 200 + Response JSON
┌─────────────────────────────────────────────────────────────┐
│ BROWSER: Display Results (React)                            │
│ ├─ Show conclusion (main answer)                           │
│ ├─ List authorities with color-coded badges               │
│ ├─ Display analysis breakdown                              │
│ └─ Show confidence score                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Running the Chat

### **Start Everything:**

```bash
# Terminal 1: Run backend + Qdrant
npm run dev

# (Frontend automatically runs on http://localhost:5173)
```

### **Access Chat:**
```
http://localhost:5173
```

### **Try a Query:**
```
"What is the Section 179 deduction limit for 2024?"
```

---

## 🏗️ Component Locations

| What | Where | Purpose |
|------|-------|---------|
| **Chat UI** | `client/src/components/chat-interface.tsx` | Input + display |
| **Results Display** | `client/src/components/response-display.tsx` | Format response |
| **LLM Integration** | `server/services/openai-service.ts` | RAG pipeline |
| **Vector Search** | `server/services/qdrant-service.ts` | Query Qdrant |
| **API Routes** | `server/routes.ts` | HTTP endpoints |
| **Database** | `server/storage.ts` | Save queries |

---

## 📨 API Endpoint

### **Submit Tax Query**

```bash
POST /api/taxentia/query
Content-Type: application/json

{
  "query": "What is the IRC section 179 deduction?"
}
```

### **Response (HTTP 200):**

```json
{
  "id": "query-abc123",
  "userId": "mock-user-id",
  "query": "What is the IRC section 179 deduction?",
  "response": {
    "conclusion": "Section 179 allows businesses to immediately deduct the cost of qualified property instead of depreciating it over time. For 2024, the limit is $1,160,000.",
    "authority": [
      {
        "citation": "26 U.S.C. § 179",
        "sourceType": "usc",
        "title": "Election to expense certain depreciable business assets",
        "url": "https://www.law.cornell.edu/uscode/text/26/179",
        "directUrl": "..."
      }
    ],
    "analysis": [
      {
        "step": "Determine if property qualifies",
        "rationale": "Section 179 applies to depreciable tangible personal property...",
        "authorityRefs": [0]
      }
    ],
    "confidence": {
      "score": 92,
      "color": "green",
      "notes": "Direct statutory reference with recent IRS guidance"
    },
    "proceduralGuidance": {
      "forms": ["Form 4562"],
      "deadlines": ["Must be placed in service same tax year"],
      "elections": ["Can elect out by statement"]
    },
    "disclaimer": "This analysis is for informational purposes only..."
  },
  "confidence": 92,
  "confidenceColor": "green",
  "createdAt": "2025-10-27T14:30:00Z"
}
```

---

## 🔍 How RAG Works (The Magic)

```
User Query
    ↓
[EMBEDDING]: Convert "Section 179 deduction?" to vector (1536 numbers)
    ↓
[SEARCH]: Find similar vectors in Qdrant (cosine similarity)
    ↓
[RETRIEVE]: Get top-5 chunks from authorities
    • 26 U.S.C. § 179 (main rule)
    • 26 U.S.C. § 179(b) (limit)
    • 26 U.S.C. § 179(d) (qualified property)
    • Treasury Reg § 1.179 (regulations)
    • IRS Notice 2024-XX (recent guidance)
    ↓
[AUGMENT]: Build context string (~8000 chars of relevant excerpts)
    ↓
[GENERATE]: Call GPT-5 with:
    • System prompt (defines Taxentia style)
    • User query
    • Retrieved context chunks
    ↓
[LLM OUTPUT]: Structured JSON with:
    • Conclusion (bottom line answer)
    • Authority list (citations)
    • Analysis steps (reasoning)
    • Confidence score
    ↓
[RESPONSE]: Display to user with:
    • Clickable authority links
    • Color-coded badges (IRC/Regs/Notices)
    • Confidence visual indicator
    • Procedural guidance
```

---

## ⚙️ Configuration

### **OpenAI Setup** (in `.env`)
```bash
OPENAI_API_KEY=sk-...          # Your OpenAI API key
OPENAI_MODEL_NAME=gpt-5        # Model to use
```

### **Qdrant Setup** (in `.env`)
```bash
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=taxentia-authorities
```

### **Database Setup** (in `.env`)
```bash
DATABASE_URL=postgresql://user:password@localhost/taxentia
```

---

## 🧪 Testing the Chat

### **Option 1: Use Example Queries**

The chat interface has pre-made examples:
- ✅ "Startup Expenditures" (IRC §195)
- ✅ "Home Office Deduction" (IRC §280A)
- ✅ "S Corp Elections" (Form 2553)
- ✅ "QBI Deduction" (IRC §199A)

Just click one!

### **Option 2: Custom Query**

```
Type any tax question:
"Can I deduct home office expenses if I work from home one day a week?"
```

### **Option 3: Command Line Test**

```bash
curl -X POST http://localhost:5000/api/taxentia/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the kiddie tax rule?"
  }'
```

---

## 🎯 Typical Response Latency

| Step | Time | Notes |
|------|------|-------|
| User submits | 0ms | |
| Network latency | ~10ms | Browser to server |
| Generate embedding | 400-500ms | OpenAI API |
| Query Qdrant | 40-60ms | Vector search |
| LLM generation | 2500-3500ms | GPT-5 thinking |
| Database save | 50-100ms | PostgreSQL |
| Network return | ~10ms | Server to browser |
| **TOTAL** | **~4-5 seconds** | End-to-end |

---

## 🛑 Common Issues & Fixes

### **"No response content from OpenAI"**
- Check: `OPENAI_API_KEY` is set
- Check: API key is valid (not expired)
- Check: You have OpenAI credits

### **"Failed to infer context"**
- Check: Qdrant is running (`docker-compose ps`)
- Check: Collection exists: `npm run inspect:qdrant`
- Check: Database has vectors (should show 4,143+)

### **"Internal server error"**
- Check server logs: `npm run dev` output
- Check PostgreSQL connection: `DATABASE_URL`
- Check Zod validation: Response schema mismatch

### **Response is empty or null**
- Check: LLM actually generated JSON
- Enable debug logging in `openai-service.ts`
- Try simpler query first

---

## 📊 Understanding the Response

```json
{
  "conclusion": "Bottom-line answer in 2-4 sentences with conditions",

  "authority": [
    {
      "citation": "26 U.S.C. § 179",      // ← Primary authority
      "sourceType": "usc",                 // ← Type indicator
      "title": "Full section title",
      "url": "https://law.cornell.edu/...",
      "directUrl": "Direct link if available"
    }
  ],

  "analysis": [
    {
      "step": "First analysis step",       // ← Logical flow
      "rationale": "Legal reasoning explained",
      "authorityRefs": [0]                 // ← Refs to authority array
    }
  ],

  "confidence": {
    "score": 92,                           // ← 0-100
    "color": "green",                      // ← red/amber/green
    "notes": "Why confident (direct cite, no conflicts, etc)"
  },

  "proceduralGuidance": {
    "forms": ["Form 4562"],                // ← Forms to file
    "deadlines": ["Must be placed in service"],
    "elections": ["Can elect out"]
  },

  "disclaimer": "For professional tax use only..."
}
```

---

## 🔐 Security Notes

### **Backend LLM (Why Backend?)**

| Aspect | Backend | Frontend |
|--------|---------|----------|
| **API Key** | 🔒 Secure | ❌ Exposed |
| **Cost Control** | ✅ Centralized | ❌ Uncontrolled |
| **Rate Limits** | ✅ Easy | ❌ Impossible |
| **Audit Trail** | ✅ Database | ❌ None |

### **Current Limitations**

⚠️ **Not production-ready yet:**
- ❌ No user authentication (using mock user ID)
- ❌ No rate limiting (anyone can spam queries)
- ❌ No cost tracking per user
- ❌ No query approval workflow
- ❌ No GDPR compliance

✅ **Ready to implement:**
- Real auth (Passport.js already configured)
- Rate limiting (middleware)
- Query caching (Redis)
- Cost tracking (per-user logging)
- Error recovery (fallback models)

---

## 🚀 Next Steps

### **To Try Now:**
```bash
npm run dev
# Open http://localhost:5173
# Ask a tax question
# See AI-powered response with citations
```

### **To Deploy:**
1. ✅ Fix authentication
2. ✅ Add rate limiting
3. ✅ Set up monitoring
4. ✅ Add caching layer
5. ✅ Create admin dashboard

### **To Extend:**
- Add streaming responses (real-time)
- Multi-turn conversations
- Query refinement
- Authority filtering (just IRC vs all sources)
- Export to PDF/Word

---

## 📞 Support

See: `docs/CHAT_LLM_ARCHITECTURE.md` for deep dive
Or: `docs/RAG_SYSTEM_STATUS.md` for system overview

---

**Status: ✅ FULLY OPERATIONAL**

Chat feature is ready to test. The LLM lives on the backend, Qdrant powers the retrieval, and your 4,143+ vectors are ready to serve accurate tax guidance!
