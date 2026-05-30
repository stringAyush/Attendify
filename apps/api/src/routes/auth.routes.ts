import { Router } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validate';
import {
  signupSchema,
  loginSchema,
  googleAuthSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '@/validators/schemas';
import { AuthService } from '@/services/auth.service';
import { ApiSuccessResponse } from '@/utils/response';

const router = Router();

// POST /api/auth/signup
router.post(
  '/signup',
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const result = await AuthService.signup(req.body);
    res.status(201).json(ApiSuccessResponse(result, 'Account created successfully'));
  })
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body);
    res.json(ApiSuccessResponse(result, 'Logged in successfully'));
  })
);

// POST /api/auth/google
router.post(
  '/google',
  validate(googleAuthSchema),
  asyncHandler(async (req, res) => {
    const result = await AuthService.googleAuth(req.body.code, req.body.redirectUri);
    res.json(ApiSuccessResponse(result, 'Authenticated with Google'));
  })
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  validate(refreshTokenSchema),
  asyncHandler(async (req, res) => {
    const result = await AuthService.refreshTokens(req.body.refreshToken);
    res.json(ApiSuccessResponse(result, 'Tokens refreshed'));
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await AuthService.logout(req.user!.userId);
    res.json(ApiSuccessResponse(null, 'Logged out successfully'));
  })
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await AuthService.forgotPassword(req.body.email);
    res.json(
      ApiSuccessResponse(
        null,
        'If that email exists, a reset link has been sent'
      )
    );
  })
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    await AuthService.resetPassword(req.body.token, req.body.password);
    res.json(ApiSuccessResponse(null, 'Password reset successfully'));
  })
);

// GET /api/auth/me
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await AuthService.getProfile(req.user!.userId);
    res.json(ApiSuccessResponse(user));
  })
);

export { router as authRouter };
