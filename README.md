# Taxentia-AI

**Tagline:** The AI-native business tax solution

## Overview

Taxentia is a conversational AI tax assistant that provides accurate, cited answers to complex business tax questions. It is designed to help users with their tax-related queries in a conversational manner, providing answers that are not only accurate but also backed by citations.

## Features

- **Conversational Interface:** A user-friendly, chat-based interface for asking tax-related questions.
- **Complex Question Handling:** Capable of understanding and answering complex business tax questions.
- **Cited Answers:** Provides citations for the answers, ensuring the information is verifiable.
- **Document Analysis:** Users can upload documents for analysis.
- **Integration:** Can be integrated with existing workflows.

## Technology Stack

### Frontend

- **Framework:** React
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI, shadcn/ui
- **Data Fetching:** TanStack Query
- **Routing:** React Router

### Backend

- **Framework:** Express / Hono
- **Language:** TypeScript
- **API:** RESTful API
- **AI:** OpenAI
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM

### Development

- **Build Tool:** Vite
- **Dev Server:** tsx

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/taxentia-ai.git
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```
3.  Set up your environment variables by creating a `.env` file in the root directory. You will need to add your OpenAI API key and database connection string.
    ```
    OPENAI_API_KEY=your_openai_api_key
    DATABASE_URL=your_database_connection_string
    ```

### Running the application

-   **Development:**
    ```bash
    npm run dev
    ```
-   **Production:**
    ```bash
    npm run build
    npm run start
    ```
