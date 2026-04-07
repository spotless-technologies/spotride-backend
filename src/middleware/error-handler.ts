import { Request, Response, NextFunction } from 'express';
import { AppError, createAppError } from '../utils/app-error';


export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error: AppError;

  // Zod validation error
  if (err.name === 'ZodError') {
    error = createAppError(
      'Validation failed',
      400
    );
    return res.status(400).json({
      message: error.message,
      errors: err.errors.map((e: any) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma foreign key constraint
  if (err.code === 'P2003') {
    error = createAppError('Invalid reference: The related record does not exist', 400);
    return res.status(400).json({ message: error.message });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    error = createAppError('Record not found', 404);
    return res.status(404).json({ message: error.message });
  }

  // Custom thrown error
  if (err.message && err.statusCode) {
    error = createAppError(err.message, err.statusCode);
    return res.status(error.statusCode).json({ message: error.message });
  }

  // Unknown error
  console.error('Unexpected Error:', err);
  error = createAppError('Internal server error', 500);
  res.status(500).json({ message: error.message });
};