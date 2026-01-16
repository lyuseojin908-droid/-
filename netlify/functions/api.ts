import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface ProcessParameters {
  rfPower: number;
  pressure: number;
  gasFlowCF4: number;
  gasFlowO2: number;
  gasFlowAr: number;
  processTime: number;
  pulseEnabled: boolean;
  pulseFrequency?: number;
  pulseDutyCycle?: number;
}

interface RadicalDistribution {
  grid: number[][];
  centerEdgeRatio: number;
  topBottomGradient: number;
  highEnergyFraction: number;
  residenceTimeIndex: number;
}

interface QualityMetrics {
  etchUniformity: number;
  cdShift: number;
  defectRisk: "low" | "medium" | "high";
  defectRiskScore: number;
}

interface ParameterRecommendation {
  parameter: string;
  currentValue: number;
  recommendedValue: number;
  reason: string;
  priority: "high" | "medium" | "low";
}

interface PredictionResult {
  id: string;
  timestamp: string;
  parameters: ProcessParameters;
  radicalDistribution: RadicalDistribution;
  qualityMetrics: QualityMetrics;
  status: "safe" | "warning" | "danger";
  recommendations?: ParameterRecommendation[];
}

const predictions: Map<string, PredictionResult> = new Map();

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function simulateRadicalDistribution(params: ProcessParameters): RadicalDistribution {
  const gridSize = 20;
  const grid: number[][] = [];
  
  const powerFactor = params.rfPower / 1000;
  const pressureFactor = params.pressure / 50;
  const cf4Flow = params.gasFlowCF4 / 100;
  const o2Flow = params.gasFlowO2 / 50;
  const arFlow = params.gasFlowAr / 100;
  
  const baseGeneration = powerFactor * (1 + cf4Flow * 0.5) * (1 - pressureFactor * 0.3);
  
  const pulseModulation = params.pulseEnabled 
    ? (params.pulseDutyCycle || 50) / 100 * (1 + Math.log10((params.pulseFrequency || 1000) / 1000) * 0.1)
    : 1;
  
  for (let i = 0; i < gridSize; i++) {
    const row: number[] = [];
    const y = (i - gridSize / 2) / (gridSize / 2);
    
    for (let j = 0; j < gridSize; j++) {
      const x = (j - gridSize / 2) / (gridSize / 2);
      const r = Math.sqrt(x * x + y * y);
      
      const radialDecay = 0.3 + (1 - pressureFactor) * 0.5 + powerFactor * 0.3;
      const radialProfile = Math.exp(-r * r * radialDecay);
      const pressureEdgeBoost = pressureFactor * 0.15 * (1 - Math.exp(-r * r * 2));
      const verticalProfile = 1 + y * 0.15 * (1 - arFlow * 0.4);
      const edgeEnhancement = powerFactor > 1.2 ? 0.1 * r * r * (powerFactor - 1.2) : 0;
      
      let density = baseGeneration * radialProfile * verticalProfile * pulseModulation;
      density += edgeEnhancement;
      density += pressureEdgeBoost * baseGeneration;
      
      const noise = (Math.random() - 0.5) * 0.05 * density;
      density = Math.max(0.1, density + noise);
      
      row.push(Number(density.toFixed(4)));
    }
    grid.push(row);
  }
  
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

function predictQualityMetrics(
  params: ProcessParameters, 
  distribution: RadicalDistribution
): { metrics: QualityMetrics; status: "safe" | "warning" | "danger" } {
  const ratioDeviation = Math.abs(distribution.centerEdgeRatio - 1);
  const gradientDeviation = Math.abs(distribution.topBottomGradient - 1);
  
  let uniformity = 100 - ratioDeviation * 15 - gradientDeviation * 10;
  
  // Sharp uniformity drop when Center/Edge Ratio exceeds 1.5 (physics constraint)
  if (distribution.centerEdgeRatio > 1.5) {
    const excessRatio = distribution.centerEdgeRatio - 1.5;
    const penaltyFactor = Math.exp(-2.5 * excessRatio * excessRatio);
    uniformity = uniformity * penaltyFactor;
    uniformity -= excessRatio * 25;
  }
  
  if (distribution.centerEdgeRatio < 0.7) {
    const deficit = 0.7 - distribution.centerEdgeRatio;
    uniformity -= deficit * 30;
  }
  
  if (params.pulseEnabled) {
    uniformity += 2;
  }
  
  if (params.pressure > 60) {
    uniformity -= (params.pressure - 60) * 0.1;
  }
  
  uniformity = Math.max(50, Math.min(99.5, uniformity));
  
  let cdShift = (distribution.centerEdgeRatio - 1) * 2;
  cdShift += (distribution.highEnergyFraction - 0.25) * 3;
  
  if (distribution.centerEdgeRatio > 1.5) {
    cdShift += (distribution.centerEdgeRatio - 1.5) * 4;
  }
  
  cdShift += (Math.random() - 0.5) * 0.5;
  cdShift = Number(cdShift.toFixed(2));
  
  let riskScore = 0;
  riskScore += ratioDeviation * 30;
  riskScore += gradientDeviation * 20;
  riskScore += Math.max(0, distribution.highEnergyFraction - 0.35) * 50;
  riskScore += Math.max(0, params.rfPower - 1500) / 50;
  riskScore += Math.max(0, 10 - params.pressure) * 2;
  
  if (distribution.centerEdgeRatio > 1.5) {
    riskScore += (distribution.centerEdgeRatio - 1.5) * 40;
  }
  
  riskScore = Math.min(100, Math.max(0, riskScore + (Math.random() - 0.5) * 5));
  
  const defectRisk: "low" | "medium" | "high" = 
    riskScore < 25 ? "low" : 
    riskScore < 55 ? "medium" : "high";
  
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
  
  if (distribution.centerEdgeRatio > 1.5) {
    if (params.pressure < 30) {
      recommendations.push({
        parameter: "Pressure",
        currentValue: params.pressure,
        recommendedValue: Math.min(params.pressure + 10, 35),
        reason: "Center/Edge Ratio가 1.5를 초과했습니다. 압력을 높이면 라디칼 확산이 개선되어 균일도가 향상됩니다.",
        priority: "high",
      });
    }
    
    if (params.rfPower > 800) {
      recommendations.push({
        parameter: "RF Power",
        currentValue: params.rfPower,
        recommendedValue: Math.max(params.rfPower - 200, 500),
        reason: "RF Power가 높아 중앙부 플라즈마 밀도가 과도합니다. Power를 낮추면 Center/Edge Ratio가 개선됩니다.",
        priority: "high",
      });
    }
    
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
  
  if (metrics.etchUniformity < 88) {
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
  
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations.slice(0, 3);
}

function generatePrediction(params: ProcessParameters): PredictionResult {
  const radicalDistribution = simulateRadicalDistribution(params);
  const { metrics, status } = predictQualityMetrics(params, radicalDistribution);
  const recommendations = generateRecommendations(params, radicalDistribution, metrics, status);
  
  return {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    parameters: params,
    radicalDistribution,
    qualityMetrics: metrics,
    status,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
  };
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const path = event.path.replace('/.netlify/functions/api', '').replace('/api', '');
  const method = event.httpMethod;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    if (path === '/predictions' || path === '/predictions/') {
      if (method === 'GET') {
        const allPredictions = Array.from(predictions.values())
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(allPredictions),
        };
      }

      if (method === 'DELETE') {
        predictions.clear();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true }),
        };
      }
    }

    if (path.startsWith('/predictions/') && method === 'GET') {
      const id = path.replace('/predictions/', '');
      const prediction = predictions.get(id);
      if (!prediction) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Prediction not found' }),
        };
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(prediction),
      };
    }

    if ((path === '/predict' || path === '/predict/') && method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const prediction = generatePrediction(body);
      predictions.set(prediction.id, prediction);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(prediction),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' }),
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
