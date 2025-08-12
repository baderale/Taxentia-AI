import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  subscription: text("subscription").notNull().default("free"), // free, pro, firm
  createdAt: timestamp("created_at").defaultNow(),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTaxQuerySchema = createInsertSchema(taxQueries).omit({
  id: true,
  createdAt: true,
});

export const insertAuthoritySchema = createInsertSchema(authorities).omit({
  id: true,
});

// Response structure schema
export const taxResponseSchema = z.object({
  conclusion: z.string().max(800),
  authority: z.array(z.object({
    sourceType: z.enum(["irc", "regs", "pubs", "rulings", "cases"]),
    citation: z.string(),
    title: z.string(),
    section: z.string().optional(),
    url: z.string(),
    versionDate: z.string(),
    chunkId: z.string().optional(),
  })),
  analysis: z.array(z.object({
    step: z.string(),
    rationale: z.string(),
    authorityRefs: z.array(z.number()),
  })),
  scopeAssumptions: z.string(),
  confidence: z.object({
    score: z.number().min(0).max(100),
    color: z.enum(["red", "amber", "green"]),
    notes: z.string().optional(),
  }),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type TaxQuery = typeof taxQueries.$inferSelect;
export type InsertTaxQuery = z.infer<typeof insertTaxQuerySchema>;
export type Authority = typeof authorities.$inferSelect;
export type InsertAuthority = z.infer<typeof insertAuthoritySchema>;
export type TaxResponse = z.infer<typeof taxResponseSchema>;
