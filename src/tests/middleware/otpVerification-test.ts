import { requireOTPVerification, generateOTPForPatient } from '../../middleware/otpVerification';

// Mock the entire models module including Patient (used via dynamic import inside middleware)
const mockPatientFindByPk = jest.fn();

jest.mock('../../models', () => ({
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
  },
  Patient: { findByPk: jest.fn() },
}));

jest.mock('../../services/otpService', () => ({
  OTPService: {
    verifyOTP: jest.fn(),
    generateAndSendOTP: jest.fn(),
  },
}));

import { OTPService } from '../../services/otpService';
import { Patient } from '../../models';

const MockOTPService = OTPService as jest.Mocked<typeof OTPService>;
const MockPatient = Patient as jest.Mocked<typeof Patient>;

const mockReq = (overrides: any = {}) => ({
  headers: {},
  params: {},
  query: {},
  body: {},
  ...overrides,
}) as any;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('requireOTPVerification', () => {
  it('should return 401 if user is not authenticated', async () => {
    const req = mockReq({ params: { patientId: 'p-1' }, query: {} });
    const res = mockRes();
    await requireOTPVerification(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should call next immediately for non-patient roles', async () => {
    const req = mockReq({
      params: { patientId: 'p-1' },
      query: {},
      user: { id: 'u-1', role: 'doctor' },
    });
    const res = mockRes();
    await requireOTPVerification(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 404 if patient is not found', async () => {
    MockPatient.findByPk.mockResolvedValue(null);
    const req = mockReq({
      params: { patientId: 'p-1' },
      query: {},
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await requireOTPVerification(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 403 if patient belongs to another user', async () => {
    MockPatient.findByPk.mockResolvedValue({ userId: 'other-user' } as any);
    const req = mockReq({
      params: { patientId: 'p-1' },
      query: {},
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await requireOTPVerification(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 400 if no OTP code is provided', async () => {
    MockPatient.findByPk.mockResolvedValue({ userId: 'u-1' } as any);
    const req = mockReq({
      params: { patientId: 'p-1' },
      query: {},
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await requireOTPVerification(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if OTP code is invalid', async () => {
    MockPatient.findByPk.mockResolvedValue({ userId: 'u-1' } as any);
    MockOTPService.verifyOTP.mockResolvedValue({ isValid: false, message: 'Invalid OTP' } as any);
    const req = mockReq({
      params: { patientId: 'p-1' },
      query: { otpCode: '123456' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await requireOTPVerification(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next if OTP is valid', async () => {
    MockPatient.findByPk.mockResolvedValue({ userId: 'u-1' } as any);
    MockOTPService.verifyOTP.mockResolvedValue({ isValid: true, message: 'OK' } as any);
    const req = mockReq({
      params: { patientId: 'p-1' },
      query: { otpCode: '123456' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await requireOTPVerification(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 500 on unexpected error', async () => {
    MockPatient.findByPk.mockRejectedValue(new Error('DB error'));
    const req = mockReq({
      params: { patientId: 'p-1' },
      query: { otpCode: '123456' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await requireOTPVerification(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('generateOTPForPatient', () => {
  it('should return 401 if user is not authenticated', async () => {
    const req = mockReq({ params: { patientId: 'p-1' } });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 for non-patient users', async () => {
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'doctor' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 404 if patient is not found', async () => {
    MockPatient.findByPk.mockResolvedValue(null);
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 403 if patient belongs to another user', async () => {
    MockPatient.findByPk.mockResolvedValue({ userId: 'other-user' } as any);
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 400 if OTP generation fails', async () => {
    MockPatient.findByPk.mockResolvedValue({ userId: 'u-1' } as any);
    MockOTPService.generateAndSendOTP.mockResolvedValue({ success: false, message: 'Failed' } as any);
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 200 and OTP data on success', async () => {
    MockPatient.findByPk.mockResolvedValue({ userId: 'u-1' } as any);
    const expiresAt = new Date();
    MockOTPService.generateAndSendOTP.mockResolvedValue({
      success: true,
      message: 'OTP sent',
      otpId: 'otp-1',
      expiresAt,
    } as any);
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('should return 500 on unexpected error', async () => {
    MockPatient.findByPk.mockRejectedValue(new Error('Unexpected'));
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
