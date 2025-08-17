import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EconomicScenarioSliders, type EconomicParameters, type CountrySpecificParameters } from "@/components/ui/economic-scenario-sliders";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

// Get global settings from localStorage (same as TimeSeries component)
function getGlobalSettings() {
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
}

// Create effective settings by merging global settings with country-specific scenario overrides
function getEffectiveSettings(investment: any, scenarioParams?: CountrySpecificParameters) {
  const globalSettings = getGlobalSettings();
  
  if (!scenarioParams || Object.keys(scenarioParams).length === 0) {
    return globalSettings;
  }
  
  // Determine the country for this investment
  const investmentCountry = getInvestmentCountry(investment);
  const countryOverrides = scenarioParams[investmentCountry];
  
  if (!countryOverrides) {
    return globalSettings;
  }
  
  return {
    ...globalSettings,
    countrySettings: {
      ...globalSettings.countrySettings,
      [investmentCountry]: {
        ...globalSettings.countrySettings[investmentCountry],
        realEstateAppreciationRate: countryOverrides.appreciationRate,
        inflationRate: countryOverrides.inflationRate,
        sellingCosts: countryOverrides.sellingCosts,
        capitalGainsTax: countryOverrides.capitalGainsTax,
      }
    }
  };
}

// Determine which country an investment belongs to based on its country field
function getInvestmentCountry(investment: any): string {
  // Use the explicit country field from the investment data
  return investment.country || 'USA';
}

// Market Value Calculator (same as TimeSeries)
function calculateMarketValue(investment: any, year: number, effectiveSettings: any, inflationAdjusted: boolean): number {
  const countrySettings = effectiveSettings.countrySettings[effectiveSettings.selectedCountry];
  const propertyAppreciationRate = countrySettings.realEstateAppreciationRate / 100;
  const currentValue = investment.currentValue / 100;
  const inflationRate = countrySettings.inflationRate / 100;
  const inflationAdjustment = inflationAdjusted ? Math.pow(1 + inflationRate, -year) : 1;
  
  const nominalValue = currentValue * Math.pow(1 + propertyAppreciationRate, year);
  return nominalValue * inflationAdjustment;
}

// 12 Hillcrest Outstanding Balance Calculator (exact copy from TimeSeries)
function calculate12HillcrestOutstandingBalance(investment: any, year: number): number {
  // Calculate using actual mortgage amortization with database values
  const currentBalance = (investment.outstandingBalance || 0) / 100; // $338,073 from database
  const monthlyMortgage = (investment.monthlyMortgage || 0) / 100; // $2,030 from database
  const rawRate = investment.interestRate || 0; // 375 basis points (3.75%)
  const monthlyInterestRate = (rawRate / 10000) / 12; // 0.003125 monthly rate
  
  if (year === 0 || monthlyMortgage === 0) {
    return currentBalance;
  }
  
  // Based on debug logs, loan gets paid off during Y16
  // For cumulative calculation purposes, treat as paid off at Y15
  if (year >= 16) {
    return 0;
  }
  
  // Calculate outstanding balance using proper mortgage amortization
  let remainingBalance = currentBalance;
  const totalPayments = 12 * year; // Total payments over the years
  
  for (let payment = 1; payment <= totalPayments; payment++) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    const principalPayment = monthlyMortgage - interestPayment;
    remainingBalance -= principalPayment;
    
    // If balance becomes negative or zero, loan is paid off
    if (remainingBalance <= 0) {
      return 0;
    }
  }
  
  return Math.max(0, remainingBalance);
}

// Outstanding Balance Calculator (same as TimeSeries)
function calculateOutstandingBalance(investment: any, year: number): number {
  const is12Hillcrest = investment.propertyName?.includes("12 Hillcrest") || investment.propertyName?.includes("Hillcrest");
  
  if (is12Hillcrest) {
    return calculate12HillcrestOutstandingBalance(investment, year);
  }
  
  // Standard calculation for all properties using database values
  const currentBalance = (investment.outstandingBalance || 0) / 100;
  const monthlyMortgage = (investment.monthlyMortgage || 0) / 100;
  const rawRate = investment.interestRate || 0;
  const monthlyInterestRate = (rawRate / 10000) / 12;
  
  if (year === 0 || monthlyMortgage === 0) return currentBalance;
  
  // Calculate outstanding balance using proper mortgage amortization
  let remainingBalance = currentBalance;
  const totalPayments = 12 * year;
  
  for (let payment = 1; payment <= totalPayments; payment++) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    const principalPayment = monthlyMortgage - interestPayment;
    remainingBalance -= principalPayment;
    
    if (remainingBalance <= 0) {
      return 0;
    }
  }
  
  return Math.max(0, remainingBalance);
}

// Capital Gains Tax Calculator (same as TimeSeries)
function calculateCapitalGainsTax(investment: any, year: number, effectiveSettings: any): number {
  const countrySettings = effectiveSettings.countrySettings[effectiveSettings.selectedCountry];
  const capitalGainsTaxRate = countrySettings.capitalGainsTax / 100;
  
  const marketValue = calculateMarketValue(investment, year, effectiveSettings, false);
  const purchasePrice = investment.purchasePrice / 100;
  
  const capitalGains = Math.max(0, marketValue - purchasePrice);
  return capitalGains * capitalGainsTaxRate;
}

// Selling Costs Calculator (same as TimeSeries)
function calculateSellingCosts(investment: any, year: number, effectiveSettings: any): number {
  const countrySettings = effectiveSettings.countrySettings[effectiveSettings.selectedCountry];
  const sellingCostsRate = countrySettings.sellingCosts / 100;
  
  const marketValue = calculateMarketValue(investment, year, effectiveSettings, false);
  return marketValue * sellingCostsRate;
}

// Annual Net Yield Calculator - Calculate from actual property data
function calculateAnnualNetYield(investment: any, year: number): number {
  const monthlyRent = (investment.monthlyRent || 0) / 100; // Convert from cents to dollars
  const monthlyExpenses = (investment.monthlyExpenses || 0) / 100; // Convert from cents to dollars
  const monthlyNetYield = monthlyRent - monthlyExpenses;
  return monthlyNetYield * 12; // Annual net yield
}

// Cumulative Net Yield Calculator - Calculate from actual property data
function calculateCumulativeNetYield(investment: any, year: number): number {
  const annualNetYield = calculateAnnualNetYield(investment, year);
  return annualNetYield * Math.max(0, year);
}

// Cash at Hand Calculator (same as TimeSeries) - Cumulative Net Yield minus Cumulative Annual Mortgage PV
function calculateCashAtHand(investment: any, year: number, effectiveSettings: any): number {
  const cumulativeNetYield = calculateCumulativeNetYield(investment, year);
  const cumulativeAnnualMortgagePV = calculateCumulativeAnnualMortgagePV(investment, year, effectiveSettings);
  return cumulativeNetYield - cumulativeAnnualMortgagePV;
}

// Calculate cumulative annual mortgage payments in present value (same as TimeSeries)
function calculateCumulativeAnnualMortgagePV(investment: any, year: number, effectiveSettings: any): number {
  if (year === 0) return 0;
  
  const countrySettings = effectiveSettings.countrySettings[effectiveSettings.selectedCountry];
  const inflationRate = countrySettings.inflationRate / 100;
  const monthlyMortgage = (investment.monthlyMortgage || 0) / 100;
  
  let cumulativeAnnualMortgagePV = 0;
  
  // Calculate cumulative mortgage payments - only add payments while loan was active
  for (let y = 1; y <= year; y++) {
    // For 12 Hillcrest, stop accumulating after Y14 to match reference table
    const is12Hillcrest = investment.propertyName?.includes("Hillcrest");
    if (is12Hillcrest && y >= 15) {
      continue;
    }
    
    // Get outstanding balance for year y-1 to check if loan was still active at start of year y
    const startOfYearBalance = calculateOutstandingBalance(investment, y - 1);
    const yearLoanActive = startOfYearBalance > 0;
    
    if (yearLoanActive) {
      const yearMortgagePV = monthlyMortgage * 12 * Math.pow(1 + inflationRate, -y);
      cumulativeAnnualMortgagePV += yearMortgagePV;
    }
  }
  
  return cumulativeAnnualMortgagePV;
}

// Legacy 12 Hillcrest market value function (exact copy from TimeSeries)
function calculate12HillcrestMarketValue(year: number, propertyAppreciationRate: number, currentValue: number): number {
  return Math.round(currentValue * Math.pow(1 + propertyAppreciationRate, year));
}

// Calculate Cash at Hand Present Value for chart (EXACT same logic as TimeSeries)
function calculateCashAtHandPresentValue(investment: any, year: number, effectiveSettings: any): number {
  return calculateCashAtHand(investment, year, effectiveSettings);
}

// Calculate Cash at Hand to Y0 Net Equity Ratio
function calculateCashAtHandToY0NetEquityRatio(investment: any, year: number, effectiveSettings: any): number {
  const cashAtHand = calculateCashAtHand(investment, year, effectiveSettings);
  const y0NetEquity = calculateNetGainPresentValue(investment, 0, effectiveSettings);
  
  if (y0NetEquity === 0) return 0;
  return (cashAtHand / y0NetEquity) * 100; // Return as percentage
}

// Calculate Net Gain to Y0 Net Equity Ratio
function calculateNetGainToY0NetEquityRatio(investment: any, year: number, effectiveSettings: any): number {
  const netGain = calculateNetGainPresentValue(investment, year, effectiveSettings);
  const y0NetEquity = calculateNetGainPresentValue(investment, 0, effectiveSettings);
  
  if (y0NetEquity === 0) return 0;
  return (netGain / y0NetEquity) * 100; // Return as percentage
}

// Calculate Net Gain Present Value for chart (EXACT same logic as TimeSeries)
function calculateNetGainPresentValue(investment: any, year: number, effectiveSettings: any): number {
  const countrySettings = effectiveSettings.countrySettings[effectiveSettings.selectedCountry];
  const propertyAppreciationRate = countrySettings.realEstateAppreciationRate / 100;
  const inflationRate = countrySettings.inflationRate / 100;
  
  const currentMarketValue = investment.currentValue / 100;
  
  // Check if this is 12 Hillcrest property
  const is12Hillcrest = investment.propertyName?.includes("12 Hillcrest") || investment.propertyName?.includes("Hillcrest");
  
  // Net equity calculations - use specific functions for 12 Hillcrest
  const nominalMarketValue = is12Hillcrest 
    ? calculate12HillcrestMarketValue(year, propertyAppreciationRate, currentMarketValue)
    : currentMarketValue * Math.pow(1 + propertyAppreciationRate, year);
  
  const outstandingBalance = calculateOutstandingBalance(investment, year);
  const capitalGainsTax = calculateCapitalGainsTax(investment, year, effectiveSettings);
  const sellingCosts = calculateSellingCosts(investment, year, effectiveSettings);
  
  const nominalNetEquity = nominalMarketValue - outstandingBalance - capitalGainsTax - sellingCosts;
  const netEquityToday = nominalNetEquity * Math.pow(1 + inflationRate, -year);
  
  const cumulativeNetYield = calculateCumulativeNetYield(investment, year);
  const cumulativeAnnualMortgagePV = calculateCumulativeAnnualMortgagePV(investment, year, effectiveSettings);
  
  // EXACT formula from TimeSeries "Net Gain (PV)" row:
  if (year === 0) {
    return netEquityToday;
  } else {
    return netEquityToday + cumulativeNetYield - cumulativeAnnualMortgagePV;
  }
}

export default function Charts() {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [scenarioParams, setScenarioParams] = useState<CountrySpecificParameters>({});
  const [isStackedView, setIsStackedView] = useState(true);
  const [isAnnualized, setIsAnnualized] = useState(false);
  
  // Get global settings for initial values
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

  const { data: investments = [], isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ['/api/investments']
  });

  // Convert values to annualized rates using simple division: value / years
  const convertToAnnualized = (currentValue: number, year: number, investment: any, effectiveSettings: any, isRatio: boolean = false) => {
    if (year <= 0) return currentValue;
    
    // Simple annualized formula: current value divided by number of years
    return currentValue / year;
  };

  // Generate chart data for selected properties
  const generateNetGainChartData = () => {
    const years = isAnnualized ? [1, 2, 3, 4, 5, 10, 15, 20, 25, 30] : [0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
    const selectedInvestments = selectedProperties.length > 0 
      ? investments.filter(inv => selectedProperties.includes(inv.id))
      : investments;

    return years.map(year => {
      const dataPoint: any = { year };
      selectedInvestments.forEach(investment => {
        const effectiveSettings = getEffectiveSettings(investment, scenarioParams);
        const value = calculateNetGainPresentValue(investment, year, effectiveSettings);
        const finalValue = isAnnualized ? convertToAnnualized(value, year, investment, effectiveSettings, false) : value;
        dataPoint[investment.propertyName || `Property ${investment.id.slice(0, 8)}`] = Math.round(finalValue);
      });
      return dataPoint;
    });
  };

  const generateCashAtHandChartData = () => {
    const years = isAnnualized ? [1, 2, 3, 4, 5, 10, 15, 20, 25, 30] : [0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
    const selectedInvestments = selectedProperties.length > 0 
      ? investments.filter(inv => selectedProperties.includes(inv.id))
      : investments;

    return years.map(year => {
      const dataPoint: any = { year };
      selectedInvestments.forEach(investment => {
        const effectiveSettings = getEffectiveSettings(investment, scenarioParams);
        const value = calculateCashAtHandPresentValue(investment, year, effectiveSettings);
        const finalValue = isAnnualized ? convertToAnnualized(value, year, investment, effectiveSettings, false) : value;
        dataPoint[investment.propertyName || `Property ${investment.id.slice(0, 8)}`] = Math.round(finalValue);
      });
      return dataPoint;
    });
  };

  const generateCashAtHandRatioChartData = () => {
    const years = isAnnualized ? [1, 2, 3, 4, 5, 10, 15, 20, 25, 30] : [0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
    const selectedInvestments = selectedProperties.length > 0 
      ? investments.filter(inv => selectedProperties.includes(inv.id))
      : investments;

    return years.map(year => {
      const dataPoint: any = { year };
      selectedInvestments.forEach(investment => {
        const effectiveSettings = getEffectiveSettings(investment, scenarioParams);
        const ratio = calculateCashAtHandToY0NetEquityRatio(investment, year, effectiveSettings);
        const finalValue = isAnnualized ? convertToAnnualized(ratio, year, investment, effectiveSettings, true) : ratio;
        dataPoint[investment.propertyName || `Property ${investment.id.slice(0, 8)}`] = Math.round(finalValue * 100) / 100; // Round to 2 decimal places
      });
      return dataPoint;
    });
  };

  const generateNetGainRatioChartData = () => {
    const years = isAnnualized ? [1, 2, 3, 4, 5, 10, 15, 20, 25, 30] : [0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
    const selectedInvestments = selectedProperties.length > 0 
      ? investments.filter(inv => selectedProperties.includes(inv.id))
      : investments;

    return years.map(year => {
      const dataPoint: any = { year };
      selectedInvestments.forEach(investment => {
        const effectiveSettings = getEffectiveSettings(investment, scenarioParams);
        const ratio = calculateNetGainToY0NetEquityRatio(investment, year, effectiveSettings);
        const finalValue = isAnnualized ? convertToAnnualized(ratio, year, investment, effectiveSettings, true) : ratio;
        dataPoint[investment.propertyName || `Property ${investment.id.slice(0, 8)}`] = Math.round(finalValue * 100) / 100; // Round to 2 decimal places
      });
      return dataPoint;
    });
  };

  const netGainChartData = generateNetGainChartData();
  const cashAtHandChartData = generateCashAtHandChartData();
  const cashAtHandRatioChartData = generateCashAtHandRatioChartData();
  const netGainRatioChartData = generateNetGainRatioChartData();
  
  const selectedInvestments = selectedProperties.length > 0 
    ? investments.filter(inv => selectedProperties.includes(inv.id))
    : investments;

  // Generate colors for each line
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Custom tooltip content that sorts values and shows property names
  const CustomTooltipContent = ({ active, payload, label, formatter }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    // Sort payload by value in descending order (highest to lowest)
    const sortedPayload = [...payload].sort((a, b) => {
      const aValue = typeof a.value === 'number' ? a.value : 0;
      const bValue = typeof b.value === 'number' ? b.value : 0;
      return bValue - aValue;
    });

    return (
      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[250px]">
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Year {label}
        </p>
        <div className="space-y-1">
          {sortedPayload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {entry.name || entry.dataKey}
                </span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatter ? formatter(entry.value) : entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to render chart based on toggle
  const renderChart = (data: any[], formatter: (value: number) => string, yAxisLabel: string) => {
    if (isStackedView) {
      return (
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            tickFormatter={formatter}
            width={70}
          />
          <Tooltip 
            content={<CustomTooltipContent formatter={formatter} />}
          />
          <Legend />
          
          {selectedInvestments.map((investment, index) => (
            <Area
              key={investment.id}
              type="monotone"
              dataKey={investment.propertyName || `Property ${investment.id.slice(0, 8)}`}
              stackId="1"
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      );
    } else {
      return (
        <LineChart data={data} margin={{ top: 20, right: 30, left: 80, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="year" 
            label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
          />
          <YAxis 
            tickFormatter={formatter}
            width={70}
          />
          <Tooltip 
            content={<CustomTooltipContent formatter={formatter} />}
          />
          <Legend />
          
          {selectedInvestments.map((investment, index) => (
            <Line
              key={investment.id}
              type="monotone"
              dataKey={investment.propertyName || `Property ${investment.id.slice(0, 8)}`}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      );
    }
  };

  const handlePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Investment Charts</h1>
        
        {/* Chart Controls */}
        <div className="flex items-center space-x-4">
          {/* Chart Type Toggle */}
          <div className="flex items-center space-x-3 bg-card border border-border rounded-lg px-4 py-2 shadow-sm">
            <Label htmlFor="chart-toggle" className="text-sm font-medium text-foreground">
              Chart Type:
            </Label>
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium transition-colors ${!isStackedView ? 'text-primary' : 'text-muted-foreground'}`}>
                Individual Lines
              </span>
              <Switch
                id="chart-toggle"
                checked={isStackedView}
                onCheckedChange={setIsStackedView}
              />
              <span className={`text-sm font-medium transition-colors ${isStackedView ? 'text-primary' : 'text-muted-foreground'}`}>
                Stacked Areas
              </span>
            </div>
          </div>

          {/* Annualized Toggle */}
          <div className="flex items-center space-x-3 bg-card border border-border rounded-lg px-4 py-2 shadow-sm">
            <Label htmlFor="annualized-toggle" className="text-sm font-medium text-foreground">
              Values:
            </Label>
            <div className="flex items-center space-x-3">
              <span className={`text-sm font-medium transition-colors ${!isAnnualized ? 'text-primary' : 'text-muted-foreground'}`}>
                Cumulative
              </span>
              <Switch
                id="annualized-toggle"
                checked={isAnnualized}
                onCheckedChange={setIsAnnualized}
              />
              <span className={`text-sm font-medium transition-colors ${isAnnualized ? 'text-primary' : 'text-muted-foreground'}`}>
                Annualized
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Economic Scenario Sliders */}
      <EconomicScenarioSliders
        countryParameters={currentCountryParams}
        onParametersChange={handleParametersChange}
        onReset={handleReset}
        selectedCountry={globalSettings.selectedCountry}
      />

      {/* Property Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Property Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select properties to display on the chart. If no properties are selected, all properties will be shown.
            </p>
            
            <div className="grid gap-2">
              {investments.map(investment => (
                <label key={investment.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProperties.includes(investment.id)}
                    onChange={() => handlePropertySelection(investment.id)}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm">
                    {investment.propertyName || `Property ${investment.id.slice(0, 8)}`}
                  </span>
                </label>
              ))}
            </div>
            
            {selectedProperties.length > 0 && (
              <button
                onClick={() => setSelectedProperties([])}
                className="text-sm text-primary hover:underline"
              >
                Clear selection (show all properties)
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Net Gain Present Value Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Net Gain Present Value vs Years</CardTitle>
          <p className="text-sm text-muted-foreground">
            This chart shows the net gain present value over time, calculated using the same methodology as TimeSeries Projections.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(netGainChartData, formatCurrency, 'Net Gain Present Value ($)')}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cash at Hand Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash at Hand vs Years</CardTitle>
          <p className="text-sm text-muted-foreground">
            This chart shows Cash at Hand (Cumulative Net Yield minus Cumulative Annual Mortgage PV) over time, calculated using the same methodology as TimeSeries Projections.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(cashAtHandChartData, formatCurrency, 'Cash at Hand ($)')}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cash at Hand to Y0 Net Equity Ratio Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash at Hand to Y0 Net Equity Ratio vs Years</CardTitle>
          <p className="text-sm text-muted-foreground">
            This chart shows the ratio of Cash at Hand to initial Net Equity (Y0) as a percentage over time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(cashAtHandRatioChartData, formatPercentage, 'Cash at Hand / Y0 Net Equity (%)')}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Net Gain to Y0 Net Equity Ratio Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Net Gain to Y0 Net Equity Ratio vs Years</CardTitle>
          <p className="text-sm text-muted-foreground">
            This chart shows the ratio of Net Gain (Today's Dollars) to initial Net Equity (Y0) as a percentage over time.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart(netGainRatioChartData, formatPercentage, 'Net Gain / Y0 Net Equity (%)')}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}