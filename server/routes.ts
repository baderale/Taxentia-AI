import type { Express } from "express";
import { createServer, type Server } from "http";
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { storage } from "./storage";
import { z } from "zod";
import { taxResponseSchema, insertTaxQuerySchema, type Authority, users } from "@shared/schema";
import { hybridLLMService } from "./services/hybrid-llm-service";
import { openaiService } from "./services/openai-service";
import { qdrantService } from "./services/qdrant-service";
import passport from "passport";
import { hashPassword, requireAuth } from "./auth";

const ADMIN_MAX_FAILURES = 10;
const ADMIN_LOCKOUT_MS = 15 * 60 * 1000;
const adminFailures = new Map<string, { count: number; resetAt: number }>();

function secretMatches(given: unknown, expected: string): boolean {
  if (typeof given !== "string") return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function requireAdminSecret(req: any, res: any, next: any) {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const failures = adminFailures.get(ip);
  if (failures && failures.resetAt > now && failures.count >= ADMIN_MAX_FAILURES) {
    return res.status(429).json({ message: "Too many attempts. Try again in 15 minutes." });
  }

  const expected = process.env.ADMIN_SECRET;
  if (!expected || !secretMatches(req.get("x-admin-secret"), expected)) {
    const active = failures && failures.resetAt > now;
    adminFailures.set(ip, {
      count: active ? failures.count + 1 : 1,
      resetAt: active ? failures.resetAt : now + ADMIN_LOCKOUT_MS,
    });
    return res.status(401).json({ message: "Unauthorized" });
  }

  adminFailures.delete(ip);
  next();
}

function generatePassword(): string {
  return randomBytes(12).toString("base64url");
}

/** Builds a valid, unused username from an email address. */
async function generateUsername(email: string): Promise<string> {
  const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 40).toLowerCase() || "user";
  const start = base.length >= 3 ? base : `user_${base}`;
  let candidate = start;
  while (await storage.getUserByUsername(candidate)) {
    candidate = `${start}_${randomBytes(2).toString("hex")}`;
  }
  return candidate;
}
import { db } from "./db";
import { eq } from "drizzle-orm";
// import { mockRetrievalService } from "./services/mock-retrieval";

export async function registerRoutes(app: Express): Promise<Server> {
  // ============================================
  // AUTHENTICATION ROUTES
  // ============================================

  /**
   * Register a new user
   * POST /auth/register
   */
  app.post("/auth/register", async (req, res) => {
    try {
      const { email, password, username, fullName } = z.object({
        email: z.string().trim().toLowerCase().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        username: z.string().min(3, "Username must be at least 3 characters").max(50),
        fullName: z.string().optional(),
      }).parse(req.body);

      // Check if user already exists
      const existingEmail = await storage.getUserByEmail?.(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      const newUser = await storage.createUser({
        email,
        username,
        passwordHash,
        fullName: fullName || undefined,
      });

      // Automatically log in after signup
      req.login(newUser, (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({
          success: true,
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            fullName: newUser.fullName,
          },
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({
        message: error instanceof Error ? error.message : "Registration failed",
      });
    }
  });

  /**
   * Login user
   * POST /auth/login
   */
  app.post("/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: err.message || "Authentication error" });
      }

      if (!user) {
        return res.status(401).json({
          message: info?.message || "Invalid email or password"
        });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: loginErr.message || "Login failed" });
        }

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
          },
        });
      });
    })(req, res, next);
  });

  /**
   * Logout user
   * POST /auth/logout
   */
  app.post("/auth/logout", (req, res) => {
    req.logout((err: any) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  /**
   * Get current user info
   * GET /auth/me
   */
  app.get("/auth/me", requireAuth, (req: any, res) => {
    res.json({
      id: req.user.id,
      email: req.user.email,
      username: req.user.username,
      fullName: req.user.fullName,
      tier: req.user.tier,
      createdAt: req.user.createdAt,
    });
  });

  // ============================================
  // ADMIN USER MANAGEMENT
  // ============================================

  app.get("/api/admin/users", requireAdminSecret, async (_req, res) => {
    try {
      res.json(await storage.listUsers());
    } catch (error) {
      console.error("List users error:", error);
      res.status(500).json({ message: "Could not load users" });
    }
  });

  app.post("/api/admin/users", requireAdminSecret, async (req, res) => {
    try {
      const { email, fullName, password } = z.object({
        email: z.string().trim().toLowerCase().email("Enter a valid email address"),
        fullName: z.string().trim().max(120).optional(),
        password: z.string().min(8, "Password must be at least 8 characters").optional(),
      }).parse(req.body);

      if (await storage.getUserByEmail?.(email)) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const finalPassword = password ?? generatePassword();
      const user = await storage.createUser({
        email,
        username: await generateUsername(email),
        passwordHash: await hashPassword(finalPassword),
        fullName: fullName || undefined,
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        // Shown once so it can be passed on. Only the hash is stored.
        temporaryPassword: password ? undefined : finalPassword,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create user error:", error);
      res.status(500).json({ message: "Could not create the user" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", requireAdminSecret, async (req, res) => {
    try {
      const temporaryPassword = generatePassword();
      const updated = await storage.updateUserPassword(req.params.id, await hashPassword(temporaryPassword));
      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json({ temporaryPassword });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Could not reset the password" });
    }
  });

  // ============================================
  // TAX QUERY ROUTES
  // ============================================

  // Submit tax query
  app.post("/api/taxentia/query", requireAuth, async (req: any, res) => {
    try {
      const { query } = z.object({
        query: z.string().min(1).max(2000)
      }).parse(req.body);

      // Get authenticated user ID
      const userId = req.user.id;

      // Generate structured response using GPT-4o Mini
      let taxResponse;
      try {
        taxResponse = await hybridLLMService.generateTaxResponse(query);
      } catch (error) {
        console.warn("GPT-4o Mini service failed, falling back to OpenAI:", error);
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "default_key") {
          taxResponse = await openaiService.generateTaxResponse(query);
        } else {
          throw new Error("All LLM services unavailable");
        }
      }

      // Validate response structure
      const validatedResponse = taxResponseSchema.parse(taxResponse);

      // Save query and response
      const savedQuery = await storage.createTaxQuery({
        userId,
        query,
        response: validatedResponse,
        confidence: Math.round(validatedResponse.confidence.score), // Integer column
        confidenceColor: validatedResponse.confidence.color,
      });

      res.json(savedQuery);
    } catch (error) {
      console.error("Tax query error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  });

  // Get user's query history
  app.get("/api/queries", requireAuth, async (req: any, res) => {
    try {
      // Get authenticated user ID
      const userId = req.user.id;
      const queries = await storage.getTaxQueriesByUser(userId);
      res.json(queries);
    } catch (error) {
      console.error("Get queries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get specific query
  app.get("/api/queries/:id", requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const query = await storage.getTaxQuery(id);
      
      if (!query || query.userId !== req.user.id) {
        return res.status(404).json({ message: "Query not found" });
      }

      res.json(query);
    } catch (error) {
      console.error("Get query error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // IRC Sync Endpoints for n8n workflow integration

  // Get IRC last sync status
  app.get("/api/taxentia/irc-last-sync", async (req, res) => {
    try {
      const syncStatus = await storage.getIrcSyncStatus();

      if (!syncStatus) {
        return res.json({
          lastSyncDate: null,
          status: "never_synced",
          totalSections: 0,
          indexedSections: 0
        });
      }

      res.json({
        lastSyncDate: syncStatus.lastSyncDate,
        status: syncStatus.status,
        totalSections: syncStatus.totalSections,
        indexedSections: syncStatus.indexedSections,
        updatedAt: syncStatus.updatedAt
      });
    } catch (error) {
      console.error("Get IRC sync status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update IRC sync status (called by n8n at sync start/end)
  app.post("/api/taxentia/irc-last-sync", requireAdminSecret, async (req, res) => {
    try {
      const { lastSyncDate, status, totalSections, indexedSections, errorMessage } = z.object({
        lastSyncDate: z.string().optional().nullable(),
        status: z.enum(["never_synced", "syncing", "completed", "failed"]),
        totalSections: z.number().optional(),
        indexedSections: z.number().optional(),
        errorMessage: z.string().optional().nullable()
      }).parse(req.body);

      const syncStatus = await storage.updateIrcSyncStatus({
        lastSyncDate: lastSyncDate ? new Date(lastSyncDate) : null,
        status,
        totalSections: totalSections ?? 0,
        indexedSections: indexedSections ?? 0,
        errorMessage: errorMessage || null
      });

      res.json(syncStatus);
    } catch (error) {
      console.error("Update IRC sync status error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  });

  // Generate embedding for text (used by n8n workflow)
  app.post("/api/taxentia/embed", requireAdminSecret, async (req, res) => {
    try {
      const { text } = z.object({
        text: z.string().min(1).max(10000)
      }).parse(req.body);

      const embedding = await openaiService.generateEmbedding(text);

      res.json({
        embedding,
        dimensions: embedding.length
      });
    } catch (error) {
      console.error("Generate embedding error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  });

  // Batch index IRC sections to Qdrant (called by n8n workflow)
  app.post("/api/taxentia/index-irc-batch", requireAdminSecret, async (req, res) => {
    try {
      const { points } = z.object({
        points: z.array(z.object({
          id: z.string(),
          vector: z.array(z.number()),
          payload: z.object({
            text: z.string(),
            sourceType: z.string(),
            citation: z.string(),
            title: z.string().optional(),
            section: z.string().optional(),
            subsection: z.string().optional(),
            url: z.string().optional(),
            versionDate: z.string().optional()
          })
        })).min(1).max(100) // Limit batch size
      }).parse(req.body);

      await qdrantService.upsert(points);

      res.json({
        success: true,
        indexed: points.length,
        message: `Successfully indexed ${points.length} IRC sections to Qdrant`
      });
    } catch (error) {
      console.error("Index IRC batch error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  });

  // Fetch all IRC sections from source (called once by n8n at start of workflow)
  app.get("/api/taxentia/fetch-irc-sections", async (req, res) => {
    try {
      const { fetchIrcSections } = await import("./services/irc-fetch-service");
      const sections = await fetchIrcSections();

      res.json({
        success: true,
        sections,
        totalSections: sections.length
      });
    } catch (error) {
      console.error("Fetch IRC sections error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  });

  // Get IRC indexing statistics
  app.get("/api/taxentia/irc-status", async (req, res) => {
    try {
      const syncStatus = await storage.getIrcSyncStatus();
      const collectionInfo = await qdrantService.getCollectionInfo();

      res.json({
        sync: syncStatus || {
          status: "never_synced",
          lastSyncDate: null,
          totalSections: 0,
          indexedSections: 0
        },
        vectorDatabase: {
          pointsCount: collectionInfo.points_count || 0,
          collectionName: process.env.QDRANT_COLLECTION_NAME || "taxentia-authorities"
        }
      });
    } catch (error) {
      console.error("Get IRC status error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Internal server error"
      });
    }
  });

  // Health check endpoint for Railway
  app.get("/api/health", async (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "taxentia-ai"
    });
  });

  // Admin health check endpoint (legacy)
  app.get("/api/taxentia/admin/health", async (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "taxentia-ai"
    });
  });

  // Admin endpoint to trigger data ingestion (WARNING: Long-running operation)
  app.post("/api/taxentia/admin/ingest", async (req, res) => {
    try {
      const { type = 'all', secret } = req.body;

      // Simple security check - require admin secret
      if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Start ingestion in background with logging
      const { spawn } = await import("child_process");
      const child = spawn("npm", ["run", `ingest:${type}`], {
        detached: true,
        stdio: "inherit"
      });
      child.unref();

      res.json({
        message: `Data ingestion started for type: ${type}`,
        note: "This is a long-running operation. Check server logs for progress."
      });
    } catch (error) {
      console.error("Ingestion trigger error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to start ingestion"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
