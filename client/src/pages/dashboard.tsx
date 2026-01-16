import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProcessParameterForm } from "@/components/process-parameter-form";
import { RadicalHeatmap } from "@/components/radical-heatmap";
import { QualityMetricsCards } from "@/components/quality-metrics-cards";
import { PredictionHistory } from "@/components/prediction-history";
import { SEO } from "@/components/seo";
import { apiRequest } from "@/lib/queryClient";
import type { ProcessParameters, PredictionResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);

  const { data: predictions = [] } = useQuery<PredictionResult[]>({
    queryKey: ["/api/predictions"],
  });

  const predictionMutation = useMutation({
    mutationFn: async (params: ProcessParameters) => {
      const response = await apiRequest("POST", "/api/predict", params);
      return response.json() as Promise<PredictionResult>;
    },
    onSuccess: (result) => {
      setCurrentPrediction(result);
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      
      const statusMessages = {
        safe: "Process conditions are within safe operating range.",
        warning: "Potential quality issues detected. Review parameters.",
        danger: "High defect risk! Recommend parameter adjustment.",
      };
      
      toast({
        title: `Prediction Complete - ${result.status.toUpperCase()}`,
        description: statusMessages[result.status],
        variant: result.status === "danger" ? "destructive" : "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = useCallback((params: ProcessParameters) => {
    predictionMutation.mutate(params);
  }, [predictionMutation]);

  const handleSelectPrediction = useCallback((prediction: PredictionResult) => {
    setCurrentPrediction(prediction);
  }, []);

  const handleClearHistory = useCallback(async () => {
    try {
      await apiRequest("DELETE", "/api/predictions");
      queryClient.invalidateQueries({ queryKey: ["/api/predictions"] });
      setCurrentPrediction(null);
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
  }, [queryClient, toast]);

  return (
    <div className="h-full overflow-auto p-6">
      <SEO
        title="Dashboard | Virtual Radical Sensor - Plasma Digital Twin"
        description="Physics-informed AI dashboard for semiconductor EUV etching process optimization. Predict plasma radical distribution and etching quality in real-time."
      />
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            Virtual Radical Sensor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Physics-informed AI for plasma etch process optimization
          </p>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column - Parameters and History */}
          <div className="xl:col-span-3 space-y-6">
            <ProcessParameterForm
              onSubmit={handleSubmit}
              isLoading={predictionMutation.isPending}
            />
            <div className="hidden xl:block h-[400px]">
              <PredictionHistory
                predictions={predictions}
                onSelect={handleSelectPrediction}
                onClear={handleClearHistory}
                selectedId={currentPrediction?.id}
              />
            </div>
          </div>

          {/* Center Column - Heatmap */}
          <div className="xl:col-span-5">
            <RadicalHeatmap
              distribution={currentPrediction?.radicalDistribution ?? null}
              isLoading={predictionMutation.isPending}
            />
          </div>

          {/* Right Column - History (visible on smaller screens) */}
          <div className="xl:col-span-4 space-y-6">
            <QualityMetricsCards
              metrics={currentPrediction?.qualityMetrics ?? null}
              status={currentPrediction?.status ?? null}
              isLoading={predictionMutation.isPending}
            />
            <div className="xl:hidden h-[400px]">
              <PredictionHistory
                predictions={predictions}
                onSelect={handleSelectPrediction}
                onClear={handleClearHistory}
                selectedId={currentPrediction?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
