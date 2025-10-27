import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  tier: text("tier").notNull().default("free"), // free, pro, enterprise
  subscription: text("subscription").notNull().default("free"), // free, pro, firm
  subscriptionActive: boolean("subscription_active").default(true),
  apiQuotaMonthly: integer("api_quota_monthly").default(100),
  apiQuotaUsed: integer("api_quota_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const taxQueries = pgTable("tax_queries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  query: text("query").notNull(),
  response: jsonb("response"), // Structured response object
  confidence: integer("confidence").notNull().default(0),
  confidenceColor: text("confidence_color").notNull().default("red"), // red, amber, green
  retrievedIds: text("retrieved_ids").array(),
  createdAt: text("created_at").notNull(),
});

export const authorities = pgTable("authorities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceType: text("source_type").notNull(), // irc, regs, pubs, rulings, cases
  citation: text("citation").notNull(),
  title: text("title").notNull(),
  section: text("section"),
  url: text("url").notNull(),
  content: text("content").notNull(),
  versionDate: text("version_date").notNull(),
  chunkId: text("chunk_id"),
});

export const ircSyncStatus = pgTable("irc_sync_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lastSyncDate: timestamp("last_sync_date"),
  totalSections: integer("total_sections").default(0),
  indexedSections: integer("indexed_sections").default(0),
  status: text("status").notNull().default("never_synced"), // never_synced, syncing, completed, failed
  errorMessage: text("error_message"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Invalid email address"),
  passwordHash: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

export const insertTaxQuerySchema = createInsertSchema(taxQueries).omit({
  id: true,
  createdAt: true,
});

export const insertAuthoritySchema = createInsertSchema(authorities).omit({
  id: true,
});

export const insertIrcSyncStatusSchema = createInsertSchema(ircSyncStatus).omit({
  id: true,
  updatedAt: true,
});

// Response structure schema
export const taxResponseSchema = z.object({
  conclusion: z.string().max(800),
  authority: z.array(z.object({
    sourceType: z.enum(["irc", "regs", "pubs", "rulings", "cases"]),
    citation: z.string(),
    title: z.string(),
    section: z.string().optional(),
    subsection: z.string().optional(),
    url: z.string(),
    directUrl: z.string().optional(),
    versionDate: z.string(),
    effectiveDate: z.string().optional(),
    chunkId: z.string().optional(),
  })),
  analysis: z.array(z.object({
    step: z.string(),
    rationale: z.string(),
    authorityRefs: z.array(z.number()),
    proceduralNotes: z.string().optional(),
  })),
  scopeAssumptions: z.string(),
  confidence: z.object({
    score: z.number().min(0).max(100),
    color: z.enum(["red", "amber", "green"]),
    notes: z.union([z.string(), z.array(z.string())]).optional(),
  }),
  furtherReading: z.array(z.object({
    citation: z.string(),
    title: z.string(),
    url: z.string(),
    relevance: z.string(),
  })).optional(),
  proceduralGuidance: z.object({
    forms: z.array(z.string()).optional(),
    deadlines: z.array(z.string()).optional(),
    elections: z.array(z.string()).optional(),
  }).optional(),
  disclaimer: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TaxQuery = typeof taxQueries.$inferSelect;
export type InsertTaxQuery = z.infer<typeof insertTaxQuerySchema>;
export type Authority = typeof authorities.$inferSelect;
export type InsertAuthority = z.infer<typeof insertAuthoritySchema>;
export type IrcSyncStatus = typeof ircSyncStatus.$inferSelect;
export type InsertIrcSyncStatus = z.infer<typeof insertIrcSyncStatusSchema>;
export type TaxResponse = z.infer<typeof taxResponseSchema>;
