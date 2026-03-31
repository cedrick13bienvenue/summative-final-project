import { Request, Response } from 'express';
import { AuthController } from '../../controllers/authController';
import { AuthService } from '../../services/authService';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/authService');
const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Partial<Response>;
};

beforeEach(() => jest.clearAllMocks());

describe('AuthController - extended coverage', () => {
  // ── getProfile error path ─────────────────────────────────────────────────
  describe('getProfile', () => {
    it('should return 404 on error', async () => {
      const req: any = { user: { id: 'user-1' }, body: {}, params: {}, headers: {} };
      MockAuthService.getProfile.mockRejectedValue(new Error('User not found'));
      const res = makeRes();
      await AuthController.getProfile(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // ── changePassword - unauthenticated ──────────────────────────────────────
  describe('changePassword', () => {
    it('should return 401 when unauthenticated', async () => {
      const req: any = { user: undefined, body: {}, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.changePassword(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // ── deactivateUser - unauthenticated and error ────────────────────────────
  describe('deactivateUser', () => {
    it('should return 401 when unauthenticated', async () => {
      const req: any = { user: undefined, body: {}, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.deactivateUser(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 on service error', async () => {
      MockAuthService.deactivateUser.mockRejectedValue(new Error('User not found'));
      const req: any = { user: { id: 'admin' }, body: {}, params: { userId: 'u-1' }, headers: {} };
      const res = makeRes();
      await AuthController.deactivateUser(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── reactivateUser - missing ID, unauthenticated, error ───────────────────
  describe('reactivateUser', () => {
    it('should return 401 when unauthenticated', async () => {
      const req: any = { user: undefined, body: {}, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.reactivateUser(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when userId is missing', async () => {
      const req: any = { user: { id: 'admin' }, body: {}, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.reactivateUser(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 on service error', async () => {
      MockAuthService.reactivateUser.mockRejectedValue(new Error('User not found'));
      const req: any = { user: { id: 'admin' }, body: {}, params: { userId: 'u-1' }, headers: {} };
      const res = makeRes();
      await AuthController.reactivateUser(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── logout ─────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should return 401 when unauthenticated', async () => {
      const req: any = { user: undefined, body: {}, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.logout(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when no token in header', async () => {
      const req: any = { user: { id: 'u-1' }, body: {}, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.logout(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 on successful logout', async () => {
      MockAuthService.logout.mockResolvedValue({ message: 'Logout successful' });
      const req: any = {
        user: { id: 'u-1' },
        body: {},
        params: {},
        headers: { authorization: 'Bearer some-token' },
      };
      const res = makeRes();
      await AuthController.logout(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on service error', async () => {
      MockAuthService.logout.mockRejectedValue(new Error('Logout failed'));
      const req: any = {
        user: { id: 'u-1' },
        body: {},
        params: {},
        headers: { authorization: 'Bearer some-token' },
      };
      const res = makeRes();
      await AuthController.logout(req as AuthenticatedRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── requestPasswordReset ───────────────────────────────────────────────────
  describe('requestPasswordReset', () => {
    it('should return 400 when email is missing', async () => {
      const req: any = { body: {}, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.requestPasswordReset(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 on success', async () => {
      MockAuthService.requestPasswordReset.mockResolvedValue({ message: 'OTP sent', expiresAt: new Date() } as any);
      const req: any = { body: { email: 'user@test.com' }, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.requestPasswordReset(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on service error', async () => {
      MockAuthService.requestPasswordReset.mockRejectedValue(new Error('User not found'));
      const req: any = { body: { email: 'ghost@test.com' }, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.requestPasswordReset(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── resetPassword ──────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('should return 400 when fields are missing', async () => {
      const req: any = { body: { email: 'user@test.com' }, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.resetPassword(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 on success', async () => {
      MockAuthService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });
      const req: any = { body: { email: 'user@test.com', otpCode: '123456', newPassword: 'newpass123' }, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.resetPassword(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on service error', async () => {
      MockAuthService.resetPassword.mockRejectedValue(new Error('Invalid OTP'));
      const req: any = { body: { email: 'user@test.com', otpCode: 'bad', newPassword: 'pass123' }, params: {}, headers: {} };
      const res = makeRes();
      await AuthController.resetPassword(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
