import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calculator, 
  TrendingUp, 
  Info, 
  BarChart3,
  DollarSign,
  Clock,
  Target
} from "lucide-react";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";
import { formatCurrency } from "@/utils/inflationCalculations";
import { 
  calculatePropertyMIRRs, 
  formatMIRR, 
  type MIRRResult 
} from "@/utils/mirrCalculations";

interface PropertyMIRRData {
  property: RealEstateInvestmentWithCategory;
  purchaseToToday: MIRRResult;
  todayPlus10Years: MIRRResult;
  todayPlus20Years: MIRRResult;
  todayPlus30Years: MIRRResult;
  todayPlus40Years: MIRRResult;
}

// MIRR Info Modal Component
function MIRRInfoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="w-4 h-4 mr-2" />
          About MIRR
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Modified Internal Rate of Return (MIRR)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">What is MIRR?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Modified Internal Rate of Return (MIRR) improves on the traditional IRR by assuming 
              different rates for reinvestment of positive cash flows and financing of negative cash flows.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Key Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">Financing Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    4% APR - Cost of capital for negative cash flows (outflows)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">Reinvestment Rate</h4>
                  <p className="text-sm text-muted-foreground">
                    5% APR - Return rate for positive cash flows (inflows)
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">MIRR Calculation Formula</h3>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div className="space-y-2">
                <div>PV_neg = Σ min(CF_t, 0) / (1 + finance_rate_m)^t</div>
                <div>FV_pos = Σ max(CF_t, 0) × (1 + reinvest_rate_m)^(n-t)</div>
                <div>MIRR_monthly = (|FV_pos / PV_neg|)^(1/n) - 1</div>
                <div>MIRR_annual = (1 + MIRR_monthly)^12 - 1</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Column Definitions</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Badge variant="outline">Purchase → Today</Badge>
                <span className="text-sm">Historical MIRR from purchase date to current date</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Today → +10 Years</Badge>
                <span className="text-sm">Projected MIRR for next 10 years from today</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Today → +20 Years</Badge>
                <span className="text-sm">Projected MIRR for next 20 years from today</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Today → +30 Years</Badge>
                <span className="text-sm">Projected MIRR for next 30 years from today</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">Today → +40 Years</Badge>
                <span className="text-sm">Projected MIRR for next 40 years from today</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Assumptions</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Property appreciation: 3.5% annually</li>
              <li>• Rent growth: 3.0% annually</li>
              <li>• Current expenses and mortgage payments remain proportionally constant</li>
              <li>• Properties are sold at the end of projection period</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Detailed MIRR Calculation Modal
function MIRRDetailModal({ mirr, title, property }: { 
  mirr: MIRRResult; 
  title: string; 
  property: RealEstateInvestmentWithCategory;
}) {
  const value = mirr.mirrAnnual;
  const formattedValue = formatMIRR(value);

  if (!mirr.isValid || !isFinite(value)) {
    return null;
  }

  const financeRate = 0.04 / 12; // 4% APR monthly
  const reinvestRate = 0.05 / 12; // 5% APR monthly
  const n = mirr.cashFlows.length - 1;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-auto p-1 text-xs hover:bg-muted">
          {formattedValue}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            MIRR Calculation Details: {property.propertyName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{title}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Calculation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium">MIRR (Annual)</p>
                  <p className="text-xl font-bold text-green-600">{formattedValue}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">MIRR (Monthly)</p>
                  <p className="text-lg">{formatMIRR(mirr.mirrMonthly)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Time Period</p>
                  <p className="text-lg">{n} months</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cash Flows</p>
                  <p className="text-lg">{mirr.cashFlows.length} periods</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formula */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">MIRR Formula Applied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
                <div>1. PV_negative = Σ min(CF_t, 0) / (1 + finance_rate)^t</div>
                <div>   = {formatCurrency(mirr.pvNegative)}</div>
                <div className="mt-2">2. FV_positive = Σ max(CF_t, 0) × (1 + reinvest_rate)^(n-t)</div>
                <div>   = {formatCurrency(mirr.fvPositive)}</div>
                <div className="mt-2">3. MIRR_monthly = (|FV_pos / PV_neg|)^(1/n) - 1</div>
                <div>   = (|{formatCurrency(mirr.fvPositive)} / {formatCurrency(mirr.pvNegative)}|)^(1/{n}) - 1</div>
                <div>   = {formatMIRR(mirr.mirrMonthly)} monthly</div>
                <div className="mt-2">4. MIRR_annual = (1 + MIRR_monthly)^12 - 1</div>
                <div>   = (1 + {(mirr.mirrMonthly * 100).toFixed(4)}%)^12 - 1</div>
                <div>   = <strong>{formattedValue} annual</strong></div>
              </div>
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>Parameters used:</strong></p>
                <ul className="ml-4 space-y-1">
                  <li>• Finance rate: {(financeRate * 100).toFixed(4)}% monthly ({(financeRate * 12 * 100).toFixed(1)}% APR)</li>
                  <li>• Reinvestment rate: {(reinvestRate * 100).toFixed(4)}% monthly ({(reinvestRate * 12 * 100).toFixed(1)}% APR)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cash Flow Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Cash Flow</TableHead>
                      <TableHead className="text-right">Type</TableHead>
                      <TableHead className="text-right">PV Factor</TableHead>
                      <TableHead className="text-right">FV Factor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mirr.cashFlows.map((cf, index) => {
                      const isNegative = cf < 0;
                      const pvFactor = Math.pow(1 + financeRate, index);
                      const fvFactor = Math.pow(1 + reinvestRate, n - index);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>{index === 0 ? "Initial" : `Month ${index}`}</TableCell>
                          <TableCell className={`text-right ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(cf)}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {isNegative ? 'Outflow' : 'Inflow'}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {isNegative ? pvFactor.toFixed(4) : '-'}
                          </TableCell>
                          <TableCell className="text-right text-xs">
                            {!isNegative ? fvFactor.toFixed(4) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-red-600">Negative Cash Flows (Present Value)</p>
                    <p className="text-xs text-muted-foreground">Discounted at {(financeRate * 12 * 100).toFixed(1)}% APR</p>
                    <p className="font-bold">{formatCurrency(mirr.pvNegative)}</p>
                  </div>
                  <div>
                    <p className="font-medium text-green-600">Positive Cash Flows (Future Value)</p>
                    <p className="text-xs text-muted-foreground">Compounded at {(reinvestRate * 12 * 100).toFixed(1)}% APR</p>
                    <p className="font-bold">{formatCurrency(mirr.fvPositive)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Cell component with color coding and detailed popup
function MIRRCell({ 
  mirr, 
  title, 
  property, 
  showMonthly = false 
}: { 
  mirr: MIRRResult; 
  title: string;
  property: RealEstateInvestmentWithCategory;
  showMonthly?: boolean;
}) {
  const value = showMonthly ? mirr.mirrMonthly : mirr.mirrAnnual;
  const formattedValue = formatMIRR(value);
  
  if (!mirr.isValid || !isFinite(value)) {
    return <TableCell className="text-center text-muted-foreground">N/A</TableCell>;
  }

  // Color coding based on performance
  let colorClass = "text-muted-foreground";
  if (value > 0.15) colorClass = "text-green-600 font-semibold"; // Excellent (>15%)
  else if (value > 0.10) colorClass = "text-green-500 font-medium"; // Good (10-15%)
  else if (value > 0.05) colorClass = "text-blue-600"; // Fair (5-10%)
  else if (value > 0) colorClass = "text-yellow-600"; // Poor (0-5%)
  else colorClass = "text-red-600"; // Negative

  return (
    <TableCell className={`text-center ${colorClass}`}>
      <MIRRDetailModal mirr={mirr} title={title} property={property} />
    </TableCell>
  );
}

export default function MIRRPage() {
  const { data: investments, isLoading } = useQuery({
    queryKey: ["/api/investments"],
  });

  const mirrData = useMemo(() => {
    if (!investments || !Array.isArray(investments)) return [];
    
    return investments.map((property: RealEstateInvestmentWithCategory): PropertyMIRRData => {
      const mirrs = calculatePropertyMIRRs(property);
      return {
        property,
        ...mirrs
      };
    });
  }, [investments]);

  const summary = useMemo(() => {
    if (mirrData.length === 0) return null;
    
    const validHistorical = mirrData.filter((d: PropertyMIRRData) => d.purchaseToToday.isValid);
    const validProjections = mirrData.filter((d: PropertyMIRRData) => d.todayPlus10Years.isValid);
    
    const avgHistoricalMIRR = validHistorical.length > 0 
      ? validHistorical.reduce((sum: number, d: PropertyMIRRData) => sum + d.purchaseToToday.mirrAnnual, 0) / validHistorical.length 
      : 0;
      
    const avg10YearMIRR = validProjections.length > 0
      ? validProjections.reduce((sum: number, d: PropertyMIRRData) => sum + d.todayPlus10Years.mirrAnnual, 0) / validProjections.length
      : 0;

    return {
      totalProperties: mirrData.length,
      avgHistoricalMIRR,
      avg10YearMIRR,
      validHistorical: validHistorical.length,
      validProjections: validProjections.length
    };
  }, [mirrData]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MIRR Analysis</h1>
            <p className="text-muted-foreground">Loading property MIRR calculations...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-full"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-6 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!investments || !Array.isArray(investments) || investments.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MIRR Analysis</h1>
            <p className="text-muted-foreground">No properties found for MIRR analysis</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Add some properties to see MIRR analysis</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calculator className="w-8 h-8" />
            MIRR Analysis
          </h1>
          <p className="text-muted-foreground">
            Modified Internal Rate of Return with 5% reinvestment rate
          </p>
        </div>
        <MIRRInfoModal />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <h3 className="font-medium">Total Properties</h3>
              </div>
              <p className="text-2xl font-bold">{summary.totalProperties}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h3 className="font-medium">Avg Historical MIRR</h3>
              </div>
              <p className="text-2xl font-bold">{formatMIRR(summary.avgHistoricalMIRR)}</p>
              <p className="text-xs text-muted-foreground">
                {summary.validHistorical} of {summary.totalProperties} properties
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium">Avg 10-Year MIRR</h3>
              </div>
              <p className="text-2xl font-bold">{formatMIRR(summary.avg10YearMIRR)}</p>
              <p className="text-xs text-muted-foreground">
                {summary.validProjections} of {summary.totalProperties} valid
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-600" />
                <h3 className="font-medium">Reinvestment Rate</h3>
              </div>
              <p className="text-2xl font-bold">5.0%</p>
              <p className="text-xs text-muted-foreground">Annual assumption</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MIRR Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Property MIRR Comparison
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            All MIRR values are annualized. <strong>Click any MIRR value to see detailed calculations.</strong> Colors: 
            <span className="text-green-600 font-semibold ml-1">Excellent (&gt;15%)</span>,
            <span className="text-green-500 font-medium ml-1">Good (10-15%)</span>,
            <span className="text-blue-600 ml-1">Fair (5-10%)</span>,
            <span className="text-yellow-600 ml-1">Poor (0-5%)</span>,
            <span className="text-red-600 ml-1">Negative (&lt;0%)</span>
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Property</TableHead>
                  <TableHead className="text-center">Purchase → Today</TableHead>
                  <TableHead className="text-center">Today → +10 Years</TableHead>
                  <TableHead className="text-center">Today → +20 Years</TableHead>
                  <TableHead className="text-center">Today → +30 Years</TableHead>
                  <TableHead className="text-center">Today → +40 Years</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mirrData.map((data: PropertyMIRRData) => (
                  <TableRow key={data.property.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{data.property.propertyName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(data.property.currentValue || 0)}
                        </div>
                        {data.property.monthlyRent && (
                          <div className="text-xs text-blue-600">
                            {formatCurrency(data.property.monthlyRent)}/mo rent
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <MIRRCell mirr={data.purchaseToToday} title="Purchase → Today" property={data.property} />
                    <MIRRCell mirr={data.todayPlus10Years} title="Today → +10 Years" property={data.property} />
                    <MIRRCell mirr={data.todayPlus20Years} title="Today → +20 Years" property={data.property} />
                    <MIRRCell mirr={data.todayPlus30Years} title="Today → +30 Years" property={data.property} />
                    <MIRRCell mirr={data.todayPlus40Years} title="Today → +40 Years" property={data.property} />
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Note:</strong> MIRR calculations assume:</p>
            <ul className="ml-4 space-y-1">
              <li>• Financing rate: 4% APR for negative cash flows</li>
              <li>• Reinvestment rate: 5% APR for positive cash flows</li>
              <li>• Future projections include 3.5% annual property appreciation and 3% rent growth</li>
              <li>• Properties are assumed to be sold at the end of each projection period</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}