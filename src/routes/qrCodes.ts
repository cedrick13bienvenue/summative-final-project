import { Router } from 'express';
import { Request, Response } from 'express';
import { QRCodeService } from '../services/qrCodeService';
import { EmailService } from '../services/emailService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../models';
import { Prescription } from '../models';
import { validateParams, validateQuery } from '../middleware/validation';
import { prescriptionIdParamSchema, advancedPaginationSchema } from '../validation/schemas';
import { createPaginationResponse } from '../types/common';
import { emailRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * Generate QR code for a prescription
 * POST /api/v1/qr-codes/generate/:prescriptionId
 */
router.post('/qr-codes/generate/:prescriptionId', authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN]), validateParams(prescriptionIdParamSchema), async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;

    if (!prescriptionId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Prescription ID is required',
          statusCode: 400,
        },
      });
    }

    // Verify prescription exists and user has access
    const prescription = await Prescription.findByPk(prescriptionId, {
      include: [
        { association: 'patient', include: [{ association: 'user' }] },
        { association: 'doctor', include: [{ association: 'user' }] },
        { association: 'items' }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Prescription not found',
          statusCode: 404,
        },
      });
    }

    // Generate QR code
    const qrResult = await QRCodeService.generateQRCode(prescriptionId);

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCodeImage: qrResult.qrCodeImage,
        qrHash: qrResult.qrHash,
        expiresAt: qrResult.expiresAt,
        prescriptionNumber: prescription.prescriptionNumber,
        patientName: (prescription as any).patient?.user?.fullName || '',
        doctorName: (prescription as any).doctor?.user?.fullName || ''
      },
    });
  } catch (error: any) {
    console.error('QR code generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to generate QR code',
        statusCode: 500,
      },
    });
  }
});

// Note: QR code verification is now handled through the pharmacy workflow
// Use POST /pharmacy/scan instead of this standalone verification endpoint

/**
 * Get QR code statistics
 * GET /api/v1/qr-codes/stats/:qrHash
 */
router.get('/qr-codes/stats/:qrHash', authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN, UserRole.PHARMACIST]), async (req: Request, res: Response) => {
  try {
    const { qrHash } = req.params;

    if (!qrHash) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'QR hash is required',
          statusCode: 400,
        },
      });
    }

    const stats = await QRCodeService.getQRCodeStats(qrHash);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'QR code not found',
          statusCode: 404,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('QR code stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get QR code statistics',
        statusCode: 500,
      },
    });
  }
});

/**
 * Send prescription email with QR code
 * POST /api/v1/qr-codes/email/:prescriptionId
 */
router.post('/qr-codes/email/:prescriptionId', emailRateLimiter, authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN]), validateParams(prescriptionIdParamSchema), async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;

    if (!prescriptionId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Prescription ID is required',
          statusCode: 400,
        },
      });
    }

    // Get prescription with related data including existing QR code
    const prescription = await Prescription.findByPk(prescriptionId, {
      include: [
        { association: 'patient', include: [{ association: 'user' }] },
        { association: 'doctor', include: [{ association: 'user' }] },
        { association: 'items' },
        { association: 'qrCode' }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Prescription not found',
          statusCode: 404,
        },
      });
    }

    // Check if QR code already exists and is still valid
    let qrResult;
    if ((prescription as any).qrCode && !(prescription as any).qrCode.isExpired()) {
      // Use existing QR code
      console.log('📧 Using existing QR code for email:', (prescription as any).qrCode.qrHash);
      qrResult = {
        qrCodeImage: await QRCodeService.generateQRCodeImage((prescription as any).qrCode.qrHash),
        qrHash: (prescription as any).qrCode.qrHash,
        encryptedData: (prescription as any).qrCode.encryptedData,
        expiresAt: (prescription as any).qrCode.expiresAt
      };
    } else {
      // Generate new QR code
      console.log('📧 Generating new QR code for email');
      qrResult = await QRCodeService.generateQRCode(prescriptionId);
    }

    // Prepare email data
    const emailData = {
      patientName: (prescription as any).patient?.user?.fullName || '',
      patientEmail: (prescription as any).patient?.user?.email || '',
      prescriptionNumber: prescription.prescriptionNumber || '',
      patientNationalId: (prescription as any).patient?.user?.nationalId || '',
      doctorName: (prescription as any).doctor?.user?.fullName || '',
      diagnosis: prescription.diagnosis,
      medicines: ((prescription as any).items || []).map((item: any) => ({
        name: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        quantity: item.quantity,
        instructions: item.instructions
      })),
      qrCodeImage: qrResult.qrCodeImage,
      qrHash: qrResult.qrHash,
      expiresAt: qrResult.expiresAt.toISOString()
    };

    // Send email
    await EmailService.sendPrescriptionEmail(emailData);

    res.status(200).json({
      success: true,
      message: 'Prescription email sent successfully',
      data: {
        patientEmail: emailData.patientEmail,
        prescriptionNumber: emailData.prescriptionNumber,
        qrHash: emailData.qrHash,
        expiresAt: emailData.expiresAt
      },
    });
  } catch (error: any) {
    console.error('Prescription email error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to send prescription email',
        statusCode: 500,
      },
    });
  }
});

/**
 * Get QR code for a prescription (if exists)
 * GET /api/v1/qr-codes/:prescriptionId
 */
router.get('/qr-codes/:prescriptionId', authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT]), validateParams(prescriptionIdParamSchema), async (req: Request, res: Response) => {
  try {
    const { prescriptionId } = req.params;

    if (!prescriptionId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Prescription ID is required',
          statusCode: 400,
        },
      });
    }

    // Get prescription with related data
    const prescription = await Prescription.findByPk(prescriptionId, {
      include: [
        { association: 'patient', include: [{ association: 'user' }] },
        { association: 'doctor', include: [{ association: 'user' }] },
        { association: 'items' },
        { association: 'qrCode' }
      ]
    });

    if (!prescription) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Prescription not found',
          statusCode: 404,
        },
      });
    }

    // Check if QR code exists
    if (!(prescription as any).qrCode) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'QR code not found for this prescription',
          statusCode: 404,
        },
      });
    }

    // Check if QR code is expired
    if ((prescription as any).qrCode.isExpired()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'QR code has expired',
          statusCode: 400,
        },
      });
    }

    // Generate QR code image
    const qrResult = await QRCodeService.generateQRCode(prescriptionId);

    res.status(200).json({
      success: true,
      data: {
        qrCodeImage: qrResult.qrCodeImage,
        qrHash: qrResult.qrHash,
        expiresAt: qrResult.expiresAt,
        scanCount: (prescription as any).qrCode?.scanCount || 0,
        isUsed: (prescription as any).qrCode?.isUsed || false,
        prescriptionNumber: prescription.prescriptionNumber,
        patientName: (prescription as any).patient?.user?.fullName || '',
        doctorName: (prescription as any).doctor?.user?.fullName || ''
      },
    });
  } catch (error: any) {
    console.error('Get QR code error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to get QR code',
        statusCode: 500,
      },
    });
  }
});

/**
 * Get all QR codes with pagination (admin only)
 * GET /api/v1/qr-codes
 */
router.get('/qr-codes', authenticateToken, requireRole([UserRole.ADMIN]), validateQuery(advancedPaginationSchema), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const result = await QRCodeService.getAllQRCodes(pageNum, limitNum, sortBy as string, sortOrder as 'ASC' | 'DESC');

    res.status(200).json({
      success: true,
      data: result.qrCodes,
      pagination: createPaginationResponse(pageNum, limitNum, result.total),
    });
  } catch (error: any) {
    console.error('Get QR codes error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Failed to fetch QR codes',
        statusCode: 500,
      },
    });
  }
});

export default router;
