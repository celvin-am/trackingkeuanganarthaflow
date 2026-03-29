import { db } from '../lib/db.js';
import { transactions, wallets, categories } from '../db/schema/index.js';
import { eq, desc } from 'drizzle-orm';
import { settingsService } from './settings.service.js';

type Currency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY' | 'MYR';

const rates: Record<Currency, number> = {
  IDR: 1,
  USD: 1 / 15500,
  EUR: 1 / 16800,
  SGD: 1 / 11500,
  JPY: 1 / 105,
  MYR: 1 / 3300,
};

const noFractionCurrencies: Currency[] = ['IDR', 'JPY'];

const formatMoney = (
  value: string | number | null | undefined,
  currency: Currency = 'IDR'
) => {
  const rawAmount = Number(value || 0);
  const converted = rawAmount * (rates[currency] ?? 1);

  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: noFractionCurrencies.includes(currency) ? 0 : 2,
    maximumFractionDigits: noFractionCurrencies.includes(currency) ? 0 : 2,
  }).format(converted);
};

const formatDate = (value: Date | string | null | undefined) => {
  const d = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

const formatIsoDate = (value: Date | string | null | undefined) => {
  const d = value ? new Date(value) : new Date();
  return d.toISOString().split('T')[0];
};

const escapeCsv = (value: string | number | null | undefined) => {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
};

const truncate = (text: string | null | undefined, max = 34) => {
  const value = String(text || '-');
  return value.length > max ? `${value.slice(0, max - 3)}...` : value;
};

async function getUserCurrency(userId: string): Promise<Currency> {
  try {
    const settings = await settingsService.get(userId);
    const currency = settings?.currency as Currency | undefined;

    if (currency && ['IDR', 'USD', 'EUR', 'SGD', 'JPY', 'MYR'].includes(currency)) {
      return currency;
    }

    return 'IDR';
  } catch {
    return 'IDR';
  }
}

export const exportService = {
  async generateCsv(userId: string, startDate?: Date, endDate?: Date) {
    const currency = await getUserCurrency(userId);

    const results = await db
      .select({
        id: transactions.id,
        date: transactions.date,
        type: transactions.type,
        amount: transactions.amount,
        category: categories.name,
        wallet: wallets.name,
        description: transactions.description,
      })
      .from(transactions)
      .innerJoin(categories, eq(transactions.categoryId, categories.id))
      .innerJoin(wallets, eq(transactions.walletId, wallets.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date));

    const headers = ['Date', 'Type', `Amount (${currency})`, 'Category', 'Wallet', 'Description'];

    const rows = results.map((r) => [
      escapeCsv(formatIsoDate(r.date)),
      escapeCsv(r.type),
      escapeCsv(formatMoney(r.amount, currency)),
      escapeCsv(r.category),
      escapeCsv(r.wallet),
      escapeCsv(r.description),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  async generatePdf(userId: string, startDate?: Date, endDate?: Date): Promise<Buffer> {
    const PDFDocument = (await import('pdfkit')).default;
    const currency = await getUserCurrency(userId);

    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const results = await db
          .select({
            date: transactions.date,
            type: transactions.type,
            amount: transactions.amount,
            category: categories.name,
            wallet: wallets.name,
            description: transactions.description,
          })
          .from(transactions)
          .innerJoin(categories, eq(transactions.categoryId, categories.id))
          .innerJoin(wallets, eq(transactions.walletId, wallets.id))
          .where(eq(transactions.userId, userId))
          .orderBy(desc(transactions.date));

        const totalIncome = results
          .filter((r) => r.type === 'INCOME')
          .reduce((sum, r) => sum + Number(r.amount || 0), 0);

        const totalExpense = results
          .filter((r) => r.type === 'EXPENSE')
          .reduce((sum, r) => sum + Number(r.amount || 0), 0);

        // Header
        doc.font('Helvetica-Bold')
          .fontSize(20)
          .fillColor('#111111')
          .text('ArthaFlow Transaction Report', {
            align: 'center',
          });

        doc.moveDown(0.4);

        doc.font('Helvetica')
          .fontSize(10)
          .fillColor('#666666')
          .text(`Generated: ${formatDate(new Date())}`, { align: 'center' });

        doc.moveDown(1.2);

        // Summary
        doc.fillColor('#111111')
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('Summary');

        doc.moveDown(0.4);

        doc.font('Helvetica').fontSize(10);
        doc.text(`Currency      : ${currency}`);
        doc.text(`Total Income  : ${formatMoney(totalIncome, currency)}`);
        doc.text(`Total Expense : ${formatMoney(totalExpense, currency)}`);
        doc.text(`Net Balance   : ${formatMoney(totalIncome - totalExpense, currency)}`);

        doc.moveDown(1.2);

        // Table layout
        const left = 40;
        let y = doc.y;

        const col = {
          date: left,
          type: 105,
          category: 165,
          wallet: 255,
          desc: 325,
          amount: 470,
        };

        const drawHeader = () => {
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#111111');

          doc.text('Date', col.date, y, { width: 55 });
          doc.text('Type', col.type, y, { width: 50 });
          doc.text('Category', col.category, y, { width: 80 });
          doc.text('Wallet', col.wallet, y, { width: 60 });
          doc.text('Description', col.desc, y, { width: 130 });
          doc.text('Amount', col.amount, y, { width: 85, align: 'right' });

          y += 16;
          doc.moveTo(left, y).lineTo(555, y).strokeColor('#cccccc').stroke();
          y += 8;
        };

        drawHeader();

        doc.font('Helvetica').fontSize(9);

        for (const r of results) {
          if (y > 760) {
            doc.addPage();
            y = 40;
            drawHeader();
            doc.font('Helvetica').fontSize(9);
          }

          const typeText = r.type === 'INCOME' ? 'Income' : 'Expense';
          const amountText = formatMoney(r.amount, currency);

          doc.fillColor('#111111');
          doc.text(formatDate(r.date), col.date, y, { width: 55 });
          doc.text(typeText, col.type, y, { width: 50 });
          doc.text(r.category || '-', col.category, y, { width: 80 });
          doc.text(r.wallet || '-', col.wallet, y, { width: 60 });
          doc.text(truncate(r.description, 34), col.desc, y, { width: 130 });
          doc.text(amountText, col.amount, y, { width: 85, align: 'right' });

          y += 18;
          doc.moveTo(left, y - 4).lineTo(555, y - 4).strokeColor('#eeeeee').stroke();
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  },
};