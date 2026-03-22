import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.log('--- BACKEND ERROR ---', err);
  console.error('Error Handler Caught:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
    });
  }

  // Handle expected application errors by convention
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Fallback for unhandled/unexpected exceptions
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
