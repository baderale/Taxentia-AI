# Taxentia AI - Data Ingestion System

Python-based data ingestion pipeline for indexing tax authorities (US Code Title 26, CFR Title 26, IRS Bulletins) into Qdrant vector database.

## Overview

This module ingests three types of tax authority data:

- **US Code Title 26 (IRC)**: ~9,000 sections from House.gov XML
- **CFR Title 26 (Treasury Regulations)**: ~15,000 regulations from eCFR
- **IRS Revenue Rulings/Procedures**: Weekly bulletins from IRS.gov

Data flow: **Fetch → Chunk → Embed → Index (Qdrant)**

## Architecture

```
ingestion/
├── fetchers/          # Data acquisition (USC, CFR, IRB)
├── processors/        # Transform layer (chunking, embeddings)
├── storage/          # Persistence (Qdrant, PostgreSQL)
├── models/           # Pydantic data models
├── scheduler/        # APScheduler task definitions
├── utils/            # Utilities (hashing, logging, retry)
├── tests/            # Unit & integration tests
└── scripts/          # CLI entry points
```

## Installation

1. **Create Python virtual environment:**
   ```bash
   cd ingestion
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Download NLTK data (for sentence tokenization):**
   ```bash
   python -c "import nltk; nltk.download('punkt')"
   ```

4. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database URLs
   ```

## Configuration

Key environment variables:

- `OPENAI_API_KEY`: OpenAI API key
- `QDRANT_URL`: Qdrant server URL (default: `http://localhost:6333`)
- `DATABASE_URL`: PostgreSQL connection string
- `LOG_LEVEL`: Logging level (default: `INFO`)

See `.env.example` for all available settings.

## Quick Start

### Local Development (Docker)

```bash
# Start Qdrant and PostgreSQL
docker-compose -f docker/docker-compose.yml up -d

# Ingest IRS bulletins (10 latest)
python scripts/run_ingestion.py irb

# Ingest US Code Title 26
python scripts/run_ingestion.py usc

# Ingest CFR Title 26
python scripts/run_ingestion.py cfr

# Ingest everything
python scripts/run_ingestion.py all
```

### Usage Examples

```python
from ingestion.fetchers.irb_fetcher import IRBFetcher
from ingestion.processors.chunker import TextChunker
from ingestion.processors.embeddings import EmbeddingsService
from ingestion.storage.qdrant_client import QdrantClient

# Fetch IRS bulletins
fetcher = IRBFetcher()
bulletins = await fetcher.fetch_recent(count=10)

# Chunk documents
chunker = TextChunker()
chunks = []
for bulletin in bulletins:
    doc_chunks = chunker.chunk_document(
        bulletin.text,
        metadata={
            "source_type": "irb",
            "citation": bulletin.citation,
            "title": bulletin.title,
        }
    )
    chunks.extend(doc_chunks)

# Generate embeddings
embeddings_service = EmbeddingsService()
embedded_chunks = await embeddings_service.generate_embeddings(chunks)

# Upload to Qdrant
qdrant = QdrantClient()
await qdrant.upsert_batch(embedded_chunks, batch_size=100)
```

## Scheduling

The system uses hybrid scheduling (schedule + change detection):

| Data Source | Schedule | Detection |
|------------|----------|-----------|
| **IRB** | Tuesday 2 AM UTC | N/A (predictable) |
| **IRC** | 1st of month, 3 AM UTC | Version check |
| **CFR** | Every 6 hours | Last-Modified header |

Start scheduler:
```bash
python -m ingestion.scheduler
```

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_chunker.py -v

# Run with coverage
pytest tests/ --cov=ingestion --cov-report=html
```

Critical tests:
- `test_id_hashing.py`: Verify TypeScript/Python ID compatibility
- `test_integration.py`: End-to-end pipeline testing

## Cost Estimation

**Initial Ingestion:**
- US Code: ~9M tokens → $0.18
- CFR: ~7.5M tokens → $0.15
- IRB: ~400k tokens → $0.008
- **Total: ~$0.34**

**Ongoing Updates:**
- Weekly IRB: $0.0003/week
- Monthly IRC: $0.002/month
- CFR updates: Variable, ~$0.01-0.05/month

## Key Implementation Details

### ID Hashing (CRITICAL!)

String IDs are hashed to numeric IDs for Qdrant compatibility:

```python
from ingestion.utils.hashing import string_to_numeric_id

id = string_to_numeric_id("usc-195-chunk-0")  # Must match TypeScript
```

**This must exactly replicate TypeScript for compatibility with existing data!**

### Token Counting

Uses `tiktoken` library for accurate token counting (not char/3 heuristic):

```python
from ingestion.processors.embeddings import count_tokens

tokens = count_tokens("Section text here...")
```

### Text Chunking

Sentence-aware chunking with overlap:

```python
from ingestion.processors.chunker import TextChunker

chunker = TextChunker(max_chunk_size=2000, overlap_size=200)
chunks = chunker.chunk_document(text, metadata={...})
```

Handles abbreviations correctly using NLTK sentence tokenizer.

### Change Detection

Smart change detection prevents redundant re-ingestion:

- **IRC**: Version tracking (Public Law number)
- **CFR**: Last-Modified timestamps
- **IRB**: Bulletin number tracking in PostgreSQL

## Troubleshooting

**Connection Issues:**
```bash
# Test Qdrant connection
curl http://localhost:6333/health

# Test PostgreSQL
psql postgresql://taxentia:password@localhost:5432/taxentia
```

**Embedding API Errors:**
- Check `OPENAI_API_KEY` is valid
- Check token limits not exceeded
- Verify OpenAI account has credits

**Memory Issues (CFR):**
- CFR ingestion streams 83MB XML
- Uses `lxml.etree.iterparse()` for memory efficiency
- If OOM: reduce `batch_size_qdrant` or `batch_size_embeddings`

## Development

**Add new fetcher:**
1. Create `ingestion/fetchers/new_fetcher.py`
2. Inherit from `BaseFetcher`
3. Implement `fetch_all()` method
4. Add tests in `tests/test_fetchers.py`

**Add new data source:**
1. Create Pydantic model in `ingestion/models/documents.py`
2. Implement fetcher
3. Add to CLI in `scripts/run_ingestion.py`

## Roadmap

- [x] Week 1: Foundation & processing pipeline
- [x] Week 2: Storage layer
- [ ] Week 3: Fetchers (IRB, USC, CFR)
- [ ] Week 4: Python/TypeScript parity testing
- [ ] Week 5: Scheduling & production ready

## License

Part of Taxentia AI project. See main repository LICENSE.

## Contributing

See main repository CONTRIBUTING.md for guidelines.
