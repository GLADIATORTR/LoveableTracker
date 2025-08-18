import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Home, 
  MapPin, 
  Calendar,
  BarChart3,
  Target,
  Award,
  AlertTriangle
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";
import { 
  calculateRealAppreciationMetrics 
} from "@/utils/inflationCalculations";

interface PropertyComparisonProps {
  className?: string;
}

interface ComparisonMetrics {
  cashFlow: number;
  roi: number;
  realROI: number;
  realAppreciationRate: number;
  efficiency: number;
  capRate: number;
  appreciation: number;
  marketPerformance: 'outperforming' | 'average' | 'underperforming';
  investmentGrade: 'A' | 'B' | 'C' | 'D';
  riskLevel: 'low' | 'medium' | 'high';
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function calculateMetrics(investment: RealEstateInvestmentWithCategory): ComparisonMetrics {
  const cashFlow = (investment.monthlyRent - investment.monthlyExpenses) * 12;
  const roi = investment.purchasePrice > 0 ? ((investment.currentValue - investment.purchasePrice) / investment.purchasePrice) * 100 : 0;
  const capRate = investment.currentValue > 0 ? (cashFlow / investment.currentValue) * 100 : 0;
  const efficiency = investment.currentValue > 0 ? (cashFlow / investment.currentValue) * 100 : 0;
  
  // Calculate real ROI using inflation calculations
  const realMetrics = calculateRealAppreciationMetrics(
    investment.purchasePrice,
    investment.currentValue,
    investment.purchaseDate
  );
  
  // Simulated market data - in real app this would come from market APIs
  const marketAvgROI = 8.5;
  const marketAvgCapRate = 6.2;
  
  const marketPerformance = realMetrics.realAppreciationRate > marketAvgROI * 1.1 ? 'outperforming' : realMetrics.realAppreciationRate < marketAvgROI * 0.9 ? 'underperforming' : 'average';
  
  let investmentGrade: 'A' | 'B' | 'C' | 'D' = 'C';
  if (realMetrics.realAppreciationRate >= 12 && capRate >= 8) investmentGrade = 'A';
  else if (realMetrics.realAppreciationRate >= 8 && capRate >= 6) investmentGrade = 'B';
  else if (realMetrics.realAppreciationRate >= 5 && capRate >= 4) investmentGrade = 'C';
  else investmentGrade = 'D';

  const riskLevel = capRate < 4 ? 'high' : capRate > 8 ? 'low' : 'medium';
  
  return {
    cashFlow,
    roi,
    realROI: realMetrics.realROI,
    realAppreciationRate: realMetrics.realAppreciationRate,
    efficiency,
    capRate,
    appreciation: 3.5, // Placeholder - would be calculated from historical data
    marketPerformance,
    investmentGrade,
    riskLevel
  };
}

function getPerformanceColor(performance: string) {
  switch (performance) {
    case 'outperforming': return 'text-green-600 bg-green-50';
    case 'underperforming': return 'text-red-600 bg-red-50';
    default: return 'text-yellow-600 bg-yellow-50';
  }
}

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A': return 'text-green-600 bg-green-50 border-green-200';
    case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'D': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function PropertyComparison({ className }: PropertyComparisonProps) {
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('roi');

  const { data: investments = [], isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else if (prev.length < 4) { // Limit to 4 properties for comparison
        return [...prev, propertyId];
      }
      return prev;
    });
  };

  const selectedInvestments = investments.filter(inv => selectedProperties.includes(inv.id));
  const sortedInvestments = [...selectedInvestments].sort((a, b) => {
    const metricsA = calculateMetrics(a);
    const metricsB = calculateMetrics(b);
    
    switch (sortBy) {
      case 'roi': return metricsB.realAppreciationRate - metricsA.realAppreciationRate;
      case 'cashFlow': return metricsB.cashFlow - metricsA.cashFlow;
      case 'capRate': return metricsB.capRate - metricsA.capRate;
      default: return 0;
    }
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Loading properties...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Property Comparison
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Compare up to 4 properties side-by-side with market benchmarks
              </p>
            </div>
            {selectedProperties.length > 0 && (
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roi">Real ROI</SelectItem>
                  <SelectItem value="cashFlow">Cash Flow</SelectItem>
                  <SelectItem value="capRate">Cap Rate</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="selection" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="selection">Property Selection</TabsTrigger>
              <TabsTrigger value="comparison" disabled={selectedProperties.length < 2}>
                Comparison ({selectedProperties.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="selection" className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Select 2-4 properties to compare. Currently selected: {selectedProperties.length}/4
              </div>
              
              <div className="grid gap-3">
                {investments.map((investment) => {
                  const metrics = calculateMetrics(investment);
                  const isSelected = selectedProperties.includes(investment.id);
                  
                  return (
                    <div
                      key={investment.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handlePropertyToggle(investment.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={isSelected}
                            disabled={!isSelected && selectedProperties.length >= 4}
                          />
                          <div>
                            <h4 className="font-medium">
                              {investment.propertyName || `Property ${investment.id.slice(0, 8)}`}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {investment.address || 'No address'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getGradeColor(metrics.investmentGrade)}>
                            Grade {metrics.investmentGrade}
                          </Badge>
                          <Badge className={getPerformanceColor(metrics.marketPerformance)}>
                            {metrics.marketPerformance}
                          </Badge>
                          <div className="text-right">
                            <div className="font-medium">{formatPercent(metrics.roi)}</div>
                            <div className="text-sm text-muted-foreground">ROI</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="comparison" className="space-y-6">
              {sortedInvestments.length >= 2 ? (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sortedInvestments.map((investment) => {
                      const metrics = calculateMetrics(investment);
                      
                      return (
                        <Card key={investment.id} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <Badge className={getGradeColor(metrics.investmentGrade)}>
                                {metrics.investmentGrade}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePropertyToggle(investment.id)}
                                className="h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">
                                {investment.propertyName || `Property ${investment.id.slice(0, 8)}`}
                              </h3>
                              <p className="text-xs text-muted-foreground">
                                {investment.address || 'No address'}
                              </p>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-3">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <div className="text-muted-foreground">Value</div>
                                <div className="font-medium">{formatCurrency(investment.currentValue)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Cash Flow</div>
                                <div className="font-medium">{formatCurrency(metrics.cashFlow)}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Real ROI</div>
                                <div className="font-medium flex items-center gap-1">
                                  {formatPercent(metrics.realAppreciationRate)}
                                  {metrics.realAppreciationRate > 8 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                                </div>
                                <div className="text-xs text-muted-foreground">per year</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Cap Rate</div>
                                <div className="font-medium">{formatPercent(metrics.capRate)}</div>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span>Market Performance</span>
                                <Badge className={`${getPerformanceColor(metrics.marketPerformance)} text-xs px-1 py-0`}>
                                  {metrics.marketPerformance}
                                </Badge>
                              </div>
                              <Progress 
                                value={metrics.roi > 0 ? Math.min((metrics.roi / 15) * 100, 100) : 0} 
                                className="h-2"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {/* Detailed Comparison Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detailed Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Metric</th>
                              {sortedInvestments.map((inv) => (
                                <th key={inv.id} className="text-center py-2 min-w-24">
                                  {inv.propertyName?.split(' ').slice(0, 2).join(' ') || `Prop ${inv.id.slice(0, 4)}`}
                                </th>
                              ))}
                              <th className="text-center py-2 text-muted-foreground">Market Avg</th>
                            </tr>
                          </thead>
                          <tbody className="space-y-1">
                            {[
                              { label: 'Purchase Price', key: 'purchasePrice', format: formatCurrency, market: 45000000 },
                              { label: 'Current Value', key: 'currentValue', format: formatCurrency, market: 52000000 },
                              { label: 'Monthly Rent', key: 'monthlyRent', format: formatCurrency, market: 250000 },
                              { label: 'Real ROI (Annualized)', key: 'realAppreciationRate', format: formatPercent, market: 6.8 },
                              { label: 'Efficiency (Yield/Value)', key: 'efficiency', format: formatPercent, market: 5.5 },
                              { label: 'Cap Rate', key: 'capRate', format: formatPercent, market: 6.2 },
                              { label: 'Cash Flow (Annual)', key: 'cashFlow', format: formatCurrency, market: 180000 },
                            ].map((row) => (
                              <tr key={row.label} className="border-b border-border/30">
                                <td className="py-2 font-medium">{row.label}</td>
                                {sortedInvestments.map((inv) => {
                                  const metrics = calculateMetrics(inv);
                                  let value = row.key === 'realAppreciationRate' ? metrics.realAppreciationRate : 
                                             row.key === 'efficiency' ? metrics.efficiency :
                                             row.key === 'capRate' ? metrics.capRate :
                                             row.key === 'cashFlow' ? metrics.cashFlow :
                                             inv[row.key as keyof typeof inv] as number;
                                  
                                  return (
                                    <td key={inv.id} className="text-center py-2 font-medium">
                                      {row.format(value)}
                                    </td>
                                  );
                                })}
                                <td className="text-center py-2 text-muted-foreground">
                                  {row.format(row.market)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Investment Recommendations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Investment Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {sortedInvestments.map((investment, index) => {
                          const metrics = calculateMetrics(investment);
                          
                          let recommendation = '';
                          let recommendationType: 'success' | 'warning' | 'destructive' = 'success';
                          
                          if (metrics.investmentGrade === 'A') {
                            recommendation = 'Excellent performer - consider increasing investment or finding similar properties';
                            recommendationType = 'success';
                          } else if (metrics.investmentGrade === 'D') {
                            recommendation = 'Underperforming - consider renovation, rent increase, or divestment';
                            recommendationType = 'destructive';
                          } else {
                            recommendation = 'Average performer - look for optimization opportunities';
                            recommendationType = 'warning';
                          }
                          
                          return (
                            <div key={investment.id} className="flex items-start gap-3 p-3 border rounded-lg">
                              <div className="flex-shrink-0">
                                {recommendationType === 'success' && <Award className="w-5 h-5 text-green-500" />}
                                {recommendationType === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                                {recommendationType === 'destructive' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">
                                  {investment.propertyName || `Property ${investment.id.slice(0, 8)}`} 
                                  <Badge className={`ml-2 ${getGradeColor(metrics.investmentGrade)}`}>
                                    Grade {metrics.investmentGrade}
                                  </Badge>
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">{recommendation}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Select Properties to Compare</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose at least 2 properties from the selection tab to start comparing
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}