// Inflation calculation utilities for real estate investment analysis

interface InflationDataPoint {
  year: number;
  inflationRate: number;
}

// Historical inflation data (simplified - in production would come from FRED API)
const HISTORICAL_INFLATION_DATA: InflationDataPoint[] = [
  { year: 1950, inflationRate: 1.3 },
  { year: 1951, inflationRate: 7.9 },
  { year: 1952, inflationRate: 1.9 },
  { year: 1953, inflationRate: 0.8 },
  { year: 1954, inflationRate: 0.7 },
  { year: 1955, inflationRate: -0.4 },
  { year: 1956, inflationRate: 1.5 },
  { year: 1957, inflationRate: 3.3 },
  { year: 1958, inflationRate: 2.8 },
  { year: 1959, inflationRate: 0.7 },
  { year: 1960, inflationRate: 1.7 },
  { year: 1961, inflationRate: 1.0 },
  { year: 1962, inflationRate: 1.0 },
  { year: 1963, inflationRate: 1.3 },
  { year: 1964, inflationRate: 1.3 },
  { year: 1965, inflationRate: 1.6 },
  { year: 1966, inflationRate: 2.9 },
  { year: 1967, inflationRate: 3.1 },
  { year: 1968, inflationRate: 4.2 },
  { year: 1969, inflationRate: 5.5 },
  { year: 1970, inflationRate: 5.7 },
  { year: 1971, inflationRate: 4.4 },
  { year: 1972, inflationRate: 3.2 },
  { year: 1973, inflationRate: 6.2 },
  { year: 1974, inflationRate: 11.0 },
  { year: 1975, inflationRate: 9.2 },
  { year: 1976, inflationRate: 5.8 },
  { year: 1977, inflationRate: 6.5 },
  { year: 1978, inflationRate: 7.6 },
  { year: 1979, inflationRate: 11.3 },
  { year: 1980, inflationRate: 13.5 },
  { year: 1981, inflationRate: 10.3 },
  { year: 1982, inflationRate: 6.2 },
  { year: 1983, inflationRate: 3.2 },
  { year: 1984, inflationRate: 4.3 },
  { year: 1985, inflationRate: 3.6 },
  { year: 1986, inflationRate: 1.9 },
  { year: 1987, inflationRate: 3.6 },
  { year: 1988, inflationRate: 4.1 },
  { year: 1989, inflationRate: 4.8 },
  { year: 1990, inflationRate: 5.4 },
  { year: 1991, inflationRate: 4.2 },
  { year: 1992, inflationRate: 3.0 },
  { year: 1993, inflationRate: 3.0 },
  { year: 1994, inflationRate: 2.6 },
  { year: 1995, inflationRate: 2.8 },
  { year: 1996, inflationRate: 3.0 },
  { year: 1997, inflationRate: 2.3 },
  { year: 1998, inflationRate: 1.6 },
  { year: 1999, inflationRate: 2.2 },
  { year: 2000, inflationRate: 3.4 },
  { year: 2001, inflationRate: 2.8 },
  { year: 2002, inflationRate: 1.6 },
  { year: 2003, inflationRate: 2.3 },
  { year: 2004, inflationRate: 2.7 },
  { year: 2005, inflationRate: 3.4 },
  { year: 2006, inflationRate: 3.2 },
  { year: 2007, inflationRate: 2.8 },
  { year: 2008, inflationRate: 3.8 },
  { year: 2009, inflationRate: -0.4 },
  { year: 2010, inflationRate: 1.6 },
  { year: 2011, inflationRate: 3.1 },
  { year: 2012, inflationRate: 2.1 },
  { year: 2013, inflationRate: 1.5 },
  { year: 2014, inflationRate: 0.1 },
  { year: 2015, inflationRate: 0.1 },
  { year: 2016, inflationRate: 1.3 },
  { year: 2017, inflationRate: 2.1 },
  { year: 2018, inflationRate: 2.4 },
  { year: 2019, inflationRate: 1.8 },
  { year: 2020, inflationRate: 1.2 },
  { year: 2021, inflationRate: 4.7 },
  { year: 2022, inflationRate: 8.0 },
  { year: 2023, inflationRate: 4.1 },
  { year: 2024, inflationRate: 3.2 },
];

/**
 * Calculate cumulative inflation factor from purchase year to current year
 * @param purchaseYear - Year the property was purchased
 * @param currentYear - Current year (default: 2024)
 * @returns Cumulative inflation factor (e.g., 1.5 means 50% cumulative inflation)
 */
export function calculateCumulativeInflation(purchaseYear: number, currentYear: number = 2024): number {
  if (purchaseYear >= currentYear) return 1.0;
  
  let cumulativeFactor = 1.0;
  
  for (let year = purchaseYear + 1; year <= currentYear; year++) {
    const inflationData = HISTORICAL_INFLATION_DATA.find(d => d.year === year);
    const inflationRate = inflationData ? inflationData.inflationRate : 2.5; // Default to 2.5% if data missing
    cumulativeFactor *= (1 + inflationRate / 100);
  }
  
  return cumulativeFactor;
}

/**
 * Calculate inflation-adjusted purchase price (present value)
 * @param originalPurchasePrice - Original purchase price in cents
 * @param purchaseDate - Purchase date string (YYYY-MM-DD format)
 * @param currentYear - Current year (default: 2024)
 * @returns Inflation-adjusted purchase price in cents
 */
export function calculateInflationAdjustedPrice(
  originalPurchasePrice: number, 
  purchaseDate: string, 
  currentYear: number = 2024
): number {
  const purchaseYear = new Date(purchaseDate).getFullYear();
  const inflationFactor = calculateCumulativeInflation(purchaseYear, currentYear);
  return Math.round(originalPurchasePrice * inflationFactor);
}

/**
 * Calculate real appreciation rate (nominal appreciation minus inflation)
 * @param originalPrice - Original purchase price in cents
 * @param currentValue - Current market value in cents
 * @param purchaseDate - Purchase date string
 * @param currentYear - Current year (default: 2024)
 * @returns Object with nominal ROI, inflation factor, and real appreciation rate
 */
export function calculateRealAppreciationMetrics(
  originalPrice: number,
  currentValue: number,
  purchaseDate: string,
  currentYear: number = 2024
) {
  const purchaseYear = new Date(purchaseDate).getFullYear();
  const yearsHeld = currentYear - purchaseYear;
  
  if (yearsHeld <= 0 || originalPrice <= 0) {
    return {
      nominalROI: 0,
      inflationAdjustedPrice: originalPrice,
      realROI: 0,
      realAppreciationRate: 0,
      inflationFactor: 1,
      totalInflation: 0
    };
  }
  
  // Calculate nominal ROI (appreciation only)
  const nominalROI = ((currentValue - originalPrice) / originalPrice) * 100;
  
  // Calculate inflation adjustment
  const inflationFactor = calculateCumulativeInflation(purchaseYear, currentYear);
  const inflationAdjustedPrice = originalPrice * inflationFactor;
  const totalInflation = (inflationFactor - 1) * 100;
  
  // Calculate real appreciation (inflation-adjusted appreciation only)
  const realAppreciationTotal = ((currentValue - inflationAdjustedPrice) / inflationAdjustedPrice) * 100;
  
  // Calculate annualized real appreciation rate
  const realAppreciationRate = yearsHeld > 0 ? 
    (Math.pow(currentValue / inflationAdjustedPrice, 1 / yearsHeld) - 1) * 100 : 0;
  
  return {
    nominalROI: Math.round(nominalROI * 100) / 100,
    inflationAdjustedPrice: Math.round(inflationAdjustedPrice),
    realROI: Math.round(realAppreciationTotal * 100) / 100, // This is actually just appreciation, will be replaced by true ROI
    realAppreciationRate: Math.round(realAppreciationRate * 100) / 100,
    inflationFactor: Math.round(inflationFactor * 1000) / 1000,
    totalInflation: Math.round(totalInflation * 100) / 100
  };
}

/**
 * Calculate true Real ROI including both appreciation and cash flow
 * @param originalPrice - Original purchase price in cents
 * @param currentValue - Current market value in cents
 * @param monthlyRent - Monthly rental income in cents
 * @param monthlyExpenses - Monthly expenses in cents
 * @param monthlyMortgage - Monthly mortgage payment in cents
 * @param purchaseDate - Purchase date string
 * @param currentYear - Current year (default: 2024)
 * @returns Object with comprehensive ROI metrics including cash flow
 */
export function calculateTrueROI(
  originalPrice: number,
  currentValue: number,
  monthlyRent: number,
  monthlyExpenses: number,
  monthlyMortgage: number,
  purchaseDate: string,
  currentYear: number = 2024
) {
  const purchaseYear = new Date(purchaseDate).getFullYear();
  const yearsHeld = currentYear - purchaseYear;
  
  if (yearsHeld <= 0 || originalPrice <= 0) {
    return {
      totalROI: 0,
      annualizedROI: 0,
      totalCashFlow: 0,
      appreciationReturn: 0,
      cashFlowReturn: 0
    };
  }
  
  // Calculate total cash flow received over holding period
  const monthlyCashFlow = monthlyRent - monthlyExpenses - monthlyMortgage;
  const totalCashFlow = monthlyCashFlow * yearsHeld * 12;
  
  // Calculate total return: appreciation + cash flow
  const appreciationReturn = currentValue - originalPrice;
  const totalReturn = appreciationReturn + totalCashFlow;
  
  // Calculate ROI percentages
  const totalROI = (totalReturn / originalPrice) * 100;
  const annualizedROI = yearsHeld > 0 ? 
    (Math.pow((totalReturn + originalPrice) / originalPrice, 1 / yearsHeld) - 1) * 100 : 0;
  
  // Break down returns by source
  const cashFlowReturn = (totalCashFlow / originalPrice) * 100;
  const appreciationROI = (appreciationReturn / originalPrice) * 100;
  
  return {
    totalROI: Math.round(totalROI * 100) / 100,
    annualizedROI: Math.round(annualizedROI * 100) / 100,
    totalCashFlow: Math.round(totalCashFlow),
    appreciationReturn: Math.round(appreciationROI * 100) / 100,
    cashFlowReturn: Math.round(cashFlowReturn * 100) / 100
  };
}

/**
 * Format currency values for display
 * @param cents - Value in cents
 * @param compact - Whether to use compact notation (e.g., $1.2M)
 * @returns Formatted currency string
 */
export function formatCurrency(cents: number, compact: boolean = false): string {
  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
  };
  
  if (compact) {
    options.notation = 'compact';
    options.maximumFractionDigits = 1;
  }
  
  return new Intl.NumberFormat('en-US', options).format(cents / 100);
}

/**
 * Get inflation data for a specific year
 * @param year - Year to get inflation data for
 * @returns Inflation rate percentage for the year, or null if not found
 */
export function getInflationForYear(year: number): number | null {
  const data = HISTORICAL_INFLATION_DATA.find(d => d.year === year);
  return data ? data.inflationRate : null;
}