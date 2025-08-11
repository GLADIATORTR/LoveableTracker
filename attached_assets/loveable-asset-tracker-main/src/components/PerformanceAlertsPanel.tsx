import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, DollarSign, Calendar, Target, Lightbulb } from "lucide-react";
import { RealEstateInvestment } from "@/pages/Index";
import { getEffectiveMonthlyExpenses } from "@/lib/propertyUtils";
import { TaxBenefitsCalculator } from "./TaxBenefitsCalculator";

interface PerformanceAlertsPanelProps {
  investments: RealEstateInvestment[];
}

interface Alert {
  id: string;
  type: "warning" | "danger" | "info" | "success";
  title: string;
  description: string;
  property: string;
  category: "performance" | "tax" | "market" | "refinance" | "maintenance";
  priority: "high" | "medium" | "low";
  actionable: boolean;
  recommendation?: string;
}

export const PerformanceAlertsPanel = ({ investments }: PerformanceAlertsPanelProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    investments.forEach((investment) => {
      const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
      const monthlyNonMortgageCosts = getEffectiveMonthlyExpenses(investment) - investment.monthlyMortgage;
      const annualNetIncome = (investment.monthlyRent - monthlyNonMortgageCosts) * 12;
      const capRate = currentValue > 0 ? (annualNetIncome / currentValue) * 100 : 0;
      const totalMonthlyCosts = getEffectiveMonthlyExpenses(investment);
      const monthlyCashFlow = investment.monthlyRent - totalMonthlyCosts;
      const cashOnCashReturn = investment.downPayment > 0 ? (monthlyCashFlow * 12 / investment.downPayment) * 100 : 0;

      // Performance Alerts
      if (capRate < 4) {
        alerts.push({
          id: `${investment.id}-low-cap-rate`,
          type: "warning",
          title: "Low Cap Rate",
          description: `Cap rate of ${capRate.toFixed(2)}% is below market average`,
          property: investment.propertyName,
          category: "performance",
          priority: "medium",
          actionable: true,
          recommendation: "Consider increasing rent or reducing operating expenses"
        });
      }

      if (monthlyCashFlow < 0) {
        alerts.push({
          id: `${investment.id}-negative-cash-flow`,
          type: "danger",
          title: "Negative Cash Flow",
          description: `Monthly cash flow is ${formatCurrency(monthlyCashFlow)}`,
          property: investment.propertyName,
          category: "performance",
          priority: "high",
          actionable: true,
          recommendation: "Review rent pricing and reduce expenses, or consider refinancing"
        });
      }

      if (cashOnCashReturn < 6) {
        alerts.push({
          id: `${investment.id}-low-coc`,
          type: "warning",
          title: "Low Cash-on-Cash Return",
          description: `Return of ${cashOnCashReturn.toFixed(2)}% is below target`,
          property: investment.propertyName,
          category: "performance",
          priority: "medium",
          actionable: true,
          recommendation: "Optimize rent or consider property improvements"
        });
      }

      // Refinancing Opportunities
      if (investment.interestRate > 5.5 && investment.outstandingBalance > 100000) {
        const potentialSavings = (investment.interestRate - 4.5) / 100 * investment.outstandingBalance;
        alerts.push({
          id: `${investment.id}-refinance-opportunity`,
          type: "info",
          title: "Refinancing Opportunity",
          description: `Current rate ${investment.interestRate}% - potential savings ${formatCurrency(potentialSavings)}/year`,
          property: investment.propertyName,
          category: "refinance",
          priority: "medium",
          actionable: true,
          recommendation: "Contact lenders for current rates and refinancing options"
        });
      }

      // Tax Optimization Alerts
      const taxBenefits = TaxBenefitsCalculator.calculateTaxBenefits(investment);
      if (taxBenefits.totalTaxBenefits > 0 && !investment.taxBenefitOverride) {
        alerts.push({
          id: `${investment.id}-tax-benefits`,
          type: "success",
          title: "Tax Benefits Available",
          description: `${formatCurrency(taxBenefits.totalTaxBenefits)} in annual tax deductions`,
          property: investment.propertyName,
          category: "tax",
          priority: "low",
          actionable: true,
          recommendation: "Ensure all tax benefits are being claimed with your accountant"
        });
      }

      // 1031 Exchange Opportunities
      const exchange1031 = TaxBenefitsCalculator.calculate1031ExchangeOpportunity(investment);
      if (exchange1031.eligible && exchange1031.deferredGains > 50000) {
        const yearsHeld = investment.purchaseDate 
          ? (new Date().getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
          : 0;
        
        if (yearsHeld > 2) {
          alerts.push({
            id: `${investment.id}-1031-exchange`,
            type: "info",
            title: "1031 Exchange Opportunity",
            description: `Defer ${formatCurrency(exchange1031.deferredGains)} in capital gains taxes`,
            property: investment.propertyName,
            category: "tax",
            priority: "medium",
            actionable: true,
            recommendation: "Consider 1031 exchange to upgrade to a higher-performing property"
          });
        }
      }

      // Market Timing Alerts
      if (investment.purchaseDate) {
        const yearsHeld = (new Date().getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        const totalAppreciation = investment.purchasePrice > 0 ? ((currentValue - investment.purchasePrice) / investment.purchasePrice) * 100 : 0;
        
        if (yearsHeld > 5 && totalAppreciation > 100) {
          alerts.push({
            id: `${investment.id}-sell-consideration`,
            type: "info",
            title: "Consider Profit Taking",
            description: `Property has appreciated ${totalAppreciation.toFixed(1)}% over ${yearsHeld.toFixed(1)} years`,
            property: investment.propertyName,
            category: "market",
            priority: "low",
            actionable: true,
            recommendation: "Analyze if selling and reinvesting could improve portfolio returns"
          });
        }
      }

      // Maintenance & Age Alerts
      if (investment.purchaseDate) {
        const yearsOwned = (new Date().getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
        
        if (yearsOwned > 10 && investment.monthlyExpenses < 100) {
          alerts.push({
            id: `${investment.id}-maintenance-budget`,
            type: "warning",
            title: "Review Maintenance Budget",
            description: `Property is ${yearsOwned.toFixed(1)} years old but maintenance budget seems low`,
            property: investment.propertyName,
            category: "maintenance",
            priority: "medium",
            actionable: true,
            recommendation: "Consider increasing maintenance reserves for aging property"
          });
        }
      }
    });

    return alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const alerts = generateAlerts();
  const alertsByCategory = alerts.reduce((acc, alert) => {
    acc[alert.category] = (acc[alert.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getAlertIcon = (category: string) => {
    switch (category) {
      case "performance": return <TrendingDown className="h-4 w-4" />;
      case "tax": return <DollarSign className="h-4 w-4" />;
      case "market": return <Target className="h-4 w-4" />;
      case "refinance": return <Calendar className="h-4 w-4" />;
      case "maintenance": return <AlertTriangle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: string) => {
    switch (type) {
      case "danger": return "destructive";
      case "warning": return "default";
      case "success": return "default";
      case "info": return "default";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alert Summary
          </CardTitle>
          <CardDescription>
            {alerts.length} alerts across your portfolio - {alerts.filter(a => a.priority === 'high').length} high priority
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(alertsByCategory).map(([category, count]) => (
              <div key={category} className="text-center p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {getAlertIcon(category)}
                  <span className="text-sm font-medium capitalize">{category}</span>
                </div>
                <p className="text-xl font-bold">{count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts & Recommendations</CardTitle>
          <CardDescription>
            Actionable insights to optimize your real estate portfolio performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>All Good!</AlertTitle>
                <AlertDescription>
                  No critical alerts for your portfolio. Your investments are performing well.
                </AlertDescription>
              </Alert>
            ) : (
              alerts.map((alert) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  <div className="flex items-start justify-between w-full">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.category)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTitle className="text-sm">{alert.title}</AlertTitle>
                          <Badge variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'default' : 'secondary'}>
                            {alert.priority}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.property}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {alert.description}
                          {alert.recommendation && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                              <strong>Recommendation:</strong> {alert.recommendation}
                            </div>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                    {alert.actionable && (
                      <Button variant="outline" size="sm" className="ml-4">
                        Take Action
                      </Button>
                    )}
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};