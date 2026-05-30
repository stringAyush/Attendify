import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '@/config/env';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '@/middleware/auth';

export function generateAccessToken(payload: {
  userId: string;
  email: string;
  role: UserRole;
}): string {
  const options: SignOptions = { expiresIn: config.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'access' }, config.JWT_ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: {
  userId: string;
  email: string;
  role: UserRole;
}): string {
  const options: SignOptions = { expiresIn: config.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign({ ...payload, type: 'refresh' }, config.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
}

export function getAccessTokenExpiryMs(): number {
  // 15 minutes in ms
  return 15 * 60 * 1000;
}
