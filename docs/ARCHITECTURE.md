# Taxentia-AI Data Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Taxentia-AI Platform                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   Frontend    │     │    Backend    │     │  Data Layer   │
│     React     │────▶│    Express    │────▶│               │
│   TypeScript  │     │   TypeScript  │     │  PostgreSQL   │
│   Tailwind    │     │   Drizzle ORM │     │   Qdrant      │
└───────────────┘     └───────────────┘     └───────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │   OpenAI     │    │   Ingestion  │
            │   GPT-5      │    │   Pipeline   │
            │ text-emb-3s  │    │  (Scripts)   │
            └──────────────┘    └──────────────┘
                                        │
                        ┌───────────────┼───────────────┐
                        │               │               │
                        ▼               ▼               ▼
                ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
                │  uscode.gov  │ │  ecfr.gov    │ │  irs.gov/irb │
                │  USC Title26 │ │  CFR Title26 │ │  Bulletins   │
                └──────────────┘ └──────────────┘ └──────────────┘
```

## Data Sources

### 1. US Code Title 26 (Internal Revenue Code)
- **Source**: https://uscode.house.gov
- **Format**: XML (USLM Schema)
- **Update Frequency**: With each Public Law (sporadic)
- **Size**: ~10-50 MB
- **Documents**: ~5,000-10,000 sections
- **Access Method**: Bulk XML download

**Data Flow:**
```
uscode.house.gov/download/xml/title26.xml
    ↓ Download XML
    ↓ Parse with fast-xml-parser
    ↓ Extract sections (§1, §61, §162, etc.)
    ↓ Chunk text (~2000 chars each)
    ↓ Generate embeddings (OpenAI)
    ↓ Upload to Qdrant
```

### 2. CFR Title 26 (Treasury Regulations)
- **Source**: https://www.govinfo.gov/bulkdata/ECFR
- **Format**: XML (eCFR structure)
- **Update Frequency**: Daily (eCFR is continuously updated)
- **Size**: ~83 MB XML + 3.8 MB graphics
- **Documents**: ~50,000-100,000 regulation sections
- **Access Method**: Bulk XML download from govinfo.gov

**Data Flow:**
```
govinfo.gov/bulkdata/ECFR/title-26/ECFR-title26.xml
    ↓ Download XML (83MB)
    ↓ Parse with fast-xml-parser
    ↓ Extract regulations (§1.61-1, §1.162-1, etc.)
    ↓ Chunk text (~2000 chars each)
    ↓ Generate embeddings (OpenAI)
    ↓ Upload to Qdrant (batched)
```

### 3. IRS Bulletins (Revenue Rulings & Procedures)
- **Source**: https://www.irs.gov/irb
- **Format**: HTML (per bulletin) + PDF
- **Update Frequency**: Weekly (every Monday)
- **Documents**: ~50-100 new documents per year
- **Historical**: 1995-present (30 years)
- **Access Method**: Web scraping with Cheerio

**Data Flow:**
```
irs.gov/irb
    ↓ Scrape bulletin index
    ↓ For each bulletin:
        ↓ Download HTML
        ↓ Parse with Cheerio
        ↓ Extract Rev. Rul., Rev. Proc., Notices
        ↓ Chunk text
        ↓ Generate embeddings
        ↓ Upload to Qdrant
```

## Vector Database Schema

### Qdrant Collection: `taxentia-authorities`

```typescript
{
  vector_config: {
    size: 1536,              // OpenAI text-embedding-3-small
    distance: "Cosine"       // Similarity metric
  },

  payload_schema: {
    // Universal fields (all documents)
    text: string,            // Full text content
    source_type: string,     // "usc" | "cfr" | "revenue_ruling" | "revenue_procedure" | "notice"
    citation: string,        // Official citation (e.g., "26 USC § 61")
    title: string,           // Section/regulation title
    url: string,             // Official government URL

    // Chunking metadata
    chunk_index: number,     // 0, 1, 2... for multi-chunk documents
    total_chunks: number,    // Total chunks for this document

    // Source-specific fields
    section?: string,        // USC: section number
    part?: string,           // CFR: part number
    number?: string,         // IRB: ruling/procedure number
    bulletin_number?: string,// IRB: bulletin identifier
    bulletin_date?: string,  // IRB: publication date
  }
}
```

## RAG Pipeline (Query Flow)

```
User Query: "What is gross income?"
    ↓
1. Generate embedding (OpenAI text-embedding-3-small)
    ↓
2. Query Qdrant (top 5 similar vectors)
    ↓ Returns:
    - 26 USC § 61 (score: 0.92)
    - 26 CFR § 1.61-1 (score: 0.89)
    - Rev. Rul. 2023-15 (score: 0.85)
    - 26 USC § 61(a) (score: 0.84)
    - 26 CFR § 1.61-2 (score: 0.82)
    ↓
3. Build context from retrieved chunks
    ↓
4. Send to GPT-5 with prompt:
    "Analyze this tax question using these authorities:
     [context from Qdrant]

     Question: What is gross income?

     Provide structured analysis with citations."
    ↓
5. GPT-5 generates structured response
    ↓
6. Validate against taxResponseSchema (Zod)
    ↓
7. Save to PostgreSQL
    ↓
8. Return to frontend
```

## Ingestion Pipeline

### Architecture

```typescript
// Main orchestrator
AuthorityIngestionPipeline
    ├── ingestUSC()
    ├── ingestCFR()
    └── ingestIRB()

// Fetchers (data acquisition)
USCFetcher
    ├── downloadTitle26XML()
    ├── parseTitle26XML()
    └── extractSections()

CFRFetcher
    ├── downloadTitle26XML()
    ├── parseTitle26XML()
    └── extractRegulations()

IRBFetcher
    ├── getBulletinList()
    ├── parseBulletin()
    └── extractSectionText()

// Utilities
TextChunker
    ├── chunkDocument()
    └── generateChunkId()

EmbeddingsService
    ├── generateEmbeddings()
    └── estimateCost()

QdrantService (existing)
    ├── ensureCollection()
    ├── upsert()
    └── query()
```

### Processing Steps

1. **Fetch**: Download source documents (XML/HTML)
2. **Parse**: Extract structured data from raw formats
3. **Chunk**: Split long documents into ~2000 char segments with overlap
4. **Embed**: Generate 1536-dimension vectors using OpenAI
5. **Upload**: Batch insert into Qdrant (100 points per batch)
6. **Monitor**: Track progress, costs, and errors

## Performance Characteristics

### USC Title 26 Ingestion
- **Documents**: ~5,000-10,000 sections
- **Chunks**: ~8,000-15,000
- **Duration**: 30-60 minutes
- **Cost**: ~$0.50-$1.00
- **Bottleneck**: OpenAI API rate limits

### CFR Title 26 Ingestion
- **Documents**: ~50,000-100,000 regulations
- **Chunks**: ~100,000-200,000
- **Duration**: 2-4 hours
- **Cost**: ~$5-$10
- **Bottleneck**: Large XML parsing + embeddings

### IRS Bulletins (10 recent)
- **Documents**: ~500-1,000
- **Chunks**: ~1,000-2,000
- **Duration**: 5-10 minutes
- **Cost**: ~$0.10-$0.20
- **Bottleneck**: Web scraping delays

## Cost Analysis

### OpenAI Costs
- **Model**: text-embedding-3-small
- **Price**: $0.02 per 1M tokens
- **Estimate**: ~4 chars per token
- **Formula**: (total_chars / 4) / 1_000_000 * $0.02

### Monthly Operating Costs
```
Initial ingestion (one-time):
  USC:           $1.00
  CFR:          $10.00
  IRB (hist):    $5.00
  Total:        $16.00

Weekly updates:
  IRB (5 new):   $0.05
  Monthly:       $0.20

Annual:         $2.40 + $16.00 initial = $18.40
```

## Scaling Considerations

### Current Limits
- **Qdrant**: Unlimited vectors (limited by disk space)
- **OpenAI**: 3,500 requests/min (tier 1)
- **Memory**: CFR requires ~2GB RAM during processing

### Future Scaling
- **Sharding**: Split CFR into multiple collections by part
- **Caching**: Store embeddings to avoid re-computation
- **Incremental**: Only update changed sections
- **Parallel**: Process multiple sources simultaneously

## Monitoring

### Key Metrics
- Documents processed
- Chunks created
- Vectors uploaded
- Processing duration
- API costs
- Error rates

### Health Checks
```bash
# Check Qdrant collection
curl http://localhost:6333/collections/taxentia-authorities

# View collection stats
npm run ingest:authorities help

# Test query
# (Use your application's search interface)
```

## Update Strategy

### Frequency Recommendations
- **USC**: Monthly (changes are infrequent)
- **CFR**: Monthly (eCFR updates daily, but major changes are rare)
- **IRB**: Weekly (new bulletins every Monday)

### Incremental Updates
```bash
# Weekly schedule (automated)
npm run ingest:irb 5

# Monthly check (manual or scheduled first Sunday)
npm run ingest:usc
npm run ingest:cfr
```

### Full Re-index
Run quarterly to ensure data freshness:
```bash
npm run ingest:all
```

## Disaster Recovery

### Backup Strategy
1. **Qdrant snapshots**: Use Qdrant's snapshot API
2. **PostgreSQL backups**: Standard pg_dump
3. **Source data**: Can always re-fetch from government sites

### Recovery Process
1. Restore Qdrant from snapshot
2. Restore PostgreSQL database
3. If needed, re-run ingestion (idempotent)

## Security Considerations

### Data Sources
- ✅ All sources are official U.S. government sites
- ✅ Public domain data (no copyright issues)
- ✅ HTTPS connections required
- ✅ Rate limiting respected (delays between requests)

### API Keys
- 🔒 OpenAI API key in `.env` (never commit)
- 🔒 Qdrant URL localhost (not public)
- 🔒 PostgreSQL credentials in `.env`

### Compliance
- ✅ No PII collected
- ✅ No user data in ingestion pipeline
- ✅ All data is public legal documents

## Technology Stack

### Languages
- TypeScript (100%)
- Node.js runtime

### Libraries
- **XML Parsing**: fast-xml-parser
- **HTML Parsing**: Cheerio
- **HTTP Requests**: Axios
- **Embeddings**: OpenAI SDK
- **Vector DB**: @qdrant/js-client-rest
- **Database**: Drizzle ORM (PostgreSQL)

### Infrastructure
- **Development**: Local Docker (Qdrant + PostgreSQL)
- **Production**: AWS ECS/EKS (future)
- **Scheduling**: Windows Task Scheduler (current) / Cron (future)

## Future Enhancements

### Phase 1 (Current)
- ✅ Automated ingestion from 3 sources
- ✅ Chunking with overlap
- ✅ Qdrant vector storage
- ✅ Weekly scheduling

### Phase 2 (Next Quarter)
- [ ] Incremental updates (only changed sections)
- [ ] Embedding caching
- [ ] Advanced filtering (by date, source type)
- [ ] Search analytics

### Phase 3 (Future)
- [ ] Additional sources (PLR, TAM, case law)
- [ ] Multi-tenant support
- [ ] API for external access
- [ ] Advanced NLP (entity extraction, summarization)
