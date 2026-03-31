import { db } from '../lib/db.js';
import { transactions, wallets, budgets, categories } from '../db/schema/index.js';
import { eq, and, sql, gte, sum, lt } from 'drizzle-orm';

const JAKARTA_OFFSET_HOURS = 7;
const JAKARTA_OFFSET_MS = JAKARTA_OFFSET_HOURS * 60 * 60 * 1000;

function getJakartaNow() {
  return new Date(Date.now() + JAKARTA_OFFSET_MS);
}

function getJakartaMonthYear(inputMonth?: number, inputYear?: number) {
  if (inputMonth && inputYear) {
    return { month: inputMonth, year: inputYear };
  }

  const now = getJakartaNow();
  return {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
  };
}

function getJakartaMonthRangeUtc(month: number, year: number) {
  const startUtc = new Date(Date.UTC(year, month - 1, 1, -JAKARTA_OFFSET_HOURS, 0, 0, 0));
  const nextMonthStartUtc = new Date(Date.UTC(year, month, 1, -JAKARTA_OFFSET_HOURS, 0, 0, 0));

  return {
    startUtc,
    nextMonthStartUtc,
  };
}

function getJakartaDateKey(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const local = new Date(d.getTime() + JAKARTA_OFFSET_MS);

  const year = local.getUTCFullYear();
  const month = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getRangeStartUtc(range: string) {
  const nowLocal = getJakartaNow();

  if (range === '1W') {
    const startLocal = new Date(
      Date.UTC(
        nowLocal.getUTCFullYear(),
        nowLocal.getUTCMonth(),
        nowLocal.getUTCDate() - 6,
        0,
        0,
        0,
        0
      )
    );
    return new Date(startLocal.getTime() - JAKARTA_OFFSET_MS);
  }

  if (range === '1Y') {
    const startLocal = new Date(
      Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth() - 11, 1, 0, 0, 0, 0)
    );
    return new Date(startLocal.getTime() - JAKARTA_OFFSET_MS);
  }

  const startLocal = new Date(
    Date.UTC(
      nowLocal.getUTCFullYear(),
      nowLocal.getUTCMonth(),
      nowLocal.getUTCDate() - 29,
      0,
      0,
      0,
      0
    )
  );
  return new Date(startLocal.getTime() - JAKARTA_OFFSET_MS);
}

function formatTrendLabel(dateKey: string, range: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));

  if (range === '1W') {
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: 'UTC',
    });
  }

  if (range === '1Y') {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    });
  }

  return d.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
}

export const dashboardService = {
  async getStats(userId: string, inputMonth?: number, inputYear?: number) {
    const { month, year } = getJakartaMonthYear(inputMonth, inputYear);
    const { startUtc, nextMonthStartUtc } = getJakartaMonthRangeUtc(month, year);

    const [{ totalBalance }] = await db
      .select({ totalBalance: sum(wallets.balance) })
      .from(wallets)
      .where(eq(wallets.userId, userId));

    const result = await db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startUtc),
          lt(transactions.date, nextMonthStartUtc)
        )
      )
      .groupBy(transactions.type);

    let income = 0;
    let expense = 0;

    for (const row of result) {
      if (row.type === 'INCOME') income = Number(row.total || 0);
      if (row.type === 'EXPENSE') expense = Number(row.total || 0);
    }

    return {
      totalBalance: Number(totalBalance || 0),
      monthlyIncome: income,
      monthlyExpense: expense,
      healthScore: await this.getHealthScore(userId, month, year),
    };
  },

  async getHealthScore(userId: string, inputMonth?: number, inputYear?: number) {
    const { month, year } = getJakartaMonthYear(inputMonth, inputYear);
    const { startUtc, nextMonthStartUtc } = getJakartaMonthRangeUtc(month, year);

    const monthlyTransactions = await db
      .select({
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startUtc),
          lt(transactions.date, nextMonthStartUtc)
        )
      );

    let income = 0;
    let expense = 0;
    const activeDayKeys = new Set<string>();

    for (const row of monthlyTransactions) {
      if (row.type === 'INCOME') income += Number(row.amount || 0);
      if (row.type === 'EXPENSE') expense += Number(row.amount || 0);
      if (row.date) activeDayKeys.add(getJakartaDateKey(row.date));
    }

    const savings = income - expense;
    const savingsRatio = income > 0 ? Math.max(0, Math.min(savings / income, 1)) : 0;

    const budgetStats = await db
      .select({ totalLimit: sum(budgets.limitAmount) })
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.month, month),
          eq(budgets.year, year)
        )
      );

    const totalBudget = Number(budgetStats[0]?.totalLimit || 0);
    const remainingBudget = Math.max(0, totalBudget - expense);
    const budgetRatio = totalBudget > 0 ? remainingBudget / totalBudget : 0;

    const nowJakarta = getJakartaNow();
    const isCurrentMonth =
      nowJakarta.getUTCFullYear() === year && nowJakarta.getUTCMonth() + 1 === month;

    const daysElapsed = isCurrentMonth
      ? Math.max(1, nowJakarta.getUTCDate())
      : new Date(Date.UTC(year, month, 0)).getUTCDate();

    const consistency = Math.min(activeDayKeys.size / daysElapsed, 1);

    const score = savingsRatio * 0.4 + budgetRatio * 0.3 + consistency * 0.3;
    const finalScore = Math.round(score * 100);

    return income === 0 && expense === 0 && totalBudget === 0 ? 50 : finalScore;
  },

  async getExpenseDistribution(userId: string, month: number, year: number) {
    const { startUtc, nextMonthStartUtc } = getJakartaMonthRangeUtc(month, year);

    const rows = await db
      .select({
        categoryName: categories.name,
        color: categories.color,
        amount: sql<number>`CAST(SUM(${transactions.amount}) AS NUMERIC)`,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'EXPENSE'),
          gte(transactions.date, startUtc),
          lt(transactions.date, nextMonthStartUtc)
        )
      )
      .groupBy(categories.id, categories.name, categories.color)
      .orderBy(sql`SUM(${transactions.amount}) DESC`);

    return rows.map((row) => ({
      ...row,
      amount: Number(row.amount || 0),
    }));
  },

  async getBalanceTrend(userId: string, range = '1M') {
    const startUtc = getRangeStartUtc(range);

    const rows = await db
      .select({
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), gte(transactions.date, startUtc)))
      .orderBy(transactions.date);

    const bucket = new Map<string, { income: number; expense: number }>();

    for (const row of rows) {
      if (!row.date) continue;

      const dateKey = getJakartaDateKey(row.date);
      const current = bucket.get(dateKey) || { income: 0, expense: 0 };

      if (row.type === 'INCOME') current.income += Number(row.amount || 0);
      if (row.type === 'EXPENSE') current.expense += Number(row.amount || 0);

      bucket.set(dateKey, current);
    }

    const sortedKeys = [...bucket.keys()].sort();

    return sortedKeys.map((dateKey) => ({
      month: formatTrendLabel(dateKey, range),
      income: bucket.get(dateKey)?.income || 0,
      expense: bucket.get(dateKey)?.expense || 0,
    }));
  },
};