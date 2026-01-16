import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadicalHeatmap } from "@/components/radical-heatmap";
import { QualityMetricsCards } from "@/components/quality-metrics-cards";
import { SEO } from "@/components/seo";
import { apiRequest } from "@/lib/queryClient";
import type { PredictionResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { History, CheckCircle2, AlertTriangle, XCircle, Trash2, Eye } from "lucide-react";

function StatusBadge({ status }: { status: PredictionResult["status"] }) {
  const config = {
    safe: { icon: CheckCircle2, className: "bg-green-500/10 text-green-600 border-green-500/20" },
    warning: { icon: AlertTriangle, className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
    danger: { icon: XCircle, className: "bg-red-500/10 text-red-600 border-red-500/20" },
  };
  const { icon: Icon, className } = config[status];
  
  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {status.toUpperCase()}
    </Badge>
  );
}

export default function HistoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionResult | null>(null);

  const { data: predictions = [], isLoading } = useQuery<PredictionResult[]>({
    queryKey: ["/api/predictions"],
  });

  const handleClearAll = async () => {
    try {
      await apiRequest("DELETE", "/api/predictions");
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      setSelectedPrediction(null);
      toast({
        title: "History Cleared",
        description: "All prediction records have been removed.",
      });
    } catch {
      toast({
        title: "Failed to clear history",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <SEO
        title="Prediction History | Virtual Radical Sensor"
        description="Review and compare past plasma simulation results. Analyze historical prediction data for semiconductor etching process optimization."
      />
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
              <History className="h-6 w-6 text-primary" />
              Prediction History
            </h1>
            <p className="text-muted-foreground">
              Review and compare past simulation results
            </p>
          </div>
          {predictions.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              data-testid="button-clear-all"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {predictions.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <History className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground">No History Yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Run predictions from the Dashboard to see them here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">All Predictions</CardTitle>
                <CardDescription>{predictions.length} records</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Parameters</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uniformity</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {predictions.map((prediction) => (
                        <TableRow 
                          key={prediction.id}
                          className={`cursor-pointer ${selectedPrediction?.id === prediction.id ? 'bg-muted' : ''}`}
                          onClick={() => setSelectedPrediction(prediction)}
                          data-testid={`row-prediction-${prediction.id}`}
                        >
                          <TableCell className="font-mono text-xs">
                            {format(new Date(prediction.timestamp), "MMM d, HH:mm")}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {prediction.parameters.rfPower}W / {prediction.parameters.pressure}mTorr
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={prediction.status} />
                          </TableCell>
                          <TableCell className="font-mono">
                            {prediction.qualityMetrics.etchUniformity.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPrediction(prediction);
                              }}
                              data-testid={`button-view-prediction-${prediction.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Detail View */}
            <div className="space-y-6">
              {selectedPrediction ? (
                <>
                  <RadicalHeatmap
                    distribution={selectedPrediction.radicalDistribution}
                  />
                  <QualityMetricsCards
                    metrics={selectedPrediction.qualityMetrics}
                    status={selectedPrediction.status}
                  />
                </>
              ) : (
                <Card className="h-[600px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Select a prediction to view details</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
