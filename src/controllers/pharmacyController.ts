import { Request, Response } from 'express';
import { PharmacyService } from '../services/pharmacyService';
import { AuthenticatedRequest } from '../middleware/auth';

export class PharmacyController {
  /**
   * Look up prescription by National ID
   * POST /api/v1/pharmacy/lookup
   */
  static async lookupByReferenceNumber(req: AuthenticatedRequest, res: Response) {
    try {
      const { nationalId } = req.body;

      if (!nationalId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'National ID is required',
            statusCode: 400,
          },
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const result = await PharmacyService.lookupByReferenceNumber(nationalId, req.user.id);

      if (!result.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message,
            statusCode: 400,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          prescription: result.prescription,
          canDispense: result.canDispense,
        },
      });
    } catch (error: any) {
      console.error('Error in lookupByReferenceNumber:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * Scan QR code and get prescription details
   * POST /api/v1/pharmacy/scan
   */
  static async scanQRCode(req: AuthenticatedRequest, res: Response) {
    try {
      const { qrHash } = req.body;

      if (!qrHash) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'QR hash is required',
            statusCode: 400,
          },
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const result = await PharmacyService.scanQRCode(qrHash, req.user.id);

      if (!result.isValid) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message,
            statusCode: 400,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          prescription: result.prescription,
          isValid: result.isValid,
          canDispense: result.canDispense,
        },
      });
    } catch (error: any) {
      console.error('QR code scan error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to scan QR code',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * Validate prescription (pharmacist reviews and approves)
   * POST /api/v1/pharmacy/validate/:prescriptionId
   */
  static async validatePrescription(req: AuthenticatedRequest, res: Response) {
    try {
      const { prescriptionId } = req.params;
      const { notes } = req.body;

      if (!prescriptionId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Prescription ID is required',
            statusCode: 400,
          },
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const result = await PharmacyService.validatePrescription(prescriptionId, req.user.id, notes);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message,
            statusCode: 400,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.prescription,
      });
    } catch (error: any) {
      console.error('Prescription validation error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to validate prescription',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * Dispense prescription (pharmacist gives medicine to patient)
   * POST /api/v1/pharmacy/dispense/:prescriptionId
   */
  static async dispensePrescription(req: AuthenticatedRequest, res: Response) {
    try {
      const { prescriptionId } = req.params;
      const { notes, dispensingItems } = req.body;

      if (!prescriptionId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Prescription ID is required',
            statusCode: 400,
          },
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const dispensingData = {
        notes,
        dispensingItems
      };

      const result = await PharmacyService.dispensePrescription(prescriptionId, req.user.id, dispensingData);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message,
            statusCode: 400,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.prescription,
      });
    } catch (error: any) {
      console.error('Prescription dispensing error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to dispense prescription',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * Reject prescription (pharmacist rejects due to issues)
   * POST /api/v1/pharmacy/reject/:prescriptionId
   */
  static async rejectPrescription(req: AuthenticatedRequest, res: Response) {
    try {
      const { prescriptionId } = req.params;
      const { reason } = req.body;

      if (!prescriptionId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Prescription ID is required',
            statusCode: 400,
          },
        });
      }

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Rejection reason is required',
            statusCode: 400,
          },
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const result = await PharmacyService.rejectPrescription(prescriptionId, req.user.id, reason);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: result.message,
            statusCode: 400,
          },
        });
      }

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.prescription,
      });
    } catch (error: any) {
      console.error('Prescription rejection error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to reject prescription',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * Get prescription logs
   * GET /api/v1/pharmacy/logs/:prescriptionId
   */
  static async getPrescriptionLogs(req: AuthenticatedRequest, res: Response) {
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

      const logs = await PharmacyService.getPrescriptionLogs(prescriptionId);

      res.status(200).json({
        success: true,
        data: { logs },
      });
    } catch (error: any) {
      console.error('Error fetching prescription logs:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to fetch prescription logs',
          statusCode: 500,
        },
      });
    }
  }

  /**
   * Get pharmacist's dispensing history
   * GET /api/v1/pharmacy/history
   */
  static async getPharmacistHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Authentication required',
            statusCode: 401,
          },
        });
      }

      const result = await PharmacyService.getPharmacistHistory(req.user.id, pageNum, limitNum);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error fetching pharmacist history:', error);
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Failed to fetch pharmacist history',
          statusCode: 500,
        },
      });
    }
  }

  // Check QR code scan status
  static async checkScanStatus(req: Request, res: Response): Promise<void> {
    try {
      const { qrHash } = req.params;

      if (!qrHash) {
        res.status(400).json({
          success: false,
          message: "QR hash is required",
        });
        return;
      }

      const result = await PharmacyService.checkQRScanStatus(qrHash);

      if (!result) {
        res.status(404).json({
          success: false,
          message: "QR code not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "QR code scan status retrieved",
        data: result,
      });
    } catch (error: any) {
      console.error("Error checking scan status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Get dispensing history for a prescription
   */
  static async getDispensingHistory(req: Request, res: Response): Promise<void> {
    try {
      const { prescriptionId } = req.params;
      const history = await PharmacyService.getDispensingHistory(prescriptionId);

      res.status(200).json({
        success: true,
        message: "Dispensing history retrieved successfully",
        data: history,
      });
    } catch (error: any) {
      console.error("Error getting dispensing history:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Get dispensing summary for a prescription
   */
  static async getDispensingSummary(req: Request, res: Response): Promise<void> {
    try {
      const { prescriptionId } = req.params;
      const summary = await PharmacyService.getDispensingSummary(prescriptionId);

      res.status(200).json({
        success: true,
        message: "Dispensing summary retrieved successfully",
        data: summary,
      });
    } catch (error: any) {
      console.error("Error getting dispensing summary:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

}
