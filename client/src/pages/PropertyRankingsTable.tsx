import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, DollarSign, Percent, Home } from "lucide-react";
import { useState } from "react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";
import {
  calculateTrueROI,
  calculateRealAppreciationMetrics,
  formatCurrency
} from "@/utils/inflationCalculations";

interface PropertyRanking {
  property: RealEstateInvestmentWithCategory;
  realROI: number;
  realAppreciationRate: number;
  capRate: number;
  annualNetYield: number;
  monthlyCashFlow: number;
  score: number;
}

type SortColumn = 'realROI' | 'capRate' | 'annualNetYield' | 'realAppreciationRate' | 'propertyName';
type SortOrder = 'asc' | 'desc';

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
      
      // Annual Net Yield: Annual Cash Flow / Current Value * 100
      const monthlyCashFlow = property.monthlyRent - property.monthlyExpenses - (property.monthlyMortgage || 0);
      const annualNetYield = property.currentValue > 0 ? 
        ((monthlyCashFlow * 12) / property.currentValue) * 100 : 0;
      
      // Combined score for overall ranking (weighted average)
      const score = (trueROI.annualizedROI * 0.3) + (capRate * 0.3) + (annualNetYield * 0.4);

      return {
        property,
        realROI: trueROI.annualizedROI, // Includes cash flow
        realAppreciationRate: realMetrics.realAppreciationRate,
        capRate,
        annualNetYield,
        monthlyCashFlow,
        score
      };
    })
    .filter(item => item.property.purchasePrice > 0);
}

export default function PropertyRankingsTable() {
  const [sortColumn, setSortColumn] = useState<SortColumn>('realROI');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { data: investments = [], isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ['/api/investments'],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const propertyRankings = calculatePropertyRankings(investments);
  
  const sortedRankings = [...propertyRankings].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;
    
    if (sortColumn === 'propertyName') {
      aValue = a.property.propertyName;
      bValue = b.property.propertyName;
    } else {
      aValue = a[sortColumn];
      bValue = b[sortColumn];
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    
    const numA = Number(aValue);
    const numB = Number(bValue);
    return sortOrder === 'asc' ? numA - numB : numB - numA;
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Property Rankings - Table View</h1>
          <p className="text-muted-foreground">
            Comprehensive metrics comparison with Real ROI including cash flow
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <TrendingUp className="w-3 h-3 mr-1" />
            {propertyRankings.length} Properties
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Home className="w-5 h-5" />
            <span>Investment Performance Metrics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-semibold">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('propertyName')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                    >
                      Property Name
                      {getSortIcon('propertyName')}
                    </Button>
                  </th>
                  <th className="p-4 font-semibold text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('realROI')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-emerald-700"
                    >
                      Real ROI Annualized
                      {getSortIcon('realROI')}
                    </Button>
                  </th>
                  <th className="p-4 font-semibold text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('capRate')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-blue-700"
                    >
                      Cap Rate
                      {getSortIcon('capRate')}
                    </Button>
                  </th>
                  <th className="p-4 font-semibold text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('annualNetYield')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-purple-700"
                    >
                      Annual Net Yield
                      {getSortIcon('annualNetYield')}
                    </Button>
                  </th>
                  <th className="p-4 font-semibold text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('realAppreciationRate')}
                      className="h-auto p-0 font-semibold hover:bg-transparent text-orange-700"
                    >
                      Real Appreciation
                      {getSortIcon('realAppreciationRate')}
                    </Button>
                  </th>
                  <th className="p-4 font-semibold text-right">Monthly Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {sortedRankings.map((ranking, index) => (
                  <tr key={ranking.property.id} className={`border-b hover:bg-muted/50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {ranking.property.propertyName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {ranking.property.address}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold text-lg ${
                          ranking.realROI >= 5 ? 'text-emerald-600' : 
                          ranking.realROI >= 2 ? 'text-blue-600' : 'text-gray-600'
                        }`}>
                          {formatPercentage(ranking.realROI)}
                        </span>
                        <span className="text-xs text-muted-foreground">includes cash flow</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-semibold ${
                        ranking.capRate >= 6 ? 'text-blue-600' : 
                        ranking.capRate >= 4 ? 'text-blue-500' : 'text-gray-600'
                      }`}>
                        {formatPercentage(ranking.capRate)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-semibold ${
                        ranking.annualNetYield >= 6 ? 'text-purple-600' : 
                        ranking.annualNetYield >= 3.5 ? 'text-purple-500' : 'text-gray-600'
                      }`}>
                        {formatPercentage(ranking.annualNetYield)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-semibold ${
                        ranking.realAppreciationRate >= 4 ? 'text-orange-600' : 
                        ranking.realAppreciationRate >= 2 ? 'text-orange-500' : 'text-gray-600'
                      }`}>
                        {formatPercentage(ranking.realAppreciationRate)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`font-semibold ${
                          ranking.monthlyCashFlow >= 300000 ? 'text-green-600' : 
                          ranking.monthlyCashFlow >= 100000 ? 'text-green-500' : 
                          ranking.monthlyCashFlow >= 0 ? 'text-gray-600' : 'text-red-500'
                        }`}>
                          {formatCurrency(ranking.monthlyCashFlow)}
                        </span>
                        <span className="text-xs text-muted-foreground">per month</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {propertyRankings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
            <p className="text-muted-foreground">
              Add some properties to see their ranking and performance metrics.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}