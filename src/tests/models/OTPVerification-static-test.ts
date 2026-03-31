/**
 * Tests for OTPVerification static methods using spies
 * (not mocking the whole module, so actual code gets coverage)
 */
import OTPVerification from '../../models/OTPVerification';

describe('OTPVerification static methods (code coverage)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('cleanupExpiredOTPs', () => {
    it('should call destroy with expired condition', async () => {
      jest.spyOn(OTPVerification, 'destroy').mockResolvedValue(0 as any);
      await OTPVerification.cleanupExpiredOTPs();
      expect(OTPVerification.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.any(Object) })
      );
    });

    it('should not throw if destroy fails silently', async () => {
      jest.spyOn(OTPVerification, 'destroy').mockRejectedValue(new Error('DB error'));
      await expect(OTPVerification.cleanupExpiredOTPs()).resolves.not.toThrow();
    });
  });

  describe('findValidOTP', () => {
    it('should return null when OTP is not found', async () => {
      jest.spyOn(OTPVerification, 'findOne').mockResolvedValue(null);
      const result = await OTPVerification.findValidOTP('123456', 'patient-1');
      expect(result).toBeNull();
    });

    it('should return null when OTP is expired', async () => {
      const expiredOTP = new OTPVerification({
        id: 'otp-1',
        otpCode: '123456',
        patientId: 'patient-1',
        email: 'p@test.com',
        purpose: 'medical_history_access',
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000),
      } as any);
      jest.spyOn(OTPVerification, 'findOne').mockResolvedValue(expiredOTP);
      const result = await OTPVerification.findValidOTP('123456', 'patient-1');
      expect(result).toBeNull();
    });

    it('should return OTP when found and not expired', async () => {
      const validOTP = new OTPVerification({
        id: 'otp-1',
        otpCode: '123456',
        patientId: 'patient-1',
        email: 'p@test.com',
        purpose: 'medical_history_access',
        isUsed: false,
        expiresAt: new Date(Date.now() + 600000),
      } as any);
      jest.spyOn(OTPVerification, 'findOne').mockResolvedValue(validOTP);
      const result = await OTPVerification.findValidOTP('123456', 'patient-1');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('otp-1');
    });
  });

  describe('findValidOTPByEmail', () => {
    it('should return null when OTP is not found', async () => {
      jest.spyOn(OTPVerification, 'findOne').mockResolvedValue(null);
      const result = await OTPVerification.findValidOTPByEmail('654321', 'user@test.com', 'password_reset');
      expect(result).toBeNull();
    });

    it('should return null when OTP is expired', async () => {
      const expiredOTP = new OTPVerification({
        id: 'otp-reset-1',
        otpCode: '654321',
        email: 'user@test.com',
        purpose: 'password_reset',
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000),
      } as any);
      jest.spyOn(OTPVerification, 'findOne').mockResolvedValue(expiredOTP);
      const result = await OTPVerification.findValidOTPByEmail('654321', 'user@test.com', 'password_reset');
      expect(result).toBeNull();
    });

    it('should return OTP when found and not expired', async () => {
      const validOTP = new OTPVerification({
        id: 'otp-reset-1',
        otpCode: '654321',
        email: 'user@test.com',
        purpose: 'password_reset',
        isUsed: false,
        expiresAt: new Date(Date.now() + 600000),
      } as any);
      jest.spyOn(OTPVerification, 'findOne').mockResolvedValue(validOTP);
      const result = await OTPVerification.findValidOTPByEmail('654321', 'user@test.com', 'password_reset');
      expect(result?.id).toBe('otp-reset-1');
    });
  });
});
