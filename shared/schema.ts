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

export const assets = pgTable("assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  serialNumber: text("serial_number"),
  model: text("model"),
  manufacturer: text("manufacturer"),
  purchaseDate: timestamp("purchase_date"),
  purchasePrice: integer("purchase_price"), // Store as cents
  currentValue: integer("current_value"), // Store as cents
  location: text("location"),
  assignedTo: text("assigned_to"),
  status: text("status").notNull().default("active"), // active, inactive, maintenance, disposed
  tags: text("tags").array().default([]),
  specifications: jsonb("specifications").default({}),
  maintenanceSchedule: jsonb("maintenance_schedule").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dictionaryEntries = pgTable("dictionary_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  categoryId: varchar("category_id").references(() => categories.id),
  type: text("type"), // Product type or variant
  specifications: jsonb("specifications").default({}),
  estimatedValue: integer("estimated_value"), // Store as cents
  expectedLifecycle: text("expected_lifecycle"),
  maintenanceRequirements: text("maintenance_requirements"),
  relatedAssets: text("related_assets").array().default([]),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // created, updated, deleted, reviewed, etc.
  entityType: text("entity_type").notNull(), // asset, dictionary, category
  entityId: varchar("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  description: text("description").notNull(),
  userId: varchar("user_id").references(() => users.id),
  metadata: jsonb("metadata").default({}),
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

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDictionaryEntrySchema = createInsertSchema(dictionaryEntries).omit({
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

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type DictionaryEntry = typeof dictionaryEntries.$inferSelect;
export type InsertDictionaryEntry = z.infer<typeof insertDictionaryEntrySchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// Extended types for UI
export type AssetWithCategory = Asset & {
  category?: Category;
};

export type DictionaryEntryWithCategory = DictionaryEntry & {
  category?: Category;
};

// Dashboard statistics type
export type DashboardStats = {
  totalAssets: number;
  activeItems: number;
  pendingReviews: number;
  totalValue: number;
  categories: Array<{
    id: string;
    name: string;
    count: number;
    color: string;
  }>;
  recentActivity: Activity[];
};
