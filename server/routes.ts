import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { taxResponseSchema, insertTaxQuerySchema, type Authority } from "@shared/schema";
import { openaiService } from "./services/openai-service";
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
