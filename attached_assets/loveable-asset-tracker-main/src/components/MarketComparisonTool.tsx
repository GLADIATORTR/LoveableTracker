import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RealEstateInvestment } from "@/pages/Index";
import { getEffectiveMonthlyExpenses } from "@/lib/propertyUtils";

interface MarketComparisonToolProps {
  investments: RealEstateInvestment[];
}

export const MarketComparisonTool = ({ investments }: MarketComparisonToolProps) => {
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

  // Market benchmarks (these would typically come from external data sources)
  const getMarketBenchmarks = (propertyType: string, zipCode?: string) => {
    // Simulated market data - in production, this would come from APIs like Zillow, RentSpree, etc.
    const benchmarks = {
      "single-family": {
        avgCapRate: 6.5,
        avgAppreciation: 4.2,
        avgRentYield: 8.1,
        avgCashOnCash: 7.8,
      },
      "multi-family": {
        avgCapRate: 7.2,
        avgAppreciation: 3.8,
        avgRentYield: 9.4,
        avgCashOnCash: 8.5,
      },
      "condo": {
        avgCapRate: 5.8,
        avgAppreciation: 3.9,
        avgRentYield: 7.3,
        avgCashOnCash: 6.8,
      },
      "townhouse": {
        avgCapRate: 6.1,
        avgAppreciation: 4.0,
        avgRentYield: 7.8,
        avgCashOnCash: 7.2,
      },
      "commercial": {
        avgCapRate: 8.5,
        avgAppreciation: 3.2,
        avgRentYield: 10.2,
        avgCashOnCash: 9.1,
      },
    };

    return benchmarks[propertyType as keyof typeof benchmarks] || benchmarks["single-family"];
  };

  const calculatePropertyMetrics = (investment: RealEstateInvestment) => {
    const currentValue = investment.currentValue > 0 ? investment.currentValue : investment.purchasePrice;
    const monthlyNonMortgageCosts = getEffectiveMonthlyExpenses(investment) - investment.monthlyMortgage;
    const annualNetIncome = (investment.monthlyRent - monthlyNonMortgageCosts) * 12;
    const capRate = currentValue > 0 ? (annualNetIncome / currentValue) * 100 : 0;
    
    const totalMonthlyCosts = getEffectiveMonthlyExpenses(investment);
    const annualCashFlow = (investment.monthlyRent - totalMonthlyCosts) * 12;
    const cashOnCashReturn = investment.downPayment > 0 ? (annualCashFlow / investment.downPayment) * 100 : 0;
    
    const rentYield = investment.downPayment > 0 ? (investment.monthlyRent * 12 / investment.downPayment) * 100 : 0;
    
    // Calculate appreciation rate if we have purchase date
    let appreciationRate = investment.avgAppreciationRate || 3.5;
    if (investment.purchaseDate) {
      const yearsHeld = (new Date().getTime() - new Date(investment.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (yearsHeld > 0 && investment.purchasePrice > 0) {
        const totalAppreciation = ((currentValue - investment.purchasePrice) / investment.purchasePrice) * 100;
        appreciationRate = totalAppreciation / yearsHeld;
      }
    }

    return {
      capRate,
      appreciationRate,
      rentYield,
      cashOnCashReturn,
    };
  };

  const getPerformanceIndicator = (actual: number, benchmark: number, isHigherBetter: boolean = true) => {
    const difference = actual - benchmark;
    const percentDiff = benchmark !== 0 ? (difference / benchmark) * 100 : 0;
    
    if (Math.abs(percentDiff) < 5) {
      return { icon: <Minus className="h-4 w-4" />, color: "text-yellow-600", text: "On Par" };
    }
    
    const isPerforming = isHigherBetter ? difference > 0 : difference < 0;
    
    if (isPerforming) {
      return { icon: <TrendingUp className="h-4 w-4" />, color: "text-green-600", text: "Outperforming" };
    } else {
      return { icon: <TrendingDown className="h-4 w-4" />, color: "text-red-600", text: "Underperforming" };
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Market Performance Comparison</CardTitle>
          <CardDescription>
            Compare your properties against local market benchmarks and industry averages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Property</TableHead>
                  <TableHead className="text-center font-semibold">Cap Rate</TableHead>
                  <TableHead className="text-center font-semibold">Appreciation</TableHead>
                  <TableHead className="text-center font-semibold">Rent Yield</TableHead>
                  <TableHead className="text-center font-semibold">Cash-on-Cash</TableHead>
                  <TableHead className="text-center font-semibold">Overall Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => {
                  const metrics = calculatePropertyMetrics(investment);
                  const benchmarks = getMarketBenchmarks(investment.propertyType, investment.zipCode);
                  
                  const capRateIndicator = getPerformanceIndicator(metrics.capRate, benchmarks.avgCapRate);
                  const appreciationIndicator = getPerformanceIndicator(metrics.appreciationRate, benchmarks.avgAppreciation);
                  const rentYieldIndicator = getPerformanceIndicator(metrics.rentYield, benchmarks.avgRentYield);
                  const cashOnCashIndicator = getPerformanceIndicator(metrics.cashOnCashReturn, benchmarks.avgCashOnCash);
                  
                  // Calculate overall performance score
                  const scores = [
                    metrics.capRate >= benchmarks.avgCapRate ? 1 : 0,
                    metrics.appreciationRate >= benchmarks.avgAppreciation ? 1 : 0,
                    metrics.rentYield >= benchmarks.avgRentYield ? 1 : 0,
                    metrics.cashOnCashReturn >= benchmarks.avgCashOnCash ? 1 : 0,
                  ];
                  const overallScore = scores.reduce((sum, score) => sum + score, 0);
                  
                  let overallBadge;
                  if (overallScore >= 3) {
                    overallBadge = <Badge className="bg-green-100 text-green-800 border-green-300">Excellent</Badge>;
                  } else if (overallScore >= 2) {
                    overallBadge = <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Good</Badge>;
                  } else {
                    overallBadge = <Badge className="bg-red-100 text-red-800 border-red-300">Needs Attention</Badge>;
                  }
                  
                  return (
                    <TableRow key={investment.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{investment.propertyName}</div>
                          <div className="text-sm text-muted-foreground">{investment.propertyType}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold">{formatPercentage(metrics.capRate)}</div>
                          <div className={`text-xs flex items-center justify-center gap-1 ${capRateIndicator.color}`}>
                            {capRateIndicator.icon}
                            {capRateIndicator.text}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg: {formatPercentage(benchmarks.avgCapRate)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold">{formatPercentage(metrics.appreciationRate)}</div>
                          <div className={`text-xs flex items-center justify-center gap-1 ${appreciationIndicator.color}`}>
                            {appreciationIndicator.icon}
                            {appreciationIndicator.text}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg: {formatPercentage(benchmarks.avgAppreciation)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold">{formatPercentage(metrics.rentYield)}</div>
                          <div className={`text-xs flex items-center justify-center gap-1 ${rentYieldIndicator.color}`}>
                            {rentYieldIndicator.icon}
                            {rentYieldIndicator.text}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg: {formatPercentage(benchmarks.avgRentYield)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <div className="font-semibold">{formatPercentage(metrics.cashOnCashReturn)}</div>
                          <div className={`text-xs flex items-center justify-center gap-1 ${cashOnCashIndicator.color}`}>
                            {cashOnCashIndicator.icon}
                            {cashOnCashIndicator.text}
                          </div>
                          <div className="text-xs text-muted-foreground">Avg: {formatPercentage(benchmarks.avgCashOnCash)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          {overallBadge}
                          <div className="text-xs text-muted-foreground">{overallScore}/4 metrics above average</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Market Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Market Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Top Performing Properties</h4>
              {investments
                .map(inv => ({
                  ...inv,
                  score: Object.values(calculatePropertyMetrics(inv)).reduce((sum, val) => sum + val, 0)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)
                .map(inv => (
                  <div key={inv.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                    <span className="font-medium">{inv.propertyName}</span>
                    <Badge variant="secondary">High Performer</Badge>
                  </div>
                ))
              }
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Properties Needing Attention</h4>
              {investments
                .map(inv => {
                  const metrics = calculatePropertyMetrics(inv);
                  const benchmarks = getMarketBenchmarks(inv.propertyType);
                  const underperforming = Object.entries(metrics).filter(([key, value]) => {
                    const benchmarkKey = `avg${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof benchmarks;
                    return value < (benchmarks[benchmarkKey] || 0);
                  }).length;
                  return { ...inv, underperforming };
                })
                .filter(inv => inv.underperforming >= 2)
                .slice(0, 3)
                .map(inv => (
                  <div key={inv.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="font-medium">{inv.propertyName}</span>
                    <Badge variant="destructive">Needs Review</Badge>
                  </div>
                ))
              }
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};