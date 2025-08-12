# Taxentia.ai - AI Tax Research Platform

## Overview

Taxentia.ai is a professional AI-powered tax research platform designed for CPAs, Enrolled Agents, and tax attorneys. The application provides structured tax analysis with precise citations from U.S. federal tax authorities, including the Internal Revenue Code, Treasury Regulations, IRS Publications, Revenue Rulings, and court cases. The system generates comprehensive responses with confidence scoring and maintains a searchable query history for users.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript in strict mode
- **Routing**: Wouter for client-side routing
- **UI Framework**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state and caching
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with structured JSON responses
- **Error Handling**: Centralized error middleware with proper HTTP status codes
- **Development**: Hot module replacement via Vite integration

### Data Storage Solutions
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema changes
- **Validation**: Zod schemas for runtime type validation and API contract enforcement
- **Storage Pattern**: Repository pattern with in-memory fallback for development

### Core Data Models
- **Users**: Authentication and subscription management (free/pro/firm tiers)
- **Tax Queries**: User questions with AI-generated structured responses
- **Authorities**: Legal citations and tax authority documents with retrieval metadata
- **Sessions**: PostgreSQL session storage via connect-pg-simple

### AI Integration Architecture
- **Provider**: OpenAI GPT-4o for natural language processing
- **Response Structure**: Structured JSON output with conclusion, analysis steps, authority citations, and confidence scoring
- **Retrieval System**: Mock keyword-based authority retrieval (placeholder for vector search)
- **Prompt Engineering**: Specialized system prompts for tax professional context

### Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL storage
- **User Roles**: Subscription-based access control (free, pro, firm)
- **API Security**: Request validation and error boundary protection

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o model for tax analysis generation
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development environment with custom Vite plugins

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Google Fonts**: Custom typography (Inter, DM Sans, Fira Code, Geist Mono)

### Development Tools
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundling for production
- **PostCSS**: CSS processing with Autoprefixer
- **TSX**: TypeScript execution for development server

### Data Management
- **TanStack Query**: Server state synchronization and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime schema validation
- **Date-fns**: Date manipulation utilities

The architecture follows a modern full-stack pattern with clear separation between client and server concerns, type safety throughout the stack, and professional-grade error handling and validation.