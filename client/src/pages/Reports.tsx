import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  FileText, 
  PieChart,
  DollarSign,
  Package,
  Calendar,
  Filter
} from "lucide-react";
import { useState } from "react";
import type { DashboardStats, AssetWithCategory, Category } from "@shared/schema";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(cents / 100);
}

export default function Reports() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30");
  const [reportType, setReportType] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: assets, isLoading: assetsLoading } = useQuery<AssetWithCategory[]>({
    queryKey: ["/api/assets"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const isLoading = statsLoading || assetsLoading;

  const handleExportReport = (type: string) => {
    // In a real app, this would generate and download specific report types
    const link = document.createElement('a');
    link.href = '/api/export';
    link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Report Exported",
      description: `${type} report has been downloaded successfully.`,
    });
  };

  // Calculate asset distribution by category
  const categoryDistribution = categories?.map(category => {
    const count = assets?.filter(asset => asset.categoryId === category.id).length || 0;
    const totalValue = assets
      ?.filter(asset => asset.categoryId === category.id)
      .reduce((sum, asset) => sum + (asset.currentValue || asset.purchasePrice || 0), 0) || 0;
    
    return {
      ...category,
      count,
      totalValue,
      percentage: assets ? Math.round((count / assets.length) * 100) : 0,
    };
  }) || [];

  // Calculate status distribution
  const statusDistribution = [
    { status: 'active', count: assets?.filter(a => a.status === 'active').length || 0 },
    { status: 'inactive', count: assets?.filter(a => a.status === 'inactive').length || 0 },
    { status: 'maintenance', count: assets?.filter(a => a.status === 'maintenance').length || 0 },
    { status: 'disposed', count: assets?.filter(a => a.status === 'disposed').length || 0 },
  ];

  // Calculate monthly trends (mock data for now since we don't have historical data)
  const monthlyTrends = [
    { month: 'Jan', assets: 2200, value: 650000 },
    { month: 'Feb', assets: 2350, value: 720000 },
    { month: 'Mar', assets: 2500, value: 780000 },
    { month: 'Apr', assets: 2680, value: 820000 },
    { month: 'May', assets: 2750, value: 847000 },
    { month: 'Jun', assets: 2847, value: stats?.totalValue || 847000 },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive insights and analytics for your asset portfolio.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => handleExportReport('comprehensive')}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'financial', label: 'Financial', icon: DollarSign },
              { id: 'utilization', label: 'Utilization', icon: TrendingUp },
              { id: 'maintenance', label: 'Maintenance', icon: Package },
            ].map((type) => {
              const Icon = type.icon;
              return (
                <Button
                  key={type.id}
                  variant={reportType === type.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setReportType(type.id)}
                  className="flex items-center"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {type.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
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
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats?.totalAssets.toLocaleString() || "0"}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-success mr-1" />
                    <span className="text-sm text-success font-medium">+12%</span>
                    <span className="text-sm text-muted-foreground ml-1">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Value</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats ? formatCurrency(stats.totalValue) : "$0"}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-success mr-1" />
                    <span className="text-sm text-success font-medium">+15%</span>
                    <span className="text-sm text-muted-foreground ml-1">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats ? Math.round((stats.activeItems / stats.totalAssets) * 100) : 0}%
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-success mr-1" />
                    <span className="text-sm text-success font-medium">+8%</span>
                    <span className="text-sm text-muted-foreground ml-1">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <PieChart className="w-6 h-6 text-warning" />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Asset Value</p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stats && stats.totalAssets > 0 
                      ? formatCurrency(Math.round(stats.totalValue / stats.totalAssets))
                      : "$0"
                    }
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-4 h-4 text-success mr-1" />
                    <span className="text-sm text-success font-medium">+3%</span>
                    <span className="text-sm text-muted-foreground ml-1">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Asset Distribution by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Asset Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {categoryDistribution.map((category) => (
                  <div key={category.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium">{category.name}</span>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{category.percentage}%</div>
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(category.totalValue)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asset Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Asset Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{item.status}</span>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline"
                        className={
                          item.status === 'active' ? 'text-success border-success' :
                          item.status === 'maintenance' ? 'text-warning border-warning' :
                          item.status === 'disposed' ? 'text-destructive border-destructive' :
                          'text-muted-foreground'
                        }
                      >
                        {item.count}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {assets ? Math.round((item.count / assets.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Growth Trends (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyTrends.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium w-12">{month.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Assets: {month.assets}</span>
                          <span>Value: {formatCurrency(month.value)}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(month.assets / 3000) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {index > 0 && (
                      <div className="flex items-center">
                        <TrendingUp className="w-3 h-3 text-success mr-1" />
                        <span className="text-xs text-success">
                          +{Math.round(((month.assets - monthlyTrends[index - 1].assets) / monthlyTrends[index - 1].assets) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Export Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'asset-summary', label: 'Asset Summary', description: 'Complete asset inventory report' },
              { id: 'financial', label: 'Financial Report', description: 'Asset values and depreciation' },
              { id: 'utilization', label: 'Utilization Report', description: 'Asset usage and efficiency metrics' },
              { id: 'maintenance', label: 'Maintenance Report', description: 'Maintenance schedules and history' },
            ].map((report) => (
              <div key={report.id} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <h4 className="font-medium text-foreground mb-1">{report.label}</h4>
                <p className="text-xs text-muted-foreground mb-3">{report.description}</p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleExportReport(report.id)}
                >
                  <Download className="w-3 h-3 mr-2" />
                  Export
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
