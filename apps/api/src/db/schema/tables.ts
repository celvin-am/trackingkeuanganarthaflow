import { pgEnum, pgTable, timestamp, varchar, uuid, numeric, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';

export const walletTypeEnum = pgEnum('wallet_type', ['CASH', 'BANK', 'E_WALLET', 'INVESTMENT']);
export const txTypeEnum = pgEnum('tx_type', ['INCOME', 'EXPENSE']);
export const categoryTypeEnum = pgEnum('category_type', ['INCOME', 'EXPENSE', 'BOTH']);
export const frequencyEnum = pgEnum('frequency', ['DAILY', 'WEEKLY', 'MONTHLY']);
export const scanStatusEnum = pgEnum('scan_status', ['PROCESSING', 'DRAFT', 'VERIFIED']);

export const wallets = pgTable('wallet', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  type: walletTypeEnum('type').notNull().default('BANK'),
  icon: varchar('icon', { length: 50 }).notNull().default('account_balance_wallet'),
  balance: numeric('balance', { precision: 19, scale: 4 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const categories = pgTable('category', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 50 }).notNull().default('category'),
  color: varchar('color', { length: 50 }).notNull().default('bg-gray-500'),
  type: categoryTypeEnum('type').notNull().default('EXPENSE'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const transactions = pgTable('transaction', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  type: txTypeEnum('type').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  notes: varchar('notes', { length: 1000 }),
  recurringTxnId: uuid('recurring_txn_id').references(() => recurringTxns.id, { onDelete: 'set null' }),
  date: timestamp('date').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const budgets = pgTable('budget', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  limitAmount: numeric('limit_amount', { precision: 19, scale: 4 }).notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const recurringTxns = pgTable('recurring_txn', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  walletId: uuid('wallet_id').notNull().references(() => wallets.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 19, scale: 4 }).notNull(),
  type: txTypeEnum('type').notNull(),
  description: varchar('description', { length: 255 }).notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  nextRunDate: timestamp('next_run_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const receiptScans = pgTable('receipt_scan', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => user.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  transactionId: uuid('transaction_id').references(() => transactions.id, { onDelete: 'set null' }),
  imageUrl: varchar('image_url', { length: 1000 }).notNull(),
  merchant: varchar('merchant', { length: 255 }),
  amount: numeric('amount', { precision: 19, scale: 4 }),
  date: timestamp('date'),
  description: varchar('description', { length: 1000 }),
  status: scanStatusEnum('status').notNull().default('PROCESSING'),
  rawOcrData: jsonb('raw_ocr_data'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  currency: varchar('currency', { length: 10 }).notNull().default('IDR'),
  dateFormat: varchar('date_format', { length: 20 }).notNull().default('DD/MM/YYYY'),
  language: varchar('language', { length: 10 }).notNull().default('id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
