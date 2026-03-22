import { Router } from 'express';
import { dashboardService } from '../services/dashboard.service.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats(req.user!.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get('/health-score', async (req, res, next) => {
  try {
    const score = await dashboardService.getHealthScore(req.user!.id);
    res.json({ score });
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get('/expense-distribution', async (req, res, next) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;
    const year = parseInt(req.query.year as string) || now.getFullYear();
    
    const dist = await dashboardService.getExpenseDistribution(req.user!.id, month, year);
    res.json(dist);
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get('/balance-trend', async (req, res, next) => {
  try {
    const range = (req.query.range as string) || '1M';
    const trend = await dashboardService.getBalanceTrend(req.user!.id, range);
    res.json(trend);
  } catch (err) {
    next(err);
  }
});
