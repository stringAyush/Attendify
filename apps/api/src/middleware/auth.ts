import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/env';
import { ApiErrorResponse } from '@/utils/response';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json(ApiErrorResponse(401, 'Authentication required'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;

    if (decoded.type !== 'access') {
      res.status(401).json(ApiErrorResponse(401, 'Invalid token type'));
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json(ApiErrorResponse(401, 'Token expired'));
      return;
    }
    res.status(401).json(ApiErrorResponse(401, 'Invalid token'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json(ApiErrorResponse(401, 'Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json(ApiErrorResponse(403, 'Insufficient permissions'));
      return;
    }

    next();
  };
}

export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
    if (decoded.type === 'access') {
      req.user = decoded;
    }
  } catch {
    // Optional auth — ignore errors
  }

  next();
}
