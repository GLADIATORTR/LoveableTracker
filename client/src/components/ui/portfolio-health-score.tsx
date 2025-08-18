import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Star,
  Percent,
  Calculator,
  Award
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";
import { 
  calculateRealAppreciationMetrics, 
  formatCurrency 
} from "@/utils/inflationCalculations";

interface PortfolioHealthScoreProps {
  className?: string;
}

interface PortfolioMetrics {
  realROIAll: number; // Real ROI per year for entire portfolio
  realROIRentGenerating: number; // Real ROI per year excluding non-rent generating
  totalCashAtHand: number; // Total cash at hand for rent-generating properties
  efficiency: number; // Annual Net Yield / Market Value
  efficiencyRating: number; // 1-5 stars
  rentGeneratingRating: number; // 1-5 stars  
  averageRating: number; // Average of the two ratings
}

function calculatePortfolioMetrics(investments: RealEstateInvestmentWithCategory[]): PortfolioMetrics {
  if (investments.length === 0) {
    return {
      realROIAll: 0,
      realROIRentGenerating: 0,
      totalCashAtHand: 0,
      efficiency: 0,
      efficiencyRating: 1,
      rentGeneratingRating: 1,
      averageRating: 1
    };
  }

  // Filter rent-generating properties (monthly rent > 0)
  const rentGeneratingProperties = investments.filter(inv => inv.monthlyRent > 0);
  
  // Calculate Real ROI for all properties
  let totalRealROI = 0;
  let validPropertiesAll = 0;
  
  investments.forEach(inv => {
    const realMetrics = calculateRealAppreciationMetrics(
      inv.purchasePrice,
      inv.currentValue,
      inv.purchaseDate
    );
    if (realMetrics.realAppreciationRate !== 0) {
      totalRealROI += realMetrics.realAppreciationRate;
      validPropertiesAll++;
    }
  });
  
  const realROIAll = validPropertiesAll > 0 ? totalRealROI / validPropertiesAll : 0;
  
  // Calculate Real ROI for rent-generating properties only
  let totalRealROIRent = 0;
  let validPropertiesRent = 0;
  
  rentGeneratingProperties.forEach(inv => {
    const realMetrics = calculateRealAppreciationMetrics(
      inv.purchasePrice,
      inv.currentValue,
      inv.purchaseDate
    );
    if (realMetrics.realAppreciationRate !== 0) {
      totalRealROIRent += realMetrics.realAppreciationRate;
      validPropertiesRent++;
    }
  });
  
  const realROIRentGenerating = validPropertiesRent > 0 ? totalRealROIRent / validPropertiesRent : 0;
  
  // Calculate Total Cash at Hand (annual net cash flow from rent-generating properties)
  const totalCashAtHand = rentGeneratingProperties.reduce((sum, inv) => 
    sum + ((inv.monthlyRent - inv.monthlyExpenses) * 12), 0);
  
  // Calculate Efficiency (Annual Net Yield / Market Value)
  const totalMarketValue = rentGeneratingProperties.reduce((sum, inv) => sum + inv.currentValue, 0);
  const efficiency = totalMarketValue > 0 ? (totalCashAtHand / totalMarketValue) * 100 : 0;
  
  // Star ratings (1-5 stars)
  // Real ROI Rating: 0-2%=1⭐, 2-4%=2⭐, 4-6%=3⭐, 6-8%=4⭐, 8%+=5⭐
  const rentGeneratingRating = Math.min(Math.max(Math.ceil(realROIRentGenerating / 2), 1), 5);
  
  // Efficiency Rating: 0-2%=1⭐, 2-4%=2⭐, 4-6%=3⭐, 6-8%=4⭐, 8%+=5⭐
  const efficiencyRating = Math.min(Math.max(Math.ceil(efficiency / 2), 1), 5);
  
  // Average rating
  const averageRating = (rentGeneratingRating + efficiencyRating) / 2;

  return {
    realROIAll,
    realROIRentGenerating,
    totalCashAtHand,
    efficiency,
    efficiencyRating,
    rentGeneratingRating,
    averageRating
  };
}

// Helper function to render star rating
function StarRating({ rating }: { rating: number }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
    } else {
      stars.push(<Star key={i} className="w-4 h-4 text-gray-300" />);
    }
  }

  return <div className="flex">{stars}</div>;
}

export function PortfolioHealthScore({ className }: PortfolioHealthScoreProps) {
  const { data: investments = [], isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">Calculating portfolio metrics...</div>
        </CardContent>
      </Card>
    );
  }

  const portfolioMetrics = calculatePortfolioMetrics(investments);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Portfolio Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="text-center">
          <div className="mb-2">
            <StarRating rating={portfolioMetrics.averageRating} />
          </div>
          <div className="text-lg font-semibold text-foreground">
            Overall Rating: {portfolioMetrics.averageRating.toFixed(1)}/5.0
          </div>
          <div className="text-sm text-muted-foreground">
            Based on Real ROI and Efficiency metrics
          </div>
        </div>

        <Separator />

        {/* Portfolio Metrics */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Portfolio Analysis</h4>
          
          {/* Real ROI - All Properties */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Real ROI (All Properties)</span>
              </div>
              <span className={`font-semibold ${portfolioMetrics.realROIAll >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioMetrics.realROIAll >= 0 ? '+' : ''}{portfolioMetrics.realROIAll.toFixed(1)}%/year
              </span>
            </div>
          </div>

          {/* Real ROI - Rent Generating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Real ROI (Rent Generating)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${portfolioMetrics.realROIRentGenerating >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioMetrics.realROIRentGenerating >= 0 ? '+' : ''}{portfolioMetrics.realROIRentGenerating.toFixed(1)}%/year
                </span>
                <StarRating rating={portfolioMetrics.rentGeneratingRating} />
              </div>
            </div>
          </div>

          {/* Total Cash at Hand */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Total Cash at Hand (Annual)</span>
              </div>
              <span className={`font-semibold ${portfolioMetrics.totalCashAtHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioMetrics.totalCashAtHand * 100)}
              </span>
            </div>
          </div>

          {/* Efficiency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Efficiency (Yield/Market Value)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${portfolioMetrics.efficiency >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioMetrics.efficiency.toFixed(1)}%
                </span>
                <StarRating rating={portfolioMetrics.efficiencyRating} />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rating Benchmarks */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Star Rating Benchmarks</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>⭐ 1 Star: 0-2% annual return</div>
            <div>⭐⭐ 2 Stars: 2-4% annual return</div>
            <div>⭐⭐⭐ 3 Stars: 4-6% annual return</div>
            <div>⭐⭐⭐⭐ 4 Stars: 6-8% annual return</div>
            <div>⭐⭐⭐⭐⭐ 5 Stars: 8%+ annual return</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}