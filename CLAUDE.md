# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server (requires build)
- `npm run build` - Build the application for production (Vite build + esbuild server bundle)

### Data Indexing
- `npm run ingest:all` - Index all authorities data into Qdrant vector database
- `npm run ingest:usc` - Index US Code Title 26 sections
- `npm run ingest:cfr` - Index CFR Title 26 regulations
- `npm run ingest:irb` - Index IRS Bulletins
- `npm run inspect:qdrant` - Inspect indexed data in Qdrant

## Architecture Overview

### Tech Stack
- **Frontend**: React + TypeScript + Vite, Tailwind CSS + Radix UI components
- **Backend**: Express server with TypeScript
- **AI/ML**: Hybrid LLM (Ollama initium/law_model + GPT-4o Mini fallback), text-embedding-3-small for embeddings, Qdrant for vector storage (Docker)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy

### Project Structure
```
client/          - React frontend application
server/          - Express backend services
  routes.ts      - API endpoints (/api/taxentia/query, /api/queries, health check)
  services/      - Core business logic services
    hybrid-llm-service.ts - Hybrid LLM service (Ollama + GPT-4o Mini fallback)
    openai-service.ts     - Legacy OpenAI service (backup)
    qdrant-service.ts     - Vector database operations
    embeddings-service.ts - Embedding generation utilities
  storage.ts     - Database operations layer
shared/          - Type definitions and schemas shared between client/server
scripts/         - Data processing utilities
  fetchers/      - USC, CFR, and IRS bulletin fetchers
  utils/         - Text chunker and embedding utilities
  ingest-authorities.ts - Main ingestion orchestrator
```

### Core Data Flow (RAG Pipeline)
1. User submits tax query via `/api/taxentia/query`
2. Query embedding generated using OpenAI text-embedding-3-small
3. Qdrant queried for top-5 relevant authority chunks (cosine similarity)
4. Hybrid LLM generates structured legal analysis:
   - **Primary**: Ollama initium/law_model (legal-specialized, 90s timeout)
   - **Fallback**: GPT-4o Mini (if Ollama times out or fails)
   - **Validation**: Optional async GPT-4o Mini validation for low confidence (<70%)
5. Response validated against `taxResponseSchema` and saved to PostgreSQL

### Response Schema Structure
The system generates structured tax analysis with:
- `conclusion`: Bottom-line answer with next steps
- `authority[]`: Referenced legal authorities with sourceType (irc|regs|pubs|rulings|cases)
- `analysis[]`: Step-by-step legal reasoning with authority references
- `scopeAssumptions`: Explicit assumptions and scope limits
- `confidence`: Score (0-100) with color coding and notes

### Environment Variables Required
- `OPENAI_API_KEY`: OpenAI API access (for embeddings and fallback/validation)
- `OPENAI_MODEL_NAME`: Fallback model name (defaults to "gpt-4o-mini")
- `OLLAMA_API_URL`: Ollama service URL (defaults to "http://localhost:11434")
- `OLLAMA_MODEL`: Ollama model name (defaults to "initium/law_model")
- `OLLAMA_REQUEST_TIMEOUT`: Timeout in ms before fallback (defaults to 90000 = 90 seconds)
- `USE_GPT4O_VALIDATION`: Enable async validation for low confidence (true/false)
- `QDRANT_URL`: Qdrant vector database URL (defaults to "http://localhost:6333")
- `QDRANT_COLLECTION_NAME`: Target collection name (defaults to "taxentia-authorities")
- `DATABASE_URL`: PostgreSQL connection string

### Key Implementation Details
- Uses hybrid LLM architecture: Ollama initium/law_model (legal-specialized Mistral 7B) as primary, GPT-4o Mini as fallback
- 90-second timeout on Ollama requests automatically triggers fallback to ensure reliability
- Structured JSON output for consistent response format across both models
- Implements confidence scoring based on authority strength and assumptions
- Optional async GPT-4o Mini validation for responses with confidence < 70%
- Vector search retrieves context from pre-indexed tax authority documents
- Mock user authentication (userId: "mock-user-id") - implement real auth as needed
- All tax analysis includes legal disclaimers and professional review requirements

### Database Schema
- `users`: User accounts with subscription tiers
- `tax_queries`: Query history with structured responses and confidence scores
- `authorities`: Tax authority documents with chunks for retrieval

### Development Notes
- Frontend uses shadcn/ui components with Radix primitives
- Backend uses Drizzle ORM with Zod validation
- Shared types ensure consistency between client/server
- Data ingestion scripts fetch, chunk, and embed tax authorities into Qdrant vectors
- Qdrant runs in Docker via docker-compose for local development

## Deployment Strategy

### Development Workflow: Local → Docker → AWS
1. **Local Development**: Current npm-based development with hot reload
2. **Docker Containerization**: Self-contained deployment with docker-compose
3. **AWS Production**: Scalable cloud deployment using same Docker containers

### Docker Setup (Future)
- **Self-contained approach**: Frontend + Backend in single container or separate services
- **Dependencies**: PostgreSQL container, environment configuration, volume persistence
- **Benefits**: Identical environments across development/staging/production
- **AWS Migration**: Same Docker containers deploy to ECS/EKS/EC2

### Production Scaling Considerations
- **Architecture**: Load balancer → Auto-scaling container groups → Managed PostgreSQL
- **External Services**: Qdrant (self-hosted vector DB in Docker) + Ollama (self-hosted LLM in Docker) + OpenAI (external SaaS for embeddings/fallback)
- **Monitoring**: Health checks, logging, metrics collection, LLM response times and fallback rates
- **Security**: Secrets management, VPC isolation, compliance (SOC2/GDPR)