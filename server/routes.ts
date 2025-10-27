import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { taxResponseSchema, insertTaxQuerySchema, type Authority } from "@shared/schema";
import { openaiService } from "./services/openai-service";
import { qdrantService } from "./services/qdrant-service";
// import { mockRetrievalService } from "./services/mock-retrieval";

export async function registerRoutes(app: Express): Promise<Server> {
  // Submit tax query
  app.post("/api/taxentia/query", async (req, res) => {
    try {
      const { query } = z.object({
        query: z.string().min(1).max(2000)
      }).parse(req.body);

      // Mock user ID for now - in real app would come from authentication
      const userId = "mock-user-id";

      // Generate structured response using OpenAI
      const taxResponse = await openaiService.generateTaxResponse(query);
      
      // Validate response structure
      const validatedResponse = taxResponseSchema.parse(taxResponse);
      
      // Save query and response
      const savedQuery = await storage.createTaxQuery({
        userId,
        query,
        response: validatedResponse,
        confidence: validatedResponse.confidence.score,
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
  app.get("/api/queries", async (req, res) => {
    try {
      // Mock user ID for now
      const userId = "mock-user-id";
      const queries = await storage.getTaxQueriesByUser(userId);
      res.json(queries);
    } catch (error) {
      console.error("Get queries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get specific query
  app.get("/api/queries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const query = await storage.getTaxQuery(id);
      
      if (!query) {
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
  app.post("/api/taxentia/irc-last-sync", async (req, res) => {
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
  app.post("/api/taxentia/embed", async (req, res) => {
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
  app.post("/api/taxentia/index-irc-batch", async (req, res) => {
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

  // Health check endpoint
  app.get("/api/taxentia/admin/health", async (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "taxentia-ai"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
