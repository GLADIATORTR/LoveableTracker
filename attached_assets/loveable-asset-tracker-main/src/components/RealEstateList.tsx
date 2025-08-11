import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, DollarSign, Home, TrendingUp, Calendar, Edit, BarChart3, ChevronUp, ChevronDown, Copy, Filter } from "lucide-react";
import { RealEstateInvestment } from "@/pages/Index";
import { getEffectiveMonthlyRent, getRentLabel, getEffectiveMonthlyExpenses } from "@/lib/propertyUtils";

interface RealEstateListProps {
  investments: RealEstateInvestment[];
  onDelete: (id: string) => void;
  onEdit: (investment: RealEstateInvestment) => void;
  selectedGroup: string;
  onGroupChange: (group: string) => void;
  allInvestments: RealEstateInvestment[];
}

export const RealEstateList = ({ investments, onDelete, onEdit, selectedGroup, onGroupChange, allInvestments }: RealEstateListProps) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(investments.map(inv => inv.id)));
  const [scenarioCards, setScenarioCards] = useState<Set<string>>(new Set());
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

  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case "single-family": return "Single Family";
      case "multi-family": return "Multi Family";
      case "condo": return "Condo";
      case "townhouse": return "Townhouse";
      case "commercial": return "Commercial";
      default: return type;
    }
  };

  const calculateMonthlyCashFlow = (investment: RealEstateInvestment) => {
    const effectiveRent = getEffectiveMonthlyRent(investment);
    return effectiveRent - getEffectiveMonthlyExpenses(investment);
  };

  const calculateROI = (investment: RealEstateInvestment) => {
    if (investment.downPayment === 0) return 0;
    const annualCashFlow = calculateMonthlyCashFlow(investment) * 12;
    return (annualCashFlow / investment.downPayment) * 100;
  };

  const calculateKPIs = (investment: RealEstateInvestment) => {
    const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
    
    const totalAppreciation = investment.currentValue > 0 && investment.purchasePrice > 0 
      ? ((investment.currentValue - investment.purchasePrice) / investment.purchasePrice) * 100
      : 0;

    const yearsHeld = investment.purchaseDate 
      ? (new Date().getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
      : 0;

    const annualizedReturn = yearsHeld > 0 && investment.currentValue > 0 && investment.purchasePrice > 0
      ? (Math.pow(investment.currentValue / investment.purchasePrice, 1 / yearsHeld) - 1) * 100
      : 0;

    // Calculate After Tax Net Equity/NRV
    const sellingCosts = currentValue * 0.06; // 6% selling costs
    const capitalGainsTax = Math.max(0, (currentValue - investment.purchasePrice) * 0.25); // 25% of capital gains
    const afterTaxNetEquity = currentValue - investment.outstandingBalance - sellingCosts - capitalGainsTax;

    const cashOnCashReturn = afterTaxNetEquity > 0 
      ? (calculateMonthlyCashFlow(investment) * 12 / afterTaxNetEquity) * 100
      : 0;

    // Calculate annual mortgage payment breakdown for Net Return calculation
    const monthlyInterestPayment = (investment.outstandingBalance * (investment.interestRate / 100)) / 12;
    const annualInterestPayments = monthlyInterestPayment * 12;
    const monthlyPrincipalPaydown = investment.monthlyMortgage - monthlyInterestPayment;
    const annualPrincipalPaydown = monthlyPrincipalPaydown * 12;
    const avgAppreciationRate = investment.avgAppreciationRate || 3.5;
    const annualAppreciation = currentValue * (avgAppreciationRate / 100);
    
    // New Net Return calculation: Net Cash Flow*12 - Mortgage Interest - Escrow + Principal Paydown + Appreciation
    const effectiveRent = getEffectiveMonthlyRent(investment);
    const netCashFlow = effectiveRent - getEffectiveMonthlyExpenses(investment);
    const newNetReturn = (netCashFlow * 12) - annualInterestPayments + annualPrincipalPaydown + annualAppreciation;
    const netROI = afterTaxNetEquity > 0 ? (newNetReturn / afterTaxNetEquity) * 100 : 0;

    return {
      totalAppreciation,
      annualizedReturn,
      cashOnCashReturn,
      netROI,
      yearsHeld,
      afterTaxNetEquity,
      sellingCosts,
      capitalGainsTax,
      annualInterestPayments,
      annualPrincipalPaydown,
      annualAppreciation,
      newNetReturn,
      netCashFlow
    };
  };

  // Get unique groups from all investments for filtering
  const getAvailableGroups = () => {
    const groups = new Set(allInvestments.map(inv => inv.group).filter(Boolean));
    return Array.from(groups).sort();
  };

  const toggleCardExpansion = (investmentId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(investmentId)) {
      newExpanded.delete(investmentId);
    } else {
      newExpanded.add(investmentId);
    }
    setExpandedCards(newExpanded);
  };

  const toggleScenarioComparison = (investmentId: string) => {
    const newScenarios = new Set(scenarioCards);
    if (newScenarios.has(investmentId)) {
      newScenarios.delete(investmentId);
    } else {
      newScenarios.add(investmentId);
    }
    setScenarioCards(newScenarios);
  };

  const calculateScenarios = (investment: RealEstateInvestment) => {
    const baseMarketValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
    const purchasePrice = investment.purchasePrice;
    const outstandingBalance = investment.outstandingBalance;
    const effectiveRent = getEffectiveMonthlyRent(investment);
    const baseGrossYield = effectiveRent * 12;
    const baseNetYield = (effectiveRent - getEffectiveMonthlyExpenses(investment)) * 12;
    const baseMonthlyExpenses = getEffectiveMonthlyExpenses(investment);

    const scenarios = [
      {
        name: "Base",
        marketValue: baseMarketValue,
        debt: outstandingBalance,
        salesCost: baseMarketValue * 0.06,
        capGainsTax: Math.max(0, (baseMarketValue - purchasePrice) * 0.25),
        grossYield: baseGrossYield,
        netYield: baseNetYield
      },
      {
        name: "Fast app. 1.5x",
        marketValue: baseMarketValue * 1.5,
        debt: outstandingBalance, // Same as base scenario
        salesCost: (baseMarketValue * 1.5) * 0.06,
        capGainsTax: Math.max(0, ((baseMarketValue * 1.5) - purchasePrice) * 0.25),
        grossYield: baseGrossYield,
        netYield: baseNetYield
      },
      {
        name: "Full mort. pmt",
        marketValue: baseMarketValue,
        debt: 0, // No debt in scenario 3
        salesCost: baseMarketValue * 0.06,
        capGainsTax: Math.max(0, (baseMarketValue - purchasePrice) * 0.25),
        grossYield: baseGrossYield, // Same as base scenario
        netYield: baseNetYield // Same as base scenario
      },
      {
        name: "Increased Debt (25%)",
        marketValue: baseMarketValue,
        debt: outstandingBalance + (baseMarketValue * 0.25), // 25% more debt
        salesCost: baseMarketValue * 0.06,
        capGainsTax: Math.max(0, (baseMarketValue - purchasePrice) * 0.25),
        grossYield: baseGrossYield,
        netYield: baseNetYield
      },
      {
        name: "Rent appr(1.5x)",
        marketValue: baseMarketValue,
        debt: outstandingBalance,
        salesCost: baseMarketValue * 0.06,
        capGainsTax: Math.max(0, (baseMarketValue - purchasePrice) * 0.25),
        grossYield: baseGrossYield * 1.5,
        netYield: (baseGrossYield * 1.5) - (baseMonthlyExpenses * 12) // Calculate from increased gross yield
      },
      {
        name: "Rent & Value Appr",
        marketValue: baseMarketValue * 1.5,
        debt: outstandingBalance,
        salesCost: (baseMarketValue * 1.5) * 0.06,
        capGainsTax: Math.max(0, ((baseMarketValue * 1.5) - purchasePrice) * 0.25),
        grossYield: baseGrossYield * 1.5,
        netYield: (baseGrossYield * 1.5) - (baseMonthlyExpenses * 12) // Calculate from increased gross yield
      }
    ];

    return scenarios.map(scenario => {
      const afterTaxNetEquity = scenario.marketValue - scenario.debt - scenario.salesCost - scenario.capGainsTax;
      return {
        ...scenario,
        afterTaxNetEquity,
        netYieldAssetEfficiency: (scenario.netYield / scenario.marketValue) * 100,
        cocInvestmentPerf: afterTaxNetEquity > 0 ? (scenario.netYield / afterTaxNetEquity) * 100 : 0
      };
    });
  };

  const totalCosts = (investment: RealEstateInvestment) => {
    return getEffectiveMonthlyExpenses(investment);
  };

  const exportToClipboard = async () => {
    const headers = [
      "Property Name", "Address", "Property Type", "Purchase Price", "Current Value", 
      "Net Equity/NRV", "Down Payment", "Loan Amount", "Interest Rate", "Loan Term", 
      "Outstanding Balance", "Monthly Rent", "Monthly Mortgage", "Monthly Expenses", 
      "Total Monthly Costs", "Monthly Cash Flow", "Purchase Date", 
      "Years Held", "Total Appreciation %", "Annualized Return %", "Cash-on-Cash Return %", 
      "Net ROI %", "Notes"
    ].join("\t");

    const data = investments.map(investment => {
      const kpis = calculateKPIs(investment);
      const monthlyCashFlow = calculateMonthlyCashFlow(investment);
      const roi = calculateROI(investment);
      
      return [
        investment.propertyName || "",
        investment.address || "",
        getPropertyTypeLabel(investment.propertyType) || "",
        investment.purchasePrice || 0,
        investment.currentValue || investment.purchasePrice || 0,
        investment.netEquity || 0,
        investment.downPayment || 0,
        investment.loanAmount || 0,
        investment.interestRate || 0,
        investment.loanTerm || 0,
        investment.outstandingBalance || 0,
        investment.monthlyRent || 0,
        investment.monthlyMortgage || 0,
        getEffectiveMonthlyExpenses(investment) || 0,
        
        totalCosts(investment),
        monthlyCashFlow,
        investment.purchaseDate || "",
        kpis.yearsHeld.toFixed(1),
        kpis.totalAppreciation.toFixed(2),
        kpis.annualizedReturn.toFixed(2),
        kpis.cashOnCashReturn.toFixed(2),
        kpis.netROI.toFixed(2),
        investment.notes || ""
      ].join("\t");
    }).join("\n");

    const csvContent = `${headers}\n${data}`;
    
    try {
      await navigator.clipboard.writeText(csvContent);
      // You could add a toast notification here if you have one
      console.log("Data copied to clipboard");
    } catch (err) {
      console.error("Failed to copy data: ", err);
    }
  };

  if (investments.length === 0) {
    return (
      <TooltipProvider>
        <Card>
          <CardContent className="p-8 text-center">
            <Home className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No investments yet</h3>
            <p className="text-muted-foreground">
              Add your first real estate investment to start tracking your portfolio
            </p>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Real Estate Portfolio</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={selectedGroup} onValueChange={onGroupChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                {getAvailableGroups().map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToClipboard}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy to Excel
          </Button>
          <Badge variant="secondary" className="text-sm">
            {investments.length} {investments.length === 1 ? "Property" : "Properties"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {investments.map((investment) => {
          const monthlyCashFlow = calculateMonthlyCashFlow(investment);
          const roi = calculateROI(investment);
          const kpis = calculateKPIs(investment);

          return (
            <Card key={investment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{investment.propertyName}</CardTitle>
                      <CardDescription className="mt-1">
                        {investment.address}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {getPropertyTypeLabel(investment.propertyType)}
                      </Badge>
                      {investment.group && (
                        <Badge variant="secondary">
                          {investment.group}
                        </Badge>
                      )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCardExpansion(investment.id)}
                      className="hover:bg-muted"
                    >
                      {expandedCards.has(investment.id) ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(investment)}
                      className="hover:bg-muted"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(investment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {!expandedCards.has(investment.id) ? (
                  // Minimized view - show only key metrics
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          Current Value
                        </div>
                        <p className="font-semibold">
                          {investment.currentValue > 0 ? formatCurrency(investment.currentValue) : formatCurrency(investment.purchasePrice)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          {getRentLabel(investment)}
                        </div>
                        <p className="font-semibold text-green-600">{formatCurrency(getEffectiveMonthlyRent(investment))}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Home className="h-4 w-4" />
                          Monthly Expenses
                        </div>
                        <p className="font-semibold text-red-600">{formatCurrency(getEffectiveMonthlyExpenses(investment))}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BarChart3 className="h-4 w-4" />
                          Cash Flow
                        </div>
                        <p className={`font-semibold ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(monthlyCashFlow)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Additional financial details in minimized view */}
                    <div className="mt-4 pt-4 border-t border-muted space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            Outstanding Balance
                          </div>
                          <p className="font-semibold text-orange-600">{formatCurrency(investment.outstandingBalance)}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Sales Costs (6%)
                          </div>
                          <p className="font-semibold text-red-600">{formatCurrency(kpis.sellingCosts)}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BarChart3 className="h-4 w-4" />
                            Cap Gains Tax (25%)
                          </div>
                          <p className="font-semibold text-red-600">{formatCurrency(kpis.capitalGainsTax)}</p>
                        </div>
                        <div className="space-y-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help">
                                <TrendingUp className="h-4 w-4" />
                                After Tax Net Equity
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Current Value - Outstanding Balance - Selling Costs (6%) - Capital Gains Tax (25%)</p>
                            </TooltipContent>
                          </Tooltip>
                          <p className="font-semibold text-blue-600">{formatCurrency(kpis.afterTaxNetEquity)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Expanded view - show all details
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Purchase Price
                        </div>
                        <p className="font-semibold">{formatCurrency(investment.purchasePrice)}</p>
                      </div>

                      {investment.currentValue > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Current Value
                          </div>
                          <p className="font-semibold">{formatCurrency(investment.currentValue)}</p>
                        </div>
                      )}

                      {investment.netEquity > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <BarChart3 className="h-4 w-4" />
                            Net Equity/NRV
                          </div>
                          <p className="font-semibold">{formatCurrency(investment.netEquity)}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          Outstanding Balance
                        </div>
                        <p className="font-semibold text-orange-600">{formatCurrency(investment.outstandingBalance)}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="h-4 w-4" />
                          Sales Costs (6%)
                        </div>
                        <p className="font-semibold text-red-600">{formatCurrency(kpis.sellingCosts)}</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BarChart3 className="h-4 w-4" />
                          Cap Gains Tax (25%)
                        </div>
                        <p className="font-semibold text-red-600">{formatCurrency(kpis.capitalGainsTax)}</p>
                      </div>

                      <div className="space-y-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground cursor-help">
                              <TrendingUp className="h-4 w-4" />
                              After Tax Net Equity
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current Value - Outstanding Balance - Selling Costs (6%) - Capital Gains Tax (25%)</p>
                          </TooltipContent>
                        </Tooltip>
                        <p className="font-semibold text-blue-600">{formatCurrency(kpis.afterTaxNetEquity)}</p>
                      </div>
                    </div>

                    {investment.loanAmount > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-sm">Mortgage Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Loan Amount:</span>
                            <p className="font-medium">{formatCurrency(investment.loanAmount)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Interest Rate:</span>
                            <p className="font-medium">{formatPercentage(investment.interestRate)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Loan Term:</span>
                            <p className="font-medium">{investment.loanTerm} years</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monthly Payment:</span>
                            <p className="font-medium">{formatCurrency(investment.monthlyMortgage)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {investment.monthlyRent > 0 && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        <h4 className="font-medium text-sm">Cash Flow Analysis</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Monthly Rent:</span>
                            <p className="font-medium text-green-600">{formatCurrency(investment.monthlyRent)}</p>
                          </div>
                             <div>
                              <span className="text-muted-foreground">Monthly Expenses:</span>
                              <p className="font-medium text-red-600">{formatCurrency(getEffectiveMonthlyExpenses(investment))}</p>
                            </div>
                           <div>
                           </div>
                          <div>
                            <span className="text-muted-foreground">Net Cash Flow:</span>
                            <p className={`font-medium ${monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(monthlyCashFlow)}
                            </p>
                          </div>
                          {investment.downPayment > 0 && (
                            <div>
                              <span className="text-muted-foreground">Cash-on-Cash ROI:</span>
                              <p className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(roi)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                     )}

                    {/* Investment KPIs Section */}
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <h4 className="font-medium text-sm">Investment KPIs</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Appreciation:</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className={`font-medium cursor-help ${kpis.totalAppreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(kpis.totalAppreciation)}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>({formatCurrency(investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice)} - {formatCurrency(investment.purchasePrice)}) / {formatCurrency(investment.purchasePrice)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Annualized Return (CAGR):</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className={`font-medium cursor-help ${kpis.annualizedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(kpis.annualizedReturn)}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>({formatCurrency(investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice)} / {formatCurrency(investment.purchasePrice)})^(1/{kpis.yearsHeld.toFixed(1)}) - 1</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Cash-on-Cash Return:</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className={`font-medium cursor-help ${kpis.cashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(kpis.cashOnCashReturn)}
                              </p>
                            </TooltipTrigger>
                             <TooltipContent>
                               <p>({formatCurrency(investment.monthlyRent)} - {formatCurrency(getEffectiveMonthlyExpenses(investment))}) × 12 / {formatCurrency(kpis.afterTaxNetEquity)}</p>
                             </TooltipContent>
                          </Tooltip>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Net ROI (inc. income):</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className={`font-medium cursor-help ${kpis.netROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatPercentage(kpis.netROI)}
                              </p>
                            </TooltipTrigger>
                             <TooltipContent>
                               <p>({formatCurrency(kpis.netCashFlow)} × 12 - {formatCurrency(kpis.annualInterestPayments)} + {formatCurrency(kpis.annualPrincipalPaydown)} + {formatCurrency(kpis.annualAppreciation)}) / {formatCurrency(kpis.afterTaxNetEquity)}</p>
                             </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>

                    {investment.purchaseDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Purchased: {new Date(investment.purchaseDate).toLocaleDateString()}
                      </div>
                    )}

                    {/* Scenario Comparison Section */}
                    <div className="border-t border-muted pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Scenario Analysis
                        </h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleScenarioComparison(investment.id)}
                          className="text-xs"
                        >
                          {scenarioCards.has(investment.id) ? 'Hide' : 'Show'} Scenario Comparison
                        </Button>
                      </div>
                      
                      {scenarioCards.has(investment.id) && (
                        <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-muted">
                                <th className="text-left py-2 pr-4 font-medium">{investment.propertyName}</th>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <th key={index} className="text-center py-2 px-2 font-medium min-w-24">
                                    Scenario {index + 1}<br/>
                                    <span className="text-muted-foreground font-normal">{scenario.name}</span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="text-xs">
                              <tr className="border-b border-muted/50">
                                <td className="py-2 pr-4 font-medium">Purchase Price</td>
                                {calculateScenarios(investment).map((_, index) => (
                                  <td key={index} className="text-center py-2 px-2">{formatCurrency(investment.purchasePrice)}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-muted/50">
                                <td className="py-2 pr-4 font-medium">Market Value</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2">{formatCurrency(scenario.marketValue)}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-muted/50">
                                <td className="py-2 pr-4 font-medium">Debt (outstanding balance)</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2">{formatCurrency(scenario.debt)}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-muted/50">
                                <td className="py-2 pr-4 font-medium">Sales Cost (6%)</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2">{formatCurrency(scenario.salesCost)}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-muted/50">
                                <td className="py-2 pr-4 font-medium">Tax (cap gains tax)</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2">{formatCurrency(scenario.capGainsTax)}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-muted/50 bg-blue-50/50">
                                <td className="py-2 pr-4 font-medium">After Tax Net Equity</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2 font-semibold">{formatCurrency(scenario.afterTaxNetEquity)}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-muted/50">
                                <td className="py-2 pr-4 font-medium">Gross Yield (Rent Income)</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2">{formatCurrency(scenario.grossYield)}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-muted/50">
                                <td className="py-2 pr-4 font-medium">Net Yield (Rent-Escrow-Expenses)</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2">{formatCurrency(scenario.netYield)}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-muted/50 bg-green-50/50">
                                <td className="py-2 pr-4 font-medium">(Buy Metric) (Net Yield)(Asset efficiency)</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2 font-semibold">{formatPercentage(scenario.netYieldAssetEfficiency)}</td>
                                ))}
                              </tr>
                              <tr className="bg-orange-50/50">
                                <td className="py-2 pr-4 font-medium">(Sell Metric) (CoC) (Investment Perf.)</td>
                                {calculateScenarios(investment).map((scenario, index) => (
                                  <td key={index} className="text-center py-2 px-2 font-semibold">{formatPercentage(scenario.cocInvestmentPerf)}</td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {investment.notes && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1">{investment.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      </div>
    </TooltipProvider>
  );
};