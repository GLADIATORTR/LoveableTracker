import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { InvestmentForm } from "@/components/ui/investment-form";
import { CSVImport } from "@/components/ui/csv-import";
import { 
  Home, 
  DollarSign, 
  TrendingUp,
  MapPin,
  Calendar,
  Plus,
  Search,
  Filter,
  Upload
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatPercentage(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

export default function Investments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const { data: investments, isLoading, error } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments", { search: searchTerm, group: selectedGroup }],
  });

  const handleImportSuccess = () => {
    toast({
      title: "Import Complete",
      description: "Investments have been imported successfully.",
    });
  };

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load investments</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Real Estate Investments</h1>
          <p className="text-muted-foreground mt-2">
            Manage your real estate investment portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <InvestmentForm />
          <CSVImport onSuccess={handleImportSuccess} />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search investments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Investments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-4 w-20 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))
        ) : investments && investments.length > 0 ? (
          investments.map((investment) => (
            <Card key={investment.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{investment.propertyName}</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {investment.propertyType}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {investment.address}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Value</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(investment.currentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Rent</p>
                    <p className="font-semibold">
                      {formatCurrency(investment.monthlyRent)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Net Equity</p>
                    <p className="font-semibold">
                      {formatCurrency(investment.netEquity)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cap Rate</p>
                    <p className="font-semibold text-blue-600">
                      {((investment.monthlyRent * 12) / investment.currentValue * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Purchase Info */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Purchased</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(investment.purchaseDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Purchase Price</span>
                    <span>{formatCurrency(investment.purchasePrice)}</span>
                  </div>
                </div>

                {/* Cash Flow */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Cash Flow</span>
                    <span className={`font-medium ${
                      (investment.monthlyRent - investment.monthlyExpenses) > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(investment.monthlyRent - investment.monthlyExpenses)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No investments found</h3>
            <p className="text-muted-foreground mb-6">
              Start building your real estate portfolio by adding your first investment.
            </p>
            <InvestmentForm />
          </div>
        )}
      </div>
    </div>
  );
}