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
  type DashboardStats
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private investments: Map<string, RealEstateInvestment> = new Map();
  private scenarios: Map<string, InvestmentScenario> = new Map();
  private activities: Map<string, Activity> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default categories for real estate
    const defaultCategories: InsertCategory[] = [
      { name: "Residential", description: "Single-family homes, condos, and townhouses", color: "#3b82f6", icon: "home" },
      { name: "Commercial", description: "Office buildings, retail spaces", color: "#10b981", icon: "building" },
      { name: "Multi-Family", description: "Apartment buildings and duplexes", color: "#f59e0b", icon: "building-2" },
    ];

    defaultCategories.forEach(category => {
      const id = randomUUID();
      this.categories.set(id, {
        ...category,
        id,
        createdAt: new Date(),
      });
    });

    // Create sample real estate investments
    const residentialCategory = Array.from(this.categories.values()).find(c => c.name === "Residential");
    const commercialCategory = Array.from(this.categories.values()).find(c => c.name === "Commercial");

    if (residentialCategory) {
      const sampleProperty: InsertRealEstateInvestment = {
        propertyName: "123 Main Street",
        address: "123 Main Street, San Francisco, CA 94102",
        purchasePrice: 75000000, // $750,000.00
        currentValue: 85000000, // $850,000.00
        netEquity: 55000000, // $550,000.00
        downPayment: 25000000, // $250,000.00
        loanAmount: 50000000, // $500,000.00
        interestRate: 375, // 3.75%
        loanTerm: 360, // 30 years
        monthlyMortgage: 231600, // $2,316.00
        monthlyRent: 350000, // $3,500.00
        isInvestmentProperty: true,
        monthlyExpenses: 185000, // $1,850.00
        expenseDetails: {
          annualPropertyTaxes: 900000, // $9,000.00 annual
          annualInsurance: 120000, // $1,200.00 annual
          monthlyManagementFees: 17500, // $175.00
          monthlyMaintenance: 50000, // $500.00
        },
        monthlyEscrow: 75000, // $750.00
        avgAppreciationRate: 350, // 3.5%
        outstandingBalance: 48500000, // $485,000.00
        currentTerm: 24, // 2 years since purchase
        propertyType: "single-family",
        purchaseDate: new Date("2022-01-15"),
        group: "Bay_Area",
        country: "USA",
        zipCode: "94102",
        taxRate: 2200, // 22%
        costBasis: 75000000,
      };

      const id = randomUUID();
      this.investments.set(id, {
        ...sampleProperty,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create default user
    const defaultUser: InsertUser = {
      username: "admin",
      email: "admin@company.com",
      name: "System Administrator",
      jobTitle: "Asset Manager",
      preferences: {
        theme: "system",
        density: "standard",
        notifications: true,
      },
    };

    const userId = randomUUID();
    this.users.set(userId, {
      ...defaultUser,
      id: userId,
      createdAt: new Date(),
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      ...insertCategory,
      id,
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const category = this.categories.get(id);
    if (!category) throw new Error("Category not found");
    
    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Real Estate Investments
  async getInvestments(filters?: { categoryId?: string; group?: string; search?: string }): Promise<RealEstateInvestmentWithCategory[]> {
    let investments = Array.from(this.investments.values());

    if (filters?.categoryId) {
      // For real estate, we might not always have categories, so handle this gracefully
      investments = investments.filter(investment => {
        // Since real estate doesn't have categoryId in our schema, we might need to add it
        // For now, skip this filter
        return true;
      });
    }

    if (filters?.group) {
      investments = investments.filter(investment => investment.group === filters.group);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      investments = investments.filter(investment => 
        investment.propertyName.toLowerCase().includes(search) ||
        investment.address.toLowerCase().includes(search) ||
        investment.propertyType.toLowerCase().includes(search) ||
        investment.country?.toLowerCase().includes(search)
      );
    }

    return investments.map(investment => ({
      ...investment,
      category: undefined, // Real estate investments don't have categories in our current schema
    }));
  }

  async getInvestment(id: string): Promise<RealEstateInvestmentWithCategory | undefined> {
    const investment = this.investments.get(id);
    if (!investment) return undefined;

    return {
      ...investment,
      category: undefined,
    };
  }

  async createInvestment(insertInvestment: InsertRealEstateInvestment): Promise<RealEstateInvestment> {
    const id = randomUUID();
    const investment: RealEstateInvestment = {
      ...insertInvestment,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.investments.set(id, investment);

    // Create activity
    await this.createActivity({
      type: "created",
      entityType: "property",
      entityId: id,
      entityName: investment.propertyName,
      description: `New property "${investment.propertyName}" added to portfolio`,
      userId: undefined,
      metadata: { group: investment.group, propertyType: investment.propertyType },
    });

    return investment;
  }

  async updateInvestment(id: string, updates: Partial<RealEstateInvestment>): Promise<RealEstateInvestment> {
    const investment = this.investments.get(id);
    if (!investment) throw new Error("Investment not found");
    
    const updatedInvestment = { 
      ...investment, 
      ...updates, 
      updatedAt: new Date(),
    };
    this.investments.set(id, updatedInvestment);

    // Create activity
    await this.createActivity({
      type: "updated",
      entityType: "property",
      entityId: id,
      entityName: updatedInvestment.propertyName,
      description: `Property "${updatedInvestment.propertyName}" updated`,
      userId: undefined,
      metadata: { changes: Object.keys(updates) },
    });

    return updatedInvestment;
  }

  async deleteInvestment(id: string): Promise<boolean> {
    const investment = this.investments.get(id);
    if (investment) {
      await this.createActivity({
        type: "deleted",
        entityType: "property",
        entityId: id,
        entityName: investment.propertyName,
        description: `Property "${investment.propertyName}" removed from portfolio`,
        userId: undefined,
        metadata: {},
      });
    }
    return this.investments.delete(id);
  }

  // Investment Scenarios
  async getScenarios(filters?: { categoryId?: string; search?: string }): Promise<InvestmentScenarioWithCategory[]> {
    let scenarios = Array.from(this.scenarios.values());

    if (filters?.categoryId) {
      scenarios = scenarios.filter(scenario => scenario.categoryId === filters.categoryId);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      scenarios = scenarios.filter(scenario => 
        scenario.name.toLowerCase().includes(search) ||
        scenario.description.toLowerCase().includes(search) ||
        scenario.type?.toLowerCase().includes(search)
      );
    }

    return scenarios.map(scenario => ({
      ...scenario,
      category: scenario.categoryId ? this.categories.get(scenario.categoryId) : undefined,
    }));
  }

  async getScenario(id: string): Promise<InvestmentScenarioWithCategory | undefined> {
    const scenario = this.scenarios.get(id);
    if (!scenario) return undefined;

    return {
      ...scenario,
      category: scenario.categoryId ? this.categories.get(scenario.categoryId) : undefined,
    };
  }

  async createScenario(insertScenario: InsertInvestmentScenario): Promise<InvestmentScenario> {
    const id = randomUUID();
    const scenario: InvestmentScenario = {
      ...insertScenario,
      id,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.scenarios.set(id, scenario);

    await this.createActivity({
      type: "created",
      entityType: "scenario",
      entityId: id,
      entityName: scenario.name,
      description: `New investment scenario "${scenario.name}" created`,
      userId: undefined,
      metadata: { categoryId: scenario.categoryId, type: scenario.type },
    });

    return scenario;
  }

  async updateScenario(id: string, updates: Partial<InvestmentScenario>): Promise<InvestmentScenario> {
    const scenario = this.scenarios.get(id);
    if (!scenario) throw new Error("Investment scenario not found");
    
    const updatedScenario = { 
      ...scenario, 
      ...updates, 
      updatedAt: new Date(),
    };
    this.scenarios.set(id, updatedScenario);

    await this.createActivity({
      type: "updated",
      entityType: "scenario",
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
