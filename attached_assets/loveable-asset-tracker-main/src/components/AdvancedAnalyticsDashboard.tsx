import { useState } from "react";
import { CollapsibleCard } from "./CollapsibleCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, BarChart3, PieChart, Calculator, AlertTriangle, Target, FileText } from "lucide-react";
import { RealEstateInvestment } from "@/pages/Index";
import { TaxBenefitsCalculator } from "./TaxBenefitsCalculator";
import { MarketComparisonTool } from "./MarketComparisonTool";
import { PerformanceAlertsPanel } from "./PerformanceAlertsPanel";
import { TaxOptimizationModule } from "./TaxOptimizationModule";
import { AnalyticsReportGenerator } from "./AnalyticsReportGenerator";
import { Card } from "@/components/ui/card";

interface AdvancedAnalyticsDashboardProps {
  investments: RealEstateInvestment[];
  onUpdateInvestment: (id: string, updates: Partial<RealEstateInvestment>) => void;
}

export const AdvancedAnalyticsDashboard = ({ investments, onUpdateInvestment }: AdvancedAnalyticsDashboardProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  
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

  // Calculate enhanced portfolio metrics with tax benefits
  const calculateEnhancedPortfolioMetrics = () => {
    if (investments.length === 0) return null;

    let totalTaxBenefits = 0;
    let totalTaxSavings = 0;
    let totalNetValueWithTax = 0;
    let totalAnnualDepreciation = 0;
    let total1031Eligible = 0;

    investments.forEach(investment => {
      const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(investment);
      const taxRate = investment.taxRate || 0.25;
      const taxSavings = TaxBenefitsCalculator.calculateTaxSavings(taxBenefits.totalTaxBenefits, taxRate);
      
      totalTaxBenefits += taxBenefits.totalTaxBenefits;
      totalTaxSavings += taxSavings;
      totalAnnualDepreciation += taxBenefits.annualDepreciation;
      
      // Calculate tax-adjusted net value
      const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
      const netValue = currentValue - investment.outstandingBalance;
      totalNetValueWithTax += netValue + taxSavings;

      // Check 1031 exchange eligibility
      const exchange1031 = TaxBenefitsCalculator.calculate1031ExchangeOpportunity(investment);
      if (exchange1031.eligible) {
        total1031Eligible += 1;
      }
    });

    const totalCurrentValue = investments.reduce((sum, inv) => 
      sum + (inv.currentValue > 0 ? inv.currentValue : inv.purchasePrice), 0);
    const totalDownPayment = investments.reduce((sum, inv) => sum + inv.downPayment, 0);

    return {
      totalTaxBenefits,
      totalTaxSavings,
      totalNetValueWithTax,
      totalAnnualDepreciation,
      total1031Eligible,
      totalCurrentValue,
      totalDownPayment,
      avgTaxBenefitRate: totalDownPayment > 0 ? (totalTaxBenefits / totalDownPayment) * 100 : 0,
    };
  };

  const enhancedMetrics = calculateEnhancedPortfolioMetrics();

  if (!enhancedMetrics) {
    return (
      <CollapsibleCard title="Advanced Analytics Dashboard" description="No investments available for analysis" defaultOpen={false}>
        <div></div>
      </CollapsibleCard>
    );
  }

  return (
    <CollapsibleCard 
      title="Advanced Analytics Dashboard" 
      description="Comprehensive tax benefits analysis, market comparison, and performance optimization"
      defaultOpen={false}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calculator className="h-6 w-6" />
          <span className="text-lg font-medium">Analytics Overview</span>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {formatCurrency(enhancedMetrics.totalTaxSavings)} Annual Tax Savings
        </Badge>
      </div>
        {/* Enhanced Portfolio Summary with Tax Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-center gap-2 text-sm text-green-700 mb-2">
              <DollarSign className="h-4 w-4" />
              Total Tax Benefits
            </div>
            <p className="text-xl font-bold text-green-800">{formatCurrency(enhancedMetrics.totalTaxBenefits)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-center gap-2 text-sm text-blue-700 mb-2">
              <TrendingUp className="h-4 w-4" />
              Tax-Adjusted Net Value
            </div>
            <p className="text-xl font-bold text-blue-800">{formatCurrency(enhancedMetrics.totalNetValueWithTax)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-center gap-2 text-sm text-purple-700 mb-2">
              <BarChart3 className="h-4 w-4" />
              Annual Depreciation
            </div>
            <p className="text-xl font-bold text-purple-800">{formatCurrency(enhancedMetrics.totalAnnualDepreciation)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-center gap-2 text-sm text-orange-700 mb-2">
              <Target className="h-4 w-4" />
              1031 Exchange Eligible
            </div>
            <p className="text-xl font-bold text-orange-800">{enhancedMetrics.total1031Eligible} Properties</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-center gap-2 text-sm text-indigo-700 mb-2">
              <PieChart className="h-4 w-4" />
              Avg Tax Benefit Rate
            </div>
            <p className="text-xl font-bold text-indigo-800">{formatPercentage(enhancedMetrics.avgTaxBenefitRate)}</p>
          </div>
        </div>

        <Tabs defaultValue="tax-benefits" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tax-benefits" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Tax Benefits
            </TabsTrigger>
            <TabsTrigger value="market-comparison" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Market Analysis
            </TabsTrigger>
            <TabsTrigger value="performance-alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="tax-optimization" className="gap-2">
              <Target className="h-4 w-4" />
              Tax Optimization
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tax-benefits" className="mt-6">
            <div className="space-y-6">
              {investments.map((investment) => {
                const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(investment);
                const taxRate = investment.taxRate || 0.25;
                const taxSavings = TaxBenefitsCalculator.calculateTaxSavings(taxBenefits.totalTaxBenefits, taxRate);
                
                return (
                  <Card key={investment.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-lg">{investment.propertyName}</h4>
                        <p className="text-sm text-muted-foreground">{investment.address}</p>
                        {investment.group && (
                          <Badge variant="outline" className="mt-1">
                            {investment.group}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Annual Tax Savings</p>
                        <p className="text-xl font-bold text-green-600">{formatCurrency(taxSavings)}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Depreciation</div>
                        <p className="font-semibold">{formatCurrency(taxBenefits.annualDepreciation)}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Mortgage Interest</div>
                        <p className="font-semibold">{formatCurrency(taxBenefits.mortgageInterestDeduction)}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Property Tax</div>
                        <p className="font-semibold">{formatCurrency(taxBenefits.propertyTaxDeduction)}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Maintenance</div>
                        <p className="font-semibold">{formatCurrency(taxBenefits.maintenanceDeductions)}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="market-comparison" className="mt-6">
            <MarketComparisonTool investments={investments} />
          </TabsContent>

          <TabsContent value="performance-alerts" className="mt-6">
            <PerformanceAlertsPanel investments={investments} />
          </TabsContent>

          <TabsContent value="tax-optimization" className="mt-6">
            <TaxOptimizationModule 
              investments={investments} 
              onUpdateInvestment={onUpdateInvestment}
            />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <AnalyticsReportGenerator investments={investments} />
          </TabsContent>
        </Tabs>
    </CollapsibleCard>
  );
};