import { prisma } from '@/config/database';
import { hashPassword, comparePassword, generateSecureToken } from '@/utils/crypto';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '@/utils/jwt';
import { sendEmail, getPasswordResetEmailHtml } from '@/utils/email';
import { createError } from '@/middleware/errorHandler';
import { config } from '@/config/env';
import { OAuth2Client } from 'google-auth-library';
import { UserRole } from '@prisma/client';

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

export interface AuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export const AuthService = {
  async signup(data: {
    name: string;
    email: string;
    password: string;
    institutionName?: string;
  }): Promise<AuthResult> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw createError('Email already in use', 400);
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.$transaction(async (tx) => {
      let institutionId: string | undefined;

      if (data.institutionName) {
        const institution = await tx.institution.create({
          data: { name: data.institutionName },
        });
        institutionId = institution.id;
      }

      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: passwordHash,
          role: 'TEACHER',
          teacher: {
            create: {
              ...(institutionId && { institutionId }),
            },
          },
        },
        include: { teacher: true },
      });

      return newUser;
    });

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  },

  async login(data: { email: string; password: string }): Promise<AuthResult> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw createError('Invalid email or password', 401);
    }

    const isValid = await comparePassword(data.password, user.password);
    if (!isValid) {
      throw createError('Invalid email or password', 401);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  },

  async googleAuth(code: string): Promise<AuthResult> {
    if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
      throw createError('Google OAuth is not configured', 503);
    }

    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: config.GOOGLE_CALLBACK_URL || `${config.FRONTEND_URL}/auth/google/callback`,
    });

    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: config.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw createError('Failed to get user info from Google', 400);
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: payload.email }, { googleId: payload.sub }],
      },
    });

    if (!user) {
      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: payload.email!,
            name: payload.name ?? 'Unknown',
            googleId: payload.sub,
            avatar: payload.picture ?? null,
            isEmailVerified: true,
            role: 'TEACHER',
            teacher: { create: {} },
          },
        });
        return newUser;
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: payload.sub,
          avatar: user.avatar ?? payload.picture ?? null,
          isEmailVerified: true,
        },
      });
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  },

  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw createError('Invalid or expired refresh token', 401);
    }

    if (payload.type !== 'refresh') {
      throw createError('Invalid token type', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw createError('Invalid refresh token', 401);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  },

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return silently to prevent email enumeration
      return;
    }

    const token = generateSecureToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${config.FRONTEND_URL}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your Attendify password',
      html: getPasswordResetEmailHtml(user.name, resetUrl),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw createError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null,
      },
    });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacher: {
          include: { institution: true },
        },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Only return safe fields — strip all sensitive/internal data
    const { password: _pw, refreshToken: _rt, resetToken: _rk, resetTokenExpiry: _re, googleId: _gid, ...safeUser } = user;
    return safeUser;
  },
};
