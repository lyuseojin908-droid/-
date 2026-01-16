import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { QualityMetrics, PredictionResult } from "@shared/schema";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Ruler, ShieldAlert, Activity } from "lucide-react";

interface QualityMetricsCardsProps {
  metrics: QualityMetrics | null;
  status: PredictionResult["status"] | null;
  isLoading?: boolean;
}

function StatusBadge({ status }: { status: PredictionResult["status"] }) {
  const config = {
    safe: {
      label: "SAFE",
      icon: CheckCircle2,
      className: "bg-green-500 text-white border-green-600",
    },
    warning: {
      label: "WARNING",
      icon: AlertTriangle,
      className: "bg-yellow-500 text-black border-yellow-600",
    },
    danger: {
      label: "DANGER",
      icon: XCircle,
      className: "bg-red-500 text-white border-red-600",
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <Badge className={`gap-1.5 px-3 py-1 ${className}`} data-testid="badge-status">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Badge>
  );
}

function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  status,
  description,
  progress,
}: {
  title: string;
  value: string | number;
  unit?: string;
  icon: typeof TrendingUp;
  status?: "good" | "warning" | "bad";
  description?: string;
  progress?: number;
}) {
  const statusColors = {
    good: "text-green-500",
    warning: "text-yellow-500",
    bad: "text-red-500",
  };
  const testIdSlug = title.toLowerCase().replace(/\s/g, '-');

  return (
    <Card data-testid={`card-metric-${testIdSlug}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span 
                className={`text-2xl font-bold font-mono ${status ? statusColors[status] : ''}`}
                data-testid={`text-metric-value-${testIdSlug}`}
              >
                {value}
              </span>
              {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground" data-testid={`text-metric-desc-${testIdSlug}`}>
                {description}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-md bg-muted ${status ? statusColors[status] : 'text-primary'}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {progress !== undefined && (
          <Progress value={progress} className="mt-3 h-1.5" data-testid={`progress-${testIdSlug}`} />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyMetrics() {
  return (
    <Card className="h-full" data-testid="metrics-empty-state">
      <CardContent className="h-full flex flex-col items-center justify-center py-12 text-center">
        <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground" data-testid="text-metrics-empty">
          Quality metrics will appear after prediction
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingMetrics() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                <div className="h-1.5 w-full bg-muted animate-pulse rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function QualityMetricsCards({ metrics, status, isLoading }: QualityMetricsCardsProps) {
  if (isLoading) {
    return <LoadingMetrics />;
  }

  if (!metrics || !status) {
    return <EmptyMetrics />;
  }

  const uniformityStatus = metrics.etchUniformity >= 95 ? "good" : metrics.etchUniformity >= 90 ? "warning" : "bad";
  const cdShiftStatus = Math.abs(metrics.cdShift) <= 1.5 ? "good" : Math.abs(metrics.cdShift) <= 3 ? "warning" : "bad";
  const riskStatus = metrics.defectRisk === "low" ? "good" : metrics.defectRisk === "medium" ? "warning" : "bad";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg" data-testid="text-quality-title">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quality Prediction
            </CardTitle>
            <CardDescription data-testid="text-quality-description">
              Estimated etching quality metrics
            </CardDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Etch Uniformity"
            value={metrics.etchUniformity.toFixed(1)}
            unit="%"
            icon={TrendingUp}
            status={uniformityStatus}
            description={uniformityStatus === "good" ? "Excellent uniformity" : uniformityStatus === "warning" ? "Acceptable range" : "Below threshold"}
            progress={metrics.etchUniformity}
          />
          <MetricCard
            title="CD Shift"
            value={metrics.cdShift > 0 ? `+${metrics.cdShift.toFixed(2)}` : metrics.cdShift.toFixed(2)}
            unit="nm"
            icon={Ruler}
            status={cdShiftStatus}
            description={cdShiftStatus === "good" ? "Within spec" : cdShiftStatus === "warning" ? "Near limit" : "Out of spec"}
            progress={Math.min(100, 100 - Math.abs(metrics.cdShift) * 10)}
          />
          <MetricCard
            title="Defect Risk"
            value={metrics.defectRisk.toUpperCase()}
            icon={ShieldAlert}
            status={riskStatus}
            description={`Risk score: ${metrics.defectRiskScore.toFixed(0)}%`}
            progress={100 - metrics.defectRiskScore}
          />
        </div>
      </CardContent>
    </Card>
  );
}
