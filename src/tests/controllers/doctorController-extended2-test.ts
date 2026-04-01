/**
 * Covers the right-side branches of `||` fallback messages in DoctorController
 * and the `error.errors || []` branches in SequelizeError handlers.
 * These branches require errors without a .message property, or without an .errors array.
 */
import { Request, Response } from 'express';
import { DoctorController } from '../../controllers/doctorController';
import { DoctorService } from '../../services/doctorService';
import { AuthService } from '../../services/authService';

jest.mock('../../services/doctorService');
jest.mock('../../services/authService');
const MockDoctorService = DoctorService as jest.Mocked<typeof DoctorService>;
const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// No .message property — forces the `|| 'default'` right-side branch
const noMsgErr = { code: 'ERR' };

beforeEach(() => jest.clearAllMocks());

describe('DoctorController - || fallback message branches', () => {
  describe('registerDoctor', () => {
    const validBody = {
      email: 'd@test.com', password: 'pass123', fullName: 'Dr', licenseNumber: 'L', specialization: 'S', hospitalName: 'H',
    };

    it('uses fallback message when generic error has no .message', async () => {
      MockAuthService.register.mockRejectedValue(noMsgErr);
      const res = makeRes();
      await DoctorController.registerDoctor({ body: validBody, params: {}, query: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(500);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.error.message).toBe('Doctor registration failed. Please try again later.');
    });

    it('SequelizeUniqueConstraintError with no errors array — covers || []', async () => {
      MockAuthService.register.mockResolvedValue({
        user: { id: 'u-1', email: 'd@test.com', fullName: 'Dr', role: 'doctor' as any },
        token: 'tok',
      });
      MockDoctorService.createDoctorProfile.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' });
      const res = makeRes();
      await DoctorController.registerDoctor({ body: validBody, params: {}, query: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('SequelizeValidationError with no errors array — covers || []', async () => {
      MockAuthService.register.mockResolvedValue({
        user: { id: 'u-1', email: 'd@test.com', fullName: 'Dr', role: 'doctor' as any },
        token: 'tok',
      });
      MockDoctorService.createDoctorProfile.mockRejectedValue({ name: 'SequelizeValidationError' });
      const res = makeRes();
      await DoctorController.registerDoctor({ body: validBody, params: {}, query: {} } as any, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  it('getAllDoctors: uses fallback message when error has no .message', async () => {
    MockDoctorService.getAllDoctors.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await DoctorController.getAllDoctors({ body: {}, params: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to fetch doctors');
  });

  it('getDoctorById: uses fallback message when error has no .message', async () => {
    MockDoctorService.getDoctorById.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await DoctorController.getDoctorById({ params: { doctorId: 'doc-1' }, body: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to fetch doctor');
  });

  it('updateDoctorProfile: uses fallback message when error has no .message', async () => {
    MockDoctorService.updateDoctorProfile.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await DoctorController.updateDoctorProfile({ params: { doctorId: 'doc-1' }, body: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to update doctor');
  });

  it('deleteDoctor: uses fallback message when error has no .message', async () => {
    MockDoctorService.deleteDoctor.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await DoctorController.deleteDoctor({ params: { doctorId: 'doc-1' }, body: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to delete doctor');
  });
});
