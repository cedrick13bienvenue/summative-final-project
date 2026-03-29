import { PharmacistService } from '../../services/pharmacistService';
import Pharmacist from '../../models/Pharmacist';

jest.mock('../../models', () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  UserRole: {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    PHARMACIST: 'pharmacist',
  },
}));
jest.mock('../../models/Pharmacist', () => ({
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  __esModule: true,
}));
jest.mock('../../database/config/database', () => ({
  sequelize: { transaction: jest.fn() },
}));

const MockPharmacist = Pharmacist as jest.Mocked<typeof Pharmacist>;
const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

describe('PharmacistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPharmacistProfile', () => {
    it('should create a pharmacist successfully', async () => {
      MockPharmacist.create.mockResolvedValue({
        id: 'ph-001',
        userId: 'user-ph-001',
        licenseNumber: 'PHARM-RW-001',
        pharmacyName: 'Kigali Pharmacy',
        isVerified: true,
      } as any);

      MockPharmacist.findByPk.mockResolvedValue({
        id: 'ph-001',
        userId: 'user-ph-001',
        licenseNumber: 'PHARM-RW-001',
        pharmacyName: 'Kigali Pharmacy',
        isVerified: true,
        email: 'pharm@example.rw',
        fullName: 'Jean Pharmacist',
        createdAt: new Date(),
      } as any);

      const result = await PharmacistService.createPharmacistProfile({
        userId: 'user-ph-001',
        licenseNumber: 'PHARM-RW-001',
        pharmacyName: 'Kigali Pharmacy',
        pharmacyAddress: 'KN 2 St',
      });

      expect(MockPharmacist.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw on error', async () => {
      MockPharmacist.create.mockRejectedValue(new Error('DB fail'));

      await expect(
        PharmacistService.createPharmacistProfile({
          userId: 'user-fail-001',
          licenseNumber: 'FAIL',
          pharmacyName: 'Fail Pharmacy',
          pharmacyAddress: 'Nowhere',
        })
      ).rejects.toThrow();
    });
  });

  describe('getPharmacistById', () => {
    it('should return pharmacist profile', async () => {
      MockPharmacist.findByPk.mockResolvedValue({
        id: 'ph-001',
        licenseNumber: 'PHARM-001',
        isVerified: true,
        user: { email: 'p@rw.rw', fullName: 'Test Pharm', nationalId: '1234567890123456' },
      } as any);

      const result = await PharmacistService.getPharmacistById('ph-001');
      expect(result).toBeDefined();
    });

    it('should return null if pharmacist not found', async () => {
      MockPharmacist.findByPk.mockResolvedValue(null);
      const result = await PharmacistService.getPharmacistById('ghost');
      expect(result).toBeNull();
    });
  });

  describe('verifyPharmacist', () => {
    it('should set isVerified to true', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const verifiedPharmacist = {
        id: 'ph-001',
        userId: 'user-ph-001',
        licenseNumber: 'PHARM-001',
        pharmacyName: 'Test Pharmacy',
        isVerified: true,
        createdAt: new Date(),
      };
      MockPharmacist.findByPk
        .mockResolvedValueOnce({ isVerified: false, update: mockUpdate } as any)
        .mockResolvedValueOnce(verifiedPharmacist as any);

      await PharmacistService.verifyPharmacist('ph-001');
      expect(mockUpdate).toHaveBeenCalledWith({ isVerified: true });
    });

    it('should throw if pharmacist not found', async () => {
      MockPharmacist.findByPk.mockResolvedValue(null);
      await expect(PharmacistService.verifyPharmacist('ghost')).rejects.toThrow('Pharmacist not found');
    });
  });

  describe('unverifyPharmacist', () => {
    it('should set isVerified to false', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const unverifiedPharmacist = {
        id: 'ph-001',
        userId: 'user-ph-001',
        licenseNumber: 'PHARM-001',
        pharmacyName: 'Test Pharmacy',
        isVerified: false,
        createdAt: new Date(),
      };
      MockPharmacist.findByPk
        .mockResolvedValueOnce({ isVerified: true, update: mockUpdate } as any)
        .mockResolvedValueOnce(unverifiedPharmacist as any);

      await PharmacistService.unverifyPharmacist('ph-001');
      expect(mockUpdate).toHaveBeenCalledWith({ isVerified: false });
    });
  });

  describe('deletePharmacist', () => {
    it('should delete pharmacist and user', async () => {
      const mockDestroy = jest.fn().mockResolvedValue(undefined);
      const { User } = require('../../models');
      User.update.mockResolvedValue([1]);
      MockPharmacist.findByPk.mockResolvedValue({
        id: 'ph-001',
        userId: 'user-001',
        destroy: mockDestroy,
      } as any);

      await PharmacistService.deletePharmacist('ph-001');
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should throw if not found', async () => {
      MockPharmacist.findByPk.mockResolvedValue(null);
      await expect(PharmacistService.deletePharmacist('ghost')).rejects.toThrow('Pharmacist not found');
    });
  });

  describe('getAllPharmacists', () => {
    it('should return paginated list', async () => {
      MockPharmacist.findAndCountAll.mockResolvedValue({
        rows: [{ id: 'ph-001' }],
        count: 1,
      } as any);

      const result = await PharmacistService.getAllPharmacists(1, 10);
      expect(result).toBeDefined();
    });
  });
});
