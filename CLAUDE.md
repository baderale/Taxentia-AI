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
- **AI/ML**: GPT-4o Mini for language generation, text-embedding-3-small for embeddings, Qdrant for vector storage (Docker)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy

### Project Structure
```
client/          - React frontend application
server/          - Express backend services
  routes.ts      - API endpoints (/api/taxentia/query, /api/queries, health check)
  services/      - Core business logic services
    hybrid-llm-service.ts - GPT-4o Mini service for tax analysis
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
4. GPT-4o Mini generates structured legal analysis using retrieved context
5. Response validated against `taxResponseSchema` and saved to PostgreSQL

### Response Schema Structure
The system generates structured tax analysis with:
- `conclusion`: Bottom-line answer with next steps
- `authority[]`: Referenced legal authorities with sourceType (irc|regs|pubs|rulings|cases)
- `analysis[]`: Step-by-step legal reasoning with authority references
- `scopeAssumptions`: Explicit assumptions and scope limits
- `confidence`: Score (0-100) with color coding and notes

### Environment Variables Required
- `OPENAI_API_KEY`: OpenAI API access (for embeddings and primary LLM)
- `OPENAI_MODEL_NAME`: Model name (defaults to "gpt-4o-mini")
- `QDRANT_URL`: Qdrant vector database URL (defaults to "http://localhost:6333")
- `QDRANT_COLLECTION_NAME`: Target collection name (defaults to "taxentia-authorities")
- `DATABASE_URL`: PostgreSQL connection string

### Key Implementation Details
- Uses GPT-4o Mini for reliable, cost-effective tax analysis
- Structured JSON output for consistent response format
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
- Data ingestion scripts fetch, chunk, and embed tax authorities into Qdrant vectors
- Qdrant runs in Docker via docker-compose for local development

## Development Workflow Guidelines

### Documentation Standards
- **ALWAYS update `Changelog.md`** when making significant changes to the codebase
  - Use semantic versioning (MAJOR.MINOR.PATCH)
  - Follow "Keep a Changelog" format: Added, Changed, Deprecated, Removed, Fixed, Security
  - Document breaking changes, new features, bug fixes, and infrastructure updates
  - Include dates and version numbers for all entries

### Code Quality Standards
- **Always clean up the project folder** - Remove unused files, old configs, temporary scripts
- **Update README.md** as appropriate when architecture or usage changes
- **Push changes to GitHub** with clear, descriptive commit messages
  - Use conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
  - Include context and reasoning in commit body when needed
  - Reference issues or tickets when applicable

### Commit Message Format
```
<type>: <subject>

<body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `chore`: Build process, dependencies, configs
- `test`: Adding or updating tests

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
- **External Services**: Qdrant (self-hosted vector DB in Docker) + OpenAI (external SaaS for embeddings and LLM)
- **Monitoring**: Health checks, logging, metrics collection, LLM response times
- **Security**: Secrets management, VPC isolation, compliance (SOC2/GDPR)

## High-Converting SaaS Landing Page Anatomy

Reference structure for implementing marketing/conversion-focused landing pages:

### Page Sections (Top-to-Bottom)

1. **Navbar**
   - Logo/brand identity
   - Navigation menu (Features, Pricing, About, Docs)
   - CTA button (Sign Up / Get Started)
   - Sticky positioning for visibility throughout scroll

2. **Hero Area**
   - Compelling headline (value proposition)
   - Subheading explaining main benefit
   - Hero CTA button (primary action)
   - Visual element (screenshot, demo, illustration)
   - Establishes immediate value and inspires action

3. **Partners/Social Proof Section**
   - Logos of recognized companies using the service
   - Builds credibility and trust
   - Typically 5-10 partner logos in a row
   - Reinforces market validation

4. **Benefits Section**
   - 3-6 benefit cards highlighting key advantages
   - Focus on user benefits, not technical features
   - Use icons for visual appeal
   - Clear, concise copy for each benefit
   - Explains what problems the product solves

5. **"How It Works?" Section**
   - Step-by-step process explanation (typically 3-5 steps)
   - Visual indicators (numbers, arrows, progression)
   - Simplifies the user journey
   - Reduces perceived complexity for prospects

6. **Pricing Section**
   - Multiple pricing tiers for different customer segments
   - Highlight recommended/popular tier (e.g., "Most Popular")
   - Include feature comparison per tier
   - Transparent pricing builds trust
   - CTA buttons for each tier
   - Optional: annual/monthly toggle with discount incentive

7. **Testimonials Section**
   - "Loved by people worldwide" or similar heading
   - 3-5 customer testimonial cards
   - Include customer photo, name, company, role
   - Specific, quantifiable results when possible
   - Social proof from real users increases conversion

8. **FAQ Section**
   - Addresses common objections and questions
   - 5-8 commonly asked questions
   - Expandable accordion format for UX
   - Reduces support burden and friction

9. **Final CTA Section**
   - Reinforces main value proposition
   - Clear, high-contrast CTA button
   - Creates sense of urgency (if applicable)
   - Last conversion opportunity before footer

10. **Footer**
    - Links to important pages (Privacy, Terms, Blog, Docs)
    - Contact information
    - Social media links
    - Copyright notice
    - Helps with SEO and provides navigation alternative

### Conversion Optimization Principles

- **Progressive Disclosure**: Start general (hero), get specific (benefits, pricing)
- **Multiple CTAs**: Place conversion buttons at strategic points throughout page
- **Visual Hierarchy**: Use size, color, whitespace to guide attention
- **Trust Signals**: Logos, testimonials, security badges build credibility
- **Specificity**: Concrete benefits outperform vague claims
- **Friction Reduction**: Simple forms, clear next steps, no confusion
- **Mobile Responsiveness**: Optimize for mobile (majority of traffic)
- **Page Speed**: Fast loading times improve conversions and SEO

### Implementation Notes for Taxentia
- Apply this structure when designing tax consultation landing page
- Replace generic SaaS benefits with tax-specific advantages (accuracy, compliance, authority coverage)
- Use case studies with accountants/tax professionals as testimonials
- Highlight unique RAG capabilities and authority-backed analysis
- Consider regulatory/compliance messaging in CTAs