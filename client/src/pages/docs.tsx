import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SEO } from "@/components/seo";
import { 
  BookOpen, 
  Atom, 
  Brain, 
  Target, 
  Gauge, 
  Zap, 
  Wind,
  Activity,
  TrendingUp,
  Shield
} from "lucide-react";

function Section({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: typeof BookOpen; 
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        {title}
      </h3>
      <div className="text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <SEO
        title="Documentation | Virtual Radical Sensor"
        description="Learn about the Virtual Radical Sensor system, physics-informed AI, process parameters, and quality prediction metrics for semiconductor etching."
      />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <BookOpen className="h-6 w-6 text-primary" />
            Documentation
          </h1>
          <p className="text-muted-foreground">
            Understanding the Virtual Radical Sensor system
          </p>
        </div>

        {/* Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Atom className="h-5 w-5 text-primary" />
              System Overview
            </CardTitle>
            <CardDescription>
              Physics-Informed AI for Semiconductor Etch Process Optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              The Virtual Radical Sensor is an AI-based Digital Twin system designed for EUV-based 
              semiconductor etching processes. It predicts plasma radical distribution and etching 
              quality from process parameters without requiring direct measurement equipment.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Physics-Informed AI</Badge>
              <Badge variant="secondary">Digital Twin</Badge>
              <Badge variant="secondary">Predictive Analytics</Badge>
              <Badge variant="secondary">Quality Control</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Process Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Process Parameters
            </CardTitle>
            <CardDescription>Input variables for simulation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <Section title="RF Power" icon={Zap}>
              <p>
                Radio frequency power (100-2000W) controls plasma density and ion energy. 
                Higher power increases etch rate but may cause non-uniformity at edges.
              </p>
            </Section>

            <Separator />

            <Section title="Chamber Pressure" icon={Gauge}>
              <p>
                Operating pressure (1-100 mTorr) affects mean free path and radical transport. 
                Lower pressure provides better directionality but reduced etch rates.
              </p>
            </Section>

            <Separator />

            <Section title="Gas Flow Rates" icon={Wind}>
              <p>
                <strong>CF4:</strong> Primary etchant gas, provides fluorine radicals.<br />
                <strong>O2:</strong> Oxygen addition controls selectivity and prevents polymer buildup.<br />
                <strong>Ar:</strong> Inert carrier gas for physical sputtering and plasma stability.
              </p>
            </Section>

            <Separator />

            <Section title="Pulse Mode" icon={Activity}>
              <p>
                Pulsed plasma operation modulates power delivery. Duty cycle (10-90%) and 
                frequency (100-10000 Hz) control radical generation patterns and can improve 
                uniformity for high aspect ratio features.
              </p>
            </Section>
          </CardContent>
        </Card>

        {/* Output Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quality Predictions
            </CardTitle>
            <CardDescription>Output metrics and their interpretation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <Section title="2D Radical Distribution" icon={Target}>
              <p>
                Visualizes the spatial distribution of reactive species in the chamber cross-section. 
                The heatmap shows relative radical density from low (blue) to high (red). 
                Uniform distribution indicates optimal conditions.
              </p>
            </Section>

            <Separator />

            <Section title="Etch Uniformity" icon={TrendingUp}>
              <p>
                Percentage measure of etch rate consistency across the wafer.<br />
                <Badge variant="outline" className="bg-green-500/10 text-green-600 mr-2">95%+</Badge> Excellent<br />
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 mr-2">90-95%</Badge> Acceptable<br />
                <Badge variant="outline" className="bg-red-500/10 text-red-600">Below 90%</Badge> Out of spec
              </p>
            </Section>

            <Separator />

            <Section title="CD Shift" icon={Target}>
              <p>
                Critical Dimension deviation from target in nanometers. 
                Target accuracy is within 3nm for advanced nodes.
              </p>
            </Section>

            <Separator />

            <Section title="Defect Risk" icon={Shield}>
              <p>
                Overall assessment of potential defect generation based on process conditions 
                and predicted radical behavior. Categories: LOW, MEDIUM, HIGH.
              </p>
            </Section>
          </CardContent>
        </Card>

        {/* AI Model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Physics-Informed AI Model
            </CardTitle>
            <CardDescription>How the prediction system works</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-4">
            <p>
              Unlike pure data-driven approaches, this system incorporates plasma physics 
              constraints into the neural network loss function:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Radical generation and recombination reaction kinetics</li>
              <li>Diffusion-based spatial continuity constraints</li>
              <li>Mass conservation and reaction balance</li>
              <li>Chamber geometry and wall loss effects</li>
            </ul>
            <p>
              This physics regularization ensures predictions remain physically plausible 
              even with limited training data, bridging simulation and real process behavior.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
