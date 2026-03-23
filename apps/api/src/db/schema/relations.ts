import { relations } from 'drizzle-orm';
import { wallets, categories, transactions, budgets, recurringTxns, receiptScans, userSettings } from './tables';
import { user } from './auth.js';

export const userRelations = relations(user, ({ one, many }) => ({
  settings: one(userSettings, {
    fields: [user.id],
    references: [userSettings.userId],
  }),
  wallets: many(wallets),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  recurringTxns: many(recurringTxns),
  receiptScans: many(receiptScans),
}));

export const walletRelations = relations(wallets, ({ one, many }) => ({
  user: one(user, {
    fields: [wallets.userId],
    references: [user.id],
  }),
  transactions: many(transactions),
  recurringTxns: many(recurringTxns),
}));

export const categoryRelations = relations(categories, ({ one, many }) => ({
  user: one(user, {
    fields: [categories.userId],
    references: [user.id],
  }),
  transactions: many(transactions),
  budgets: many(budgets),
  recurringTxns: many(recurringTxns),
  receiptScans: many(receiptScans),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  user: one(user, {
    fields: [transactions.userId],
    references: [user.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  receiptScan: one(receiptScans, {
    fields: [transactions.id],
    references: [receiptScans.transactionId],
  }),
  recurringTxn: one(recurringTxns, {
    fields: [transactions.recurringTxnId],
    references: [recurringTxns.id],
  }),
}));

export const budgetRelations = relations(budgets, ({ one }) => ({
  user: one(user, {
    fields: [budgets.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const recurringTxnRelations = relations(recurringTxns, ({ one, many }) => ({
  user: one(user, {
    fields: [recurringTxns.userId],
    references: [user.id],
  }),
  wallet: one(wallets, {
    fields: [recurringTxns.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [recurringTxns.categoryId],
    references: [categories.id],
  }),
  transactions: many(transactions),
}));

export const receiptScanRelations = relations(receiptScans, ({ one }) => ({
  user: one(user, {
    fields: [receiptScans.userId],
    references: [user.id],
  }),
  category: one(categories, {
    fields: [receiptScans.categoryId],
    references: [categories.id],
  }),
  transaction: one(transactions, {
    fields: [receiptScans.transactionId],
    references: [transactions.id],
  }),
}));
