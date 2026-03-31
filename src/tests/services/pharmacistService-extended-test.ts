import { PharmacistService } from '../../services/pharmacistService';
import Pharmacist from '../../models/Pharmacist';

jest.mock('../../models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), update: jest.fn() },
  UserRole: { ADMIN: 'admin', DOCTOR: 'doctor', PATIENT: 'patient', PHARMACIST: 'pharmacist' },
}));
jest.mock('../../models/Pharmacist', () => ({
  default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), update: jest.fn(), destroy: jest.fn() },
  __esModule: true,
}));

const MockPharmacist = Pharmacist as jest.Mocked<typeof Pharmacist>;

beforeEach(() => jest.clearAllMocks());

describe('PharmacistService - extended coverage', () => {
  // ── getPharmacistByUserId ──────────────────────────────────────────────────
  describe('getPharmacistByUserId', () => {
    it('should return pharmacist profile when found', async () => {
      MockPharmacist.findOne.mockResolvedValue({
        id: 'ph-001',
        userId: 'user-001',
        licenseNumber: 'PHARM-001',
        pharmacyName: 'Test Pharmacy',
        pharmacyAddress: '123 Main St',
        isVerified: true,
        createdAt: new Date(),
        user: { email: 'ph@test.com', fullName: 'Pharmacist One', phone: '+250788001', nationalId: '1234', role: 'pharmacist' },
      } as any);

      const result = await PharmacistService.getPharmacistByUserId('user-001');
      expect(result).not.toBeNull();
      expect(result!.userId).toBe('user-001');
    });

    it('should return null if pharmacist not found', async () => {
      MockPharmacist.findOne.mockResolvedValue(null);
      const result = await PharmacistService.getPharmacistByUserId('ghost');
      expect(result).toBeNull();
    });

    it('should throw on error', async () => {
      MockPharmacist.findOne.mockRejectedValue(new Error('DB error'));
      await expect(PharmacistService.getPharmacistByUserId('user-001')).rejects.toThrow('DB error');
    });
  });

  // ── updatePharmacist ────────────────────────────────────────────────────────
  describe('updatePharmacist', () => {
    it('should update and return updated pharmacist', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      MockPharmacist.findByPk
        .mockResolvedValueOnce({ id: 'ph-001', userId: 'u-1', update: mockUpdate } as any)
        .mockResolvedValueOnce({
          id: 'ph-001',
          userId: 'u-1',
          licenseNumber: 'NEW-LIC',
          pharmacyName: 'Updated',
          isVerified: true,
          createdAt: new Date(),
          user: { email: 'ph@test.com', fullName: 'Ph One', phone: '', nationalId: '', role: 'pharmacist' },
        } as any);

      const result = await PharmacistService.updatePharmacist('ph-001', { licenseNumber: 'NEW-LIC' });
      expect(mockUpdate).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('should throw on error', async () => {
      MockPharmacist.findByPk.mockRejectedValue(new Error('DB error'));
      await expect(PharmacistService.updatePharmacist('ph-001', {})).rejects.toThrow('DB error');
    });
  });

  // ── getPharmacistById - error ──────────────────────────────────────────────
  describe('getPharmacistById - error', () => {
    it('should throw on error', async () => {
      MockPharmacist.findByPk.mockRejectedValue(new Error('DB error'));
      await expect(PharmacistService.getPharmacistById('ph-001')).rejects.toThrow('DB error');
    });
  });

  // ── getAllPharmacists - error ───────────────────────────────────────────────
  describe('getAllPharmacists - error', () => {
    it('should throw on error', async () => {
      MockPharmacist.findAndCountAll.mockRejectedValue(new Error('DB error'));
      await expect(PharmacistService.getAllPharmacists()).rejects.toThrow('DB error');
    });
  });

  // ── verifyPharmacist - error ───────────────────────────────────────────────
  describe('verifyPharmacist - error', () => {
    it('should throw on DB error', async () => {
      MockPharmacist.findByPk.mockRejectedValue(new Error('DB error'));
      await expect(PharmacistService.verifyPharmacist('ph-001')).rejects.toThrow('DB error');
    });
  });

  // ── unverifyPharmacist - error and not found ───────────────────────────────
  describe('unverifyPharmacist', () => {
    it('should throw when pharmacist not found', async () => {
      MockPharmacist.findByPk.mockResolvedValue(null);
      await expect(PharmacistService.unverifyPharmacist('ghost')).rejects.toThrow('Pharmacist not found');
    });

    it('should throw on DB error', async () => {
      MockPharmacist.findByPk.mockRejectedValue(new Error('DB error'));
      await expect(PharmacistService.unverifyPharmacist('ph-001')).rejects.toThrow('DB error');
    });
  });
});
