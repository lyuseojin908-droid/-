import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SEO } from "@/components/seo";
import { 
  HelpCircle, 
  Mail, 
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";

const faqs = [
  {
    question: "What is the Virtual Radical Sensor?",
    answer: "The Virtual Radical Sensor is an AI-based system that predicts plasma radical distribution in semiconductor etching chambers. It uses process parameters (RF power, pressure, gas flows, etc.) to estimate radical concentrations without requiring expensive measurement equipment like QMS or OES."
  },
  {
    question: "How accurate are the predictions?",
    answer: "The system targets CD prediction accuracy within 3nm with 90%+ hit rate. Actual accuracy depends on the calibration quality and similarity of conditions to the training data. The physics-informed constraints help maintain reasonable predictions even in novel conditions."
  },
  {
    question: "What do the status indicators mean?",
    answer: "SAFE (green): Process conditions are within optimal operating range with low defect risk. WARNING (yellow): Conditions are near specification limits or show potential non-uniformity. DANGER (red): High probability of defects or out-of-spec results. Parameter adjustment is recommended."
  },
  {
    question: "Why use pulse mode?",
    answer: "Pulsed plasma operation can improve etch uniformity and selectivity, especially for high aspect ratio features. The duty cycle and frequency parameters modulate radical generation patterns and ion energy distribution, providing additional control over the etch profile."
  },
  {
    question: "How does the 2D heatmap work?",
    answer: "The heatmap represents a vertical cross-section of the process chamber, showing relative radical density. The x-axis represents edge-to-edge (horizontal), while the y-axis shows top-to-bottom (vertical). Colors range from blue (low density) through green/yellow to red (high density)."
  },
  {
    question: "What is Physics-Informed AI?",
    answer: "Unlike pure data-driven machine learning, Physics-Informed AI incorporates physical laws and constraints into the model. This includes reaction kinetics, diffusion equations, and mass conservation. This approach reduces the required training data and prevents physically impossible predictions."
  },
  {
    question: "Can I compare multiple predictions?",
    answer: "Yes! Use the History page to view all past predictions. Click any row to see its detailed results including the radical distribution and quality metrics. This allows you to compare different process conditions and find optimal parameters."
  },
  {
    question: "What affects etch uniformity most?",
    answer: "Key factors include: RF power distribution, chamber pressure (affects radical transport), gas flow balance, and for pulsed modes, the duty cycle. Center-to-edge uniformity is often most sensitive to power and pressure, while gas composition affects selectivity and profile control."
  }
];

const tips = [
  {
    icon: Lightbulb,
    title: "Start with Default Parameters",
    description: "The default values represent typical process conditions. Make incremental changes to understand parameter sensitivity."
  },
  {
    icon: AlertTriangle,
    title: "Watch Center/Edge Ratio",
    description: "A ratio significantly above 1.0 indicates center-heavy distribution (edge under-etch). Below 1.0 suggests edge-heavy distribution."
  },
  {
    icon: CheckCircle2,
    title: "Use Pulse Mode for High AR",
    description: "For high aspect ratio features, enable pulse mode with 50-70% duty cycle to improve profile control."
  }
];

export default function HelpPage() {
  return (
    <div className="h-full overflow-auto p-6">
      <SEO
        title="Help & Support | Virtual Radical Sensor"
        description="Get help with the Virtual Radical Sensor system. Find answers to frequently asked questions and tips for optimal process parameter configuration."
      />
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-page-title">
            <HelpCircle className="h-6 w-6 text-primary" />
            Help & Support
          </h1>
          <p className="text-muted-foreground">
            Frequently asked questions and helpful tips
          </p>
        </div>

        {/* Quick Tips */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tips.map((tip, index) => (
            <Card key={index} className="hover-elevate">
              <CardContent className="pt-4">
                <div className="flex flex-col gap-2">
                  <tip.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-medium">{tip.title}</h3>
                  <p className="text-sm text-muted-foreground">{tip.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Common questions about the Virtual Radical Sensor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Need More Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              For technical support or questions about plasma physics modeling, 
              please contact the process engineering team or refer to the internal 
              documentation for detailed simulation parameters and validation data.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
