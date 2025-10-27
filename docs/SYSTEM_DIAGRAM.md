# Taxentia-AI System Diagrams

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Taxentia-AI Platform                         │
│                                                                     │
│  ┌──────────────┐         ┌──────────────┐        ┌─────────────┐ │
│  │   Frontend   │   HTTP  │   Backend    │  Query │   Qdrant    │ │
│  │    React     │◀───────▶│   Express    │◀──────▶│   Vector    │ │
│  │  TypeScript  │         │  TypeScript  │        │   Database  │ │
│  └──────────────┘         └──────────────┘        └─────────────┘ │
│                                   │                                 │
│                                   │                                 │
│                          ┌────────┴────────┐                        │
│                          ▼                 ▼                        │
│                   ┌──────────────┐  ┌──────────────┐               │
│                   │   OpenAI     │  │ PostgreSQL   │               │
│                   │   GPT-5      │  │   Database   │               │
│                   │ Embeddings   │  │  (Metadata)  │               │
│                   └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘

                              ▲
                              │ Ingestion Pipeline (scripts/)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  uscode.gov   │     │  ecfr.gov     │     │  irs.gov/irb  │
│  US Code      │     │  CFR Title 26 │     │  Bulletins    │
│  Title 26     │     │  (Regs)       │     │  (Rulings)    │
└───────────────┘     └───────────────┘     └───────────────┘
```

## 📊 Data Ingestion Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Ingestion Pipeline                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: FETCH
─────────────
┌──────────────────┐
│ Government Sites │
│  - USC (XML)     │
│  - CFR (XML)     │──┐
│  - IRS (HTML)    │  │
└──────────────────┘  │
                      │ Download
                      ▼
               ┌──────────────┐
               │  Raw Files   │
               │  (XML/HTML)  │
               └──────────────┘

Step 2: PARSE
─────────────
┌──────────────┐
│ XML Parser   │──┐
└──────────────┘  │
                  │ Extract
┌──────────────┐  │ Sections
│ HTML Parser  │──┘
└──────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Structured Documents         │
│ - Citation: "26 USC § 61"    │
│ - Title: "Gross income"      │
│ - Text: "Except as..."       │
│ - URL: "uscode.house.gov..." │
└──────────────────────────────┘

Step 3: CHUNK
─────────────
        │
        ▼
┌──────────────────────────────┐
│ Text Chunker                 │
│ - Max size: 2000 chars       │
│ - Overlap: 200 chars         │
│ - Paragraph-aware            │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Chunks (with metadata)       │
│ Chunk 1/3: "Section 61..."  │
│ Chunk 2/3: "...income from"│
│ Chunk 3/3: "...any source." │
└──────────────────────────────┘

Step 4: EMBED
─────────────
        │
        ▼
┌──────────────────────────────┐
│ OpenAI Embeddings API        │
│ Model: text-embedding-3-small│
│ Dimensions: 1536             │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ Vector Embeddings            │
│ [0.123, -0.456, 0.789, ...]  │
│ (1536 dimensions)            │
└──────────────────────────────┘

Step 5: STORE
─────────────
        │
        ▼
┌──────────────────────────────┐
│ Qdrant Vector Database       │
│ Collection: taxentia-auths   │
│ - Vectors (1536-dim)         │
│ - Metadata (payload)         │
│ - Similarity search (Cosine) │
└──────────────────────────────┘
```

## 🔍 Query Flow (RAG Pipeline)

```
┌──────────────────────────────────────────────────────────────────┐
│                      User Query Flow                             │
└──────────────────────────────────────────────────────────────────┘

Step 1: USER INPUT
──────────────────
┌──────────────────┐
│  User Query      │
│ "What is gross   │
│  income?"        │
└──────────────────┘
        │
        ▼

Step 2: EMBED QUERY
───────────────────
┌──────────────────────┐
│ OpenAI Embeddings    │
│ text-embedding-3s    │
└──────────────────────┘
        │
        ▼
[0.321, -0.654, 0.987, ...] (1536-dim vector)

Step 3: VECTOR SEARCH
─────────────────────
        │
        ▼
┌──────────────────────┐
│ Qdrant Query         │
│ Top 5 similar vectors│
└──────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Results (with scores)                   │
│                                         │
│ 1. 26 USC § 61       (score: 0.92) ✓   │
│ 2. 26 CFR § 1.61-1   (score: 0.89) ✓   │
│ 3. Rev. Rul. 2023-15 (score: 0.85) ✓   │
│ 4. 26 USC § 61(a)    (score: 0.84) ✓   │
│ 5. 26 CFR § 1.61-2   (score: 0.82) ✓   │
└─────────────────────────────────────────┘

Step 4: BUILD CONTEXT
─────────────────────
        │
        ▼
┌─────────────────────────────────────────┐
│ Context Assembly                        │
│                                         │
│ Retrieved text from all 5 authorities:  │
│ "Section 61 defines gross income as..." │
│ "The regulations clarify that..."       │
│ "Revenue Ruling 2023-15 held that..."   │
└─────────────────────────────────────────┘

Step 5: LLM GENERATION
──────────────────────
        │
        ▼
┌─────────────────────────────────────────┐
│ OpenAI GPT-5                            │
│                                         │
│ Prompt:                                 │
│ "Analyze using these authorities:      │
│  [context from Qdrant]                  │
│                                         │
│  Question: What is gross income?        │
│                                         │
│  Provide structured analysis."          │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Structured Response (JSON)              │
│                                         │
│ {                                       │
│   conclusion: "Gross income means...",  │
│   authority: [                          │
│     { citation: "26 USC § 61", ... },   │
│     { citation: "26 CFR § 1.61-1", ...} │
│   ],                                    │
│   analysis: [...],                      │
│   confidence: 95                        │
│ }                                       │
└─────────────────────────────────────────┘

Step 6: VALIDATE & SAVE
───────────────────────
        │
        ▼
┌─────────────────────────────────────────┐
│ Zod Schema Validation                   │
│ (taxResponseSchema)                     │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ PostgreSQL (Save query history)         │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ Return to Frontend                      │
│ Display structured analysis             │
└─────────────────────────────────────────┘
```

## 📅 Weekly Update Workflow

```
┌────────────────────────────────────────────────────────────┐
│               Weekly Automated Updates                     │
└────────────────────────────────────────────────────────────┘

Every Sunday at 2:00 AM
─────────────────────────

┌──────────────────────────┐
│ Windows Task Scheduler   │
│ Triggers:                │
│ schedule-weekly-update   │
│         .bat             │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│ npm run ingest:irb 5     │
│ (Last 5 bulletins)       │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ 1. Fetch bulletin list               │
│    https://www.irs.gov/irb           │
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ 2. Download latest 5 bulletins       │
│    - IRB 2025-44                     │
│    - IRB 2025-43                     │
│    - IRB 2025-42                     │
│    - IRB 2025-41                     │
│    - IRB 2025-40                     │
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ 3. Parse each bulletin               │
│    Extract:                          │
│    - Revenue Rulings                 │
│    - Revenue Procedures              │
│    - Notices                         │
│    - Announcements                   │
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ 4. Process documents                 │
│    - Chunk text                      │
│    - Generate embeddings (OpenAI)    │
│    - Upload to Qdrant (upsert)       │
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│ 5. Complete                          │
│    - Log results                     │
│    - Cost: ~$0.05                    │
│    - Duration: ~5 minutes            │
│    - New vectors added to Qdrant     │
└──────────────────────────────────────┘
```

## 💾 Data Storage Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Data Storage Layer                      │
└────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Qdrant Vector Database                                     │
│  (Primary search index)                                     │
│                                                             │
│  Collection: taxentia-authorities                           │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Point ID: usc-26-USC-61-chunk-0                       │ │
│  │                                                       │ │
│  │ Vector: [1536 dimensions]                             │ │
│  │ [0.123, -0.456, 0.789, 0.321, ...]                    │ │
│  │                                                       │ │
│  │ Payload:                                              │ │
│  │ {                                                     │ │
│  │   text: "Section 61 - Gross income defined...",      │ │
│  │   source_type: "usc",                                │ │
│  │   citation: "26 USC § 61",                           │ │
│  │   section: "61",                                     │ │
│  │   title: "Gross income defined",                     │ │
│  │   url: "https://uscode.house.gov/...",              │ │
│  │   chunk_index: 0,                                    │ │
│  │   total_chunks: 3                                    │ │
│  │ }                                                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Features:                                                  │
│  ✓ Fast similarity search (Cosine distance)                │
│  ✓ Metadata filtering                                      │
│  ✓ Scalable (millions of vectors)                          │
│  ✓ Running in Docker                                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                        │
│  (Application metadata & query history)                     │
│                                                             │
│  Tables:                                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ users                                                 │ │
│  │ - id, email, subscription_tier, etc.                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ tax_queries                                           │ │
│  │ - id, user_id, query, response, confidence, etc.      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ authorities (optional metadata cache)                 │ │
│  │ - id, citation, title, source_type, url               │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Development Workflow

```
┌────────────────────────────────────────────────────────────┐
│              Development to Production Path                │
└────────────────────────────────────────────────────────────┘

1. LOCAL DEVELOPMENT
────────────────────
┌──────────────────┐
│ Your Computer    │
│                  │
│ ├─ npm run dev  │
│ ├─ Qdrant (Dock)│
│ └─ PostgreSQL   │
└──────────────────┘
        │
        │ Test & Debug
        ▼

2. DATA INGESTION
─────────────────
┌──────────────────────┐
│ npm run ingest:test  │  ← Start here!
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ npm run ingest:irb   │  ← Then recent data
└──────────────────────┘
        │
        ▼
┌──────────────────────┐
│ npm run ingest:all   │  ← Full dataset
└──────────────────────┘

3. TESTING
──────────
┌──────────────────────┐
│ Test queries via UI  │
│ Verify results       │
│ Check Qdrant dash    │
└──────────────────────┘
        │
        ▼

4. AUTOMATION
─────────────
┌──────────────────────┐
│ Schedule weekly      │
│ Task Scheduler       │
└──────────────────────┘
        │
        ▼

5. MONITORING
─────────────
┌──────────────────────┐
│ Check logs weekly    │
│ Verify updates work  │
│ Monitor costs        │
└──────────────────────┘
```

## 🚀 Quick Start Visual Guide

```
START HERE
    │
    ├─ 1. Test System (2 min)
    │  └─ npm run ingest:test
    │
    ├─ 2. Check Qdrant (1 min)
    │  └─ http://localhost:6333/dashboard
    │
    ├─ 3. Ingest IRS Bulletins (10 min)
    │  └─ npm run ingest:irb
    │
    ├─ 4. Test Queries (5 min)
    │  └─ Use your app UI
    │
    ├─ 5. Schedule Updates (5 min)
    │  └─ Windows Task Scheduler
    │
    └─ 6. Ingest Full Dataset (when ready)
       └─ npm run ingest:all (3-5 hours)

TOTAL TIME TO PRODUCTION: ~30 minutes
(excluding full dataset ingestion)
```

---

## 📚 Legend

```
┌─────┐
│ Box │  = Component/System
└─────┘

  │
  ▼     = Data flow / Process flow

┌─────────────────────┐
│ Rounded box         │  = Action/Command
└─────────────────────┘

✓ = Completed/Available
● = In progress
○ = Not started
```
