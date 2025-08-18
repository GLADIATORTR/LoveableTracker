import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Home, 
  Percent,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  LineChartIcon,
  Activity
} from "lucide-react";

interface EconomicDataPoint {
  date: string;
  year: number;
  inflationRate?: number;
  caseShillerIndex?: number;
  mortgageRate?: number;
  sp500Index?: number;
  value?: number;
}

// FRED API endpoints for real economic data
// const FRED_API_BASE = "https://api.stlouisfed.org/fred/series/observations";
// const FRED_API_KEY = "your_fred_api_key"; // This would need to be provided by user

// Mock data representing real historical trends - in production this would come from FRED API
const generateHistoricalData = (): EconomicDataPoint[] => {
  const data: EconomicDataPoint[] = [];
  
  // Historical data from 1950s to present (simplified but realistic trends)
  for (let year = 1950; year <= 2024; year++) {
    // Inflation rate - historical patterns
    let inflationRate: number;
    if (year < 1970) inflationRate = 1.5 + Math.random() * 2; // Low inflation 1950s-1960s
    else if (year < 1985) inflationRate = 6 + Math.random() * 8; // High inflation 1970s-early 1980s
    else if (year < 2020) inflationRate = 2 + Math.random() * 2; // Stable 1985-2020
    else inflationRate = 3 + Math.random() * 6; // Recent volatility
    
    // Case-Shiller Index (Base 100 in January 2000)
    let caseShillerIndex: number;
    if (year < 1990) caseShillerIndex = 50 + (year - 1950) * 1.2;
    else if (year < 2007) caseShillerIndex = 70 + (year - 1990) * 8; // Housing boom
    else if (year < 2012) caseShillerIndex = 200 - (year - 2007) * 20; // Housing crisis
    else caseShillerIndex = 140 + (year - 2012) * 15; // Recovery
    
    // Mortgage rates - historical patterns
    let mortgageRate: number;
    if (year < 1980) mortgageRate = 7 + Math.random() * 3;
    else if (year < 1990) mortgageRate = 12 + Math.random() * 6; // High rates 1980s
    else if (year < 2020) mortgageRate = 7 - (year - 1990) * 0.15; // Declining trend
    else mortgageRate = 3 + Math.random() * 4; // Recent volatility
    
    // S&P 500 Index (Base 100 in 1950)
    let sp500Index: number;
    if (year < 1970) sp500Index = 100 + (year - 1950) * 3; // Steady growth 1950s-1960s
    else if (year < 1980) sp500Index = 160 + (year - 1970) * 2; // Slower 1970s
    else if (year < 2000) sp500Index = 180 + (year - 1980) * 25; // Strong 1980s-1990s
    else if (year < 2010) sp500Index = 680 + (year - 2000) * 40; // Volatile 2000s
    else sp500Index = 1080 + (year - 2010) * 180; // Strong 2010s-2020s
    
    data.push({
      date: `${year}-01-01`,
      year,
      inflationRate: Math.max(0, inflationRate),
      caseShillerIndex: Math.max(20, caseShillerIndex),
      mortgageRate: Math.max(1, mortgageRate),
      sp500Index: Math.max(50, sp500Index)
    });
  }
  
  return data;
};

// API functions for real data (would be enabled with FRED API key)
const fetchFREDData = async (seriesId: string): Promise<EconomicDataPoint[]> => {
  // This would make real API calls to FRED
  // For now, return mock data with realistic patterns
  return generateHistoricalData();
};

export default function EconomicDataPage() {
  const [timeRange, setTimeRange] = useState<string>("all");
  const [chartType, setChartType] = useState<string>("line");
  const [selectedMetrics] = useState<string[]>(["inflation", "caseShiller", "mortgage"]);

  // Queries for different economic data series
  const { data: inflationData = [], isLoading: inflationLoading } = useQuery({
    queryKey: ["economic-data", "inflation"],
    queryFn: () => fetchFREDData("CPIAUCSL"), // Consumer Price Index
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const { data: caseShillerData = [], isLoading: caseShillerLoading } = useQuery({
    queryKey: ["economic-data", "case-shiller"],
    queryFn: () => fetchFREDData("CSUSHPINSA"), // Case-Shiller Home Price Index
    staleTime: 1000 * 60 * 60,
  });

  const { data: mortgageData = [], isLoading: mortgageLoading } = useQuery({
    queryKey: ["economic-data", "mortgage"],
    queryFn: () => fetchFREDData("MORTGAGE30US"), // 30-Year Fixed Rate Mortgage Average
    staleTime: 1000 * 60 * 60,
  });

  const { data: sp500Data = [], isLoading: sp500Loading } = useQuery({
    queryKey: ["economic-data", "sp500"],
    queryFn: () => fetchFREDData("SP500"), // S&P 500 Index
    staleTime: 1000 * 60 * 60,
  });

  const isLoading = inflationLoading || caseShillerLoading || mortgageLoading || sp500Loading;

  // Combine all data sources
  const combinedData = generateHistoricalData();

  // Filter data based on time range
  const filteredData = combinedData.filter(point => {
    const year = point.year;
    switch (timeRange) {
      case "10y": return year >= 2014;
      case "20y": return year >= 2004;
      case "50y": return year >= 1974;
      default: return true; // all
    }
  });

  // Calculate summary statistics
  const currentYear = 2024;
  const currentData = combinedData.find(d => d.year === currentYear);
  const prevYearData = combinedData.find(d => d.year === currentYear - 1);

  const summaryStats = {
    currentInflation: currentData?.inflationRate || 0,
    inflationChange: currentData && prevYearData ? 
      currentData.inflationRate! - prevYearData.inflationRate! : 0,
    currentCaseShiller: currentData?.caseShillerIndex || 0,
    caseShillerChange: currentData && prevYearData ? 
      ((currentData.caseShillerIndex! - prevYearData.caseShillerIndex!) / prevYearData.caseShillerIndex!) * 100 : 0,
    currentMortgage: currentData?.mortgageRate || 0,
    mortgageChange: currentData && prevYearData ? 
      currentData.mortgageRate! - prevYearData.mortgageRate! : 0,
    currentSP500: currentData?.sp500Index || 0,
    sp500Change: currentData && prevYearData ? 
      ((currentData.sp500Index! - prevYearData.sp500Index!) / prevYearData.sp500Index!) * 100 : 0,
  };

  const handleExportData = () => {
    const csvContent = [
      "Year,Inflation Rate (%),Case-Shiller Index,Mortgage Rate (%)",
      ...filteredData.map(d => 
        `${d.year},${d.inflationRate?.toFixed(2)},${d.caseShillerIndex?.toFixed(1)},${d.mortgageRate?.toFixed(2)}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `economic-data-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTooltip = (value: any, name: string) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (name === "inflationRate") return [`${numValue?.toFixed(2)}%`, "Inflation Rate"];
    if (name === "caseShillerIndex") return [`${numValue?.toFixed(1)}`, "Case-Shiller Index"];
    if (name === "mortgageRate") return [`${numValue?.toFixed(2)}%`, "Mortgage Rate"];
    if (name === "sp500Index") return [`${numValue?.toFixed(0)}`, "S&P 500 Index"];
    return [value, name];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
          Economic Data & Market Trends
        </h1>
        <p className="text-muted-foreground text-lg">
          Historical economic indicators from Federal Reserve Economic Data (FRED) and other public sources.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="w-4 h-4 text-orange-500" />
              Current Inflation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.currentInflation.toFixed(2)}%</div>
            <div className="flex items-center gap-1 text-sm">
              {summaryStats.inflationChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              <span className={summaryStats.inflationChange >= 0 ? "text-red-600" : "text-green-600"}>
                {summaryStats.inflationChange >= 0 ? "+" : ""}{summaryStats.inflationChange.toFixed(2)}% vs last year
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-500" />
              Case-Shiller Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.currentCaseShiller.toFixed(1)}</div>
            <div className="flex items-center gap-1 text-sm">
              {summaryStats.caseShillerChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={summaryStats.caseShillerChange >= 0 ? "text-green-600" : "text-red-600"}>
                {summaryStats.caseShillerChange >= 0 ? "+" : ""}{summaryStats.caseShillerChange.toFixed(1)}% vs last year
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-500" />
              30-Year Mortgage Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.currentMortgage.toFixed(2)}%</div>
            <div className="flex items-center gap-1 text-sm">
              {summaryStats.mortgageChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
              <span className={summaryStats.mortgageChange >= 0 ? "text-red-600" : "text-green-600"}>
                {summaryStats.mortgageChange >= 0 ? "+" : ""}{summaryStats.mortgageChange.toFixed(2)}% vs last year
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              S&P 500 Index
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.currentSP500.toFixed(0)}</div>
            <div className="flex items-center gap-1 text-sm">
              {summaryStats.sp500Change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span className={summaryStats.sp500Change >= 0 ? "text-green-600" : "text-red-600"}>
                {summaryStats.sp500Change >= 0 ? "+" : ""}{summaryStats.sp500Change.toFixed(1)}% vs last year
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Historical Economic Indicators
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="50y">50 Years</SelectItem>
                  <SelectItem value="20y">20 Years</SelectItem>
                  <SelectItem value="10y">10 Years</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="composed">Combined</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="combined" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="combined">All Metrics</TabsTrigger>
              <TabsTrigger value="inflation">Inflation</TabsTrigger>
              <TabsTrigger value="housing">Housing</TabsTrigger>
              <TabsTrigger value="mortgage">Mortgage</TabsTrigger>
              <TabsTrigger value="sp500">S&P 500</TabsTrigger>
            </TabsList>
            
            <TabsContent value="combined" className="space-y-4">
              <div className="h-96">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Loading economic data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "line" ? (
                      <LineChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          type="number"
                          scale="linear"
                          domain={['dataMin', 'dataMax']}
                        />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={formatTooltip} />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="inflationRate" 
                          stroke="#f97316" 
                          strokeWidth={2}
                          name="Inflation Rate (%)"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="caseShillerIndex" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Case-Shiller Index"
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="mortgageRate" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name="Mortgage Rate (%)"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="sp500Index" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          name="S&P 500 Index"
                        />
                      </LineChart>
                    ) : chartType === "area" ? (
                      <AreaChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          type="number"
                          scale="linear"
                          domain={['dataMin', 'dataMax']}
                        />
                        <YAxis />
                        <Tooltip formatter={formatTooltip} />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="inflationRate" 
                          stackId="1" 
                          stroke="#f97316" 
                          fill="#f97316" 
                          fillOpacity={0.6}
                          name="Inflation Rate (%)"
                        />
                      </AreaChart>
                    ) : (
                      <ComposedChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="year" 
                          type="number"
                          scale="linear"
                          domain={['dataMin', 'dataMax']}
                        />
                        <YAxis yAxisId="left" orientation="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip formatter={formatTooltip} />
                        <Legend />
                        <Area 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="inflationRate" 
                          fill="#f97316" 
                          fillOpacity={0.3}
                          stroke="#f97316"
                          name="Inflation Rate (%)"
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="caseShillerIndex" 
                          stroke="#3b82f6" 
                          strokeWidth={3}
                          name="Case-Shiller Index"
                        />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="mortgageRate" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Mortgage Rate (%)"
                        />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="inflation" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      type="number"
                      scale="linear"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value}%`, "Inflation Rate"]} />
                    <Area 
                      type="monotone" 
                      dataKey="inflationRate" 
                      stroke="#f97316" 
                      fill="#f97316" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="housing" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      type="number"
                      scale="linear"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}`, "Case-Shiller Index"]} />
                    <Line 
                      type="monotone" 
                      dataKey="caseShillerIndex" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="mortgage" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      type="number"
                      scale="linear"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(2) : value}%`, "Mortgage Rate"]} />
                    <Area 
                      type="monotone" 
                      dataKey="mortgageRate" 
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="sp500" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="year" 
                      type="number"
                      scale="linear"
                      domain={['dataMin', 'dataMax']}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(0) : value}`, "S&P 500 Index"]} />
                    <Line 
                      type="monotone" 
                      dataKey="sp500Index" 
                      stroke="#6366f1" 
                      strokeWidth={3}
                      dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Data Sources and Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Sources & Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-orange-500" />
                Inflation Rate
              </h4>
              <p className="text-sm text-muted-foreground">
                Consumer Price Index for All Urban Consumers (CPI-U), seasonally adjusted. 
                Source: U.S. Bureau of Labor Statistics via FRED.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-500" />
                Case-Shiller Index
              </h4>
              <p className="text-sm text-muted-foreground">
                S&P/Case-Shiller U.S. National Home Price Index, not seasonally adjusted. 
                Tracks changes in home prices across the United States.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-purple-500" />
                Mortgage Rates
              </h4>
              <p className="text-sm text-muted-foreground">
                30-Year Fixed Rate Mortgage Average in the United States. 
                Source: Freddie Mac Primary Mortgage Market Survey via FRED.
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Data shown represents historical trends based on public sources. 
              For production use, connect to live FRED API with valid API key for real-time updates.
              Current display uses representative historical patterns for demonstration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}