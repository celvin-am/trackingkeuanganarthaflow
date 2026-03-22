import { Router } from 'express';
import { budgetService } from '../services/budget.service.js';

export const budgetRouter = Router();

budgetRouter.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();
    
    const budgets = await budgetService.findAll(req.user!.id, month, year);
    res.json(budgets);
  } catch (err) {
    next(err);
  }
});

budgetRouter.post('/', async (req, res, next) => {
  try {
    const budget = await budgetService.create(req.user!.id, req.body);
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
});

budgetRouter.patch('/:id', async (req, res, next) => {
  try {
    if (!req.body.limitAmount) {
      return res.status(400).json({ error: 'limitAmount is required' });
    }
    const budget = await budgetService.update(req.params.id, req.user!.id, req.body.limitAmount);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });
    res.json(budget);
  } catch (err) {
    next(err);
  }
});

budgetRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await budgetService.delete(req.params.id, req.user!.id);
    if (!deleted) return res.status(404).json({ error: 'Budget not found' });
    res.json({ success: true, id: deleted.id });
  } catch (err) {
    next(err);
  }
});
