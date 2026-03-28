import Doctor from '../models/Doctor';
import { User } from '../models';
import { DoctorProfile, DoctorCreationData, DoctorUpdateData, DoctorListResponse, DoctorDetailResponse, DoctorRegistrationResponse, DoctorUpdateResponse } from '../types';

export class DoctorService {
  // Create doctor profile
  static async createDoctorProfile(data: DoctorCreationData): Promise<DoctorProfile> {
    try {
      const doctor = await Doctor.create({
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        specialization: data.specialization,
        hospitalName: data.hospitalName,
        isVerified: true, // Auto-verify when created by admin
      });

      // Return the created doctor with user info
      return await this.getDoctorById(doctor.id) as DoctorProfile;
    } catch (error) {
      console.error('Error creating doctor profile:', error);
      throw error;
    }
  }

  // Get doctor by ID with user information
  static async getDoctorById(doctorId: string): Promise<DoctorProfile | null> {
    try {
      const doctor = await Doctor.findByPk(doctorId, {
        include: [{
          association: 'user',
          attributes: ['email', 'fullName', 'phone']
        }]
      });

      if (!doctor) {
        return null;
      }

      return {
        id: doctor.id,
        userId: doctor.userId,
        email: doctor.email,
        fullName: doctor.fullName,
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        hospitalName: doctor.hospitalName,
        isVerified: doctor.isVerified,
        phone: (doctor as any).user?.phone,
        createdAt: doctor.createdAt,
      };
    } catch (error) {
      console.error('Error getting doctor by ID:', error);
      throw error;
    }
  }

  // Get doctor by user ID
  static async getDoctorByUserId(userId: string): Promise<DoctorProfile | null> {
    try {
      const doctor = await Doctor.findOne({
        where: { userId },
        include: [{
          association: 'user',
          attributes: ['email', 'fullName', 'phone']
        }]
      });

      if (!doctor) {
        return null;
      }

      return {
        id: doctor.id,
        userId: doctor.userId,
        email: doctor.email,
        fullName: doctor.fullName,
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        hospitalName: doctor.hospitalName,
        isVerified: doctor.isVerified,
        phone: (doctor as any).user?.phone,
        createdAt: doctor.createdAt,
      };
    } catch (error) {
      console.error('Error getting doctor by user ID:', error);
      throw error;
    }
  }

  // Get all doctors with pagination
  static async getAllDoctors(page: number = 1, limit: number = 10, sortBy: string = 'createdAt', sortOrder: 'ASC' | 'DESC' = 'DESC'): Promise<{ doctors: DoctorProfile[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows: doctors } = await Doctor.findAndCountAll({
        include: [{
          association: 'user',
          attributes: ['email', 'fullName', 'phone', 'isActive'],
          where: { isActive: true }
        }],
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      });

      const doctorProfiles = doctors.map(doctor => ({
        id: doctor.id,
        userId: doctor.userId,
        email: doctor.email,
        fullName: doctor.fullName,
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        hospitalName: doctor.hospitalName,
        isVerified: doctor.isVerified,
        phone: (doctor as any).user?.phone,
        createdAt: doctor.createdAt,
      }));

      return {
        doctors: doctorProfiles,
        total: count
      };
    } catch (error) {
      console.error('Error getting all doctors:', error);
      throw error;
    }
  }

  // Update doctor profile
  static async updateDoctorProfile(doctorId: string, updateData: {
    licenseNumber?: string;
    specialization?: string;
    hospitalName?: string;
  }): Promise<DoctorProfile | null> {
    try {
      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) {
        return null;
      }

      await doctor.update(updateData);

      // Return updated doctor with user info
      return await this.getDoctorById(doctorId);
    } catch (error) {
      console.error('Error updating doctor profile:', error);
      throw error;
    }
  }

  // Delete doctor profile
  static async deleteDoctor(doctorId: string): Promise<boolean> {
    try {
      const doctor = await Doctor.findByPk(doctorId);
      if (!doctor) {
        return false;
      }

      // Get the associated user ID before deleting
      const userId = doctor.userId;

      // Delete the doctor profile
      await doctor.destroy();

      // Also deactivate the associated user account
      await User.update(
        { isActive: false },
        { where: { id: userId } }
      );

      return true;
    } catch (error) {
      console.error('Error deleting doctor:', error);
      throw error;
    }
  }
}
