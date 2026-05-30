import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { ApiErrorResponse } from '@/utils/response';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const key = err.path.join('.');
          if (!details[key]) details[key] = [];
          details[key].push(err.message);
        });
        res.status(400).json(ApiErrorResponse(400, 'Validation failed', details));
        return;
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        error.errors.forEach((err) => {
          const key = err.path.join('.');
          if (!details[key]) details[key] = [];
          details[key].push(err.message);
        });
        res.status(400).json(ApiErrorResponse(400, 'Validation failed', details));
        return;
      }
      next(error);
    }
  };
}
