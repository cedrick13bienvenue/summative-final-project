import { DoctorService } from '../../services/doctorService';
import Doctor from '../../models/Doctor';

jest.mock('../../models', () => ({
  User: { findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn(), update: jest.fn() },
  UserRole: { ADMIN: 'admin', DOCTOR: 'doctor', PATIENT: 'patient', PHARMACIST: 'pharmacist' },
}));
jest.mock('../../models/Doctor', () => ({
  default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), update: jest.fn(), destroy: jest.fn() },
  __esModule: true,
}));

const MockDoctor = Doctor as jest.Mocked<typeof Doctor>;

beforeEach(() => jest.clearAllMocks());

describe('DoctorService - extended coverage', () => {
  // ── getDoctorByUserId ──────────────────────────────────────────────────────
  describe('getDoctorByUserId', () => {
    it('should return doctor profile when found', async () => {
      MockDoctor.findOne.mockResolvedValue({
        id: 'doc-001',
        userId: 'user-001',
        licenseNumber: 'LIC-001',
        specialization: 'Surgery',
        hospitalName: 'CHUK',
        isVerified: true,
        email: 'doc@test.com',
        fullName: 'Dr. Smith',
        createdAt: new Date(),
        user: { phone: '+250788000001' },
      } as any);

      const result = await DoctorService.getDoctorByUserId('user-001');
      expect(result).not.toBeNull();
      expect(result!.userId).toBe('user-001');
    });

    it('should return null if doctor not found', async () => {
      MockDoctor.findOne.mockResolvedValue(null);
      const result = await DoctorService.getDoctorByUserId('ghost-user');
      expect(result).toBeNull();
    });

    it('should throw on error', async () => {
      MockDoctor.findOne.mockRejectedValue(new Error('DB error'));
      await expect(DoctorService.getDoctorByUserId('user-001')).rejects.toThrow('DB error');
    });
  });

  // ── updateDoctorProfile - error handling ───────────────────────────────────
  describe('updateDoctorProfile - error', () => {
    it('should throw on error', async () => {
      MockDoctor.findByPk.mockRejectedValue(new Error('DB error'));
      await expect(DoctorService.updateDoctorProfile('doc-001', { specialization: 'X' })).rejects.toThrow('DB error');
    });
  });

  // ── deleteDoctor - error handling ──────────────────────────────────────────
  describe('deleteDoctor - error', () => {
    it('should throw on error', async () => {
      MockDoctor.findByPk.mockRejectedValue(new Error('DB error'));
      await expect(DoctorService.deleteDoctor('doc-001')).rejects.toThrow('DB error');
    });
  });

  // ── getAllDoctors - error ──────────────────────────────────────────────────
  describe('getAllDoctors - error', () => {
    it('should throw on error', async () => {
      MockDoctor.findAndCountAll.mockRejectedValue(new Error('DB error'));
      await expect(DoctorService.getAllDoctors()).rejects.toThrow('DB error');
    });
  });

  // ── getDoctorById - error ─────────────────────────────────────────────────
  describe('getDoctorById - error', () => {
    it('should throw on error', async () => {
      MockDoctor.findByPk.mockRejectedValue(new Error('DB error'));
      await expect(DoctorService.getDoctorById('doc-001')).rejects.toThrow('DB error');
    });
  });
});
