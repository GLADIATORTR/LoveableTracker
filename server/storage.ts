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
  type MarketSentiment,
  type InsertMarketSentiment,
  type RealEstateInvestmentWithCategory,
  type InvestmentScenarioWithCategory,
  type DashboardStats,
  users,
  categories,
  realEstateInvestments,
  investmentScenarios,
  activities,
  marketSentiment
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and } from "drizzle-orm";

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

  // Market Sentiment
  getLatestMarketSentiment(): Promise<MarketSentiment | undefined>;
  getMarketSentimentHistory(limit?: number): Promise<MarketSentiment[]>;
  createMarketSentiment(sentiment: InsertMarketSentiment): Promise<MarketSentiment>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;

  // Data management
  exportData(): Promise<{ investments: RealEstateInvestmentWithCategory[]; scenarios: InvestmentScenarioWithCategory[]; categories: Category[] }>;
  importInvestments(investments: InsertRealEstateInvestment[]): Promise<RealEstateInvestment[]>;
  clearAllData(): Promise<boolean>;
  clearAllUserData(): Promise<boolean>;

  // Initialization
  initializeDefaultData(): Promise<void>;
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
    return (result.rowCount ?? 0) > 0;
  }

  // Investment operations
  async getInvestments(filters?: { categoryId?: string; group?: string; search?: string }): Promise<RealEstateInvestmentWithCategory[]> {
    const conditions = [];
    if (filters?.search) {
      conditions.push(like(realEstateInvestments.propertyName, `%${filters.search}%`));
    }
    if (filters?.group) {
      conditions.push(eq(realEstateInvestments.group, filters.group));
    }
    if (filters?.categoryId) {
      conditions.push(eq(realEstateInvestments.group, filters.categoryId));
    }

    let investments;
    if (conditions.length > 0) {
      investments = await db.select().from(realEstateInvestments).where(and(...conditions));
    } else {
      investments = await db.select().from(realEstateInvestments);
    }

    // Get categories for each investment
    const categoriesMap = new Map<string, Category>();
    const allCategories = await this.getCategories();
    allCategories.forEach(cat => categoriesMap.set(cat.name, cat));

    return investments.map(investment => ({
      ...investment,
      category: investment.group ? categoriesMap.get(investment.group) : undefined
    }));
  }

  async getInvestment(id: string): Promise<RealEstateInvestmentWithCategory | undefined> {
    const [investment] = await db.select().from(realEstateInvestments)
      .where(eq(realEstateInvestments.id, id));

    if (!investment) return undefined;

    // Get category if exists
    let category: Category | undefined;
    if (investment.group) {
      const categories = await this.getCategories();
      category = categories.find(cat => cat.name === investment.group);
    }

    return {
      ...investment,
      category
    };
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
    return (result.rowCount ?? 0) > 0;
  }

  // Scenario operations (simplified for now)
  async getScenarios(filters?: { categoryId?: string; search?: string }): Promise<InvestmentScenarioWithCategory[]> {
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
    return (result.rowCount ?? 0) > 0;
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
    
    const totalInvestment = investments.reduce((sum, inv) => sum + inv.purchasePrice, 0);
    
    return {
      totalProperties,
      totalPortfolioValue,
      totalInvestment,
      averageROI: totalInvestment > 0 ? Math.round(((totalPortfolioValue - totalInvestment) / totalInvestment) * 100) : 0,
      totalNetEquity: totalEquity,
      totalMonthlyRent,
      topPerformingProperties: investments
        .sort((a, b) => b.currentValue - b.purchasePrice - (a.currentValue - a.purchasePrice))
        .slice(0, 3)
        .map(inv => ({
          id: inv.id,
          name: inv.propertyName,
          roi: inv.purchasePrice > 0 ? Math.round(((inv.currentValue - inv.purchasePrice) / inv.purchasePrice) * 100) : 0
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

  async clearAllUserData(): Promise<boolean> {
    try {
      // Delete all user data but keep categories (they're system data)
      await db.delete(activities);
      await db.delete(investmentScenarios);
      await db.delete(realEstateInvestments);
      await db.delete(marketSentiment);
      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }

  // Market Sentiment methods
  async getLatestMarketSentiment(): Promise<MarketSentiment | undefined> {
    const results = await db.select()
      .from(marketSentiment)
      .orderBy(desc(marketSentiment.timestamp))
      .limit(1);
    return results[0];
  }

  async getMarketSentimentHistory(limit: number = 30): Promise<MarketSentiment[]> {
    return db.select()
      .from(marketSentiment)
      .orderBy(desc(marketSentiment.timestamp))
      .limit(limit);
  }

  async createMarketSentiment(sentiment: InsertMarketSentiment): Promise<MarketSentiment> {
    const results = await db.insert(marketSentiment)
      .values(sentiment)
      .returning();
    return results[0];
  }
}

export const storage = new DatabaseStorage();