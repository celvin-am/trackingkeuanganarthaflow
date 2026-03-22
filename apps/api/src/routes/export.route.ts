import { Router } from 'express';
import { exportService } from '../services/export.service.js';

export const exportRouter = Router();

exportRouter.get('/csv', async (req, res, next) => {
  try {
    const csvContent = await exportService.generateCsv(req.user!.id);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="arthaflow-export-${new Date().toISOString().split('T')[0]}.csv"`);
    
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

exportRouter.get('/pdf', async (req, res, next) => {
  try {
    const pdfBuffer = await exportService.generatePdf(req.user!.id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="arthaflow-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});
