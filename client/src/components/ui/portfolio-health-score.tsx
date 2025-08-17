import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Award,
  BarChart3
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

interface PortfolioHealthScoreProps {
  className?: string;
}

interface HealthMetrics {
  overallScore: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  diversificationScore: number;
  performanceScore: number;
  riskScore: number;
  liquidityScore: number;
  recommendations: string[];
  strengths: string[];
  concerns: string[];
}

function calculatePortfolioHealth(investments: RealEstateInvestmentWithCategory[]): HealthMetrics {
  if (investments.length === 0) {
    return {
      overallScore: 0,
      grade: 'D',
      diversificationScore: 0,
      performanceScore: 0,
      riskScore: 0,
      liquidityScore: 0,
      recommendations: ['Add properties to your portfolio to get started'],
      strengths: [],
      concerns: ['No properties in portfolio']
    };
  }

  // Calculate individual metrics
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalCashFlow = investments.reduce((sum, inv) => 
    sum + ((inv.monthlyRent - inv.monthlyExpenses) * 12), 0);
  
  // Performance Score (0-100)
  const avgROI = investments.reduce((sum, inv) => {
    const roi = inv.purchasePrice > 0 ? ((inv.currentValue - inv.purchasePrice) / inv.purchasePrice) * 100 : 0;
    return sum + roi;
  }, 0) / investments.length;
  
  const performanceScore = Math.min(Math.max((avgROI / 12) * 100, 0), 100); // 12% ROI = 100 score

  // Diversification Score (0-100)
  const uniqueStates = new Set(investments.map(inv => inv.address?.split(',').pop()?.trim() || 'Unknown')).size;
  const propertyTypes = new Set(investments.map(inv => inv.category?.name || 'Unknown')).size;
  const diversificationScore = Math.min(
    (uniqueStates * 20) + (propertyTypes * 15) + (investments.length * 5), 100
  );

  // Risk Score (0-100, higher is better/safer)
  const avgCapRate = investments.reduce((sum, inv) => {
    const capRate = inv.currentValue > 0 ? (((inv.monthlyRent - inv.monthlyExpenses) * 12) / inv.currentValue) * 100 : 0;
    return sum + capRate;
  }, 0) / investments.length;
  
  const riskScore = Math.min(Math.max((avgCapRate / 8) * 100, 0), 100); // 8% cap rate = 100 score

  // Liquidity Score (simplified)
  const avgPropertyValue = totalValue / investments.length;
  const liquidityScore = avgPropertyValue < 50000000 ? 80 : avgPropertyValue < 100000000 ? 60 : 40; // Smaller properties are more liquid

  // Overall Score
  const overallScore = Math.round(
    (performanceScore * 0.3) + 
    (diversificationScore * 0.25) + 
    (riskScore * 0.25) + 
    (liquidityScore * 0.2)
  );

  // Grade Assignment
  let grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 85) grade = 'B+';
  else if (overallScore >= 80) grade = 'B';
  else if (overallScore >= 70) grade = 'C+';
  else if (overallScore >= 60) grade = 'C';
  else grade = 'D';

  // Generate recommendations
  const recommendations: string[] = [];
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (performanceScore < 50) {
    recommendations.push('Focus on properties with higher ROI potential');
    concerns.push('Below-average portfolio performance');
  } else if (performanceScore > 75) {
    strengths.push('Strong portfolio performance');
  }

  if (diversificationScore < 40) {
    recommendations.push('Consider diversifying across more locations and property types');
    concerns.push('Limited geographic diversification');
  } else if (diversificationScore > 70) {
    strengths.push('Well-diversified portfolio');
  }

  if (riskScore < 50) {
    recommendations.push('Improve cash flow stability by increasing rents or reducing expenses');
    concerns.push('Low cash flow relative to property values');
  } else if (riskScore > 75) {
    strengths.push('Strong cash flow generation');
  }

  if (investments.length < 3) {
    recommendations.push('Consider adding more properties to improve diversification');
  }

  if (investments.length > 10) {
    strengths.push('Substantial portfolio size');
  }

  if (totalCashFlow > 100000) {
    strengths.push('Positive cash flow generation');
  }

  return {
    overallScore,
    grade,
    diversificationScore,
    performanceScore,
    riskScore,
    liquidityScore,
    recommendations,
    strengths,
    concerns
  };
}

function getGradeColor(grade: string) {
  switch (grade) {
    case 'A+':
    case 'A': return 'text-green-600 bg-green-50 border-green-200';
    case 'B+':
    case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'C+':
    case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'D': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

export function PortfolioHealthScore({ className }: PortfolioHealthScoreProps) {
  const { data: investments = [], isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Calculating portfolio health...</div>
        </CardContent>
      </Card>
    );
  }

  const healthMetrics = calculatePortfolioHealth(investments);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Portfolio Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-gray-200 relative">
              <div 
                className={`absolute inset-0 rounded-full border-8 border-transparent ${getScoreColor(healthMetrics.overallScore)}`}
                style={{
                  borderTopColor: healthMetrics.overallScore >= 80 ? '#16a34a' : 
                                   healthMetrics.overallScore >= 60 ? '#ca8a04' : '#dc2626',
                  transform: `rotate(${(healthMetrics.overallScore / 100) * 360}deg)`,
                  borderRightColor: healthMetrics.overallScore >= 25 ? 'currentColor' : 'transparent',
                  borderBottomColor: healthMetrics.overallScore >= 50 ? 'currentColor' : 'transparent',
                  borderLeftColor: healthMetrics.overallScore >= 75 ? 'currentColor' : 'transparent',
                }}
              />
              <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center flex-col">
                <div className={`text-2xl font-bold ${getScoreColor(healthMetrics.overallScore)}`}>
                  {healthMetrics.overallScore}
                </div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Badge className={`${getGradeColor(healthMetrics.grade)} text-lg px-3 py-1`}>
              Grade {healthMetrics.grade}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Individual Metrics */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Detailed Breakdown</h4>
          
          {[
            { label: 'Performance', value: healthMetrics.performanceScore, icon: TrendingUp },
            { label: 'Diversification', value: healthMetrics.diversificationScore, icon: BarChart3 },
            { label: 'Risk Management', value: healthMetrics.riskScore, icon: Shield },
            { label: 'Liquidity', value: healthMetrics.liquidityScore, icon: Target },
          ].map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <metric.icon className="w-4 h-4 text-muted-foreground" />
                  <span>{metric.label}</span>
                </div>
                <span className={`font-medium ${getScoreColor(metric.value)}`}>
                  {metric.value}/100
                </span>
              </div>
              <Progress 
                value={metric.value} 
                className="h-2"
                // @ts-ignore
                indicatorClassName={
                  metric.value >= 80 ? 'bg-green-500' : 
                  metric.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Strengths */}
        {healthMetrics.strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Portfolio Strengths
            </h4>
            <div className="space-y-1">
              {healthMetrics.strengths.map((strength, index) => (
                <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  {strength}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concerns */}
        {healthMetrics.concerns.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Areas of Concern
            </h4>
            <div className="space-y-1">
              {healthMetrics.concerns.map((concern, index) => (
                <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                  {concern}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {healthMetrics.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Recommended Actions
            </h4>
            <div className="space-y-2">
              {healthMetrics.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-sm text-blue-800 flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    {recommendation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}