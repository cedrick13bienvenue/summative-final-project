import { DoctorService } from '../../services/doctorService';
import { User, UserRole } from '../../models';
import Doctor from '../../models/Doctor';
import { sequelize } from '../../database/config/database';

jest.mock('../../models');
jest.mock('../../models/Doctor');
jest.mock('../../database/config/database', () => ({
  sequelize: { transaction: jest.fn() },
}));

const MockUser = User as jest.Mocked<typeof User>;
const MockDoctor = Doctor as jest.Mocked<typeof Doctor>;
const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

describe('DoctorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('createDoctorProfile', () => {
    it('should create a doctor profile successfully', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed') };
      (User as any).mockImplementation(() => mockUserInstance);

      MockUser.create.mockResolvedValue({
        id: 'user-doc-001',
        email: 'doctor@hospital.rw',
        fullName: 'Dr. Murenzi',
        role: UserRole.DOCTOR,
      } as any);

      MockDoctor.create.mockResolvedValue({
        id: 'doc-001',
        userId: 'user-doc-001',
        licenseNumber: 'LIC-RW-001',
        specialization: 'Pediatrics',
        hospitalName: 'CHUK',
        isVerified: false,
      } as any);

      const result = await DoctorService.createDoctorProfile({
        email: 'doctor@hospital.rw',
        password: 'securePass123',
        fullName: 'Dr. Murenzi',
        licenseNumber: 'LIC-RW-001',
        specialization: 'Pediatrics',
        hospitalName: 'CHUK',
      });

      expect(MockUser.create).toHaveBeenCalled();
      expect(MockDoctor.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should rollback if user creation fails', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed') };
      (User as any).mockImplementation(() => mockUserInstance);
      MockUser.create.mockRejectedValue(new Error('DB error'));

      await expect(
        DoctorService.createDoctorProfile({
          email: 'fail@hospital.rw',
          password: 'securePass123',
          fullName: 'Dr. Fail',
          licenseNumber: 'LIC-FAIL',
          specialization: 'General',
          hospitalName: 'Test Hospital',
        })
      ).rejects.toThrow();

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getDoctorById', () => {
    it('should return doctor profile with user info', async () => {
      MockDoctor.findByPk.mockResolvedValue({
        id: 'doc-001',
        userId: 'user-001',
        licenseNumber: 'LIC-001',
        specialization: 'Surgery',
        isVerified: true,
        user: { email: 'doc@rw.rw', fullName: 'Dr. Test', phone: '+250788000001' },
      } as any);

      const result = await DoctorService.getDoctorById('doc-001');
      expect(result).toBeDefined();
      expect(MockDoctor.findByPk).toHaveBeenCalledWith('doc-001', expect.any(Object));
    });

    it('should throw if doctor not found', async () => {
      MockDoctor.findByPk.mockResolvedValue(null);
      await expect(DoctorService.getDoctorById('ghost-id')).rejects.toThrow();
    });
  });

  describe('getAllDoctors', () => {
    it('should return paginated list of doctors', async () => {
      MockDoctor.findAndCountAll.mockResolvedValue({
        rows: [{ id: 'doc-001', user: {} }],
        count: 1,
      } as any);

      const result = await DoctorService.getAllDoctors(1, 10);
      expect(result).toBeDefined();
      expect(MockDoctor.findAndCountAll).toHaveBeenCalled();
    });
  });

  describe('updateDoctorProfile', () => {
    it('should update doctor profile fields', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      MockDoctor.findByPk.mockResolvedValue({
        id: 'doc-001',
        licenseNumber: 'OLD-LIC',
        save: mockSave,
        user: { save: jest.fn() },
      } as any);

      await DoctorService.updateDoctorProfile('doc-001', {
        licenseNumber: 'NEW-LIC',
        specialization: 'Neurology',
      });

      expect(mockSave).toHaveBeenCalled();
    });

    it('should throw if doctor not found', async () => {
      MockDoctor.findByPk.mockResolvedValue(null);
      await expect(
        DoctorService.updateDoctorProfile('ghost-id', { specialization: 'X' })
      ).rejects.toThrow();
    });
  });

  describe('deleteDoctor', () => {
    it('should delete doctor and user', async () => {
      const mockUserDestroy = jest.fn().mockResolvedValue(undefined);
      const mockDoctorDestroy = jest.fn().mockResolvedValue(undefined);
      MockDoctor.findByPk.mockResolvedValue({
        id: 'doc-001',
        userId: 'user-001',
        destroy: mockDoctorDestroy,
        user: { destroy: mockUserDestroy },
      } as any);

      await DoctorService.deleteDoctor('doc-001');
      expect(mockDoctorDestroy).toHaveBeenCalled();
    });

    it('should throw if doctor not found', async () => {
      MockDoctor.findByPk.mockResolvedValue(null);
      await expect(DoctorService.deleteDoctor('ghost-id')).rejects.toThrow();
    });
  });
});
