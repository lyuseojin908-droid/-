import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { processParametersSchema, type ProcessParameters } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Zap, Gauge, Wind, Timer, Activity, Play, Wrench } from "lucide-react";

interface ProcessParameterFormProps {
  onSubmit: (data: ProcessParameters) => void;
  isLoading?: boolean;
}

export function ProcessParameterForm({ onSubmit, isLoading }: ProcessParameterFormProps) {
  const form = useForm<ProcessParameters>({
    resolver: zodResolver(processParametersSchema),
    defaultValues: {
      rfPower: 800,
      pressure: 20,
      gasFlowCF4: 80,
      gasFlowO2: 20,
      gasFlowAr: 50,
      pulseEnabled: false,
      pulseDutyCycle: 50,
      pulseFrequency: 1000,
      processTime: 120,
      chamberRfHours: 0,
    },
  });

  const pulseEnabled = form.watch("pulseEnabled");

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Process Parameters
        </CardTitle>
        <CardDescription>
          Configure etching process conditions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="rfPower"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    RF Power (W)
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={100}
                        max={2000}
                        step={50}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        data-testid="slider-rf-power"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>100W</span>
                        <span className="font-mono font-medium text-foreground">{field.value}W</span>
                        <span>2000W</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pressure"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-muted-foreground">
                    <Gauge className="h-4 w-4" />
                    Chamber Pressure (mTorr)
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={1}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        data-testid="slider-pressure"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span className="font-mono font-medium text-foreground">{field.value} mTorr</span>
                        <span>100</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel className="flex items-center gap-2 text-muted-foreground">
                <Wind className="h-4 w-4" />
                Gas Flow Rates (sccm)
              </FormLabel>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="gasFlowCF4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">CF4</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="font-mono"
                          data-testid="input-gas-cf4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gasFlowO2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">O2</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="font-mono"
                          data-testid="input-gas-o2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gasFlowAr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Ar</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="font-mono"
                          data-testid="input-gas-ar"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <FormField
                control={form.control}
                name="pulseEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Pulse Mode
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-pulse-mode"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {pulseEnabled && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="pulseDutyCycle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Duty Cycle (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? 50}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="font-mono"
                            data-testid="input-duty-cycle"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="pulseFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Frequency (Hz)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? 1000}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            className="font-mono"
                            data-testid="input-pulse-frequency"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="processTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-muted-foreground">
                    <Timer className="h-4 w-4" />
                    Process Time (seconds)
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={10}
                        max={600}
                        step={10}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        data-testid="slider-process-time"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>10s</span>
                        <span className="font-mono font-medium text-foreground">{field.value}s</span>
                        <span>600s</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="chamberRfHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-muted-foreground">
                    <Wrench className="h-4 w-4" />
                    Chamber Condition (RF Hours)
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={500}
                        step={10}
                        value={[field.value ?? 0]}
                        onValueChange={(v) => field.onChange(v[0])}
                        data-testid="slider-rf-hours"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="text-green-500">0h (New)</span>
                        <span className="font-mono font-medium text-foreground">{field.value ?? 0}h</span>
                        <span className="text-red-500">500h (Aged)</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-run-prediction"
            >
              {isLoading ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Prediction
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
