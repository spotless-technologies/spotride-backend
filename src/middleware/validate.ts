import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema, source: 'body' | 'query'| 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let dataToValidate;
      
      if (source === 'query') {
        dataToValidate = req.query;
      } else if (source === 'params') {
        dataToValidate = req.params;
      } else {
        dataToValidate = req.body;
      }

      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      // Fallback for unexpected errors
      res.status(400).json({ 
        message: "Invalid input",
        error: error instanceof Error ? error.message : "Unknown validation error"
      });
    }
  };
};