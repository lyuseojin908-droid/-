import { useMemo, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { RadicalDistribution } from "@shared/schema";
import { Atom, Box, Layers, ArrowDownUp, Target, Flame, Clock, Waves } from "lucide-react";
import Plot from "react-plotly.js";

interface Chamber3DProps {
  distribution: RadicalDistribution | null;
  isLoading?: boolean;
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

function Chamber3DVisualization({ distribution, selectedZ, onZChange }: { 
  distribution: RadicalDistribution; 
  selectedZ: number;
  onZChange: (z: number) => void;
}) {
  const plotData = useMemo(() => {
    const grid3D = distribution.grid3D;
    if (!grid3D || grid3D.length === 0) return null;

    const zSize = grid3D.length;
    const ySize = grid3D[0].length;
    const xSize = grid3D[0][0].length;

    const x: number[] = [];
    const y: number[] = [];
    const z: number[] = [];
    const values: number[] = [];

    for (let k = 0; k < zSize; k++) {
      for (let j = 0; j < ySize; j++) {
        for (let i = 0; i < xSize; i++) {
          x.push(i - xSize / 2);
          y.push(j - ySize / 2);
          z.push(k);
          values.push(grid3D[k][j][i]);
        }
      }
    }

    return { x, y, z, values, xSize, ySize, zSize };
  }, [distribution.grid3D]);

  const sliceData = useMemo(() => {
    const grid3D = distribution.grid3D;
    if (!grid3D || selectedZ >= grid3D.length) return null;
    return grid3D[selectedZ];
  }, [distribution.grid3D, selectedZ]);

  if (!plotData) return null;

  const { values, xSize, ySize, zSize } = plotData;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const isoData: Plotly.Data[] = [
    {
      type: "isosurface" as const,
      x: plotData.x,
      y: plotData.y,
      z: plotData.z,
      value: plotData.values,
      isomin: minVal + (maxVal - minVal) * 0.3,
      isomax: maxVal * 0.95,
      opacity: 0.6,
      surface: { count: 4 },
      colorscale: [
        [0, "rgb(30, 58, 138)"],
        [0.2, "rgb(6, 182, 212)"],
        [0.4, "rgb(34, 197, 94)"],
        [0.6, "rgb(250, 204, 21)"],
        [0.8, "rgb(249, 115, 22)"],
        [1, "rgb(239, 68, 68)"],
      ],
      showscale: true,
      colorbar: {
        title: "Density",
        thickness: 15,
        len: 0.7,
        x: 1.02,
        tickfont: { color: "#888", size: 10 },
        titlefont: { color: "#888", size: 11 },
      },
      caps: {
        x: { show: false },
        y: { show: false },
        z: { show: false },
      },
    } as Plotly.Data,
  ];

  const layout: Partial<Plotly.Layout> = {
    autosize: true,
    margin: { l: 0, r: 0, t: 0, b: 0, pad: 0 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    scene: {
      xaxis: {
        title: "X (cm)",
        tickfont: { color: "#888", size: 10 },
        titlefont: { color: "#aaa", size: 11 },
        gridcolor: "#333",
        zerolinecolor: "#444",
        showbackground: true,
        backgroundcolor: "rgba(20, 20, 30, 0.5)",
        range: [-xSize / 2 - 1, xSize / 2 + 1],
      },
      yaxis: {
        title: "Y (cm)",
        tickfont: { color: "#888", size: 10 },
        titlefont: { color: "#aaa", size: 11 },
        gridcolor: "#333",
        zerolinecolor: "#444",
        showbackground: true,
        backgroundcolor: "rgba(20, 20, 30, 0.5)",
        range: [-ySize / 2 - 1, ySize / 2 + 1],
      },
      zaxis: {
        title: "Height (layer)",
        tickfont: { color: "#888", size: 10 },
        titlefont: { color: "#aaa", size: 11 },
        gridcolor: "#333",
        zerolinecolor: "#444",
        showbackground: true,
        backgroundcolor: "rgba(20, 20, 30, 0.5)",
        range: [-0.5, zSize + 0.5],
      },
      camera: {
        eye: { x: 1.5, y: 1.5, z: 1.2 },
        center: { x: 0, y: 0, z: 0 },
      },
      aspectmode: "manual",
      aspectratio: { x: 1, y: 1, z: 0.5 },
    },
    showlegend: false,
  };

  const config: Partial<Plotly.Config> = {
    displayModeBar: true,
    modeBarButtonsToRemove: ["toImage", "sendDataToCloud"] as any,
    displaylogo: false,
    responsive: true,
    scrollZoom: true,
  };

  return (
    <div className="space-y-4">
      <div 
        className="w-full rounded-lg overflow-hidden bg-background/50" 
        style={{ height: "400px" }}
        data-testid="chamber-3d-plot"
      >
        <Plot
          data={isoData}
          layout={layout}
          config={config}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler={true}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm" data-testid="label-z-slice">
            <Layers className="h-4 w-4" />
            Z-Slice (Height Layer): {selectedZ}
          </Label>
          <Badge variant="outline" className="font-mono" data-testid="badge-z-layer">
            Layer {selectedZ}/{(distribution.dimensions?.z || 10) - 1}
          </Badge>
        </div>
        <Slider
          value={[selectedZ]}
          onValueChange={(v) => onZChange(v[0])}
          max={(distribution.dimensions?.z || 10) - 1}
          min={0}
          step={1}
          className="w-full"
          data-testid="slider-z-slice"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span data-testid="text-wafer">Wafer (Bottom)</span>
          <span data-testid="text-showerhead">Showerhead (Top)</span>
        </div>
      </div>

      {sliceData && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2" data-testid="text-2d-slice-title">
            <Target className="h-4 w-4" />
            2D Slice at Height {selectedZ}
          </h4>
          <div 
            className="grid gap-0.5 rounded-lg overflow-hidden"
            style={{ 
              gridTemplateColumns: `repeat(${sliceData[0]?.length || 20}, 1fr)`,
              aspectRatio: '1',
              maxHeight: '200px',
            }}
            data-testid="heatmap-2d-slice"
          >
            {sliceData.map((row, i) =>
              row.map((value, j) => {
                const normalized = (value - Math.min(...sliceData.flat())) / 
                  (Math.max(...sliceData.flat()) - Math.min(...sliceData.flat()));
                return (
                  <div
                    key={`${i}-${j}`}
                    className="aspect-square"
                    style={{ 
                      backgroundColor: interpolateColor(normalized),
                    }}
                    title={`Density: ${value.toFixed(3)}`}
                    data-testid={`slice-cell-${i}-${j}`}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function interpolateColor(normalized: number): string {
  const colors = [
    { r: 30, g: 58, b: 138 },
    { r: 6, g: 182, b: 212 },
    { r: 34, g: 197, b: 94 },
    { r: 250, g: 204, b: 21 },
    { r: 249, g: 115, b: 22 },
    { r: 239, g: 68, b: 68 },
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

function EmptyState() {
  return (
    <div 
      className="h-[400px] rounded-lg border-2 border-dashed border-muted flex flex-col items-center justify-center gap-3 text-muted-foreground"
      data-testid="chamber-3d-empty-state"
    >
      <Box className="h-12 w-12" />
      <p className="text-sm" data-testid="text-3d-empty">Run prediction to visualize 3D chamber</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div 
      className="h-[400px] rounded-lg bg-muted/50 flex items-center justify-center" 
      data-testid="chamber-3d-loading-state"
    >
      <div className="flex flex-col items-center gap-3">
        <Atom className="h-12 w-12 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground" data-testid="text-3d-loading">
          Simulating 3D plasma distribution...
        </p>
      </div>
    </div>
  );
}

export function Chamber3D({ distribution, isLoading }: Chamber3DProps) {
  const [selectedZ, setSelectedZ] = useState(5);

  const handleZChange = useCallback((z: number) => {
    setSelectedZ(z);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg" data-testid="text-3d-title">
              <Box className="h-5 w-5 text-primary" />
              3D Chamber Digital Twin
            </CardTitle>
            <CardDescription data-testid="text-3d-description">
              Interactive 3D plasma radical distribution visualization
            </CardDescription>
          </div>
          {distribution?.dimensions && (
            <Badge variant="secondary" className="font-mono" data-testid="badge-3d-dimensions">
              {distribution.dimensions.x}x{distribution.dimensions.y}x{distribution.dimensions.z}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <LoadingState />
        ) : distribution?.grid3D ? (
          <Chamber3DVisualization 
            distribution={distribution} 
            selectedZ={selectedZ}
            onZChange={handleZChange}
          />
        ) : (
          <EmptyState />
        )}
        
        {distribution && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pt-2" data-testid="chamber-3d-metrics">
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
              icon={Layers}
              label="Vertical Uniformity"
              value={distribution.verticalUniformity || 0}
              unit="%"
              testId="metric-vertical-uniformity"
            />
            <MetricBadge
              icon={Waves}
              label="Wall Loss Factor"
              value={(distribution.wallLossFactor || 0) * 100}
              unit="%"
              testId="metric-wall-loss"
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
