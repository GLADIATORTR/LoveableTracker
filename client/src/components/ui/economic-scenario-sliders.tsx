import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export interface EconomicParameters {
  appreciationRate: number;
  capitalGainsTax: number;
  inflationRate: number;
  sellingCosts: number;
}

interface EconomicScenarioSlidersProps {
  parameters: EconomicParameters;
  onParametersChange: (parameters: EconomicParameters) => void;
  onReset: () => void;
}

export function EconomicScenarioSliders({ 
  parameters, 
  onParametersChange, 
  onReset 
}: EconomicScenarioSlidersProps) {
  const updateParameter = (key: keyof EconomicParameters, value: number[]) => {
    onParametersChange({
      ...parameters,
      [key]: value[0]
    });
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Economic Scenario Analysis</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset to Global Settings
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Appreciation Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Property Appreciation Rate
              </label>
              <span className="text-sm text-muted-foreground">
                {formatPercent(parameters.appreciationRate)}
              </span>
            </div>
            <Slider
              value={[parameters.appreciationRate]}
              onValueChange={(value) => updateParameter('appreciationRate', value)}
              max={10}
              min={-2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-2%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Inflation Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Inflation Rate
              </label>
              <span className="text-sm text-muted-foreground">
                {formatPercent(parameters.inflationRate)}
              </span>
            </div>
            <Slider
              value={[parameters.inflationRate]}
              onValueChange={(value) => updateParameter('inflationRate', value)}
              max={10}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Capital Gains Tax */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Capital Gains Tax
              </label>
              <span className="text-sm text-muted-foreground">
                {formatPercent(parameters.capitalGainsTax)}
              </span>
            </div>
            <Slider
              value={[parameters.capitalGainsTax]}
              onValueChange={(value) => updateParameter('capitalGainsTax', value)}
              max={50}
              min={0}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
            </div>
          </div>

          {/* Selling Costs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Selling Costs
              </label>
              <span className="text-sm text-muted-foreground">
                {formatPercent(parameters.sellingCosts)}
              </span>
            </div>
            <Slider
              value={[parameters.sellingCosts]}
              onValueChange={(value) => updateParameter('sellingCosts', value)}
              max={15}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Scenario Analysis</p>
          <p>Adjust the sliders above to see how different economic scenarios impact your investment projections. Changes are applied in real-time to both charts and tables.</p>
        </div>
      </CardContent>
    </Card>
  );
}