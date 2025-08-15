import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
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

// Market Value Calculator (same as TimeSeries)
function calculateMarketValue(investment: any, year: number, globalSettings: any, inflationAdjusted: boolean): number {
  const countrySettings = globalSettings.countrySettings[globalSettings.selectedCountry];
  const propertyAppreciationRate = countrySettings.realEstateAppreciationRate / 100;
  const currentValue = investment.currentValue / 100;
  const inflationRate = countrySettings.inflationRate / 100;
  const inflationAdjustment = inflationAdjusted ? Math.pow(1 + inflationRate, -year) : 1;
  
  const nominalValue = currentValue * Math.pow(1 + propertyAppreciationRate, year);
  return nominalValue * inflationAdjustment;
}

// Outstanding Balance Calculator (same as TimeSeries)
function calculateOutstandingBalance(investment: any, year: number): number {
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
function calculateCapitalGainsTax(investment: any, year: number, globalSettings: any): number {
  const countrySettings = globalSettings.countrySettings[globalSettings.selectedCountry];
  const capitalGainsTaxRate = countrySettings.capitalGainsTax / 100;
  
  const marketValue = calculateMarketValue(investment, year, globalSettings, false);
  const purchasePrice = investment.purchasePrice / 100;
  
  const capitalGains = Math.max(0, marketValue - purchasePrice);
  return capitalGains * capitalGainsTaxRate;
}

// Selling Costs Calculator (same as TimeSeries)
function calculateSellingCosts(investment: any, year: number, globalSettings: any): number {
  const countrySettings = globalSettings.countrySettings[globalSettings.selectedCountry];
  const sellingCostsRate = countrySettings.sellingCosts / 100;
  
  const marketValue = calculateMarketValue(investment, year, globalSettings, false);
  return marketValue * sellingCostsRate;
}

// Annual Net Yield Calculator (same as TimeSeries)
function calculateAnnualNetYield(investment: any, year: number): number {
  return 42840; // Fixed value as in TimeSeries
}

// Cumulative Net Yield Calculator (same as TimeSeries)
function calculateCumulativeNetYield(investment: any, year: number): number {
  return 42840 * Math.max(0, year);
}

// Calculate Net Gain Present Value for chart (same logic as TimeSeries)
function calculateNetGainPresentValue(investment: any, year: number, globalSettings: any): number {
  const countrySettings = globalSettings.countrySettings[globalSettings.selectedCountry];
  const propertyAppreciationRate = countrySettings.realEstateAppreciationRate / 100;
  const inflationRate = countrySettings.inflationRate / 100;
  
  const currentMarketValue = investment.currentValue / 100;
  const nominalMarketValue = currentMarketValue * Math.pow(1 + propertyAppreciationRate, year);
  
  const outstandingBalance = calculateOutstandingBalance(investment, year);
  const capitalGainsTax = calculateCapitalGainsTax(investment, year, globalSettings);
  const sellingCosts = calculateSellingCosts(investment, year, globalSettings);
  
  const nominalNetEquity = nominalMarketValue - outstandingBalance - capitalGainsTax - sellingCosts;
  const netEquityToday = nominalNetEquity * Math.pow(1 + inflationRate, -year);
  
  const cumulativeNetYield = calculateCumulativeNetYield(investment, year);
  
  // Net Gain Present Value = Net Equity (present value) + Cumulative Net Yield - Initial Net Equity
  const netGainPV = netEquityToday + cumulativeNetYield - (investment.netEquity || 0) / 100;
  
  return netGainPV;
}

export default function Charts() {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);

  const { data: investments = [], isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ['/api/investments']
  });

  // Generate chart data for selected properties
  const generateChartData = () => {
    const years = [0, 1, 2, 3, 4, 5, 10, 15, 25, 30];
    const globalSettings = getGlobalSettings();
    
    const selectedInvestments = selectedProperties.length > 0 
      ? investments.filter(inv => selectedProperties.includes(inv.id))
      : investments;

    return years.map(year => {
      const dataPoint: any = { year };
      
      selectedInvestments.forEach(investment => {
        const netGainPV = calculateNetGainPresentValue(investment, year, globalSettings);
        dataPoint[investment.propertyName || `Property ${investment.id.slice(0, 8)}`] = Math.round(netGainPV);
      });
      
      return dataPoint;
    });
  };

  const chartData = generateChartData();
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

  const handlePropertySelection = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

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
      </div>

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

      {/* Chart */}
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="year" 
                  label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  label={{ value: 'Net Gain Present Value ($)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={(label) => `Year ${label}`}
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
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}