import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, Target, TrendingUp, Repeat } from "lucide-react";
import { RealEstateInvestment } from "@/pages/Index";
import { TaxBenefitsCalculator } from "./TaxBenefitsCalculator";
import { useGlobalSettings } from "@/contexts/GlobalSettingsContext";

interface TaxOptimizationModuleProps {
  investments: RealEstateInvestment[];
  onUpdateInvestment: (id: string, updates: Partial<RealEstateInvestment>) => void;
}

export const TaxOptimizationModule = ({ investments, onUpdateInvestment }: TaxOptimizationModuleProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [holdingPeriodYears, setHoldingPeriodYears] = useState<number>(5);
  const [targetTaxRate, setTargetTaxRate] = useState<number>(25);
  const { settings } = useGlobalSettings();
  const [scenarioAnalysis, setScenarioAnalysis] = useState<{
    salePrice: number;
    newPropertyPrice: number;
    estimatedRent: number;
  }>({
    salePrice: 0,
    newPropertyPrice: 0,
    estimatedRent: 0,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate.toFixed(2)}%`;
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

  const calculateHoldingPeriodOptimization = (investment: RealEstateInvestment) => {
    const countrySettings = getCountrySettings(investment.country || 'USA');
    const scenarios = [1, 2, 5, 10, 15, 20].map(years => {
      const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
      const appreciationRate = (investment.avgAppreciationRate || countrySettings.appreciationRate) / 100;
      const futureValue = currentValue * Math.pow(1 + appreciationRate, years);
      
      // Calculate tax implications using country-specific rates
      const capitalGains = futureValue - investment.purchasePrice;
      const isLongTerm = years >= 1;
      const taxRate = isLongTerm ? (countrySettings.capitalGainsTax / 100) * 0.8 : (countrySettings.capitalGainsTax / 100);
      const capitalGainsTax = capitalGains * taxRate;
      
      // Calculate depreciation recapture
      const depreciationRecapture = TaxBenefitsCalculator.calculateDepreciationRecapture(investment, years, futureValue);
      
      const totalTaxes = capitalGainsTax + depreciationRecapture;
      const netProceeds = futureValue - investment.outstandingBalance - (futureValue * (countrySettings.sellingCosts / 100)) - totalTaxes;
      
      // Calculate tax benefits during holding period using country-specific settings
      const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(investment, countrySettings);
      const annualTaxSavings = TaxBenefitsCalculator.calculateTaxSavings(taxBenefits.totalTaxBenefits, countrySettings.capitalGainsTax / 100);
      const totalTaxSavings = annualTaxSavings * years;
      
      return {
        years,
        futureValue,
        capitalGains,
        capitalGainsTax,
        depreciationRecapture,
        totalTaxes,
        netProceeds,
        totalTaxSavings,
        effectiveReturn: netProceeds + totalTaxSavings - investment.downPayment,
        annualizedReturn: investment.downPayment > 0 ? 
          (Math.pow((netProceeds + totalTaxSavings) / investment.downPayment, 1/years) - 1) * 100 : 0
      };
    });

    return scenarios;
  };

  const calculate1031ExchangeScenario = (investment: RealEstateInvestment) => {
    if (!scenarioAnalysis.salePrice || !scenarioAnalysis.newPropertyPrice) return null;

    const currentExchange = TaxBenefitsCalculator.calculate1031ExchangeOpportunity(investment);
    const capitalGains = scenarioAnalysis.salePrice - investment.purchasePrice;
    const capitalGainsTax = capitalGains * (targetTaxRate / 100) * 0.8; // Long-term capital gains
    
    // Depreciation recapture
    const yearsHeld = investment.purchaseDate 
      ? (new Date().getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 5;
    const depreciationRecapture = TaxBenefitsCalculator.calculateDepreciationRecapture(investment, yearsHeld, scenarioAnalysis.salePrice);
    
    const totalTaxesWithout1031 = capitalGainsTax + depreciationRecapture;
    const sellingCosts = scenarioAnalysis.salePrice * 0.06;
    
    // Without 1031 Exchange
    const netProceedsWithoutExchange = scenarioAnalysis.salePrice - investment.outstandingBalance - sellingCosts - totalTaxesWithout1031;
    
    // With 1031 Exchange
    const netProceedsWith1031 = scenarioAnalysis.salePrice - investment.outstandingBalance - sellingCosts;
    const exchangeCosts = 15000; // Typical 1031 exchange costs
    const availableForNewProperty = netProceedsWith1031 - exchangeCosts;
    
    // New property analysis
    const newPropertyEquity = availableForNewProperty;
    const newPropertyLoanAmount = scenarioAnalysis.newPropertyPrice - newPropertyEquity;
    const newMonthlyRent = scenarioAnalysis.estimatedRent;
    const newMortgagePayment = newPropertyLoanAmount > 0 ? 
      (newPropertyLoanAmount * (0.065 / 12)) / (1 - Math.pow(1 + (0.065 / 12), -360)) : 0; // Assume 6.5% 30-year
    const newMonthlyCashFlow = newMonthlyRent - newMortgagePayment - 300; // Assume $300 expenses
    
    return {
      withoutExchange: {
        netProceeds: netProceedsWithoutExchange,
        totalTaxes: totalTaxesWithout1031,
        cashAvailable: netProceedsWithoutExchange
      },
      with1031Exchange: {
        netProceeds: availableForNewProperty,
        taxesDeferred: totalTaxesWithout1031,
        newPropertyEquity,
        newPropertyLoanAmount,
        newMonthlyCashFlow,
        annualCashFlow: newMonthlyCashFlow * 12,
        exchangeCosts
      },
      benefits: {
        additionalCash: availableForNewProperty - netProceedsWithoutExchange,
        taxesDeferred: totalTaxesWithout1031,
        leverageAdvantage: scenarioAnalysis.newPropertyPrice - netProceedsWithoutExchange
      }
    };
  };

  const selectedInvestment = selectedProperty ? investments.find(inv => inv.id === selectedProperty) : null;
  const holdingPeriodAnalysis = selectedInvestment ? calculateHoldingPeriodOptimization(selectedInvestment) : [];
  const exchange1031Analysis = selectedInvestment ? calculate1031ExchangeScenario(selectedInvestment) : null;

  return (
    <div className="space-y-6">
      {/* Property Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tax Optimization Analysis
          </CardTitle>
          <CardDescription>
            Analyze optimal holding periods, 1031 exchanges, and tax strategies for your properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="property-select">Select Property</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a property to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {investments.map((investment) => (
                    <SelectItem key={investment.id} value={investment.id}>
                      {investment.propertyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Your Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                value={targetTaxRate}
                onChange={(e) => setTargetTaxRate(Number(e.target.value))}
                placeholder="25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holding-period">Analysis Period (Years)</Label>
              <Input
                id="holding-period"
                type="number"
                value={holdingPeriodYears}
                onChange={(e) => setHoldingPeriodYears(Number(e.target.value))}
                placeholder="5"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedInvestment && (
        <Tabs defaultValue="holding-period" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="holding-period" className="gap-2">
              <Calculator className="h-4 w-4" />
              Holding Period
            </TabsTrigger>
            <TabsTrigger value="1031-exchange" className="gap-2">
              <Repeat className="h-4 w-4" />
              1031 Exchange
            </TabsTrigger>
            <TabsTrigger value="tax-benefits" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Tax Benefits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="holding-period" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimal Holding Period Analysis</CardTitle>
                <CardDescription>
                  Compare returns and tax implications across different holding periods for {selectedInvestment.propertyName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {holdingPeriodAnalysis.map((scenario) => (
                    <div key={scenario.years} className="grid grid-cols-2 md:grid-cols-6 gap-4 p-4 border rounded-lg">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Holding Period</div>
                        <div className="font-bold">{scenario.years} Years</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Future Value</div>
                        <div className="font-semibold">{formatCurrency(scenario.futureValue)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Total Taxes</div>
                        <div className="font-semibold text-red-600">{formatCurrency(scenario.totalTaxes)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Tax Savings</div>
                        <div className="font-semibold text-green-600">{formatCurrency(scenario.totalTaxSavings)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Net Return</div>
                        <div className="font-semibold">{formatCurrency(scenario.effectiveReturn)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Annualized Return</div>
                        <div className="font-bold text-blue-600">{formatPercentage(scenario.annualizedReturn)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Optimization Insights</h4>
                  <div className="text-sm space-y-1">
                    {holdingPeriodAnalysis.length > 0 && (
                      <>
                        <p>• Best annualized return: {holdingPeriodAnalysis.reduce((best, current) => 
                          current.annualizedReturn > best.annualizedReturn ? current : best
                        ).years} years ({formatPercentage(holdingPeriodAnalysis.reduce((best, current) => 
                          current.annualizedReturn > best.annualizedReturn ? current : best
                        ).annualizedReturn)})</p>
                        <p>• Long-term capital gains rate applies after 1 year of ownership</p>
                        <p>• Consider depreciation recapture when planning sale timing</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="1031-exchange" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>1031 Exchange Analysis</CardTitle>
                <CardDescription>
                  Compare selling vs. 1031 exchange scenarios for {selectedInvestment.propertyName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="sale-price">Expected Sale Price</Label>
                    <Input
                      id="sale-price"
                      type="number"
                      value={scenarioAnalysis.salePrice}
                      onChange={(e) => setScenarioAnalysis(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                      placeholder="Enter sale price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-property-price">New Property Price</Label>
                    <Input
                      id="new-property-price"
                      type="number"
                      value={scenarioAnalysis.newPropertyPrice}
                      onChange={(e) => setScenarioAnalysis(prev => ({ ...prev, newPropertyPrice: Number(e.target.value) }))}
                      placeholder="Enter new property price"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated-rent">Estimated Monthly Rent</Label>
                    <Input
                      id="estimated-rent"
                      type="number"
                      value={scenarioAnalysis.estimatedRent}
                      onChange={(e) => setScenarioAnalysis(prev => ({ ...prev, estimatedRent: Number(e.target.value) }))}
                      placeholder="Enter monthly rent"
                    />
                  </div>
                </div>

                {exchange1031Analysis && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Without 1031 Exchange */}
                      <Card className="border-red-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-red-700">Traditional Sale</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Net Proceeds:</span>
                              <span className="font-semibold">{formatCurrency(exchange1031Analysis.withoutExchange.netProceeds)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Total Taxes:</span>
                              <span className="font-semibold text-red-600">{formatCurrency(exchange1031Analysis.withoutExchange.totalTaxes)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Cash Available:</span>
                              <span className="font-semibold">{formatCurrency(exchange1031Analysis.withoutExchange.cashAvailable)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* With 1031 Exchange */}
                      <Card className="border-green-200">
                        <CardHeader>
                          <CardTitle className="text-lg text-green-700">1031 Exchange</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span>Available for New Property:</span>
                              <span className="font-semibold">{formatCurrency(exchange1031Analysis.with1031Exchange.netProceeds)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxes Deferred:</span>
                              <span className="font-semibold text-green-600">{formatCurrency(exchange1031Analysis.with1031Exchange.taxesDeferred)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>New Monthly Cash Flow:</span>
                              <span className="font-semibold">{formatCurrency(exchange1031Analysis.with1031Exchange.newMonthlyCashFlow)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Benefits Summary */}
                    <Card className="bg-blue-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-700">1031 Exchange Benefits</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-white rounded">
                            <div className="text-sm text-muted-foreground mb-1">Additional Cash</div>
                            <div className="font-bold text-green-600">{formatCurrency(exchange1031Analysis.benefits.additionalCash)}</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded">
                            <div className="text-sm text-muted-foreground mb-1">Taxes Deferred</div>
                            <div className="font-bold text-blue-600">{formatCurrency(exchange1031Analysis.benefits.taxesDeferred)}</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded">
                            <div className="text-sm text-muted-foreground mb-1">Leverage Advantage</div>
                            <div className="font-bold text-purple-600">{formatCurrency(exchange1031Analysis.benefits.leverageAdvantage)}</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-white rounded text-sm">
                          <p><strong>Recommendation:</strong> {
                            exchange1031Analysis.benefits.additionalCash > 50000 
                              ? "Strong candidate for 1031 exchange - significant tax savings and increased leverage potential"
                              : exchange1031Analysis.benefits.additionalCash > 0
                              ? "Consider 1031 exchange for tax deferral benefits"
                              : "Traditional sale may be more appropriate - consult with tax advisor"
                          }</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax-benefits" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Tax Benefits Analysis</CardTitle>
                <CardDescription>
                  Review and optimize tax deductions for {selectedInvestment.propertyName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(selectedInvestment);
                  const taxSavings = TaxBenefitsCalculator.calculateTaxSavings(taxBenefits.totalTaxBenefits, targetTaxRate / 100);
                  
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-sm text-green-700 mb-2">Depreciation</div>
                          <div className="font-bold text-green-800">{formatCurrency(taxBenefits.annualDepreciation)}</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-700 mb-2">Mortgage Interest</div>
                          <div className="font-bold text-blue-800">{formatCurrency(taxBenefits.mortgageInterestDeduction)}</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-sm text-purple-700 mb-2">Property Tax</div>
                          <div className="font-bold text-purple-800">{formatCurrency(taxBenefits.propertyTaxDeduction)}</div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-sm text-orange-700 mb-2">Maintenance</div>
                          <div className="font-bold text-orange-800">{formatCurrency(taxBenefits.maintenanceDeductions)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Annual Tax Impact</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span>Total Deductions:</span>
                                <span className="font-semibold">{formatCurrency(taxBenefits.totalTaxBenefits)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Tax Savings:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(taxSavings)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Effective Tax Rate:</span>
                                <span className="font-semibold">{formatPercentage(targetTaxRate)}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Optimization Opportunities</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">✓</Badge>
                                <span>Depreciation maximized for {selectedInvestment.propertyType}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">💡</Badge>
                                <span>Consider cost segregation study for accelerated depreciation</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">📋</Badge>
                                <span>Track all maintenance receipts for deductions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">🏠</Badge>
                                <span>Home office deduction may apply if applicable</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Tax Benefits Override</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          If you have specific tax benefit amounts from your accountant, you can override the calculated values.
                        </p>
                        <div className="flex gap-3 items-end">
                          <div className="flex-1">
                            <Label htmlFor="tax-override">Manual Tax Benefits Amount</Label>
                            <Input
                              id="tax-override"
                              type="number"
                              placeholder="Enter custom amount"
                              value={selectedInvestment.taxBenefitOverride || ''}
                              onChange={(e) => onUpdateInvestment(selectedInvestment.id, {
                                taxBenefitOverride: Number(e.target.value) || undefined
                              })}
                            />
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => onUpdateInvestment(selectedInvestment.id, {
                              taxBenefitOverride: undefined
                            })}
                          >
                            Reset to Auto
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};