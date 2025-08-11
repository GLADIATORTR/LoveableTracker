import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TrendingUp, DollarSign, BarChart3, PieChart, Filter, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { RealEstateInvestment } from "@/pages/Index";
import { TaxBenefitsCalculator } from "@/components/TaxBenefitsCalculator";
import { getActualMonthlyRent, getEffectiveMonthlyRent, getEffectiveMonthlyExpenses, hasDetailedExpenses, getPotentialMonthlyRent } from "@/lib/propertyUtils";

interface PortfolioSummaryProps {
  investments: RealEstateInvestment[];
  selectedGroup: string;
  onGroupChange: (group: string) => void;
  allInvestments: RealEstateInvestment[];
}

export const PortfolioSummary = ({ investments, selectedGroup, onGroupChange, allInvestments }: PortfolioSummaryProps) => {
  const [excludedGroups, setExcludedGroups] = useState<string[]>([]);
  const [showIndividualMetrics, setShowIndividualMetrics] = useState(false);
  const [showDetailedExpenses, setShowDetailedExpenses] = useState(false);
  
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

  // Get unique groups from all investments for filtering
  const getAvailableGroups = () => {
    const groups = new Set(allInvestments.map(inv => inv.group).filter(Boolean));
    return Array.from(groups).sort();
  };

  // Filter investments to exclude certain groups
  const getFilteredInvestments = () => {
    return investments.filter(inv => !excludedGroups.includes(inv.group || ''));
  };

  // Calculate individual property metrics
  const calculateIndividualMetrics = (investment: RealEstateInvestment) => {
    const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
    const netValue = currentValue - investment.outstandingBalance;
    const sellingCosts = currentValue * 0.06; // 6% selling costs
    const capitalGainsTax = Math.max(0, (currentValue - investment.purchasePrice) * 0.25); // 25% of capital gains
    const afterTaxNetEquity = currentValue - investment.outstandingBalance - sellingCosts - capitalGainsTax;
    
    // Calculate tax benefits
    const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(investment);
    const taxSavings = TaxBenefitsCalculator.calculateTaxSavings(taxBenefits.totalTaxBenefits, 0.25); // 25% tax rate
    
    const actualRent = getActualMonthlyRent(investment);
    const potentialRent = getPotentialMonthlyRent(investment);
    const displayRent = actualRent > 0 ? actualRent : potentialRent;
    
    return {
      totalInvested: investment.downPayment,
      currentValue,
      netValue,
      afterTaxNetEquity,
      monthlyRent: displayRent,
      isPotentialRent: potentialRent > 0,
      monthlyCashFlow: actualRent - getEffectiveMonthlyExpenses(investment), // Only actual rent contributes to cash flow
      taxSavings
    };
  };

  const toggleExcludeGroup = (group: string) => {
    setExcludedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const calculatePortfolioMetrics = () => {
    const filteredInvestments = getFilteredInvestments();
    if (filteredInvestments.length === 0) return null;

    const defaultAppreciationRate = 3; // 3% default appreciation
    
    // Portfolio totals - separating actual vs potential income
    const totalPurchasePrice = filteredInvestments.reduce((sum, inv) => sum + inv.purchasePrice, 0);
    const totalCurrentValue = filteredInvestments.reduce((sum, inv) => 
      sum + (inv.currentValue > 0 ? inv.currentValue : inv.purchasePrice), 0);
    const totalDownPayment = filteredInvestments.reduce((sum, inv) => sum + inv.downPayment, 0);
    
    // Only count actual income from investment properties in totals
    const totalActualMonthlyRent = filteredInvestments.reduce((sum, inv) => sum + getActualMonthlyRent(inv), 0);
    const totalPotentialMonthlyRent = filteredInvestments.reduce((sum, inv) => sum + getPotentialMonthlyRent(inv), 0);
    
    const totalMonthlyCosts = filteredInvestments.reduce((sum, inv) => 
      sum + getEffectiveMonthlyExpenses(inv), 0);
    
    // Cash flow only includes actual income (not potential)
    const totalMonthlyCashFlow = totalActualMonthlyRent - totalMonthlyCosts;
    
    // Calculate total outstanding balance and net value
    const totalOutstandingBalance = filteredInvestments.reduce((sum, inv) => sum + inv.outstandingBalance, 0);
    const totalNetValue = totalCurrentValue - totalOutstandingBalance;
    
    // Calculate total After Tax Net Equity
    const totalAfterTaxNetEquity = filteredInvestments.reduce((sum, inv) => {
      const currentValue = inv.currentValue > 0 ? inv.currentValue : inv.purchasePrice;
      const sellingCosts = currentValue * 0.06; // 6% selling costs
      const capitalGainsTax = Math.max(0, (currentValue - inv.purchasePrice) * 0.25); // 25% of capital gains
      const afterTaxNetEquity = currentValue - inv.outstandingBalance - sellingCosts - capitalGainsTax;
      return sum + afterTaxNetEquity;
    }, 0);

    // Lifetime KPIs
    const totalAppreciation = totalPurchasePrice > 0 
      ? ((totalCurrentValue - totalPurchasePrice) / totalPurchasePrice) * 100
      : 0;

    const avgYearsHeld = filteredInvestments.reduce((sum, inv) => {
      const years = inv.purchaseDate 
        ? (new Date().getTime() - new Date(inv.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
        : 0;
      return sum + years;
    }, 0) / filteredInvestments.length;

    const lifetimeCashOnCashReturn = totalDownPayment > 0 
      ? (totalMonthlyCashFlow * 12 / totalDownPayment) * 100
      : 0;

    // Current KPIs - based on actual income only
    const annualizedGrossCashReturn = totalDownPayment > 0 
      ? (totalActualMonthlyRent * 12 / totalDownPayment) * 100
      : 0;

    const annualizedNetCashReturn = totalDownPayment > 0 
      ? (totalMonthlyCashFlow * 12 / totalDownPayment) * 100
      : 0;

    // Calculate annualized total return (rental income + appreciation)
    const estimatedAnnualAppreciation = totalCurrentValue * (defaultAppreciationRate / 100);
    const totalAnnualReturn = (totalMonthlyCashFlow * 12) + estimatedAnnualAppreciation;
    const annualizedTotalReturn = totalDownPayment > 0 
      ? (totalAnnualReturn / totalDownPayment) * 100
      : 0;

    return {
      totalProperties: filteredInvestments.length,
      totalPurchasePrice,
      totalCurrentValue,
      totalDownPayment,
      totalActualMonthlyRent,
      totalPotentialMonthlyRent,
      totalMonthlyCosts,
      totalMonthlyCashFlow,
      totalOutstandingBalance,
      totalNetValue,
      totalAfterTaxNetEquity,
      
      // Lifetime KPIs
      totalAppreciation,
      lifetimeCashOnCashReturn,
      avgYearsHeld,
      
      // Current KPIs
      annualizedGrossCashReturn,
      annualizedNetCashReturn,
      annualizedTotalReturn
    };
  };

  const metrics = calculatePortfolioMetrics();

  if (!metrics) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Portfolio Overview</CardTitle>
            <CardDescription>
              Summary of your {metrics.totalProperties} real estate investment{metrics.totalProperties !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={selectedGroup} onValueChange={onGroupChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="all">All Properties</SelectItem>
                  {getAvailableGroups().map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {getAvailableGroups().length > 0 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="h-4 w-4" />
                    Exclude Groups
                    {excludedGroups.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {excludedGroups.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-background border z-50">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Exclude Property Groups:</h4>
                    {getAvailableGroups().map((group) => (
                      <div key={group} className="flex items-center space-x-2">
                        <Checkbox
                          id={`exclude-${group}`}
                          checked={excludedGroups.includes(group)}
                          onCheckedChange={() => toggleExcludeGroup(group)}
                        />
                        <label
                          htmlFor={`exclude-${group}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {group}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="text-sm text-muted-foreground">
                No property groups assigned yet. Add groups to properties to enable filtering.
              </div>
            )}
            
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {formatCurrency(metrics.totalCurrentValue)} Total Value
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Portfolio Totals */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              Total Invested
            </div>
            <p className="text-xl font-bold">{formatCurrency(metrics.totalDownPayment)}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              Current Value
            </div>
            <p className="text-xl font-bold">{formatCurrency(metrics.totalCurrentValue)}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              Net Value
            </div>
            <p className="text-xl font-bold">{formatCurrency(metrics.totalNetValue)}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <PieChart className="h-4 w-4" />
              After Tax Net Equity
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(metrics.totalAfterTaxNetEquity)}</p>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              Actual Monthly Income
            </div>
            <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.totalActualMonthlyRent)}</p>
            {metrics.totalPotentialMonthlyRent > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                + {formatCurrency(metrics.totalPotentialMonthlyRent)} potential*
              </p>
            )}
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              Cash Flow
            </div>
            <p className={`text-xl font-bold ${metrics.totalMonthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(metrics.totalMonthlyCashFlow)}
            </p>
          </div>
        </div>

        {/* Expand/Collapse Individual Metrics */}
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setShowIndividualMetrics(!showIndividualMetrics)}
            className="gap-2"
          >
            {showIndividualMetrics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showIndividualMetrics ? 'Hide' : 'Show'} Individual Property Metrics
          </Button>
          
          {showIndividualMetrics && getFilteredInvestments().some(hasDetailedExpenses) && (
            <Button
              variant="outline"
              onClick={() => setShowDetailedExpenses(!showDetailedExpenses)}
              className="gap-2"
            >
              {showDetailedExpenses ? 'Hide' : 'Show'} Detailed Expenses
            </Button>
          )}
        </div>

        {/* Individual Property Metrics */}
        {showIndividualMetrics && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Individual Property Metrics</h3>
            {getFilteredInvestments().map((investment) => {
              const metrics = calculateIndividualMetrics(investment);
              return (
                <Card key={investment.id} className="p-4">
                  <div className="mb-3">
                    <h4 className="font-medium text-lg">{investment.propertyName}</h4>
                    <p className="text-sm text-muted-foreground">{investment.address}</p>
                     {investment.group && (
                       <Badge variant="outline" className="mt-1">
                         {investment.group}
                       </Badge>
                     )}
                     {hasDetailedExpenses(investment) && (
                       <Badge variant="secondary" className="mt-1">
                         Detailed Expenses
                       </Badge>
                     )}
                   </div>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                     <div className="text-center p-3 bg-muted/30 rounded-lg">
                       <div className="text-xs text-muted-foreground mb-1">Total Invested</div>
                       <p className="font-semibold">{formatCurrency(metrics.totalInvested)}</p>
                     </div>
                     <div className="text-center p-3 bg-muted/30 rounded-lg">
                       <div className="text-xs text-muted-foreground mb-1">Current Value</div>
                       <p className="font-semibold">{formatCurrency(metrics.currentValue)}</p>
                     </div>
                     <div className="text-center p-3 bg-muted/30 rounded-lg">
                       <div className="text-xs text-muted-foreground mb-1">Net Value</div>
                       <p className="font-semibold">{formatCurrency(metrics.netValue)}</p>
                     </div>
                     <div className="text-center p-3 bg-muted/30 rounded-lg">
                       <div className="text-xs text-muted-foreground mb-1">After Tax Net Equity</div>
                       <p className="font-semibold text-blue-600">{formatCurrency(metrics.afterTaxNetEquity)}</p>
                     </div>
                     <div className="text-center p-3 bg-muted/30 rounded-lg">
                       <div className="text-xs text-muted-foreground mb-1">Tax Savings</div>
                       <p className="font-semibold text-orange-600">{formatCurrency(metrics.taxSavings)}</p>
                     </div>
                     <div className="text-center p-3 bg-muted/30 rounded-lg">
                       <div className="text-xs text-muted-foreground mb-1">
                         {metrics.isPotentialRent ? 'Rent Potential*' : 'Monthly Rent'}
                       </div>
                       <p className="font-semibold text-green-600">{formatCurrency(metrics.monthlyRent)}</p>
                       {metrics.isPotentialRent && (
                         <p className="text-xs text-orange-500 mt-1">*Not in totals</p>
                       )}
                     </div>
                     <div className="text-center p-3 bg-muted/30 rounded-lg">
                       <div className="text-xs text-muted-foreground mb-1">Cash Flow</div>
                       <p className={`font-semibold ${metrics.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                         {formatCurrency(metrics.monthlyCashFlow)}
                       </p>
                       {metrics.isPotentialRent && (
                         <p className="text-xs text-orange-500 mt-1">*Excl. potential</p>
                       )}
                     </div>
                   </div>
                   
                   {/* Detailed Expenses View */}
                   {hasDetailedExpenses(investment) && showDetailedExpenses && (
                     <div className="mt-4 p-4 border rounded-lg bg-muted/20">
                       <h5 className="font-medium text-sm mb-3">Monthly Expense Breakdown</h5>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                         {investment.expenseDetails?.monthlyHELOC && (
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">HELOC:</span>
                             <span>{formatCurrency(investment.expenseDetails.monthlyHELOC)}</span>
                           </div>
                         )}
                         {investment.expenseDetails?.annualInsurance && (
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Insurance:</span>
                             <span>{formatCurrency(investment.expenseDetails.annualInsurance / 12)}/mo</span>
                           </div>
                         )}
                         {investment.expenseDetails?.annualPropertyTaxes && (
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Property Tax:</span>
                             <span>{formatCurrency(investment.expenseDetails.annualPropertyTaxes / 12)}/mo</span>
                           </div>
                         )}
                         {investment.expenseDetails?.monthlyManagementFees && (
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Management:</span>
                             <span>{formatCurrency(investment.expenseDetails.monthlyManagementFees)}</span>
                           </div>
                         )}
                         {investment.expenseDetails?.monthlyAssociationFees && (
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Association:</span>
                             <span>{formatCurrency(investment.expenseDetails.monthlyAssociationFees)}</span>
                           </div>
                         )}
                         {investment.expenseDetails?.monthlyMaintenance && (
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Maintenance:</span>
                             <span>{formatCurrency(investment.expenseDetails.monthlyMaintenance)}</span>
                           </div>
                         )}
                         {investment.expenseDetails?.monthlyOther && (
                           <div className="flex justify-between">
                             <span className="text-muted-foreground">Other:</span>
                             <span>{formatCurrency(investment.expenseDetails.monthlyOther)}</span>
                           </div>
                         )}
                       </div>
                     </div>
                   )}
                </Card>
              );
            })}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Lifetime KPIs */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Lifetime Performance</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Appreciation:</span>
                <span className={`font-semibold ${metrics.totalAppreciation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(metrics.totalAppreciation)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Cash-on-Cash Return:</span>
                <span className={`font-semibold ${metrics.lifetimeCashOnCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(metrics.lifetimeCashOnCashReturn)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg. Years Held:</span>
                <span className="font-semibold">
                  {metrics.avgYearsHeld.toFixed(1)} years
                </span>
              </div>
            </div>
          </div>

          {/* Current KPIs */}
          <div className="bg-gradient-to-r from-secondary/10 to-accent/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Current Performance</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Gross Return (Rent):</span>
                <span className={`font-semibold ${metrics.annualizedGrossCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(metrics.annualizedGrossCashReturn)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Net Return (After Costs):</span>
                <span className={`font-semibold ${metrics.annualizedNetCashReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(metrics.annualizedNetCashReturn)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Return (w/ 3% appr.):</span>
                <span className={`font-semibold ${metrics.annualizedTotalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(metrics.annualizedTotalReturn)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Disclaimer for potential income */}
        {metrics.totalPotentialMonthlyRent > 0 && (
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>*Note:</strong> Potential income from non-income generating properties is excluded from cash flow totals and return calculations. 
              Potential income is only shown for scenario planning purposes.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};