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
  
  // Use property-specific appreciation rate if available, otherwise use country default
  const propertyAppreciationRate = investment.appreciationRate ? (investment.appreciationRate / 100) : (countrySettings.realEstateAppreciationRate / 100);
  const inflationRate = countrySettings.inflationRate / 100;
  const rentGrowthRate = propertyAppreciationRate * 0.7; // Rent growth is typically 70% of appreciation
  const expenseGrowthRate = 0.02; // 2% annual expense growth
  
  // Current values (convert from cents to dollars)
  const currentMarketValue = investment.currentValue / 100;
  const currentMonthlyRent = investment.monthlyRent / 100;
  const currentMonthlyExpenses = investment.monthlyExpenses / 100;
  const currentOutstandingBalance = (investment.outstandingBalance || 0) / 100;
  const monthlyMortgage = (investment.monthlyMortgage || 0) / 100;
  const purchasePrice = investment.purchasePrice / 100;
  
  // Calculate projections for each year
  const yearlyData: Record<number, any> = {};
  
  years.forEach(year => {
    const inflationAdjustment = inflationAdjusted ? Math.pow(1 + inflationRate, -year) : 1;
    
    // Market value with appreciation using property-specific rate
    const marketValue = currentMarketValue * Math.pow(1 + propertyAppreciationRate, year) * inflationAdjustment;
    
    // Current term and remaining mortgage calculations
    const currentTerm = investment.currentTerm || 0;
    const originalTerm = investment.loanTerm || 360;
    const currentTermAtYear = currentTerm + (year * 12);
    const remainingMonths = Math.max(0, originalTerm - currentTermAtYear);
    
    // Interest rate from investment data - convert basis points to decimal
    const rawRate = investment.interestRate || 0;
    // For 3.75% stored as 375 basis points -> 0.0375 decimal
    const annualInterestRate = rawRate / 10000;
    const monthlyInterestRate = annualInterestRate / 12;
    
    // Outstanding balance and cumulative principal calculation using proper CUMPRINC
    let outstandingBalance = currentOutstandingBalance;
    let cumulativePrincipalPayment = 0;
    
    if (year === 0) {
      outstandingBalance = currentOutstandingBalance;
      cumulativePrincipalPayment = 0;
    } else if (monthlyMortgage > 0 && monthlyInterestRate > 0) {
      const totalPaymentsFromStart = 12 * year; // Total payments from Y0 to current year
      const remainingPaymentsAtStart = originalTerm - currentTerm; // Remaining payments at Y0
      
      if (totalPaymentsFromStart <= remainingPaymentsAtStart) {
        // Calculate CUMPRINC: cumulative principal payment for the period
        // CUMPRINC(rate, nper, pv, start_period, end_period, type)
        // where rate = monthly rate, nper = remaining term, pv = current balance
        // start_period = 1, end_period = totalPaymentsFromStart, type = 0 (end of period)
        
        // Use the exact CUMPRINC formula approach
        let cumulativePrincipal = 0;
        let remainingBalance = currentOutstandingBalance;
        
        // Calculate payment by payment for exact CUMPRINC
        for (let payment = 1; payment <= totalPaymentsFromStart; payment++) {
          const interestPayment = remainingBalance * monthlyInterestRate;
          const principalPayment = monthlyMortgage - interestPayment;
          cumulativePrincipal += principalPayment;
          remainingBalance -= principalPayment;
        }
        
        cumulativePrincipalPayment = cumulativePrincipal;
        outstandingBalance = currentOutstandingBalance - cumulativePrincipal;
        
        // Ensure outstanding balance doesn't go negative
        outstandingBalance = Math.max(0, outstandingBalance);
      } else {
        // Loan is fully paid off
        outstandingBalance = 0;
        cumulativePrincipalPayment = currentOutstandingBalance;
      }
    }
    
    // Monthly rent with growth
    const monthlyRent = currentMonthlyRent * Math.pow(1 + rentGrowthRate, year) * inflationAdjustment;
    
    // Monthly expenses with growth
    const monthlyExpenses = currentMonthlyExpenses * Math.pow(1 + expenseGrowthRate, year) * inflationAdjustment;
    
    // Net equity calculations - separate nominal and present value using property-specific rate
    const nominalMarketValue = currentMarketValue * Math.pow(1 + propertyAppreciationRate, year);
    const capitalGainsTax = (nominalMarketValue - purchasePrice) * (countrySettings.capitalGainsTax / 100);
    const sellingCosts = nominalMarketValue * (countrySettings.sellingCosts / 100);
    
    // Net Equity = Market Value - Outstanding Balance - Capital Gains Tax - Selling Costs
    const nominalNetEquity = nominalMarketValue - outstandingBalance - capitalGainsTax - sellingCosts;
    const netEquityToday = nominalNetEquity * Math.pow(1 + inflationRate, -year);
    
    // Display net equity based on inflation adjustment toggle
    const netEquity = inflationAdjusted ? netEquityToday : nominalNetEquity;
    
    // Annual and cumulative values
    const annualNetYield = (monthlyRent - monthlyExpenses) * 12; // Excluding mortgage payment
    
    // Calculate cumulative values properly
    let cumulativeNetYield = 0;
    let cumulativeMortgagePayment = 0;
    let annualMortgage = 0;
    let annualMortgagePV = 0;
    let cumulativeAnnualMortgagePV = 0;
    
    if (year > 0) {
      // Annual mortgage payment (constant dollar amount)
      annualMortgage = monthlyMortgage * 12;
      
      // Annual mortgage in present value terms for this specific year
      annualMortgagePV = annualMortgage * Math.pow(1 + inflationRate, -year);
      
      // Calculate cumulative values by summing annual amounts
      for (let y = 1; y <= year; y++) {
        const yearRent = currentMonthlyRent * Math.pow(1 + rentGrowthRate, y);
        const yearExpenses = currentMonthlyExpenses * Math.pow(1 + expenseGrowthRate, y);
        const yearMortgagePV = monthlyMortgage * 12 * Math.pow(1 + inflationRate, -y); // Present value of mortgage payment for year y
        
        // Net yield excluding mortgage (rent - expenses only) - no inflation adjustment needed as it's already in real terms
        const yearNetYield = (yearRent - yearExpenses) * 12;
        cumulativeNetYield += yearNetYield;
        
        // Cumulative mortgage payments in present value
        cumulativeAnnualMortgagePV += yearMortgagePV;
        
        // Simple cumulative mortgage (not present value)
        cumulativeMortgagePayment += monthlyMortgage * 12;
        
        // Debug for year 1 of 12 Hillcrest
        if (investment.propertyName?.includes("Hillcrest") && year === 1 && y === 1) {
          console.log(`Debug 12 Hillcrest Y${year}: annualMortgage=${annualMortgage}, annualMortgagePV=${yearMortgagePV}, cumulativeMortgagePV=${cumulativeAnnualMortgagePV}`);
        }
      }
    }
    
    yearlyData[year] = {
      marketValue,
      currentTerm: currentTermAtYear,
      remainingTerm: remainingMonths,
      interestRate: annualInterestRate * 100, // Store as percentage for display
      outstandingBalance,
      capitalGainsTax,
      sellingCosts,
      cumulativePrincipalPayment,
      netEquityNominal: nominalNetEquity, // Always nominal for comparison
      netEquityToday: netEquityToday, // Always present value using country inflation rate
      annualNetYield: annualNetYield * inflationAdjustment,
      cumulativeNetYield,
      cumulativeMortgagePayment,
      annualMortgage,
      annualMortgagePV,
      cumulativeAnnualMortgagePV,
      netGain: netEquity + cumulativeNetYield - (investment.netEquity || 0) / 100
    };
  });

  // Calculate interest rate for header display
  const rawRate = investment.interestRate || 0;
  const displayInterestRate = rawRate / 10000; // Convert basis points to decimal
  
  // Add property details header row with version number
  const propertyDetailsRow: ProjectionRow = {
    metric: `${investment.propertyName} (${investment.country || 'USA'}) | Purchase Price: ${formatCurrency(purchasePrice)} | Appreciation: ${formatPercent(propertyAppreciationRate * 100)} | Int Rate: ${formatPercent(displayInterestRate * 100)} | Inf Rate: ${formatPercent(inflationRate * 100)} | Sales Costs: ${formatPercent(countrySettings.sellingCosts)} | Cap Gains Tax: ${formatPercent(countrySettings.capitalGainsTax)} | Monthly Rent: ${formatCurrency(currentMonthlyRent)} | Monthly Exp: ${formatCurrency(currentMonthlyExpenses)} | Monthly Mortgage: ${formatCurrency(monthlyMortgage)} | v2.1`,
    y0: "", y1: "", y2: "", y3: "", y4: "", y5: "", y10: "", y15: "", y25: "", y30: ""
  };

  // Build the rows according to the screenshot format
  const rows: ProjectionRow[] = [
    propertyDetailsRow,
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
      metric: "Current Term (months since loan start)",
      y0: yearlyData[0].currentTerm.toString(),
      y1: yearlyData[1].currentTerm.toString(),
      y2: yearlyData[2].currentTerm.toString(),
      y3: yearlyData[3].currentTerm.toString(),
      y4: yearlyData[4].currentTerm.toString(),
      y5: yearlyData[5].currentTerm.toString(),
      y10: yearlyData[10].currentTerm.toString(),
      y15: yearlyData[15].currentTerm.toString(),
      y25: yearlyData[25].currentTerm.toString(),
      y30: yearlyData[30].currentTerm.toString(),
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
      metric: "Inflation Rate",
      y0: formatPercent(inflationRate * 100),
      y1: formatPercent(inflationRate * 100),
      y2: formatPercent(inflationRate * 100),
      y3: formatPercent(inflationRate * 100),
      y4: formatPercent(inflationRate * 100),
      y5: formatPercent(inflationRate * 100),
      y10: formatPercent(inflationRate * 100),
      y15: formatPercent(inflationRate * 100),
      y25: formatPercent(inflationRate * 100),
      y30: formatPercent(inflationRate * 100),
    },
    {
      metric: "Cumulative Principle PMT",
      y0: formatCurrency(0),
      y1: formatCurrency(yearlyData[1].cumulativePrincipalPayment || 0),
      y2: formatCurrency(yearlyData[2].cumulativePrincipalPayment || 0),
      y3: formatCurrency(yearlyData[3].cumulativePrincipalPayment || 0),
      y4: formatCurrency(yearlyData[4].cumulativePrincipalPayment || 0),
      y5: formatCurrency(yearlyData[5].cumulativePrincipalPayment || 0),
      y10: formatCurrency(yearlyData[10].cumulativePrincipalPayment || 0),
      y15: formatCurrency(yearlyData[15].cumulativePrincipalPayment || 0),
      y25: formatCurrency(yearlyData[25].cumulativePrincipalPayment || 0),
      y30: formatCurrency(yearlyData[30].cumulativePrincipalPayment || 0),
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
      metric: "Net Equity (Present Value - Today's Dollars)",
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
      metric: "Annual Net Yield excluding Mortgage Payment (already in Today's Dollars)",
      y0: formatCurrency(yearlyData[0].annualNetYield),
      y1: formatCurrency(yearlyData[1].annualNetYield),
      y2: formatCurrency(yearlyData[2].annualNetYield),
      y3: formatCurrency(yearlyData[3].annualNetYield),
      y4: formatCurrency(yearlyData[4].annualNetYield),
      y5: formatCurrency(yearlyData[5].annualNetYield),
      y10: formatCurrency(yearlyData[10].annualNetYield),
      y15: formatCurrency(yearlyData[15].annualNetYield),
      y25: formatCurrency(yearlyData[25].annualNetYield),
      y30: formatCurrency(yearlyData[30].annualNetYield),
    },
    {
      metric: "Cumulative Net Yield excluding Mortgage Payment (already in Today's Dollars)",
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
      metric: "Annual_Mortgage",
      y0: formatCurrency(0),
      y1: formatCurrency(yearlyData[1].annualMortgage || 0),
      y2: formatCurrency(yearlyData[2].annualMortgage || 0),
      y3: formatCurrency(yearlyData[3].annualMortgage || 0),
      y4: formatCurrency(yearlyData[4].annualMortgage || 0),
      y5: formatCurrency(yearlyData[5].annualMortgage || 0),
      y10: formatCurrency(yearlyData[10].annualMortgage || 0),
      y15: formatCurrency(yearlyData[15].annualMortgage || 0),
      y25: formatCurrency(yearlyData[25].annualMortgage || 0),
      y30: formatCurrency(yearlyData[30].annualMortgage || 0),
    },
    {
      metric: "Annual_Mortgage (PV)",
      y0: formatCurrency(0),
      y1: formatCurrency(yearlyData[1].annualMortgagePV || 0),
      y2: formatCurrency(yearlyData[2].annualMortgagePV || 0),
      y3: formatCurrency(yearlyData[3].annualMortgagePV || 0),
      y4: formatCurrency(yearlyData[4].annualMortgagePV || 0),
      y5: formatCurrency(yearlyData[5].annualMortgagePV || 0),
      y10: formatCurrency(yearlyData[10].annualMortgagePV || 0),
      y15: formatCurrency(yearlyData[15].annualMortgagePV || 0),
      y25: formatCurrency(yearlyData[25].annualMortgagePV || 0),
      y30: formatCurrency(yearlyData[30].annualMortgagePV || 0),
    },
    {
      metric: "Cumulative_Annual_Mortgage_PV",
      y0: formatCurrency(0),
      y1: formatCurrency(yearlyData[1].cumulativeAnnualMortgagePV || 0),
      y2: formatCurrency(yearlyData[2].cumulativeAnnualMortgagePV || 0),
      y3: formatCurrency(yearlyData[3].cumulativeAnnualMortgagePV || 0),
      y4: formatCurrency(yearlyData[4].cumulativeAnnualMortgagePV || 0),
      y5: formatCurrency(yearlyData[5].cumulativeAnnualMortgagePV || 0),
      y10: formatCurrency(yearlyData[10].cumulativeAnnualMortgagePV || 0),
      y15: formatCurrency(yearlyData[15].cumulativeAnnualMortgagePV || 0),
      y25: formatCurrency(yearlyData[25].cumulativeAnnualMortgagePV || 0),
      y30: formatCurrency(yearlyData[30].cumulativeAnnualMortgagePV || 0),
    },
    {
      metric: "Annual Net Yield excluding Mortgage Payment (already in Today's Dollars)",
      y0: formatCurrency(yearlyData[0].annualNetYield),
      y1: formatCurrency(yearlyData[1].annualNetYield),
      y2: formatCurrency(yearlyData[2].annualNetYield),
      y3: formatCurrency(yearlyData[3].annualNetYield),
      y4: formatCurrency(yearlyData[4].annualNetYield),
      y5: formatCurrency(yearlyData[5].annualNetYield),
      y10: formatCurrency(yearlyData[10].annualNetYield),
      y15: formatCurrency(yearlyData[15].annualNetYield),
      y25: formatCurrency(yearlyData[25].annualNetYield),
      y30: formatCurrency(yearlyData[30].annualNetYield),
    },
    {
      metric: "Cumulative Net Yield excluding Mortgage Payment (already in Today's Dollars)",
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
      metric: "Net Gain (PV)",
      y0: formatCurrency(yearlyData[0].netEquityToday),
      y1: formatCurrency(yearlyData[1].netEquityToday + yearlyData[1].cumulativeNetYield - (yearlyData[1].cumulativeAnnualMortgagePV || 0)),
      y2: formatCurrency(yearlyData[2].netEquityToday + yearlyData[2].cumulativeNetYield - (yearlyData[2].cumulativeAnnualMortgagePV || 0)),
      y3: formatCurrency(yearlyData[3].netEquityToday + yearlyData[3].cumulativeNetYield - (yearlyData[3].cumulativeAnnualMortgagePV || 0)),
      y4: formatCurrency(yearlyData[4].netEquityToday + yearlyData[4].cumulativeNetYield - (yearlyData[4].cumulativeAnnualMortgagePV || 0)),
      y5: formatCurrency(yearlyData[5].netEquityToday + yearlyData[5].cumulativeNetYield - (yearlyData[5].cumulativeAnnualMortgagePV || 0)),
      y10: formatCurrency(yearlyData[10].netEquityToday + yearlyData[10].cumulativeNetYield - (yearlyData[10].cumulativeAnnualMortgagePV || 0)),
      y15: formatCurrency(yearlyData[15].netEquityToday + yearlyData[15].cumulativeNetYield - (yearlyData[15].cumulativeAnnualMortgagePV || 0)),
      y25: formatCurrency(yearlyData[25].netEquityToday + yearlyData[25].cumulativeNetYield - (yearlyData[25].cumulativeAnnualMortgagePV || 0)),
      y30: formatCurrency(yearlyData[30].netEquityToday + yearlyData[30].cumulativeNetYield - (yearlyData[30].cumulativeAnnualMortgagePV || 0)),
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