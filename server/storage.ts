import { type User, type InsertUser, type PredictionResult, type ProcessParameters, type RadicalDistribution, type QualityMetrics } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Prediction operations
  getAllPredictions(): Promise<PredictionResult[]>;
  getPrediction(id: string): Promise<PredictionResult | undefined>;
  savePrediction(prediction: PredictionResult): Promise<PredictionResult>;
  clearPredictions(): Promise<void>;
}

// Physics-based plasma simulation for radical distribution
function simulateRadicalDistribution(params: ProcessParameters): RadicalDistribution {
  const gridSize = 20;
  const grid: number[][] = [];
  
  // Normalize parameters
  const powerFactor = params.rfPower / 1000;
  const pressureFactor = params.pressure / 50;
  const cf4Flow = params.gasFlowCF4 / 100;
  const o2Flow = params.gasFlowO2 / 50;
  const arFlow = params.gasFlowAr / 100;
  
  // Calculate base radical generation rate
  const baseGeneration = powerFactor * (1 + cf4Flow * 0.5) * (1 - pressureFactor * 0.3);
  
  // Pulse mode modulation
  const pulseModulation = params.pulseEnabled 
    ? (params.pulseDutyCycle || 50) / 100 * (1 + Math.log10((params.pulseFrequency || 1000) / 1000) * 0.1)
    : 1;
  
  // Generate 2D distribution with physics-based spatial variation
  for (let i = 0; i < gridSize; i++) {
    const row: number[] = [];
    const y = (i - gridSize / 2) / (gridSize / 2); // -1 to 1
    
    for (let j = 0; j < gridSize; j++) {
      const x = (j - gridSize / 2) / (gridSize / 2); // -1 to 1
      const r = Math.sqrt(x * x + y * y);
      
      // Radial decay from center (due to wall losses and diffusion)
      const radialProfile = Math.exp(-r * r * (0.5 + pressureFactor * 0.3));
      
      // Vertical gradient (top-heavy due to showerhead gas injection)
      const verticalProfile = 1 + y * 0.2 * (1 - arFlow * 0.3);
      
      // Edge enhancement at high power (skin effect)
      const edgeEnhancement = powerFactor > 1.2 ? 0.15 * r * r * powerFactor : 0;
      
      // Combine profiles
      let density = baseGeneration * radialProfile * verticalProfile * pulseModulation;
      density += edgeEnhancement;
      
      // Add controlled noise for realism
      const noise = (Math.random() - 0.5) * 0.05 * density;
      density = Math.max(0.1, density + noise);
      
      row.push(Number(density.toFixed(4)));
    }
    grid.push(row);
  }
  
  // Calculate derived metrics
  const centerValue = grid[gridSize / 2]?.[gridSize / 2] || 1;
  const edgeValues = [
    grid[0]?.[gridSize / 2],
    grid[gridSize - 1]?.[gridSize / 2],
    grid[gridSize / 2]?.[0],
    grid[gridSize / 2]?.[gridSize - 1]
  ].filter(v => v !== undefined) as number[];
  const avgEdge = edgeValues.reduce((a, b) => a + b, 0) / edgeValues.length;
  
  const topRow = grid[0] || [];
  const bottomRow = grid[gridSize - 1] || [];
  const avgTop = topRow.reduce((a, b) => a + b, 0) / topRow.length;
  const avgBottom = bottomRow.reduce((a, b) => a + b, 0) / bottomRow.length;
  
  return {
    grid,
    centerEdgeRatio: Number((centerValue / avgEdge).toFixed(3)),
    topBottomGradient: Number((avgTop / avgBottom).toFixed(3)),
    highEnergyFraction: Number((0.15 + powerFactor * 0.2 - pressureFactor * 0.1).toFixed(3)),
    residenceTimeIndex: Number((10 / pressureFactor * (1 + arFlow * 0.2)).toFixed(2)),
  };
}

// Quality prediction based on radical distribution
function predictQualityMetrics(
  params: ProcessParameters, 
  distribution: RadicalDistribution
): { metrics: QualityMetrics; status: "safe" | "warning" | "danger" } {
  // Base uniformity from center/edge ratio (ideal is 1.0)
  const ratioDeviation = Math.abs(distribution.centerEdgeRatio - 1);
  const gradientDeviation = Math.abs(distribution.topBottomGradient - 1);
  
  let uniformity = 100 - ratioDeviation * 15 - gradientDeviation * 10;
  
  // Pulse mode improves uniformity
  if (params.pulseEnabled) {
    uniformity += 2;
  }
  
  // Pressure effects
  if (params.pressure > 60) {
    uniformity -= (params.pressure - 60) * 0.1;
  }
  
  uniformity = Math.max(75, Math.min(99.5, uniformity));
  
  // CD shift calculation
  let cdShift = (distribution.centerEdgeRatio - 1) * 2;
  cdShift += (distribution.highEnergyFraction - 0.25) * 3;
  cdShift += (Math.random() - 0.5) * 0.5;
  cdShift = Number(cdShift.toFixed(2));
  
  // Defect risk assessment
  let riskScore = 0;
  riskScore += ratioDeviation * 30;
  riskScore += gradientDeviation * 20;
  riskScore += Math.max(0, distribution.highEnergyFraction - 0.35) * 50;
  riskScore += Math.max(0, params.rfPower - 1500) / 50;
  riskScore += Math.max(0, 10 - params.pressure) * 2;
  riskScore = Math.min(100, Math.max(0, riskScore + (Math.random() - 0.5) * 5));
  
  const defectRisk: "low" | "medium" | "high" = 
    riskScore < 25 ? "low" : 
    riskScore < 55 ? "medium" : "high";
  
  // Overall status
  let status: "safe" | "warning" | "danger";
  if (uniformity >= 94 && Math.abs(cdShift) <= 2 && defectRisk === "low") {
    status = "safe";
  } else if (uniformity >= 88 && Math.abs(cdShift) <= 4 && defectRisk !== "high") {
    status = "warning";
  } else {
    status = "danger";
  }
  
  return {
    metrics: {
      etchUniformity: Number(uniformity.toFixed(1)),
      cdShift,
      defectRisk,
      defectRiskScore: Number(riskScore.toFixed(1)),
    },
    status,
  };
}

export function generatePrediction(params: ProcessParameters): PredictionResult {
  const radicalDistribution = simulateRadicalDistribution(params);
  const { metrics, status } = predictQualityMetrics(params, radicalDistribution);
  
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    parameters: params,
    radicalDistribution,
    qualityMetrics: metrics,
    status,
  };
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private predictions: Map<string, PredictionResult>;

  constructor() {
    this.users = new Map();
    this.predictions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllPredictions(): Promise<PredictionResult[]> {
    return Array.from(this.predictions.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getPrediction(id: string): Promise<PredictionResult | undefined> {
    return this.predictions.get(id);
  }

  async savePrediction(prediction: PredictionResult): Promise<PredictionResult> {
    this.predictions.set(prediction.id, prediction);
    return prediction;
  }

  async clearPredictions(): Promise<void> {
    this.predictions.clear();
  }
}

export const storage = new MemStorage();
