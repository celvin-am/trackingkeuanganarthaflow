import { db } from '../lib/db.js';
import { transactions, wallets, categories } from '../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';

type CreateTxnDto = {
  walletId: string;
  categoryId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  notes?: string;
  date?: string | Date;
};

type UpdateTxnDto = {
  walletId: string;
  categoryId: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  notes?: string;
  date?: string | Date;
};

function parseTransactionDate(input?: string | Date) {
  if (!input) return new Date();

  if (input instanceof Date) {
    return input;
  }

  // If the input is YYYY-MM-DD, store it as Jakarta noon to avoid month-boundary shifts.
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T12:00:00+07:00`);
  }

  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getBalanceEffect(type: 'INCOME' | 'EXPENSE', amount: number) {
  return type === 'INCOME' ? amount : -amount;
}

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
      const [wallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, data.walletId), eq(wallets.userId, userId)));

      if (!wallet) {
        const error = new Error('Wallet not found or access denied');
        (error as any).statusCode = 404;
        throw error;
      }

      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, data.categoryId));

      if (!category) {
        const error = new Error('Category not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const amountValue = Number(data.amount);
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        const error = new Error('Invalid amount value');
        (error as any).statusCode = 400;
        throw error;
      }

      const categoryType = String((category as any).type || '').toUpperCase();

      if (categoryType !== 'BOTH' && categoryType !== data.type) {
        const error = new Error(
          `Category type mismatch: transaction type is ${data.type} but category "${category.name}" is ${categoryType}`
        );
        (error as any).statusCode = 400;
        throw error;
      }

      return await db.transaction(async (tx) => {
        const [newTxn] = await tx
          .insert(transactions)
          .values({
            ...data,
            userId,
            amount: amountValue.toString(),
            date: parseTransactionDate(data.date),
          })
          .returning();

        const balanceChange = getBalanceEffect(data.type, amountValue);

        await tx
          .update(wallets)
          .set({
            balance: sql`CAST(COALESCE(${wallets.balance}, '0') AS NUMERIC) + ${balanceChange}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, data.walletId));

        return newTxn;
      });
    } catch (err) {
      console.error('[txn-service:create]', err instanceof Error ? err.message : String(err));
      throw err;
    }
  },

  async update(id: string, userId: string, data: UpdateTxnDto) {
    try {
      const [existingTxn] = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

      if (!existingTxn) {
        const error = new Error('Transaction not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const [wallet] = await db
        .select()
        .from(wallets)
        .where(and(eq(wallets.id, data.walletId), eq(wallets.userId, userId)));

      if (!wallet) {
        const error = new Error('Wallet not found or access denied');
        (error as any).statusCode = 404;
        throw error;
      }

      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, data.categoryId));

      if (!category) {
        const error = new Error('Category not found');
        (error as any).statusCode = 404;
        throw error;
      }

      const amountValue = Number(data.amount);
      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        const error = new Error('Invalid amount value');
        (error as any).statusCode = 400;
        throw error;
      }

      const categoryType = String((category as any).type || '').toUpperCase();

      if (categoryType !== 'BOTH' && categoryType !== data.type) {
        const error = new Error(
          `Category type mismatch: transaction type is ${data.type} but category "${category.name}" is ${categoryType}`
        );
        (error as any).statusCode = 400;
        throw error;
      }

      const oldAmountValue = Number(existingTxn.amount);
      if (!Number.isFinite(oldAmountValue) || oldAmountValue <= 0) {
        const error = new Error('Stored transaction amount is invalid');
        (error as any).statusCode = 500;
        throw error;
      }

      const oldEffect = getBalanceEffect(existingTxn.type as 'INCOME' | 'EXPENSE', oldAmountValue);
      const newEffect = getBalanceEffect(data.type, amountValue);

      return await db.transaction(async (tx) => {
        if (existingTxn.walletId === data.walletId) {
          const delta = newEffect - oldEffect;

          await tx
            .update(wallets)
            .set({
              balance: sql`CAST(COALESCE(${wallets.balance}, '0') AS NUMERIC) + ${delta}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.id, data.walletId));
        } else {
          // Revert old transaction effect from old wallet
          await tx
            .update(wallets)
            .set({
              balance: sql`CAST(COALESCE(${wallets.balance}, '0') AS NUMERIC) - ${oldEffect}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.id, existingTxn.walletId));

          // Apply new transaction effect to new wallet
          await tx
            .update(wallets)
            .set({
              balance: sql`CAST(COALESCE(${wallets.balance}, '0') AS NUMERIC) + ${newEffect}`,
              updatedAt: new Date(),
            })
            .where(eq(wallets.id, data.walletId));
        }

        const [updatedTxn] = await tx
          .update(transactions)
          .set({
            walletId: data.walletId,
            categoryId: data.categoryId,
            amount: amountValue.toString(),
            type: data.type,
            description: data.description,
            notes: data.notes,
            date: parseTransactionDate(data.date),
            updatedAt: new Date(),
          })
          .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
          .returning();

        return updatedTxn;
      });
    } catch (err) {
      console.error('[txn-service:update]', err instanceof Error ? err.message : String(err));
      throw err;
    }
  },

  async delete(id: string, userId: string) {
    return db.transaction(async (tx) => {
      const [txn] = await tx
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

      if (!txn) return null;

      const parsedAmount = parseFloat(txn.amount);
      const balanceChange = txn.type === 'INCOME' ? -parsedAmount : parsedAmount;

      await tx
        .update(wallets)
        .set({
          balance: sql`CAST(COALESCE(${wallets.balance}, '0') AS NUMERIC) + ${balanceChange}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, txn.walletId));

      const [deleted] = await tx
        .delete(transactions)
        .where(eq(transactions.id, id))
        .returning();

      return deleted;
    });
  },
};