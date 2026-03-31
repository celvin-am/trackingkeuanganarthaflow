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

    const budgetRows = await db
      .select({
        id: budgets.id,
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        categoryIcon: categories.icon,
        categoryColor: categories.color,
        limitAmount: budgets.limitAmount,
        month: budgets.month,
        year: budgets.year,
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

    if (budgetRows.length === 0) {
      return [];
    }

    const spendingRows = await db
      .select({
        categoryId: transactions.categoryId,
        spent: sql<number>`CAST(SUM(${transactions.amount}) AS NUMERIC)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'EXPENSE'),
          gte(transactions.date, startUtc),
          lt(transactions.date, nextMonthStartUtc)
        )
      )
      .groupBy(transactions.categoryId);

    const spentMap = new Map<string, number>();

    for (const row of spendingRows) {
      if (!row.categoryId) continue;
      spentMap.set(row.categoryId, Number(row.spent || 0));
    }

    return budgetRows.map((budget) => ({
      ...budget,
      spent: spentMap.get(budget.categoryId) || 0,
    }));
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