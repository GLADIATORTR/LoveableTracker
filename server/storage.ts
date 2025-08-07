import { 
  type User, 
  type InsertUser, 
  type Asset, 
  type InsertAsset,
  type Category,
  type InsertCategory,
  type DictionaryEntry,
  type InsertDictionaryEntry,
  type Activity,
  type InsertActivity,
  type AssetWithCategory,
  type DictionaryEntryWithCategory,
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

  // Assets
  getAssets(filters?: { categoryId?: string; status?: string; search?: string }): Promise<AssetWithCategory[]>;
  getAsset(id: string): Promise<AssetWithCategory | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: string, updates: Partial<Asset>): Promise<Asset>;
  deleteAsset(id: string): Promise<boolean>;

  // Dictionary
  getDictionaryEntries(filters?: { categoryId?: string; search?: string }): Promise<DictionaryEntryWithCategory[]>;
  getDictionaryEntry(id: string): Promise<DictionaryEntryWithCategory | undefined>;
  createDictionaryEntry(entry: InsertDictionaryEntry): Promise<DictionaryEntry>;
  updateDictionaryEntry(id: string, updates: Partial<DictionaryEntry>): Promise<DictionaryEntry>;
  deleteDictionaryEntry(id: string): Promise<boolean>;

  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;

  // Data management
  exportData(): Promise<{ assets: AssetWithCategory[]; dictionary: DictionaryEntryWithCategory[]; categories: Category[] }>;
  importAssets(assets: InsertAsset[]): Promise<Asset[]>;
  clearAllData(): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private assets: Map<string, Asset> = new Map();
  private dictionaryEntries: Map<string, DictionaryEntry> = new Map();
  private activities: Map<string, Activity> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default categories
    const defaultCategories: InsertCategory[] = [
      { name: "Electronics", description: "Electronic devices and equipment", color: "#3b82f6", icon: "monitor" },
      { name: "Furniture", description: "Office and workspace furniture", color: "#10b981", icon: "chair" },
      { name: "Equipment", description: "Tools and machinery", color: "#f59e0b", icon: "tool" },
      { name: "Vehicles", description: "Transportation assets", color: "#ef4444", icon: "car" },
    ];

    defaultCategories.forEach(category => {
      const id = randomUUID();
      this.categories.set(id, {
        ...category,
        id,
        createdAt: new Date(),
      });
    });

    // Create default dictionary entries
    const electronicsCategory = Array.from(this.categories.values()).find(c => c.name === "Electronics");
    const furnitureCategory = Array.from(this.categories.values()).find(c => c.name === "Furniture");
    const equipmentCategory = Array.from(this.categories.values()).find(c => c.name === "Equipment");

    if (electronicsCategory) {
      const macbookEntry: InsertDictionaryEntry = {
        name: "MacBook Pro",
        description: "Professional laptop computer designed for high-performance computing tasks, creative work, and software development.",
        categoryId: electronicsCategory.id,
        type: "M3 Max",
        specifications: {
          processor: "Apple M3 Max",
          memory: "32GB unified memory",
          storage: "1TB SSD",
          display: "16-inch Liquid Retina XDR",
        },
        estimatedValue: 320000, // $3,200.00
        expectedLifecycle: "4-5 years",
        maintenanceRequirements: "Regular software updates, battery calibration, screen cleaning",
        relatedAssets: [],
        usageCount: 47,
      };

      const id = randomUUID();
      this.dictionaryEntries.set(id, {
        ...macbookEntry,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (furnitureCategory) {
      const chairEntry: InsertDictionaryEntry = {
        name: "Office Chair",
        description: "Ergonomic office seating designed for extended work periods with adjustable height, lumbar support, and mobility.",
        categoryId: furnitureCategory.id,
        type: "Ergonomic",
        specifications: {
          material: "Mesh back, fabric seat",
          adjustability: "Height, armrests, lumbar",
          weightCapacity: "300 lbs",
          warranty: "5 years",
        },
        estimatedValue: 45000, // $450.00
        expectedLifecycle: "7-10 years",
        maintenanceRequirements: "Regular cleaning, occasional wheel replacement, mechanism lubrication",
        relatedAssets: [],
        usageCount: 234,
      };

      const id = randomUUID();
      this.dictionaryEntries.set(id, {
        ...chairEntry,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (equipmentCategory) {
      const printerEntry: InsertDictionaryEntry = {
        name: "Industrial Printer",
        description: "High-capacity printing equipment for large-volume document production with advanced paper handling and finishing options.",
        categoryId: equipmentCategory.id,
        type: "Commercial",
        specifications: {
          printSpeed: "50,000 pages/month",
          paperSize: "Up to A3",
          connectivity: "Ethernet, WiFi, USB",
          features: "Duplex, stapling, hole punching",
        },
        estimatedValue: 1280000, // $12,800.00
        expectedLifecycle: "5-7 years",
        maintenanceRequirements: "Monthly cleaning, quarterly servicing, annual calibration",
        relatedAssets: [],
        usageCount: 12,
      };

      const id = randomUUID();
      this.dictionaryEntries.set(id, {
        ...printerEntry,
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

  // Assets
  async getAssets(filters?: { categoryId?: string; status?: string; search?: string }): Promise<AssetWithCategory[]> {
    let assets = Array.from(this.assets.values());

    if (filters?.categoryId) {
      assets = assets.filter(asset => asset.categoryId === filters.categoryId);
    }

    if (filters?.status) {
      assets = assets.filter(asset => asset.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      assets = assets.filter(asset => 
        asset.name.toLowerCase().includes(search) ||
        asset.description?.toLowerCase().includes(search) ||
        asset.model?.toLowerCase().includes(search) ||
        asset.manufacturer?.toLowerCase().includes(search)
      );
    }

    return assets.map(asset => ({
      ...asset,
      category: asset.categoryId ? this.categories.get(asset.categoryId) : undefined,
    }));
  }

  async getAsset(id: string): Promise<AssetWithCategory | undefined> {
    const asset = this.assets.get(id);
    if (!asset) return undefined;

    return {
      ...asset,
      category: asset.categoryId ? this.categories.get(asset.categoryId) : undefined,
    };
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = randomUUID();
    const asset: Asset = {
      ...insertAsset,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.assets.set(id, asset);

    // Create activity
    await this.createActivity({
      type: "created",
      entityType: "asset",
      entityId: id,
      entityName: asset.name,
      description: `New asset "${asset.name}" added to inventory`,
      userId: undefined,
      metadata: { categoryId: asset.categoryId },
    });

    return asset;
  }

  async updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
    const asset = this.assets.get(id);
    if (!asset) throw new Error("Asset not found");
    
    const updatedAsset = { 
      ...asset, 
      ...updates, 
      updatedAt: new Date(),
    };
    this.assets.set(id, updatedAsset);

    // Create activity
    await this.createActivity({
      type: "updated",
      entityType: "asset",
      entityId: id,
      entityName: updatedAsset.name,
      description: `Asset "${updatedAsset.name}" updated`,
      userId: undefined,
      metadata: { changes: Object.keys(updates) },
    });

    return updatedAsset;
  }

  async deleteAsset(id: string): Promise<boolean> {
    const asset = this.assets.get(id);
    if (asset) {
      await this.createActivity({
        type: "deleted",
        entityType: "asset",
        entityId: id,
        entityName: asset.name,
        description: `Asset "${asset.name}" removed from inventory`,
        userId: undefined,
        metadata: {},
      });
    }
    return this.assets.delete(id);
  }

  // Dictionary
  async getDictionaryEntries(filters?: { categoryId?: string; search?: string }): Promise<DictionaryEntryWithCategory[]> {
    let entries = Array.from(this.dictionaryEntries.values());

    if (filters?.categoryId) {
      entries = entries.filter(entry => entry.categoryId === filters.categoryId);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      entries = entries.filter(entry => 
        entry.name.toLowerCase().includes(search) ||
        entry.description.toLowerCase().includes(search) ||
        entry.type?.toLowerCase().includes(search)
      );
    }

    return entries.map(entry => ({
      ...entry,
      category: entry.categoryId ? this.categories.get(entry.categoryId) : undefined,
    }));
  }

  async getDictionaryEntry(id: string): Promise<DictionaryEntryWithCategory | undefined> {
    const entry = this.dictionaryEntries.get(id);
    if (!entry) return undefined;

    return {
      ...entry,
      category: entry.categoryId ? this.categories.get(entry.categoryId) : undefined,
    };
  }

  async createDictionaryEntry(insertEntry: InsertDictionaryEntry): Promise<DictionaryEntry> {
    const id = randomUUID();
    const entry: DictionaryEntry = {
      ...insertEntry,
      id,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.dictionaryEntries.set(id, entry);

    await this.createActivity({
      type: "created",
      entityType: "dictionary",
      entityId: id,
      entityName: entry.name,
      description: `New dictionary entry "${entry.name}" added`,
      userId: undefined,
      metadata: { categoryId: entry.categoryId },
    });

    return entry;
  }

  async updateDictionaryEntry(id: string, updates: Partial<DictionaryEntry>): Promise<DictionaryEntry> {
    const entry = this.dictionaryEntries.get(id);
    if (!entry) throw new Error("Dictionary entry not found");
    
    const updatedEntry = { 
      ...entry, 
      ...updates, 
      updatedAt: new Date(),
    };
    this.dictionaryEntries.set(id, updatedEntry);

    await this.createActivity({
      type: "updated",
      entityType: "dictionary",
      entityId: id,
      entityName: updatedEntry.name,
      description: `Dictionary entry "${updatedEntry.name}" updated`,
      userId: undefined,
      metadata: { changes: Object.keys(updates) },
    });

    return updatedEntry;
  }

  async deleteDictionaryEntry(id: string): Promise<boolean> {
    const entry = this.dictionaryEntries.get(id);
    if (entry) {
      await this.createActivity({
        type: "deleted",
        entityType: "dictionary",
        entityId: id,
        entityName: entry.name,
        description: `Dictionary entry "${entry.name}" removed`,
        userId: undefined,
        metadata: {},
      });
    }
    return this.dictionaryEntries.delete(id);
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
    const totalAssets = this.assets.size;
    const activeItems = Array.from(this.assets.values()).filter(a => a.status === "active").length;
    const pendingReviews = Math.floor(totalAssets * 0.05); // 5% pending reviews
    
    const totalValue = Array.from(this.assets.values())
      .reduce((sum, asset) => sum + (asset.currentValue || asset.purchasePrice || 0), 0);

    const categories = Array.from(this.categories.values()).map(category => ({
      id: category.id,
      name: category.name,
      color: category.color,
      count: Array.from(this.assets.values()).filter(a => a.categoryId === category.id).length,
    }));

    const recentActivity = await this.getActivities(10);

    return {
      totalAssets,
      activeItems,
      pendingReviews,
      totalValue,
      categories,
      recentActivity,
    };
  }

  // Data management
  async exportData() {
    const assets = await this.getAssets();
    const dictionary = await this.getDictionaryEntries();
    const categories = await this.getCategories();

    return { assets, dictionary, categories };
  }

  async importAssets(assetsData: InsertAsset[]): Promise<Asset[]> {
    const importedAssets: Asset[] = [];
    
    for (const assetData of assetsData) {
      const asset = await this.createAsset(assetData);
      importedAssets.push(asset);
    }

    return importedAssets;
  }

  async clearAllData(): Promise<boolean> {
    this.assets.clear();
    this.dictionaryEntries.clear();
    this.activities.clear();
    
    // Keep categories and reinitialize
    this.initializeDefaultData();
    
    await this.createActivity({
      type: "system",
      entityType: "system",
      entityId: "system",
      entityName: "Data Management",
      description: "All data cleared and system reset",
      userId: undefined,
      metadata: {},
    });

    return true;
  }
}

export const storage = new MemStorage();
