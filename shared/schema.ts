import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  jobTitle: text("job_title"),
  avatar: text("avatar"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("#3b82f6"),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const realEstateInvestments = pgTable("real_estate_investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyName: text("property_name").notNull(),
  address: text("address").notNull(),
  purchasePrice: integer("purchase_price").notNull(), // Store as cents
  currentValue: integer("current_value").notNull(), // Store as cents
  netEquity: integer("net_equity").notNull(), // Store as cents
  downPayment: integer("down_payment").notNull(), // Store as cents
  loanAmount: integer("loan_amount").notNull().default(0), // Store as cents
  interestRate: integer("interest_rate").notNull().default(0), // Store as basis points (0.01% = 1)
  loanTerm: integer("loan_term").notNull().default(0), // Months
  monthlyMortgage: integer("monthly_mortgage").notNull().default(0), // Store as cents
  monthlyRent: integer("monthly_rent").notNull().default(0), // Store as cents
  monthlyRentPotential: integer("monthly_rent_potential"), // Store as cents
  isInvestmentProperty: boolean("is_investment_property").notNull().default(true),
  monthlyExpenses: integer("monthly_expenses").notNull().default(0), // Store as cents
  expenseDetails: jsonb("expense_details").default({}), // Detailed expense breakdown
  monthlyEscrow: integer("monthly_escrow").notNull().default(0), // Store as cents
  avgAppreciationRate: integer("avg_appreciation_rate").notNull().default(350), // Store as basis points (3.5% = 350)
  outstandingBalance: integer("outstanding_balance").notNull().default(0), // Store as cents
  currentTerm: integer("current_term").notNull().default(0), // Months since purchase
  propertyType: text("property_type").notNull().default("single-family"), // single-family, multi-family, condo, townhouse, commercial
  purchaseDate: timestamp("purchase_date").notNull(),
  notes: text("notes"),
  group: text("group"), // Property group for filtering
  country: text("country"), // Country location
  // Enhanced Tax Benefits
  annualDepreciation: integer("annual_depreciation"), // Store as cents
  mortgageInterestDeduction: integer("mortgage_interest_deduction"), // Store as cents
  propertyTaxDeduction: integer("property_tax_deduction"), // Store as cents
  maintenanceDeductions: integer("maintenance_deductions"), // Store as cents
  totalTaxBenefits: integer("total_tax_benefits"), // Store as cents
  taxBenefitOverride: integer("tax_benefit_override"), // Store as cents
  // Additional property details for enhanced analytics
  zipCode: text("zip_code"),
  taxRate: integer("tax_rate"), // Store as basis points
  depreciationMethod: text("depreciation_method").default("straight-line"),
  costBasis: integer("cost_basis"), // Store as cents
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const investmentScenarios = pgTable("investment_scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  type: text("type"), // market-comparison, investment-analysis, tax-optimization
  scenarioData: jsonb("scenario_data").default({}),
  estimatedReturn: integer("estimated_return"), // Store as basis points
  riskLevel: text("risk_level"), // low, medium, high
  timeHorizon: integer("time_horizon"), // Months
  relatedProperties: text("related_properties").array().default([]),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // created, updated, deleted, reviewed, performance-alert, etc.
  entityType: text("entity_type").notNull(), // property, scenario, analysis
  entityId: varchar("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id").references(() => users.id),
  metadata: jsonb("metadata").default({}),
  alertLevel: text("alert_level"), // info, warning, critical
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertRealEstateInvestmentSchema = createInsertSchema(realEstateInvestments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvestmentScenarioSchema = createInsertSchema(investmentScenarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type RealEstateInvestment = typeof realEstateInvestments.$inferSelect;
export type InsertRealEstateInvestment = z.infer<typeof insertRealEstateInvestmentSchema>;

export type InvestmentScenario = typeof investmentScenarios.$inferSelect;
export type InsertInvestmentScenario = z.infer<typeof insertInvestmentScenarioSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Extended types for UI
export type RealEstateInvestmentWithCategory = RealEstateInvestment & {
  category?: Category;
};

export type InvestmentScenarioWithCategory = InvestmentScenario & {
  category?: Category;
};

// Dashboard stats type
export interface DashboardStats {
  totalProperties: number;
  totalPortfolioValue: number;
  totalInvestment: number;
  averageROI: number;
  totalNetEquity?: number;
  totalMonthlyIncome?: number;
  totalMonthlyExpenses?: number;
  netCashFlow?: number;
  averageCapRate?: number;
  totalTaxBenefits?: number;
  activeProperties?: number;
  recentActivity?: Activity[];
  topPerformingProperties?: Array<{
    id: string;
    name: string;
    roi: number;
  }>;
  totalMonthlyRent?: number;
}

// Expense details interface
export interface ExpenseDetails {
  monthlyHELOC?: number;
  annualInsurance?: number;
  annualPropertyTaxes?: number;
  monthlyManagementFees?: number;
  monthlyAssociationFees?: number;
  monthlyMaintenance?: number;
  monthlyMortgage?: number;
  monthlyEscrow?: number;
  monthlyOther?: number;
}
