import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { InvestmentForm } from "@/components/ui/investment-form";
import { CSVImport } from "@/components/ui/csv-import";
import { CSVTemplate } from "@/components/ui/csv-template";
import { queryClient } from "@/lib/queryClient";
import { 
  Plus,
  Edit,
  Trash2,
  Home,
  MapPin,
  DollarSign,
  Calendar,
  TrendingUp,
  Download,
  Activity,
  Percent,
  Calculator
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";
import { 
  calculateRealAppreciationMetrics, 
  formatCurrency as formatInflationCurrency 
} from "@/utils/inflationCalculations";

function formatCurrency(cents: number): string {
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
    day: 'numeric',
  });
}

function calculateCashFlow(monthlyRent: number, monthlyExpenses: number, monthlyMortgage: number = 0): number {
  return monthlyRent - monthlyExpenses - monthlyMortgage;
}

function calculateROI(currentValue: number, purchasePrice: number): number {
  if (purchasePrice === 0) return 0;
  return ((currentValue - purchasePrice) / purchasePrice) * 100;
}

export default function Investments() {
  const { toast } = useToast();
  const [editingInvestment, setEditingInvestment] = useState<RealEstateInvestmentWithCategory | null>(null);

  const { data: investments, isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/investments/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete investment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Investment Deleted",
        description: "Investment property has been removed from your portfolio.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete investment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSuccess = () => {
    setEditingInvestment(null);
    toast({
      title: "Success",
      description: "Investment updated successfully.",
    });
  };

  const handleDelete = (investment: RealEstateInvestmentWithCategory) => {
    deleteInvestment.mutate(investment.id);
  };

  const exportInvestments = () => {
    if (!investments || investments.length === 0) {
      toast({
        title: "No Data",
        description: "No investments to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const csvHeaders = [
        'Property Name',
        'Address',
        'Investment Property Type',
        'Country',
        'Purchase Price',
        'Current Value',
        'Monthly Rent',
        'Monthly Expenses',
        'Purchase Date',
        'Down Payment',
        'Loan Amount',
        'Interest Rate (%)',
        'Loan Term (Years)',
        'Outstanding Balance',
        'Monthly Mortgage',
        'Net Cash Flow',
        'Net Equity',
        'ROI (%)'
      ];

      const csvData = investments.map(inv => [
        inv.propertyName || '',
        inv.address || '',
        inv.propertyType || '',
        inv.country || 'USA',
        (inv.purchasePrice / 100).toFixed(2),
        (inv.currentValue / 100).toFixed(2),
        (inv.monthlyRent / 100).toFixed(2),
        (inv.monthlyExpenses / 100).toFixed(2),
        formatDate(inv.purchaseDate),
        ((inv.downPayment || 0) / 100).toFixed(2),
        ((inv.loanAmount || 0) / 100).toFixed(2),
        ((inv.interestRate || 0) / 10000).toFixed(2),
        Math.round((inv.loanTerm || 0) / 12).toString(),
        ((inv.outstandingBalance || 0) / 100).toFixed(2),
        ((inv.monthlyMortgage || 0) / 100).toFixed(2),
        (calculateCashFlow(inv.monthlyRent, inv.monthlyExpenses, inv.monthlyMortgage || 0) / 100).toFixed(2),
        ((inv.netEquity || 0) / 100).toFixed(2),
        calculateROI(inv.currentValue, inv.purchasePrice).toFixed(2)
      ]);

      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(field => `"${field?.toString().replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `real_estate_investments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${investments.length} investment properties exported to CSV successfully.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export investment data. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-muted rounded animate-pulse" />
            <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          </div>
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

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header - Mobile Optimized */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Investment Properties</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage your real estate investment portfolio
          </p>
        </div>
        
        {/* Mobile-First Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          {/* Primary Actions Row */}
          <div className="flex gap-2 flex-1">
            <InvestmentForm 
              onSuccess={handleSuccess}
              existingInvestment={editingInvestment}
              onClose={() => setEditingInvestment(null)}
            />
            <CSVImport onSuccess={handleSuccess} />
          </div>
          
          {/* Secondary Actions Row */}
          <div className="flex gap-2 sm:ml-auto">
            <CSVTemplate />
            <Button variant="outline" size="sm" onClick={exportInvestments} className="flex-1 sm:flex-none">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Investments Grid - Mobile Optimized */}
      {!investments || investments.length === 0 ? (
        <div className="text-center py-8 sm:py-12">
          <Home className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">No investments yet</h3>
          <p className="text-muted-foreground mb-4 sm:mb-6 text-sm sm:text-base px-4">
            Start building your real estate portfolio by adding your first investment property.
          </p>
          <InvestmentForm onSuccess={handleSuccess} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {investments.map((investment) => (
            <Card key={investment.id} className="group hover:shadow-lg transition-all duration-300 border-border/40 bg-white/95 backdrop-blur-sm hover:bg-white">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold text-foreground mb-1 line-clamp-1">
                      {investment.propertyName}
                    </CardTitle>
                    <div className="flex items-start text-xs sm:text-sm text-muted-foreground mb-2">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{investment.address}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 w-fit">
                      {investment.propertyType}
                    </Badge>
                  </div>
                  
                  {/* Mobile-Friendly Action Buttons */}
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingInvestment(investment)}
                      className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 h-8 w-8"
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive p-2 h-8 w-8"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Investment</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{investment.propertyName}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteInvestment.mutate(investment.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4 pt-0">
                {/* Financial Overview with Inflation Adjustment */}
                {(() => {
                  const realMetrics = calculateRealAppreciationMetrics(
                    investment.purchasePrice,
                    investment.currentValue,
                    investment.purchaseDate
                  );
                  
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Purchase Price
                          </div>
                          <div className="font-semibold text-foreground">
                            {formatCurrency(investment.purchasePrice)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatInflationCurrency(realMetrics.inflationAdjustedPrice)} today
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Current Value
                          </div>
                          <div className="font-semibold text-foreground">
                            {formatCurrency(investment.currentValue)}
                          </div>
                        </div>
                      </div>

                      {/* ROI, Real Appreciation and Efficiency */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t border-border/50">
                        <div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <Percent className="w-3 h-3 mr-1" />
                            Nominal ROI
                          </div>
                          <div className={`font-semibold text-sm ${realMetrics.nominalROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {realMetrics.nominalROI >= 0 ? '+' : ''}{realMetrics.nominalROI.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <Activity className="w-3 h-3 mr-1" />
                            Real ROI
                          </div>
                          <div className={`font-semibold text-sm ${realMetrics.realROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {realMetrics.realROI >= 0 ? '+' : ''}{realMetrics.realROI.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {realMetrics.realAppreciationRate.toFixed(1)}%/year
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <Calculator className="w-3 h-3 mr-1" />
                            Cap Rate
                          </div>
                          <div className={`font-semibold text-sm ${(() => {
                            const capRate = investment.currentValue > 0 ? (((investment.monthlyRent - investment.monthlyExpenses - (investment.monthlyMortgage || 0)) * 12) / investment.currentValue) * 100 : 0;
                            return capRate >= 0 ? 'text-green-600' : 'text-red-600';
                          })()}`}>
                            {(() => {
                              const capRate = investment.currentValue > 0 ? (((investment.monthlyRent - investment.monthlyExpenses - (investment.monthlyMortgage || 0)) * 12) / investment.currentValue) * 100 : 0;
                              return capRate.toFixed(1);
                            })()}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Annual Yield
                          </div>
                        </div>
                      </div>

                      {/* Cash Flow and Date */}
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-border/50">
                        <div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Monthly Cash Flow
                          </div>
                          <div className={`font-semibold ${calculateCashFlow(investment.monthlyRent, investment.monthlyExpenses, investment.monthlyMortgage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(calculateCashFlow(investment.monthlyRent, investment.monthlyExpenses, investment.monthlyMortgage || 0))}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-xs text-muted-foreground mb-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            Purchase Date
                          </div>
                          <div className="font-medium text-foreground text-xs">
                            {formatDate(investment.purchaseDate)}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </CardContent>


            </Card>
          ))}
        </div>
      )}
    </div>
  );
}