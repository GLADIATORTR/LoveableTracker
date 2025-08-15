// Shared TimeSeries calculation functions
// Extracted from timeseries-projections-table.tsx for consistency

import type { RealEstateInvestmentWithCategory } from '@shared/schema';
// Import global settings directly to avoid dependency issues
function getGlobalSettings() {
  const defaultSettings = {
    selectedCountry: 'USA',
    countrySettings: {
      'USA': {
        realEstateAppreciationRate: 3.5,
        inflationRate: 2.5,
        capitalGainsTax: 25,
        sellingCosts: 6,
        incomeTaxRate: 22
      },
      'Turkey': {
        realEstateAppreciationRate: 12,
        inflationRate: 15,
        capitalGainsTax: 20,
        sellingCosts: 5,
        incomeTaxRate: 20
      },
      'Canada': {
        realEstateAppreciationRate: 4,
        inflationRate: 2,
        capitalGainsTax: 25,
        sellingCosts: 6,
        incomeTaxRate: 26
      },
      'UK': {
        realEstateAppreciationRate: 3,
        inflationRate: 2.5,
        capitalGainsTax: 28,
        sellingCosts: 3,
        incomeTaxRate: 20
      }
    }
  };

  try {
    const stored = localStorage.getItem('globalSettings');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch (error) {
    console.error('Error loading global settings:', error);
  }
  
  return defaultSettings;
}

export interface YearlyProjectionData {
  marketValue: number;
  marketValuePV: number;
  currentTerm: number;
  remainingTerm: number;
  interestRate: number;
  outstandingBalance: number;
  capitalGainsTax: number;
  capitalGainsTaxPV: number;
  sellingCosts: number;
  cumulativePrincipalPayment: number;
  netEquityNominal: number;
  netEquityToday: number;
  annualNetYield: number;
  cumulativeNetYield: number;
  cumulativeMortgagePayment: number;
  annualMortgage: number;
  annualMortgagePV: number;
  cumulativeAnnualMortgagePV: number;
  netGain: number;
  totalTaxBenefits: number;
}

export function calculateYearlyProjectionData(
  investment: RealEstateInvestmentWithCategory,
  targetYear: number
): YearlyProjectionData {
  const globalSettings = getGlobalSettings();
  const countrySettings = globalSettings.countrySettings[globalSettings.selectedCountry];
  const inflationRate = countrySettings.inflationRate / 100;
  const propertyAppreciationRate = countrySettings.realEstateAppreciationRate / 100;

  // Current values (convert from cents to dollars)
  const purchasePrice = investment.purchasePrice / 100;
  const currentMarketValue = investment.currentValue / 100;
  const currentOutstandingBalance = (investment.outstandingBalance || 0) / 100;
  const monthlyMortgage = (investment.monthlyMortgage || 0) / 100;
  const monthlyRent = investment.monthlyRent / 100;
  const monthlyExpenses = investment.monthlyExpenses / 100;
  const currentNetEquity = (investment.netEquity || 0) / 100;

  // Interest rate conversion
  const rawRate = investment.interestRate || 0;
  const annualInterestRate = rawRate / 10000; // Convert basis points to decimal
  const monthlyInterestRate = annualInterestRate / 12;

  // Initialize yearly data storage
  const yearlyData: { [year: number]: YearlyProjectionData } = {};

  // Calculate data for each year from 0 to targetYear
  Array.from({ length: targetYear + 1 }, (_, year) => {
    // Market value calculation
    const marketValue = currentMarketValue * Math.pow(1 + propertyAppreciationRate, year);
    const marketValuePV = marketValue * Math.pow(1 + inflationRate, -year);

    // Outstanding balance calculation (amortization)
    let outstandingBalance = currentOutstandingBalance;
    let cumulativePrincipalPayment = 0;

    if (year > 0) {
      for (let payment = 1; payment <= (12 * year); payment++) {
        if (outstandingBalance <= 0) break;
        const interestPayment = outstandingBalance * monthlyInterestRate;
        const principalPayment = Math.max(0, monthlyMortgage - interestPayment);
        outstandingBalance = Math.max(0, outstandingBalance - principalPayment);
        cumulativePrincipalPayment += principalPayment;
      }
    }

    // Capital gains tax calculation
    const capitalGains = Math.max(0, marketValue - purchasePrice);
    const capitalGainsTax = capitalGains * (countrySettings.capitalGainsTax / 100);
    const capitalGainsTaxPV = capitalGainsTax * Math.pow(1 + inflationRate, -year);

    // Selling costs
    const sellingCosts = marketValue * (countrySettings.sellingCosts / 100);

    // Current term calculation (months since loan start)
    const currentTermAtYear = 125 + (year * 12); // 125 months + year progression

    // Remaining term calculation
    const totalLoanTermMonths = 360; // 30-year mortgage
    const remainingMonths = Math.max(0, totalLoanTermMonths - currentTermAtYear);

    // Net equity calculations
    const nominalNetEquity = marketValue - outstandingBalance - capitalGainsTax - sellingCosts;
    const netEquityToday = nominalNetEquity * Math.pow(1 + inflationRate, -year);

    // Annual Net Yield calculation (rent growth vs expense growth)
    const rentGrowthRate = propertyAppreciationRate * 0.7; // 70% of property appreciation
    const expenseGrowthRate = 0.02; // 2% annual expense growth
    
    const adjustedMonthlyRent = monthlyRent * Math.pow(1 + rentGrowthRate, year);
    const adjustedMonthlyExpenses = monthlyExpenses * Math.pow(1 + expenseGrowthRate, year);
    const annualNetYield = (adjustedMonthlyRent - adjustedMonthlyExpenses) * 12;

    // Cumulative net yield calculation
    let cumulativeNetYield = 0;
    for (let y = 1; y <= year; y++) {
      const yearRent = monthlyRent * Math.pow(1 + rentGrowthRate, y) * 12;
      const yearExpenses = monthlyExpenses * Math.pow(1 + expenseGrowthRate, y) * 12;
      const yearNetYield = yearRent - yearExpenses;
      const yearNetYieldPV = yearNetYield * Math.pow(1 + inflationRate, -y);
      cumulativeNetYield += yearNetYieldPV;
    }

    // Mortgage payment calculations
    const annualMortgage = year === 0 ? 0 : (outstandingBalance > 0 ? monthlyMortgage * 12 : 0);
    const annualMortgagePV = annualMortgage * Math.pow(1 + inflationRate, -year);
    
    // Cumulative annual mortgage PV with plateau logic
    let cumulativeAnnualMortgagePV = 0;
    let runningBalance = currentOutstandingBalance;
    
    for (let y = 1; y <= year; y++) {
      if (runningBalance > 0) {
        const yearlyMortgagePV = (monthlyMortgage * 12) * Math.pow(1 + inflationRate, -y);
        cumulativeAnnualMortgagePV += yearlyMortgagePV;
        
        // Update running balance
        for (let month = 1; month <= 12; month++) {
          if (runningBalance <= 0) break;
          const interest = runningBalance * monthlyInterestRate;
          const principal = monthlyMortgage - interest;
          runningBalance = Math.max(0, runningBalance - principal);
        }
      }
    }

    // Net gain calculation: netEquity + cumulativeNetYield - initialNetEquity
    const netGain = netEquityToday + cumulativeNetYield - cumulativeAnnualMortgagePV;

    // Tax benefits calculation (simplified)
    const totalTaxBenefits = 0; // Simplified for now

    yearlyData[year] = {
      marketValue,
      marketValuePV,
      currentTerm: currentTermAtYear,
      remainingTerm: remainingMonths,
      interestRate: annualInterestRate * 100,
      outstandingBalance,
      capitalGainsTax,
      capitalGainsTaxPV,
      sellingCosts,
      cumulativePrincipalPayment,
      netEquityNominal: nominalNetEquity,
      netEquityToday,
      annualNetYield,
      cumulativeNetYield,
      cumulativeMortgagePayment: cumulativePrincipalPayment,
      annualMortgage,
      annualMortgagePV,
      cumulativeAnnualMortgagePV,
      netGain,
      totalTaxBenefits
    };
  });

  return yearlyData[targetYear];
}

export function calculateNetGainPV(
  investment: RealEstateInvestmentWithCategory,
  year: number
): number {
  if (year === 0) return 0;
  
  const yearlyData = calculateYearlyProjectionData(investment, year);
  
  // Use the exact same formula as TimeSeries table
  return yearlyData.netEquityToday + yearlyData.cumulativeNetYield - yearlyData.cumulativeAnnualMortgagePV;
}