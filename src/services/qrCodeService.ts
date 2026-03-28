import QRCode from 'qrcode';
import crypto from 'crypto';
import { QRCode as QRCodeModel, Prescription, Patient, Doctor, User } from '../models';
import { PrescriptionStatus } from '../models/Prescription';

export interface QRCodeData {
  prescriptionId: string;
  prescriptionNumber: string;
  patientName: string;
  doctorName: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    quantity: number;
  }>;
  diagnosis?: string;
  createdAt: string;
  expiresAt: string;
}

export interface QRCodeGenerationResult {
  qrCodeImage: string; // Base64 encoded QR code image
  qrHash: string;
  encryptedData: string;
  expiresAt: Date;
}

export interface QRCodeVerificationResult {
  isValid: boolean;
  isExpired: boolean;
  isUsed: boolean;
  prescriptionData?: QRCodeData;
  error?: string;
}

export class QRCodeService {
  private static readonly ENCRYPTION_KEY = process.env['QR_ENCRYPTION_KEY'] || 'default-key-change-in-production';
  private static readonly QR_EXPIRY_HOURS = 24 * 7; // 7 days

  /**
   * Generate QR code for a prescription
   */
  static async generateQRCode(prescriptionId: string): Promise<QRCodeGenerationResult> {
    try {
      // Fetch prescription with related data
      const prescription = await Prescription.findByPk(prescriptionId, {
        include: [
          { association: 'patient', include: [{ association: 'user' }] },
          { association: 'doctor', include: [{ association: 'user' }] },
          { association: 'items' }
        ]
      });

      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Check if QR code already exists
      const existingQR = await QRCodeModel.findOne({ where: { prescriptionId } });
      if (existingQR && !existingQR.isExpired()) {
        // Return existing QR code if still valid
        const qrCodeImage = await this.generateQRCodeImage(existingQR.qrHash);
        return {
          qrCodeImage,
          qrHash: existingQR.qrHash,
          encryptedData: existingQR.encryptedData,
          expiresAt: existingQR.expiresAt
        };
      }

      // Prepare QR code data
      const qrData: QRCodeData = {
        prescriptionId: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber || '',
        patientName: (prescription as any).patient?.user?.fullName || '',
        doctorName: (prescription as any).doctor?.user?.fullName || '',
        medicines: ((prescription as any).items || []).map((item: any) => ({
          name: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          quantity: item.quantity
        })),
        diagnosis: prescription.diagnosis,
        createdAt: prescription.createdAt.toISOString(),
        expiresAt: new Date(Date.now() + this.QR_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
      };

      // Encrypt the data
      const encryptedData = this.encryptData(JSON.stringify(qrData));
      
      // Generate unique QR hash
      const qrHash = this.generateQRHash(prescriptionId);
      
      // Set expiration date
      const expiresAt = new Date(Date.now() + this.QR_EXPIRY_HOURS * 60 * 60 * 1000);

      // Create or update QR code record
      if (existingQR) {
        await existingQR.update({
          qrHash,
          encryptedData,
          expiresAt,
          isUsed: false,
          scanCount: 0
        });
      } else {
        await QRCodeModel.create({
          qrHash,
          prescriptionId,
          encryptedData,
          expiresAt,
          isUsed: false
        });
      }

      // Generate QR code image with the hash (not encrypted data)
      const qrCodeImage = await this.generateQRCodeImage(qrHash);

      return {
        qrCodeImage,
        qrHash,
        encryptedData,
        expiresAt
      };
    } catch (error: any) {
      console.error('Error generating QR code:', error);
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * Verify and decrypt QR code
   */
  static async verifyQRCode(qrHash: string): Promise<QRCodeVerificationResult> {
    try {
      // Find QR code record
      const qrCode = await QRCodeModel.findOne({ where: { qrHash } });
      
      if (!qrCode) {
        return {
          isValid: false,
          isExpired: false,
          isUsed: false,
          error: 'QR code not found'
        };
      }

      // Check if expired
      if (qrCode.isExpired()) {
        return {
          isValid: false,
          isExpired: true,
          isUsed: qrCode.isUsed,
          error: 'QR code has expired'
        };
      }

      // Check if already used
      if (qrCode.isUsed) {
        return {
          isValid: false,
          isExpired: false,
          isUsed: true,
          error: 'QR code has already been used'
        };
      }

      // Decrypt and parse data
      let prescriptionData: QRCodeData;
      try {
        const decryptedData = this.decryptData(qrCode.encryptedData);
        prescriptionData = JSON.parse(decryptedData);
      } catch (error) {
        return {
          isValid: false,
          isExpired: false,
          isUsed: qrCode.isUsed,
          error: 'Invalid QR code data'
        };
      }

      // Update scan count
      qrCode.scanCount += 1;
      await qrCode.save();

      return {
        isValid: true,
        isExpired: false,
        isUsed: qrCode.isUsed,
        prescriptionData
      };
    } catch (error: any) {
      console.error('Error verifying QR code:', error);
      return {
        isValid: false,
        isExpired: false,
        isUsed: false,
        error: `Verification failed: ${error.message}`
      };
    }
  }

  /**
   * Mark QR code as used (when prescription is dispensed)
   */
  static async markQRCodeAsUsed(qrHash: string): Promise<boolean> {
    try {
      const qrCode = await QRCodeModel.findOne({ where: { qrHash } });
      
      if (!qrCode) {
        throw new Error('QR code not found');
      }

      if (qrCode.isExpired()) {
        throw new Error('QR code has expired');
      }

      qrCode.markAsUsed();
      await qrCode.save();

      return true;
    } catch (error: any) {
      console.error('Error marking QR code as used:', error);
      throw new Error(`Failed to mark QR code as used: ${error.message}`);
    }
  }

  /**
   * Generate QR code image from data
   */
  static async generateQRCodeImage(data: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(data, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataURL;
    } catch (error: any) {
      throw new Error(`Failed to generate QR code image: ${error.message}`);
    }
  }

  /**
   * Generate unique QR hash
   */
  private static generateQRHash(prescriptionId: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    const data = `${prescriptionId}-${timestamp}-${random}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Encrypt data using AES-256-CBC with modern crypto
   */
  private static encryptData(data: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data using AES-256-CBC with modern crypto
   */
  private static decryptData(encryptedData: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Get QR code statistics
   */
  static async getQRCodeStats(qrHash: string): Promise<{
    scanCount: number;
    isUsed: boolean;
    isExpired: boolean;
    createdAt: Date;
    expiresAt: Date;
  } | null> {
    try {
      const qrCode = await QRCodeModel.findOne({ where: { qrHash } });
      
      if (!qrCode) {
        return null;
      }

      return {
        scanCount: qrCode.scanCount,
        isUsed: qrCode.isUsed,
        isExpired: qrCode.isExpired(),
        createdAt: qrCode.createdAt,
        expiresAt: qrCode.expiresAt
      };
    } catch (error: any) {
      console.error('Error getting QR code stats:', error);
      throw new Error(`Failed to get QR code stats: ${error.message}`);
    }
  }

  // Get all QR codes with pagination
  static async getAllQRCodes(page: number = 1, limit: number = 10, sortBy: string = 'createdAt', sortOrder: 'ASC' | 'DESC' = 'DESC'): Promise<{ qrCodes: any[], total: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const { count, rows: qrCodes } = await QRCodeModel.findAndCountAll({
        include: [
          {
            model: Prescription,
            as: 'prescription',
            include: [
              {
                model: Patient,
                as: 'patient',
                include: [{
                  model: User,
                  as: 'user',
                  attributes: ['fullName', 'email']
                }]
              },
              {
                model: Doctor,
                as: 'doctor',
                include: [{
                  model: User,
                  as: 'user',
                  attributes: ['fullName', 'email']
                }]
              }
            ]
          }
        ],
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      });

      const qrCodeData = qrCodes.map(qrCode => {
        const qrCodeData = qrCode as any;
        return {
          id: qrCode.id,
          qrHash: qrCode.qrHash,
          prescriptionId: qrCode.prescriptionId,
          isUsed: qrCode.isUsed,
          isExpired: qrCode.isExpired(),
          scanCount: qrCode.scanCount,
          createdAt: qrCode.createdAt,
          expiresAt: qrCode.expiresAt,
          prescription: qrCodeData.prescription ? {
            prescriptionNumber: qrCodeData.prescription.prescriptionNumber,
            diagnosis: qrCodeData.prescription.diagnosis,
            status: qrCodeData.prescription.status,
            patient: qrCodeData.prescription.patient ? {
              fullName: qrCodeData.prescription.patient.user?.fullName,
              email: qrCodeData.prescription.patient.user?.email
            } : null,
            doctor: qrCodeData.prescription.doctor ? {
              fullName: qrCodeData.prescription.doctor.user?.fullName,
              email: qrCodeData.prescription.doctor.user?.email
            } : null
          } : null
        };
      });

      return {
        qrCodes: qrCodeData,
        total: count
      };
    } catch (error: any) {
      console.error('Error getting all QR codes:', error);
      throw new Error(`Failed to get QR codes: ${error.message}`);
    }
  }
}
