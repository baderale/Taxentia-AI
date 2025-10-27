# User Authentication Options for Taxentia-AI

## 📋 Overview

You currently have **mock authentication** (`userId: "mock-user-id"`). Here are your options to implement real authentication with different storage backends.

---

## 🎯 Current State

```typescript
// Current code (server/routes.ts:19)
const userId = "mock-user-id";  // ❌ Everyone is the same user!

// What we need:
const userId = req.user.id;  // ✅ Get from authenticated session
```

---

## 🔑 Option 1: PostgreSQL + Passport.js (Local Auth)

### **What It Is**
- Users stored in your PostgreSQL database
- Usernames/passwords hashed with bcrypt
- Sessions managed in PostgreSQL (persistent across restarts)
- **Fully self-hosted** (no external dependencies)

### **Advantages**
✅ Complete control over data
✅ No third-party APIs
✅ Zero additional costs
✅ Simple for dev/testing
✅ Great for internal tools

### **Disadvantages**
❌ You manage password resets
❌ You manage password security
❌ No social login
❌ More code to maintain

### **Implementation**

**Database Schema:**
```sql
-- Add to PostgreSQL
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR,
  tier VARCHAR DEFAULT 'free', -- free, pro, enterprise
  subscription_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
  sid VARCHAR NOT NULL UNIQUE,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX ON user_sessions (expire);
```

**Package.json** (Already has these):
```json
{
  "passport": "^0.7.0",
  "passport-local": "^1.0.0",
  "express-session": "^1.18.1",
  "connect-pg-simple": "^10.0.0",
  "bcryptjs": "^2.4.3"  // Need to add for password hashing
}
```

**Implementation File** (`server/auth.ts`):
```typescript
import passport from 'passport';
import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { pool } from './db';

// Configure local strategy
passport.use(new LocalStrategy.Strategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return done(null, false, { message: 'User not found' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return done(null, false, { message: 'Invalid password' });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Configure session store
const PgSession = pgSession(session);
export const sessionMiddleware = session({
  store: new PgSession({
    pool: pool,
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  }
});
```

**Routes** (`server/routes.ts`):
```typescript
app.post("/auth/register", async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await storage.createUser({
      email,
      passwordHash,
      fullName
    });

    // Automatic login after signup
    req.login(user, (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true, user });
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/auth/login",
  passport.authenticate('local'),
  (req, res) => {
    res.json({ success: true, user: req.user });
  }
);

app.post("/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ success: true });
  });
});

// Protected route
app.get("/api/queries", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  // Now safe to use req.user.id
  const userId = req.user.id;
  // ...
});
```

---

## ☁️ Option 2: Supabase (Cloud Auth)

### **What It Is**
- Authentication-as-a-service from Supabase
- PostgreSQL backend (so you still own your data)
- Built-in JWT tokens
- Pre-built UI components available
- Social login support (Google, GitHub, etc)

### **Advantages**
✅ No password management code
✅ Built-in social login
✅ Email verification built-in
✅ Rate limiting built-in
✅ Phone/SMS options
✅ Free tier available
✅ PostgreSQL still your data

### **Disadvantages**
❌ Vendor lock-in
❌ API costs at scale
❌ Slightly more complex setup
❌ Need Supabase account

### **Costs**
- Free: 10 MAU (monthly active users)
- $25/month: Unlimited users

### **Implementation**

**Package.json** (add):
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "@supabase/auth-helpers-express": "^0.4.0"
}
```

**Setup** (`server/supabase.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!  // Server key with admin powers
);
```

**Environment Variables**:
```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...  # Keep secret!
```

**Backend Integration** (`server/routes.ts`):
```typescript
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(400).json({ message: error.message });

  // Store JWT token
  res.json({
    success: true,
    token: data.session?.access_token,
    user: data.user
  });
});

// Middleware to check token
const verifyToken = async (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = data.user;
  next();
};

// Protected route
app.get("/api/queries", verifyToken, async (req, res) => {
  const userId = req.user.id;
  // ...
});
```

**Frontend** (React):
```typescript
// client/src/lib/auth.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data.session?.access_token;
}

export async function signup(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;
  return data;
}
```

---

## 🔐 Option 3: Auth0 (Enterprise Auth)

### **What It Is**
- Industry-standard authentication platform
- Handles everything (SSO, MFA, social login, etc)
- Used by enterprise companies
- Separate from your database

### **Advantages**
✅ Most robust & secure
✅ Built-in MFA, SSO
✅ Enterprise features
✅ GDPR/SOC2 compliant
✅ Professional support
✅ Very battle-tested

### **Disadvantages**
❌ More expensive ($20-40+/month)
❌ More complex setup
❌ Separate from PostgreSQL
❌ User data split across systems

### **Costs**
- Free: 7,500 active users
- $20-40/month: More features
- Enterprise: Custom pricing

**Not recommended for this project yet** - overkill unless you have enterprise requirements.

---

## 🎨 Option 4: Hybrid (PostgreSQL + JWT Tokens)

### **What It Is**
- Store users in PostgreSQL
- Use JWT tokens instead of sessions
- Great for mobile apps + web
- Can be stateless

### **Advantages**
✅ Full control
✅ Works with mobile
✅ Stateless (scales better)
✅ No session storage needed

### **Disadvantages**
❌ Manual logout is harder (token revocation)
❌ More complex token management
❌ Still need password hashing code

### **Implementation Outline**
```typescript
import jwt from 'jsonwebtoken';

// After successful login
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

res.json({ token });

// Middleware
const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
```

---

## 📊 Comparison Table

| Feature | PostgreSQL+Passport | Supabase | Auth0 | PostgreSQL+JWT |
|---------|------------------|----------|-------|----------------|
| **Setup Difficulty** | Medium | Easy | Hard | Medium |
| **Cost** | ~$15/mo (DB) | Free-$25/mo | $20-40+/mo | ~$15/mo (DB) |
| **Data Ownership** | ✅ Full | ✅ Full | ❌ Partial | ✅ Full |
| **Social Login** | ❌ Manual | ✅ Built-in | ✅ Built-in | ❌ Manual |
| **Password Reset** | ❌ Manual | ✅ Built-in | ✅ Built-in | ❌ Manual |
| **MFA** | ❌ Manual | ✅ Built-in | ✅ Built-in | ❌ Manual |
| **Session Management** | ✅ Built-in | ⚠️ Token | ✅ Managed | ⚠️ Stateless |
| **Mobile Ready** | ⚠️ Limited | ✅ Yes | ✅ Yes | ✅ Yes |
| **Enterprise Ready** | ⚠️ Depends | ✅ Yes | ✅ Yes | ⚠️ Depends |
| **Vendor Lock-in** | ❌ None | ⚠️ Some | ✅ High | ❌ None |

---

## 🏆 Recommendation for Taxentia-AI

**For development & testing:**
→ **PostgreSQL + Passport.js (Option 1)**
- Full control
- Already have dependencies
- Great learning experience
- Can migrate later

**For production with users:**
→ **Supabase (Option 2)**
- Balance of control + ease
- PostgreSQL still yours
- Social login ready
- Professional features
- Scale-friendly

**For enterprise customers:**
→ **Auth0 (Option 3)**
- Industry standard
- Maximum trust
- Full compliance

---

## 🚀 Quick Start: PostgreSQL + Passport

### **Step 1: Add bcrypt**
```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

### **Step 2: Create Database Schema**
```sql
-- Run in PostgreSQL
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR,
  tier VARCHAR DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
  sid VARCHAR NOT NULL UNIQUE,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX ON user_sessions (expire);
```

### **Step 3: Update Environment**
```bash
# Add to .env
SESSION_SECRET=your-random-secret-here-at-least-32-chars
```

### **Step 4: Update server/index.ts**
```typescript
import { sessionMiddleware } from './auth';

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sessionMiddleware);  // ← Add this
app.use(passport.initialize());  // ← Add this
app.use(passport.session());  // ← Add this
```

### **Step 5: Add Auth Routes** (server/routes.ts)
```typescript
import bcrypt from 'bcryptjs';
import passport from 'passport';

app.post("/auth/register", async (req, res) => {
  // See full implementation above
});

app.post("/auth/login",
  passport.authenticate('local'),
  (req, res) => {
    res.json({ success: true, user: req.user });
  }
);
```

### **Step 6: Protect Routes**
```typescript
// Change this:
const userId = "mock-user-id";

// To this:
if (!req.user) {
  return res.status(401).json({ message: "Not authenticated" });
}
const userId = req.user.id;
```

---

## 🔐 Where User Data Lives

### **Option 1: PostgreSQL + Passport**
```
Your PostgreSQL Database
├─ users table (email, password_hash, name, tier)
├─ user_sessions table (session tokens)
└─ tax_queries table (queries linked to user_id)

Session Storage: PostgreSQL (connect-pg-simple)
```

### **Option 2: Supabase**
```
Supabase Cloud
├─ auth.users table (managed by Supabase)
├─ Custom tables (your data)
└─ tax_queries table (linked to auth user ID)

Your PostgreSQL Database (in Supabase)
├─ Connected via Supabase API
└─ Still your data!
```

### **Option 3: Auth0**
```
Auth0 Cloud
├─ user profiles (managed by Auth0)
└─ Sessions/tokens

Your PostgreSQL Database
├─ tax_queries table (linked to Auth0 user ID)
└─ User metadata references
```

---

## 📈 Database Schema for Multi-User Support

```sql
-- Enhanced schema with user separation

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  full_name VARCHAR,
  tier VARCHAR DEFAULT 'free',  -- free, pro, enterprise
  subscription_active BOOLEAN DEFAULT true,
  api_quota_monthly INT DEFAULT 100,  -- API calls per month
  api_quota_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Change tax_queries to link to users
CREATE TABLE tax_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response JSONB NOT NULL,
  confidence INTEGER,
  confidenceColor VARCHAR,
  cost_cents INT,  -- Track cost per query
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_queries (user_id, created_at)
);

-- Track API usage
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_id UUID REFERENCES tax_queries(id),
  cost_cents INT,
  tokens_used INT,
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_user_usage (user_id, created_at)
);

-- For rate limiting
CREATE TABLE user_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  query_count_this_hour INT DEFAULT 0,
  query_count_this_day INT DEFAULT 0,
  last_reset_hour TIMESTAMP,
  last_reset_day TIMESTAMP
);
```

---

## 🎯 Next Steps

### **Immediate (This Week)**
1. Choose authentication method (PostgreSQL+Passport recommended)
2. Create database schema
3. Implement auth routes
4. Add middleware to protect routes
5. Update frontend login/signup

### **Soon (Next Week)**
1. Add password reset via email
2. Add email verification
3. Add user profile management
4. Implement rate limiting
5. Add API key generation (for programmatic access)

### **Later (Future)**
1. Social login (Google, GitHub)
2. MFA/2FA
3. SSO for enterprises
4. Audit logging
5. Advanced rate limiting

---

## 📚 Resources

**PostgreSQL + Passport.js:**
- Passport.js docs: http://www.passportjs.org/
- bcryptjs: https://github.com/dcodeIO/bcrypt.js
- express-session: https://github.com/expressjs/session

**Supabase:**
- Supabase Auth: https://supabase.com/docs/guides/auth
- Pricing: https://supabase.com/pricing

**Auth0:**
- Auth0 docs: https://auth0.com/docs
- Pricing: https://auth0.com/pricing

---

**Recommended for Taxentia:** PostgreSQL + Passport.js for now
**Migration path:** → Supabase when scaling to production

