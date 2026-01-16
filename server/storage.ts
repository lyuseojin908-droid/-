import { type User, type InsertUser, type PredictionResult, type ProcessParameters, type RadicalDistribution, type QualityMetrics, type ParameterRecommendation, type RoiMetrics, type StabilityDataPoint } from "@shared/schema";
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

// Physics-based 3D plasma simulation for radical distribution
// Implements height-dependent gas diffusion, wall loss physics, and chamber aging effects
function simulateRadicalDistribution(params: ProcessParameters): RadicalDistribution {
  const gridX = 20; // Width
  const gridY = 20; // Depth
  const gridZ = 10; // Height (vertical layers)
  
  const grid3D: number[][][] = [];
  
  // Normalize parameters
  const powerFactor = params.rfPower / 1000;
  const pressureFactor = params.pressure / 50;
  const cf4Flow = params.gasFlowCF4 / 100;
  const o2Flow = params.gasFlowO2 / 50;
  const arFlow = params.gasFlowAr / 100;
  
  // Chamber aging factor (RF Hours affect wall condition)
  // As RF hours increase, wall recombination coefficient increases
  // γ_aged = γ_0 * (1 + k * RF_hours), where k is aging coefficient
  const rfHours = params.chamberRfHours || 0;
  const agingFactor = 1 + (rfHours / 500) * 0.5; // Up to 50% increase in wall loss at 500 hrs
  const agingEdgePenalty = 1 - (rfHours / 500) * 0.3; // Edge density reduced by up to 30%
  
  // Calculate base radical generation rate
  const baseGeneration = powerFactor * (1 + cf4Flow * 0.5) * (1 - pressureFactor * 0.3);
  
  // Pulse mode modulation
  const pulseModulation = params.pulseEnabled 
    ? (params.pulseDutyCycle || 50) / 100 * (1 + Math.log10((params.pulseFrequency || 1000) / 1000) * 0.1)
    : 1;
  
  // Physics constants for 3D simulation
  // Gas diffusion coefficient (normalized): D = D0 * (P/P0)^(-1) * (T/T0)^(3/2)
  const diffusionCoeff = 0.5 / pressureFactor; // Higher at lower pressure
  
  // Wall loss coefficient: γ = γ0 * exp(-E_a / kT) * aging_factor
  // Simplified: increases with distance from center, height, and chamber age
  const wallLossCoeff = (0.3 + (1 - pressureFactor) * 0.2) * agingFactor;
  
  // Showerhead injection profile (gas comes from top)
  // z = 0 is bottom (wafer), z = 1 is top (showerhead)
  // Tuned for realistic vertical uniformity with higher pressure
  const injectionDecayRate = 0.2 + (1 - pressureFactor) * 0.5 + arFlow * 0.15; // Higher pressure = more uniform
  
  // Generate 3D distribution [z][y][x]
  for (let k = 0; k < gridZ; k++) {
    const zLayer: number[][] = [];
    const z = k / (gridZ - 1); // 0 (bottom/wafer) to 1 (top/showerhead)
    const zNorm = (k - gridZ / 2) / (gridZ / 2); // -1 to 1 for physics calc
    
    // Height-dependent physics:
    // 1. Gas diffusion from showerhead (top) - exponential decay
    const heightDiffusion = Math.exp(-injectionDecayRate * (1 - z));
    
    // 2. Wall loss increases near bottom due to wafer surface reactions
    const waferLoss = 1 - 0.15 * Math.exp(-4 * z); // More loss near wafer (z=0)
    
    // 3. Plasma density profile (RF coupling is stronger near center height)
    const rfCouplingProfile = 1 + 0.2 * Math.sin(Math.PI * z); // Peak at z=0.5
    
    for (let i = 0; i < gridY; i++) {
      const row: number[] = [];
      const y = (i - gridY / 2) / (gridY / 2); // -1 to 1
      
      for (let j = 0; j < gridX; j++) {
        const x = (j - gridX / 2) / (gridX / 2); // -1 to 1
        const r = Math.sqrt(x * x + y * y); // Radial distance
        const rWall = Math.max(Math.abs(x), Math.abs(y)); // Distance to nearest wall
        
        // Radial decay from center (plasma diffusion)
        // Tuned for realistic SAFE/DANGER conditions in 3D
        const radialDecay = 0.2 + (1 - pressureFactor) * 0.3 + powerFactor * 0.2;
        const radialProfile = Math.exp(-r * r * radialDecay);
        
        // Wall loss physics: exponential loss near chamber walls
        // Loss rate: Γ_wall = γ * n * v_thermal / 4
        // Tuned for better uniformity at higher pressure
        const wallLoss = Math.exp(-wallLossCoeff * rWall * rWall * 0.6 * (1 + 0.2 * (1 - z)));
        
        // Pressure-dependent edge enhancement (stronger at higher pressure)
        // Reduced by chamber aging (older chambers have worse edge performance)
        const pressureEdgeBoost = pressureFactor * 0.25 * (1 - Math.exp(-r * r * 2)) * agingEdgePenalty;
        
        // Combine all 3D physics effects
        let density = baseGeneration * pulseModulation;
        density *= radialProfile * heightDiffusion * waferLoss * rfCouplingProfile * wallLoss;
        density += pressureEdgeBoost * baseGeneration * heightDiffusion;
        
        // Edge enhancement at high power
        if (powerFactor > 1.2) {
          density += 0.1 * r * r * (powerFactor - 1.2) * heightDiffusion;
        }
        
        // Add controlled noise for realism
        const noise = (Math.random() - 0.5) * 0.03 * density;
        density = Math.max(0.05, density + noise);
        
        row.push(Number(density.toFixed(4)));
      }
      zLayer.push(row);
    }
    grid3D.push(zLayer);
  }
  
  // Extract 2D slice at mid-height for backward compatibility
  const midZ = Math.floor(gridZ / 2);
  const grid2D = grid3D[midZ];
  
  // Calculate derived metrics from 3D data
  // Center value at mid-height
  const centerValue = grid3D[midZ][gridY / 2][gridX / 2];
  
  // Edge values at mid-height
  const edgeValues = [
    grid3D[midZ][0][gridX / 2],
    grid3D[midZ][gridY - 1][gridX / 2],
    grid3D[midZ][gridY / 2][0],
    grid3D[midZ][gridY / 2][gridX - 1]
  ];
  const avgEdge = edgeValues.reduce((a, b) => a + b, 0) / edgeValues.length;
  
  // Top/Bottom gradient (vertical uniformity)
  const bottomLayer = grid3D[0];
  const topLayer = grid3D[gridZ - 1];
  const avgBottom = bottomLayer.flat().reduce((a, b) => a + b, 0) / (gridX * gridY);
  const avgTop = topLayer.flat().reduce((a, b) => a + b, 0) / (gridX * gridY);
  
  // Vertical uniformity calculation
  const allValues = grid3D.flat(2);
  const mean3D = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  const variance3D = allValues.reduce((sum, v) => sum + (v - mean3D) ** 2, 0) / allValues.length;
  const verticalUniformity = Number((100 - Math.sqrt(variance3D) / mean3D * 100).toFixed(1));
  
  // Wall loss factor calculation
  const centerAvg = grid3D.map(layer => layer[gridY/2][gridX/2]).reduce((a, b) => a + b, 0) / gridZ;
  const wallAvg = grid3D.map(layer => 
    (layer[0][gridX/2] + layer[gridY-1][gridX/2] + layer[gridY/2][0] + layer[gridY/2][gridX-1]) / 4
  ).reduce((a, b) => a + b, 0) / gridZ;
  const wallLossFactor = Number((1 - wallAvg / centerAvg).toFixed(3));
  
  return {
    grid3D,
    grid: grid2D,
    dimensions: { x: gridX, y: gridY, z: gridZ },
    centerEdgeRatio: Number((centerValue / avgEdge).toFixed(3)),
    topBottomGradient: Number((avgTop / avgBottom).toFixed(3)),
    highEnergyFraction: Number((0.15 + powerFactor * 0.2 - pressureFactor * 0.1).toFixed(3)),
    residenceTimeIndex: Number((10 / pressureFactor * (1 + arFlow * 0.2)).toFixed(2)),
    verticalUniformity,
    wallLossFactor,
  };
}

// Physics-regularized quality prediction based on radical distribution
function predictQualityMetrics(
  params: ProcessParameters, 
  distribution: RadicalDistribution
): { metrics: QualityMetrics; status: "safe" | "warning" | "danger" } {
  const ratioDeviation = Math.abs(distribution.centerEdgeRatio - 1);
  const gradientDeviation = Math.abs(distribution.topBottomGradient - 1);
  
  // Physics-regularized uniformity calculation
  // When Center/Edge Ratio > 1.5, uniformity drops sharply (exponential penalty)
  let uniformity = 100 - ratioDeviation * 15 - gradientDeviation * 10;
  
  // Sharp uniformity drop when Center/Edge Ratio exceeds 1.5 (physics constraint)
  // Based on plasma diffusion theory: excessive center concentration causes non-uniform etching
  if (distribution.centerEdgeRatio > 1.5) {
    const excessRatio = distribution.centerEdgeRatio - 1.5;
    // Exponential decay penalty: uniformity = U * exp(-k * (ratio - 1.5)^2)
    const penaltyFactor = Math.exp(-2.5 * excessRatio * excessRatio);
    uniformity = uniformity * penaltyFactor;
    // Additional linear penalty for severe cases
    uniformity -= excessRatio * 25;
  }
  
  // Symmetry penalty: if ratio < 0.7 (edge-heavy distribution)
  if (distribution.centerEdgeRatio < 0.7) {
    const deficit = 0.7 - distribution.centerEdgeRatio;
    uniformity -= deficit * 30;
  }
  
  // Pulse mode improves uniformity
  if (params.pulseEnabled) {
    uniformity += 2;
  }
  
  // Pressure effects on uniformity
  if (params.pressure > 60) {
    uniformity -= (params.pressure - 60) * 0.1;
  }
  
  uniformity = Math.max(50, Math.min(99.5, uniformity));
  
  // CD shift calculation with physics regularization
  let cdShift = (distribution.centerEdgeRatio - 1) * 2;
  cdShift += (distribution.highEnergyFraction - 0.25) * 3;
  
  // High center/edge ratio causes more severe CD shift
  if (distribution.centerEdgeRatio > 1.5) {
    cdShift += (distribution.centerEdgeRatio - 1.5) * 4;
  }
  
  cdShift += (Math.random() - 0.5) * 0.5;
  cdShift = Number(cdShift.toFixed(2));
  
  // Defect risk assessment
  let riskScore = 0;
  riskScore += ratioDeviation * 30;
  riskScore += gradientDeviation * 20;
  riskScore += Math.max(0, distribution.highEnergyFraction - 0.35) * 50;
  riskScore += Math.max(0, params.rfPower - 1500) / 50;
  riskScore += Math.max(0, 10 - params.pressure) * 2;
  
  // Additional risk from extreme center/edge ratio
  if (distribution.centerEdgeRatio > 1.5) {
    riskScore += (distribution.centerEdgeRatio - 1.5) * 40;
  }
  
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

// Generate parameter adjustment recommendations for DANGER status
function generateRecommendations(
  params: ProcessParameters,
  distribution: RadicalDistribution,
  metrics: QualityMetrics,
  status: "safe" | "warning" | "danger"
): ParameterRecommendation[] {
  const recommendations: ParameterRecommendation[] = [];
  
  if (status === "safe") {
    return recommendations;
  }
  
  // High Center/Edge Ratio (> 1.5) - Primary issue
  if (distribution.centerEdgeRatio > 1.5) {
    // Recommend increasing pressure to improve radial diffusion
    if (params.pressure < 30) {
      recommendations.push({
        parameter: "Pressure",
        currentValue: params.pressure,
        recommendedValue: Math.min(params.pressure + 10, 35),
        reason: "Center/Edge Ratio가 1.5를 초과했습니다. 압력을 높이면 라디칼 확산이 개선되어 균일도가 향상됩니다.",
        priority: "high",
      });
    }
    
    // Recommend reducing RF Power
    if (params.rfPower > 800) {
      recommendations.push({
        parameter: "RF Power",
        currentValue: params.rfPower,
        recommendedValue: Math.max(params.rfPower - 200, 500),
        reason: "RF Power가 높아 중앙부 플라즈마 밀도가 과도합니다. Power를 낮추면 Center/Edge Ratio가 개선됩니다.",
        priority: "high",
      });
    }
    
    // Recommend enabling pulse mode
    if (!params.pulseEnabled) {
      recommendations.push({
        parameter: "Pulse Mode",
        currentValue: 0,
        recommendedValue: 1,
        reason: "펄스 모드를 활성화하면 플라즈마 분포가 균일해지고 Center/Edge Ratio가 감소합니다.",
        priority: "medium",
      });
    }
  }
  
  // Low uniformity issues
  if (metrics.etchUniformity < 88) {
    // Recommend adjusting Ar flow for better uniformity
    if (params.gasFlowAr < 80) {
      recommendations.push({
        parameter: "Ar Flow",
        currentValue: params.gasFlowAr,
        recommendedValue: Math.min(params.gasFlowAr + 30, 120),
        reason: "Ar 유량을 늘리면 플라즈마 안정성이 향상되어 에칭 균일도가 개선됩니다.",
        priority: "medium",
      });
    }
  }
  
  // High CD Shift
  if (Math.abs(metrics.cdShift) > 3) {
    if (distribution.highEnergyFraction > 0.35) {
      recommendations.push({
        parameter: "RF Power",
        currentValue: params.rfPower,
        recommendedValue: Math.max(params.rfPower - 150, 400),
        reason: "고에너지 라디칼 비율이 높아 CD Shift가 크게 발생합니다. RF Power를 낮춰주세요.",
        priority: "high",
      });
    }
    
    // Recommend increasing O2 for CD control
    if (params.gasFlowO2 < 20 && metrics.cdShift > 0) {
      recommendations.push({
        parameter: "O2 Flow",
        currentValue: params.gasFlowO2,
        recommendedValue: Math.min(params.gasFlowO2 + 10, 30),
        reason: "O2 유량을 늘리면 에칭 속도가 조절되어 CD Shift가 감소합니다.",
        priority: "medium",
      });
    }
  }
  
  // High defect risk
  if (metrics.defectRisk === "high") {
    if (params.pressure < 15) {
      recommendations.push({
        parameter: "Pressure",
        currentValue: params.pressure,
        recommendedValue: Math.min(params.pressure + 8, 25),
        reason: "저압 조건에서 결함 위험이 높습니다. 압력을 높이면 이온 에너지가 감소하여 결함이 줄어듭니다.",
        priority: "high",
      });
    }
    
    // Recommend reducing CF4 if too high
    if (params.gasFlowCF4 > 80) {
      recommendations.push({
        parameter: "CF4 Flow",
        currentValue: params.gasFlowCF4,
        recommendedValue: Math.max(params.gasFlowCF4 - 20, 50),
        reason: "CF4 유량이 과도합니다. 유량을 줄이면 에칭 공격성이 감소하여 결함 위험이 낮아집니다.",
        priority: "medium",
      });
    }
  }
  
  // Top/Bottom Gradient issues
  if (Math.abs(distribution.topBottomGradient - 1) > 0.3) {
    if (params.gasFlowAr < 100) {
      recommendations.push({
        parameter: "Ar Flow",
        currentValue: params.gasFlowAr,
        recommendedValue: Math.min(params.gasFlowAr + 25, 130),
        reason: "상하 그래디언트가 큽니다. Ar 유량을 늘려 수직 분포를 개선하세요.",
        priority: "low",
      });
    }
  }
  
  // Sort by priority and limit to top 3 recommendations
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations.slice(0, 3);
}

// Generate time-series stability data for the process duration
function generateStabilityTimeSeries(
  params: ProcessParameters,
  distribution: RadicalDistribution,
  metrics: QualityMetrics
): StabilityDataPoint[] {
  const dataPoints: StabilityDataPoint[] = [];
  const processTime = params.processTime;
  const numPoints = Math.min(60, Math.floor(processTime / 5) + 1); // Max 60 points
  
  // Base values from the steady-state prediction
  const baseUniformity = metrics.etchUniformity;
  const baseDensity = distribution.grid3D[5][10][10]; // Center point at mid-height
  
  // Chamber aging affects stability
  const rfHours = params.chamberRfHours || 0;
  const agingInstability = (rfHours / 500) * 0.15; // More drift with older chambers
  
  // Process stability factors
  const pulseStability = params.pulseEnabled ? 0.98 : 0.85; // Pulse mode more stable
  const pressureStability = Math.min(1, params.pressure / 30); // Higher pressure = more stable
  
  for (let i = 0; i < numPoints; i++) {
    const time = (i / (numPoints - 1)) * processTime;
    const t = time / processTime; // Normalized time 0-1
    
    // Time-dependent physics:
    // 1. Ramp-up phase (0-10%): density increases exponentially to steady state
    // 2. Steady state (10-80%): slight drift due to chamber heating
    // 3. Stabilization (80-100%): thermal equilibrium achieved
    
    let densityMultiplier = 1;
    let uniformityDelta = 0;
    let temperature = 0.5; // Normalized temperature
    
    if (t < 0.1) {
      // Ramp-up: exponential approach to steady state
      densityMultiplier = 1 - Math.exp(-t * 30);
      uniformityDelta = -5 * (1 - densityMultiplier); // Lower uniformity during ramp
      temperature = 0.3 + 0.4 * t / 0.1;
    } else if (t < 0.8) {
      // Steady state with slight thermal drift
      const driftPhase = (t - 0.1) / 0.7;
      densityMultiplier = 1 + agingInstability * Math.sin(driftPhase * Math.PI);
      uniformityDelta = -agingInstability * 10 * Math.sin(driftPhase * Math.PI * 2);
      temperature = 0.7 + 0.2 * driftPhase;
    } else {
      // Stabilization phase
      densityMultiplier = 1 + agingInstability * 0.3;
      uniformityDelta = -agingInstability * 3;
      temperature = 0.85 + 0.1 * ((t - 0.8) / 0.2);
    }
    
    // Apply stability factors
    densityMultiplier *= pulseStability;
    
    // Add controlled noise
    const noise = (Math.random() - 0.5) * 0.02 * (1 + agingInstability);
    
    dataPoints.push({
      time: Number(time.toFixed(1)),
      radicalDensity: Number((baseDensity * densityMultiplier * (1 + noise)).toFixed(4)),
      uniformity: Number(Math.max(50, Math.min(100, baseUniformity + uniformityDelta + noise * 10)).toFixed(1)),
      temperature: Number(Math.min(1, Math.max(0, temperature + noise * 0.1)).toFixed(3)),
    });
  }
  
  return dataPoints;
}

// Calculate ROI metrics based on quality prediction
function calculateRoiMetrics(
  params: ProcessParameters,
  metrics: QualityMetrics,
  status: "safe" | "warning" | "danger"
): RoiMetrics {
  // Industry-standard cost assumptions
  const waferCost = 150; // USD per wafer (300mm wafer)
  const batchSize = 25; // wafers per batch
  const baseSellingPrice = 200; // USD per processed wafer
  
  // Yield calculation based on quality metrics
  // Yield = f(uniformity, defect risk, CD shift)
  let yieldRate = metrics.etchUniformity * 0.8; // Base yield from uniformity
  
  // Defect risk penalty
  if (metrics.defectRisk === "medium") {
    yieldRate -= 10;
  } else if (metrics.defectRisk === "high") {
    yieldRate -= 25;
  }
  
  // CD shift penalty
  yieldRate -= Math.abs(metrics.cdShift) * 2;
  
  // Clamp yield
  yieldRate = Math.max(30, Math.min(99, yieldRate));
  
  // Calculate batch profit
  const goodWafers = Math.floor(batchSize * yieldRate / 100);
  const scrappedWafers = batchSize - goodWafers;
  const revenue = goodWafers * baseSellingPrice;
  const materialCost = batchSize * waferCost;
  const scrapLoss = scrappedWafers * waferCost * 0.5; // Partial recovery
  const estimatedBatchProfit = revenue - materialCost - scrapLoss;
  
  // Calculate potential loss reduction (compared to optimal scenario)
  const optimalYield = 98;
  const optimalProfit = Math.floor(batchSize * optimalYield / 100) * baseSellingPrice - batchSize * waferCost;
  const potentialLossReduction = status === "danger" 
    ? optimalProfit - estimatedBatchProfit
    : status === "warning"
    ? (optimalProfit - estimatedBatchProfit) * 0.5
    : 0;
  
  return {
    estimatedBatchProfit: Number(estimatedBatchProfit.toFixed(0)),
    potentialLossReduction: Number(potentialLossReduction.toFixed(0)),
    waferCost,
    batchSize,
    yieldRate: Number(yieldRate.toFixed(1)),
  };
}

export function generatePrediction(params: ProcessParameters): PredictionResult {
  const radicalDistribution = simulateRadicalDistribution(params);
  const { metrics, status } = predictQualityMetrics(params, radicalDistribution);
  const recommendations = generateRecommendations(params, radicalDistribution, metrics, status);
  const roiMetrics = calculateRoiMetrics(params, metrics, status);
  const stabilityTimeSeries = generateStabilityTimeSeries(params, radicalDistribution, metrics);
  
  return {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    parameters: params,
    radicalDistribution,
    qualityMetrics: metrics,
    roiMetrics,
    stabilityTimeSeries,
    status,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
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
