import { db } from '../lib/db.js';
import { transactions, wallets, categories } from '../db/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';

type CreateTxnDto = {
  walletId: string;
  categoryId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  notes?: string;
  date?: string | Date;
};

export const transactionService = {
  async findAll(userId: string, limit = 50, offset = 0, search = '', categoryId?: string) {
    return db.query.transactions.findMany({
      where: (tx, { eq, and, ilike }) => 
        and(
          eq(tx.userId, userId),
          search ? ilike(tx.description, `%${search}%`) : undefined,
          categoryId ? eq(tx.categoryId, categoryId) : undefined
        ),
      with: {
        category: true,
        wallet: true,
      },
      orderBy: (tx, { desc }) => [desc(tx.date)],
      limit,
      offset,
    });
  },

  async count(userId: string, search = '', categoryId?: string) {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          search ? sql`${transactions.description} ILIKE ${`%${search}%`}` : undefined,
          categoryId ? eq(transactions.categoryId, categoryId) : undefined
        )
      );
    return Number(result?.count || 0);
  },

  async findById(id: string, userId: string) {
    const [txn] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return txn;
  },

  async create(userId: string, data: CreateTxnDto) {
    try {
      // 1. Validate Wallet existence and ownership
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, data.walletId), eq(wallets.userId, userId)));
      
      if (!wallet) {
        const error = new Error('Wallet not found or access denied');
        (error as any).statusCode = 404;
        throw error;
      }

      // 2. Validate Category existence
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, data.categoryId));
      
      if (!category) {
        const error = new Error('Category not found');
        (error as any).statusCode = 404;
        throw error;
      }

      // 3. Ensure amount is a valid number
      const amountValue = Number(data.amount);
      if (isNaN(amountValue)) {
        const error = new Error('Invalid amount value');
        (error as any).statusCode = 400;
        throw error;
      }

      return await db.transaction(async (tx) => {
        // 4. Create transaction record
        const [newTxn] = await tx
          .insert(transactions)
          .values({
            ...data,
            userId,
            amount: amountValue.toString(), // Store as string for Decimal/Numeric compatibility
            date: data.date ? new Date(data.date) : new Date(),
          })
          .returning();

        // 5. Adjust wallet balance using safe SQL casting
        const balanceChange = data.type === 'INCOME' ? amountValue : -amountValue;
        console.log(`[txn-service] Updating wallet ${data.walletId} balance by ${balanceChange}`);
        
        const updateResult = await tx
          .update(wallets)
          .set({
            balance: sql`CAST(COALESCE(${wallets.balance}, '0') AS NUMERIC) + ${balanceChange}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, data.walletId));
        
        console.log(`[txn-service] Wallet update completed for ${data.walletId}`);

        return newTxn;
      });
    } catch (err: any) {
      console.error('--- DB ERROR ---', err);
      // Re-throw to be caught by global error handler
      throw err;
    }
  },

  async delete(id: string, userId: string) {
    return db.transaction(async (tx) => {
      // 1. Get the transaction to know what to revert
      const [txn] = await tx
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

      if (!txn) return null;

      // 2. Revert the wallet balance
      const parsedAmount = parseFloat(txn.amount);
      const balanceChange = txn.type === 'INCOME' ? -parsedAmount : parsedAmount;
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, txn.walletId));

      // 3. Delete the transaction
      const [deleted] = await tx
        .delete(transactions)
        .where(eq(transactions.id, id))
        .returning();

      return deleted;
    });
  },
};
