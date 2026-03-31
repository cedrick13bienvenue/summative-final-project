import { requireOTPVerification, generateOTPForPatient } from '../../middleware/otpVerification';
import { UserRole } from '../../models';

jest.mock('../../models', () => ({
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
  },
}));

jest.mock('../../services/otpService', () => ({
  OTPService: {
    verifyOTP: jest.fn(),
    generateAndSendOTP: jest.fn(),
  },
}));

jest.mock('../../models', () => ({
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
  },
}));

// Mock dynamic import of Patient
const mockPatientFindByPk = jest.fn();
jest.mock('../../models/Patient', () => ({}), { virtual: true });

// We need to intercept dynamic import('../models')
const mockPatient = { findByPk: jest.fn() };
jest.doMock('../../models', () => ({
  UserRole: { PATIENT: 'patient', DOCTOR: 'doctor', PHARMACIST: 'pharmacist', ADMIN: 'admin' },
  Patient: mockPatient,
}));

import { OTPService } from '../../services/otpService';
const MockOTPService = OTPService as jest.Mocked<typeof OTPService>;

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
    mockPatient.findByPk.mockResolvedValue(null);
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
    mockPatient.findByPk.mockResolvedValue({ userId: 'other-user' });
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
    mockPatient.findByPk.mockResolvedValue({ userId: 'u-1' });
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
    mockPatient.findByPk.mockResolvedValue({ userId: 'u-1' });
    MockOTPService.verifyOTP.mockResolvedValue({ isValid: false, message: 'Invalid OTP' });
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
    mockPatient.findByPk.mockResolvedValue({ userId: 'u-1' });
    MockOTPService.verifyOTP.mockResolvedValue({ isValid: true, message: 'OK' });
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
    mockPatient.findByPk.mockRejectedValue(new Error('DB error'));
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
    mockPatient.findByPk.mockResolvedValue(null);
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 403 if patient belongs to another user', async () => {
    mockPatient.findByPk.mockResolvedValue({ userId: 'other-user' });
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 400 if OTP generation fails', async () => {
    mockPatient.findByPk.mockResolvedValue({ userId: 'u-1' });
    MockOTPService.generateAndSendOTP.mockResolvedValue({ success: false, message: 'Failed' });
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 200 and OTP data on success', async () => {
    mockPatient.findByPk.mockResolvedValue({ userId: 'u-1' });
    const expiresAt = new Date();
    MockOTPService.generateAndSendOTP.mockResolvedValue({
      success: true,
      message: 'OTP sent',
      otpId: 'otp-1',
      expiresAt,
    });
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it('should return 500 on unexpected error', async () => {
    mockPatient.findByPk.mockRejectedValue(new Error('Unexpected'));
    const req = mockReq({
      params: { patientId: 'p-1' },
      user: { id: 'u-1', role: 'patient' },
    });
    const res = mockRes();
    await generateOTPForPatient(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
