import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRealEstateInvestmentSchema, insertInvestmentScenarioSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
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

          // Map CSV columns based on the correct 16-column format:
          // Property Name,Address,Purchase Date,Purchase Price,Current Value,Monthly Rent,Monthly Expenses,Monthly Mortgage,Loan Amount,Interest Rate,Loan Term,Current Term,Outstanding Balance,Net Equity,Notes,Country
          const investmentData = {
            propertyName: values[0] || '',
            address: values[1] || '',
            purchaseDate: parsePurchaseDate(values[2] || ''), // Column 2 is Purchase Date
            purchasePrice: parseAmount(values[3] || '0'), // Column 3 is Purchase Price
            currentValue: parseAmount(values[4] || '0'), // Column 4 is Current Value
            monthlyRent: parseAmount(values[5] || '0'), // Column 5 is Monthly Rent
            monthlyExpenses: parseAmount(values[6] || '0'), // Column 6 is Monthly Expenses
            monthlyMortgage: parseAmount(values[7] || '0'), // Column 7 is Monthly Mortgage
            loanAmount: parseAmount(values[8] || '0'), // Column 8 is Loan Amount
            interestRate: parseInterestRate(values[9] || '0'), // Column 9 is Interest Rate
            loanTerm: parseInt(values[10] || '0') || 0, // Column 10 is Loan Term (already in months)
            currentTerm: parseInt(values[11] || '0') || 0, // Column 11 is Current Term
            outstandingBalance: parseAmount(values[12] || '0'), // Column 12 is Outstanding Balance
            netEquity: parseAmount(values[13] || '0'), // Column 13 is Net Equity
            notes: values[14] || '', // Column 14 is Notes
            country: values[15] || 'USA', // Column 15 is Country
            propertyType: 'single-family',
            downPayment: 0, // Not in CSV
            description: `${values[15] || 'USA'} property`,
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
