import { Response } from 'express';
import { AuthController } from '../../controllers/authController';
import { AuthService } from '../../services/authService';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/authService');

const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('AuthController (additional methods)', () => {
  let mockReq: any;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, headers: {}, user: { id: 'user-123' } };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      MockAuthService.logout.mockResolvedValue({ message: 'Logout successful' });

      await AuthController.logout(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(MockAuthService.logout).toHaveBeenCalledWith('valid-token', 'user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if not authenticated', async () => {
      mockReq.user = undefined;
      await AuthController.logout(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if token missing from header', async () => {
      mockReq.headers = {};
      await AuthController.logout(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('requestPasswordReset', () => {
    it('should send OTP and return 200', async () => {
      mockReq.body = { email: 'user@example.com' };
      MockAuthService.requestPasswordReset.mockResolvedValue({
        message: 'OTP sent',
        expiresAt: new Date(),
      });

      await AuthController.requestPasswordReset(mockReq, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if email missing', async () => {
      mockReq.body = {};
      await AuthController.requestPasswordReset(mockReq, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('resetPassword', () => {
    it('should reset password and return 200', async () => {
      mockReq.body = { email: 'user@example.com', otpCode: '123456', newPassword: 'newPass123' };
      MockAuthService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });

      await AuthController.resetPassword(mockReq, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if fields missing', async () => {
      mockReq.body = { email: 'user@example.com' };
      await AuthController.resetPassword(mockReq, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});
