import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RealEstateInvestment } from "@/pages/Index";
import { getEffectiveMonthlyExpenses, getEffectiveMonthlyRent, getActualMonthlyRent, getPotentialMonthlyRent } from "@/lib/propertyUtils";
import { useGlobalSettings } from "@/contexts/GlobalSettingsContext";

interface InvestmentComparisonProps {
  investments: RealEstateInvestment[];
}

export const InvestmentComparison = ({ investments }: InvestmentComparisonProps) => {
  const { settings } = useGlobalSettings();
  
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

  const getCountrySettings = (country?: string) => {
    if (country === 'Turkey') {
      return {
        appreciation: settings.realEstateAppreciationRateTurkey,
        inflation: settings.inflationRateTurkey,
        selling: settings.sellingCostsTurkey,
        tax: settings.capitalGainsTaxTurkey,
        mortgage: settings.currentMortgageRateTurkey
      };
    } else {
      return {
        appreciation: settings.realEstateAppreciationRate,
        inflation: settings.inflationRate,
        selling: settings.sellingCosts,
        tax: settings.capitalGainsTax,
        mortgage: settings.currentMortgageRate
      };
    }
  };

  const calculateInvestmentMetrics = (investment: RealEstateInvestment) => {
    const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
    const netEquity = investment.netEquity > 0 ? investment.netEquity : currentValue;
    const countrySettings = getCountrySettings(investment.country);
    const avgAppreciationRate = investment.avgAppreciationRate || countrySettings.appreciation;
    
    // Calculate years held
    const yearsHeld = investment.purchaseDate 
      ? (new Date().getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 1; // Default to 1 year if no purchase date

    // Lifetime Annualized Appreciation (based on current vs purchase price)
    const totalLifetimeAppreciation = investment.purchasePrice > 0 
      ? ((currentValue - investment.purchasePrice) / investment.purchasePrice) * 100
      : 0;
    const lifetimeAnnualizedAppreciation = yearsHeld > 0 ? totalLifetimeAppreciation / yearsHeld : 0;

    // Calculate After Tax Net Equity/NRV using country-specific settings
    const sellingCosts = currentValue * (countrySettings.selling / 100);
    const capitalGainsTax = Math.max(0, (currentValue - investment.purchasePrice) * (countrySettings.tax / 100));
    const afterTaxNetEquity = currentValue - investment.outstandingBalance - sellingCosts - capitalGainsTax;

    // Annual rental income - use effective rent for comparison
    const effectiveMonthlyRent = getEffectiveMonthlyRent(investment);
    const actualMonthlyRent = getActualMonthlyRent(investment);
    const potentialMonthlyRent = getPotentialMonthlyRent(investment);
    const annualRentIncome = effectiveMonthlyRent * 12;
    
    // For Cap Rate: exclude mortgage costs, only subtract expenses and escrow
    const monthlyNonMortgageCosts = getEffectiveMonthlyExpenses(investment) - investment.monthlyMortgage;
    const annualCapRateNetIncome = (effectiveMonthlyRent - monthlyNonMortgageCosts) * 12;
    
    // For CoC Return: include all costs including mortgage
    const totalMonthlyCosts = getEffectiveMonthlyExpenses(investment);
    const annualNetIncome = (actualMonthlyRent - totalMonthlyCosts) * 12;

    // Asset Efficiency (Cap Rate) - based on Market Value, excluding mortgage costs
    const capRateNetYield = currentValue > 0 ? (annualCapRateNetIncome / currentValue) * 100 : 0;
    const capRateNetReturn = currentValue > 0 ? ((annualCapRateNetIncome / currentValue) * 100) + avgAppreciationRate : 0;

    // Investment Performance (CoC Return) - based on After Tax Net Equity
    const cocNetYield = afterTaxNetEquity > 0 ? (annualNetIncome / afterTaxNetEquity) * 100 : 0;
    
    // Calculate annual mortgage payment breakdown for Net Return calculation
    const monthlyInterestPayment = (investment.outstandingBalance * (investment.interestRate / 100)) / 12;
    const annualInterestPayments = monthlyInterestPayment * 12;
    const monthlyPrincipalPaydown = investment.monthlyMortgage - monthlyInterestPayment;
    const annualPrincipalPaydown = monthlyPrincipalPaydown * 12;
    const annualAppreciation = currentValue * (avgAppreciationRate / 100);
    
    // New Net Return calculation: Net Cash Flow*12 - Mortgage Interest + Principal Paydown + Appreciation
    const netCashFlow = actualMonthlyRent - totalMonthlyCosts;
    const newNetReturn = (netCashFlow * 12) - annualInterestPayments + annualPrincipalPaydown + annualAppreciation;
    const cocNetReturn = afterTaxNetEquity > 0 ? (newNetReturn / afterTaxNetEquity) * 100 : 0;

    return {
      yearsHeld,
      lifetimeAnnualizedAppreciation,
      capRateNetYield,
      capRateNetReturn,
      cocNetYield,
      cocNetReturn,
      afterTaxNetEquity,
      sellingCosts,
      capitalGainsTax,
      annualInterestPayments,
      annualPrincipalPaydown,
      annualAppreciation,
      newNetReturn,
      effectiveMonthlyRent,
      actualMonthlyRent,
      potentialMonthlyRent,
      isNonInvestment: investment.isInvestmentProperty === false
    };
  };

  const calculateScenarioMetrics = (investment: RealEstateInvestment) => {
    const purchasePrice = investment.purchasePrice;
    const baseMarketValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
    const outstandingBalance = investment.outstandingBalance;
    const countrySettings = getCountrySettings(investment.country);
    const effectiveMonthlyRent = getEffectiveMonthlyRent(investment);
    const baseGrossYield = effectiveMonthlyRent * 12;
    const baseMonthlyExpenses = getEffectiveMonthlyExpenses(investment) - investment.monthlyMortgage;
    const baseNetYield = baseGrossYield - (baseMonthlyExpenses * 12);

    const scenarios = [
      {
        name: "Base",
        marketValue: baseMarketValue,
        debt: outstandingBalance,
        salesCost: baseMarketValue * (countrySettings.selling / 100),
        capGainsTax: Math.max(0, (baseMarketValue - purchasePrice) * (countrySettings.tax / 100)),
        grossYield: baseGrossYield,
        netYield: baseNetYield
      },
      {
        name: "Fast app. 1.5x",
        marketValue: baseMarketValue * 1.5,
        debt: outstandingBalance, // Same as base scenario
        salesCost: (baseMarketValue * 1.5) * (countrySettings.selling / 100),
        capGainsTax: Math.max(0, ((baseMarketValue * 1.5) - purchasePrice) * (countrySettings.tax / 100)),
        grossYield: baseGrossYield,
        netYield: baseNetYield
      },
      {
        name: "Full mort. pmt",
        marketValue: baseMarketValue,
        debt: 0, // No debt in scenario 3
        salesCost: baseMarketValue * (countrySettings.selling / 100),
        capGainsTax: Math.max(0, (baseMarketValue - purchasePrice) * (countrySettings.tax / 100)),
        grossYield: baseGrossYield, // Same as base scenario
        netYield: baseNetYield // Same as base scenario
      },
      {
        name: "Increased Debt (25%)",
        marketValue: baseMarketValue,
        debt: outstandingBalance + (baseMarketValue * 0.25), // 25% more debt
        salesCost: baseMarketValue * (countrySettings.selling / 100),
        capGainsTax: Math.max(0, (baseMarketValue - purchasePrice) * (countrySettings.tax / 100)),
        grossYield: baseGrossYield,
        netYield: baseNetYield
      },
      {
        name: "Rent appr(1.5x)",
        marketValue: baseMarketValue,
        debt: outstandingBalance,
        salesCost: baseMarketValue * (countrySettings.selling / 100),
        capGainsTax: Math.max(0, (baseMarketValue - purchasePrice) * (countrySettings.tax / 100)),
        grossYield: baseGrossYield * 1.5,
        netYield: (baseGrossYield * 1.5) - (baseMonthlyExpenses * 12) // Calculate from increased gross yield
      },
      {
        name: "Rent & Value Appr",
        marketValue: baseMarketValue * 1.5,
        debt: outstandingBalance,
        salesCost: (baseMarketValue * 1.5) * (countrySettings.selling / 100),
        capGainsTax: Math.max(0, ((baseMarketValue * 1.5) - purchasePrice) * (countrySettings.tax / 100)),
        grossYield: baseGrossYield * 1.5,
        netYield: (baseGrossYield * 1.5) - (baseMonthlyExpenses * 12) // Calculate from increased gross yield
      }
    ];

    return scenarios.map(scenario => {
      const afterTaxNetEquity = scenario.marketValue - scenario.debt - scenario.salesCost - scenario.capGainsTax;
      const netYieldAssetEfficiency = scenario.marketValue > 0 ? (scenario.netYield / scenario.marketValue) * 100 : 0;
      const cocInvestmentPerf = afterTaxNetEquity > 0 ? (scenario.netYield / afterTaxNetEquity) * 100 : 0;
      
      return {
        ...scenario,
        afterTaxNetEquity,
        netYieldAssetEfficiency,
        cocInvestmentPerf
      };
    });
  };

  if (investments.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Investment Comparison</CardTitle>
          <CardDescription>
            Compare performance metrics across all your real estate investments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comparison" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comparison">Investment Comparison</TabsTrigger>
              <TabsTrigger value="scenario">Investment Scenario Comparison</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comparison" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Investment Name</TableHead>
                      <TableHead className="text-right font-semibold">Years Held</TableHead>
                      <TableHead className="text-right font-semibold">Lifetime Ann. Appreciation</TableHead>
                      <TableHead className="text-right font-semibold" colSpan={2}>Asset Efficiency (Cap Rate)</TableHead>
                      <TableHead className="text-right font-semibold" colSpan={2}>Investment Performance (CoC Return)</TableHead>
                    </TableRow>
                    <TableRow className="border-0">
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead></TableHead>
                      <TableHead className="text-right font-semibold text-xs">Net Yield</TableHead>
                      <TableHead className="text-right font-semibold text-xs">Net Return</TableHead>
                      <TableHead className="text-right font-semibold text-xs">Net Yield</TableHead>
                      <TableHead className="text-right font-semibold text-xs">Net Return</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((investment) => {
                      const metrics = calculateInvestmentMetrics(investment);
                      const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
                      const netEquity = investment.netEquity > 0 ? investment.netEquity : currentValue;
                      const countrySettings = getCountrySettings(investment.country);
                      const avgAppreciationRate = investment.avgAppreciationRate || countrySettings.appreciation;
                      const effectiveMonthlyRent = getEffectiveMonthlyRent(investment);
                      const actualMonthlyRent = getActualMonthlyRent(investment);
                      const monthlyNonMortgageCosts = getEffectiveMonthlyExpenses(investment) - investment.monthlyMortgage;
                      const annualCapRateNetIncome = (effectiveMonthlyRent - monthlyNonMortgageCosts) * 12;
                      const totalMonthlyCosts = getEffectiveMonthlyExpenses(investment);
                      const annualNetIncome = (actualMonthlyRent - totalMonthlyCosts) * 12;
                      const netCashFlow = actualMonthlyRent - totalMonthlyCosts;
                      
                      return (
                        <TableRow key={investment.id}>
                         <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold flex items-center gap-2">
                                {investment.propertyName}
                                {investment.isInvestmentProperty === false && (
                                  <Badge variant="outline" className="text-xs">Non-Investment</Badge>
                                )}
                                {investment.country && (
                                  <Badge variant="secondary" className="text-xs">{investment.country}</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{investment.address}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-muted-foreground">
                              {metrics.yearsHeld.toFixed(1)} years
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`font-semibold cursor-help ${metrics.lifetimeAnnualizedAppreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(metrics.lifetimeAnnualizedAppreciation)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>({formatCurrency(currentValue)} - {formatCurrency(investment.purchasePrice)}) / {formatCurrency(investment.purchasePrice)} / {metrics.yearsHeld.toFixed(1)} years</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`font-semibold cursor-help ${metrics.capRateNetYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(metrics.capRateNetYield)}
                                </span>
                              </TooltipTrigger>
                               <TooltipContent>
                                 <p>({formatCurrency(effectiveMonthlyRent)} - {formatCurrency(monthlyNonMortgageCosts)}) × 12 / {formatCurrency(currentValue)}</p>
                               </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`font-semibold cursor-help ${metrics.capRateNetReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(metrics.capRateNetReturn)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>({formatCurrency(annualCapRateNetIncome)} / {formatCurrency(currentValue)}) + {avgAppreciationRate}%</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`font-semibold cursor-help ${metrics.cocNetYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(metrics.cocNetYield)}
                                </span>
                              </TooltipTrigger>
                               <TooltipContent>
                                 <p>({formatCurrency(actualMonthlyRent)} - {formatCurrency(totalMonthlyCosts)}) × 12 / {formatCurrency(metrics.afterTaxNetEquity)}</p>
                               </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-right">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={`font-semibold cursor-help ${metrics.cocNetReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(metrics.cocNetReturn)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>({formatCurrency(netCashFlow)} × 12 - {formatCurrency(metrics.annualInterestPayments)} + {formatCurrency(metrics.annualPrincipalPaydown)} + {formatCurrency(metrics.annualAppreciation)}) / {formatCurrency(metrics.afterTaxNetEquity)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="scenario" className="mt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Asset</TableHead>
                      <TableHead className="font-semibold">Metric</TableHead>
                      <TableHead className="text-center font-semibold">Scenario 1<br/>Base</TableHead>
                      <TableHead className="text-center font-semibold">Scenario 2<br/>Fast app. 1.5x</TableHead>
                      <TableHead className="text-center font-semibold">Scenario 3<br/>Full mort. pmt</TableHead>
                      <TableHead className="text-center font-semibold">Scenario 4<br/>Increased Debt (25%)</TableHead>
                      <TableHead className="text-center font-semibold">Scenario 5<br/>Rent appr(1.5x)</TableHead>
                      <TableHead className="text-center font-semibold">Scenario 6<br/>Rent & Value Appr</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments.map((investment) => {
                      const scenarioMetrics = calculateScenarioMetrics(investment);
                      
                      return (
                        <React.Fragment key={investment.id}>
                          <TableRow>
                            <TableCell className="font-medium" rowSpan={2}>
                              <div>
                                <div className="font-semibold flex items-center gap-2 flex-wrap">
                                  {investment.propertyName}
                                  {investment.isInvestmentProperty === false && (
                                    <Badge variant="outline" className="text-xs">Non-Investment</Badge>
                                  )}
                                  {investment.country && (
                                    <Badge variant="secondary" className="text-xs">{investment.country}</Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">{investment.address}</div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              (Buy Metric) (Net Yield)(Asset efficiency)
                            </TableCell>
                            {scenarioMetrics.map((scenario, index) => (
                              <TableCell key={index} className="text-center">
                                <span className={`font-semibold ${scenario.netYieldAssetEfficiency >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(scenario.netYieldAssetEfficiency)}
                                </span>
                              </TableCell>
                            ))}
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">
                              (Sell Metric) (CoC) (Investment Perf.)
                            </TableCell>
                            {scenarioMetrics.map((scenario, index) => (
                              <TableCell key={index} className="text-center">
                                <span className={`font-semibold ${scenario.cocInvestmentPerf >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(scenario.cocInvestmentPerf)}
                                </span>
                              </TableCell>
                            ))}
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};