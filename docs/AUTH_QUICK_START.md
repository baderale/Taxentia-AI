# 🔐 Authentication Quick Start

## TL;DR - Get Running in 5 Minutes

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb taxentia

# Create tables
psql taxentia << 'EOF'
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  subscription_active BOOLEAN DEFAULT true,
  api_quota_monthly INT DEFAULT 100,
  api_quota_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_sessions (
  sid VARCHAR NOT NULL UNIQUE,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX ON user_sessions (expire);
EOF
```

### 2. Environment Variables
```bash
# Add to .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/taxentia"
SESSION_SECRET="change-this-to-random-string-min-32-chars"
```

### 3. Start the App
```bash
npm run dev
```

### 4. Test It
- Open http://localhost:5173
- Click "Sign up"
- Fill in form and submit
- You're logged in! 🎉

---

## API Endpoints

### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "username": "johndoe",
  "fullName": "John Doe"  # optional
}

Response:
{
  "success": true,
  "user": {
    "id": "uuid-123",
    "email": "user@example.com",
    "username": "johndoe",
    "fullName": "John Doe"
  }
}
```

### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response:
{
  "success": true,
  "user": { ... }
}
```

### Get Current User
```bash
GET /auth/me
# (requires authenticated session)

Response:
{
  "id": "uuid-123",
  "email": "user@example.com",
  "username": "johndoe",
  "fullName": "John Doe",
  "tier": "free",
  "createdAt": "2025-10-27T..."
}
```

### Logout
```bash
POST /auth/logout
# (requires authenticated session)

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Frontend Usage

### Get Current User (React)
```typescript
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Hello {user?.fullName || user?.username}!</h1>
      <button onClick={() => logout()}>Sign Out</button>
    </div>
  );
}
```

### Protected Routes (React)
```typescript
function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;  // Login/signup page
  }

  return <MainApp />;  // Protected app
}
```

---

## Key Features

✅ **Secure Password Hashing**
- Uses bcryptjs with 10 rounds
- Passwords never stored in plaintext

✅ **Session Management**
- Stored in PostgreSQL (not memory)
- Persistent across restarts
- Automatic 24-hour expiration

✅ **Protected Queries**
- All tax queries linked to user ID
- Query history per user
- API quota tracking

✅ **Error Handling**
- Duplicate email prevention
- Password validation
- Meaningful error messages

---

## Security Checklist

- [ ] DATABASE_URL is set correctly
- [ ] SESSION_SECRET is random (32+ chars)
- [ ] user_sessions table exists
- [ ] bcryptjs is installed (`npm install bcryptjs`)
- [ ] Auth middleware is in correct order in server/index.ts
- [ ] All tax routes have `requireAuth` middleware

---

## Testing

### Manual Test
1. Go to http://localhost:5173
2. Sign up with new email
3. Ask a tax question
4. Query should be saved under your user ID
5. Click user menu → Sign Out
6. Login again
7. Your previous queries should appear in history

### Command Line Test
```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "username": "testuser"
  }' -c cookies.txt

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }' -c cookies.txt

# Query (with session)
curl -X POST http://localhost:5000/api/taxentia/query \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"query": "What is IRC section 179?"}'
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "connection refused" | `sudo service postgresql start` |
| "column email doesn't exist" | Run table creation SQL above |
| "TypeError: req.user is undefined" | Ensure `requireAuth` middleware is used |
| "Email already in use" | Use different email or delete from DB |
| "Invalid password" (on login) | Password is case-sensitive, min 8 chars |

---

## Next Steps

- [ ] Read `docs/AUTHENTICATION_IMPLEMENTED.md` for full details
- [ ] Read `docs/AUTHENTICATION_OPTIONS.md` for other auth methods
- [ ] Add password reset functionality
- [ ] Add email verification
- [ ] Deploy to production

---

**Current Status:** ✅ Ready to use

All authentication is fully implemented and working!
