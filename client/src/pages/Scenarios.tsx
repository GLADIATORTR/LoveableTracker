import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Calculator, 
  TrendingUp, 
  Target,
  Plus,
  Search,
  Filter,
  DollarSign,
  Percent
} from "lucide-react";
import type { InvestmentScenarioWithCategory } from "@shared/schema";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function Scenarios() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { data: scenarios, isLoading, error } = useQuery<InvestmentScenarioWithCategory[]>({
    queryKey: ["/api/scenarios", { search: searchTerm, categoryId: selectedCategory }],
  });

  const handleAddScenario = () => {
    toast({
      title: "Add Scenario",
      description: "Investment scenario form functionality would be implemented here.",
    });
  };

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load investment scenarios</p>
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
          <h1 className="text-3xl font-bold text-foreground">Investment Scenarios</h1>
          <p className="text-muted-foreground mt-2">
            Model and analyze different investment opportunities
          </p>
        </div>
        <Button onClick={handleAddScenario} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Scenario
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search scenarios..."
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

      {/* Scenarios Grid */}
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
        ) : scenarios && scenarios.length > 0 ? (
          scenarios.map((scenario) => (
            <Card key={scenario.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  </div>
                  {scenario.type && (
                    <Badge variant="outline" className="text-xs">
                      {scenario.type}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {scenario.description}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Financial Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Scenario Type</p>
                    <p className="font-semibold text-blue-600">
                      {scenario.type || "General"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Usage Count</p>
                    <p className="text-sm text-muted-foreground">
                      {scenario.usageCount || 0} times
                    </p>
                  </div>
                </div>

                {/* Category */}
                {scenario.category && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category</span>
                    <Badge style={{ backgroundColor: scenario.category.color + '20', color: scenario.category.color }}>
                      {scenario.category.name}
                    </Badge>
                  </div>
                )}

                {/* Description */}
                {scenario.description && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Description</p>
                    <p className="text-sm line-clamp-3">{scenario.description}</p>
                  </div>
                )}

                {/* Created Date */}
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Created: {scenario.createdAt ? new Date(scenario.createdAt).toLocaleDateString() : "Unknown"}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No scenarios found</h3>
            <p className="text-muted-foreground mb-6">
              Create investment scenarios to model different opportunities and strategies.
            </p>
            <Button onClick={handleAddScenario} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Scenario
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}