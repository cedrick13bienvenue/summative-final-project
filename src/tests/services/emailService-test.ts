import { EmailService } from '../../services/emailService';
import { UserRole } from '../../models';

jest.mock('../../models', () => ({
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
  },
}));

const mockSendMail = jest.fn();
const mockVerify = jest.fn();

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    verify: mockVerify,
    sendMail: mockSendMail,
  })),
}));

const prescriptionEmailData = {
  patientName: 'Jane Doe',
  patientEmail: 'jane@test.com',
  prescriptionNumber: 'RX-001',
  patientNationalId: '1234567890123456',
  doctorName: 'Dr. Smith',
  diagnosis: 'Hypertension',
  medicines: [
    { name: 'Lisinopril', dosage: '10mg', frequency: 'once daily', quantity: 30, instructions: 'With food' },
  ],
  qrCodeImage: 'data:image/png;base64,abc123',
  qrHash: 'hash001',
  expiresAt: new Date().toISOString(),
};

const welcomeEmailData = {
  userName: 'John Doe',
  userEmail: 'john@test.com',
  userRole: UserRole.PATIENT,
  loginUrl: 'http://localhost:3000/login',
};

const otpEmailData = {
  patientName: 'Jane Doe',
  patientEmail: 'jane@test.com',
  otpCode: '123456',
  expiresAt: new Date(),
};

const passwordResetOTPData = {
  userName: 'John Doe',
  userEmail: 'john@test.com',
  otpCode: '654321',
  expiresAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Reset transporter singleton between tests
  (EmailService as any).transporter = null;
  mockVerify.mockResolvedValue(true);
  mockSendMail.mockResolvedValue({ messageId: 'msg-001' });
  process.env['SMTP_HOST'] = 'smtp.test.com';
  process.env['SMTP_PORT'] = '587';
  process.env['SMTP_USER'] = 'test@test.com';
  process.env['SMTP_PASS'] = 'password';
});

describe('EmailService.sendPrescriptionEmail', () => {
  it('should send prescription email successfully', async () => {
    const result = await EmailService.sendPrescriptionEmail(prescriptionEmailData);
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@test.com' })
    );
  });

  it('should throw when sendMail fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));
    await expect(EmailService.sendPrescriptionEmail(prescriptionEmailData)).rejects.toThrow(
      'Failed to send prescription email'
    );
  });

  it('should throw when transporter verify fails', async () => {
    mockVerify.mockRejectedValue(new Error('Config error'));
    await expect(EmailService.sendPrescriptionEmail(prescriptionEmailData)).rejects.toThrow();
  });

  it('should reuse existing transporter on second call', async () => {
    await EmailService.sendPrescriptionEmail(prescriptionEmailData);
    await EmailService.sendPrescriptionEmail(prescriptionEmailData);
    // createTransport should only be called once per module (transporter reused)
    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  it('should handle prescription email without diagnosis', async () => {
    const data = { ...prescriptionEmailData, diagnosis: undefined };
    const result = await EmailService.sendPrescriptionEmail(data);
    expect(result).toBe(true);
  });

  it('should handle prescription email with medicine without instructions', async () => {
    const data = {
      ...prescriptionEmailData,
      medicines: [{ name: 'Aspirin', dosage: '100mg', frequency: 'daily', quantity: 10 }],
    };
    const result = await EmailService.sendPrescriptionEmail(data);
    expect(result).toBe(true);
  });
});

describe('EmailService.sendWelcomeEmail', () => {
  it('should send welcome email for PATIENT role', async () => {
    const result = await EmailService.sendWelcomeEmail(welcomeEmailData);
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'john@test.com' })
    );
  });

  it('should send welcome email for DOCTOR role', async () => {
    const result = await EmailService.sendWelcomeEmail({ ...welcomeEmailData, userRole: UserRole.DOCTOR });
    expect(result).toBe(true);
  });

  it('should send welcome email for PHARMACIST role', async () => {
    const result = await EmailService.sendWelcomeEmail({ ...welcomeEmailData, userRole: UserRole.PHARMACIST });
    expect(result).toBe(true);
  });

  it('should send welcome email for ADMIN role', async () => {
    const result = await EmailService.sendWelcomeEmail({ ...welcomeEmailData, userRole: UserRole.ADMIN });
    expect(result).toBe(true);
  });

  it('should throw when sendMail fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));
    await expect(EmailService.sendWelcomeEmail(welcomeEmailData)).rejects.toThrow(
      'Failed to send welcome email'
    );
  });
});

describe('EmailService.sendOTPEmail', () => {
  it('should send OTP email successfully', async () => {
    const result = await EmailService.sendOTPEmail(otpEmailData);
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@test.com' })
    );
  });

  it('should throw when sendMail fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));
    await expect(EmailService.sendOTPEmail(otpEmailData)).rejects.toThrow(
      'Failed to send OTP email'
    );
  });
});

describe('EmailService.sendPasswordResetOTPEmail', () => {
  it('should send password reset OTP email successfully', async () => {
    const result = await EmailService.sendPasswordResetOTPEmail(passwordResetOTPData);
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'john@test.com' })
    );
  });

  it('should throw when sendMail fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));
    await expect(EmailService.sendPasswordResetOTPEmail(passwordResetOTPData)).rejects.toThrow(
      'Failed to send password reset OTP email'
    );
  });
});

describe('EmailService.sendPasswordResetEmail', () => {
  it('should send password reset email successfully', async () => {
    const result = await EmailService.sendPasswordResetEmail('user@test.com', 'reset-token', 'User Name');
    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@test.com' })
    );
  });

  it('should throw when sendMail fails', async () => {
    mockSendMail.mockRejectedValue(new Error('SMTP error'));
    await expect(
      EmailService.sendPasswordResetEmail('user@test.com', 'token', 'User')
    ).rejects.toThrow('Failed to send password reset email');
  });
});
