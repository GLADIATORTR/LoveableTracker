import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { RealEstateInvestment } from "@/pages/Index";
import { getEffectiveMonthlyRent, getEffectiveMonthlyExpenses } from '../lib/propertyUtils';
import { TaxBenefitsCalculator } from './TaxBenefitsCalculator';
import { HelpCircle } from 'lucide-react';

interface InvestmentDecisionAnalyzerProps {
  investments: RealEstateInvestment[];
}

interface IRRAnalysis {
  timeHorizon: number;
  irr: number;
  npv: number;
  npvIndex: number;
  totalCashFlow: number;
  finalValue: number;
  cumulativeReturn: number;
}

interface ComparisonScenario {
  sellPropertyA: boolean;
  reinvestAmount: number;
  newPropertyPrice: number;
  newPropertyRent: number;
  newPropertyExpenses: number;
  transactionCosts: number;
}

export const InvestmentDecisionAnalyzer: React.FC<InvestmentDecisionAnalyzerProps> = ({ investments }) => {
  const [selectedProperty, setSelectedProperty] = useState<string>(investments[0]?.id || '');
  const [comparisonProperty, setComparisonProperty] = useState<string>(investments[1]?.id || '');
  const [discountRate, setDiscountRate] = useState<number>(8);
  const [showNPVIndex, setShowNPVIndex] = useState<boolean>(false);
  const [scenario, setScenario] = useState<ComparisonScenario>({
    sellPropertyA: false,
    reinvestAmount: 0,
    newPropertyPrice: 0,
    newPropertyRent: 0,
    newPropertyExpenses: 0,
    transactionCosts: 6 // 6% transaction costs
  });

  const selectedInvestment = investments.find(inv => inv.id === selectedProperty);
  const comparisonInvestment = investments.find(inv => inv.id === comparisonProperty);

  const timeHorizons = [5, 10, 15, 20, 25, 30];

  // IRR calculation using Newton-Raphson method
  const calculateIRR = (cashFlows: number[], initialGuess: number = 0.1): number => {
    let rate = initialGuess;
    const maxIterations = 1000;
    const tolerance = 1e-7;

    for (let i = 0; i < maxIterations; i++) {
      let npv = 0;
      let dnpv = 0;

      for (let t = 0; t < cashFlows.length; t++) {
        const factor = Math.pow(1 + rate, t);
        npv += cashFlows[t] / factor;
        if (t > 0) {
          dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
        }
      }

      if (Math.abs(npv) < tolerance) {
        return rate * 100; // Return as percentage
      }

      if (Math.abs(dnpv) < tolerance) {
        break; // Avoid division by zero
      }

      rate = rate - npv / dnpv;
    }

    return rate * 100; // Return as percentage
  };

  const calculateNPV = (cashFlows: number[], discountRate: number): number => {
    return cashFlows.reduce((npv, cashFlow, index) => {
      return npv + cashFlow / Math.pow(1 + discountRate / 100, index);
    }, 0);
  };

  const generateCashFlows = (investment: RealEstateInvestment, years: number): number[] => {
    const cashFlows: number[] = [];
    const monthlyRent = getEffectiveMonthlyRent(investment);
    const monthlyExpenses = getEffectiveMonthlyExpenses(investment);
    const appreciationRate = investment.avgAppreciationRate || 3;
    const rentGrowthRate = 2; // Default 2% rent growth
    
    // Initial investment (negative cash flow)
    const downPayment = investment.downPayment;
    const closingCosts = investment.purchasePrice * 0.03; // Assume 3% closing costs
    cashFlows.push(-(downPayment + closingCosts));

    let currentRent = monthlyRent;
    let currentExpenses = monthlyExpenses;
    let currentValue = investment.purchasePrice;
    let mortgageBalance = investment.loanAmount;
    const monthlyMortgagePayment = investment.monthlyMortgage;

    for (let year = 1; year <= years; year++) {
      // Calculate annual cash flow
      const annualRent = currentRent * 12;
      const annualExpenses = currentExpenses * 12;
      const annualMortgagePayments = monthlyMortgagePayment * 12;
      
      // Tax benefits
      const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(investment);
      const taxSavings = TaxBenefitsCalculator.calculateTaxSavings(taxBenefits.totalTaxBenefits);
      
      const netCashFlow = annualRent - annualExpenses - annualMortgagePayments + taxSavings;
      
      // If final year, add sale proceeds
      if (year === years) {
        // Mortgage balance reduction (simplified)
        const principalPayments = year * (monthlyMortgagePayment * 12 * 0.3); // Rough estimate
        mortgageBalance = Math.max(0, mortgageBalance - principalPayments);
        
        const salePrice = currentValue * Math.pow(1 + appreciationRate / 100, year);
        const sellingCosts = salePrice * 0.06; // 6% selling costs
        const netSaleProceeds = salePrice - mortgageBalance - sellingCosts;
        
        cashFlows.push(netCashFlow + netSaleProceeds);
      } else {
        cashFlows.push(netCashFlow);
      }

      // Update for next year
      currentRent *= (1 + rentGrowthRate / 100);
      currentExpenses *= (1 + 2 / 100); // Assume 2% expense inflation
      currentValue *= (1 + appreciationRate / 100);
    }

    return cashFlows;
  };

  const analysisResults = useMemo(() => {
    if (!selectedInvestment) return [];

    return timeHorizons.map(years => {
      const cashFlows = generateCashFlows(selectedInvestment, years);
      const irr = calculateIRR(cashFlows);
      const npv = calculateNPV(cashFlows, discountRate);
      const totalCashFlow = cashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
      const finalValue = cashFlows[cashFlows.length - 1];
      const initialInvestment = Math.abs(cashFlows[0]);
      const cumulativeReturn = ((totalCashFlow / initialInvestment) - 1) * 100;
      const npvIndex = initialInvestment > 0 ? (npv + initialInvestment) / initialInvestment : 1;

      return {
        timeHorizon: years,
        irr: isFinite(irr) ? irr : 0,
        npv,
        npvIndex: isFinite(npvIndex) ? npvIndex : 1,
        totalCashFlow,
        finalValue,
        cumulativeReturn: isFinite(cumulativeReturn) ? cumulativeReturn : 0
      } as IRRAnalysis;
    });
  }, [selectedInvestment, discountRate]);

  const comparisonResults = useMemo(() => {
    if (!comparisonInvestment) return [];

    return timeHorizons.map(years => {
      const cashFlows = generateCashFlows(comparisonInvestment, years);
      const irr = calculateIRR(cashFlows);
      const npv = calculateNPV(cashFlows, discountRate);
      const totalCashFlow = cashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
      const finalValue = cashFlows[cashFlows.length - 1];
      const initialInvestment = Math.abs(cashFlows[0]);
      const cumulativeReturn = ((totalCashFlow / initialInvestment) - 1) * 100;
      const npvIndex = initialInvestment > 0 ? (npv + initialInvestment) / initialInvestment : 1;

      return {
        timeHorizon: years,
        irr: isFinite(irr) ? irr : 0,
        npv,
        npvIndex: isFinite(npvIndex) ? npvIndex : 1,
        totalCashFlow,
        finalValue,
        cumulativeReturn: isFinite(cumulativeReturn) ? cumulativeReturn : 0
      } as IRRAnalysis;
    });
  }, [comparisonInvestment, discountRate]);

  const chartData = useMemo(() => {
    return timeHorizons.map(years => {
      const primaryResult = analysisResults.find(r => r.timeHorizon === years);
      const compResult = comparisonResults.find(r => r.timeHorizon === years);
      
      return {
        years,
        primaryIRR: primaryResult?.irr || 0,
        comparisonIRR: compResult?.irr || 0,
        primaryNPV: primaryResult?.npv || 0,
        comparisonNPV: compResult?.npv || 0,
        primaryNPVIndex: primaryResult?.npvIndex || 1,
        comparisonNPVIndex: compResult?.npvIndex || 1
      };
    });
  }, [analysisResults, comparisonResults]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  const formatNPVIndex = (index: number): string => {
    return index.toFixed(2);
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Investment Decision Analyzer</CardTitle>
          <CardDescription>
            Compare IRR and NPV across different time horizons to make optimal investment decisions
          </CardDescription>
        </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-property">Primary Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {investments.map((investment) => (
                    <SelectItem key={investment.id} value={investment.id}>
                      {investment.propertyName || `Property ${investment.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comparison-property">Comparison Property</Label>
              <Select value={comparisonProperty} onValueChange={setComparisonProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select property" />
                </SelectTrigger>
                <SelectContent>
                  {investments.map((investment) => (
                    <SelectItem key={investment.id} value={investment.id}>
                      {investment.propertyName || `Property ${investment.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount-rate" className="flex items-center gap-2">
                Discount Rate (%)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p className="font-medium">Discount Rate:</p>
                    <p>Your required rate of return for NPV calculations. Used to discount future cash flows to present value.</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Higher rates favor investments with earlier returns
                    </p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="discount-rate"
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                step="0.5"
                min="1"
                max="20"
              />
            </div>
          </div>

          <Tabs defaultValue="irr-analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="irr-analysis">IRR Analysis</TabsTrigger>
              <TabsTrigger value="npv-comparison">NPV Comparison</TabsTrigger>
              <TabsTrigger value="decision-matrix">Decision Matrix</TabsTrigger>
            </TabsList>

            <TabsContent value="irr-analysis" className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="years" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'IRR (%)', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [formatPercentage(value), name]}
                      labelFormatter={(label) => `${label} Years`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="primaryIRR" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name={selectedInvestment?.propertyName || "Primary Property"}
                    />
                    {comparisonInvestment && (
                      <Line 
                        type="monotone" 
                        dataKey="comparisonIRR" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={comparisonInvestment?.propertyName || "Comparison Property"}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time Horizon</TableHead>
                    <TableHead className="flex items-center gap-2">
                      IRR (%)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p className="font-medium">IRR Formula:</p>
                          <p>Internal Rate of Return - the discount rate that makes NPV = 0</p>
                          <p className="text-xs mt-1 text-muted-foreground">
                            Calculated using Newton-Raphson method on cash flows
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="flex items-center gap-2">
                      NPV
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p className="font-medium">NPV Formula:</p>
                          <p>Σ [Cash Flow ÷ (1 + Discount Rate)^Year]</p>
                          <p className="text-xs mt-1 text-muted-foreground">
                            Sum of discounted future cash flows minus initial investment
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="flex items-center gap-2">
                      NPV Index
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <p className="font-medium">NPV Index Formula:</p>
                          <p>(NPV + Initial Investment) ÷ Initial Investment</p>
                          <p className="text-xs mt-1 text-muted-foreground">
                            Values &gt; 1.0 indicate profitable investments. Normalizes for comparison.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead>Total Cash Flow</TableHead>
                    <TableHead>Cumulative Return (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysisResults.map((result) => (
                    <TableRow key={result.timeHorizon}>
                       <TableCell>{result.timeHorizon} years</TableCell>
                       <TableCell className="font-medium">{formatPercentage(result.irr)}</TableCell>
                       <TableCell>{formatCurrency(result.npv)}</TableCell>
                       <TableCell className="font-medium text-primary">{formatNPVIndex(result.npvIndex)}</TableCell>
                       <TableCell>{formatCurrency(result.totalCashFlow)}</TableCell>
                       <TableCell>{formatPercentage(result.cumulativeReturn)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="npv-comparison" className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Label htmlFor="npv-metric-toggle">NPV Metric:</Label>
                  <Select value={showNPVIndex ? "index" : "absolute"} onValueChange={(value) => setShowNPVIndex(value === "index")}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absolute">Absolute NPV ($)</SelectItem>
                      <SelectItem value="index">NPV Index (Normalized)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground max-w-md">
                  {showNPVIndex ? "NPV Index normalizes investments for comparison (>1.0 = profitable)" : "Absolute NPV shows total dollar value created"}
                </div>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="years" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: showNPVIndex ? 'NPV Index' : 'NPV ($)', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [
                        showNPVIndex ? formatNPVIndex(value) : formatCurrency(value), 
                        name
                      ]}
                      labelFormatter={(label) => `${label} Years`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey={showNPVIndex ? "primaryNPVIndex" : "primaryNPV"}
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name={selectedInvestment?.propertyName || "Primary Property"}
                    />
                    {comparisonInvestment && (
                      <Line 
                        type="monotone" 
                        dataKey={showNPVIndex ? "comparisonNPVIndex" : "comparisonNPV"}
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name={comparisonInvestment?.propertyName || "Comparison Property"}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Break-Even Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p>IRR exceeds discount rate at:</p>
                      {analysisResults.map(result => (
                        <div key={result.timeHorizon} className="flex justify-between">
                          <span>{result.timeHorizon} years:</span>
                          <span className={result.irr > discountRate ? "text-green-600" : "text-red-600"}>
                            {result.irr > discountRate ? "✓ Profitable" : "✗ Below target"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Optimal Hold Period</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const maxIRRResult = analysisResults.reduce((max, current) => 
                          current.irr > max.irr ? current : max
                        );
                        const maxNPVResult = analysisResults.reduce((max, current) => 
                          current.npv > max.npv ? current : max
                        );
                        const maxNPVIndexResult = analysisResults.reduce((max, current) => 
                          current.npvIndex > max.npvIndex ? current : max
                        );
                        return (
                          <>
                            <p><strong>Highest IRR:</strong> {maxIRRResult.timeHorizon} years ({formatPercentage(maxIRRResult.irr)})</p>
                            <p><strong>Highest NPV:</strong> {maxNPVResult.timeHorizon} years ({formatCurrency(maxNPVResult.npv)})</p>
                            <p><strong>Best NPV Index:</strong> {maxNPVIndexResult.timeHorizon} years ({formatNPVIndex(maxNPVIndexResult.npvIndex)})</p>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="decision-matrix" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">NPV Index Comparison</CardTitle>
                    <CardDescription>Normalized returns per dollar invested (values &gt; 1.0 indicate profitability)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {timeHorizons.map(years => {
                        const primaryResult = analysisResults.find(r => r.timeHorizon === years);
                        const compResult = comparisonResults.find(r => r.timeHorizon === years);
                        return (
                          <div key={years} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{years} years:</span>
                            <div className="flex gap-4">
                              <span className={primaryResult && primaryResult.npvIndex > 1 ? "text-green-600" : "text-red-600"}>
                                {primaryResult ? formatNPVIndex(primaryResult.npvIndex) : "—"}
                              </span>
                              {compResult && (
                                <span className={compResult.npvIndex > 1 ? "text-green-600" : "text-red-600"}>
                                  vs {formatNPVIndex(compResult.npvIndex)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Investment Efficiency</CardTitle>
                    <CardDescription>Which property delivers better returns per dollar invested</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {timeHorizons.map(years => {
                        const primaryResult = analysisResults.find(r => r.timeHorizon === years);
                        const compResult = comparisonResults.find(r => r.timeHorizon === years);
                        if (!primaryResult || !compResult) return null;
                        
                        const primaryBetter = primaryResult.npvIndex > compResult.npvIndex;
                        const difference = Math.abs(primaryResult.npvIndex - compResult.npvIndex);
                        
                        return (
                          <div key={years} className="flex justify-between items-center text-sm">
                            <span className="font-medium">{years} years:</span>
                            <span className={primaryBetter ? "text-green-600" : "text-orange-600"}>
                              {primaryBetter ? "Primary" : "Comparison"} by {formatNPVIndex(difference)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center p-8 text-muted-foreground">
                <h3 className="text-lg font-medium mb-2">Investment Decision Framework</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Short-term (5-10 years)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Focus on cash flow and liquidity. Consider loan terms that maximize early cash flows.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Medium-term (10-20 years)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Balance between cash flow and appreciation. Loan payoff effects become significant.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Long-term (20+ years)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">Appreciation and paid-off properties dominate returns. Consider refinancing strategies.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};