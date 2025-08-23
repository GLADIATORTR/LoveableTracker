import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Globe } from "lucide-react";

export interface EconomicParameters {
  appreciationRate: number;
  capitalGainsTax: number;
  inflationRate: number;
  sellingCosts: number;
  nominalHurdleRate: number;
}

export interface CountrySpecificParameters {
  [country: string]: EconomicParameters;
}

// Default country settings - same as GlobalSettings component
const DEFAULT_COUNTRY_SETTINGS = {
  USA: {
    realEstateAppreciationRate: 3.5,
    inflationRate: 3.5,
    sellingCosts: 6.0,
    capitalGainsTax: 25.0,
    currentMortgageRate: 6.5,
    nominalHurdleRate: 8.0,
  },
  Turkey: {
    realEstateAppreciationRate: 3.5,
    inflationRate: 3.5,
    sellingCosts: 2.0,
    capitalGainsTax: 0.0,
    currentMortgageRate: 6.5,
    nominalHurdleRate: 8.0,
  },
  Canada: {
    realEstateAppreciationRate: 4.2,
    inflationRate: 3.1,
    sellingCosts: 5.5,
    capitalGainsTax: 50.0,
    currentMortgageRate: 5.8,
    nominalHurdleRate: 8.0,
  },
  UK: {
    realEstateAppreciationRate: 2.8,
    inflationRate: 2.5,
    sellingCosts: 3.0,
    capitalGainsTax: 28.0,
    currentMortgageRate: 5.2,
    nominalHurdleRate: 8.0,
  },
};

const AVAILABLE_COUNTRIES = Object.keys(DEFAULT_COUNTRY_SETTINGS);

interface EconomicScenarioSlidersProps {
  countryParameters: CountrySpecificParameters;
  onParametersChange: (country: string, parameters: EconomicParameters) => void;
  onReset: () => void;
  selectedCountry?: string;
}

export function EconomicScenarioSliders({ 
  countryParameters, 
  onParametersChange, 
  onReset,
  selectedCountry = 'USA'
}: EconomicScenarioSlidersProps) {
  const [currentCountry, setCurrentCountry] = useState(selectedCountry);
  
  // Always use all available countries, not just what's in localStorage
  const availableCountries = AVAILABLE_COUNTRIES;
  
  // Get default parameters for a country
  const getDefaultParametersForCountry = (country: string): EconomicParameters => {
    // First check localStorage for any overrides
    try {
      const saved = localStorage.getItem('global-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        const countrySettings = settings.countrySettings?.[country];
        if (countrySettings) {
          return {
            appreciationRate: countrySettings.realEstateAppreciationRate,
            capitalGainsTax: countrySettings.capitalGainsTax,
            inflationRate: countrySettings.inflationRate,
            sellingCosts: countrySettings.sellingCosts,
            nominalHurdleRate: countrySettings.nominalHurdleRate || 8.0,
          };
        }
      }
    } catch (error) {
      console.error('Failed to get country settings:', error);
    }
    
    // Use local default settings as fallback
    const defaultCountrySettings = DEFAULT_COUNTRY_SETTINGS[country as keyof typeof DEFAULT_COUNTRY_SETTINGS];
    if (defaultCountrySettings) {
      return {
        appreciationRate: defaultCountrySettings.realEstateAppreciationRate,
        capitalGainsTax: defaultCountrySettings.capitalGainsTax,
        inflationRate: defaultCountrySettings.inflationRate,
        sellingCosts: defaultCountrySettings.sellingCosts,
        nominalHurdleRate: defaultCountrySettings.nominalHurdleRate,
      };
    }
    
    // Final fallback to USA defaults
    return {
      appreciationRate: DEFAULT_COUNTRY_SETTINGS.USA.realEstateAppreciationRate,
      capitalGainsTax: DEFAULT_COUNTRY_SETTINGS.USA.capitalGainsTax,
      inflationRate: DEFAULT_COUNTRY_SETTINGS.USA.inflationRate,
      sellingCosts: DEFAULT_COUNTRY_SETTINGS.USA.sellingCosts,
      nominalHurdleRate: DEFAULT_COUNTRY_SETTINGS.USA.nominalHurdleRate,
    };
  };
  
  const parameters = countryParameters[currentCountry] || getDefaultParametersForCountry(currentCountry);
  
  const updateParameter = (key: keyof EconomicParameters, value: number[]) => {
    const newParameters = {
      ...parameters,
      [key]: value[0]
    };
    onParametersChange(currentCountry, newParameters);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Economic Scenario Analysis</CardTitle>
          </div>
          
          {/* Country Selection */}
          <Select value={currentCountry} onValueChange={setCurrentCountry}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {availableCountries.map(country => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
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

          {/* Nominal Hurdle Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Nominal Hurdle Rate
              </label>
              <span className="text-sm text-muted-foreground">
                {formatPercent(parameters.nominalHurdleRate)}
              </span>
            </div>
            <Slider
              value={[parameters.nominalHurdleRate]}
              onValueChange={(value) => updateParameter('nominalHurdleRate', value)}
              max={15}
              min={2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>2%</span>
              <span>15%</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Real Hurdle Rate: {formatPercent(Math.max(0, parameters.nominalHurdleRate - parameters.inflationRate))}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p className="font-medium mb-1">Country-Specific Scenario Analysis</p>
          <p>Adjust the sliders above to see how different economic scenarios impact your investment projections for <strong>{currentCountry}</strong> properties only. Changes are applied in real-time to both charts and tables.</p>
        </div>
      </CardContent>
    </Card>
  );
}