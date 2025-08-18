import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Calculator,
  Star,
  Trophy,
  Medal,
  Award,
  MapPin,
  Calendar,
  Percent
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";
import { 
  calculateRealAppreciationMetrics, 
  calculateTrueROI,
  formatCurrency 
} from "@/utils/inflationCalculations";

interface PropertyRanking {
  property: RealEstateInvestmentWithCategory;
  realROI: number;
  realAppreciationRate: number;
  capRate: number;
  monthlyNetYield: number;
  monthlyCashFlow: number;
  score: number;
}

function calculatePropertyRankings(investments: RealEstateInvestmentWithCategory[]): PropertyRanking[] {
  return investments
    .map(property => {
      const realMetrics = calculateRealAppreciationMetrics(
        property.purchasePrice,
        property.currentValue,
        property.purchaseDate.toString()
      );
      
      // Calculate TRUE ROI including cash flow
      const trueROI = calculateTrueROI(
        property.purchasePrice,
        property.currentValue,
        property.monthlyRent || 0,
        property.monthlyExpenses || 0,
        property.monthlyMortgage || 0,
        property.purchaseDate.toString(),
        2025 // Use 2025 as current year
      );
      
      // Cap Rate: (Annual Net Operating Income / Current Property Value) * 100
      const capRate = property.currentValue > 0 ? 
        (((property.monthlyRent - property.monthlyExpenses - (property.monthlyMortgage || 0)) * 12) / property.currentValue) * 100 : 0;
      
      // Monthly Net Yield: Monthly Cash Flow / Current Value * 100
      const monthlyCashFlow = property.monthlyRent - property.monthlyExpenses - (property.monthlyMortgage || 0);
      const monthlyNetYield = property.currentValue > 0 ? 
        (monthlyCashFlow / property.currentValue) * 100 : 0;
      
      // Combined score for overall ranking (weighted average)
      const score = (trueROI.annualizedROI * 0.3) + (capRate * 0.3) + (monthlyNetYield * 0.4);
      
      // Debug ALL properties to see what's happening
      console.log(`=== ${property.propertyName} DEBUG ===`);
      console.log('Raw data from API:');
      console.log('  monthlyRent (raw):', property.monthlyRent);
      console.log('  monthlyExpenses (raw):', property.monthlyExpenses);
      console.log('  monthlyMortgage (raw):', property.monthlyMortgage);
      console.log('  purchasePrice (raw):', property.purchasePrice);
      console.log('  currentValue (raw):', property.currentValue);
      
      console.log('Calculated values:');
      console.log('  Net Monthly Cash Flow (cents):', monthlyCashFlow);
      console.log('  Net Monthly Cash Flow ($):', monthlyCashFlow / 100);
      
      console.log('Function results:');
      console.log('  trueROI:', trueROI);
      console.log('  realMetrics:', realMetrics);
      
      console.log('FINAL VALUES BEING DISPLAYED:');
      console.log('  Real ROI:', trueROI.annualizedROI);
      console.log('  Real Appreciation:', realMetrics.realAppreciationRate);
      console.log('---');

      return {
        property,
        realROI: trueROI.annualizedROI, // Now includes cash flow!
        realAppreciationRate: realMetrics.realAppreciationRate,
        capRate,
        monthlyNetYield,
        monthlyCashFlow,
        score
      };
    })
    .sort((a, b) => b.score - a.score); // Sort by highest score first
}

function formatCurrencyShort(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) return 'N/A';
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

function getRankIcon(index: number) {
  switch (index) {
    case 0: return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 1: return <Medal className="w-5 h-5 text-gray-400" />;
    case 2: return <Award className="w-5 h-5 text-orange-600" />;
    default: return <Star className="w-5 h-5 text-muted-foreground" />;
  }
}

function getRankBadgeVariant(index: number) {
  switch (index) {
    case 0: return "default";
    case 1: return "secondary";
    case 2: return "outline";
    default: return "outline";
  }
}

interface RankingCardProps {
  ranking: PropertyRanking;
  index: number;
  sortBy: 'overall' | 'realROI' | 'capRate' | 'monthlyNetYield' | 'realAppreciation';
}

function RankingCard({ ranking, index, sortBy }: RankingCardProps) {
  const { property } = ranking;
  
  const getHighlightedValue = () => {
    switch (sortBy) {
      case 'realROI':
        return `${ranking.realAppreciationRate >= 0 ? '+' : ''}${ranking.realAppreciationRate.toFixed(1)}%/yr`;
      case 'capRate':
        return `${ranking.capRate.toFixed(1)}%`;
      case 'monthlyNetYield':
        return `${ranking.monthlyNetYield.toFixed(2)}%`;
      case 'realAppreciation':
        return `${ranking.realAppreciationRate >= 0 ? '+' : ''}${ranking.realAppreciationRate.toFixed(1)}%/yr`;
      default:
        return `${ranking.score.toFixed(1)}`;
    }
  };

  const getHighlightedLabel = () => {
    switch (sortBy) {
      case 'realROI': return 'Real ROI Annualized';
      case 'capRate': return 'Cap Rate';
      case 'monthlyNetYield': return 'Monthly Net Yield';
      case 'realAppreciation': return 'Real Appreciation Rate';
      default: return 'Overall Score';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {getRankIcon(index)}
            <div>
              <CardTitle className="text-lg font-semibold line-clamp-1">
                {property.propertyName}
              </CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="line-clamp-1">{property.address}</span>
              </div>
            </div>
          </div>
          <Badge variant={getRankBadgeVariant(index)} className="flex-shrink-0">
            #{index + 1}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Highlighted Metric */}
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">{getHighlightedLabel()}</div>
          <div className="text-2xl font-bold text-foreground">{getHighlightedValue()}</div>
        </div>
        
        <Separator />
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Activity className="w-3 h-3 mr-1" />
              Real ROI Annualized
            </div>
            <div className={`font-semibold text-sm ${ranking.realAppreciationRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ranking.realAppreciationRate >= 0 ? '+' : ''}{ranking.realAppreciationRate.toFixed(1)}%/yr
            </div>
          </div>
          
          <div>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Calculator className="w-3 h-3 mr-1" />
              Cap Rate
            </div>
            <div className={`font-semibold text-sm ${ranking.capRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ranking.capRate.toFixed(1)}%
            </div>
          </div>
          
          <div>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <Percent className="w-3 h-3 mr-1" />
              Monthly Yield
            </div>
            <div className={`font-semibold text-sm ${ranking.monthlyNetYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ranking.monthlyNetYield.toFixed(2)}%
            </div>
          </div>
          
          <div>
            <div className="flex items-center text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Appreciation
            </div>
            <div className={`font-semibold text-sm ${ranking.realAppreciationRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {ranking.realAppreciationRate >= 0 ? '+' : ''}{ranking.realAppreciationRate.toFixed(1)}%/yr
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Property Details */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground mb-1">Monthly Cash Flow</div>
            <div className={`font-medium ${ranking.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrencyShort(ranking.monthlyCashFlow * 100)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Current Value</div>
            <div className="font-medium text-foreground">
              {formatCurrencyShort(property.currentValue)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Purchase Date</div>
            <div className="font-medium text-foreground">
              {formatDate(property.purchaseDate)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Property Type</div>
            <div className="font-medium text-foreground">
              {property.propertyType}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropertyRankings() {
  const { data: investments, isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  const [sortBy, setSortBy] = React.useState<'overall' | 'realROI' | 'capRate' | 'monthlyNetYield' | 'realAppreciation'>('overall');

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="space-y-4">
          <div className="h-8 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-6 w-32 bg-muted rounded animate-pulse mb-4" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!investments || investments.length === 0) {
    return (
      <div className="animate-fade-in text-center py-12">
        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Properties to Rank</h3>
        <p className="text-muted-foreground mb-6">
          Add some investment properties to see performance rankings.
        </p>
      </div>
    );
  }

  const rankings = calculatePropertyRankings(investments);
  
  // Sort based on selected criteria - FIXED SORTING BUG
  const sortedRankings = [...rankings].sort((a, b) => {
    switch (sortBy) {
      case 'realROI': return b.realROI - a.realROI; // Fixed: was using realAppreciationRate instead of realROI
      case 'capRate': return b.capRate - a.capRate;
      case 'monthlyNetYield': return b.monthlyNetYield - a.monthlyNetYield;
      case 'realAppreciation': return b.realAppreciationRate - a.realAppreciationRate;
      default: return b.score - a.score;
    }
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Property Rankings</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Compare and rank your properties by key performance metrics
          </p>
        </div>
        
        {/* Sort Controls */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === 'overall' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('overall')}
          >
            Overall Score
          </Button>
          <Button
            variant={sortBy === 'realROI' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('realROI')}
          >
            Real ROI Annualized
          </Button>
          <Button
            variant={sortBy === 'capRate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('capRate')}
          >
            Cap Rate
          </Button>
          <Button
            variant={sortBy === 'monthlyNetYield' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('monthlyNetYield')}
          >
            Monthly Net Yield
          </Button>
          <Button
            variant={sortBy === 'realAppreciation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('realAppreciation')}
          >
            Real Appreciation
          </Button>
        </div>
      </div>

      {/* Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedRankings.map((ranking, index) => (
          <RankingCard 
            key={ranking.property.id} 
            ranking={ranking} 
            index={index} 
            sortBy={sortBy}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Portfolio Ranking Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {sortedRankings.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {sortedRankings.filter(r => r.score > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Positive Performers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {sortedRankings.length > 0 ? (sortedRankings.reduce((sum, r) => sum + r.realAppreciationRate, 0) / sortedRankings.length).toFixed(1) : '0.0'}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Real Appreciation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {sortedRankings.length > 0 ? (sortedRankings.reduce((sum, r) => sum + r.capRate, 0) / sortedRankings.length).toFixed(1) : '0.0'}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Cap Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}