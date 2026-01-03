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

## Specialized Review Agents

This project includes three specialized AI agents that automatically review code changes for quality, compliance, and best practices. These agents use the Claude Agent SDK and run via hooks or manual commands.

### Available Agents

#### 1. IRS/Tax Consultant Agent (`irs-tax-consultant`)
Expert tax compliance specialist that reviews code for regulatory accuracy and tax law compliance.

**Responsibilities:**
- Verify tax calculation accuracy against IRC/CFR provisions
- Validate authority references (IRC sections, CFR citations, IRS rulings)
- Identify compliance risks and legal issues
- Check confidence scoring logic
- Ensure proper disclaimers and scope assumptions

**When it triggers:**
- Changes to `server/services/` files (especially tax calculation logic)
- Modifications to `shared/taxResponseSchema.ts`
- Updates to authority retrieval or ranking logic

**Manual usage:**
```bash
npx tsx agents/run-agent.ts tax server/services/hybrid-llm-service.ts
npx tsx agents/run-agent.ts tax .  # Review all recent changes
```

#### 2. UI/UX Reviewer Agent (`ui-ux-reviewer`)
Professional UI/UX designer that analyzes pages for design quality, usability, and accessibility.

**Responsibilities:**
- Test visual design consistency and brand alignment
- Verify WCAG 2.1 AA accessibility compliance
- Check responsive design across breakpoints (mobile, tablet, desktop)
- Test keyboard navigation and screen reader support
- Analyze color contrast ratios (4.5:1 for text, 3:1 for UI components)
- Use Playwright for real browser testing

**When it triggers:**
- Changes to `client/` React components (.tsx, .jsx files)
- Updates to landing pages or user-facing interfaces

**Manual usage:**
```bash
npx tsx agents/run-agent.ts ui http://localhost:5173
npx tsx agents/run-agent.ts ui http://localhost:5173/query
```

#### 3. Backend Developer Expert Agent (`backend-developer`)
Senior backend engineer that reviews server code for functionality, performance, and security.

**Responsibilities:**
- Review code correctness and functionality
- Identify performance bottlenecks (N+1 queries, blocking operations)
- Verify database queries and ORM usage (Drizzle)
- Check security (SQL injection, XSS, authentication, secret exposure)
- Validate API design and error handling
- Review async/await patterns and error handling
- Test integration with external services (OpenAI, Qdrant)

**When it triggers:**
- Changes to `server/` files (.ts, .js)
- Updates to routes, services, or storage layers
- Database schema modifications

**Manual usage:**
```bash
npx tsx agents/run-agent.ts backend server/services/hybrid-llm-service.ts
npx tsx agents/run-agent.ts backend server/routes.ts
```

### Running All Agents

To run all three agents in sequence for comprehensive review:

```bash
npx tsx agents/run-agent.ts all
```

This will:
1. Run tax compliance review on recent backend changes
2. Run UI/UX review on http://localhost:5173
3. Run backend code review on all server files

### Automatic Agent Triggering (Hooks)

Agents are configured to run automatically via hooks when you edit files. The hook configuration in `.claude/settings.json` monitors `Edit` and `Write` operations and suggests running the appropriate agent based on file patterns:

**Hook behavior:**
- Informational notifications (doesn't block your workflow)
- Recommends which agent to run based on the file changed
- Provides the exact command to run the review

**Example hook output:**
```
[Hook] Tax compliance review recommended for: server/services/hybrid-llm-service.ts
[Hook] Run: npx tsx agents/run-agent.ts tax "server/services/hybrid-llm-service.ts"
```

### Agent Configuration

Agent definitions are stored in `.claude/agents/`:
- `irs-tax-consultant.json` - Tax compliance agent configuration
- `ui-ux-reviewer.json` - UI/UX review agent configuration
- `backend-developer.json` - Backend code review agent configuration

Each agent:
- Uses Claude Opus 4.5 for highest quality reviews
- Has specialized system prompts for domain expertise
- Includes specific review checklists and criteria
- Can read, edit, and run commands in the codebase
- Integrates with MCP servers (Playwright for UI testing)

### Agent Output Format

All agents provide structured findings:

1. **Critical Issues** - Security vulnerabilities, compliance violations, accessibility blockers
2. **High Priority** - Functionality bugs, performance problems
3. **Medium Priority** - Code quality, maintainability
4. **Low Priority** - Minor optimizations, style improvements

Each finding includes:
- Category (Security, Performance, Accessibility, Compliance, etc.)
- Severity level
- File path and line numbers (when applicable)
- Specific description with examples
- Recommended fix with code snippets
- Testing strategy to verify the fix

### Best Practices

1. **Run agents before committing**: Use `npx tsx agents/run-agent.ts all` to catch issues early
2. **Review agent findings carefully**: Agents provide expert recommendations but you make final decisions
3. **Focus on Critical/High issues first**: Prioritize security and compliance
4. **Use agents iteratively**: Run after making fixes to verify improvements
5. **Customize agent prompts**: Edit `.claude/agents/*.json` to adjust review criteria for your needs

### Integration with Development Workflow

```bash
# Standard development workflow with agents:

# 1. Make code changes
vim server/services/hybrid-llm-service.ts

# 2. Run relevant agent review
npx tsx agents/run-agent.ts tax server/services/hybrid-llm-service.ts

# 3. Fix any issues found
# ... make corrections ...

# 4. Run tests
npm test

# 5. Run full agent suite before committing
npx tsx agents/run-agent.ts all

# 6. Commit changes
git add .
git commit -m "feat: improve tax calculation logic with IRC §162 compliance"
```

### Extending the Agent System

To create additional specialized agents:

1. Create agent definition in `.claude/agents/your-agent.json`
2. Define system prompt with expertise and review criteria
3. Add agent runner function in `agents/run-agent.ts`
4. Update hook configuration in `.claude/hooks/auto-agent-trigger.bat` (optional)
5. Document the new agent in this section

See the Claude Agent SDK documentation for advanced customization options.

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