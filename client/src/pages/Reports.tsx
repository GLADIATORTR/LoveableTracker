import { useState } from "react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EconomicScenarioSliders, type EconomicParameters, type CountrySpecificParameters } from "@/components/ui/economic-scenario-sliders";
import { useToast } from "@/hooks/use-toast";
import { TimeSeriesProjectionsTable } from "@/components/ui/timeseries-projections-table";
import { 
  Download,
  Home,
  TrendingUp
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const [inflationAdjusted, setInflationAdjusted] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [scenarioParams, setScenarioParams] = useState<CountrySpecificParameters>({});

  const { data: investments, isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  // Set default property when investments load
  React.useEffect(() => {
    if (investments && investments.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(investments[0].id);
    }
  }, [investments, selectedPropertyId]);

  const selectedProperty = investments?.find(inv => inv.id === selectedPropertyId);
  
  // Get global settings for initial values
  const getGlobalSettings = () => {
    try {
      const saved = localStorage.getItem('global-settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to parse global settings:', error);
    }
    
    return {
      selectedCountry: 'USA',
      countrySettings: {
        USA: {
          realEstateAppreciationRate: 3.5,
          inflationRate: 3.5,
          sellingCosts: 6.0,
          capitalGainsTax: 25.0,
          currentMortgageRate: 6.5,
        }
      }
    };
  };
  
  const globalSettings = getGlobalSettings();
  const getDefaultCountryParams = (): CountrySpecificParameters => {
    const params: CountrySpecificParameters = {};
    Object.keys(globalSettings.countrySettings).forEach(country => {
      const settings = globalSettings.countrySettings[country];
      params[country] = {
        appreciationRate: settings.realEstateAppreciationRate,
        capitalGainsTax: settings.capitalGainsTax,
        inflationRate: settings.inflationRate,
        sellingCosts: settings.sellingCosts,
      };
    });
    return params;
  };
  
  const defaultCountryParams = getDefaultCountryParams();

  const handleExportReport = () => {
    toast({
      title: "Report Exported",
      description: "Investment projections report has been exported.",
    });
  };
  
  const handleParametersChange = (country: string, newParams: EconomicParameters) => {
    setScenarioParams(prev => ({
      ...prev,
      [country]: newParams
    }));
  };
  
  const handleReset = () => {
    setScenarioParams({});
  };
  
  // Merge default params with any overrides
  const currentCountryParams = { ...defaultCountryParams, ...scenarioParams };

  if (!investments || investments.length === 0) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="text-center py-12">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No investments to analyze</h3>
          <p className="text-muted-foreground">Add some investments to view performance projections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">TimeSeries Projections</h1>
          <p className="text-muted-foreground mt-2">
            Long-term financial projections with inflation-adjusted values for your real estate investments.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a property" />
            </SelectTrigger>
            <SelectContent>
              {investments?.map((investment) => (
                <SelectItem key={investment.id} value={investment.id}>
                  {investment.propertyName} - {investment.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="inflation-adjusted"
              checked={inflationAdjusted}
              onCheckedChange={setInflationAdjusted}
            />
            <Label htmlFor="inflation-adjusted" className="text-sm font-medium">
              Convert to Today's Dollars
            </Label>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Economic Scenario Sliders */}
      <EconomicScenarioSliders
        countryParameters={currentCountryParams}
        onParametersChange={handleParametersChange}
        onReset={handleReset}
        selectedCountry={globalSettings.selectedCountry}
      />

      {/* Selected Property Projections */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading properties...</p>
        </div>
      ) : selectedProperty ? (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Selected: {selectedProperty.propertyName} - {selectedProperty.address}
          </div>
          <TimeSeriesProjectionsTable 
            investment={selectedProperty} 
            inflationAdjusted={inflationAdjusted}
            scenarioParams={scenarioParams}
          />
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No property selected</h3>
          <p className="text-muted-foreground">
            {investments && investments.length > 0 
              ? "Please select a property from the dropdown above to view projections."
              : "No properties found. Please add a property first."
            }
          </p>
        </div>
      )}
    </div>
  );
}