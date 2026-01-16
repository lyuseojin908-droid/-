import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RadicalDistribution } from "@shared/schema";
import { Atom, Target, ArrowDownUp, Flame, Clock } from "lucide-react";

interface RadicalHeatmapProps {
  distribution: RadicalDistribution | null;
  isLoading?: boolean;
}

function interpolateColor(value: number, min: number, max: number): string {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  
  // Dark blue -> Cyan -> Green -> Yellow -> Orange -> Red
  const colors = [
    { r: 30, g: 58, b: 138 },    // Dark blue
    { r: 6, g: 182, b: 212 },    // Cyan
    { r: 34, g: 197, b: 94 },    // Green
    { r: 250, g: 204, b: 21 },   // Yellow
    { r: 249, g: 115, b: 22 },   // Orange
    { r: 239, g: 68, b: 68 },    // Red
  ];
  
  const segmentSize = 1 / (colors.length - 1);
  const segmentIndex = Math.min(Math.floor(normalized / segmentSize), colors.length - 2);
  const segmentProgress = (normalized - segmentIndex * segmentSize) / segmentSize;
  
  const c1 = colors[segmentIndex];
  const c2 = colors[segmentIndex + 1];
  
  const r = Math.round(c1.r + (c2.r - c1.r) * segmentProgress);
  const g = Math.round(c1.g + (c2.g - c1.g) * segmentProgress);
  const b = Math.round(c1.b + (c2.b - c1.b) * segmentProgress);
  
  return `rgb(${r}, ${g}, ${b})`;
}

function HeatmapGrid({ grid }: { grid: number[][] }) {
  const { min, max } = useMemo(() => {
    const flat = grid.flat();
    return {
      min: Math.min(...flat),
      max: Math.max(...flat),
    };
  }, [grid]);

  return (
    <div className="relative" data-testid="heatmap-grid-container">
      <div 
        className="grid gap-0.5 rounded-lg overflow-hidden"
        style={{ 
          gridTemplateColumns: `repeat(${grid[0]?.length || 0}, 1fr)`,
          aspectRatio: '1',
        }}
        data-testid="heatmap-grid"
      >
        {grid.map((row, i) =>
          row.map((value, j) => (
            <div
              key={`${i}-${j}`}
              className="aspect-square transition-colors duration-300"
              style={{ backgroundColor: interpolateColor(value, min, max) }}
              title={`Density: ${value.toFixed(3)}`}
              data-testid={`heatmap-cell-${i}-${j}`}
            />
          ))
        )}
      </div>
      
      {/* Axis labels */}
      <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-xs text-muted-foreground" data-testid="heatmap-y-axis">
        <span data-testid="text-axis-top">Top</span>
        <span data-testid="text-axis-bottom">Bottom</span>
      </div>
      <div className="absolute left-0 right-0 -bottom-5 flex justify-between text-xs text-muted-foreground" data-testid="heatmap-x-axis">
        <span data-testid="text-axis-edge-left">Edge</span>
        <span data-testid="text-axis-center">Center</span>
        <span data-testid="text-axis-edge-right">Edge</span>
      </div>
      
      {/* Chamber outline overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <ellipse
            cx="50"
            cy="50"
            rx="48"
            ry="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-white/30"
            strokeDasharray="4 2"
          />
        </svg>
      </div>
    </div>
  );
}

function EmptyHeatmap() {
  return (
    <div 
      className="aspect-square rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center gap-3 text-muted-foreground"
      data-testid="heatmap-empty-state"
    >
      <Target className="h-12 w-12" />
      <p className="text-sm" data-testid="text-heatmap-empty">Run prediction to visualize radical distribution</p>
    </div>
  );
}

function LoadingHeatmap() {
  return (
    <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center" data-testid="heatmap-loading-state">
      <div className="flex flex-col items-center gap-3">
        <Atom className="h-12 w-12 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground" data-testid="text-heatmap-loading">Simulating plasma...</p>
      </div>
    </div>
  );
}

function ColorScale() {
  return (
    <div className="flex items-center gap-2 mt-4" data-testid="heatmap-color-scale">
      <span className="text-xs text-muted-foreground" data-testid="text-scale-low">Low</span>
      <div 
        className="flex-1 h-3 rounded-full"
        style={{
          background: 'linear-gradient(to right, rgb(30, 58, 138), rgb(6, 182, 212), rgb(34, 197, 94), rgb(250, 204, 21), rgb(249, 115, 22), rgb(239, 68, 68))'
        }}
        data-testid="heatmap-gradient"
      />
      <span className="text-xs text-muted-foreground" data-testid="text-scale-high">High</span>
    </div>
  );
}

function MetricBadge({ 
  icon: Icon, 
  label, 
  value, 
  unit,
  testId
}: { 
  icon: typeof Target;
  label: string;
  value: number;
  unit: string;
  testId?: string;
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50" data-testid={testId}>
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-sm font-medium" data-testid={testId ? `${testId}-value` : undefined}>
          {value.toFixed(2)} {unit}
        </span>
      </div>
    </div>
  );
}

export function RadicalHeatmap({ distribution, isLoading }: RadicalHeatmapProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg" data-testid="text-heatmap-title">
              <Atom className="h-5 w-5 text-primary" />
              2D Radical Distribution
            </CardTitle>
            <CardDescription data-testid="text-heatmap-description">
              Chamber cross-section radical density map
            </CardDescription>
          </div>
          {distribution && (
            <Badge variant="secondary" className="font-mono" data-testid="badge-grid-size">
              {distribution.grid.length}x{distribution.grid[0]?.length || 0}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="pl-6 pb-6">
          {isLoading ? (
            <LoadingHeatmap />
          ) : distribution ? (
            <HeatmapGrid grid={distribution.grid} />
          ) : (
            <EmptyHeatmap />
          )}
        </div>
        
        {distribution && <ColorScale />}
        
        {distribution && (
          <div className="grid grid-cols-2 gap-2 pt-2" data-testid="heatmap-metrics-grid">
            <MetricBadge
              icon={Target}
              label="Center/Edge Ratio"
              value={distribution.centerEdgeRatio}
              unit=""
              testId="metric-center-edge-ratio"
            />
            <MetricBadge
              icon={ArrowDownUp}
              label="Top/Bottom Gradient"
              value={distribution.topBottomGradient}
              unit=""
              testId="metric-top-bottom-gradient"
            />
            <MetricBadge
              icon={Flame}
              label="High-Energy Fraction"
              value={distribution.highEnergyFraction * 100}
              unit="%"
              testId="metric-high-energy-fraction"
            />
            <MetricBadge
              icon={Clock}
              label="Residence Time Index"
              value={distribution.residenceTimeIndex}
              unit="ms"
              testId="metric-residence-time"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
