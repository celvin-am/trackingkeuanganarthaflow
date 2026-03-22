import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { categoryService } from '../services/category.service.js';

export const categoryRouter = Router();

categoryRouter.get('/', async (req, res, next) => {
  try {
    const userCategories = await categoryService.findAll(req.user!.id);
    res.json(userCategories);
  } catch (err) {
    next(err);
  }
});

categoryRouter.post('/', async (req, res, next) => {
  try {
    const category = await categoryService.create(req.user!.id, req.body);
    res.json(category);
  } catch (err) {
    next(err);
  }
});

categoryRouter.patch('/:id', async (req, res, next) => {
  try {
    const category = await categoryService.update(req.params.id, req.user!.id, req.body);
    res.json(category);
  } catch (err) {
    next(err);
  }
});

categoryRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await categoryService.delete(req.params.id, req.user!.id);
    res.json(deleted);
  } catch (err) {
    next(err);
  }
});
