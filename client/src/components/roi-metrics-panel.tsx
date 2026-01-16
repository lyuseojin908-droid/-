import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RoiMetrics, PredictionResult } from "@shared/schema";
import { DollarSign, TrendingDown, TrendingUp, Package, Percent } from "lucide-react";

interface RoiMetricsPanelProps {
  roiMetrics: RoiMetrics | null | undefined;
  status: PredictionResult["status"] | null;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function MetricItem({
  icon: Icon,
  label,
  value,
  isNegative,
  isWarning,
  testId,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  isNegative?: boolean;
  isWarning?: boolean;
  testId?: string;
}) {
  const colorClass = isNegative 
    ? "text-red-500" 
    : isWarning 
    ? "text-yellow-500" 
    : "text-green-500";

  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50" data-testid={testId}>
      <div className={`p-2 rounded-md ${isNegative ? 'bg-red-500/10' : isWarning ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`font-mono text-lg font-bold ${colorClass}`} data-testid={testId ? `${testId}-value` : undefined}>
          {value}
        </span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card data-testid="roi-empty-state">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <DollarSign className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground" data-testid="text-roi-empty">
          ROI metrics will appear after prediction
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RoiMetricsPanel({ roiMetrics, status, isLoading }: RoiMetricsPanelProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (!roiMetrics || !status) {
    return <EmptyState />;
  }

  const isDanger = status === "danger";
  const isWarning = status === "warning";
  const profitIsNegative = roiMetrics.estimatedBatchProfit < 0;

  return (
    <Card data-testid="card-roi-metrics">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg" data-testid="text-roi-title">
              <DollarSign className="h-5 w-5 text-primary" />
              ROI Metrics
            </CardTitle>
            <CardDescription data-testid="text-roi-description">
              Economic impact analysis
            </CardDescription>
          </div>
          <Badge 
            variant={isDanger ? "destructive" : isWarning ? "outline" : "default"}
            className="font-mono"
            data-testid="badge-yield-rate"
          >
            <Percent className="h-3 w-3 mr-1" />
            {roiMetrics.yieldRate}% Yield
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <MetricItem
          icon={profitIsNegative ? TrendingDown : TrendingUp}
          label="Estimated Batch Profit"
          value={formatCurrency(roiMetrics.estimatedBatchProfit)}
          isNegative={profitIsNegative}
          testId="metric-batch-profit"
        />

        {(isDanger || isWarning) && roiMetrics.potentialLossReduction > 0 && (
          <MetricItem
            icon={TrendingDown}
            label="Potential Loss Reduction"
            value={formatCurrency(roiMetrics.potentialLossReduction)}
            isNegative={isDanger}
            isWarning={isWarning}
            testId="metric-loss-reduction"
          />
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30" data-testid="metric-wafer-cost">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Wafer Cost</span>
              <span className="font-mono text-sm">{formatCurrency(roiMetrics.waferCost)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/30" data-testid="metric-batch-size">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Batch Size</span>
              <span className="font-mono text-sm">{roiMetrics.batchSize} wafers</span>
            </div>
          </div>
        </div>

        {isDanger && (
          <div className="mt-3 p-3 rounded-md bg-red-500/10 border border-red-500/20" data-testid="alert-danger-loss">
            <p className="text-sm text-red-500 font-medium">
              Expected loss of {formatCurrency(Math.abs(roiMetrics.potentialLossReduction))} compared to optimal conditions.
              Recommend adjusting process parameters.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
