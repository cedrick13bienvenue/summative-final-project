import { AuthService } from '../../services/authService';
import { User, TokenBlacklist } from '../../models';
import { UserRole } from '../../models/User';
import { sequelize } from '../../database/config/database';
import { OTPService } from '../../services/otpService';

jest.mock('../../models/User', () => ({
  UserRole: { ADMIN: 'admin', DOCTOR: 'doctor', PATIENT: 'patient', PHARMACIST: 'pharmacist' },
  default: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  __esModule: true,
}));
jest.mock('../../models', () => {
  const UserMock: any = jest.fn().mockImplementation(() => ({
    hashPassword: jest.fn().mockResolvedValue('hashed-pw'),
  }));
  UserMock.findOne = jest.fn();
  UserMock.findByPk = jest.fn();
  UserMock.create = jest.fn();
  UserMock.hasOne = jest.fn();
  return {
    User: UserMock,
    TokenBlacklist: {
      isTokenBlacklisted: jest.fn(),
      blacklistToken: jest.fn(),
      cleanupExpiredTokens: jest.fn(),
    },
    UserRole: { ADMIN: 'admin', DOCTOR: 'doctor', PATIENT: 'patient', PHARMACIST: 'pharmacist' },
  };
});
jest.mock('../../models/Doctor', () => ({
  default: { create: jest.fn(), findOne: jest.fn() },
  __esModule: true,
}));
jest.mock('../../models/Patient', () => ({
  default: { findOne: jest.fn() },
  __esModule: true,
}));
jest.mock('../../database/config/database', () => ({
  sequelize: { transaction: jest.fn() },
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ id: 'user-123', exp: Math.floor(Date.now() / 1000) + 3600 }),
}));
jest.mock('../../services/otpService', () => ({
  OTPService: {
    generateAndSendPasswordResetOTP: jest.fn(),
    verifyPasswordResetOTP: jest.fn(),
  },
}));

const MockUser = User as jest.Mocked<typeof User>;
const MockTokenBlacklist = TokenBlacklist as jest.Mocked<typeof TokenBlacklist>;
const MockOTPService = OTPService as jest.Mocked<typeof OTPService>;

const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

process.env['JWT_SECRET'] = 'test-jwt-secret';

describe('AuthService - extended coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  // ── register error handling ──────────────────────────────────────────────
  describe('register - Sequelize error handling', () => {
    it('should throw email error for SequelizeUniqueConstraintError on email field', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed-pw') };
      (User as any).mockImplementation(() => mockUserInstance);
      const uniqueError: any = new Error('Email unique constraint');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      uniqueError.errors = [{ path: 'email' }];
      MockUser.create.mockRejectedValue(uniqueError);

      await expect(
        AuthService.register({ email: 'dupe@test.com', password: 'pass123', fullName: 'Dup', role: UserRole.PATIENT })
      ).rejects.toThrow('Email already exists');
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw generic unique error when path is not email', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed-pw') };
      (User as any).mockImplementation(() => mockUserInstance);
      const uniqueError: any = new Error('Unique constraint');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      uniqueError.errors = [{ path: 'nationalId' }];
      MockUser.create.mockRejectedValue(uniqueError);

      await expect(
        AuthService.register({ email: 'test@test.com', password: 'pass123', fullName: 'Test', role: UserRole.PATIENT })
      ).rejects.toThrow('A record with this information already exists');
    });

    it('should throw validation error for SequelizeValidationError', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed-pw') };
      (User as any).mockImplementation(() => mockUserInstance);
      const validationError: any = new Error('Validation error');
      validationError.name = 'SequelizeValidationError';
      validationError.errors = [{ message: 'Email is invalid' }];
      MockUser.create.mockRejectedValue(validationError);

      await expect(
        AuthService.register({ email: 'bad', password: 'pass123', fullName: 'Test', role: UserRole.PATIENT })
      ).rejects.toThrow('Validation failed');
    });
  });

  // ── login - patient with patientId lookup ─────────────────────────────────
  describe('login - patient lookup', () => {
    it('should include patientId in response for patient role', async () => {
      const Patient = require('../../models/Patient').default;
      const mockUser = {
        id: 'user-001',
        email: 'patient@test.com',
        fullName: 'Patient One',
        role: UserRole.PATIENT,
        phone: '',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      MockUser.findOne.mockResolvedValue(mockUser as any);
      Patient.findOne.mockResolvedValue({ id: 'patient-001' });

      const result = await AuthService.login({ email: 'patient@test.com', password: 'pass' });
      expect(result.user).toHaveProperty('patientId', 'patient-001');
    });

    it('should not include patientId when patient record not found', async () => {
      const Patient = require('../../models/Patient').default;
      const mockUser = {
        id: 'user-002',
        email: 'patient2@test.com',
        fullName: 'Patient Two',
        role: UserRole.PATIENT,
        phone: '',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      MockUser.findOne.mockResolvedValue(mockUser as any);
      Patient.findOne.mockResolvedValue(null);

      const result = await AuthService.login({ email: 'patient2@test.com', password: 'pass' });
      expect(result.user).not.toHaveProperty('patientId');
    });
  });

  // ── deactivateUser / reactivateUser ───────────────────────────────────────
  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      MockUser.findByPk.mockResolvedValue({ id: 'u-1', update: mockUpdate } as any);
      const result = await AuthService.deactivateUser('u-1');
      expect(mockUpdate).toHaveBeenCalledWith({ isActive: false });
      expect(result.message).toContain('deactivated');
    });

    it('should throw if user not found', async () => {
      MockUser.findByPk.mockResolvedValue(null);
      await expect(AuthService.deactivateUser('ghost')).rejects.toThrow('User not found');
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate a user', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      MockUser.findByPk.mockResolvedValue({ id: 'u-1', update: mockUpdate } as any);
      const result = await AuthService.reactivateUser('u-1');
      expect(mockUpdate).toHaveBeenCalledWith({ isActive: true });
      expect(result.message).toContain('reactivated');
    });

    it('should throw if user not found', async () => {
      MockUser.findByPk.mockResolvedValue(null);
      await expect(AuthService.reactivateUser('ghost')).rejects.toThrow('User not found');
    });
  });

  // ── changePassword - user not found ──────────────────────────────────────
  describe('changePassword - user not found', () => {
    it('should throw if user not found', async () => {
      MockUser.findByPk.mockResolvedValue(null);
      await expect(AuthService.changePassword('ghost', 'old', 'new')).rejects.toThrow('User not found');
    });
  });

  // ── logout - error paths ──────────────────────────────────────────────────
  describe('logout - error handling', () => {
    it('should return success for TokenExpiredError', async () => {
      const jwt = require('jsonwebtoken');
      const expiredError: any = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => { throw expiredError; });

      const result = await AuthService.logout('expired-token', 'user-001');
      expect(result.message).toContain('Logout successful');
    });

    it('should return success for JsonWebTokenError', async () => {
      const jwt = require('jsonwebtoken');
      const jwtError: any = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => { throw jwtError; });

      const result = await AuthService.logout('invalid-token', 'user-001');
      expect(result.message).toContain('Logout successful');
    });

    it('should re-throw unexpected errors', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockImplementation(() => { throw new Error('DB crash'); });

      await expect(AuthService.logout('some-token', 'user-001')).rejects.toThrow('DB crash');
    });
  });

  // ── isTokenBlacklisted - error handling ────────────────────────────────────
  describe('isTokenBlacklisted - error', () => {
    it('should return false when blacklist check throws', async () => {
      MockTokenBlacklist.isTokenBlacklisted = jest.fn().mockRejectedValue(new Error('DB error'));
      const result = await AuthService.isTokenBlacklisted('token');
      expect(result).toBe(false);
    });
  });

  // ── cleanupExpiredTokens ──────────────────────────────────────────────────
  describe('cleanupExpiredTokens', () => {
    it('should call TokenBlacklist.cleanupExpiredTokens', async () => {
      MockTokenBlacklist.cleanupExpiredTokens = jest.fn().mockResolvedValue(undefined);
      await AuthService.cleanupExpiredTokens();
      expect(MockTokenBlacklist.cleanupExpiredTokens).toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
      MockTokenBlacklist.cleanupExpiredTokens = jest.fn().mockRejectedValue(new Error('DB error'));
      await expect(AuthService.cleanupExpiredTokens()).resolves.not.toThrow();
    });
  });

  // ── requestPasswordReset ──────────────────────────────────────────────────
  describe('requestPasswordReset', () => {
    it('should return message and expiresAt on success', async () => {
      const expiresAt = new Date();
      MockOTPService.generateAndSendPasswordResetOTP.mockResolvedValue({
        success: true,
        message: 'OTP sent',
        expiresAt,
      } as any);
      const result = await AuthService.requestPasswordReset('user@test.com');
      expect(result.message).toBe('OTP sent');
    });

    it('should throw when OTP generation fails', async () => {
      MockOTPService.generateAndSendPasswordResetOTP.mockResolvedValue({
        success: false,
        message: 'User not found',
      } as any);
      await expect(AuthService.requestPasswordReset('ghost@test.com')).rejects.toThrow('User not found');
    });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      MockOTPService.verifyPasswordResetOTP.mockResolvedValue({ isValid: true, message: 'OK' } as any);
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      MockUser.findOne.mockResolvedValue({
        isActive: true,
        hashPassword: jest.fn().mockResolvedValue('new-hash'),
        update: mockUpdate,
      } as any);
      const result = await AuthService.resetPassword('user@test.com', '123456', 'newpass');
      expect(result.message).toContain('reset successfully');
    });

    it('should throw if OTP is invalid', async () => {
      MockOTPService.verifyPasswordResetOTP.mockResolvedValue({ isValid: false, message: 'OTP expired' } as any);
      await expect(AuthService.resetPassword('user@test.com', 'bad-otp', 'newpass')).rejects.toThrow('OTP expired');
    });

    it('should throw if user not found', async () => {
      MockOTPService.verifyPasswordResetOTP.mockResolvedValue({ isValid: true, message: 'OK' } as any);
      MockUser.findOne.mockResolvedValue(null);
      await expect(AuthService.resetPassword('ghost@test.com', '123456', 'newpass')).rejects.toThrow('User not found');
    });

    it('should throw if user account is deactivated', async () => {
      MockOTPService.verifyPasswordResetOTP.mockResolvedValue({ isValid: true, message: 'OK' } as any);
      MockUser.findOne.mockResolvedValue({ isActive: false } as any);
      await expect(AuthService.resetPassword('inactive@test.com', '123456', 'newpass')).rejects.toThrow('deactivated');
    });
  });
});
