/**
 * Covers the right-side branches of `||` fallback messages in PharmacistController.
 * Errors without a .message property force the `|| 'default'` right-side branch.
 */
import { Request, Response } from 'express';
import { PharmacistController } from '../../controllers/pharmacistController';
import { PharmacistService } from '../../services/pharmacistService';
import { AuthService } from '../../services/authService';

jest.mock('../../services/pharmacistService');
jest.mock('../../services/authService');
const MockPharmacistService = PharmacistService as jest.Mocked<typeof PharmacistService>;
const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const noMsgErr = { code: 'ERR' }; // no .message property

beforeEach(() => jest.clearAllMocks());

describe('PharmacistController - || fallback message branches', () => {
  it('registerPharmacist: uses fallback message when error has no .message', async () => {
    MockAuthService.register.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await PharmacistController.registerPharmacist(
      { body: { email: 'p@t.com', password: 'pass123', fullName: 'Ph', licenseNumber: 'L', pharmacyName: 'P' }, params: {}, query: {} } as any,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Pharmacist registration failed');
  });

  it('getAllPharmacists: uses fallback message when error has no .message', async () => {
    MockPharmacistService.getAllPharmacists.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await PharmacistController.getAllPharmacists({ body: {}, params: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to fetch pharmacists');
  });

  it('getPharmacistById: uses fallback message when error has no .message', async () => {
    MockPharmacistService.getPharmacistById.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await PharmacistController.getPharmacistById({ params: { pharmacistId: 'ph-1' }, body: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to fetch pharmacist');
  });

  it('updatePharmacist: uses fallback message when error has no .message', async () => {
    MockPharmacistService.updatePharmacist.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await PharmacistController.updatePharmacist({ params: { pharmacistId: 'ph-1' }, body: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to update pharmacist');
  });

  it('deletePharmacist: uses fallback message when error has no .message', async () => {
    MockPharmacistService.deletePharmacist.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await PharmacistController.deletePharmacist({ params: { pharmacistId: 'ph-1' }, body: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to delete pharmacist');
  });

  it('verifyPharmacist: uses fallback message when error has no .message', async () => {
    MockPharmacistService.verifyPharmacist.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await PharmacistController.verifyPharmacist({ params: { pharmacistId: 'ph-1' }, body: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to verify pharmacist');
  });

  it('unverifyPharmacist: uses fallback message when error has no .message', async () => {
    MockPharmacistService.unverifyPharmacist.mockRejectedValue(noMsgErr);
    const res = makeRes();
    await PharmacistController.unverifyPharmacist({ params: { pharmacistId: 'ph-1' }, body: {}, query: {} } as any, res);
    expect(res.status).toHaveBeenCalledWith(400);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).toBe('Failed to unverify pharmacist');
  });
});
