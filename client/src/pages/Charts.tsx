import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RealEstateInvestmentWithCategory } from "@shared/schema";
// Import the global settings function from the TimeSeries component
function getGlobalSettings() {
  const defaultSettings = {
    selectedCountry: 'USA',
    countrySettings: {
      'USA': {
        realEstateAppreciationRate: 3.5,
        inflationRate: 2.5,
        capitalGainsTax: 25,
        sellingCosts: 6,
        incomeTaxRate: 22
      },
      'Turkey': {
        realEstateAppreciationRate: 12,
        inflationRate: 15,
        capitalGainsTax: 20,
        sellingCosts: 5,
        incomeTaxRate: 20
      },
      'Canada': {
        realEstateAppreciationRate: 4,
        inflationRate: 2,
        capitalGainsTax: 25,
        sellingCosts: 6,
        incomeTaxRate: 26
      },
      'UK': {
        realEstateAppreciationRate: 3,
        inflationRate: 2.5,
        capitalGainsTax: 28,
        sellingCosts: 3,
        incomeTaxRate: 20
      }
    }
  };

  try {
    const stored = localStorage.getItem('globalSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.error('Error loading global settings:', error);
  }
  
  return defaultSettings;
}

interface ChartDataPoint {
  year: number;
  [propertyId: string]: number | string;
}

// Calculate Net Gain Present Value for a property at a specific year
function calculateNetGainPV(investment: RealEstateInvestmentWithCategory, year: number): number {
  const globalSettings = getGlobalSettings();
  const countrySettings = globalSettings.countrySettings[globalSettings.selectedCountry];
  const inflationRate = countrySettings.inflationRate / 100;
  const propertyAppreciationRate = countrySettings.realEstateAppreciationRate / 100;
  const capitalGainsTaxRate = countrySettings.capitalGainsTax / 100;
  const sellingCostsRate = countrySettings.sellingCosts / 100;

  // Current values (convert from cents to dollars)
  const currentMarketValue = investment.currentValue / 100;
  const purchasePrice = investment.purchasePrice / 100;
  const currentOutstandingBalance = (investment.outstandingBalance || 0) / 100;
  const monthlyMortgage = (investment.monthlyMortgage || 0) / 100;
  const monthlyRent = investment.monthlyRent / 100;
  const monthlyExpenses = investment.monthlyExpenses / 100;
  const currentNetEquity = (investment.netEquity || 0) / 100;

  if (year === 0) {
    return 0; // No gain at year 0
  }

  // Calculate future market value
  const futureMarketValue = currentMarketValue * Math.pow(1 + propertyAppreciationRate, year);
  
  // Calculate outstanding balance (simplified amortization)
  const rawRate = investment.interestRate || 0;
  const monthlyInterestRate = (rawRate / 10000) / 12;
  let remainingBalance = currentOutstandingBalance;
  
  for (let payment = 1; payment <= (12 * year); payment++) {
    if (remainingBalance <= 0) break;
    const interestPayment = remainingBalance * monthlyInterestRate;
    const principalPayment = monthlyMortgage - interestPayment;
    remainingBalance = Math.max(0, remainingBalance - principalPayment);
  }

  // Calculate capital gains tax
  const capitalGains = Math.max(0, futureMarketValue - purchasePrice);
  const capitalGainsTax = capitalGains * capitalGainsTaxRate;
  
  // Calculate selling costs
  const sellingCosts = futureMarketValue * sellingCostsRate;
  
  // Calculate cumulative net yield (rent - expenses, no mortgage payment in yield)
  // This matches the TimeSeries table calculation exactly
  const rentGrowthRate = propertyAppreciationRate * 0.7; // 70% of appreciation
  const expenseGrowthRate = 0.02; // 2% annual growth
  let cumulativeNetYield = 0;
  
  for (let y = 1; y <= year; y++) {
    const yearlyRent = monthlyRent * 12 * Math.pow(1 + rentGrowthRate, y - 1);
    const yearlyExpenses = monthlyExpenses * 12 * Math.pow(1 + expenseGrowthRate, y - 1);
    // Annual Net Yield = Rent - Expenses (no mortgage payment subtracted here)
    const annualNetYield = yearlyRent - yearlyExpenses;
    
    // Convert to present value and accumulate
    const annualNetYieldPV = annualNetYield * Math.pow(1 + inflationRate, -y);
    cumulativeNetYield += annualNetYieldPV;
  }
  
  // Calculate net equity at future year (in present value terms)
  const futureNetEquity = futureMarketValue - remainingBalance - capitalGainsTax - sellingCosts;
  const futureNetEquityPV = futureNetEquity * Math.pow(1 + inflationRate, -year);
  
  // Calculate cumulative mortgage payments in present value
  let cumulativeMortgagePV = 0;
  let runningBalance = currentOutstandingBalance;
  
  for (let y = 1; y <= year; y++) {
    if (runningBalance > 0) {
      // Annual mortgage payment in present value
      const annualMortgagePV = (monthlyMortgage * 12) * Math.pow(1 + inflationRate, -y);
      cumulativeMortgagePV += annualMortgagePV;
      
      // Update running balance for next year (simplified amortization)
      for (let month = 1; month <= 12; month++) {
        if (runningBalance <= 0) break;
        const interestPayment = runningBalance * monthlyInterestRate;
        const principalPayment = monthlyMortgage - interestPayment;
        runningBalance = Math.max(0, runningBalance - principalPayment);
      }
    }
  }
  
  // Net Gain = Future Net Equity (PV) + Cumulative Net Yield (PV) - Cumulative Mortgage Payments (PV)
  // This exactly matches the TimeSeries table formula: netEquityToday + cumulativeNetYield - cumulativeAnnualMortgagePV
  const netGainPV = futureNetEquityPV + cumulativeNetYield - cumulativeMortgagePV;
  
  return netGainPV;
}

export default function Charts() {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  const { data: investments, isLoading, error } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading investments...</div>
      </div>
    );
  }

  if (error) {
    console.error('Charts page error:', error);
    return (
      <div className="container mx-auto p-6">
        <div className="text-center text-red-500">Error loading investments: {String(error)}</div>
      </div>
    );
  }

  if (!investments || investments.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">No investments found.</div>
      </div>
    );
  }

  // Generate chart data for years 0-30
  const years = Array.from({ length: 31 }, (_, i) => i);
  const chartData: ChartDataPoint[] = years.map(year => {
    const dataPoint: ChartDataPoint = { year };
    
    selectedProperties.forEach(propertyId => {
      const investment = investments.find(inv => inv.id === propertyId);
      if (investment) {
        dataPoint[propertyId] = calculateNetGainPV(investment, year);
      }
    });
    
    return dataPoint;
  });

  // Generate colors for different properties
  const colors = [
    "#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea", 
    "#c2410c", "#0891b2", "#be123c", "#4338ca", "#059669"
  ];

  const handlePropertyToggle = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    }
  };

  const selectAllProperties = () => {
    setSelectedProperties(investments.map(inv => inv.id));
  };

  const clearAllProperties = () => {
    setSelectedProperties([]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Charts</h1>
          <p className="text-muted-foreground">
            Analyze Net Gain Present Value projections across multiple properties
          </p>
        </div>
      </div>

      {/* Property Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Property Selection</CardTitle>
          <CardDescription>
            Select properties to compare their Net Gain Present Value over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={selectAllProperties}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllProperties}>
              Clear All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {investments.map((investment, index) => (
              <div key={investment.id} className="flex items-center space-x-2">
                <Checkbox
                  id={investment.id}
                  checked={selectedProperties.includes(investment.id)}
                  onCheckedChange={(checked) => 
                    handlePropertyToggle(investment.id, checked as boolean)
                  }
                />
                <label
                  htmlFor={investment.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                >
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  {investment.propertyName}
                  <span className="text-muted-foreground ml-1">
                    ({investment.country || 'USA'})
                  </span>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Net Gain Present Value Over Time</CardTitle>
          <CardDescription>
            Shows projected net gain in today's dollars (present value) for selected properties over 30 years
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedProperties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Select one or more properties to view the chart
            </div>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="year" 
                    label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Net Gain (Present Value)', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      const investment = investments.find(inv => inv.id === name);
                      const propertyName = investment?.propertyName || name;
                      return [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, propertyName];
                    }}
                    labelFormatter={(year) => `Year ${year}`}
                  />
                  <Legend 
                    formatter={(value) => {
                      const investment = investments.find(inv => inv.id === value);
                      return investment?.propertyName || value;
                    }}
                  />
                  {selectedProperties.map((propertyId, index) => (
                    <Line
                      key={propertyId}
                      type="monotone"
                      dataKey={propertyId}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      {selectedProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>30-Year Net Gain Summary</CardTitle>
            <CardDescription>
              Projected net gain present value at year 30 for selected properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedProperties.map((propertyId, index) => {
                const investment = investments.find(inv => inv.id === propertyId);
                if (!investment) return null;
                
                const netGain30 = calculateNetGainPV(investment, 30);
                
                return (
                  <div key={propertyId} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <h4 className="font-medium">{investment.propertyName}</h4>
                    </div>
                    <p className="text-2xl font-bold text-green-600">
                      ${netGain30.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      30-year net gain (PV)
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}