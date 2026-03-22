import { db } from '../lib/db.js';
import { recurringTxns, transactions, wallets } from '../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { addDays, addWeeks, addMonths } from 'date-fns';

type CreateRecurringDto = {
  walletId: string;
  categoryId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  nextRunDate: Date;
};

export const recurringService = {
  async findAll(userId: string) {
    return db
      .select()
      .from(recurringTxns)
      .where(eq(recurringTxns.userId, userId));
  },

  async createWithFirstTransaction(userId: string, data: CreateRecurringDto) {
    return db.transaction(async (tx) => {
      // 1. Create the recurring rule
      const nextRunDate = this.calculateNextRun(new Date(), data.frequency);
      const [schedule] = await tx
        .insert(recurringTxns)
        .values({
          ...data,
          userId,
          amount: data.amount.toString(),
          nextRunDate,
        })
        .returning();

      // 2. Create the first transaction linked to this rule
      await tx.insert(transactions).values({
        userId,
        walletId: data.walletId,
        categoryId: data.categoryId,
        amount: data.amount.toString(),
        type: data.type,
        description: data.description,
        recurringTxnId: schedule.id,
        date: new Date(),
      });

      // 3. Adjust wallet balance
      const balanceChange = data.type === 'INCOME' ? data.amount : -data.amount;
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, data.walletId));

      return schedule;
    });
  },

  calculateNextRun(fromDate: Date, frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY') {
    switch (frequency) {
      case 'DAILY': return addDays(fromDate, 1);
      case 'WEEKLY': return addWeeks(fromDate, 1);
      case 'MONTHLY': return addMonths(fromDate, 1);
      default: return fromDate;
    }
  },

  async update(id: string, userId: string, data: Partial<CreateRecurringDto> & { isActive?: boolean }) {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.amount !== undefined) updateData.amount = data.amount.toString();

    const [schedule] = await db
      .update(recurringTxns)
      .set(updateData)
      .where(and(eq(recurringTxns.id, id), eq(recurringTxns.userId, userId)))
      .returning();
    return schedule;
  },

  async delete(id: string, userId: string) {
    const [deleted] = await db
      .delete(recurringTxns)
      .where(and(eq(recurringTxns.id, id), eq(recurringTxns.userId, userId)))
      .returning();
    return deleted;
  },
};
