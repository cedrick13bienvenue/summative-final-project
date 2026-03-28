import OTPVerification from '../../models/OTPVerification';

describe('OTPVerification Model', () => {
  describe('isExpired', () => {
    it('should return true when OTP is past expiry', () => {
      const otp = new OTPVerification({
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
      } as any);
      expect(otp.isExpired()).toBe(true);
    });

    it('should return false when OTP is not yet expired', () => {
      const otp = new OTPVerification({
        expiresAt: new Date(Date.now() + 60000), // 1 minute from now
      } as any);
      expect(otp.isExpired()).toBe(false);
    });

    it('should return true exactly at expiry boundary', () => {
      const otp = new OTPVerification({
        expiresAt: new Date(Date.now() - 1),
      } as any);
      expect(otp.isExpired()).toBe(true);
    });
  });

  describe('isValid', () => {
    it('should return true for unexpired, unused OTP', () => {
      const otp = new OTPVerification({
        isUsed: false,
        expiresAt: new Date(Date.now() + 60000),
      } as any);
      expect(otp.isValid()).toBe(true);
    });

    it('should return false for expired OTP', () => {
      const otp = new OTPVerification({
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000),
      } as any);
      expect(otp.isValid()).toBe(false);
    });

    it('should return false for used OTP even if not expired', () => {
      const otp = new OTPVerification({
        isUsed: true,
        expiresAt: new Date(Date.now() + 60000),
      } as any);
      expect(otp.isValid()).toBe(false);
    });

    it('should return false when both expired and used', () => {
      const otp = new OTPVerification({
        isUsed: true,
        expiresAt: new Date(Date.now() - 1000),
      } as any);
      expect(otp.isValid()).toBe(false);
    });
  });

  describe('generateOTPCode (static)', () => {
    it('should return a 6-digit string', () => {
      const code = OTPVerification.generateOTPCode();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set(Array.from({ length: 10 }, () => OTPVerification.generateOTPCode()));
      // With 10 calls, the probability of all being the same is negligible
      expect(codes.size).toBeGreaterThan(1);
    });

    it('should always be within 000000–999999 range', () => {
      for (let i = 0; i < 20; i++) {
        const code = OTPVerification.generateOTPCode();
        const num = parseInt(code, 10);
        expect(num).toBeGreaterThanOrEqual(0);
        expect(num).toBeLessThanOrEqual(999999);
      }
    });
  });

  describe('OTPVerification attributes', () => {
    it('should hold all required fields', () => {
      const otp = new OTPVerification({
        id: 'otp-123',
        patientId: 'patient-123',
        email: 'patient@example.com',
        otpCode: '123456',
        purpose: 'medical_history_access',
        isUsed: false,
        expiresAt: new Date(Date.now() + 300000),
      } as any);

      expect(otp.patientId).toBe('patient-123');
      expect(otp.email).toBe('patient@example.com');
      expect(otp.otpCode).toBe('123456');
      expect(otp.purpose).toBe('medical_history_access');
      expect(otp.isUsed).toBe(false);
    });

    it('should support password_reset purpose', () => {
      const otp = new OTPVerification({
        purpose: 'password_reset',
        isUsed: false,
        expiresAt: new Date(Date.now() + 300000),
      } as any);
      expect(otp.purpose).toBe('password_reset');
    });
  });
});
