import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/ui/stats-card";
import { ActivityItem } from "@/components/ui/activity-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Plus,
  Upload,
  FileText,
  TrendingUp
} from "lucide-react";
import type { DashboardStats } from "@shared/schema";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

export default function Dashboard() {
  const { toast } = useToast();
  
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const handleQuickAction = (action: string) => {
    toast({
      title: `${action} Action`,
      description: `${action} functionality would be implemented here.`,
    });
  };

  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load dashboard data</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's an overview of your real estate investment portfolio.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </Card>
          ))
        ) : (
          <>
            <StatsCard
              title="Total Properties"
              value={stats?.totalProperties?.toLocaleString() || "0"}
              change={{
                value: "12%",
                trend: "up",
                period: "vs last month"
              }}
              icon={Package}
              iconColor="text-primary"
            />
            <StatsCard
              title="Portfolio Value"
              value={stats?.totalPortfolioValue ? formatCurrency(stats.totalPortfolioValue) : "$0"}
              change={{
                value: "8%",
                trend: "up",
                period: "vs last month"
              }}
              icon={DollarSign}
              iconColor="text-success"
            />
            <StatsCard
              title="Net Equity"
              value={stats?.totalNetEquity ? formatCurrency(stats.totalNetEquity) : "$0"}
              change={{
                value: "15%",
                trend: "up",
                period: "vs last month"
              }}
              icon={TrendingUp}
              iconColor="text-success"
            />
            <StatsCard
              title="Monthly Cash Flow"
              value={stats?.netCashFlow ? formatCurrency(stats.netCashFlow) : "$0"}
              change={{
                value: stats?.netCashFlow && stats.netCashFlow > 0 ? "5%" : "-3%",
                trend: stats?.netCashFlow && stats.netCashFlow > 0 ? "up" : "down",
                period: "vs last month"
              }}
              icon={CheckCircle}
              iconColor={stats?.netCashFlow && stats.netCashFlow > 0 ? "text-success" : "text-destructive"}
            />
          </>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Content */}
        <div className="space-y-6">
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto text-left hover:bg-accent/50"
                onClick={() => handleQuickAction("Add Asset")}
              >
                <span className="flex items-center">
                  <Plus className="w-4 h-4 mr-3" />
                  Add Investment
                </span>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto text-left hover:bg-accent/50"
                onClick={() => handleQuickAction("Import Assets")}
              >
                <span className="flex items-center">
                  <Upload className="w-4 h-4 mr-3" />
                  Import Properties
                </span>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-between p-3 h-auto text-left hover:bg-accent/50"
                onClick={() => handleQuickAction("Generate Report")}
              >
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-3" />
                  Generate Report
                </span>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>

          {/* Investment Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Property Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Property categories will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
