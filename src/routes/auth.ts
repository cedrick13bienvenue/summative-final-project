import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import {
  authenticateToken,
  requireAdmin,
  requireRole,
} from '../middleware/auth';
import { UserRole } from '../models';
import { validateBody, validateParams } from '../middleware/validation';
import { userLoginSchema, passwordChangeSchema, userIdParamSchema, passwordResetRequestSchema, passwordResetSchema } from '../validation/schemas';
import { authRateLimiter, registrationRateLimiter, passwordResetRateLimiter, otpRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes - login and password reset (with rate limiting)
router.post('/auth/login', authRateLimiter, validateBody(userLoginSchema), AuthController.login);
router.post('/auth/forgot-password', passwordResetRateLimiter, validateBody(passwordResetRequestSchema), AuthController.requestPasswordReset);
router.post('/auth/reset-password', passwordResetRateLimiter, validateBody(passwordResetSchema), AuthController.resetPassword);

// Protected routes
router.get('/auth/profile', authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN]), AuthController.getProfile);
router.put('/auth/change-password', authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT, UserRole.PHARMACIST]), validateBody(passwordChangeSchema), AuthController.changePassword);
router.post('/auth/logout', authenticateToken, AuthController.logout);

// Admin only routes
router.put('/auth/users/:userId/deactivate', authenticateToken, requireAdmin, validateParams(userIdParamSchema), AuthController.deactivateUser);
router.put('/auth/users/:userId/reactivate', authenticateToken, requireAdmin, validateParams(userIdParamSchema), AuthController.reactivateUser);

export default router;
