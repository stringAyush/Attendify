import bcrypt from 'bcryptjs';
import { config } from '@/config/env';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function generatePin(length = 6): string {
  const digits = '0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => digits[byte % digits.length]).join('');
}

export function generateQrCode(): string {
  return generateSecureToken();
}
