/**
 * Extended OTPService tests covering generateAndSendPasswordResetOTP branches
 * that require a proper User mock (dynamic import from '../models').
 */
import { OTPService } from '../../services/otpService';
import OTPVerification from '../../models/OTPVerification';
import { EmailService } from '../../services/emailService';

// IMPORTANT: models mock MUST include User so that the dynamic
// `const { User } = await import('../models')` inside the service resolves correctly.
jest.mock('../../models', () => ({
  Patient: { findByPk: jest.fn() },
  User: { findOne: jest.fn() },
}));

jest.mock('../../models/OTPVerification', () => ({
  findOne: jest.fn(),
  findValidOTP: jest.fn(),
  findValidOTPByEmail: jest.fn(),
  generateOTPCode: jest.fn().mockReturnValue('654321'),
  cleanupExpiredOTPs: jest.fn(),
  create: jest.fn(),
}));

jest.mock('../../services/emailService', () => ({
  EmailService: {
    sendOTPEmail: jest.fn(),
    sendPasswordResetOTPEmail: jest.fn(),
  },
}));

const MockOTPVerification = OTPVerification as jest.Mocked<typeof OTPVerification>;
const MockEmailService = EmailService as jest.Mocked<typeof EmailService>;

beforeEach(() => jest.clearAllMocks());

// ── generateAndSendPasswordResetOTP ──────────────────────────────────────
describe('OTPService.generateAndSendPasswordResetOTP', () => {
  let MockUser: any;

  beforeEach(async () => {
    const models = await import('../../models');
    MockUser = models.User;
    jest.clearAllMocks();
  });

  it('should return success:false when user not found', async () => {
    MockUser.findOne.mockResolvedValue(null);
    const result = await OTPService.generateAndSendPasswordResetOTP('nobody@test.com');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should return success:false when user account is deactivated', async () => {
    MockUser.findOne.mockResolvedValue({ isActive: false, fullName: 'Jane', email: 'j@t.com' });
    const result = await OTPService.generateAndSendPasswordResetOTP('j@t.com');
    expect(result.success).toBe(false);
    expect(result.message).toContain('deactivated');
  });

  it('should return success:false when valid password reset OTP already exists', async () => {
    MockUser.findOne.mockResolvedValue({ isActive: true, fullName: 'Jane', email: 'j@t.com' });
    (MockOTPVerification.findOne as jest.Mock).mockResolvedValue({
      isExpired: jest.fn().mockReturnValue(false),
    });
    const result = await OTPService.generateAndSendPasswordResetOTP('j@t.com');
    expect(result.success).toBe(false);
    expect(result.message).toContain('already been sent');
  });

  it('should generate and send when expired OTP exists', async () => {
    MockUser.findOne.mockResolvedValue({ isActive: true, fullName: 'Jane', email: 'j@t.com' });
    (MockOTPVerification.findOne as jest.Mock).mockResolvedValue({
      isExpired: jest.fn().mockReturnValue(true),
    });
    (MockOTPVerification.create as jest.Mock).mockResolvedValue({ id: 'otp-pw-1' });
    MockEmailService.sendPasswordResetOTPEmail.mockResolvedValue(true as any);
    const result = await OTPService.generateAndSendPasswordResetOTP('j@t.com');
    expect(result.success).toBe(true);
    expect(result.otpId).toBe('otp-pw-1');
    expect(MockEmailService.sendPasswordResetOTPEmail).toHaveBeenCalled();
  });

  it('should generate and send when no existing OTP', async () => {
    MockUser.findOne.mockResolvedValue({ isActive: true, fullName: 'Jane', email: 'j@t.com' });
    (MockOTPVerification.findOne as jest.Mock).mockResolvedValue(null);
    (MockOTPVerification.create as jest.Mock).mockResolvedValue({ id: 'otp-pw-2' });
    MockEmailService.sendPasswordResetOTPEmail.mockResolvedValue(true as any);
    const result = await OTPService.generateAndSendPasswordResetOTP('j@t.com');
    expect(result.success).toBe(true);
  });

  it('should return success:false on unexpected error', async () => {
    MockUser.findOne.mockRejectedValue(new Error('DB crash'));
    const result = await OTPService.generateAndSendPasswordResetOTP('j@t.com');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed');
  });
});

// ── sendOTPEmail (private) - tested via generateAndSendOTP email failure ──
describe('OTPService.generateAndSendOTP - email failure', () => {
  it('should return success:false when sendOTPEmail throws', async () => {
    const { Patient } = await import('../../models');
    (Patient.findByPk as jest.Mock).mockResolvedValue({
      id: 'p-1', fullName: 'Jane', user: { email: 'j@t.com' },
    });
    (MockOTPVerification.findOne as jest.Mock).mockResolvedValue(null);
    (MockOTPVerification.create as jest.Mock).mockResolvedValue({ id: 'otp-1' });
    MockEmailService.sendOTPEmail.mockRejectedValue(new Error('SMTP failure'));

    const result = await OTPService.generateAndSendOTP('p-1');
    expect(result.success).toBe(false);
  });
});

// ── verifyPasswordResetOTP - error path ────────────────────────────────────
describe('OTPService.verifyPasswordResetOTP - extended', () => {
  it('should return isValid:false on DB error', async () => {
    (MockOTPVerification.findValidOTPByEmail as jest.Mock).mockRejectedValue(new Error('DB error'));
    const result = await OTPService.verifyPasswordResetOTP('111111', 'j@t.com');
    expect(result.isValid).toBe(false);
  });
});
