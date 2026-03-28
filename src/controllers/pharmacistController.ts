import { Request, Response } from 'express';
import { PharmacistService } from '../services/pharmacistService';
import { AuthService } from '../services/authService';
import { UserRole } from '../models';
import { PharmacistRegistrationData, RegisterData } from '../types';
import { validateQuery } from '../middleware/validation';
import { advancedPaginationSchema } from '../validation/schemas';
import { createPaginationResponse } from '../types/common';

export class PharmacistController {
  // Register pharmacist (admin only)
  static async registerPharmacist(req: Request, res: Response) {
    try {
      const data: PharmacistRegistrationData = req.body;

      // Basic validation
      if (!data.email || !data.password || !data.fullName || !data.licenseNumber || !data.pharmacyName) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email, password, full name, license number, and pharmacy name are required',
            statusCode: 400,
          },
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid email format',
            statusCode: 400,
          },
        });
      }

      // Password strength validation
      if (data.password.length < 6) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Password must be at least 6 characters long',
            statusCode: 400,
          },
        });
      }

      // Register user first
      const userData: RegisterData = {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: UserRole.PHARMACIST,
        phone: data.phone,
        nationalId: data.nationalId,
      };

      const user = await AuthService.register(userData);

      // Create pharmacist profile
      const pharmacist = await PharmacistService.createPharmacistProfile({
        userId: user.user.id,
        licenseNumber: data.licenseNumber,
        pharmacyName: data.pharmacyName,
        pharmacyAddress: data.pharmacyAddress,
      });

      res.status(201).json({
        success: true,
        message: 'Pharmacist registered successfully',
        data: {
          user: {
            id: user.user.id,
            email: user.user.email,
            fullName: user.user.fullName,
            role: user.user.role,
            phone: user.user.phone,
          },
          pharmacist: {
            id: pharmacist.id,
            licenseNumber: pharmacist.licenseNumber,
            pharmacyName: pharmacist.pharmacyName,
            pharmacyAddress: pharmacist.pharmacyAddress,
            isVerified: pharmacist.isVerified,
          },
        },
      });
    } catch (error: any) {
      console.error('Pharmacist registration error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Pharmacist registration failed',
          statusCode: 400,
        },
      });
    }
  }

  // Get all pharmacists with pagination (admin only)
  static async getAllPharmacists(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      const result = await PharmacistService.getAllPharmacists(pageNum, limitNum);

      res.status(200).json({
        success: true,
        data: result,
        pagination: createPaginationResponse(pageNum, limitNum, result.total),
      });
    } catch (error: any) {
      console.error('Error fetching pharmacists:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to fetch pharmacists',
          statusCode: 500,
        },
      });
    }
  }

  // Get pharmacist by ID (admin only)
  static async getPharmacistById(req: Request, res: Response) {
    try {
      const { pharmacistId } = req.params;

      if (!pharmacistId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Pharmacist ID is required',
            statusCode: 400,
          },
        });
      }

      const pharmacist = await PharmacistService.getPharmacistById(pharmacistId);

      if (!pharmacist) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Pharmacist not found',
            statusCode: 404,
          },
        });
      }

      res.status(200).json({
        success: true,
        data: { pharmacist },
      });
    } catch (error: any) {
      console.error('Error fetching pharmacist:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to fetch pharmacist',
          statusCode: 500,
        },
      });
    }
  }

  // Update pharmacist (admin only)
  static async updatePharmacist(req: Request, res: Response) {
    try {
      const { pharmacistId } = req.params;
      const updateData = req.body;

      if (!pharmacistId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Pharmacist ID is required',
            statusCode: 400,
          },
        });
      }

      const pharmacist = await PharmacistService.updatePharmacist(pharmacistId, updateData);

      res.status(200).json({
        success: true,
        message: 'Pharmacist updated successfully',
        data: { pharmacist },
      });
    } catch (error: any) {
      console.error('Error updating pharmacist:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to update pharmacist',
          statusCode: 400,
        },
      });
    }
  }

  // Delete pharmacist (admin only)
  static async deletePharmacist(req: Request, res: Response) {
    try {
      const { pharmacistId } = req.params;

      if (!pharmacistId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Pharmacist ID is required',
            statusCode: 400,
          },
        });
      }

      await PharmacistService.deletePharmacist(pharmacistId);

      res.status(200).json({
        success: true,
        message: 'Pharmacist deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting pharmacist:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to delete pharmacist',
          statusCode: 400,
        },
      });
    }
  }

  // Verify pharmacist (admin only)
  static async verifyPharmacist(req: Request, res: Response) {
    try {
      const { pharmacistId } = req.params;

      if (!pharmacistId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Pharmacist ID is required',
            statusCode: 400,
          },
        });
      }

      const pharmacist = await PharmacistService.verifyPharmacist(pharmacistId);

      res.status(200).json({
        success: true,
        message: 'Pharmacist verified successfully',
        data: { pharmacist },
      });
    } catch (error: any) {
      console.error('Error verifying pharmacist:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to verify pharmacist',
          statusCode: 400,
        },
      });
    }
  }

  // Unverify pharmacist (admin only)
  static async unverifyPharmacist(req: Request, res: Response) {
    try {
      const { pharmacistId } = req.params;

      if (!pharmacistId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Pharmacist ID is required',
            statusCode: 400,
          },
        });
      }

      const pharmacist = await PharmacistService.unverifyPharmacist(pharmacistId);

      res.status(200).json({
        success: true,
        message: 'Pharmacist unverified successfully',
        data: { pharmacist },
      });
    } catch (error: any) {
      console.error('Error unverifying pharmacist:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Failed to unverify pharmacist',
          statusCode: 400,
        },
      });
    }
  }
}
