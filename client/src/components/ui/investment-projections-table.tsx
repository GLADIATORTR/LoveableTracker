import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

interface ProjectionData {
  year: number;
  marketValue: number;
  monthlyRent: number;
  netCashFlow: number;
  netEquity: number;
  capRate: number;
}

interface InvestmentProjectionsTableProps {
  investment: RealEstateInvestmentWithCategory;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Generate projection data for a property
function generateProjections(investment: RealEstateInvestmentWithCategory): ProjectionData[] {
  const years = [0, 1, 2, 3, 4, 5, 10, 15, 25, 30];
  const appreciationRate = 0.03; // 3% annual appreciation
  const rentGrowthRate = 0.025; // 2.5% annual rent growth
  
  return years.map(year => {
    const marketValue = investment.currentValue * Math.pow(1 + appreciationRate, year);
    const monthlyRent = investment.monthlyRent * Math.pow(1 + rentGrowthRate, year);
    const annualRent = monthlyRent * 12;
    const totalExpenses = investment.monthlyExpenses * 12 * Math.pow(1.02, year); // 2% expense growth
    const netCashFlow = annualRent - totalExpenses;
    const netEquity = marketValue - (investment.currentValue - investment.netEquity); // Assuming no additional principal payments
    
    return {
      year,
      marketValue,
      monthlyRent,
      netCashFlow,
      netEquity,
      capRate: (annualRent / marketValue) * 100,
    };
  });
}

export function InvestmentProjectionsTable({ investment }: InvestmentProjectionsTableProps) {
  const projections = generateProjections(investment);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{investment.propertyName}</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({investment.propertyType})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Year</TableHead>
                <TableHead className="text-right">Market Value</TableHead>
                <TableHead className="text-right">Monthly Rent</TableHead>
                <TableHead className="text-right">Net Cash Flow</TableHead>
                <TableHead className="text-right">Net Equity</TableHead>
                <TableHead className="text-right">Cap Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projections.map((projection) => (
                <TableRow key={projection.year}>
                  <TableCell className="font-medium">
                    Y{projection.year}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(projection.marketValue)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(projection.monthlyRent)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${
                    projection.netCashFlow > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projection.netCashFlow)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(projection.netEquity)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercent(projection.capRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Property Details */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Purchase Price</p>
            <p className="font-semibold">{formatCurrency(investment.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Value</p>
            <p className="font-semibold">{formatCurrency(investment.currentValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Rent</p>
            <p className="font-semibold">{formatCurrency(investment.monthlyRent)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Monthly Expenses</p>
            <p className="font-semibold">{formatCurrency(investment.monthlyExpenses)}</p>
          </div>
        </div>
        
        {/* Assumptions */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Projection Assumptions:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <span>• Property appreciation: 3% annually</span>
            <span>• Rent growth: 2.5% annually</span>
            <span>• Expense growth: 2% annually</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}