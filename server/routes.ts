import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRealEstateInvestmentSchema, insertInvestmentScenarioSchema, insertCategorySchema, type InsertRealEstateInvestment, type InsertMarketSentiment } from "@shared/schema";
import { z } from "zod";

// FRED API Integration for Economic Data
interface EconomicDataPoint {
  date: string;
  year: number;
  inflationRate?: number;
  caseShillerIndex?: number;
  mortgageRate?: number;
  sp500Index?: number;
  value?: number;
}

async function fetchFREDSeries(seriesId: string, startDate: string = "1950-01-01"): Promise<EconomicDataPoint[]> {
  const FRED_API_BASE = "https://api.stlouisfed.org/fred/series/observations";
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!FRED_API_KEY) {
    console.error('FRED_API_KEY not found in environment variables');
    return [];
  }

  try {
    const url = `${FRED_API_BASE}?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json&start_date=${startDate}&sort_order=asc`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return data.observations
      .filter((obs: any) => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
      .map((obs: any) => ({
        date: obs.date,
        year: new Date(obs.date).getFullYear(),
        value: parseFloat(obs.value),
        [getDataKey(seriesId)]: parseFloat(obs.value)
      }));
  } catch (error) {
    console.error(`Error fetching FRED data for ${seriesId}:`, error);
    return [];
  }
}

function getDataKey(seriesId: string): string {
  switch (seriesId) {
    case 'CPIAUCSL': return 'cpiIndex';
    case 'CSUSHPINSA': return 'caseShillerIndex';
    case 'MORTGAGE30US': return 'mortgageRate';
    case 'SP500': return 'sp500Index';
    default: return 'value';
  }
}

// Calculate inflation rate from CPI data
function calculateInflationRate(cpiData: EconomicDataPoint[]): EconomicDataPoint[] {
  return cpiData.map((point, index) => {
    if (index === 0) {
      return { ...point, inflationRate: 0 };
    }
    
    const previousCPI = cpiData[index - 1].value || 0;
    const currentCPI = point.value || 0;
    const inflationRate = previousCPI > 0 ? ((currentCPI - previousCPI) / previousCPI) * 100 : 0;
    
    return { ...point, inflationRate };
  });
}

// Combine multiple FRED series into unified dataset
function combineEconomicData(
  cpiData: EconomicDataPoint[], 
  caseShillerData: EconomicDataPoint[], 
  mortgageData: EconomicDataPoint[], 
  sp500Data: EconomicDataPoint[]
): EconomicDataPoint[] {
  const yearMap = new Map<number, EconomicDataPoint>();
  
  // Process CPI and calculate inflation rates
  const cpiWithInflation = calculateInflationRate(cpiData);
  
  cpiWithInflation.forEach(point => {
    yearMap.set(point.year, { 
      ...point, 
      date: `${point.year}-12-31`,
      year: point.year 
    });
  });
  
  // Add Case-Shiller data
  caseShillerData.forEach(point => {
    const existing = yearMap.get(point.year) || { date: `${point.year}-12-31`, year: point.year };
    yearMap.set(point.year, { 
      ...existing, 
      caseShillerIndex: point.value 
    });
  });
  
  // Add mortgage rate data
  mortgageData.forEach(point => {
    const existing = yearMap.get(point.year) || { date: `${point.year}-12-31`, year: point.year };
    yearMap.set(point.year, { 
      ...existing, 
      mortgageRate: point.value 
    });
  });
  
  // Add S&P 500 data
  sp500Data.forEach(point => {
    const existing = yearMap.get(point.year) || { date: `${point.year}-12-31`, year: point.year };
    yearMap.set(point.year, { 
      ...existing, 
      sp500Index: point.value 
    });
  });
  
  return Array.from(yearMap.values())
    .sort((a, b) => a.year - b.year)
    .filter(point => point.year >= 1950 && point.year <= 2024);
}

// Market Sentiment Fetching Service
async function fetchMarketSentiment(): Promise<InsertMarketSentiment> {
  try {
    // Simulate fetching from multiple data sources (FRED API, market APIs, etc.)
    // In production, you would call actual APIs here
    
    // Example market indicators (in real implementation, fetch from APIs)
    const indicators = {
      housePrice: 380000, // Median house price in USD
      interestRate: 675, // 6.75% in basis points
      inflationRate: 320, // 3.2% in basis points
      unemploymentRate: 380, // 3.8% in basis points
      mortgageRates: 725, // 7.25% in basis points
      gdpGrowth: 250, // 2.5% in basis points
    };

    // Calculate mood score based on multiple factors
    let moodScore = 50; // Start neutral
    
    // Interest rate impact (lower is better for real estate)
    if (indicators.interestRate < 600) moodScore += 15;
    else if (indicators.interestRate > 700) moodScore -= 15;
    
    // Inflation impact (moderate inflation is good)
    if (indicators.inflationRate > 200 && indicators.inflationRate < 400) moodScore += 10;
    else if (indicators.inflationRate > 500) moodScore -= 20;
    
    // Unemployment impact (lower is better)
    if (indicators.unemploymentRate < 400) moodScore += 10;
    else if (indicators.unemploymentRate > 600) moodScore -= 15;
    
    // GDP growth impact
    if (indicators.gdpGrowth > 200) moodScore += 10;
    else if (indicators.gdpGrowth < 100) moodScore -= 10;
    
    // Ensure score stays within bounds
    moodScore = Math.max(0, Math.min(100, moodScore));
    
    // Determine overall mood
    let overallMood: string;
    let sentiment: string;
    let confidence: number;
    
    if (moodScore >= 70) {
      overallMood = 'bullish';
      sentiment = 'positive';
      confidence = Math.min(95, moodScore + 10);
    } else if (moodScore >= 40) {
      overallMood = 'neutral';
      sentiment = 'neutral';
      confidence = Math.max(60, moodScore);
    } else {
      overallMood = 'bearish';
      sentiment = 'negative';
      confidence = Math.max(70, 100 - moodScore);
    }

    return {
      overallMood,
      moodScore,
      indicators,
      housePrice: indicators.housePrice * 100, // Convert to cents
      interestRate: indicators.interestRate,
      inflationRate: indicators.inflationRate,
      unemploymentRate: indicators.unemploymentRate,
      sentiment,
      confidence,
      dataSource: 'FRED_SIMULATED'
    };
  } catch (error) {
    console.error('Error fetching market sentiment:', error);
    // Return neutral sentiment on error
    return {
      overallMood: 'neutral',
      moodScore: 50,
      indicators: {},
      sentiment: 'neutral',
      confidence: 50,
      dataSource: 'ERROR_FALLBACK'
    };
  }
}

// CSV data from user's file - Updated 2025-08-16
const csvData = [
  ["Property Name", "Address", "Property Type", "Country", "Purchase Price", "Current Value", "Monthly Rent Income", "Monthly Expenses", "Purchase Date", "Down Payment", "Loan Amount", "Interest Rate", "Loan Term", "Outstanding Balance", "Current Term", "Monthly Mortgage"],
  ["Levent", "Besiktas, Levent, Menekseli S No8", "Condo", "Turkey", "930000", "2200000", "4500", "333.33", "10/1/2005", "0", "0", "0", "0", "0", "0", "0"],
  ["Eyup", "Eyup, Topcular C, No 40", "Condo", "Turkey", "700000", "2000000", "5750", "300", "11/1/2007", "0", "0", "0", "0", "0", "0", "0"],
  ["Sisli_Gulbahar", "Sisli, Mecidiyekoy, Gulbahar M, Buyukdere C, Oya S, Tumer Plaza, No 7/6", "Condo", "Turkey", "400000", "600000", "1100", "91.67", "9/1/2016", "0", "0", "0", "0", "0", "0", "0"],
  ["Sisli_Halaskargazi", "Sisli, 19 Mayis M, Halaskargazi C, 226/1", "Condo", "Turkey", "110000", "550000", "1050", "91.67", "1/1/2002", "0", "0", "0", "0", "0", "0", "0"],
  ["Sisli_HirantDink", "Sisli, 19 Mayis M, Hirant Dink, 96/4", "Condo", "Turkey", "60000", "300000", "825", "41.67", "1/1/1995", "0", "0", "0", "0", "0", "0", "0"],
  ["KocaMustafa_AptiIpekci", "KocaMustafaPasa, Apti Ipekci M, Mercan Balik S No 4/2", "Condo", "Turkey", "9000", "120000", "300", "20", "1/1/1990", "0", "0", "0", "0", "0", "0", "0"],
  ["KocaMustafa_Marmara", "KocaMustafaPasa, Marmara C, 116/6", "Condo", "Turkey", "3000", "120000", "313", "20", "1/1/1970", "0", "0", "0", "0", "0", "0", "0"],
  ["Sisli_Siracevizler", "Sisli, Merkez M, Siracevizler C, Marmara Ap, 132/7", "Condo", "Turkey", "11840", "300000", "600", "50", "1/1/1982", "0", "0", "0", "0", "0", "0", "0"],
  ["Atakoy", "Bakirkoy, Atakoy, Karanfil S No 1/KB A/7-Bl 13/143", "Condo", "Turkey", "32200", "300000", "875", "50", "1/1/1995", "0", "0", "0", "0", "0", "0", "0"],
  ["12 Hillcrest", "12 Hillcrest Ct, South San Francisco, CA 94080", "Single Family", "USA", "675000", "1250000", "4450", "880", "3/1/2014", "230000", "445000", "3.75%", "360", "338,073", "125", "2030"],
  ["Boca 219", "500 SW Avenue, Boca Raton, Florida", "Single Family", "USA", "212500", "225000", "1950", "936", "5/1/2024", "0", "0", "0", "0", "0", "0", "0"],
  ["Lupin way", "925 Lupin way San Carlos CA", "Single Family", "USA", "1375000", "2300000", "0", "1600", "3/1/2020", "704165", "670835", "2.50%", "360", "583712", "66", "3054"],
  ["ErsoySahil", "Kadikoy, Suadiye, Zihni Sakaryali S 7/2", "Condo", "Turkey", "300000", "450000", "0", "66.67", "12/1/2018", "0", "0", "0", "0", "0", "0", "0"]
];

function parseCSVData(data: string[][]): InsertRealEstateInvestment[] {
  const properties: InsertRealEstateInvestment[] = [];
  
  for (let i = 1; i < data.length; i++) { // Skip header row
    const row = data[i];
    const [
      propertyName, address, propertyType, country, purchasePrice, currentValue,
      monthlyRentIncome, monthlyExpenses, purchaseDate, downPayment, loanAmount,
      interestRate, loanTerm, outstandingBalance, currentTerm, monthlyMortgage
    ] = row;

    // Parse numeric values and convert to cents where needed
    const parsePriceValue = (value: string) => {
      const cleaned = value.replace(/[,$]/g, '');
      return Math.round(parseFloat(cleaned) * 100); // Convert to cents
    };

    const parsePercentage = (value: string) => {
      const cleaned = value.replace(/%/g, '');
      return Math.round(parseFloat(cleaned) * 100); // Convert to basis points
    };

    const parseDate = (dateStr: string) => {
      const [month, day, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    };

    const property: InsertRealEstateInvestment = {
      propertyName,
      address,
      purchasePrice: parsePriceValue(purchasePrice),
      currentValue: parsePriceValue(currentValue),
      netEquity: parsePriceValue(currentValue) - (outstandingBalance ? parsePriceValue(outstandingBalance) : 0),
      downPayment: parsePriceValue(downPayment || '0'),
      loanAmount: parsePriceValue(loanAmount || '0'),
      interestRate: interestRate ? parsePercentage(interestRate) : 0,
      loanTerm: parseInt(loanTerm || '0'),
      monthlyMortgage: parsePriceValue(monthlyMortgage || '0'),
      monthlyRent: parsePriceValue(monthlyRentIncome || '0'),
      monthlyExpenses: parsePriceValue(monthlyExpenses || '0'),
      outstandingBalance: parsePriceValue(outstandingBalance || '0'),
      currentTerm: parseInt(currentTerm || '0'),
      propertyType: propertyType.toLowerCase().replace(' ', '-'),
      purchaseDate: parseDate(purchaseDate),
      country,
      group: country, // Use country as group
      avgAppreciationRate: country === 'Turkey' ? 1200 : 350, // 12% for Turkey, 3.5% for USA
      isInvestmentProperty: true
    };

    properties.push(property);
  }

  return properties;
}

async function initializeDummyProperties() {
  try {
    // Check if properties already exist
    const existingInvestments = await storage.getInvestments();
    if (existingInvestments.length > 0) {
      console.log('Properties already loaded, skipping initialization');
      return;
    }

    // Parse and import the CSV data
    const properties = parseCSVData(csvData);
    console.log(`Importing ${properties.length} properties for dummy user...`);
    
    await storage.importInvestments(properties);
    console.log('Successfully imported dummy properties');
  } catch (error) {
    console.error('Error initializing dummy properties:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default data on startup
  await storage.initializeDefaultData();
  await initializeDummyProperties();
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Market Sentiment APIs
  app.get("/api/market-sentiment/latest", async (_req, res) => {
    try {
      const sentiment = await storage.getLatestMarketSentiment();
      res.json(sentiment);
    } catch (error) {
      console.error('Error fetching latest market sentiment:', error);
      res.status(500).json({ error: 'Failed to fetch market sentiment' });
    }
  });

  app.get("/api/market-sentiment/history", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 30;
      const history = await storage.getMarketSentimentHistory(limit);
      res.json(history);
    } catch (error) {
      console.error('Error fetching market sentiment history:', error);
      res.status(500).json({ error: 'Failed to fetch market sentiment history' });
    }
  });

  app.post("/api/market-sentiment/refresh", async (_req, res) => {
    try {
      // Fetch fresh market data and create sentiment analysis
      const sentiment = await fetchMarketSentiment();
      const saved = await storage.createMarketSentiment(sentiment);
      res.json(saved);
    } catch (error) {
      console.error('Error refreshing market sentiment:', error);
      res.status(500).json({ error: 'Failed to refresh market sentiment' });
    }
  });

  // Categories
  app.get("/api/categories", async (_req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Real Estate Investments
  app.get("/api/investments", async (req, res) => {
    try {
      const { group, search } = req.query;
      const filters = {
        group: group as string | undefined,
        search: search as string | undefined,
      };
      
      const investments = await storage.getInvestments(filters);
      res.json(investments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  app.get("/api/investments/:id", async (req, res) => {
    try {
      const investment = await storage.getInvestment(req.params.id);
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      res.json(investment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch investment" });
    }
  });

  app.post("/api/investments", async (req, res) => {
    try {
      const validatedData = insertRealEstateInvestmentSchema.parse(req.body);
      const investment = await storage.createInvestment(validatedData);
      res.status(201).json(investment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create investment" });
      }
    }
  });

  app.put("/api/investments/:id", async (req, res) => {
    try {
      const validatedData = insertRealEstateInvestmentSchema.partial().parse(req.body);
      const investment = await storage.updateInvestment(req.params.id, validatedData);
      res.json(investment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else if (error instanceof Error && error.message === "Investment not found") {
        res.status(404).json({ message: "Investment not found" });
      } else {
        res.status(500).json({ message: "Failed to update investment" });
      }
    }
  });

  app.delete("/api/investments/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteInvestment(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Investment not found" });
      }
      res.json({ message: "Investment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete investment" });
    }
  });

  // Investment Scenarios
  app.get("/api/scenarios", async (req, res) => {
    try {
      const { categoryId, search } = req.query;
      const filters = {
        categoryId: categoryId as string | undefined,
        search: search as string | undefined,
      };
      
      const scenarios = await storage.getScenarios(filters);
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch investment scenarios" });
    }
  });

  app.get("/api/scenarios/:id", async (req, res) => {
    try {
      const scenario = await storage.getScenario(req.params.id);
      if (!scenario) {
        return res.status(404).json({ message: "Investment scenario not found" });
      }
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch investment scenario" });
    }
  });

  app.post("/api/scenarios", async (req, res) => {
    try {
      const validatedData = insertInvestmentScenarioSchema.parse(req.body);
      const scenario = await storage.createScenario(validatedData);
      res.status(201).json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create investment scenario" });
      }
    }
  });

  app.put("/api/scenarios/:id", async (req, res) => {
    try {
      const validatedData = insertInvestmentScenarioSchema.partial().parse(req.body);
      const scenario = await storage.updateScenario(req.params.id, validatedData);
      res.json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else if (error instanceof Error && error.message === "Investment scenario not found") {
        res.status(404).json({ message: "Investment scenario not found" });
      } else {
        res.status(500).json({ message: "Failed to update investment scenario" });
      }
    }
  });

  app.delete("/api/scenarios/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScenario(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Investment scenario not found" });
      }
      res.json({ message: "Investment scenario deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete investment scenario" });
    }
  });

  // Activities
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Data management
  app.get("/api/export", async (_req, res) => {
    try {
      const data = await storage.exportData();
      res.setHeader('Content-Disposition', 'attachment; filename=real-estate-data.json');
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  app.post("/api/import/investments", async (req, res) => {
    try {
      const investmentsData = z.array(insertRealEstateInvestmentSchema).parse(req.body);
      const importedInvestments = await storage.importInvestments(investmentsData);
      res.status(201).json({ 
        message: `Successfully imported ${importedInvestments.length} investments`,
        investments: importedInvestments 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data format", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to import investments" });
      }
    }
  });

  app.delete("/api/data", async (_req, res) => {
    try {
      await storage.clearAllData();
      res.json({ message: "All data cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear data" });
    }
  });

  // Clear all user data (but keep categories)
  app.delete("/api/user-data", async (_req, res) => {
    try {
      const success = await storage.clearAllUserData();
      if (success) {
        res.json({ message: "All user data cleared successfully" });
      } else {
        res.status(500).json({ message: "Failed to clear user data" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to clear user data" });
    }
  });

  // Economic Data API - Fetch authentic FRED data
  app.get("/api/economic-data/combined", async (_req, res) => {
    try {
      console.log('Fetching economic data from FRED API...');
      
      // Fetch all data series in parallel
      const [cpiData, caseShillerData, mortgageData, sp500Data] = await Promise.all([
        fetchFREDSeries("CPIAUCSL", "1950-01-01"), // Consumer Price Index
        fetchFREDSeries("CSUSHPINSA", "1987-01-01"), // Case-Shiller starts in 1987
        fetchFREDSeries("MORTGAGE30US", "1971-04-02"), // Mortgage data starts April 1971
        fetchFREDSeries("SP500", "1971-02-05") // FRED S&P 500 starts Feb 1971
      ]);
      
      console.log(`Fetched: CPI(${cpiData.length}), Case-Shiller(${caseShillerData.length}), Mortgage(${mortgageData.length}), S&P500(${sp500Data.length})`);
      
      // Combine all data
      const combinedData = combineEconomicData(cpiData, caseShillerData, mortgageData, sp500Data);
      
      console.log(`Combined dataset: ${combinedData.length} records from 1950-2024`);
      
      res.json(combinedData);
    } catch (error) {
      console.error('Error fetching economic data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch economic data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Helper function to parse CSV properly handling quoted fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  // CSV Import endpoint for investments
  app.post("/api/investments/import", async (req, res) => {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({ error: "CSV data is required" });
      }

      const lines = csvData.trim().split('\n');
      const headers = parseCSVLine(lines[0]);
      
      const results = {
        success: 0,
        errors: [] as string[],
        data: [] as any[]
      };

      // Process each data row (skip header)
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i]);
          
          if (values.length < 8) {
            results.errors.push(`Row ${i + 1}: Missing required columns`);
            continue;
          }

              // Parse the purchase date from MM/DD/YYYY format or other formats
          const parsePurchaseDate = (dateStr: string) => {
            if (!dateStr || dateStr === '#########') return new Date();
            
            // Handle MM/DD/YYYY format
            if (dateStr.includes('/')) {
              const [month, day, year] = dateStr.split('/');
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
            
            // Handle other date formats
            const parsed = new Date(dateStr);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          };

          // Parse interest rate - handle percentage format and store in basis points
          const parseInterestRate = (rateStr: string) => {
            if (!rateStr || rateStr === '0') return 0;
            const rate = parseFloat(rateStr.replace('%', ''));
            // Store as basis points: 3.75% becomes 375 basis points
            return Math.round(rate * 100);
          };

          // Parse outstanding balance - handle quoted numbers with commas
          const parseAmount = (amountStr: string) => {
            if (!amountStr || amountStr === '0') return 0;
            const cleaned = amountStr.replace(/[",]/g, '');
            return Math.round(parseFloat(cleaned) * 100) || 0;
          };

          // Map CSV columns based on YOUR exact format:
          // Property Name | Address | Property Type | Country | Purchase Price | Current Value | Monthly Rent | Monthly Expenses | Purchase Date | Down Payment | Loan Amount | Interest Rate | Loan Term | Outstanding Balance | Current Term | Monthly Mortgage
          const investmentData = {
            propertyName: values[0] || '',
            address: values[1] || '',
            propertyType: values[2] || 'single-family', // Column 2 is Property Type
            country: values[3] || 'USA', // Column 3 is Country
            purchasePrice: parseAmount(values[4] || '0'), // Column 4 is Purchase Price
            currentValue: parseAmount(values[5] || '0'), // Column 5 is Current Value
            monthlyRent: parseAmount(values[6] || '0'), // Column 6 is Monthly Rent
            monthlyExpenses: parseAmount(values[7] || '0'), // Column 7 is Monthly Expenses
            purchaseDate: parsePurchaseDate(values[8] || ''), // Column 8 is Purchase Date
            downPayment: parseAmount(values[9] || '0'), // Column 9 is Down Payment
            loanAmount: parseAmount(values[10] || '0'), // Column 10 is Loan Amount
            interestRate: parseInterestRate(values[11] || '0'), // Column 11 is Interest Rate
            loanTerm: parseInt(values[12] || '0') || 0, // Column 12 is Loan Term (in months)
            outstandingBalance: parseAmount(values[13] || '0'), // Column 13 is Outstanding Balance
            currentTerm: parseInt(values[14] || '0') || 0, // Column 14 is Current Term
            monthlyMortgage: parseAmount(values[15] || '0'), // Column 15 is Monthly Mortgage
            netEquity: parseAmount(values[5] || '0') - parseAmount(values[13] || '0'), // Calculated: Current Value - Outstanding Balance
            notes: `${values[3] || 'USA'} property imported from CSV`,
            description: `${values[3] || 'USA'} property`,
            categoryId: null,
          };

          // Validate required fields
          if (!investmentData.propertyName || !investmentData.address) {
            results.errors.push(`Row ${i + 1}: Property name and address are required`);
            continue;
          }

          // Create the investment
          const newInvestment = await storage.createInvestment(investmentData);
          results.data.push(newInvestment);
          results.success++;

        } catch (error) {
          results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json(results);
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "Import failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
