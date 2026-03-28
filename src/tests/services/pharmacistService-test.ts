import { PharmacistService } from '../../services/pharmacistService';
import { User, UserRole } from '../../models';
import Pharmacist from '../../models/Pharmacist';
import { sequelize } from '../../database/config/database';

jest.mock('../../models');
jest.mock('../../models/Pharmacist');
jest.mock('../../database/config/database', () => ({
  sequelize: { transaction: jest.fn() },
}));

const MockUser = User as jest.Mocked<typeof User>;
const MockPharmacist = Pharmacist as jest.Mocked<typeof Pharmacist>;
const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

describe('PharmacistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('createPharmacistProfile', () => {
    it('should create a pharmacist successfully', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed') };
      (User as any).mockImplementation(() => mockUserInstance);

      MockUser.create.mockResolvedValue({
        id: 'user-ph-001',
        email: 'pharm@example.rw',
        fullName: 'Jean Pharmacist',
        role: UserRole.PHARMACIST,
      } as any);

      MockPharmacist.create.mockResolvedValue({
        id: 'ph-001',
        userId: 'user-ph-001',
        licenseNumber: 'PHARM-RW-001',
        pharmacyName: 'Kigali Pharmacy',
        isVerified: false,
      } as any);

      const result = await PharmacistService.createPharmacistProfile({
        email: 'pharm@example.rw',
        password: 'securePass123',
        fullName: 'Jean Pharmacist',
        licenseNumber: 'PHARM-RW-001',
        pharmacyName: 'Kigali Pharmacy',
        pharmacyAddress: 'KN 2 St',
      });

      expect(MockUser.create).toHaveBeenCalled();
      expect(MockPharmacist.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should rollback on error', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed') };
      (User as any).mockImplementation(() => mockUserInstance);
      MockUser.create.mockRejectedValue(new Error('DB fail'));

      await expect(
        PharmacistService.createPharmacistProfile({
          email: 'fail@example.rw',
          password: 'pass123',
          fullName: 'Fail User',
          licenseNumber: 'FAIL',
          pharmacyName: 'Fail Pharmacy',
          pharmacyAddress: 'Nowhere',
        })
      ).rejects.toThrow();

      expect(mockTransaction.rollback).toHaveBeenCalled();
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

    it('should throw if pharmacist not found', async () => {
      MockPharmacist.findByPk.mockResolvedValue(null);
      await expect(PharmacistService.getPharmacistById('ghost')).rejects.toThrow();
    });
  });

  describe('verifyPharmacist', () => {
    it('should set isVerified to true', async () => {
      const mockSave = jest.fn();
      MockPharmacist.findByPk.mockResolvedValue({
        isVerified: false,
        save: mockSave,
      } as any);

      await PharmacistService.verifyPharmacist('ph-001');
      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw if pharmacist not found', async () => {
      MockPharmacist.findByPk.mockResolvedValue(null);
      await expect(PharmacistService.verifyPharmacist('ghost')).rejects.toThrow();
    });
  });

  describe('unverifyPharmacist', () => {
    it('should set isVerified to false', async () => {
      const mockSave = jest.fn();
      MockPharmacist.findByPk.mockResolvedValue({
        isVerified: true,
        save: mockSave,
      } as any);

      await PharmacistService.unverifyPharmacist('ph-001');
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('deletePharmacist', () => {
    it('should delete pharmacist and user', async () => {
      const mockDestroy = jest.fn();
      const mockUserDestroy = jest.fn();
      MockPharmacist.findByPk.mockResolvedValue({
        userId: 'user-001',
        destroy: mockDestroy,
        user: { destroy: mockUserDestroy },
      } as any);

      await PharmacistService.deletePharmacist('ph-001');
      expect(mockDestroy).toHaveBeenCalled();
    });

    it('should throw if not found', async () => {
      MockPharmacist.findByPk.mockResolvedValue(null);
      await expect(PharmacistService.deletePharmacist('ghost')).rejects.toThrow();
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
