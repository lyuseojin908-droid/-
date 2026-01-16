import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Process Parameters Schema
export const processParametersSchema = z.object({
  rfPower: z.number().min(100).max(2000), // Watts
  pressure: z.number().min(1).max(100), // mTorr
  gasFlowCF4: z.number().min(0).max(200), // sccm
  gasFlowO2: z.number().min(0).max(100), // sccm
  gasFlowAr: z.number().min(0).max(200), // sccm
  pulseEnabled: z.boolean(),
  pulseDutyCycle: z.number().min(10).max(90).optional(), // percentage
  pulseFrequency: z.number().min(100).max(10000).optional(), // Hz
  processTime: z.number().min(10).max(600), // seconds
  chamberRfHours: z.number().min(0).max(500).optional(), // Chamber aging: RF hours
});

export type ProcessParameters = z.infer<typeof processParametersSchema>;

// Radical Distribution Data (3D Chamber Digital Twin)
export const radicalDistributionSchema = z.object({
  grid3D: z.array(z.array(z.array(z.number()))), // 3D array [z][y][x] of radical density values (20x20x10)
  grid: z.array(z.array(z.number())), // 2D slice for backward compatibility
  dimensions: z.object({
    x: z.number(), // Width (20)
    y: z.number(), // Depth (20)
    z: z.number(), // Height (10)
  }),
  centerEdgeRatio: z.number(),
  topBottomGradient: z.number(),
  highEnergyFraction: z.number(),
  residenceTimeIndex: z.number(),
  verticalUniformity: z.number(), // Height uniformity metric
  wallLossFactor: z.number(), // Wall loss contribution
});

export type RadicalDistribution = z.infer<typeof radicalDistributionSchema>;

// Quality Metrics
export const qualityMetricsSchema = z.object({
  etchUniformity: z.number().min(0).max(100), // percentage
  cdShift: z.number(), // nm
  defectRisk: z.enum(["low", "medium", "high"]),
  defectRiskScore: z.number().min(0).max(100),
});

// ROI Metrics (Economic Indicators)
export const roiMetricsSchema = z.object({
  estimatedBatchProfit: z.number(), // USD
  potentialLossReduction: z.number(), // USD
  waferCost: z.number(), // USD per wafer
  batchSize: z.number(), // wafers per batch
  yieldRate: z.number().min(0).max(100), // percentage
});

export type RoiMetrics = z.infer<typeof roiMetricsSchema>;

// Time-series stability data point
export const stabilityDataPointSchema = z.object({
  time: z.number(), // seconds from process start
  radicalDensity: z.number(), // normalized density
  uniformity: z.number(), // percentage
  temperature: z.number(), // estimated temperature (normalized)
});

export type StabilityDataPoint = z.infer<typeof stabilityDataPointSchema>;

export type QualityMetrics = z.infer<typeof qualityMetricsSchema>;

// Parameter Adjustment Recommendation
export const parameterRecommendationSchema = z.object({
  parameter: z.string(),
  currentValue: z.number(),
  recommendedValue: z.number(),
  reason: z.string(),
  priority: z.enum(["high", "medium", "low"]),
});

export type ParameterRecommendation = z.infer<typeof parameterRecommendationSchema>;

// Prediction Result
export const predictionResultSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  parameters: processParametersSchema,
  radicalDistribution: radicalDistributionSchema,
  qualityMetrics: qualityMetricsSchema,
  roiMetrics: roiMetricsSchema.optional(),
  stabilityTimeSeries: z.array(stabilityDataPointSchema).optional(),
  status: z.enum(["safe", "warning", "danger"]),
  recommendations: z.array(parameterRecommendationSchema).optional(),
});

export type PredictionResult = z.infer<typeof predictionResultSchema>;

// Simulation Records Table
export const simulations = pgTable("simulations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").defaultNow(),
  rfPower: real("rf_power").notNull(),
  pressure: real("pressure").notNull(),
  gasFlowCF4: real("gas_flow_cf4").notNull(),
  gasFlowO2: real("gas_flow_o2").notNull(),
  gasFlowAr: real("gas_flow_ar").notNull(),
  pulseEnabled: integer("pulse_enabled").notNull(),
  pulseDutyCycle: real("pulse_duty_cycle"),
  pulseFrequency: real("pulse_frequency"),
  processTime: real("process_time").notNull(),
  radicalDistribution: jsonb("radical_distribution").notNull(),
  etchUniformity: real("etch_uniformity").notNull(),
  cdShift: real("cd_shift").notNull(),
  defectRisk: text("defect_risk").notNull(),
  defectRiskScore: real("defect_risk_score").notNull(),
  status: text("status").notNull(),
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({
  id: true,
  timestamp: true,
});

export type InsertSimulation = z.infer<typeof insertSimulationSchema>;
export type Simulation = typeof simulations.$inferSelect;
