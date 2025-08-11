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
  Download
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

function calculateCashFlow(monthlyRent: number, monthlyExpenses: number): number {
  return monthlyRent - monthlyExpenses;
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
    mutationFn: async (id: number) => {
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
    deleteInvestment.mutate(Number(investment.id));
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
      'Interest Rate',
      'Loan Term',
      'Outstanding Balance',
      'Monthly Mortgage',
      'Net Cash Flow',
      'Net Equity',
      'ROI %'
    ];

    const csvData = investments.map(inv => [
      inv.propertyName,
      inv.address,
      inv.propertyType,
      inv.country || 'USA',
      (inv.purchasePrice / 100).toString(),
      (inv.currentValue / 100).toString(),
      (inv.monthlyRent / 100).toString(),
      (inv.monthlyExpenses / 100).toString(),
      formatDate(inv.purchaseDate),
      ((inv.downPayment || 0) / 100).toString(),
      ((inv.loanAmount || 0) / 100).toString(),
      ((inv.interestRate || 0) / 100).toFixed(2),
      Math.round((inv.loanTerm || 0) / 12).toString(),
      ((inv.outstandingBalance || 0) / 100).toString(),
      ((inv.monthlyMortgage || 0) / 100).toString(),
      (calculateCashFlow(inv.monthlyRent, inv.monthlyExpenses) / 100).toString(),
      ((inv.netEquity || 0) / 100).toString(),
      calculateROI(inv.currentValue, inv.purchasePrice).toFixed(2)
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investments_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Investment data has been exported to CSV.",
    });
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
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Investment Properties</h1>
          <p className="text-muted-foreground mt-2">
            Manage your real estate investment portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <CSVTemplate />
          <Button variant="outline" size="sm" onClick={exportInvestments}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <InvestmentForm 
            onSuccess={handleSuccess}
            existingInvestment={editingInvestment}
            onClose={() => setEditingInvestment(null)}
          />
          <CSVImport onSuccess={handleSuccess} />
        </div>
      </div>

      {/* Investments Grid */}
      {!investments || investments.length === 0 ? (
        <div className="text-center py-12">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No investments yet</h3>
          <p className="text-muted-foreground mb-6">
            Start building your real estate portfolio by adding your first investment property.
          </p>
          <InvestmentForm onSuccess={handleSuccess} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {investments.map((investment) => (
            <Card key={investment.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-foreground mb-1">
                      {investment.propertyName}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{investment.address}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {investment.propertyType}
                    </Badge>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingInvestment(investment)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
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
                            onClick={() => handleDelete(investment)}
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
              
              <CardContent className="space-y-4">
                {/* Financial Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Purchase Price
                    </div>
                    <div className="font-semibold text-foreground">
                      {formatCurrency(investment.purchasePrice)}
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

                {/* Loan Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Down Payment</div>
                    <div className="font-medium text-foreground">
                      {formatCurrency(investment.downPayment || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Loan Amount</div>
                    <div className="font-medium text-foreground">
                      {formatCurrency(investment.loanAmount || 0)}
                    </div>
                  </div>
                </div>

                {/* Interest & Terms */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Interest Rate</div>
                    <div className="font-medium text-foreground">
                      {((investment.interestRate || 0) / 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Loan Term</div>
                    <div className="font-medium text-foreground">
                      {Math.round((investment.loanTerm || 0) / 12)} years
                    </div>
                  </div>
                </div>

                {/* Outstanding Balance & Monthly Mortgage */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Outstanding Balance</div>
                    <div className="font-medium text-orange-600">
                      {formatCurrency(investment.outstandingBalance || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Monthly Mortgage</div>
                    <div className="font-medium text-destructive">
                      {formatCurrency(investment.monthlyMortgage || 0)}
                    </div>
                  </div>
                </div>

                {/* Cash Flow */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Monthly Rent</div>
                    <div className="font-medium text-success">
                      +{formatCurrency(investment.monthlyRent)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Monthly Expenses</div>
                    <div className="font-medium text-destructive">
                      -{formatCurrency(investment.monthlyExpenses)}
                    </div>
                  </div>
                </div>

                {/* Net Cash Flow */}
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Net Cash Flow</span>
                    <span className={`font-semibold ${
                      calculateCashFlow(investment.monthlyRent, investment.monthlyExpenses) >= 0 
                        ? 'text-success' 
                        : 'text-destructive'
                    }`}>
                      {formatCurrency(calculateCashFlow(investment.monthlyRent, investment.monthlyExpenses))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium text-muted-foreground">Net Equity</span>
                    <span className="font-semibold text-blue-600">
                      {formatCurrency(investment.netEquity || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm font-medium text-muted-foreground">ROI</span>
                    <span className={`font-semibold ${
                      calculateROI(investment.currentValue, investment.purchasePrice) >= 0 
                        ? 'text-success' 
                        : 'text-destructive'
                    }`}>
                      {calculateROI(investment.currentValue, investment.purchasePrice).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Purchase Date & Country */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Purchased {formatDate(investment.purchaseDate)}
                    </div>
                    {investment.country && (
                      <div className="text-xs text-muted-foreground">
                        {investment.country}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}