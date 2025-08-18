import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Target, 
  TrendingUp, 
  Shield, 
  Clock, 
  DollarSign,
  BarChart3,
  Lightbulb,
  MapPin,
  Home,
  AlertTriangle,
  CheckCircle,
  Zap,
  Star,
  Award,
  ArrowRight
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

interface InvestmentGoals {
  primary: 'growth' | 'income' | 'preservation' | 'balanced';
  timeHorizon: number; // years
  riskTolerance: number; // 1-10 scale
  targetReturn: number; // percentage
  liquidityNeeds: 'low' | 'medium' | 'high';
  specialConsiderations: string;
}

interface StrategyRecommendation {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedReturn: number;
  timeframe: string;
  confidence: number;
  actions: string[];
  pros: string[];
  cons: string[];
  marketConditions: string[];
  priority: 'high' | 'medium' | 'low';
}

interface PersonalizedStrategy {
  overallScore: number;
  strategyType: string;
  recommendations: StrategyRecommendation[];
  portfolioAllocation: {
    propertyTypes: { type: string; percentage: number; }[];
    geographic: { region: string; percentage: number; }[];
    riskDistribution: { level: string; percentage: number; }[];
  };
  nextSteps: string[];
  warnings: string[];
}

function analyzePortfolioAndGenerateStrategy(
  investments: RealEstateInvestmentWithCategory[],
  goals: InvestmentGoals
): PersonalizedStrategy {
  // Portfolio analysis
  const totalValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalCashFlow = investments.reduce((sum, inv) => 
    sum + ((inv.monthlyRent - inv.monthlyExpenses) * 12), 0);
  
  // Calculate current portfolio metrics
  const avgROI = investments.reduce((sum, inv) => {
    const roi = inv.purchasePrice > 0 ? ((inv.currentValue - inv.purchasePrice) / inv.purchasePrice) * 100 : 0;
    return sum + roi;
  }, 0) / (investments.length || 1);

  const currentCashYield = totalValue > 0 ? (totalCashFlow / totalValue) * 100 : 0;
  
  // Diversification analysis
  const propertyTypes = investments.reduce((acc, inv) => {
    const type = inv.category?.name || 'Mixed Use';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locations = investments.reduce((acc, inv) => {
    const location = inv.address?.split(',').pop()?.trim() || 'Unknown';
    acc[location] = (acc[location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate strategy based on goals and current portfolio
  const strategy = generatePersonalizedStrategy(goals, {
    portfolioSize: investments.length,
    totalValue,
    avgROI,
    currentCashYield,
    diversification: {
      propertyTypes: Object.keys(propertyTypes).length,
      locations: Object.keys(locations).length
    }
  });

  return strategy;
}

function generatePersonalizedStrategy(goals: InvestmentGoals, portfolioMetrics: any): PersonalizedStrategy {
  const recommendations: StrategyRecommendation[] = [];
  const warnings: string[] = [];
  const nextSteps: string[] = [];

  // Growth-focused strategy
  if (goals.primary === 'growth') {
    recommendations.push({
      id: 'growth-appreciation',
      title: 'High-Growth Market Focus',
      description: 'Target emerging markets with strong population and job growth for maximum appreciation potential.',
      riskLevel: 'high',
      expectedReturn: 12,
      timeframe: '5-10 years',
      confidence: 85,
      actions: [
        'Research high-growth metropolitan areas',
        'Focus on properties in gentrifying neighborhoods',
        'Consider fix-and-flip opportunities',
        'Leverage for maximum buying power'
      ],
      pros: ['High appreciation potential', 'Market momentum', 'Strong rental demand'],
      cons: ['Higher risk', 'Market volatility', 'Requires active management'],
      marketConditions: ['Low interest rates favorable', 'Strong job market essential'],
      priority: 'high'
    });

    if (portfolioMetrics.portfolioSize < 3) {
      recommendations.push({
        id: 'diversification-growth',
        title: 'Strategic Diversification',
        description: 'Expand portfolio across multiple high-growth markets to reduce concentration risk.',
        riskLevel: 'medium',
        expectedReturn: 10,
        timeframe: '3-7 years',
        confidence: 90,
        actions: [
          'Add properties in 2-3 different metro areas',
          'Mix property types (SFH, condos, small multifamily)',
          'Stagger purchase timing'
        ],
        pros: ['Risk reduction', 'Multiple growth vectors', 'Portfolio stability'],
        cons: ['Slower initial growth', 'Higher management complexity'],
        marketConditions: ['Stable economic conditions preferred'],
        priority: 'high'
      });
    }
  }

  // Income-focused strategy
  if (goals.primary === 'income') {
    recommendations.push({
      id: 'cashflow-optimization',
      title: 'Cash Flow Maximization',
      description: 'Focus on properties with strong rental yields and stable tenant demand.',
      riskLevel: 'low',
      expectedReturn: 8,
      timeframe: '1-5 years',
      confidence: 95,
      actions: [
        'Target rental properties with 8%+ cap rates',
        'Focus on stable, established neighborhoods',
        'Consider multi-family properties',
        'Implement value-add strategies'
      ],
      pros: ['Steady income stream', 'Lower volatility', 'Predictable returns'],
      cons: ['Limited appreciation upside', 'Tenant management required'],
      marketConditions: ['Benefits from stable rental markets'],
      priority: 'high'
    });

    if (portfolioMetrics.currentCashYield < 6) {
      warnings.push('Current portfolio cash yield below target for income strategy');
      nextSteps.push('Review rent pricing and consider property improvements');
    }
  }

  // Conservative/Preservation strategy
  if (goals.primary === 'preservation') {
    recommendations.push({
      id: 'preservation-focus',
      title: 'Capital Preservation Strategy',
      description: 'Maintain wealth through stable, high-quality properties in established markets.',
      riskLevel: 'low',
      expectedReturn: 6,
      timeframe: '10+ years',
      confidence: 95,
      actions: [
        'Focus on prime locations with historical stability',
        'Avoid speculative markets',
        'Maintain conservative leverage ratios',
        'Regular property maintenance and upgrades'
      ],
      pros: ['Low risk', 'Stable appreciation', 'Inflation hedge'],
      cons: ['Lower returns', 'Limited growth potential'],
      marketConditions: ['Performs well in uncertain economic times'],
      priority: 'high'
    });
  }

  // Risk-based adjustments
  if (goals.riskTolerance < 4) {
    warnings.push('Low risk tolerance may limit growth potential');
    nextSteps.push('Consider REITs for diversified real estate exposure');
  } else if (goals.riskTolerance > 7) {
    recommendations.push({
      id: 'aggressive-leverage',
      title: 'Leverage Optimization',
      description: 'Use strategic leverage to amplify returns while managing risk.',
      riskLevel: 'high',
      expectedReturn: 15,
      timeframe: '3-7 years',
      confidence: 75,
      actions: [
        'Optimize debt-to-equity ratios',
        'Consider HELOC for rapid expansion',
        'Explore commercial lending options',
        'Maintain cash reserves for opportunities'
      ],
      pros: ['Amplified returns', 'Faster portfolio growth', 'Tax benefits'],
      cons: ['Higher risk', 'Interest rate sensitivity', 'Cash flow requirements'],
      marketConditions: ['Low interest rate environment preferred'],
      priority: 'medium'
    });
  }

  // Portfolio allocation recommendations
  const portfolioAllocation = {
    propertyTypes: [
      { type: 'Single Family', percentage: goals.primary === 'growth' ? 40 : 50 },
      { type: 'Multi Family', percentage: goals.primary === 'income' ? 40 : 30 },
      { type: 'Commercial', percentage: goals.riskTolerance > 6 ? 20 : 10 },
      { type: 'REITs', percentage: goals.riskTolerance < 4 ? 20 : 10 }
    ],
    geographic: [
      { region: 'Primary Market', percentage: 60 },
      { region: 'Secondary Markets', percentage: 30 },
      { region: 'Emerging Markets', percentage: goals.riskTolerance > 6 ? 10 : 0 }
    ],
    riskDistribution: [
      { level: 'Conservative', percentage: Math.max(10 - goals.riskTolerance, 20) },
      { level: 'Moderate', percentage: 60 },
      { level: 'Aggressive', percentage: Math.min(goals.riskTolerance * 10, 40) }
    ]
  };

  // General next steps
  if (portfolioMetrics.portfolioSize === 0) {
    nextSteps.push('Start with house-hacking or small rental property');
  }
  
  if (portfolioMetrics.diversification.locations < 2) {
    nextSteps.push('Consider geographic diversification');
  }

  nextSteps.push('Review and rebalance quarterly');
  nextSteps.push('Monitor market conditions and adjust strategy accordingly');

  const overallScore = Math.min(95, 50 + (goals.riskTolerance * 5) + (portfolioMetrics.portfolioSize * 3));

  return {
    overallScore,
    strategyType: `${goals.primary.charAt(0).toUpperCase() + goals.primary.slice(1)}-Focused Strategy`,
    recommendations: recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
    portfolioAllocation,
    nextSteps,
    warnings
  };
}

interface InvestmentStrategyGeneratorProps {
  className?: string;
}

export function InvestmentStrategyGenerator({ className }: InvestmentStrategyGeneratorProps) {
  const [goals, setGoals] = useState<InvestmentGoals>({
    primary: 'balanced',
    timeHorizon: 10,
    riskTolerance: 5,
    targetReturn: 8,
    liquidityNeeds: 'medium',
    specialConsiderations: ''
  });
  
  const [strategy, setStrategy] = useState<PersonalizedStrategy | null>(null);
  const [activeTab, setActiveTab] = useState("assessment");

  const { data: investments = [], isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  const generateStrategy = () => {
    const personalizedStrategy = analyzePortfolioAndGenerateStrategy(investments, goals);
    setStrategy(personalizedStrategy);
    setActiveTab("recommendations");
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Star className="w-4 h-4 text-yellow-500" />;
      case 'medium': return <Target className="w-4 h-4 text-blue-500" />;
      case 'low': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Personalized Investment Strategy Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get tailored investment recommendations based on your goals, risk tolerance, and current portfolio.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assessment">Goals Assessment</TabsTrigger>
            <TabsTrigger value="recommendations" disabled={!strategy}>Strategy</TabsTrigger>
            <TabsTrigger value="allocation" disabled={!strategy}>Allocation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assessment" className="space-y-6">
            <div className="space-y-6">
              {/* Primary Investment Goal */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Primary Investment Goal</Label>
                <Select value={goals.primary} onValueChange={(value: any) => setGoals({...goals, primary: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="growth">Growth - Maximize appreciation</SelectItem>
                    <SelectItem value="income">Income - Steady cash flow</SelectItem>
                    <SelectItem value="preservation">Preservation - Protect capital</SelectItem>
                    <SelectItem value="balanced">Balanced - Mix of growth and income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Time Horizon */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Investment Time Horizon</Label>
                <div className="space-y-2">
                  <Slider
                    value={[goals.timeHorizon]}
                    onValueChange={(value) => setGoals({...goals, timeHorizon: value[0]})}
                    max={30}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 year</span>
                    <span className="font-medium">{goals.timeHorizon} years</span>
                    <span>30+ years</span>
                  </div>
                </div>
              </div>

              {/* Risk Tolerance */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Risk Tolerance</Label>
                <div className="space-y-2">
                  <Slider
                    value={[goals.riskTolerance]}
                    onValueChange={(value) => setGoals({...goals, riskTolerance: value[0]})}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Conservative</span>
                    <span className="font-medium">{goals.riskTolerance}/10</span>
                    <span>Aggressive</span>
                  </div>
                </div>
              </div>

              {/* Target Return */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Target Annual Return</Label>
                <div className="space-y-2">
                  <Slider
                    value={[goals.targetReturn]}
                    onValueChange={(value) => setGoals({...goals, targetReturn: value[0]})}
                    max={20}
                    min={3}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>3%</span>
                    <span className="font-medium">{goals.targetReturn}%</span>
                    <span>20%</span>
                  </div>
                </div>
              </div>

              {/* Liquidity Needs */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Liquidity Needs</Label>
                <Select value={goals.liquidityNeeds} onValueChange={(value: any) => setGoals({...goals, liquidityNeeds: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Long-term investments</SelectItem>
                    <SelectItem value="medium">Medium - Some flexibility needed</SelectItem>
                    <SelectItem value="high">High - Need quick access to capital</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Special Considerations */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Special Considerations</Label>
                <Textarea
                  placeholder="Any specific requirements, constraints, or preferences..."
                  value={goals.specialConsiderations}
                  onChange={(e) => setGoals({...goals, specialConsiderations: e.target.value})}
                  className="min-h-20"
                />
              </div>

              <Button onClick={generateStrategy} className="w-full" disabled={isLoading}>
                {isLoading ? 'Analyzing Portfolio...' : 'Generate Personalized Strategy'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="recommendations" className="space-y-6">
            {strategy && (
              <div className="space-y-6">
                {/* Strategy Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        {strategy.strategyType}
                      </CardTitle>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        Score: {strategy.overallScore}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={strategy.overallScore} className="mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Based on your goals and current portfolio analysis
                    </p>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {strategy.warnings.length > 0 && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-800">
                        <AlertTriangle className="w-5 h-5" />
                        Important Considerations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {strategy.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Strategy Recommendations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recommended Strategies</h3>
                  {strategy.recommendations.map((rec) => (
                    <Card key={rec.id} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {getPriorityIcon(rec.priority)}
                              {rec.title}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getRiskColor(rec.riskLevel)}>
                              {rec.riskLevel} risk
                            </Badge>
                            <div className="text-right text-xs text-muted-foreground">
                              {rec.expectedReturn}% expected return
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Action Steps
                            </h5>
                            <ul className="space-y-1 text-sm">
                              {rec.actions.map((action, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h5 className="font-medium mb-1 text-green-600">Pros</h5>
                              <ul className="text-xs text-green-700 space-y-1">
                                {rec.pros.map((pro, index) => (
                                  <li key={index}>• {pro}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h5 className="font-medium mb-1 text-red-600">Considerations</h5>
                              <ul className="text-xs text-red-700 space-y-1">
                                {rec.cons.map((con, index) => (
                                  <li key={index}>• {con}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Timeframe: {rec.timeframe}</span>
                            <span>Confidence: {rec.confidence}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Next Steps */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Immediate Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {strategy.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="allocation" className="space-y-6">
            {strategy && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Recommended Portfolio Allocation</h3>
                
                {/* Property Types */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-primary" />
                      Property Type Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {strategy.portfolioAllocation.propertyTypes.map((type) => (
                      <div key={type.type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{type.type}</span>
                          <span className="font-medium">{type.percentage}%</span>
                        </div>
                        <Progress value={type.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Geographic Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Geographic Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {strategy.portfolioAllocation.geographic.map((region) => (
                      <div key={region.region} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{region.region}</span>
                          <span className="font-medium">{region.percentage}%</span>
                        </div>
                        <Progress value={region.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Risk Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Risk Level Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {strategy.portfolioAllocation.riskDistribution.map((risk) => (
                      <div key={risk.level} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{risk.level}</span>
                          <span className="font-medium">{risk.percentage}%</span>
                        </div>
                        <Progress value={risk.percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}