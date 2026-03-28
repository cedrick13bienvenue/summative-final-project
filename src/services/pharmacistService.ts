import Pharmacist from '../models/Pharmacist';
import { User } from '../models';
import { PharmacistProfile, PharmacistCreationData, PharmacistUpdateData, PharmacistListResponse, PharmacistDetailResponse, PharmacistRegistrationResponse } from '../types';

export class PharmacistService {
  // Create pharmacist profile
  static async createPharmacistProfile(data: PharmacistCreationData): Promise<PharmacistProfile> {
    try {
      const pharmacist = await Pharmacist.create({
        userId: data.userId,
        licenseNumber: data.licenseNumber,
        pharmacyName: data.pharmacyName,
        pharmacyAddress: data.pharmacyAddress,
        isVerified: true, // Auto-verify when created by admin
      });

      // Return the created pharmacist with user info
      return await this.getPharmacistById(pharmacist.id) as PharmacistProfile;
    } catch (error) {
      console.error('Error creating pharmacist profile:', error);
      throw error;
    }
  }

  // Get pharmacist by ID with user information
  static async getPharmacistById(pharmacistId: string): Promise<PharmacistProfile | null> {
    try {
      const pharmacist = await Pharmacist.findByPk(pharmacistId, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'fullName', 'phone', 'nationalId', 'role', 'isActive', 'createdAt']
          }
        ]
      });

      if (!pharmacist) {
        return null;
      }

      return {
        id: pharmacist.id,
        userId: pharmacist.userId,
        email: (pharmacist as any).user?.email || '',
        fullName: (pharmacist as any).user?.fullName || '',
        phone: (pharmacist as any).user?.phone,
        nationalId: (pharmacist as any).user?.nationalId,
        role: (pharmacist as any).user?.role || 'pharmacist',
        licenseNumber: pharmacist.licenseNumber,
        pharmacyName: pharmacist.pharmacyName,
        pharmacyAddress: pharmacist.pharmacyAddress,
        isVerified: pharmacist.isVerified,
        createdAt: pharmacist.createdAt,
      };
    } catch (error) {
      console.error('Error fetching pharmacist by ID:', error);
      throw error;
    }
  }

  // Get pharmacist by user ID
  static async getPharmacistByUserId(userId: string): Promise<PharmacistProfile | null> {
    try {
      const pharmacist = await Pharmacist.findOne({
        where: { userId },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'fullName', 'phone', 'nationalId', 'role', 'isActive', 'createdAt']
          }
        ]
      });

      if (!pharmacist) {
        return null;
      }

      return {
        id: pharmacist.id,
        userId: pharmacist.userId,
        email: (pharmacist as any).user?.email || '',
        fullName: (pharmacist as any).user?.fullName || '',
        phone: (pharmacist as any).user?.phone,
        nationalId: (pharmacist as any).user?.nationalId,
        role: (pharmacist as any).user?.role || 'pharmacist',
        licenseNumber: pharmacist.licenseNumber,
        pharmacyName: pharmacist.pharmacyName,
        pharmacyAddress: pharmacist.pharmacyAddress,
        isVerified: pharmacist.isVerified,
        createdAt: pharmacist.createdAt,
      };
    } catch (error) {
      console.error('Error fetching pharmacist by user ID:', error);
      throw error;
    }
  }

  // Get all pharmacists with pagination
  static async getAllPharmacists(page: number = 1, limit: number = 10): Promise<PharmacistListResponse> {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await Pharmacist.findAndCountAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'fullName', 'phone', 'nationalId', 'role', 'isActive', 'createdAt']
          }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      const pharmacists: PharmacistProfile[] = rows.map(pharmacist => ({
        id: pharmacist.id,
        userId: pharmacist.userId,
        email: (pharmacist as any).user?.email || '',
        fullName: (pharmacist as any).user?.fullName || '',
        phone: (pharmacist as any).user?.phone,
        nationalId: (pharmacist as any).user?.nationalId,
        role: (pharmacist as any).user?.role || 'pharmacist',
        licenseNumber: pharmacist.licenseNumber,
        pharmacyName: pharmacist.pharmacyName,
        pharmacyAddress: pharmacist.pharmacyAddress,
        isVerified: pharmacist.isVerified,
        createdAt: pharmacist.createdAt,
      }));

      const totalPages = Math.ceil(count / limit);

      return {
        pharmacists,
        total: count,
        pagination: {
          page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error fetching all pharmacists:', error);
      throw error;
    }
  }

  // Update pharmacist profile
  static async updatePharmacist(pharmacistId: string, data: PharmacistUpdateData): Promise<PharmacistProfile> {
    try {
      const pharmacist = await Pharmacist.findByPk(pharmacistId);
      if (!pharmacist) {
        throw new Error('Pharmacist not found');
      }

      await pharmacist.update(data);

      // Return updated pharmacist with user info
      return await this.getPharmacistById(pharmacistId) as PharmacistProfile;
    } catch (error) {
      console.error('Error updating pharmacist:', error);
      throw error;
    }
  }

  // Delete pharmacist
  static async deletePharmacist(pharmacistId: string): Promise<void> {
    try {
      const pharmacist = await Pharmacist.findByPk(pharmacistId);
      if (!pharmacist) {
        throw new Error('Pharmacist not found');
      }

      // Get the associated user ID before deleting
      const userId = pharmacist.userId;

      // Delete the pharmacist profile
      await pharmacist.destroy();

      // Also deactivate the associated user account
      await User.update(
        { isActive: false },
        { where: { id: userId } }
      );
    } catch (error) {
      console.error('Error deleting pharmacist:', error);
      throw error;
    }
  }

  // Verify pharmacist
  static async verifyPharmacist(pharmacistId: string): Promise<PharmacistProfile> {
    try {
      const pharmacist = await Pharmacist.findByPk(pharmacistId);
      if (!pharmacist) {
        throw new Error('Pharmacist not found');
      }

      await pharmacist.update({ isVerified: true });

      return await this.getPharmacistById(pharmacistId) as PharmacistProfile;
    } catch (error) {
      console.error('Error verifying pharmacist:', error);
      throw error;
    }
  }

  // Unverify pharmacist
  static async unverifyPharmacist(pharmacistId: string): Promise<PharmacistProfile> {
    try {
      const pharmacist = await Pharmacist.findByPk(pharmacistId);
      if (!pharmacist) {
        throw new Error('Pharmacist not found');
      }

      await pharmacist.update({ isVerified: false });

      return await this.getPharmacistById(pharmacistId) as PharmacistProfile;
    } catch (error) {
      console.error('Error unverifying pharmacist:', error);
      throw error;
    }
  }
}
