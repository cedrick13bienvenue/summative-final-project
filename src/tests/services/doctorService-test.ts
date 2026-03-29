import { DoctorService } from '../../services/doctorService';
import Doctor from '../../models/Doctor';

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
jest.mock('../../models/Doctor', () => ({
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

const MockDoctor = Doctor as jest.Mocked<typeof Doctor>;
const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

describe('DoctorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDoctorProfile', () => {
    it('should create a doctor profile successfully', async () => {
      MockDoctor.create.mockResolvedValue({
        id: 'doc-001',
        userId: 'user-doc-001',
        licenseNumber: 'LIC-RW-001',
        specialization: 'Pediatrics',
        hospitalName: 'CHUK',
        isVerified: true,
      } as any);

      MockDoctor.findByPk.mockResolvedValue({
        id: 'doc-001',
        userId: 'user-doc-001',
        licenseNumber: 'LIC-RW-001',
        specialization: 'Pediatrics',
        hospitalName: 'CHUK',
        isVerified: true,
        email: 'doctor@hospital.rw',
        fullName: 'Dr. Murenzi',
        createdAt: new Date(),
      } as any);

      const result = await DoctorService.createDoctorProfile({
        userId: 'user-doc-001',
        licenseNumber: 'LIC-RW-001',
        specialization: 'Pediatrics',
        hospitalName: 'CHUK',
      });

      expect(MockDoctor.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw if doctor creation fails', async () => {
      MockDoctor.create.mockRejectedValue(new Error('DB error'));

      await expect(
        DoctorService.createDoctorProfile({
          userId: 'user-fail-001',
          licenseNumber: 'LIC-FAIL',
          specialization: 'General',
          hospitalName: 'Test Hospital',
        })
      ).rejects.toThrow();
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

    it('should return null if doctor not found', async () => {
      MockDoctor.findByPk.mockResolvedValue(null);
      await expect(DoctorService.getDoctorById('ghost-id')).resolves.toBeNull();
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
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const updatedDoc = {
        id: 'doc-001',
        userId: 'user-001',
        licenseNumber: 'NEW-LIC',
        specialization: 'Neurology',
        hospitalName: 'CHUK',
        isVerified: true,
        createdAt: new Date(),
      };
      MockDoctor.findByPk
        .mockResolvedValueOnce({
          id: 'doc-001',
          licenseNumber: 'OLD-LIC',
          update: mockUpdate,
        } as any)
        .mockResolvedValueOnce(updatedDoc as any);

      const result = await DoctorService.updateDoctorProfile('doc-001', {
        licenseNumber: 'NEW-LIC',
        specialization: 'Neurology',
      });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return null if doctor not found', async () => {
      MockDoctor.findByPk.mockResolvedValue(null);
      const result = await DoctorService.updateDoctorProfile('ghost-id', { specialization: 'X' });
      expect(result).toBeNull();
    });
  });

  describe('deleteDoctor', () => {
    it('should delete doctor and user', async () => {
      const mockDestroy = jest.fn().mockResolvedValue(undefined);
      const { User } = require('../../models');
      User.update.mockResolvedValue([1]);
      MockDoctor.findByPk.mockResolvedValue({
        id: 'doc-001',
        userId: 'user-001',
        destroy: mockDestroy,
      } as any);

      const result = await DoctorService.deleteDoctor('doc-001');
      expect(mockDestroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if doctor not found', async () => {
      MockDoctor.findByPk.mockResolvedValue(null);
      const result = await DoctorService.deleteDoctor('ghost-id');
      expect(result).toBe(false);
    });
  });
});
