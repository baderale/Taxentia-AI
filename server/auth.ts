import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { storage } from './storage';

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
        // Find user by email using in-memory storage
        const user = await storage.getUserByEmail?.(email);

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
 * Retrieves full user object from in-memory storage
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user || null);
  } catch (err) {
    done(err);
  }
});

/**
 * Configure session middleware
 * Uses memory store for development/testing session storage
 * TODO: Switch to PostgreSQL for production deployment
 */
const MemoryStore = createMemoryStore(session);

export const sessionMiddleware = session({
  store: new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // Prevent CSRF while allowing same-site requests
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
