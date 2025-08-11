import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { RealEstateInvestment } from "@/pages/Index";
import { getEffectiveMonthlyRent, getEffectiveMonthlyExpenses } from '../lib/propertyUtils';
import { TaxBenefitsCalculator } from './TaxBenefitsCalculator';
import { useGlobalSettings } from '@/contexts/GlobalSettingsContext';
import { HelpCircle, CheckSquare, Square } from 'lucide-react';

interface InvestmentDecisionAnalyzerMultiProps {
  investments: RealEstateInvestment[];
}

interface IRRAnalysis {
  propertyId: string;
  propertyName: string;
  timeHorizon: number;
  irr: number;
  npv: number;
  npvIndex: number;
  totalCashFlow: number;
  finalValue: number;
  cumulativeReturn: number;
}

const COLORS = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#ca8a04', // Yellow
  '#7c3aed', // Purple
  '#ea580c', // Orange
  '#0891b2', // Cyan
  '#be185d', // Pink
  '#059669', // Emerald
  '#9333ea'  // Violet
];

export const InvestmentDecisionAnalyzerMulti: React.FC<InvestmentDecisionAnalyzerMultiProps> = ({ investments }) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>(investments.slice(0, 3).map(inv => inv.id));
  const [discountRate, setDiscountRate] = useState<number>(8);
  const { settings } = useGlobalSettings();

  const timeHorizons = [5, 10, 15, 20, 25, 30];

  // Toggle property selection
  const toggleProperty = (propertyId: string) => {
    setSelectedProperties(prev => 
      prev.includes(propertyId) 
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

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

  const getCountrySettings = (country: string) => {
    if (country === 'Turkey') {
      return {
        appreciationRate: settings.realEstateAppreciationRateTurkey,
        inflationRate: settings.inflationRateTurkey,
        sellingCosts: settings.sellingCostsTurkey,
        capitalGainsTax: settings.capitalGainsTaxTurkey,
        mortgageRate: settings.currentMortgageRateTurkey
      };
    }
    return {
      appreciationRate: settings.realEstateAppreciationRate,
      inflationRate: settings.inflationRate,
      sellingCosts: settings.sellingCosts,
      capitalGainsTax: settings.capitalGainsTax,
      mortgageRate: settings.currentMortgageRate
    };
  };

  const generateCashFlows = (investment: RealEstateInvestment, years: number): number[] => {
    const cashFlows: number[] = [];
    const monthlyRent = getEffectiveMonthlyRent(investment);
    const monthlyExpenses = getEffectiveMonthlyExpenses(investment);
    const countrySettings = getCountrySettings(investment.country || 'USA');
    const appreciationRate = investment.avgAppreciationRate || countrySettings.appreciationRate;
    const rentGrowthRate = Math.max(2, countrySettings.inflationRate - 2); // Rent growth tied to inflation
    
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
      
      // Tax benefits with country-specific tax rate
      const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(investment);
      const taxSavings = TaxBenefitsCalculator.calculateTaxSavings(taxBenefits.totalTaxBenefits, countrySettings.capitalGainsTax / 100);
      
      const netCashFlow = annualRent - annualExpenses - annualMortgagePayments + taxSavings;
      
      // If final year, add sale proceeds
      if (year === years) {
        // Mortgage balance reduction (simplified)
        const principalPayments = year * (monthlyMortgagePayment * 12 * 0.3); // Rough estimate
        mortgageBalance = Math.max(0, mortgageBalance - principalPayments);
        
        const salePrice = currentValue * Math.pow(1 + appreciationRate / 100, year);
        const sellingCosts = salePrice * (countrySettings.sellingCosts / 100);
        const capitalGains = Math.max(0, salePrice - investment.purchasePrice);
        const capitalGainsTax = capitalGains * (countrySettings.capitalGainsTax / 100);
        const netSaleProceeds = salePrice - mortgageBalance - sellingCosts - capitalGainsTax;
        
        cashFlows.push(netCashFlow + netSaleProceeds);
      } else {
        cashFlows.push(netCashFlow);
      }

      // Update for next year
      currentRent *= (1 + rentGrowthRate / 100);
      currentExpenses *= (1 + countrySettings.inflationRate / 100);
      currentValue *= (1 + appreciationRate / 100);
    }

    return cashFlows;
  };

  const analysisResults = useMemo(() => {
    const results: IRRAnalysis[] = [];
    
    selectedProperties.forEach(propertyId => {
      const investment = investments.find(inv => inv.id === propertyId);
      if (!investment) return;

      timeHorizons.forEach(years => {
        const cashFlows = generateCashFlows(investment, years);
        const irr = calculateIRR(cashFlows);
        const npv = calculateNPV(cashFlows, discountRate);
        const totalCashFlow = cashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
        const finalValue = cashFlows[cashFlows.length - 1];
        const initialInvestment = Math.abs(cashFlows[0]);
        const cumulativeReturn = ((totalCashFlow / initialInvestment) - 1) * 100;
        const npvIndex = initialInvestment > 0 ? (npv + initialInvestment) / initialInvestment : 1;

        results.push({
          propertyId,
          propertyName: investment.propertyName || `Property ${investment.id.slice(0, 8)}`,
          timeHorizon: years,
          irr: isFinite(irr) ? irr : 0,
          npv,
          npvIndex: isFinite(npvIndex) ? npvIndex : 1,
          totalCashFlow,
          finalValue,
          cumulativeReturn: isFinite(cumulativeReturn) ? cumulativeReturn : 0
        });
      });
    });

    return results;
  }, [selectedProperties, investments, discountRate, settings]);

  const chartData = useMemo(() => {
    return timeHorizons.map(years => {
      const dataPoint: any = { years };
      
      selectedProperties.forEach((propertyId, index) => {
        const investment = investments.find(inv => inv.id === propertyId);
        if (!investment) return;
        
        const result = analysisResults.find(r => r.propertyId === propertyId && r.timeHorizon === years);
        const propertyName = investment.propertyName || `Property ${investment.id.slice(0, 8)}`;
        
        dataPoint[`${propertyName}_IRR`] = result?.irr || 0;
        dataPoint[`${propertyName}_NPV`] = result?.npv || 0;
        dataPoint[`${propertyName}_NPVIndex`] = result?.npvIndex || 1;
      });
      
      return dataPoint;
    });
  }, [analysisResults, selectedProperties, investments]);

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

  const getOptimalProperty = (timeHorizon: number, metric: 'irr' | 'npvIndex') => {
    const relevantResults = analysisResults.filter(r => r.timeHorizon === timeHorizon);
    if (relevantResults.length === 0) return null;
    
    return relevantResults.reduce((best, current) => 
      current[metric] > best[metric] ? current : best
    );
  };

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Multi-Property Investment Analyzer</CardTitle>
          <CardDescription>
            Compare IRR, NPV, and NPV Index across multiple properties and time horizons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Property Selection */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Select Properties to Compare</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {investments.map((investment) => (
                  <Button
                    key={investment.id}
                    variant={selectedProperties.includes(investment.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleProperty(investment.id)}
                    className="justify-start gap-2 h-auto p-3"
                  >
                    {selectedProperties.includes(investment.id) ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    <div className="text-left">
                      <div className="font-medium">{investment.propertyName || `Property ${investment.id.slice(0, 8)}`}</div>
                      <div className="text-xs text-muted-foreground">{investment.country || 'USA'}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Discount Rate */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {selectedProperties.length > 0 && (
              <Tabs defaultValue="irr-comparison" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="irr-comparison">IRR Comparison</TabsTrigger>
                  <TabsTrigger value="npv-comparison">NPV Comparison</TabsTrigger>
                  <TabsTrigger value="npv-index">NPV Index</TabsTrigger>
                  <TabsTrigger value="decision-matrix">Decision Matrix</TabsTrigger>
                </TabsList>

                <TabsContent value="irr-comparison" className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="years" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'IRR (%)', angle: -90, position: 'insideLeft' }} />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [formatPercentage(value), name.replace('_IRR', '')]}
                          labelFormatter={(label) => `${label} Years`}
                        />
                        <Legend />
                        {selectedProperties.map((propertyId, index) => {
                          const investment = investments.find(inv => inv.id === propertyId);
                          if (!investment) return null;
                          const propertyName = investment.propertyName || `Property ${investment.id.slice(0, 8)}`;
                          return (
                            <Line 
                              key={propertyId}
                              type="monotone" 
                              dataKey={`${propertyName}_IRR`}
                              stroke={COLORS[index % COLORS.length]}
                              strokeWidth={2}
                              name={propertyName}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="npv-comparison" className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="years" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'NPV ($)', angle: -90, position: 'insideLeft' }} />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [formatCurrency(value), name.replace('_NPV', '')]}
                          labelFormatter={(label) => `${label} Years`}
                        />
                        <Legend />
                        {selectedProperties.map((propertyId, index) => {
                          const investment = investments.find(inv => inv.id === propertyId);
                          if (!investment) return null;
                          const propertyName = investment.propertyName || `Property ${investment.id.slice(0, 8)}`;
                          return (
                            <Bar 
                              key={propertyId}
                              dataKey={`${propertyName}_NPV`}
                              fill={COLORS[index % COLORS.length]}
                              name={propertyName}
                            />
                          );
                        })}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="npv-index" className="space-y-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="years" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'NPV Index', angle: -90, position: 'insideLeft' }} />
                        <RechartsTooltip 
                          formatter={(value: number, name: string) => [formatNPVIndex(value), name.replace('_NPVIndex', '')]}
                          labelFormatter={(label) => `${label} Years`}
                        />
                        <Legend />
                        {selectedProperties.map((propertyId, index) => {
                          const investment = investments.find(inv => inv.id === propertyId);
                          if (!investment) return null;
                          const propertyName = investment.propertyName || `Property ${investment.id.slice(0, 8)}`;
                          return (
                            <Line 
                              key={propertyId}
                              type="monotone" 
                              dataKey={`${propertyName}_NPVIndex`}
                              stroke={COLORS[index % COLORS.length]}
                              strokeWidth={2}
                              name={propertyName}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timeHorizons.map(years => {
                      const optimal = getOptimalProperty(years, 'npvIndex');
                      return (
                        <Card key={years} className="p-4">
                          <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">{years} Year Hold</div>
                            <div className="font-semibold text-lg">Best: {optimal?.propertyName || 'N/A'}</div>
                            <div className="text-sm text-primary">NPV Index: {optimal ? formatNPVIndex(optimal.npvIndex) : 'N/A'}</div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="decision-matrix" className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>5Y IRR</TableHead>
                        <TableHead>10Y IRR</TableHead>
                        <TableHead>20Y IRR</TableHead>
                        <TableHead>5Y NPV Index</TableHead>
                        <TableHead>10Y NPV Index</TableHead>
                        <TableHead>20Y NPV Index</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProperties.map(propertyId => {
                        const investment = investments.find(inv => inv.id === propertyId);
                        if (!investment) return null;
                        
                        const results5y = analysisResults.find(r => r.propertyId === propertyId && r.timeHorizon === 5);
                        const results10y = analysisResults.find(r => r.propertyId === propertyId && r.timeHorizon === 10);
                        const results20y = analysisResults.find(r => r.propertyId === propertyId && r.timeHorizon === 20);
                        
                        return (
                          <TableRow key={propertyId}>
                            <TableCell className="font-medium">{investment.propertyName || `Property ${investment.id.slice(0, 8)}`}</TableCell>
                            <TableCell>{investment.country || 'USA'}</TableCell>
                            <TableCell>{results5y ? formatPercentage(results5y.irr) : 'N/A'}</TableCell>
                            <TableCell>{results10y ? formatPercentage(results10y.irr) : 'N/A'}</TableCell>
                            <TableCell>{results20y ? formatPercentage(results20y.irr) : 'N/A'}</TableCell>
                            <TableCell>{results5y ? formatNPVIndex(results5y.npvIndex) : 'N/A'}</TableCell>
                            <TableCell>{results10y ? formatNPVIndex(results10y.npvIndex) : 'N/A'}</TableCell>
                            <TableCell>{results20y ? formatNPVIndex(results20y.npvIndex) : 'N/A'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-4 bg-blue-50">
                      <h4 className="font-semibold mb-2">Best 10-Year Performers</h4>
                      <div className="space-y-2 text-sm">
                        {[...analysisResults.filter(r => r.timeHorizon === 10)]
                          .sort((a, b) => b.irr - a.irr)
                          .slice(0, 3)
                          .map((result, index) => (
                            <div key={result.propertyId} className="flex justify-between">
                              <span>{index + 1}. {result.propertyName}</span>
                              <span className="font-medium">{formatPercentage(result.irr)} IRR</span>
                            </div>
                          ))}
                      </div>
                    </Card>

                    <Card className="p-4 bg-green-50">
                      <h4 className="font-semibold mb-2">Highest NPV Index (10Y)</h4>
                      <div className="space-y-2 text-sm">
                        {[...analysisResults.filter(r => r.timeHorizon === 10)]
                          .sort((a, b) => b.npvIndex - a.npvIndex)
                          .slice(0, 3)
                          .map((result, index) => (
                            <div key={result.propertyId} className="flex justify-between">
                              <span>{index + 1}. {result.propertyName}</span>
                              <span className="font-medium">{formatNPVIndex(result.npvIndex)}</span>
                            </div>
                          ))}
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};