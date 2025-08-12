import { 
  type User, 
  type InsertUser, 
  type RealEstateInvestment, 
  type InsertRealEstateInvestment,
  type Category,
  type InsertCategory,
  type InvestmentScenario,
  type InsertInvestmentScenario,
  type Activity,
  type InsertActivity,
  type RealEstateInvestmentWithCategory,
  type InvestmentScenarioWithCategory,
  type DashboardStats,
  users,
  categories,
  realEstateInvestments,
  investmentScenarios,
  activities
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, updates: Partial<Category>): Promise<Category>;
  deleteCategory(id: string): Promise<boolean>;

  // Real Estate Investments
  getInvestments(filters?: { categoryId?: string; group?: string; search?: string }): Promise<RealEstateInvestmentWithCategory[]>;
  getInvestment(id: string): Promise<RealEstateInvestmentWithCategory | undefined>;
  createInvestment(investment: InsertRealEstateInvestment): Promise<RealEstateInvestment>;
  updateInvestment(id: string, updates: Partial<RealEstateInvestment>): Promise<RealEstateInvestment>;
  deleteInvestment(id: string): Promise<boolean>;

  // Investment Scenarios
  getScenarios(filters?: { categoryId?: string; search?: string }): Promise<InvestmentScenarioWithCategory[]>;
  getScenario(id: string): Promise<InvestmentScenarioWithCategory | undefined>;
  createScenario(scenario: InsertInvestmentScenario): Promise<InvestmentScenario>;
  updateScenario(id: string, updates: Partial<InvestmentScenario>): Promise<InvestmentScenario>;
  deleteScenario(id: string): Promise<boolean>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;

  // Data management
  exportData(): Promise<{ investments: RealEstateInvestmentWithCategory[]; scenarios: InvestmentScenarioWithCategory[]; categories: Category[] }>;
  importInvestments(investments: InsertRealEstateInvestment[]): Promise<RealEstateInvestment[]>;
  clearAllData(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  constructor() {}

  async initializeDefaultData() {
    // Create default categories
    const defaultCategories: InsertCategory[] = [
      { name: "Residential", description: "Single-family homes, condos, and townhouses", color: "#3b82f6", icon: "home" },
      { name: "Commercial", description: "Office buildings, retail spaces", color: "#10b981", icon: "building" },
      { name: "Multi-Family", description: "Apartment buildings and duplexes", color: "#f59e0b", icon: "building-2" },
      { name: "Land", description: "Vacant land and development opportunities", color: "#8b5cf6", icon: "map" },
      { name: "Real Estate", description: "General real estate investments", color: "#ef4444", icon: "building" }
    ];

    // Check if categories already exist
    const existingCategories = await db.select().from(categories);
    if (existingCategories.length === 0) {
      for (const category of defaultCategories) {
        await db.insert(categories).values(category);
      }
    }

    // Create dummy user if doesn't exist
    const existingUser = await this.getUserByEmail("arinkeskin@gmail.com");
    if (!existingUser) {
      await this.createUser({
        username: "arinkeskin",
        email: "arinkeskin@gmail.com",
        name: "Arin Keskin",
        jobTitle: "Real Estate Investor",
        preferences: {}
      });
    }
  }

  // User operations  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const [updatedCategory] = await db.update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Investment operations
  async getInvestments(filters?: { categoryId?: string; group?: string; search?: string }): Promise<RealEstateInvestmentWithCategory[]> {
    let query = db.select({
      id: realEstateInvestments.id,
      propertyName: realEstateInvestments.propertyName,
      address: realEstateInvestments.address,
      purchasePrice: realEstateInvestments.purchasePrice,
      currentValue: realEstateInvestments.currentValue,
      netEquity: realEstateInvestments.netEquity,
      downPayment: realEstateInvestments.downPayment,
      loanAmount: realEstateInvestments.loanAmount,
      interestRate: realEstateInvestments.interestRate,
      loanTerm: realEstateInvestments.loanTerm,
      monthlyMortgage: realEstateInvestments.monthlyMortgage,
      monthlyRent: realEstateInvestments.monthlyRent,
      monthlyRentPotential: realEstateInvestments.monthlyRentPotential,
      isInvestmentProperty: realEstateInvestments.isInvestmentProperty,
      monthlyExpenses: realEstateInvestments.monthlyExpenses,
      expenseDetails: realEstateInvestments.expenseDetails,
      monthlyEscrow: realEstateInvestments.monthlyEscrow,
      avgAppreciationRate: realEstateInvestments.avgAppreciationRate,
      outstandingBalance: realEstateInvestments.outstandingBalance,
      currentTerm: realEstateInvestments.currentTerm,
      propertyType: realEstateInvestments.propertyType,
      purchaseDate: realEstateInvestments.purchaseDate,
      notes: realEstateInvestments.notes,
      group: realEstateInvestments.group,
      country: realEstateInvestments.country,
      annualDepreciation: realEstateInvestments.annualDepreciation,
      mortgageInterestDeduction: realEstateInvestments.mortgageInterestDeduction,
      propertyTaxDeduction: realEstateInvestments.propertyTaxDeduction,
      maintenanceDeductions: realEstateInvestments.maintenanceDeductions,
      totalTaxBenefits: realEstateInvestments.totalTaxBenefits,
      taxBenefitOverride: realEstateInvestments.taxBenefitOverride,
      zipCode: realEstateInvestments.zipCode,
      taxRate: realEstateInvestments.taxRate,
      depreciationMethod: realEstateInvestments.depreciationMethod,
      costBasis: realEstateInvestments.costBasis,
      createdAt: realEstateInvestments.createdAt,
      updatedAt: realEstateInvestments.updatedAt,
      category: categories
    }).from(realEstateInvestments)
    .leftJoin(categories, eq(realEstateInvestments.group, categories.name));

    const conditions = [];
    if (filters?.search) {
      conditions.push(like(realEstateInvestments.propertyName, `%${filters.search}%`));
    }
    if (filters?.group) {
      conditions.push(eq(realEstateInvestments.group, filters.group));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async getInvestment(id: string): Promise<RealEstateInvestmentWithCategory | undefined> {
    const [investment] = await db.select({
      id: realEstateInvestments.id,
      propertyName: realEstateInvestments.propertyName,
      address: realEstateInvestments.address,
      purchasePrice: realEstateInvestments.purchasePrice,
      currentValue: realEstateInvestments.currentValue,
      netEquity: realEstateInvestments.netEquity,
      downPayment: realEstateInvestments.downPayment,
      loanAmount: realEstateInvestments.loanAmount,
      interestRate: realEstateInvestments.interestRate,
      loanTerm: realEstateInvestments.loanTerm,
      monthlyMortgage: realEstateInvestments.monthlyMortgage,
      monthlyRent: realEstateInvestments.monthlyRent,
      monthlyRentPotential: realEstateInvestments.monthlyRentPotential,
      isInvestmentProperty: realEstateInvestments.isInvestmentProperty,
      monthlyExpenses: realEstateInvestments.monthlyExpenses,
      expenseDetails: realEstateInvestments.expenseDetails,
      monthlyEscrow: realEstateInvestments.monthlyEscrow,
      avgAppreciationRate: realEstateInvestments.avgAppreciationRate,
      outstandingBalance: realEstateInvestments.outstandingBalance,
      currentTerm: realEstateInvestments.currentTerm,
      propertyType: realEstateInvestments.propertyType,
      purchaseDate: realEstateInvestments.purchaseDate,
      notes: realEstateInvestments.notes,
      group: realEstateInvestments.group,
      country: realEstateInvestments.country,
      annualDepreciation: realEstateInvestments.annualDepreciation,
      mortgageInterestDeduction: realEstateInvestments.mortgageInterestDeduction,
      propertyTaxDeduction: realEstateInvestments.propertyTaxDeduction,
      maintenanceDeductions: realEstateInvestments.maintenanceDeductions,
      totalTaxBenefits: realEstateInvestments.totalTaxBenefits,
      taxBenefitOverride: realEstateInvestments.taxBenefitOverride,
      zipCode: realEstateInvestments.zipCode,
      taxRate: realEstateInvestments.taxRate,
      depreciationMethod: realEstateInvestments.depreciationMethod,
      costBasis: realEstateInvestments.costBasis,
      createdAt: realEstateInvestments.createdAt,
      updatedAt: realEstateInvestments.updatedAt,
      category: categories
    }).from(realEstateInvestments)
    .leftJoin(categories, eq(realEstateInvestments.group, categories.name))
    .where(eq(realEstateInvestments.id, id));

    return investment;
  }

  async createInvestment(investment: InsertRealEstateInvestment): Promise<RealEstateInvestment> {
    const [newInvestment] = await db.insert(realEstateInvestments).values(investment).returning();
    return newInvestment;
  }

  async updateInvestment(id: string, updates: Partial<RealEstateInvestment>): Promise<RealEstateInvestment> {
    const [updatedInvestment] = await db.update(realEstateInvestments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(realEstateInvestments.id, id))
      .returning();
    return updatedInvestment;
  }

  async deleteInvestment(id: string): Promise<boolean> {
    const result = await db.delete(realEstateInvestments).where(eq(realEstateInvestments.id, id));
    return result.rowCount > 0;
  }

  // Scenario operations (simplified for now)
  async getScenarios(filters?: { categoryId?: string; search?: string }): Promise<InvestmentScenarioWithCategory[]> {
    // Simplified implementation - return empty array for now
    return [];
  }

  async getScenario(id: string): Promise<InvestmentScenarioWithCategory | undefined> {
    return undefined;
  }

  async createScenario(scenario: InsertInvestmentScenario): Promise<InvestmentScenario> {
    const [newScenario] = await db.insert(investmentScenarios).values(scenario).returning();
    return newScenario;
  }

  async updateScenario(id: string, updates: Partial<InvestmentScenario>): Promise<InvestmentScenario> {
    const [updatedScenario] = await db.update(investmentScenarios)
      .set(updates)
      .where(eq(investmentScenarios.id, id))
      .returning();
    return updatedScenario;
  }

  async deleteScenario(id: string): Promise<boolean> {
    const result = await db.delete(investmentScenarios).where(eq(investmentScenarios.id, id));
    return result.rowCount > 0;
  }

  // Activity operations (simplified)
  async getActivities(limit?: number): Promise<Activity[]> {
    return await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit || 50);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Dashboard operations
  async getDashboardStats(): Promise<DashboardStats> {
    const investments = await this.getInvestments();
    
    const totalProperties = investments.length;
    const totalPortfolioValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalEquity = investments.reduce((sum, inv) => sum + inv.netEquity, 0);
    const totalMonthlyRent = investments.reduce((sum, inv) => sum + (inv.monthlyRent || 0), 0);
    
    return {
      totalProperties,
      totalPortfolioValue,
      totalEquity,
      totalMonthlyRent,
      averageROI: totalPortfolioValue > 0 ? Math.round((totalMonthlyRent * 12 / totalPortfolioValue) * 10000) : 0,
      topPerformingProperties: investments
        .sort((a, b) => b.currentValue - b.purchasePrice - (a.currentValue - a.purchasePrice))
        .slice(0, 3)
        .map(inv => ({
          id: inv.id,
          name: inv.propertyName,
          roi: inv.purchasePrice > 0 ? Math.round(((inv.currentValue - inv.purchasePrice) / inv.purchasePrice) * 10000) : 0
        }))
    };
  }

  // Data management operations
  async exportData(): Promise<{ investments: RealEstateInvestmentWithCategory[]; scenarios: InvestmentScenarioWithCategory[]; categories: Category[] }> {
    return {
      investments: await this.getInvestments(),
      scenarios: await this.getScenarios(),
      categories: await this.getCategories()
    };
  }

  async importInvestments(investments: InsertRealEstateInvestment[]): Promise<RealEstateInvestment[]> {
    const results = [];
    for (const investment of investments) {
      const result = await this.createInvestment(investment);
      results.push(result);
    }
    return results;
  }

  async clearAllData(): Promise<boolean> {
    await db.delete(realEstateInvestments);
    return true;
  }
}

export const storage = new DatabaseStorage();
      entityId: id,
      entityName: updatedScenario.name,
      description: `Investment scenario "${updatedScenario.name}" updated`,
      userId: undefined,
      metadata: { changes: Object.keys(updates) },
    });

    return updatedScenario;
  }

  async deleteScenario(id: string): Promise<boolean> {
    const scenario = this.scenarios.get(id);
    if (scenario) {
      await this.createActivity({
        type: "deleted",
        entityType: "scenario",
        entityId: id,
        entityName: scenario.name,
        description: `Investment scenario "${scenario.name}" removed`,
        userId: undefined,
        metadata: {},
      });
    }
    return this.scenarios.delete(id);
  }

  // Activities
  async getActivities(limit = 50): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const investments = Array.from(this.investments.values());
    
    const totalProperties = investments.length;
    const totalPortfolioValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalNetEquity = investments.reduce((sum, inv) => sum + inv.netEquity, 0);
    const totalMonthlyIncome = investments.reduce((sum, inv) => sum + inv.monthlyRent, 0);
    const totalMonthlyExpenses = investments.reduce((sum, inv) => sum + inv.monthlyExpenses, 0);
    const netCashFlow = totalMonthlyIncome - totalMonthlyExpenses;
    
    // Calculate average cap rate
    const averageCapRate = investments.length > 0 
      ? (totalMonthlyIncome * 12) / totalPortfolioValue * 100 
      : 0;
    
    // Calculate total tax benefits (placeholder calculation)
    const totalTaxBenefits = investments.reduce((sum, inv) => 
      sum + (inv.totalTaxBenefits || 0), 0);
    
    const activeProperties = investments.filter(inv => inv.isInvestmentProperty).length;
    const recentActivity = await this.getActivities(10);

    return {
      totalProperties,
      totalPortfolioValue,
      totalNetEquity,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      netCashFlow,
      averageCapRate,
      totalTaxBenefits,
      activeProperties,
      recentActivity,
    };
  }

  // Data management
  async exportData() {
    const investments = await this.getInvestments();
    const scenarios = await this.getScenarios();
    const categories = await this.getCategories();

    return { investments, scenarios, categories };
  }

  async importInvestments(investmentsData: InsertRealEstateInvestment[]): Promise<RealEstateInvestment[]> {
    const importedInvestments: RealEstateInvestment[] = [];
    
    for (const investmentData of investmentsData) {
      try {
        const investment = await this.createInvestment(investmentData);
        importedInvestments.push(investment);
      } catch (error) {
        console.error(`Failed to import investment: ${investmentData.propertyName}`, error);
      }
    }
    
    return importedInvestments;
  }

  async clearAllData(): Promise<boolean> {
    this.investments.clear();
    this.scenarios.clear();
    this.activities.clear();
    // Keep categories and users
    return true;
  }
}

export const storage = new MemStorage();
