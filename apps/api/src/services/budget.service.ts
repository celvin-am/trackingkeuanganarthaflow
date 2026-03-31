import { db } from '../lib/db.js';
import { budgets, transactions, categories } from '../db/schema/index.js';
import { eq, and, sql, gte, lt } from 'drizzle-orm';

type CreateBudgetDto = {
  categoryId: string;
  limitAmount: number;
  month: number;
  year: number;
};

const JAKARTA_OFFSET_HOURS = 7;
const JAKARTA_OFFSET_MS = JAKARTA_OFFSET_HOURS * 60 * 60 * 1000;

function getJakartaMonthRangeUtc(month: number, year: number) {
  const startUtc = new Date(Date.UTC(year, month - 1, 1, -JAKARTA_OFFSET_HOURS, 0, 0, 0));
  const nextMonthStartUtc = new Date(Date.UTC(year, month, 1, -JAKARTA_OFFSET_HOURS, 0, 0, 0));

  return {
    startUtc,
    nextMonthStartUtc,
  };
}

export const budgetService = {
  async findAll(userId: string, month: number, year: number) {
    const { startUtc, nextMonthStartUtc } = getJakartaMonthRangeUtc(month, year);

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
        spent: sql<number>`
          COALESCE(
            (
              SELECT SUM(CAST(t.amount AS numeric))
              FROM transaction t
              WHERE t.category_id = ${budgets.categoryId}
                AND t.user_id = ${budgets.userId}
                AND t.type = 'EXPENSE'
                AND t.date >= ${startUtc}
                AND t.date < ${nextMonthStartUtc}
            ),
            0
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
      .values({
        ...data,
        userId,
        limitAmount: data.limitAmount.toString(),
      })
      .returning();

    return budget;
  },

  async update(id: string, userId: string, limitAmount: number) {
    const [budget] = await db
      .update(budgets)
      .set({
        limitAmount: limitAmount.toString(),
        updatedAt: new Date(),
      })
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