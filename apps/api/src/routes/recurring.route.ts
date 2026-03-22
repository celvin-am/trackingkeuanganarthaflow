import { Router } from 'express';
import { recurringService } from '../services/recurring.service.js';

export const recurringRouter = Router();

recurringRouter.get('/', async (req, res, next) => {
  try {
    const schedules = await recurringService.findAll(req.user!.id);
    res.json(schedules);
  } catch (err) {
    next(err);
  }
});

recurringRouter.post('/', async (req, res, next) => {
  try {
    const schedule = await recurringService.createWithFirstTransaction(req.user!.id, req.body);
    res.status(201).json(schedule);
  } catch (err) {
    next(err);
  }
});

recurringRouter.patch('/:id', async (req, res, next) => {
  try {
    const updated = await recurringService.update(req.params.id, req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Schedule not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

recurringRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await recurringService.delete(req.params.id, req.user!.id);
    if (!deleted) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
