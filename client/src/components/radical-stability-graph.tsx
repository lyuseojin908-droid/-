import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StabilityDataPoint, PredictionResult } from "@shared/schema";
import { Activity, Clock, Thermometer, Atom } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";

interface RadicalStabilityGraphProps {
  stabilityData: StabilityDataPoint[] | null | undefined;
  status: PredictionResult["status"] | null;
  processTime: number;
  isLoading?: boolean;
}

function EmptyState() {
  return (
    <Card data-testid="stability-empty-state">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground" data-testid="text-stability-empty">
          Stability graph will appear after prediction
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-5 w-48 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-[200px] bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

export function RadicalStabilityGraph({ 
  stabilityData, 
  status, 
  processTime, 
  isLoading 
}: RadicalStabilityGraphProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!stabilityData || stabilityData.length === 0 || !status) {
    return <EmptyState />;
  }

  const chartData = useMemo(() => {
    return stabilityData.map((point) => ({
      ...point,
      uniformityNorm: point.uniformity,
      densityNorm: point.radicalDensity * 100,
      tempNorm: point.temperature * 100,
    }));
  }, [stabilityData]);

  const avgUniformity = useMemo(() => {
    const sum = stabilityData.reduce((acc, p) => acc + p.uniformity, 0);
    return (sum / stabilityData.length).toFixed(1);
  }, [stabilityData]);

  const uniformityVariance = useMemo(() => {
    const avg = stabilityData.reduce((acc, p) => acc + p.uniformity, 0) / stabilityData.length;
    const variance = stabilityData.reduce((acc, p) => acc + Math.pow(p.uniformity - avg, 2), 0) / stabilityData.length;
    return Math.sqrt(variance).toFixed(2);
  }, [stabilityData]);

  const isDanger = status === "danger";
  const isWarning = status === "warning";

  return (
    <Card data-testid="card-stability-graph">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg" data-testid="text-stability-title">
              <Activity className="h-5 w-5 text-primary" />
              Radical Stability Graph
            </CardTitle>
            <CardDescription data-testid="text-stability-description">
              Time-series process stability analysis
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="font-mono" data-testid="badge-avg-uniformity">
              Avg: {avgUniformity}%
            </Badge>
            <Badge 
              variant={parseFloat(uniformityVariance) > 2 ? "destructive" : "secondary"} 
              className="font-mono"
              data-testid="badge-variance"
            >
              ±{uniformityVariance}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]" data-testid="stability-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#888' }}
                tickFormatter={(v) => `${v}s`}
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#888' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#888' }}
                domain={[0, 100]}
                label={{ value: '%', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelFormatter={(v) => `Time: ${v}s`}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    uniformityNorm: 'Uniformity',
                    densityNorm: 'Density',
                    tempNorm: 'Temperature',
                  };
                  return [`${value.toFixed(1)}%`, labels[name] || name];
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    uniformityNorm: 'Uniformity (%)',
                    densityNorm: 'Radical Density',
                    tempNorm: 'Temperature',
                  };
                  return labels[value] || value;
                }}
              />
              <ReferenceLine y={88} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Warning', fontSize: 9, fill: '#f59e0b' }} />
              <ReferenceLine y={94} stroke="#22c55e" strokeDasharray="5 5" label={{ value: 'Safe', fontSize: 9, fill: '#22c55e' }} />
              <Line 
                type="monotone" 
                dataKey="uniformityNorm" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="densityNorm" 
                stroke="#10b981" 
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3 }}
                strokeDasharray="5 5"
              />
              <Line 
                type="monotone" 
                dataKey="tempNorm" 
                stroke="#f97316" 
                strokeWidth={1}
                dot={false}
                activeDot={{ r: 3 }}
                opacity={0.7}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
          <div className="flex items-center gap-2 text-xs" data-testid="legend-ramp">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Ramp: 0-{Math.floor(processTime * 0.1)}s</span>
          </div>
          <div className="flex items-center gap-2 text-xs" data-testid="legend-steady">
            <Atom className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-muted-foreground">Steady: {Math.floor(processTime * 0.1)}-{Math.floor(processTime * 0.8)}s</span>
          </div>
          <div className="flex items-center gap-2 text-xs" data-testid="legend-stable">
            <Thermometer className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-muted-foreground">Stable: {Math.floor(processTime * 0.8)}s+</span>
          </div>
        </div>

        {isDanger && (
          <div className="mt-3 p-2 rounded-md bg-red-500/10 border border-red-500/20" data-testid="alert-stability-danger">
            <p className="text-xs text-red-500">
              High process instability detected. Consider enabling pulse mode or adjusting chamber conditions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
