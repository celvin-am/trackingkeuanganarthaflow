import { db } from '../lib/db.js';
import { categories, transactions } from '../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';

type CreateCategoryDto = {
  name: string;
  icon?: string;
  color?: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
};

export const categoryService = {
  async findAll(userId: string) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));

    if (existing.length === 0) {
      const defaults = [
        { name: 'Makan', icon: 'restaurant', color: 'bg-orange-500', type: 'EXPENSE', isDefault: true, userId },
        { name: 'Transport', icon: 'directions_car', color: 'bg-blue-500', type: 'EXPENSE', isDefault: true, userId },
        { name: 'Belanja', icon: 'shopping_bag', color: 'bg-pink-500', type: 'EXPENSE', isDefault: true, userId },
        { name: 'Komponen', icon: 'memory', color: 'bg-purple-500', type: 'EXPENSE', isDefault: true, userId },
        { name: 'Gaji', icon: 'payments', color: 'bg-green-500', type: 'INCOME', isDefault: true, userId },
      ];
      await db.insert(categories).values(defaults as any);
      
      // Re-fetch after insertion
      return db
        .select({
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
          type: categories.type,
          isDefault: categories.isDefault,
          usageCount: sql<number>`(SELECT count(*) FROM transaction WHERE category_id = category.id)`,
        })
        .from(categories)
        .where(eq(categories.userId, userId));
    }

    return db
      .select({
        id: categories.id,
        name: categories.name,
        icon: categories.icon,
        color: categories.color,
        type: categories.type,
        isDefault: categories.isDefault,
        usageCount: sql<number>`(SELECT count(*) FROM transaction WHERE category_id = category.id)`,
      })
      .from(categories)
      .where(eq(categories.userId, userId));
  },

  async create(userId: string, data: CreateCategoryDto) {
    const [category] = await db
      .insert(categories)
      .values({ ...data, userId, isDefault: false })
      .returning();
    return category;
  },

  async update(id: string, userId: string, data: Partial<CreateCategoryDto>) {
    const [category] = await db
      .update(categories)
      .set(data)
      .where(and(eq(categories.id, id), eq(categories.userId, userId), eq(categories.isDefault, false)))
      .returning();
    return category;
  },

  async delete(id: string, userId: string) {
    // Only allow deleting custom categories, not defaults
    const [deleted] = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId), eq(categories.isDefault, false)))
      .returning();
    return deleted;
  },
};
