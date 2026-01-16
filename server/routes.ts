import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, generatePrediction } from "./storage";
import { processParametersSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all predictions
  app.get("/api/predictions", async (_req, res) => {
    try {
      const predictions = await storage.getAllPredictions();
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      res.status(500).json({ error: "Failed to fetch predictions" });
    }
  });

  // Get single prediction by ID
  app.get("/api/predictions/:id", async (req, res) => {
    try {
      const prediction = await storage.getPrediction(req.params.id);
      if (!prediction) {
        return res.status(404).json({ error: "Prediction not found" });
      }
      res.json(prediction);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      res.status(500).json({ error: "Failed to fetch prediction" });
    }
  });

  // Run new prediction
  app.post("/api/predict", async (req, res) => {
    try {
      const params = processParametersSchema.parse(req.body);
      const prediction = generatePrediction(params);
      await storage.savePrediction(prediction);
      res.json(prediction);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: "Invalid parameters", 
          details: error.errors 
        });
      }
      console.error("Error running prediction:", error);
      res.status(500).json({ error: "Failed to run prediction" });
    }
  });

  // Clear all predictions
  app.delete("/api/predictions", async (_req, res) => {
    try {
      await storage.clearPredictions();
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing predictions:", error);
      res.status(500).json({ error: "Failed to clear predictions" });
    }
  });

  return httpServer;
}
