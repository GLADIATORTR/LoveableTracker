import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateFinancialProjections, type PropertyFinancials, type GlobalCountrySettings } from "@/utils/financial-calculations";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

// Using standardized projection interface from financial calculations
import type { FinancialProjection } from "@/utils/financial-calculations";

interface InvestmentProjectionsTableProps {
  investment: RealEstateInvestmentWithCategory;
  inflationAdjusted?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

// Get global settings from localStorage
function getGlobalSettings(): { selectedCountry: string; countrySettings: Record<string, GlobalCountrySettings> } {
  try {
    const saved = localStorage.getItem('global-settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to parse global settings:', error);
  }
  
  // Default settings
  return {
    selectedCountry: 'USA',
    countrySettings: {
      USA: {
        realEstateAppreciationRate: 3.5,
        inflationRate: 2.8,
        sellingCosts: 6.0,
        capitalGainsTax: 25.0,
        currentMortgageRate: 6.5,
      }
    }
  };
}

export function InvestmentProjectionsTable({ investment, inflationAdjusted = false }: InvestmentProjectionsTableProps) {
  const globalSettings = getGlobalSettings();
  const countrySettings = globalSettings.countrySettings[globalSettings.selectedCountry];
  
  // Convert investment data to PropertyFinancials format
  const propertyFinancials: PropertyFinancials = {
    marketValue: investment.currentValue,
    monthlyRent: investment.monthlyRent,
    monthlyExpenses: investment.monthlyExpenses,
    loanBalance: investment.currentValue - investment.netEquity, // Calculated loan balance
    purchasePrice: investment.currentValue, // Using current value as estimate
    downPayment: investment.netEquity,
    yearsPurchased: 0, // Assuming recent purchase
  };
  
  // Generate projections using standardized financial calculations
  const projections = generateFinancialProjections(propertyFinancials, countrySettings, undefined, inflationAdjusted);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{investment.propertyName}</span>
          <span className="text-sm font-normal text-muted-foreground">
            ({investment.propertyType})
          </span>
          {inflationAdjusted && (
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
              Inflation Adjusted
            </span>
          )}
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
                <TableHead className="text-right">Net Yield (Cash Flow)</TableHead>
                <TableHead className="text-right">Cash at Hand</TableHead>
                <TableHead className="text-right">After-Tax Net Equity</TableHead>
                <TableHead className="text-right">% Net Yield</TableHead>
                <TableHead className="text-right">Cash-on-Cash Return</TableHead>
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
                    projection.netYield > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projection.netYield)}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${
                    projection.cashAtHand > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(projection.cashAtHand)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(projection.afterTaxNetEquity)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercent(projection.netYieldPercentage)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercent(projection.cashOnCashReturn)}
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