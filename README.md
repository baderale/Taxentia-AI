# Taxentia

**AI research assistant for U.S. federal tax questions, with answers you can trace to the source.**

Live at **https://www.taxentia.ai**

Taxentia answers federal tax questions in plain English. It searches the Internal Revenue Code, Treasury Regulations and Internal Revenue Bulletins, then writes a structured answer that cites the passages it found. It is built for CPAs, tax attorneys and Enrolled Agents.

> Taxentia is a research tool. It doesn't give tax or legal advice, and its answers can be wrong. Always read the cited authority before relying on an answer.

---

## Status (November 5, 2026)

| Area | Status |
|---|---|
| Website | Live at https://www.taxentia.ai. `taxentia.ai` forwards to it |
| Tax library | Internal Revenue Code, Treasury Regulations and IRS Bulletins loaded (29,121 chunks) |
| Answers | A real question answered on the live site on November 5, 2026 |
| Accounts | Stored in PostgreSQL. Self sign-up and an admin page for creating users |
| Weekly updates | IRS bulletin job scheduled for Mondays at 08:00 UTC. First run not confirmed yet |
| Interface | Redesigned for desktop and phones |

Open items are tracked in [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md).

---

## What an answer looks like

Every answer follows the same structure:

1. **Conclusion**: the short answer first.
2. **Authority**: each cited source, with its type, version and a link to read it.
3. **Analysis**: step-by-step reasoning, with each step pointing to its authority.
4. **Scope and confidence**: stated assumptions and a 0-100 score. High is 85-100, medium is 60-84 and low is 0-59. The score is the model's own assessment, not a guarantee.

Answers can also include procedural guidance (forms, deadlines, elections) and further reading. Questions and answers are saved to the user's account.

---

## How it works

```
Question
  → embedding (text-embedding-3-small, 1536 dimensions)
  → Qdrant search, top 5 passages, cosine similarity
  → each passage labeled with its citation, for example [SOURCE: 26 U.S.C. § 280A, ...]
  → gpt-4o-mini writes a JSON answer and is told to cite only the labeled sources
  → answer validated against a Zod schema and saved to PostgreSQL
```

Model calls go through **OpenRouter**, using `openai/gpt-4o-mini` for answers and `openai/text-embedding-3-small` for embeddings. Estimated cost is about $0.0015 per answer.

---

## Tax library

| Source | Fetcher | Content | Loaded |
|---|---|---|---|
| Internal Revenue Code (26 U.S.C.) | `scripts/fetchers/usc-fetcher.ts` | Official Title 26 file from uscode.house.gov. The current release is found automatically, currently Public Law 119-136 | 1,900 current sections → 7,309 chunks, about $0.06 |
| Treasury Regulations (26 C.F.R.) | `scripts/fetchers/cfr-fetcher.ts` | Title 26 regulations | 6,015 regulations → 20,016 chunks, about $0.16 |
| Internal Revenue Bulletins | `scripts/fetchers/irb-fetcher.ts` | Revenue rulings, revenue procedures, notices and Treasury decisions | 26 documents → 1,851 chunks, about $0.02 |

- The Code fetcher skips repealed, renumbered, omitted and reserved sections, plus editorial notes and source credits. It includes sections with letters, such as §199A, §280A and §1400Z-2.
- Text is split into chunks of up to 2,000 characters, and each Code chunk starts with its section number and title.
- The library doesn't include state tax law, IRS publications or court decisions.

---

## Accounts and users

| Task | Where |
|---|---|
| Sign up | https://www.taxentia.ai/auth?mode=signup ("Get started" on the home page) |
| Sign in | https://www.taxentia.ai/auth |
| Create a user, reset a password, see question counts | https://www.taxentia.ai/admin, using the admin key (`ADMIN_SECRET`) |
| View the tables | Railway → `Postgres` service → Data tab |

- After creating a user on `/admin`, click **Copy login details** to send them, and **Go to sign in** to open the sign-in screen. If you're already signed in, the button opens the app instead, so sign out from the account menu to try a new login.
- Generated passwords are shown once. Only bcrypt hashes are stored.
- Sessions are stored in PostgreSQL and last 24 hours.
- Each user can only open their own saved questions.

| Table | Contents |
|---|---|
| `users` | Email, username, name and password hash |
| `tax_queries` | Questions and full structured answers |
| `user_sessions` | Login sessions |
| `authorities`, `irc_sync_status` | Older tables, not used by the current tax library |

---

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), wouter, TanStack Query
- **Backend:** Express, TypeScript, Passport (email and password), express-session with `connect-pg-simple`
- **Data:** PostgreSQL with Drizzle ORM, Qdrant vector database
- **AI:** OpenAI SDK pointed at OpenRouter, `gpt-4o-mini` and `text-embedding-3-small`
- **Hosting:** Railway (app, Qdrant, Postgres and a cron service), GoDaddy DNS

---

## Run it locally

**Requirements:** Node.js 20 or newer, npm 10 or newer, Docker

```bash
git clone https://github.com/baderale/Taxentia-AI.git
cd Taxentia-AI
npm install
cp .env.example .env      # then fill in your own values
docker-compose up -d      # Qdrant and PostgreSQL
npm run db:push           # create the tables
npm run ingest:test       # small sample, or ingest:all for everything
npm run dev               # http://localhost:5000
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `OPENAI_API_KEY` | Yes | OpenAI or OpenRouter key |
| `SESSION_SECRET` | Yes in production | Signs session cookies |
| `ADMIN_SECRET` | Yes for admin features | Admin page, admin routes and ingestion. Admin routes reject every request when it is unset |
| `QDRANT_URL` | Yes | Default `http://localhost:6333` |
| `QDRANT_COLLECTION_NAME` | No | Default `taxentia-authorities` |
| `OPENAI_BASE_URL` | No | Set to `https://openrouter.ai/api/v1` to use OpenRouter |
| `OPENAI_MODEL_NAME` | No | Default `gpt-4o-mini`. Production uses `openai/gpt-4o-mini` |
| `OPENAI_EMBEDDING_MODEL` | No | Default `text-embedding-3-small`. Production uses `openai/text-embedding-3-small` |
| `EMBEDDING_PROVIDER_IGNORE` | No | Comma-separated OpenRouter providers to skip for embeddings |

Never commit `.env` or real keys. `.env` is in `.gitignore`, and `.env.example` holds placeholders only.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` / `npm run start` | Production build and server |
| `npm run db:push` | Apply the Drizzle schema to the database |
| `npm run ingest:usc` | Load the Internal Revenue Code, about 14 minutes |
| `npm run ingest:cfr` | Load the Treasury Regulations, about 40 minutes |
| `npm run ingest:irb -- 5` | Load the latest IRS bulletins (5 here) |
| `npm run ingest:all` / `ingest:test` | Load everything, or a small sample |
| `npm run inspect:qdrant` | Show what's in the vector database |
| `npm run test:e2e` | Playwright tests in `tests/`, which need a running server. Sign-in tests are in `e2e/` |

---

## API

| Method and path | Access | Purpose |
|---|---|---|
| `POST /auth/register` | Public | Create an account and sign in |
| `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | Public, then signed in | Session handling |
| `POST /api/taxentia/query` | Signed in | Ask a question. Body `{ "query": "..." }` |
| `GET /api/queries`, `GET /api/queries/:id` | Signed in | The user's own saved questions |
| `GET /api/admin/users` | `x-admin-secret` header | List users with question counts |
| `POST /api/admin/users` | `x-admin-secret` header | Create a user. Body `{ "email", "fullName"?, "password"? }` |
| `POST /api/admin/users/:id/reset-password` | `x-admin-secret` header | Generate a new password |
| `POST /api/taxentia/admin/ingest` | `secret` in the body | Start a data load on the server |
| `GET /api/health` | Public | Health check |

Admin routes lock out an address for 15 minutes after 10 wrong keys, and their responses are never logged.

---

## Project structure

```
client/src/
  pages/            landing, auth, home, admin, not-found
  components/       chat, answer display, history, activity, auth forms, brand
  lib/              API client, auth context, research helpers
server/
  routes.ts         API routes, including admin user management
  auth.ts           Passport and session setup
  storage.ts        Storage interface; the app uses PostgresStorage
  postgres-storage.ts
  services/         hybrid-llm-service (answers), qdrant-service, openai-service
scripts/
  fetchers/         usc, cfr and irb fetchers
  utils/            chunker, embeddings
  ingest-authorities.ts
shared/             Drizzle schema and Zod answer schema
e2e/, tests/        Playwright tests
```

Design rules for the interface are in [CLAUDE.md](CLAUDE.md#interface-design).

---

## Deployment

Production runs on Railway with four services: `taxentia` (app), `qdrant`, `Postgres` and `taxentia-cron-irb`. Railway isn't connected to GitHub, so pushing doesn't deploy. Deploy with:

```bash
railway up --service taxentia
```

A redeploy stops any data load running in the app container. Setup details, costs, known issues and lessons learned are in **[RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)**.

---

## Known issues and next steps

- Qdrant point IDs are 32-bit hashes, so a few chunks overwrite each other (about 31 of 7,309 Code chunks). UUID-based IDs would fix this, but need a full reload.
- No password reset by email and no email verification yet. An admin can reset passwords at `/admin`.
- No rate limit on sign-up, sign-in or questions. Set a spending limit on the OpenRouter key.
- No Privacy or Terms pages yet.
- Ideas for later: IRS publications and court decisions, PDF export, and filtering by authority type.

---

## Documentation

- [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md): current deployment, settings and open items
- [Changelog.md](Changelog.md): history of changes
- [CLAUDE.md](CLAUDE.md): project guide for contributors and AI assistants
- [docs/](docs/): earlier design notes. Some describe older setups, such as in-memory storage and Pinecone

---

## License and disclaimer

No license file has been added yet, so all rights are reserved by default.

Taxentia provides informational research for tax professionals. It isn't tax or legal advice. Verify every answer against primary sources before relying on it.
