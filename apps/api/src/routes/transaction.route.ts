import { Router } from 'express';
import { transactionService } from '../services/transaction.service.js';

export const transactionRouter = Router();

transactionRouter.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const search = (req.query.search as string) || '';
    const categoryId = (req.query.categoryId as string) || undefined;
    
    const data = await transactionService.findAll(req.user!.id, limit, offset, search, categoryId);
    const total = await transactionService.count(req.user!.id, search, categoryId);
    res.json({ data, total });
  } catch (err) {
    next(err);
  }
});

transactionRouter.post('/', async (req, res, next) => {
  try {
    const txn = await transactionService.create(req.user!.id, req.body);
    res.status(201).json(txn);
  } catch (err: any) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    next(err);
  }
});

transactionRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await transactionService.delete(req.params.id, req.user!.id);
    if (!deleted) return res.status(404).json({ error: 'Transaction not found or could not be reverted' });
    res.json({ success: true, id: deleted.id });
  } catch (err) {
    next(err);
  }
});
