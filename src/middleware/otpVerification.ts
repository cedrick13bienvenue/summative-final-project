import { Response, NextFunction } from 'express';
import { OTPService } from '../services/otpService';
import { UserRole } from '../models';
import { AuthenticatedRequest } from './auth';

/**
 * Middleware to require OTP verification for patient medical history access
 * Only applies to PATIENT role users accessing their own medical history
 */
export const requireOTPVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId } = req.params;
    const { otpCode } = req.query;

    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
      return;
    }

    // Only require OTP for PATIENT role users accessing their own medical history
    if (req.user.role !== UserRole.PATIENT) {
      return next();
    }

    // Check if patient is accessing their own record
    // First, get the patient record to check if it belongs to the authenticated user
    const { Patient } = await import('../models');
    const patient = await Patient.findByPk(patientId);
    
    if (!patient) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Patient not found',
          statusCode: 404,
        },
      });
      return;
    }

    if (patient.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied: You can only access your own medical history',
          statusCode: 403,
        },
      });
      return;
    }

    // Check if OTP code is provided and convert to string
    if (!otpCode || typeof otpCode !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          message: 'OTP code is required for medical history access. Please request an OTP first and include it as a query parameter.',
          statusCode: 400,
          requiresOTP: true,
        },
      });
      return;
    }

    // Verify OTP
    const verificationResult = await OTPService.verifyOTP(otpCode, patientId);

    if (!verificationResult.isValid) {
      res.status(400).json({
        success: false,
        error: {
          message: verificationResult.message,
          statusCode: 400,
          requiresOTP: true,
        },
      });
      return;
    }

    // OTP is valid, proceed to next middleware
    next();
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'OTP verification failed',
        statusCode: 500,
      },
    });
  }
};

/**
 * Middleware to handle OTP generation request
 * Only applies to PATIENT role users
 */
export const generateOTPForPatient = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { patientId } = req.params;

    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
      return;
    }

    // Only allow PATIENT role users to generate OTP for their own record
    if (req.user.role !== UserRole.PATIENT) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Only patients can request OTP verification',
          statusCode: 403,
        },
      });
      return;
    }

    // Check if patient is requesting OTP for their own record
    // First, get the patient record to check if it belongs to the authenticated user
    const { Patient } = await import('../models');
    const patient = await Patient.findByPk(patientId);
    
    if (!patient) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Patient not found',
          statusCode: 404,
        },
      });
      return;
    }

    if (patient.userId !== req.user.id) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Access denied: You can only request OTP for your own medical history',
          statusCode: 403,
        },
      });
      return;
    }

    // Generate and send OTP
    const otpResult = await OTPService.generateAndSendOTP(patientId);

    if (!otpResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: otpResult.message,
          statusCode: 400,
        },
      });
      return;
    }

    // Return OTP generation success response
    res.status(200).json({
      success: true,
      message: otpResult.message,
      data: {
        expiresAt: otpResult.expiresAt,
        otpId: otpResult.otpId,
      },
    });
  } catch (error: any) {
    console.error('OTP generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate OTP',
        statusCode: 500,
      },
    });
  }
};
