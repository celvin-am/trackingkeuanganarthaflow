import { Router } from 'express';
import { walletService } from '../services/wallet.service.js';

export const walletRouter = Router();

walletRouter.get('/', async (req, res, next) => {
  try {
    const wallets = await walletService.findAll(req.user!.id);
    res.json(wallets);
  } catch (err) {
    next(err);
  }
});

walletRouter.get('/summary', async (req, res, next) => {
  try {
    const summary = await walletService.getSummary(req.user!.id);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

walletRouter.get('/:id', async (req, res, next) => {
  try {
    const wallet = await walletService.findById(req.params.id, req.user!.id);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json(wallet);
  } catch (err) {
    next(err);
  }
});

walletRouter.post('/', async (req, res, next) => {
  try {
    // Note: In production add Zod validation here
    const wallet = await walletService.create(req.user!.id, req.body);
    res.status(201).json(wallet);
  } catch (err) {
    next(err);
  }
});

walletRouter.patch('/:id', async (req, res, next) => {
  try {
    const wallet = await walletService.update(req.params.id, req.user!.id, req.body);
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json(wallet);
  } catch (err) {
    next(err);
  }
});

walletRouter.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await walletService.delete(req.params.id, req.user!.id);
    if (!deleted) return res.status(404).json({ error: 'Wallet not found' });
    res.json({ success: true, id: deleted.id });
  } catch (err) {
    next(err);
  }
});
