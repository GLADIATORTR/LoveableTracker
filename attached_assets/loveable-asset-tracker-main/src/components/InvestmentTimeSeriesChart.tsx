import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";
import { RealEstateInvestment } from "@/pages/Index";
import { TaxBenefitsCalculator } from "@/components/TaxBenefitsCalculator";
import { getEffectiveMonthlyExpenses } from "@/lib/propertyUtils";
import { useGlobalSettings } from "@/contexts/GlobalSettingsContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { createInvestmentScenarios, getScenarioDisplayName, InvestmentScenario, ScenarioInvestment } from "@/lib/investmentScenarios";
import { useState, Fragment } from "react";
import { Switch } from "@/components/ui/switch";

interface InvestmentTimeSeriesChartProps {
  investments: RealEstateInvestment[];
}

interface TimeSeriesData {
  year: number;
  [propertyKey: string]: number;
}

interface MetricData {
  afterTaxNetEquity: number;
  netValue: number;
  netValuePercentage: number;
  netCashFlow: number;
  taxBenefits: number;
}

const InvestmentTimeSeriesChart = ({ investments }: InvestmentTimeSeriesChartProps) => {
  if (!investments.length) return null;

  const { settings } = useGlobalSettings();
  
  // Create all scenarios for all investments
  const allScenarios: ScenarioInvestment[] = investments.flatMap(inv => createInvestmentScenarios(inv));
  
  // State for metric selection
  const [selectedMetric, setSelectedMetric] = useState<'afterTaxNetEquity' | 'netValue' | 'netValuePercentage' | 'netCashFlow' | 'taxBenefits'>('afterTaxNetEquity');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(
    // Default to current scenarios for all properties
    allScenarios.filter(scenario => scenario.scenarioType === 'current')
      .map(scenario => `${scenario.propertyName.replace(/\s+/g, '_')}_${scenario.scenarioType}`)
  );
  const [showRealValues, setShowRealValues] = useState<boolean>(true);

  // Generate colors for scenarios (3 scenarios per property)
  const baseColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];
  
  const getScenarioColor = (propertyIndex: number, scenario: InvestmentScenario): string => {
    return baseColors[propertyIndex % baseColors.length];
  };

  const getStrokeDashArray = (scenario: InvestmentScenario): string => {
    switch (scenario) {
      case 'current': return '0'; // Solid line
      case 'maxDebt': return '5 5'; // Dashed line
      case 'zeroDebt': return '10 2'; // Dotted line
      default: return '0';
    }
  };
  
  const getMetricLabels = () => ({
    afterTaxNetEquity: showRealValues ? 'After Tax Net Equity (Today\'s $)' : 'After Tax Net Equity (Nominal $)',
    netValue: showRealValues ? 'Net Value (Today\'s $)' : 'Net Value (Nominal $)',
    netValuePercentage: '%Net Value (of Net After Tax Equity)',
    netCashFlow: 'Annual Net Cash Flow',
    taxBenefits: 'Annual Tax Benefits'
  });

  const calculateYearlyMetrics = (investment: ScenarioInvestment, year: number): MetricData => {
    const yearsFromNow = year - new Date().getFullYear();
    const currentValue = investment.currentValue * Math.pow(1 + investment.avgAppreciationRate / 100, yearsFromNow);
    
    // Calculate remaining balance after years
    const monthlyRate = investment.interestRate / 100 / 12;
    const totalPayments = investment.loanTerm * 12;
    const currentPayments = investment.currentTerm + (yearsFromNow * 12);
    const remainingPayments = Math.max(0, totalPayments - currentPayments);
    
    let outstandingBalance = investment.outstandingBalance;
    
    if (remainingPayments > 0 && monthlyRate > 0 && investment.monthlyMortgage > 0) {
      // Calculate remaining balance using amortization formula
      outstandingBalance = investment.monthlyMortgage * 
        (Math.pow(1 + monthlyRate, remainingPayments) - 1) / 
        (monthlyRate * Math.pow(1 + monthlyRate, remainingPayments));
    } else {
      outstandingBalance = 0; // Mortgage paid off
    }

    // 1. After Tax Net Equity (nominal value)
    const sellingCosts = currentValue * (settings.sellingCosts / 100);
    const capitalGains = Math.max(0, currentValue - investment.purchasePrice);
    const capitalGainsTax = capitalGains * (settings.capitalGainsTax / 100);
    const nominalAfterTaxNetEquity = currentValue - outstandingBalance - sellingCosts - capitalGainsTax;
    
    // Adjust for inflation to get real value in today's dollars (using global settings)
    const inflationRate = settings.inflationRate;
    const afterTaxNetEquity = showRealValues 
      ? nominalAfterTaxNetEquity / Math.pow(1 + inflationRate / 100, yearsFromNow)
      : nominalAfterTaxNetEquity;
    
    // 2. Net Value: Cumulative total return (Net Yield - Interest + Appreciation + Tax Benefits)
    let netValue = 0;
    const initialInvestment = investment.downPayment + (investment.purchasePrice * 0.03); // Down payment + closing costs
    
    // Calculate cumulative value over the years
    for (let y = 1; y <= yearsFromNow; y++) {
      // Annual net yield (rent - expenses, excluding mortgage)
      const monthlyRent = investment.monthlyRent;
      const monthlyExpenses = getEffectiveMonthlyExpenses(investment);
      const annualNetYield = (monthlyRent - monthlyExpenses) * 12;
      
      // Annual interest paid (rough approximation)
      const annualInterest = outstandingBalance * (investment.interestRate / 100);
      
      // Annual appreciation
      const prevValue = investment.currentValue * Math.pow(1 + investment.avgAppreciationRate / 100, y - 1);
      const currValue = investment.currentValue * Math.pow(1 + investment.avgAppreciationRate / 100, y);
      const annualAppreciation = currValue - prevValue;
      
      // Tax benefits for this year
      const mockInvestment: ScenarioInvestment = {
        ...investment,
        currentValue: currValue,
        outstandingBalance,
      };
      const taxBenefitsResult = TaxBenefitsCalculator.calculateTaxBenefits(mockInvestment);
      const annualTaxBenefits = taxBenefitsResult.totalTaxBenefits;
      
      // Net Value formula: Net Yield - Interest + Appreciation + Tax Benefits
      const yearlyNetValue = annualNetYield - annualInterest + annualAppreciation + annualTaxBenefits;
      
      // Adjust for inflation and add to cumulative total
      netValue += showRealValues 
        ? yearlyNetValue / Math.pow(1 + inflationRate / 100, y)
        : yearlyNetValue;
    }
    
    // 3. Net Cash Flow (annual, current year)
    const monthlyRent = investment.monthlyRent;
    const monthlyExpenses = getEffectiveMonthlyExpenses(investment);
    const monthlyMortgage = investment.monthlyMortgage || 0;
    const netCashFlow = monthlyRent - monthlyExpenses - monthlyMortgage;
    
    // 4. Tax Benefits (annual, current year)
    const mockInvestment: ScenarioInvestment = {
      ...investment,
      currentValue,
      outstandingBalance,
    };
    const taxBenefitsResult = TaxBenefitsCalculator.calculateTaxBenefits(mockInvestment);
    const taxBenefits = taxBenefitsResult.totalTaxBenefits;
    
    // Calculate percentage: Net Value as % of After Tax Net Equity
    const netValuePercentage = afterTaxNetEquity > 0 ? (netValue / afterTaxNetEquity) * 100 : 0;
    
    return {
      afterTaxNetEquity,
      netValue,
      netValuePercentage,
      netCashFlow: netCashFlow * 12, // Convert to annual
      taxBenefits,
    };
  };

  // Generate time series data for next 15 years
  const currentYear = new Date().getFullYear();
  const timeSeriesData: TimeSeriesData[] = [];
  
  for (let year = currentYear; year <= currentYear + 15; year++) {
    const yearData: TimeSeriesData = { year };
    
    allScenarios.forEach((scenario, index) => {
      const scenarioKey = `${scenario.propertyName.replace(/\s+/g, '_')}_${scenario.scenarioType}`;
      const metrics = calculateYearlyMetrics(scenario, year);
      
      // Add each metric for this scenario
      yearData[`${scenarioKey}_afterTaxNetEquity`] = metrics.afterTaxNetEquity;
      yearData[`${scenarioKey}_netValue`] = metrics.netValue;
      yearData[`${scenarioKey}_netValuePercentage`] = metrics.netValuePercentage;
      yearData[`${scenarioKey}_netCashFlow`] = metrics.netCashFlow;
      yearData[`${scenarioKey}_taxBenefits`] = metrics.taxBenefits;
    });
    
    timeSeriesData.push(yearData);
  }

  // Create chart config for selected metric and scenarios
  const chartConfig = allScenarios.reduce((config, scenario, index) => {
    const scenarioKey = `${scenario.propertyName.replace(/\s+/g, '_')}_${scenario.scenarioType}`;
    
    if (selectedScenarios.includes(scenarioKey)) {
      const propertyIndex = investments.findIndex(inv => inv.propertyName === scenario.propertyName);
      config[`${scenarioKey}_${selectedMetric}`] = {
        label: getScenarioDisplayName(scenario.propertyName, scenario.scenarioType),
        color: getScenarioColor(propertyIndex, scenario.scenarioType),
      };
    }
    
    return config;
  }, {} as Record<string, { label: string; color: string }>);

  const handleScenarioToggle = (scenarioKey: string, checked: boolean) => {
    if (checked) {
      setSelectedScenarios(prev => [...prev, scenarioKey]);
    } else {
      setSelectedScenarios(prev => prev.filter(s => s !== scenarioKey));
    }
  };

  const formatCurrency = (value: number) => `$${Math.round(value / 1000)}k`;
  const formatCashFlow = (value: number) => `$${Math.round(value).toLocaleString()}`;
  const formatPercentage = (value: number) => `${Math.round(value)}%`;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Investment Performance Projections</CardTitle>
        <CardDescription>
          Select a metric and properties to analyze performance over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Value Type Toggle */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Label className="text-base font-medium mb-2 block">Select Metric</Label>
          </div>
          <div className="flex items-center space-x-3">
            <Label htmlFor="value-toggle" className="text-sm">
              Nominal $
            </Label>
            <Switch
              id="value-toggle"
              checked={showRealValues}
              onCheckedChange={setShowRealValues}
            />
            <Label htmlFor="value-toggle" className="text-sm">
              Today's $ ({settings.inflationRate}% inflation adjusted)
            </Label>
          </div>
        </div>

        {/* Metric Selection */}
        <div className="mb-6 space-y-4">
          <div>
            <TooltipProvider>
              <RadioGroup value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="afterTaxNetEquity" id="afterTaxNetEquity" />
                  <Label htmlFor="afterTaxNetEquity" className="flex items-center gap-2">
                    {getMetricLabels().afterTaxNetEquity}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-medium">After Tax Net Equity Formula:</p>
                        <p>Current Value - Outstanding Balance - Selling Costs - Capital Gains Tax</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Where Current Value = Purchase Price × (1 + Appreciation Rate)^Years
                        </p>
                        <p className="text-xs mt-1 font-medium text-primary">
                          {showRealValues 
                            ? `Values adjusted for ${settings.inflationRate}% inflation to show real purchasing power in today's dollars`
                            : 'Values shown in nominal dollars (not adjusted for inflation)'
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="netValue" id="netValue" />
                  <Label htmlFor="netValue" className="flex items-center gap-2">
                    {getMetricLabels().netValue}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-medium">Net Value Formula:</p>
                        <p>Cumulative: Net Yield - Interest + Appreciation + Tax Benefits</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Total investment return including cash flow, appreciation, and tax benefits
                        </p>
                        <p className="text-xs mt-1 font-medium text-primary">
                          {showRealValues 
                            ? `Values adjusted for ${settings.inflationRate}% inflation to show real purchasing power in today's dollars`
                            : 'Values shown in nominal dollars (not adjusted for inflation)'
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="netValuePercentage" id="netValuePercentage" />
                  <Label htmlFor="netValuePercentage" className="flex items-center gap-2">
                    %Net Value (of Net After Tax Equity)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-medium">%Net Value Formula:</p>
                        <p>(Net Value ÷ After Tax Net Equity) × 100</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Shows Net Value as a percentage of After Tax Net Equity for comparison
                        </p>
                        <p className="text-xs mt-1 font-medium text-primary">
                          Higher percentages indicate better total return relative to equity position
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="netCashFlow" id="netCashFlow" />
                  <Label htmlFor="netCashFlow" className="flex items-center gap-2">
                    Annual Net Cash Flow
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-medium">Annual Net Cash Flow Formula:</p>
                        <p>(Monthly Rent - Monthly Expenses - Monthly Mortgage) × 12</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Represents annual operating cash flow from the property
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="taxBenefits" id="taxBenefits" />
                  <Label htmlFor="taxBenefits" className="flex items-center gap-2">
                    Annual Tax Benefits
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p className="font-medium">Annual Tax Benefits Formula:</p>
                        <p>Depreciation + Mortgage Interest + Operating Expenses + Professional Fees</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Total tax-deductible amounts that reduce taxable income
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
              </RadioGroup>
            </TooltipProvider>
          </div>
          
          {/* Scenario Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Select Investment Scenarios</Label>
            <div className="space-y-3">
              {investments.map((investment, propertyIndex) => {
                const scenarios = createInvestmentScenarios(investment);
                return (
                  <div key={investment.id} className="border rounded-lg p-3">
                    <div className="font-medium mb-2 flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: baseColors[propertyIndex % baseColors.length] }}
                      />
                      {investment.propertyName}
                    </div>
                    <div className="flex flex-wrap gap-3 ml-5">
                      {scenarios.map((scenario) => {
                        const scenarioKey = `${scenario.propertyName.replace(/\s+/g, '_')}_${scenario.scenarioType}`;
                        return (
                          <div key={scenarioKey} className="flex items-center space-x-2">
                            <Checkbox 
                              id={scenarioKey}
                              checked={selectedScenarios.includes(scenarioKey)}
                              onCheckedChange={(checked) => handleScenarioToggle(scenarioKey, !!checked)}
                            />
                            <Label htmlFor={scenarioKey} className="text-sm">
                              {scenario.scenarioLabel}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="year" 
                tickFormatter={(value) => value.toString()}
                className="text-xs text-muted-foreground"
              />
              <YAxis 
                tickFormatter={
                  selectedMetric === 'afterTaxNetEquity' || selectedMetric === 'netValue' ? formatCurrency :
                  selectedMetric === 'netValuePercentage' ? formatPercentage : formatCashFlow
                }
                className="text-xs text-muted-foreground"
                domain={selectedMetric === 'netValuePercentage' ? ['dataMin * 1.1', 'dataMax * 1.1'] : [0, 'dataMax * 1.1']}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value: number, name: string) => {
                      const label = chartConfig[name]?.label || name;
                      const formattedValue = selectedMetric === 'afterTaxNetEquity' || selectedMetric === 'netValue'
                        ? formatCurrency(value) 
                        : selectedMetric === 'netValuePercentage'
                        ? formatPercentage(value)
                        : formatCashFlow(value);
                      
                      return [formattedValue, label];
                    }}
                    labelFormatter={(year) => `Year: ${year}`}
                  />
                } 
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                formatter={(value) => chartConfig[value]?.label || value}
              />
              {allScenarios.map((scenario, index) => {
                const scenarioKey = `${scenario.propertyName.replace(/\s+/g, '_')}_${scenario.scenarioType}`;
                
                if (!selectedScenarios.includes(scenarioKey)) return null;
                
                const propertyIndex = investments.findIndex(inv => inv.propertyName === scenario.propertyName);
                
                return (
                  <Line
                    key={`${scenarioKey}_${selectedMetric}`}
                    type="monotone"
                    dataKey={`${scenarioKey}_${selectedMetric}`}
                    stroke={getScenarioColor(propertyIndex, scenario.scenarioType)}
                    strokeWidth={3}
                    strokeDasharray={getStrokeDashArray(scenario.scenarioType)}
                    dot={{ r: 4 }}
                    connectNulls={false}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        {/* Details Table */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Investment Details Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border p-3 text-left font-medium">Property / Metric</th>
                  <th className="border border-border p-3 text-center font-medium">Y0</th>
                  <th className="border border-border p-3 text-center font-medium">Y1</th>
                  <th className="border border-border p-3 text-center font-medium">Y2</th>
                  <th className="border border-border p-3 text-center font-medium">Y3</th>
                  <th className="border border-border p-3 text-center font-medium">Y4</th>
                  <th className="border border-border p-3 text-center font-medium">Y5</th>
                  <th className="border border-border p-3 text-center font-medium">Y10</th>
                  <th className="border border-border p-3 text-center font-medium">Y15</th>
                </tr>
              </thead>
              <tbody>
                {allScenarios
                  .filter(scenario => selectedScenarios.includes(`${scenario.propertyName.replace(/\s+/g, '_')}_${scenario.scenarioType}`))
                  .map((scenario) => {
                    const scenarioKey = `${scenario.propertyName.replace(/\s+/g, '_')}_${scenario.scenarioType}`;
                    const years = [0, 1, 2, 3, 4, 5, 10, 15];
                    
                    return (
                      <Fragment key={scenarioKey}>
                        {/* Property Header */}
                        <tr className="bg-muted/20">
                          <td colSpan={9} className="border border-border p-3 font-semibold text-primary">
                            {getScenarioDisplayName(scenario.propertyName, scenario.scenarioType)}
                          </td>
                        </tr>
                        
                        {/* Market Value */}
                        <tr>
                          <td className="border border-border p-3 font-medium pl-6">Market Value</td>
                          {years.map(year => {
                            const currentValue = scenario.currentValue * Math.pow(1 + scenario.avgAppreciationRate / 100, year);
                            return (
                              <td key={year} className="border border-border p-3 text-center">
                                {formatCurrency(currentValue)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Outstanding Balance */}
                        <tr>
                          <td className="border border-border p-3 font-medium pl-6">Outstanding Balance</td>
                          {years.map(year => {
                            const monthlyRate = scenario.interestRate / 100 / 12;
                            const totalPayments = scenario.loanTerm * 12;
                            const currentPayments = scenario.currentTerm + (year * 12);
                            const remainingPayments = Math.max(0, totalPayments - currentPayments);
                            
                            let outstandingBalance = scenario.outstandingBalance;
                            
                            if (remainingPayments > 0 && monthlyRate > 0 && scenario.monthlyMortgage > 0) {
                              outstandingBalance = scenario.monthlyMortgage * 
                                (Math.pow(1 + monthlyRate, remainingPayments) - 1) / 
                                (monthlyRate * Math.pow(1 + monthlyRate, remainingPayments));
                            } else {
                              outstandingBalance = 0;
                            }
                            
                            return (
                              <td key={year} className="border border-border p-3 text-center">
                                {formatCurrency(outstandingBalance)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Capital Gains Tax */}
                        <tr>
                          <td className="border border-border p-3 font-medium pl-6">Capital Gains Tax</td>
                          {years.map(year => {
                            const currentValue = scenario.currentValue * Math.pow(1 + scenario.avgAppreciationRate / 100, year);
                            const capitalGains = Math.max(0, currentValue - scenario.purchasePrice);
                            const capitalGainsTax = capitalGains * (settings.capitalGainsTax / 100);
                            
                            return (
                              <td key={year} className="border border-border p-3 text-center">
                                {formatCurrency(capitalGainsTax)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Selling Costs */}
                        <tr>
                          <td className="border border-border p-3 font-medium pl-6">Selling Costs</td>
                          {years.map(year => {
                            const currentValue = scenario.currentValue * Math.pow(1 + scenario.avgAppreciationRate / 100, year);
                            const sellingCosts = currentValue * (settings.sellingCosts / 100);
                            
                            return (
                              <td key={year} className="border border-border p-3 text-center">
                                {formatCurrency(sellingCosts)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Total Sales Cost */}
                        <tr>
                          <td className="border border-border p-3 font-medium pl-6">Total Sales Cost (Tax + Selling)</td>
                          {years.map(year => {
                            const currentValue = scenario.currentValue * Math.pow(1 + scenario.avgAppreciationRate / 100, year);
                            const sellingCosts = currentValue * (settings.sellingCosts / 100);
                            const capitalGains = Math.max(0, currentValue - scenario.purchasePrice);
                            const capitalGainsTax = capitalGains * (settings.capitalGainsTax / 100);
                            const totalSalesCost = sellingCosts + capitalGainsTax;
                            
                            return (
                              <td key={year} className="border border-border p-3 text-center">
                                {formatCurrency(totalSalesCost)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Net Equity (Nominal) */}
                        <tr>
                          <td className="border border-border p-3 font-medium pl-6">Net Equity (Nominal)</td>
                          {years.map(year => {
                            const currentValue = scenario.currentValue * Math.pow(1 + scenario.avgAppreciationRate / 100, year);
                            const monthlyRate = scenario.interestRate / 100 / 12;
                            const totalPayments = scenario.loanTerm * 12;
                            const currentPayments = scenario.currentTerm + (year * 12);
                            const remainingPayments = Math.max(0, totalPayments - currentPayments);
                            
                            let outstandingBalance = scenario.outstandingBalance;
                            
                            if (remainingPayments > 0 && monthlyRate > 0 && scenario.monthlyMortgage > 0) {
                              outstandingBalance = scenario.monthlyMortgage * 
                                (Math.pow(1 + monthlyRate, remainingPayments) - 1) / 
                                (monthlyRate * Math.pow(1 + monthlyRate, remainingPayments));
                            } else {
                              outstandingBalance = 0;
                            }
                            
                            const sellingCosts = currentValue * (settings.sellingCosts / 100);
                            const capitalGains = Math.max(0, currentValue - scenario.purchasePrice);
                            const capitalGainsTax = capitalGains * (settings.capitalGainsTax / 100);
                            const nominalNetEquity = currentValue - outstandingBalance - sellingCosts - capitalGainsTax;
                            
                            return (
                              <td key={year} className="border border-border p-3 text-center">
                                {formatCurrency(nominalNetEquity)}
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Inflation Adjusted Net Equity */}
                        <tr className="bg-accent/20">
                          <td className="border border-border p-3 font-medium pl-6">Inflation Adjusted Net Equity (Today's $)</td>
                          {years.map(year => {
                            const metrics = calculateYearlyMetrics(scenario, currentYear + year);
                            
                            return (
                              <td key={year} className="border border-border p-3 text-center font-medium">
                                {formatCurrency(metrics.afterTaxNetEquity)}
                              </td>
                            );
                          })}
                        </tr>
                      </Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InvestmentTimeSeriesChart;