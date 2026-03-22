import { db } from '../lib/db.js';
import { transactions, wallets, categories } from '../db/schema/index.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
// We'd add csv-stringify or similar library here for real CSV generation
// For this MVP, we build a simple string builder

export const exportService = {
  async generateCsv(userId: string, startDate?: Date, endDate?: Date) {
    let query = db
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

    // Dynamic filtering would be applied here
    const results = await query;

    // Simple CSV Builder
    const headers = ['Date', 'Type', 'Amount', 'Category', 'Wallet', 'Description'];
    const rows = results.map(r => [
      r.date?.toISOString().split('T')[0] ?? '',
      r.type,
      r.amount?.toString() ?? '0',
      `"${r.category}"`, // Quote to handle commas
      `"${r.wallet}"`,
      `"${r.description}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },

  async generatePdf(userId: string, startDate?: Date, endDate?: Date): Promise<Buffer> {
    const PDFDocument = (await import('pdfkit')).default;
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];
        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        
        doc.fontSize(20).text('ArthaFlow Transaction Report', { align: 'center' });
        doc.moveDown();
        
        let query = db
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

        const results = await query;

        doc.fontSize(12);
        results.forEach(r => {
          const dateStr = r.date?.toISOString().split('T')[0] ?? '';
          doc.text(`[${dateStr}] ${r.type} - Rp${r.amount}`);
          doc.text(`Cat: ${r.category} | Wallet: ${r.wallet}`);
          doc.text(`Desc: ${r.description}`);
          doc.moveDown();
        });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
};
