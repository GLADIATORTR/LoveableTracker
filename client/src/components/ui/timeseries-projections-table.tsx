import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RealEstateInvestmentWithCategory } from "@shared/schema";

interface ProjectionRow {
  metric: string;
  y0: string;
  y1: string;
  y2: string;
  y3: string;
  y4: string;
  y5: string;
  y10: string;
  y15: string;
  y25: string;
  y30: string;
}

interface TimeSeriesProjectionsTableProps {
  investment: RealEstateInvestmentWithCategory;
  inflationAdjusted?: boolean;
}

// Get global settings from localStorage
function getGlobalSettings() {
  try {
    const saved = localStorage.getItem('global-settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to parse global settings:', error);
  }
  
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

function formatCurrency(amount: number): string {
  if (isNaN(amount) || !isFinite(amount)) {
    return '$NaN';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function calculateProjections(investment: RealEstateInvestmentWithCategory, inflationAdjusted: boolean): ProjectionRow[] {
  const years = [0, 1, 2, 3, 4, 5, 10, 15, 25, 30];
  const globalSettings = getGlobalSettings();
  const countrySettings = globalSettings.countrySettings[globalSettings.selectedCountry];
  
  const appreciationRate = countrySettings.realEstateAppreciationRate / 100;
  const inflationRate = countrySettings.inflationRate / 100;
  const rentGrowthRate = appreciationRate * 0.7; // Rent growth is typically 70% of appreciation
  const expenseGrowthRate = 0.02; // 2% annual expense growth
  
  // Current values (convert from cents to dollars)
  const currentMarketValue = investment.currentValue / 100;
  const currentMonthlyRent = investment.monthlyRent / 100;
  const currentMonthlyExpenses = investment.monthlyExpenses / 100;
  const currentOutstandingBalance = (investment.outstandingBalance || 0) / 100;
  const monthlyMortgage = (investment.monthlyMortgage || 0) / 100;
  
  // Calculate projections for each year
  const yearlyData: Record<number, any> = {};
  
  years.forEach(year => {
    const inflationAdjustment = inflationAdjusted ? Math.pow(1 + inflationRate, -year) : 1;
    
    // Market value with appreciation
    const marketValue = currentMarketValue * Math.pow(1 + appreciationRate, year) * inflationAdjustment;
    
    // Remaining mortgage term - assuming we know current term and original term
    const currentTerm = investment.currentTerm || 0;
    const originalTerm = investment.loanTerm || 360;
    const remainingMonths = Math.max(0, originalTerm - currentTerm - (year * 12));
    
    // Interest rate from investment data 
    // Handle both the current incorrect storage (37500 for 3.75%) and correct basis points (375 for 3.75%)
    let annualInterestRate;
    const rawRate = investment.interestRate || 0;
    if (rawRate > 1000) {
      // This is the incorrectly stored format: 37500 for 3.75%
      annualInterestRate = rawRate / 1000000; // Convert to decimal: 37500 -> 0.0375
    } else {
      // This is the correct basis points format: 375 for 3.75%
      annualInterestRate = rawRate / 10000; // Convert to decimal: 375 -> 0.0375
    }
    const monthlyInterestRate = annualInterestRate / 12;
    
    // Outstanding balance calculation 
    let outstandingBalance = currentOutstandingBalance;
    if (year > 0 && monthlyMortgage > 0 && monthlyInterestRate > 0) {
      // Approximate remaining balance after payments
      const monthsPassed = year * 12;
      const paymentsRemaining = Math.max(0, originalTerm - currentTerm - monthsPassed);
      if (paymentsRemaining > 0) {
        // Standard mortgage balance formula
        const factor = Math.pow(1 + monthlyInterestRate, paymentsRemaining);
        outstandingBalance = monthlyMortgage * ((factor - 1) / (monthlyInterestRate * factor));
      } else {
        outstandingBalance = 0;
      }
    } else if (year > 0) {
      // For properties without mortgages or with 0% interest
      outstandingBalance = 0;
    }
    
    // Monthly rent with growth
    const monthlyRent = currentMonthlyRent * Math.pow(1 + rentGrowthRate, year) * inflationAdjustment;
    
    // Monthly expenses with growth
    const monthlyExpenses = currentMonthlyExpenses * Math.pow(1 + expenseGrowthRate, year) * inflationAdjustment;
    
    // Net equity
    const netEquity = marketValue - outstandingBalance;
    
    // Cumulative values
    const cumulativeNetYield = year === 0 ? 0 : (monthlyRent - monthlyExpenses - monthlyMortgage) * 12 * year * inflationAdjustment;
    const cumulativeMortgagePayment = year === 0 ? 0 : monthlyMortgage * 12 * year * inflationAdjustment;
    
    yearlyData[year] = {
      marketValue,
      remainingTerm: remainingMonths,
      interestRate: annualInterestRate * 100, // Store as percentage for display
      outstandingBalance,
      capitalGainsTax: (marketValue - (investment.costBasis || investment.purchasePrice / 100)) * (countrySettings.capitalGainsTax / 100),
      sellingCosts: marketValue * (countrySettings.sellingCosts / 100),
      netEquityNominal: netEquity,
      netEquityToday: netEquity, // Same as nominal when inflation adjusted
      cumulativeNetYield,
      cumulativeMortgagePayment,
      netGain: netEquity + cumulativeNetYield - (investment.netEquity || 0) / 100
    };
  });

  // Build the rows according to the screenshot format
  const rows: ProjectionRow[] = [
    {
      metric: "Market Value",
      y0: formatCurrency(yearlyData[0].marketValue),
      y1: formatCurrency(yearlyData[1].marketValue),
      y2: formatCurrency(yearlyData[2].marketValue),
      y3: formatCurrency(yearlyData[3].marketValue),
      y4: formatCurrency(yearlyData[4].marketValue),
      y5: formatCurrency(yearlyData[5].marketValue),
      y10: formatCurrency(yearlyData[10].marketValue),
      y15: formatCurrency(yearlyData[15].marketValue),
      y25: formatCurrency(yearlyData[25].marketValue),
      y30: formatCurrency(yearlyData[30].marketValue),
    },
    {
      metric: "Remaining Term (based on today - loan start date if not available purchase date)",
      y0: yearlyData[0].remainingTerm.toString(),
      y1: yearlyData[1].remainingTerm.toString(),
      y2: yearlyData[2].remainingTerm.toString(),
      y3: yearlyData[3].remainingTerm.toString(),
      y4: yearlyData[4].remainingTerm.toString(),
      y5: yearlyData[5].remainingTerm.toString(),
      y10: yearlyData[10].remainingTerm.toString(),
      y15: yearlyData[15].remainingTerm.toString(),
      y25: yearlyData[25].remainingTerm.toString(),
      y30: yearlyData[30].remainingTerm.toString(),
    },
    {
      metric: "Interest Rate",
      y0: formatPercent(yearlyData[0].interestRate),
      y1: formatPercent(yearlyData[1].interestRate),
      y2: formatPercent(yearlyData[2].interestRate),
      y3: formatPercent(yearlyData[3].interestRate),
      y4: formatPercent(yearlyData[4].interestRate),
      y5: formatPercent(yearlyData[5].interestRate),
      y10: formatPercent(yearlyData[10].interestRate),
      y15: formatPercent(yearlyData[15].interestRate),
      y25: formatPercent(yearlyData[25].interestRate),
      y30: formatPercent(yearlyData[30].interestRate),
    },
    {
      metric: "Outstanding Balance",
      y0: formatCurrency(yearlyData[0].outstandingBalance),
      y1: formatCurrency(yearlyData[1].outstandingBalance),
      y2: formatCurrency(yearlyData[2].outstandingBalance),
      y3: formatCurrency(yearlyData[3].outstandingBalance),
      y4: formatCurrency(yearlyData[4].outstandingBalance),
      y5: formatCurrency(yearlyData[5].outstandingBalance),
      y10: formatCurrency(yearlyData[10].outstandingBalance),
      y15: formatCurrency(yearlyData[15].outstandingBalance),
      y25: formatCurrency(yearlyData[25].outstandingBalance),
      y30: formatCurrency(yearlyData[30].outstandingBalance),
    },
    {
      metric: "Capital Gains Tax (based on global settings per country)",
      y0: formatCurrency(yearlyData[0].capitalGainsTax),
      y1: formatCurrency(yearlyData[1].capitalGainsTax),
      y2: formatCurrency(yearlyData[2].capitalGainsTax),
      y3: formatCurrency(yearlyData[3].capitalGainsTax),
      y4: formatCurrency(yearlyData[4].capitalGainsTax),
      y5: formatCurrency(yearlyData[5].capitalGainsTax),
      y10: formatCurrency(yearlyData[10].capitalGainsTax),
      y15: formatCurrency(yearlyData[15].capitalGainsTax),
      y25: formatCurrency(yearlyData[25].capitalGainsTax),
      y30: formatCurrency(yearlyData[30].capitalGainsTax),
    },
    {
      metric: "Selling Costs (based on global settings per country)",
      y0: formatCurrency(yearlyData[0].sellingCosts),
      y1: formatCurrency(yearlyData[1].sellingCosts),
      y2: formatCurrency(yearlyData[2].sellingCosts),
      y3: formatCurrency(yearlyData[3].sellingCosts),
      y4: formatCurrency(yearlyData[4].sellingCosts),
      y5: formatCurrency(yearlyData[5].sellingCosts),
      y10: formatCurrency(yearlyData[10].sellingCosts),
      y15: formatCurrency(yearlyData[15].sellingCosts),
      y25: formatCurrency(yearlyData[25].sellingCosts),
      y30: formatCurrency(yearlyData[30].sellingCosts),
    },
    {
      metric: "Net Equity (Nominal)",
      y0: formatCurrency(yearlyData[0].netEquityNominal),
      y1: formatCurrency(yearlyData[1].netEquityNominal),
      y2: formatCurrency(yearlyData[2].netEquityNominal),
      y3: formatCurrency(yearlyData[3].netEquityNominal),
      y4: formatCurrency(yearlyData[4].netEquityNominal),
      y5: formatCurrency(yearlyData[5].netEquityNominal),
      y10: formatCurrency(yearlyData[10].netEquityNominal),
      y15: formatCurrency(yearlyData[15].netEquityNominal),
      y25: formatCurrency(yearlyData[25].netEquityNominal),
      y30: formatCurrency(yearlyData[30].netEquityNominal),
    },
    {
      metric: "Net Equity (PV Today $)",
      y0: formatCurrency(yearlyData[0].netEquityToday),
      y1: formatCurrency(yearlyData[1].netEquityToday),
      y2: formatCurrency(yearlyData[2].netEquityToday),
      y3: formatCurrency(yearlyData[3].netEquityToday),
      y4: formatCurrency(yearlyData[4].netEquityToday),
      y5: formatCurrency(yearlyData[5].netEquityToday),
      y10: formatCurrency(yearlyData[10].netEquityToday),
      y15: formatCurrency(yearlyData[15].netEquityToday),
      y25: formatCurrency(yearlyData[25].netEquityToday),
      y30: formatCurrency(yearlyData[30].netEquityToday),
    },
    {
      metric: "Cumulative Net Yield excluding Mortgage Payment",
      y0: formatCurrency(yearlyData[0].cumulativeNetYield),
      y1: formatCurrency(yearlyData[1].cumulativeNetYield),
      y2: formatCurrency(yearlyData[2].cumulativeNetYield),
      y3: formatCurrency(yearlyData[3].cumulativeNetYield),
      y4: formatCurrency(yearlyData[4].cumulativeNetYield),
      y5: formatCurrency(yearlyData[5].cumulativeNetYield),
      y10: formatCurrency(yearlyData[10].cumulativeNetYield),
      y15: formatCurrency(yearlyData[15].cumulativeNetYield),
      y25: formatCurrency(yearlyData[25].cumulativeNetYield),
      y30: formatCurrency(yearlyData[30].cumulativeNetYield),
    },
    {
      metric: "Cumulative Mortgage Payment",
      y0: formatCurrency(yearlyData[0].cumulativeMortgagePayment),
      y1: formatCurrency(yearlyData[1].cumulativeMortgagePayment),
      y2: formatCurrency(yearlyData[2].cumulativeMortgagePayment),
      y3: formatCurrency(yearlyData[3].cumulativeMortgagePayment),
      y4: formatCurrency(yearlyData[4].cumulativeMortgagePayment),
      y5: formatCurrency(yearlyData[5].cumulativeMortgagePayment),
      y10: formatCurrency(yearlyData[10].cumulativeMortgagePayment),
      y15: formatCurrency(yearlyData[15].cumulativeMortgagePayment),
      y25: formatCurrency(yearlyData[25].cumulativeMortgagePayment),
      y30: formatCurrency(yearlyData[30].cumulativeMortgagePayment),
    },
    {
      metric: "Cumul. Net Yield incl mortage - Mortgage_Todays $",
      y0: formatCurrency(yearlyData[0].cumulativeNetYield),
      y1: formatCurrency(yearlyData[1].cumulativeNetYield),
      y2: formatCurrency(yearlyData[2].cumulativeNetYield),
      y3: formatCurrency(yearlyData[3].cumulativeNetYield),
      y4: formatCurrency(yearlyData[4].cumulativeNetYield),
      y5: formatCurrency(yearlyData[5].cumulativeNetYield),
      y10: formatCurrency(yearlyData[10].cumulativeNetYield),
      y15: formatCurrency(yearlyData[15].cumulativeNetYield),
      y25: formatCurrency(yearlyData[25].cumulativeNetYield),
      y30: formatCurrency(yearlyData[30].cumulativeNetYield),
    },
    {
      metric: "Net Gain in Today $ (Net Equity + Cumulate Yield - Net Equity - Mortgage_Todays $)",
      y0: formatCurrency(0),
      y1: formatCurrency(yearlyData[1].netGain),
      y2: formatCurrency(yearlyData[2].netGain),
      y3: formatCurrency(yearlyData[3].netGain),
      y4: formatCurrency(yearlyData[4].netGain),
      y5: formatCurrency(yearlyData[5].netGain),
      y10: formatCurrency(yearlyData[10].netGain),
      y15: formatCurrency(yearlyData[15].netGain),
      y25: formatCurrency(yearlyData[25].netGain),
      y30: formatCurrency(yearlyData[30].netGain),
    },
  ];

  return rows;
}

export function TimeSeriesProjectionsTable({ investment, inflationAdjusted = false }: TimeSeriesProjectionsTableProps) {
  const projectionRows = calculateProjections(investment, inflationAdjusted);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{investment.propertyName}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {investment.address}
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
                <TableHead className="w-80 font-semibold">Property / Metric</TableHead>
                <TableHead className="text-center font-semibold">Y0</TableHead>
                <TableHead className="text-center font-semibold">Y1</TableHead>
                <TableHead className="text-center font-semibold">Y2</TableHead>
                <TableHead className="text-center font-semibold">Y3</TableHead>
                <TableHead className="text-center font-semibold">Y4</TableHead>
                <TableHead className="text-center font-semibold">Y5</TableHead>
                <TableHead className="text-center font-semibold">Y10</TableHead>
                <TableHead className="text-center font-semibold">Y15</TableHead>
                <TableHead className="text-center font-semibold">Y25</TableHead>
                <TableHead className="text-center font-semibold">Y30</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectionRows.map((row, index) => (
                <TableRow key={index} className="text-sm">
                  <TableCell className="font-medium py-2 px-3">
                    {row.metric}
                  </TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y0}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y1}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y2}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y3}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y4}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y5}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y10}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y15}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y25}</TableCell>
                  <TableCell className="text-center py-2 px-3 font-mono">{row.y30}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}