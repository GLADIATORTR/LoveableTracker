import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InvestmentProjectionsTable } from "@/components/ui/investment-projections-table";
import { GlobalSettings } from "@/components/ui/global-settings";
import { 
  Download,
  Home,
  TrendingUp
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

export default function Reports() {
  const { toast } = useToast();
  const [inflationAdjusted, setInflationAdjusted] = useState(false);

  const { data: investments, isLoading } = useQuery<RealEstateInvestmentWithCategory[]>({
    queryKey: ["/api/investments"],
  });

  const handleExportReport = () => {
    toast({
      title: "Report Exported",
      description: "Investment projections report has been exported.",
    });
  };

  if (!investments || investments.length === 0) {
    return (
      <div className="animate-fade-in space-y-8">
        <div className="text-center py-12">
          <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No investments to analyze</h3>
          <p className="text-muted-foreground">Add some investments to view performance projections.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">TimeSeries Projections</h1>
          <p className="text-muted-foreground mt-2">
            Long-term financial projections with inflation-adjusted values for your real estate investments.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="inflation-adjusted"
              checked={inflationAdjusted}
              onCheckedChange={setInflationAdjusted}
            />
            <Label htmlFor="inflation-adjusted" className="text-sm font-medium">
              Convert to Today's Dollars
            </Label>
          </div>
          <GlobalSettings />
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Investment Projections */}
      <div className="space-y-6">
        {investments.map((investment) => (
          <InvestmentProjectionsTable 
            key={investment.id} 
            investment={investment} 
            inflationAdjusted={inflationAdjusted}
          />
        ))}
      </div>
    </div>
  );
}