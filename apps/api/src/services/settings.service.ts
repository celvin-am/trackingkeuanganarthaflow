import { db } from '../lib/db.js';
import { userSettings, user, transactions, budgets, recurringTxns, receiptScans, wallets, categories } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';

type UpdateSettingsDto = {
  currency?: string;
  dateFormat?: string;
  language?: string;
};

export const settingsService = {
  async get(userId: string) {
    let [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    // Auto-create default settings if none exist yet
    if (!settings) {
      [settings] = await db
        .insert(userSettings)
        .values({ userId })
        .returning();
    }

    return settings;
  },

  async update(userId: string, data: UpdateSettingsDto) {
    const [settings] = await db
      .update(userSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userSettings.userId, userId))
      .returning();

    return settings;
  },

  async deleteAccount(userId: string) {
    const [deleted] = await db
      .delete(user)
      .where(eq(user.id, userId))
      .returning();
    return deleted;
  },

  async updateProfilePicture(userId: string, imageUrl: string) {
    const [updated] = await db
      .update(user)
      .set({ image: imageUrl, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning();
    return updated;
  },
  
  async resetData(userId: string) {
    await db.transaction(async (tx) => {
      // Order matters if there are foreign key constraints without cascade (though they have cascade)
      await tx.delete(transactions).where(eq(transactions.userId, userId));
      await tx.delete(budgets).where(eq(budgets.userId, userId));
      await tx.delete(recurringTxns).where(eq(recurringTxns.userId, userId));
      await tx.delete(receiptScans).where(eq(receiptScans.userId, userId));
      await tx.delete(wallets).where(eq(wallets.userId, userId));
      // Only delete non-default categories
      await tx.delete(categories).where(
        and(
          eq(categories.userId, userId), 
          eq(categories.isDefault, false)
        )
      );
    });
  }
};
