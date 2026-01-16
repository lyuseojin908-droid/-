import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight, Lightbulb, Zap, Gauge, Wind, Timer } from "lucide-react";
import type { ParameterRecommendation } from "@shared/schema";

interface RecommendationsPanelProps {
  recommendations?: ParameterRecommendation[];
  status: "safe" | "warning" | "danger";
}

function getParameterIcon(parameter: string) {
  switch (parameter.toLowerCase()) {
    case "rf power":
      return Zap;
    case "pressure":
      return Gauge;
    case "ar flow":
    case "o2 flow":
    case "cf4 flow":
      return Wind;
    case "pulse mode":
      return Timer;
    default:
      return Lightbulb;
  }
}

function getPriorityColor(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
    case "medium":
      return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
    case "low":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  }
}

function getPriorityLabel(priority: "high" | "medium" | "low") {
  switch (priority) {
    case "high":
      return "긴급";
    case "medium":
      return "권장";
    case "low":
      return "참고";
  }
}

function formatValue(parameter: string, value: number): string {
  if (parameter.toLowerCase() === "pulse mode") {
    return value === 1 ? "ON" : "OFF";
  }
  
  const units: Record<string, string> = {
    "rf power": "W",
    "pressure": "mTorr",
    "ar flow": "sccm",
    "o2 flow": "sccm",
    "cf4 flow": "sccm",
  };
  
  const unit = units[parameter.toLowerCase()] || "";
  return `${value}${unit ? ` ${unit}` : ""}`;
}

function RecommendationCard({ recommendation }: { recommendation: ParameterRecommendation }) {
  const Icon = getParameterIcon(recommendation.parameter);
  const priorityClass = getPriorityColor(recommendation.priority);
  const priorityLabel = getPriorityLabel(recommendation.priority);
  
  return (
    <div 
      className={`p-4 rounded-lg border ${priorityClass}`}
      data-testid={`recommendation-${recommendation.parameter.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-md bg-background/50">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium" data-testid={`text-rec-param-${recommendation.parameter.toLowerCase().replace(/\s+/g, '-')}`}>
              {recommendation.parameter}
            </span>
            <Badge variant="outline" className="text-xs">
              {priorityLabel}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm font-mono" data-testid={`text-rec-values-${recommendation.parameter.toLowerCase().replace(/\s+/g, '-')}`}>
            <span className="text-muted-foreground">
              {formatValue(recommendation.parameter, recommendation.currentValue)}
            </span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-semibold">
              {formatValue(recommendation.parameter, recommendation.recommendedValue)}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-rec-reason-${recommendation.parameter.toLowerCase().replace(/\s+/g, '-')}`}>
            {recommendation.reason}
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyRecommendations() {
  return (
    <div 
      className="flex flex-col items-center justify-center py-8 text-center"
      data-testid="recommendations-empty-state"
    >
      <div className="p-3 rounded-full bg-green-500/10 mb-3">
        <Lightbulb className="h-6 w-6 text-green-500" />
      </div>
      <p className="text-sm font-medium text-green-600 dark:text-green-400" data-testid="text-recommendations-empty-title">
        공정 상태 양호
      </p>
      <p className="text-xs text-muted-foreground mt-1" data-testid="text-recommendations-empty-desc">
        현재 설정에서 추가 조정이 필요하지 않습니다
      </p>
    </div>
  );
}

export function RecommendationsPanel({ recommendations, status }: RecommendationsPanelProps) {
  const hasRecommendations = recommendations && recommendations.length > 0;
  
  return (
    <Card className={status === "danger" ? "border-red-500/30" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {status === "danger" && (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          )}
          <div>
            <CardTitle className="text-lg" data-testid="text-recommendations-title">
              {status === "danger" ? "조정 권장사항" : "공정 분석"}
            </CardTitle>
            <CardDescription data-testid="text-recommendations-description">
              {status === "danger" 
                ? "DANGER 상태 해결을 위한 파라미터 조정 가이드"
                : status === "warning"
                ? "WARNING 개선을 위한 제안"
                : "현재 공정 상태 분석"
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasRecommendations ? (
          <div className="space-y-3" data-testid="recommendations-list">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={`${rec.parameter}-${index}`} recommendation={rec} />
            ))}
          </div>
        ) : (
          <EmptyRecommendations />
        )}
      </CardContent>
    </Card>
  );
}
