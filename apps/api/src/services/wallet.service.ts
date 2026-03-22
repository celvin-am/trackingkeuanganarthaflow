import { db } from '../lib/db.js';
import { wallets } from '../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';

type CreateWalletDto = {
  name: string;
  description?: string;
  type: 'CASH' | 'BANK' | 'E_WALLET' | 'INVESTMENT';
  icon?: string;
  balance?: number;
};

export const walletService = {
  async findAll(userId: string) {
    return db.select().from(wallets).where(eq(wallets.userId, userId));
  },

  async findById(id: string, userId: string) {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)));
    return wallet;
  },

  async create(userId: string, data: CreateWalletDto) {
    const [wallet] = await db
      .insert(wallets)
      .values({
        ...data,
        userId,
        balance: data.balance ? data.balance.toString() : '0',
      })
      .returning();
    return wallet;
  },

  async update(id: string, userId: string, data: Partial<CreateWalletDto>) {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.balance !== undefined) {
      updateData.balance = data.balance.toString();
    }

    const [wallet] = await db
      .update(wallets)
      .set(updateData)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();
    return wallet;
  },

  async delete(id: string, userId: string) {
    const [deleted] = await db
      .delete(wallets)
      .where(and(eq(wallets.id, id), eq(wallets.userId, userId)))
      .returning();
    return deleted;
  },

  async getSummary(userId: string) {
    const result = await db
      .select({
        totalBalance: sql<number>`sum(${wallets.balance}::numeric)`,
        count: sql<number>`count(*)`,
      })
      .from(wallets)
      .where(eq(wallets.userId, userId));

    return {
      totalBalance: Number(result[0]?.totalBalance || 0),
      count: Number(result[0]?.count || 0),
    };
  },
};
