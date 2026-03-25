import { db } from '../lib/db.js';
import { transactions, wallets, budgets, categories } from '../db/schema/index.js';
import { eq, and, sql, gte, sum, lte } from 'drizzle-orm';

export const dashboardService = {
  async getStats(userId: string) {
    const now = new Date();

    // Total Balance
    const [{ totalBalance }] = await db
      .select({ totalBalance: sum(wallets.balance) })
      .from(wallets)
      .where(eq(wallets.userId, userId));

    // Monthly Income & Expense
    const result = await db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`EXTRACT(MONTH FROM ${transactions.date}) = ${now.getMonth() + 1}`,
          sql`EXTRACT(YEAR FROM ${transactions.date}) = ${now.getFullYear()}`
        )
      )
      .groupBy(transactions.type);

    let income = 0;
    let expense = 0;

    for (const row of result) {
      if (row.type === 'INCOME') income = Number(row.total);
      if (row.type === 'EXPENSE') expense = Number(row.total);
    }

    return {
      totalBalance: Number(totalBalance || 0),
      monthlyIncome: income,
      monthlyExpense: expense,
      healthScore: await this.getHealthScore(userId),
    };
  },

  async getHealthScore(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Savings Ratio
    const statsResult = await db
      .select({
        type: transactions.type,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), gte(transactions.date, startOfMonth)))
      .groupBy(transactions.type);

    let income = 0;
    let expense = 0;
    for (const row of statsResult) {
      if (row.type === 'INCOME') income = Number(row.total);
      if (row.type === 'EXPENSE') expense = Number(row.total);
    }

    const savings = income - expense;
    const savingsRatio = income > 0 ? Math.max(0, Math.min(savings / income, 1)) : 0;

    // 2. Budget Ratio
    const budgetStats = await db
      .select({ totalLimit: sum(budgets.limitAmount) })
      .from(budgets)
      .where(and(eq(budgets.userId, userId), eq(budgets.month, now.getMonth() + 1), eq(budgets.year, now.getFullYear())));

    const totalBudget = Number(budgetStats[0]?.totalLimit || 0);
    const remainingBudget = Math.max(0, totalBudget - expense);
    const budgetRatio = totalBudget > 0 ? (remainingBudget / totalBudget) : 0;

    // 3. Consistency
    const daysElapsed = Math.max(1, now.getDate());

    // 🔥 FIX 1: Cast ke any dan hapus .rows
    const distinctDaysRes = await db.execute(sql`
      SELECT COUNT(DISTINCT DATE(date)) as count 
      FROM transaction 
      WHERE user_id = ${userId} 
      AND date >= ${startOfMonth.toISOString()}
    `) as any;

    const activeDays = Number(distinctDaysRes[0]?.count || 0);
    const consistency = Math.min(activeDays / daysElapsed, 1);

    const score = (savingsRatio * 0.4) + (budgetRatio * 0.3) + (consistency * 0.3);
    const finalScore = Math.round(score * 100);

    return (income === 0 && expense === 0 && totalBudget === 0) ? 50 : finalScore;
  },

  async getExpenseDistribution(userId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

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
          gte(transactions.date, new Date(startDate)),
          lte(transactions.date, new Date(endDate))
        )
      )
      .groupBy(categories.id, categories.name, categories.color)
      .orderBy(sql`sum(${transactions.amount}) DESC`);

    return rows.map(r => ({
      ...r,
      amount: Number(r.amount || 0)
    }));
  },

  async getBalanceTrend(userId: string, range = '1M') {
    let interval = '29 days';
    let step = '1 day';
    let format = 'DD Mon';

    if (range === '1W') {
      interval = '6 days';
      step = '1 day';
      format = 'Dy';
    } else if (range === '1Y') {
      interval = '1 year';
      step = '1 month';
      format = 'Mon YY';
    }

    // 🔥 FIX 2: Cast ke any dan hapus .rows
    const result = await db.execute(sql`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - ${sql.raw(`INTERVAL '${interval}'`)},
          CURRENT_DATE,
          ${sql.raw(`'${step}'::interval`)}
        )::date AS date
      )
      SELECT 
        to_char(ds.date, ${format}) as period,
        COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount::numeric ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN t.type = 'EXPENSE' THEN t.amount::numeric ELSE 0 END), 0) as expense
      FROM date_series ds
      LEFT JOIN transaction t ON 
        (CASE WHEN ${step} = '1 month' THEN date_trunc('month', t.date) = ds.date ELSE date(t.date) = ds.date END)
        AND t.user_id = ${userId}
      GROUP BY ds.date, period
      ORDER BY ds.date ASC
    `) as any;

    const rows = Array.isArray(result) ? result : [];
    return rows.map((r: any) => ({
      month: String(r.period || ''),
      income: Number(r.income || 0),
      expense: Number(r.expense || 0)
    }));
  }
};