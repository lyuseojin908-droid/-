import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PredictionResult } from "@shared/schema";
import { History, Trash2, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

interface PredictionHistoryProps {
  predictions: PredictionResult[];
  onSelect: (prediction: PredictionResult) => void;
  onClear: () => void;
  selectedId?: string;
}

function StatusIcon({ status, testId }: { status: PredictionResult["status"]; testId?: string }) {
  switch (status) {
    case "safe":
      return <CheckCircle2 className="h-4 w-4 text-green-500" data-testid={testId} />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" data-testid={testId} />;
    case "danger":
      return <XCircle className="h-4 w-4 text-red-500" data-testid={testId} />;
  }
}

function HistoryItem({
  prediction,
  isSelected,
  onClick,
}: {
  prediction: PredictionResult;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left rounded-md border transition-colors hover-elevate ${
        isSelected ? 'bg-primary/10 border-primary/50' : 'border-transparent'
      }`}
      data-testid={`history-item-${prediction.id}`}
    >
      <div className="flex items-start gap-3">
        <StatusIcon status={prediction.status} testId={`icon-status-${prediction.id}`} />
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate" data-testid={`text-history-params-${prediction.id}`}>
              {prediction.parameters.rfPower}W / {prediction.parameters.pressure}mTorr
            </span>
            <Badge variant="secondary" className="text-xs" data-testid={`badge-history-uniformity-${prediction.id}`}>
              {prediction.qualityMetrics.etchUniformity.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span data-testid={`text-history-timestamp-${prediction.id}`}>
              {format(new Date(prediction.timestamp), "MMM d, HH:mm:ss")}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate" data-testid={`text-history-gas-${prediction.id}`}>
            CF4: {prediction.parameters.gasFlowCF4} / O2: {prediction.parameters.gasFlowO2} / Ar: {prediction.parameters.gasFlowAr}
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="history-empty-state">
      <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="text-sm text-muted-foreground" data-testid="text-history-empty-title">No predictions yet</p>
      <p className="text-xs text-muted-foreground mt-1" data-testid="text-history-empty-desc">
        Run a simulation to see history
      </p>
    </div>
  );
}

export function PredictionHistory({
  predictions,
  onSelect,
  onClear,
  selectedId,
}: PredictionHistoryProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg" data-testid="text-history-title">
              <History className="h-5 w-5 text-primary" />
              Prediction History
            </CardTitle>
            <CardDescription data-testid="text-history-count">
              {predictions.length > 0 
                ? `${predictions.length} simulation${predictions.length > 1 ? 's' : ''}`
                : 'Recent simulations'
              }
            </CardDescription>
          </div>
          {predictions.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClear}
              data-testid="button-clear-history"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        {predictions.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyHistory />
          </div>
        ) : (
          <ScrollArea className="h-full px-4 pb-4">
            <div className="space-y-2">
              {predictions.map((prediction) => (
                <HistoryItem
                  key={prediction.id}
                  prediction={prediction}
                  isSelected={prediction.id === selectedId}
                  onClick={() => onSelect(prediction)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
