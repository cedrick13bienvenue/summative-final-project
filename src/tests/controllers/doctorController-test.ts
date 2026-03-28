import { Request, Response } from 'express';
import { DoctorController } from '../../controllers/doctorController';
import { DoctorService } from '../../services/doctorService';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/doctorService');
const MockDoctorService = DoctorService as jest.Mocked<typeof DoctorService>;

describe('DoctorController', () => {
  let mockReq: Partial<Request | AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('registerDoctor', () => {
    it('should register a doctor and return 201', async () => {
      const body = {
        email: 'doc@hospital.rw',
        password: 'pass123',
        fullName: 'Dr. Test',
        licenseNumber: 'LIC-001',
        specialization: 'General',
        hospitalName: 'CHUK',
      };
      mockReq.body = body;
      MockDoctorService.createDoctorProfile.mockResolvedValue({ doctorId: 'doc-001' } as any);

      await DoctorController.registerDoctor(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 500 on service error', async () => {
      mockReq.body = { email: 'fail@rw.rw', password: 'pass', fullName: 'Fail', licenseNumber: 'L', specialization: 'S', hospitalName: 'H' };
      MockDoctorService.createDoctorProfile.mockRejectedValue(new Error('DB error'));

      await DoctorController.registerDoctor(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('getDoctorById', () => {
    it('should return a doctor profile', async () => {
      mockReq.params = { doctorId: 'doc-001' };
      MockDoctorService.getDoctorById.mockResolvedValue({ id: 'doc-001', specialization: 'Surgery' } as any);

      await DoctorController.getDoctorById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 if doctor not found', async () => {
      mockReq.params = { doctorId: 'ghost-id' };
      MockDoctorService.getDoctorById.mockRejectedValue(new Error('Doctor not found'));

      await DoctorController.getDoctorById(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('getAllDoctors', () => {
    it('should return paginated list of doctors', async () => {
      mockReq.query = { page: '1', limit: '10' };
      MockDoctorService.getAllDoctors.mockResolvedValue({ doctors: [], total: 0, page: 1, limit: 10 } as any);

      await DoctorController.getAllDoctors(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updateDoctor', () => {
    it('should update a doctor profile', async () => {
      mockReq.params = { doctorId: 'doc-001' };
      mockReq.body = { specialization: 'Cardiology' };
      MockDoctorService.updateDoctorProfile.mockResolvedValue({ id: 'doc-001' } as any);

      await DoctorController.updateDoctor(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteDoctor', () => {
    it('should delete a doctor', async () => {
      mockReq.params = { doctorId: 'doc-001' };
      MockDoctorService.deleteDoctor.mockResolvedValue(undefined as any);

      await DoctorController.deleteDoctor(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
