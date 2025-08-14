# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `npm run dev` - Start development server with hot reload
- `npm run start` - Start production server (requires build)
- `npm run build` - Build the application for production (Vite build + esbuild server bundle)

### Data Indexing
- `npm run index-data` - Index authorities data into Pinecone vector database (compiles scripts first)

## Architecture Overview

### Tech Stack
- **Frontend**: React + TypeScript + Vite, Tailwind CSS + Radix UI components
- **Backend**: Express server with TypeScript
- **AI/ML**: OpenAI GPT-5 for analysis, text-embedding-3-small for embeddings, Pinecone for vector storage
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy

### Project Structure
```
client/          - React frontend application
server/          - Express backend services
  routes.ts      - API endpoints (/api/taxentia/query, /api/queries, health check)
  services/      - Core business logic services
    openai-service.ts   - OpenAI integration and RAG pipeline
    pinecone-service.ts - Vector database operations
  storage.ts     - Database operations layer
shared/          - Type definitions and schemas shared between client/server
scripts/         - Data processing utilities (index-data.ts for Pinecone indexing)
authorities.md   - Source URLs for tax authority documents to index
```

### Core Data Flow (RAG Pipeline)
1. User submits tax query via `/api/taxentia/query`
2. Query embedding generated using OpenAI text-embedding-3-small
3. Pinecone queried for top-5 relevant authority chunks
4. OpenAI GPT-5 generates structured legal analysis with authorities
5. Response validated against `taxResponseSchema` and saved to PostgreSQL

### Response Schema Structure
The system generates structured tax analysis with:
- `conclusion`: Bottom-line answer with next steps
- `authority[]`: Referenced legal authorities with sourceType (irc|regs|pubs|rulings|cases)
- `analysis[]`: Step-by-step legal reasoning with authority references
- `scopeAssumptions`: Explicit assumptions and scope limits
- `confidence`: Score (0-100) with color coding and notes

### Environment Variables Required
- `OPENAI_API_KEY`: OpenAI API access
- `OPENAI_MODEL_NAME`: Model name (defaults to "gpt-5")
- `PINECONE_API_KEY`: Pinecone vector database access
- `PINECONE_INDEX_NAME`: Target index name
- `DATABASE_URL`: PostgreSQL connection string

### Key Implementation Details
- Uses structured JSON output from OpenAI for consistent response format
- Implements confidence scoring based on authority strength and assumptions
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
- Data indexing script processes authorities.md URLs into Pinecone vectors

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
- **External Services**: Pinecone (vector DB) + OpenAI (already external SaaS)
- **Monitoring**: Health checks, logging, metrics collection
- **Security**: Secrets management, VPC isolation, compliance (SOC2/GDPR)