import { db } from '../lib/db.js';
import { budgets, transactions, categories } from '../db/schema/index.js';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

type CreateBudgetDto = {
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
};

export const budgetService = {
  async findAll(userId: string, month: number, year: number) {
    // Start/End of month for filtering transactions
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    return db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        limitAmount: budgets.limitAmount,
        month: budgets.month,
        year: budgets.year,
        // Calculate spent amount by aggregating transactions for this category in this month
        spent: sql<number>`
          COALESCE(
            (SELECT sum(CAST(amount AS numeric))
             FROM transaction t 
             WHERE t.category_id = budget.category_id 
             AND t.user_id = budget.user_id
             AND EXTRACT(MONTH FROM t.date) = ${month}
             AND EXTRACT(YEAR FROM t.date) = ${year}
             AND t.type = 'EXPENSE'), 0
          )
        `,
      })
      .from(budgets)
      .innerJoin(categories, eq(budgets.categoryId, categories.id))
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.month, month),
          eq(budgets.year, year)
        )
      );
  },

  async create(userId: string, data: CreateBudgetDto) {
    const [budget] = await db
      .insert(budgets)
      .values({ ...data, userId, limitAmount: data.limitAmount.toString() })
      .returning();
    return budget;
  },

  async update(id: string, userId: string, limitAmount: number) {
    const [budget] = await db
      .update(budgets)
      .set({ limitAmount: limitAmount.toString(), updatedAt: new Date() })
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();
    return budget;
  },

  async delete(id: string, userId: string) {
    const [deleted] = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();
    return deleted;
  },
};
