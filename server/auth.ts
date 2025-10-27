import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Get database pool for session store
const sessionPool = require('pg').Pool;

/**
 * Configure Passport.js local strategy
 * Uses email/password authentication with bcrypt hashing
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        // Find user by email
        const result = await db.select().from(users).where(eq(users.email, email));
        const user = result[0];

        if (!user) {
          return done(null, false, { message: 'User not found' });
        }

        // Compare password with hash
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid password' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

/**
 * Serialize user to session
 * Stores only the user ID in the session
 */
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

/**
 * Deserialize user from session
 * Retrieves full user object from database
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await db.select().from(users).where(eq(users.id, id));
    const user = result[0];
    done(null, user || null);
  } catch (err) {
    done(err);
  }
});

/**
 * Configure session middleware
 * Uses PostgreSQL for persistent session storage
 */
export const sessionMiddleware = session({
  store: new (pgSession(session))({
    pool: process.env.DATABASE_URL
      ? new sessionPool({ connectionString: process.env.DATABASE_URL })
      : undefined,
    tableName: 'user_sessions',
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

/**
 * Helper to hash passwords
 * Called during user registration
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Helper to verify passwords
 * Called during login
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Middleware to check if user is authenticated
 * Returns 401 if not authenticated
 */
export function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}

export default passport;
