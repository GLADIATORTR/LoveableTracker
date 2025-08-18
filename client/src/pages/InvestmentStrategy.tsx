import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  Lightbulb,
  Star,
  ArrowRight,
  Calculator,
  Percent,
  Activity,
  Building2,
  Zap
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";
import { 
  formatCurrency,
  calculateTrueROI,
  calculateRealAppreciationMetrics 
} from "@/utils/inflationCalculations";

// Investment analysis calculations
interface InvestmentMetrics {
  property: RealEstateInvestmentWithCategory;
  irr: number;
  npv: number;
  npvIndex: number;
  totalReturn: number;
  annualizedReturn: number;
  paybackPeriod: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  vsStocks: 'outperform' | 'match' | 'underperform';
  riskScore: number;
}

// Calculate IRR using Newton-Raphson method
function calculateIRR(cashFlows: number[], initialGuess = 0.1): number {
  let rate = initialGuess;
  let tolerance = 0.000001;
  let maxIterations = 1000;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let npvDerivative = 0;
    
    for (let j = 0; j < cashFlows.length; j++) {
      npv += cashFlows[j] / Math.pow(1 + rate, j);
      npvDerivative -= j * cashFlows[j] / Math.pow(1 + rate, j + 1);
    }
    
    let newRate = rate - npv / npvDerivative;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100; // Return as percentage
    }
    
    rate = newRate;
  }
  
  return rate * 100; // Return as percentage if max iterations reached
}

// Calculate NPV
function calculateNPV(cashFlows: number[], discountRate: number): number {
  let npv = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    npv += cashFlows[i] / Math.pow(1 + discountRate, i);
  }
  return npv;
}

// Generate investment recommendations
function analyzeInvestment(property: RealEstateInvestmentWithCategory): InvestmentMetrics {
  const currentYear = 2025;
  const purchaseYear = new Date(property.purchaseDate).getFullYear();
  const yearsHeld = currentYear - purchaseYear;
  
  // Calculate monthly cash flows
  const monthlyRent = property.monthlyRent || 0;
  const monthlyExpenses = property.monthlyExpenses || 0;
  const monthlyMortgage = property.monthlyMortgage || 0;
  const monthlyCashFlow = monthlyRent - monthlyExpenses - monthlyMortgage;
  
  // Generate cash flow projections (assuming current cash flow continues)
  const projectionYears = 10;
  const cashFlows = [-property.purchasePrice]; // Initial investment
  
  // Add annual cash flows for held years
  for (let i = 1; i <= yearsHeld; i++) {
    cashFlows.push(monthlyCashFlow * 12);
  }
  
  // Add future projections with growth
  const cashFlowGrowthRate = 0.03; // 3% annual growth
  for (let i = yearsHeld + 1; i <= projectionYears + yearsHeld; i++) {
    const adjustedCashFlow = monthlyCashFlow * 12 * Math.pow(1 + cashFlowGrowthRate, i - yearsHeld);
    cashFlows.push(adjustedCashFlow);
  }
  
  // Add final sale value
  const appreciationRate = 0.035; // 3.5% annual appreciation
  const futureValue = property.currentValue * Math.pow(1 + appreciationRate, projectionYears);
  cashFlows[cashFlows.length - 1] += futureValue;
  
  // Calculate metrics
  const irr = calculateIRR(cashFlows);
  const discountRate = 0.08; // 8% discount rate
  const npv = calculateNPV(cashFlows, discountRate);
  const npvIndex = npv / Math.abs(cashFlows[0]); // NPV / Initial Investment
  
  const totalReturn = property.currentValue - property.purchasePrice + (monthlyCashFlow * 12 * yearsHeld);
  const annualizedReturn = yearsHeld > 0 ? Math.pow((property.currentValue + (monthlyCashFlow * 12 * yearsHeld)) / property.purchasePrice, 1 / yearsHeld) - 1 : 0;
  
  // Payback period (simplified)
  const paybackPeriod = monthlyCashFlow > 0 ? property.purchasePrice / (monthlyCashFlow * 12) : 0;
  
  // Generate recommendations
  let recommendation: InvestmentMetrics['recommendation'] = 'hold';
  let vsStocks: InvestmentMetrics['vsStocks'] = 'match';
  
  const stockMarketReturn = 0.10; // Assume 10% stock market return
  
  if (irr > 15) recommendation = 'strong_buy';
  else if (irr > 12) recommendation = 'buy';
  else if (irr < 5) recommendation = 'strong_sell';
  else if (irr < 8) recommendation = 'sell';
  
  if (irr > stockMarketReturn + 2) vsStocks = 'outperform';
  else if (irr < stockMarketReturn - 2) vsStocks = 'underperform';
  
  // Risk score (0-100, lower is less risky)
  const capRate = property.currentValue > 0 ? ((monthlyCashFlow * 12) / property.currentValue) * 100 : 0;
  const riskScore = Math.max(0, Math.min(100, 50 - (capRate * 5) + (yearsHeld > 10 ? -10 : 0)));
  
  return {
    property,
    irr,
    npv,
    npvIndex,
    totalReturn,
    annualizedReturn: annualizedReturn * 100,
    paybackPeriod,
    recommendation,
    vsStocks,
    riskScore
  };
}

export default function InvestmentStrategyPage() {
  const { data: investments = [], isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ['/api/investments'],
  });

  const investmentMetrics = investments.map(analyzeInvestment);
  
  // Portfolio aggregation
  const portfolioStats = {
    totalNPV: investmentMetrics.reduce((sum, m) => sum + m.npv, 0),
    averageIRR: investmentMetrics.length > 0 ? investmentMetrics.reduce((sum, m) => sum + m.irr, 0) / investmentMetrics.length : 0,
    averageNPVIndex: investmentMetrics.length > 0 ? investmentMetrics.reduce((sum, m) => sum + m.npvIndex, 0) / investmentMetrics.length : 0,
    strongBuyCount: investmentMetrics.filter(m => m.recommendation === 'strong_buy').length,
    outperformCount: investmentMetrics.filter(m => m.vsStocks === 'outperform').length,
    averageRisk: investmentMetrics.length > 0 ? investmentMetrics.reduce((sum, m) => sum + m.riskScore, 0) / investmentMetrics.length : 0,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'strong_buy': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'buy': return 'bg-green-100 text-green-800 border-green-200';
      case 'hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sell': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'strong_sell': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVsStocksColor = (vs: string) => {
    switch (vs) {
      case 'outperform': return 'text-emerald-600';
      case 'match': return 'text-blue-600';
      case 'underperform': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investment Strategy Analysis</h1>
          <p className="text-muted-foreground">
            IRR, NPV, and strategic recommendations vs traditional investments
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
            <Calculator className="w-3 h-3 mr-1" />
            {investmentMetrics.length} Properties Analyzed
          </Badge>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio IRR</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {portfolioStats.averageIRR.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total NPV</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(portfolioStats.totalNPV, true)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg NPV Index</p>
                <p className="text-2xl font-bold text-purple-600">
                  {portfolioStats.averageNPVIndex.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Score</p>
                <p className="text-2xl font-bold text-orange-600">
                  {portfolioStats.averageRisk.toFixed(0)}/100
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5" />
            <span>Portfolio Strategy Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-600">{portfolioStats.strongBuyCount}</p>
              <p className="text-sm text-emerald-700">Strong Buy Properties</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{portfolioStats.outperformCount}</p>
              <p className="text-sm text-blue-700">Outperform Stocks</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">
                {portfolioStats.averageIRR > 10 ? 'High' : portfolioStats.averageIRR > 6 ? 'Medium' : 'Low'}
              </p>
              <p className="text-sm text-purple-700">Portfolio Performance</p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Investment Strategy Recommendation
            </h4>
            <p className="text-sm text-gray-700">
              {portfolioStats.averageIRR > 12 
                ? "Your real estate portfolio is performing exceptionally well with strong IRR above market benchmarks. Consider expanding your real estate allocation."
                : portfolioStats.averageIRR > 8
                ? "Solid real estate performance matching or slightly exceeding traditional investments. Maintain current allocation with selective additions."
                : "Consider diversifying into higher-performing assets. Some properties may benefit from strategic improvements or divestment."
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Individual Property Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Property Investment Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {investmentMetrics.map((metrics, index) => (
              <div key={metrics.property.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{metrics.property.propertyName}</h4>
                    <p className="text-sm text-muted-foreground">{metrics.property.address}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Badge className={getRecommendationColor(metrics.recommendation)}>
                      {metrics.recommendation.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getVsStocksColor(metrics.vsStocks)}>
                      vs Stocks: {metrics.vsStocks.charAt(0).toUpperCase() + metrics.vsStocks.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">IRR</p>
                    <p className="font-semibold text-emerald-600">{metrics.irr.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NPV</p>
                    <p className="font-semibold text-blue-600">{formatCurrency(metrics.npv, true)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NPV Index</p>
                    <p className="font-semibold text-purple-600">{metrics.npvIndex.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Annual Return</p>
                    <p className="font-semibold text-orange-600">{metrics.annualizedReturn.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payback Period</p>
                    <p className="font-semibold text-gray-600">
                      {metrics.paybackPeriod > 0 ? `${metrics.paybackPeriod.toFixed(1)}yr` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Risk Score</p>
                    <p className="font-semibold text-gray-600">{metrics.riskScore.toFixed(0)}/100</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Investment Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Asset Class Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Real Estate Portfolio</h4>
                  <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Average IRR:</span>
                    <span className="font-semibold">{portfolioStats.averageIRR.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Risk Level:</span>
                    <span className="font-semibold">
                      {portfolioStats.averageRisk < 30 ? 'Low' : portfolioStats.averageRisk < 60 ? 'Medium' : 'High'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Liquidity:</span>
                    <span className="font-semibold text-orange-600">Low</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">S&P 500 Index</h4>
                  <Badge variant="outline">Benchmark</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Historical Return:</span>
                    <span className="font-semibold">10.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Risk Level:</span>
                    <span className="font-semibold">Medium</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Liquidity:</span>
                    <span className="font-semibold text-green-600">High</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Corporate Bonds</h4>
                  <Badge variant="outline">Conservative</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Current Yield:</span>
                    <span className="font-semibold">5.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Risk Level:</span>
                    <span className="font-semibold">Low</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Liquidity:</span>
                    <span className="font-semibold text-blue-600">Medium</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-800">Strategic Recommendation</h4>
              <p className="text-sm text-blue-700">
                {portfolioStats.averageIRR > 12 
                  ? "Your real estate IRR significantly outperforms stocks and bonds. Consider increasing real estate allocation to 70-80% of investment portfolio."
                  : portfolioStats.averageIRR > 10
                  ? "Real estate performance matches stock market returns with lower volatility. Maintain 60-70% real estate allocation."
                  : "Consider rebalancing toward index funds for better risk-adjusted returns. Target 40-50% real estate, 50-60% stocks/bonds."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}