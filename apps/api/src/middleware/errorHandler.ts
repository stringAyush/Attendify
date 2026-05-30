import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '@/utils/response';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isOperational = err.isOperational === true;
  const message = isOperational ? err.message : 'Internal server error';

  // Always log non-operational (unexpected) errors
  if (!isOperational) {
    console.error('🔥 Unexpected Error:', {
      method: req.method,
      url: req.url,
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  } else if (process.env.NODE_ENV === 'development') {
    console.error('⚠️  API Error:', {
      method: req.method,
      url: req.url,
      statusCode,
      message: err.message,
    });
  }

  if (!res.headersSent) {
    res.status(statusCode).json(ApiErrorResponse(statusCode, message));
  }
}

export function notFound(req: Request, res: Response): void {
  console.warn(`⚡ 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json(ApiErrorResponse(404, `Route not found: ${req.method} ${req.path}`));
}

export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
