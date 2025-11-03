# 🏛️ Taxentia AI

> **Your AI Tax Research Partner for Professional Practice**
> _Delivering comprehensive, citable tax analysis with the precision professionals demand_

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB)](https://reactjs.org/)

---

## 🎯 What is Taxentia?

**Taxentia** is an AI-powered tax research assistant designed specifically for **CPAs, tax attorneys, and Enrolled Agents**. It combines a sophisticated **Retrieval-Augmented Generation (RAG)** system with official US tax authorities to deliver professional-grade analysis in seconds.

### 💡 The Problem We Solve

Tax professionals spend countless hours researching complex questions across multiple sources:

- 📚 Digging through IRC sections, Treasury Regulations, and IRS Publications
- 🔍 Cross-referencing Revenue Rulings and case law
- ⏰ Tracking down current effective dates and procedural requirements
- 📋 Identifying required forms, elections, and deadlines

**Taxentia consolidates this into seconds**, not hours.

---

## ✨ Key Features

### 🔬 **Professional-Grade Analysis**

- **Pinpoint Citations**: IRC §179(f)(2)(A)(i) level specificity
- **Authority Hierarchy**: Prioritizes IRC → Regulations → Publications → Rulings → Cases
- **Confidence Scoring**: Transparent reliability assessment (0-100%)
- **Legal Reasoning**: Formal analysis structure with rule → application → conclusion

### 🎯 **Actionable Guidance**

- **Direct Authority Links**: Click straight to exact IRC sections and regulations
- **Procedural Notes**: Required forms, key deadlines, available elections
- **Further Reading**: Related authorities with relevance explanations
- **Current Information**: Effective dates and version tracking

### 🚀 **Advanced RAG Pipeline**

- **Vector Search**: Qdrant-powered semantic retrieval of relevant tax authorities
- **Hybrid LLM Architecture**: Ollama initium/law_model (legal-specialized) with GPT-4o Mini fallback for reliability
- **Smart Context**: Optimized token usage without sacrificing quality
- **Comprehensive Sources**: US Code Title 26, CFR Title 26, IRS Bulletins (Revenue Rulings, Procedures, Notices, Treasury Decisions)

---

## 🛠️ Technology Stack

### **Frontend Excellence**

- **⚛️ React + TypeScript** - Type-safe, modern UI
- **🎨 Tailwind CSS + shadcn/ui (Radix)** - Professional, accessible design
- **⚡ Vite** - Lightning-fast development and builds

### **Backend Power**

- **🚀 Express + TypeScript** - Robust API architecture
- **🤖 Hybrid LLM** - Ollama initium/law_model (legal-specialized Mistral 7B) + GPT-4o Mini fallback
- **📊 Qdrant Vector Database** - High-performance vector similarity search (running in Docker)
- **🗄️ PostgreSQL + Drizzle ORM** - Reliable data persistence
- **🔐 Passport.js** - Secure authentication

### **AI/ML Pipeline**

- **🧠 Retrieval-Augmented Generation (RAG)** - Contextual, accurate responses
- **📝 OpenAI text-embedding-3-small** - 1536-dimension semantic embeddings
- **⚖️ Authority Prioritization** - Legal source hierarchy enforcement
- **🎯 Confidence Assessment** - Reliability scoring algorithm
- **📦 Automated Data Ingestion** - Custom fetchers for USC, CFR, and IRS bulletins

---

## 🚀 Quick Start

### **Prerequisites**

```bash
Node.js 18+ • Docker • PostgreSQL • npm
```

### **1. Clone and Install**

```bash
git clone https://github.com/baderale/Taxentia-AI.git
cd Taxentia-AI
npm install
```

### **2. Environment Setup**

Create a `.env` file (copy from `.env.example`):

```bash
# OpenAI Configuration (for embeddings and fallback)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL_NAME=gpt-4o-mini

# Ollama Configuration (Primary LLM)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=initium/law_model
OLLAMA_REQUEST_TIMEOUT=90000
USE_GPT4O_VALIDATION=true

# Vector Database (Docker)
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION_NAME=taxentia-authorities

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/taxentia
```

### **3. Start Docker Services**

```bash
# Start Qdrant vector database and Ollama LLM
docker-compose up -d qdrant ollama

# Pull the law-specific model (first-time setup, ~4.1GB)
docker exec -it taxentia-ollama ollama pull initium/law_model

# Verify Ollama is ready
curl http://localhost:11434/api/tags
```

### **4. Ingest Tax Authorities (First Time)**

```bash
# Test with sample data (2 recent IRS bulletins)
npm run ingest:test

# OR ingest full datasets
npm run ingest:usc    # US Code Title 26 (~1,612 sections)
npm run ingest:cfr    # CFR Title 26 (Treasury Regulations)
npm run ingest:irb    # IRS Bulletins (last 52 weeks)
npm run ingest:all    # All sources (takes 15-30 min)
```

### **5. Launch Development Server**

```bash
npm run dev     # Development server with hot reload (http://localhost:5000)
npm run build   # Production build
npm run start   # Production server
```

---

## 📊 Data Ingestion System

### **Automated Fetchers**

Taxentia includes custom TypeScript fetchers that download and parse official tax authorities:

| Source | Fetcher | Content | Status |
|--------|---------|---------|--------|
| **US Code Title 26** | `usc-fetcher.ts` | Internal Revenue Code (1,612 sections) | ✅ Production-ready |
| **CFR Title 26** | `cfr-fetcher.ts` | Treasury Regulations (full title) | ✅ Production-ready |
| **IRS Bulletins** | `irb-fetcher.ts` | Revenue Rulings, Procedures, Notices, Treasury Decisions | ✅ Production-ready |

### **Ingestion Pipeline**

```mermaid
graph LR
    A[Official Sources] --> B[Fetchers]
    B --> C[Text Chunker]
    C --> D[OpenAI Embeddings]
    D --> E[Qdrant Vector DB]
    E --> F[RAG System Ready]
```

**Process:**
1. **Fetch**: Download XML/HTML from official government sources
2. **Parse**: Extract structured content with proper citations
3. **Chunk**: Split into 2000-char chunks with 200-char overlap
4. **Embed**: Generate 1536-dimension vectors using OpenAI
5. **Store**: Upload to Qdrant with metadata (citation, source type, URL)

### **Key Features:**
- ✅ **Sentence-aware splitting** - Never breaks mid-sentence
- ✅ **Token-aware batching** - Prevents API errors
- ✅ **Idempotent operations** - Safe to re-run
- ✅ **Cost estimation** - Shows estimated OpenAI costs before processing
- ✅ **Progress tracking** - Real-time console output

### **Ingestion Commands**

```bash
# Individual sources
npm run ingest:usc          # US Code Title 26
npm run ingest:cfr          # CFR Title 26
npm run ingest:irb          # IRS Bulletins

# Batch operations
npm run ingest:all          # All sources
npm run ingest:test         # Quick test (2 bulletins)

# Inspection
npm run inspect:qdrant      # View ingested data statistics
```

**Current Ingestion Status (as of Nov 2025):**
- USC Title 26: ✅ Complete (1,612 sections → 3,730 chunks)
- IRS Bulletins: ✅ 10 recent bulletins (27 documents → 409 chunks)
- CFR Title 26: ⏳ Fetcher needs XML parsing fix (0 chunks)
- **Total:** 17,122 vectors in Qdrant

**Expected Costs:**
- Test ingestion: ~$0.0006 (68 chunks)
- USC Title 26: ~$0.05-0.10 (1,612 sections)
- Full ingestion: ~$0.50-1.00 (all sources)

---

## 📊 Vector Database Structure

### **Single Collection Architecture**

Taxentia uses a **unified collection approach** where all tax authority data is stored together in one Qdrant collection:

- **Collection Name**: `taxentia-authorities` (configurable via env)
- **Total Vectors**: 17,122+ chunks across all sources
- **Vector Dimensions**: 1536 (OpenAI text-embedding-3-small)
- **Distance Metric**: Cosine similarity
- **Organization**: Mixed data with metadata differentiation

**Design Philosophy**: Rather than separating sources into different collections, all authorities are stored together in a unified semantic space. This enables cross-source retrieval where a single query can find relevant IRC sections, Treasury Regulations, and IRS guidance simultaneously.

### **Data Organization by Source Type**

All vectors are mixed together but differentiated by `source_type` metadata:

| Source Type | Metadata Tag | Chunks | Citation Format |
|-------------|--------------|--------|-----------------|
| **US Code (IRC)** | `source_type: 'usc'` | 3,730 | `26 U.S.C. § 179` |
| **CFR (Treasury Regs)** | `source_type: 'cfr'` | 13,000+ | `26 CFR § 1.179-1` |
| **Revenue Rulings** | `source_type: 'revenue_ruling'` | ~8 | `Rev. Rul. 2024-01` |
| **Revenue Procedures** | `source_type: 'revenue_procedure'` | ~2 | `Rev. Proc. 2024-10` |
| **IRS Notices** | `source_type: 'notice'` | ~116 | `Notice 2024-45` |
| **Treasury Decisions** | `source_type: 'treasury_decision'` | ~283 | `T.D. 9999` |

### **Vector Payload Structure**

Each vector in Qdrant stores rich metadata alongside the embedded text:

```typescript
{
  // Core fields (all sources)
  text: string,                    // Chunk content (max 2000 chars)
  source_type: string,             // Source identifier
  citation: string,                // Formatted legal citation
  title: string,                   // Section/document title
  url: string,                     // Reference URL
  section: string,                 // Section identifier
  chunk_index: number,             // Position in document (0-based)
  total_chunks: number,            // Total chunks for this document

  // CFR-specific metadata
  part: string,                    // Part number (e.g., "1")

  // IRS Bulletin-specific metadata
  type: string,                    // Document type
  number: string,                  // Document number (e.g., "2024-01")
  bulletin_number: string,         // Bulletin ID (e.g., "2024-44")
  bulletin_date: string,           // Year issued

  // Internal tracking
  originalId: string               // Original string ID before numeric conversion
}
```

### **Query-Time Semantic Retrieval**

**How it works:**
1. User query is embedded into 1536-dimensional vector
2. Qdrant performs cosine similarity search across **all 17k+ vectors**
3. Top-5 most semantically similar chunks retrieved (regardless of source)
4. Hybrid LLM generates analysis using retrieved context:
   - **Primary**: Ollama initium/law_model (90s timeout)
   - **Fallback**: GPT-4o Mini (if Ollama times out or fails)
5. Authority hierarchy applied during response generation

**Example Query**: "Section 179 depreciation limits"

**Might retrieve:**
- IRC § 179(b)(1) - Statutory dollar limits *(primary authority)*
- 26 CFR § 1.179-1 - Implementing regulations *(secondary authority)*
- Rev. Proc. 2024-08 - Current year inflation adjustments *(administrative guidance)*

All ranked by semantic relevance, then hierarchically organized in the response.

### **Inspecting Your Data**

**Command Line:**
```bash
npm run inspect:qdrant
# Shows: collection stats, sample points, source breakdown
```

**Web Dashboard:**
```
http://localhost:6333/dashboard
```

**Dashboard Features:**
- Browse all collections and points
- View vector metadata and payloads
- Search by filters (source_type, section, etc.)
- Monitor cluster health and performance
- Visualize data distributions

### **Why This Architecture?**

**Benefits of Single Collection:**
- ✅ **Unified Semantic Search**: Query once, search everything
- ✅ **Cross-Authority Discovery**: IRC sections can surface related regulations
- ✅ **Simplified Query Logic**: No multi-collection merging required
- ✅ **Flexible Filtering**: Can filter by source_type when needed
- ✅ **Authority Hierarchy**: Applied at generation time, not storage time

**Trade-offs:**
- ⚠️ **No Source Isolation**: Can't easily delete/update just one source
- ⚠️ **Metadata Complexity**: Need consistent payload structure across sources
- ✅ **Mitigated By**: Idempotent ingestion scripts, clear chunk ID conventions

---

## 🔍 RAG System Architecture

### **Query Flow**

```mermaid
graph TB
    A[User Query] --> B[Generate Embedding<br/>OpenAI text-embedding-3-small]
    B --> C[Vector Search<br/>Qdrant Cosine Similarity]
    C --> D[Retrieve Top-5 Chunks<br/>with Metadata]
    D --> E[Build Context<br/>Max 12,000 chars]
    E --> F{Hybrid LLM}
    F -->|Primary| G[Ollama law_model<br/>90s timeout]
    F -->|Fallback| H[GPT-4o Mini<br/>if timeout/error]
    G --> I[Validate Schema<br/>Zod]
    H --> I
    I --> J[Save to PostgreSQL<br/>Query History]
    J --> K[Return to User<br/>Professional UI]
```

### **Response Structure**

Each query returns a comprehensive, structured analysis:

```typescript
{
  conclusion: string,              // Bottom-line answer (2-4 sentences)
  authority: [                     // Referenced authorities
    {
      sourceType: "irc" | "regs" | "pubs" | "rulings" | "cases",
      citation: "26 U.S.C. § 179(f)(2)(A)(i)",
      title: "Section 179 Deduction",
      url: "https://uscode.house.gov/...",
      directUrl: "https://...",     // Direct link to exact provision
      versionDate: "2024-01-01",
      effectiveDate: "2024-01-01"
    }
  ],
  analysis: [                      // Step-by-step reasoning
    {
      step: "Determine eligibility",
      rationale: "IRC §179(d)(1) defines...",
      authorityRefs: [0, 1],       // References to authority array
      proceduralNotes: "File Form 4562..."
    }
  ],
  scopeAssumptions: string,        // Explicit assumptions
  confidence: {
    score: 85,                     // 0-100 confidence
    color: "green",                // red/amber/green
    notes: "Based on primary authority..."
  },
  furtherReading: [...],           // Related authorities
  proceduralGuidance: {
    forms: ["Form 4562"],
    deadlines: ["March 15, 2025"],
    elections: ["Section 179 election"]
  },
  disclaimer: string
}
```

### **Performance Metrics**

- **Query Latency**:
  - With Ollama (typical): 10-30 seconds
    - Embedding: ~500ms
    - Vector search: ~50ms
    - Ollama analysis: ~10-25s
  - With GPT-4o Mini (fallback): 15-20 seconds
- **Cost per Query**:
  - Ollama: ~$0.0002 (embeddings only, 99% savings)
  - GPT-4o Mini fallback: ~$0.01-0.02
- **Accuracy**: 85%+ confidence typical
- **Context Size**: Up to 12,000 characters
- **Ollama Timeout**: 90 seconds (auto-fallback to GPT-4o Mini)

---

## 🗄️ Project Structure

```
Taxentia-AI/
├── 📁 client/                  # React frontend
│   ├── 📁 src/
│   │   ├── 📁 components/     # UI components (shadcn/ui)
│   │   ├── 📁 hooks/          # Custom React hooks
│   │   ├── 📁 lib/            # Utilities
│   │   └── 📄 main.tsx        # Entry point
│   └── 📄 index.html
│
├── 📁 server/                  # Express backend
│   ├── 📁 services/
│   │   ├── 📄 openai-service.ts      # RAG pipeline & GPT integration
│   │   ├── 📄 qdrant-service.ts      # Vector database operations
│   │   └── 📄 embeddings-service.ts  # Embedding generation
│   ├── 📄 routes.ts            # API endpoints
│   ├── 📄 storage.ts           # Database operations
│   └── 📄 index.ts             # Server entry
│
├── 📁 scripts/                 # Data ingestion scripts
│   ├── 📁 fetchers/
│   │   ├── 📄 usc-fetcher.ts  # US Code Title 26
│   │   ├── 📄 cfr-fetcher.ts  # CFR Title 26
│   │   └── 📄 irb-fetcher.ts  # IRS Bulletins
│   ├── 📁 utils/
│   │   ├── 📄 chunker.ts      # Text chunking (2000 chars)
│   │   └── 📄 embeddings.ts   # OpenAI embedding wrapper
│   ├── 📄 ingest-authorities.ts    # Main orchestrator
│   └── 📄 inspect-qdrant.ts        # Data inspection tool
│
├── 📁 shared/                  # Shared types & schemas
│   └── 📄 schema.ts            # Zod validation schemas
│
├── 📁 docs/                    # Technical documentation
│   ├── 📄 ARCHITECTURE.md      # System architecture
│   ├── 📄 INGESTION.md         # Ingestion guide
│   ├── 📄 QUICK_START_INGESTION.md
│   └── 📄 SYSTEM_DIAGRAM.md
│
├── 📄 CLAUDE.md                # AI assistant instructions
├── 📄 RAG_SYSTEM_STATUS.md     # RAG system status & readiness
├── 📄 docker-compose.yml       # Docker services (Qdrant)
├── 📄 package.json             # Dependencies & scripts
└── 📄 README.md                # This file
```

---

## 🔌 API Endpoints

### **POST /api/taxentia/query**
Submit a tax research query and receive structured analysis.

**Request:**
```json
{
  "query": "What are the Section 179 deduction limits for 2024?"
}
```

**Response:**
```json
{
  "id": 123,
  "userId": "user-123",
  "query": "What are the Section 179 deduction limits for 2024?",
  "response": {
    "conclusion": "...",
    "authority": [...],
    "analysis": [...],
    "confidence": { "score": 92, "color": "green" }
  },
  "confidence": 92,
  "confidenceColor": "green",
  "createdAt": "2025-10-27T06:00:00.000Z"
}
```

### **GET /api/queries**
Retrieve user's query history.

**Response:**
```json
[
  {
    "id": 123,
    "query": "Section 179 deduction limits",
    "confidence": 92,
    "createdAt": "2025-10-27T06:00:00.000Z"
  }
]
```

---

## 🐳 Docker Services

### **Qdrant Vector Database**

```bash
# Start Qdrant
docker-compose up -d qdrant

# Check status
docker ps | grep qdrant

# View dashboard
open http://localhost:6333/dashboard
```

**Qdrant Features:**
- **High Performance**: Rust-based, optimized for vector search
- **Cosine Similarity**: Perfect for semantic search
- **Rich Metadata**: Stores full context with each vector
- **REST API**: Easy to query and manage
- **Web Dashboard**: Visual data inspection

---

## 📈 Development Workflow

### **Daily Development**

```bash
# 1. Start services
docker-compose up -d qdrant

# 2. Start dev server (auto-reload)
npm run dev

# 3. Make changes to code
# Frontend: client/src/*
# Backend: server/*
# Scripts: scripts/*

# 4. Test changes
# Open http://localhost:5000
```

### **Adding New Tax Authorities**

```bash
# 1. Create new fetcher in scripts/fetchers/
# 2. Implement fetchAll() and parse() methods
# 3. Add to ingest-authorities.ts
# 4. Test with small sample
npm run ingest:test

# 5. Run full ingestion
npm run ingest:all
```

### **Inspecting Ingested Data**

```bash
# View statistics and samples
npm run inspect:qdrant

# Or use Qdrant dashboard
open http://localhost:6333/dashboard
```

---

## 🎯 Professional Benefits

| Feature             | Benefit                                          |
| ------------------- | ------------------------------------------------ |
| **⚡ Speed**        | 4-6 second response vs. hours of manual research |
| **🎯 Accuracy**     | RAG-powered retrieval from official sources      |
| **📊 Confidence**   | Transparent reliability scoring (85%+ typical)   |
| **🔗 Verification** | Direct links to source documents                 |
| **📋 Actionable**   | Forms, deadlines, elections clearly identified   |
| **💼 Client-Ready** | Professional formatting for client presentations |

---

## 🚢 Deployment

### **Current Architecture**
- **Development**: npm-based with hot reload
- **Vector DB**: Docker Qdrant (localhost:6333)
- **Database**: PostgreSQL
- **External APIs**: OpenAI

### **Production Deployment (Future)**

```
Local Development → Docker Containers → AWS Cloud
                    → Kubernetes (EKS)
                    → Load Balancer
                    → Managed RDS
```

**Considerations:**
- 📈 **Scalability**: Auto-scaling container groups
- 🔒 **Security**: VPC isolation, secrets management
- 📊 **Monitoring**: CloudWatch, application metrics
- 💾 **Data**: Managed PostgreSQL (RDS), Qdrant cluster

---

## 📚 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed system architecture
- **[INGESTION.md](docs/INGESTION.md)** - Data ingestion guide (400+ lines)
- **[QUICK_START_INGESTION.md](docs/QUICK_START_INGESTION.md)** - 5-minute quick start
- **[SYSTEM_DIAGRAM.md](docs/SYSTEM_DIAGRAM.md)** - Visual system diagrams
- **[RAG_SYSTEM_STATUS.md](RAG_SYSTEM_STATUS.md)** - RAG readiness & current data
- **[CLAUDE.md](CLAUDE.md)** - AI assistant project instructions

---

## 🔧 Troubleshooting

### **Qdrant Connection Issues**

```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker-compose restart qdrant

# View logs
docker logs taxentia-qdrant
```

### **Empty Query Results**

```bash
# Check if data is ingested
npm run inspect:qdrant

# If no data, run ingestion
npm run ingest:test
```

### **OpenAI API Errors**

```bash
# Verify API key is set
echo $OPENAI_API_KEY

# Check .env file
cat .env | grep OPENAI
```

---

## 📈 Roadmap

### **✅ Completed (v1.0)**
- [x] RAG pipeline with Qdrant
- [x] Automated data ingestion for USC, CFR, IRS bulletins
- [x] Hybrid LLM architecture (Ollama law_model + GPT-4o Mini fallback)
- [x] 90-second timeout with automatic fallback for reliability
- [x] Professional UI with Tailwind + shadcn/ui
- [x] Query history persistence
- [x] Confidence scoring with optional async validation

### **🚧 In Progress (v1.1)**
- [x] Full USC Title 26 ingestion (1,612 sections → 3,730 chunks) ✅
- [x] Recent IRS bulletin ingestion (10 bulletins → 409 chunks) ✅
- [ ] CFR Title 26 ingestion (fetcher needs XML parsing fix)
- [ ] Historical IRS bulletin ingestion (5+ years)
- [ ] Query result caching
- [ ] Real user authentication (currently mock)

### **📋 Planned (v2.0)**
- [ ] PDF export for client reports
- [ ] Team collaboration features
- [ ] Advanced filtering (date range, authority type)
- [ ] Tax Court case database integration
- [ ] Analytics dashboard
- [ ] Mobile app

---

## 🤝 Contributing

We welcome contributions! Whether you're a tax professional or developer:

### **For Tax Professionals**
- Report accuracy issues
- Suggest new data sources
- Provide feedback on response quality

### **For Developers**
- Fix bugs or add features
- Improve data fetchers
- Enhance RAG pipeline

```bash
# Development workflow
git checkout -b feature/your-feature
npm run dev
npm run build  # Ensure builds pass
git commit -m "feat: your feature description"
git push origin feature/your-feature
```

---

## 📄 License & Disclaimer

**License**: [MIT License](LICENSE)

**Professional Disclaimer**: Taxentia provides informational analysis for qualified tax professionals. All conclusions should be independently verified and professional judgment applied. This is not a substitute for professional tax advice. Users are responsible for ensuring compliance with all applicable laws and regulations.

---

## 🌟 Key Improvements (Recent Updates)

### **October 2024 Release**

#### **Data Ingestion Overhaul** 🎉
- ✅ **USC Title 26 Fetcher**: Complete rewrite with ZIP file support, USLM XML parsing
- ✅ **IRS Bulletin Fetcher**: Fixed HTML parsing, now extracts Treasury Decisions, Notices, Rev. Rulings
- ✅ **Smart Chunking**: Sentence-aware splitting prevents mid-sentence breaks
- ✅ **Token Management**: Intelligent batching prevents OpenAI API errors

#### **RAG System Enhancements**
- ✅ **Qdrant Integration**: Migrated from Pinecone to self-hosted Qdrant
- ✅ **Improved Retrieval**: Cosine similarity with rich metadata
- ✅ **Context Optimization**: Smart truncation preserves complete authority sections

#### **Developer Experience**
- ✅ **Docker Compose**: One-command Qdrant setup
- ✅ **Inspection Tools**: `npm run inspect:qdrant` for data visibility
- ✅ **Comprehensive Docs**: 4 detailed guides in docs/
- ✅ **Clean Repository**: Removed outdated files, streamlined structure

---

## 🙏 Acknowledgments

Built with:
- [Ollama](https://ollama.com) - Local LLM infrastructure
- [initium/law_model](https://ollama.com/initium/law_model) - Legal-specialized Mistral 7B
- [OpenAI](https://openai.com) - Embeddings and fallback LLM
- [Qdrant](https://qdrant.tech) - Vector database
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Vite](https://vitejs.dev) - Build tool
- [Drizzle ORM](https://orm.drizzle.team) - Database toolkit

Special thanks to the open-source community and tax professionals who provided invaluable feedback.

---

<div align="center">

**Built with ❤️ for Tax Professionals**

[🌐 GitHub](https://github.com/baderale/Taxentia-AI) • [📧 Support](mailto:bader@eale.it) • [📖 Docs](docs/)

**Ready to revolutionize your tax research?** [Get started](#quick-start) today.

</div>
