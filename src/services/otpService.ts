import OTPVerification from '../models/OTPVerification';
import { EmailService } from './emailService';
import { Patient } from '../models';

export interface OTPGenerationResult {
  success: boolean;
  otpId?: string;
  message: string;
  expiresAt?: Date;
}

export interface OTPVerificationResult {
  isValid: boolean;
  message: string;
  otpId?: string;
}

export interface OTPEmailData {
  patientName: string;
  patientEmail: string;
  otpCode: string;
  expiresAt: Date;
}

export interface PasswordResetEmailData {
  userName: string;
  userEmail: string;
  otpCode: string;
  expiresAt: Date;
}

export class OTPService {
  private static readonly OTP_EXPIRY_MINUTES = 10; // OTP expires in 10 minutes

  /**
   * Generate and send OTP for medical history access
   */
  static async generateAndSendOTP(patientId: string): Promise<OTPGenerationResult> {
    try {
      // Get patient information
      const patient = await Patient.findByPk(patientId, {
        include: [{ association: 'user' }]
      });

      if (!patient) {
        return {
          success: false,
          message: 'Patient not found'
        };
      }

      // Check if there's already a valid OTP for this patient
      const existingOTP = await OTPVerification.findOne({
        where: {
          patientId,
          isUsed: false,
          purpose: 'medical_history_access'
        }
      });

      if (existingOTP && !existingOTP.isExpired()) {
        return {
          success: false,
          message: 'An OTP has already been sent. Please check your email or wait for it to expire.'
        };
      }

      // Generate new OTP
      const otpCode = OTPVerification.generateOTPCode();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Create OTP record
      const otpRecord = await OTPVerification.create({
        patientId,
        email: (patient as any).user?.email || patient.email,
        otpCode,
        purpose: 'medical_history_access',
        isUsed: false,
        expiresAt
      });

      // Send OTP email
      const emailData: OTPEmailData = {
        patientName: patient.fullName,
        patientEmail: (patient as any).user?.email || patient.email,
        otpCode,
        expiresAt
      };

      await this.sendOTPEmail(emailData);

      return {
        success: true,
        otpId: otpRecord.id,
        message: 'OTP sent successfully to your email address',
        expiresAt
      };
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      return {
        success: false,
        message: `Failed to generate OTP: ${error.message}`
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOTP(otpCode: string, patientId: string): Promise<OTPVerificationResult> {
    try {
      const otp = await OTPVerification.findValidOTP(otpCode, patientId);

      if (!otp) {
        return {
          isValid: false,
          message: 'Invalid or expired OTP code'
        };
      }

      // Mark OTP as used
      otp.isUsed = true;
      await otp.save();

      return {
        isValid: true,
        message: 'OTP verified successfully',
        otpId: otp.id
      };
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return {
        isValid: false,
        message: `Failed to verify OTP: ${error.message}`
      };
    }
  }

  /**
   * Send OTP email
   */
  private static async sendOTPEmail(data: OTPEmailData): Promise<boolean> {
    try {
      return await EmailService.sendOTPEmail(data);
    } catch (error: any) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }


  /**
   * Generate and send OTP for password reset
   */
  static async generateAndSendPasswordResetOTP(email: string): Promise<OTPGenerationResult> {
    try {
      // Find user by email
      const { User } = await import('../models');
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return {
          success: false,
          message: 'User not found with this email address'
        };
      }

      // Check if user is active
      if (!user.isActive) {
        return {
          success: false,
          message: 'Account is deactivated. Please contact support.'
        };
      }

      // Check if there's already a valid password reset OTP for this email
      const existingOTP = await OTPVerification.findOne({
        where: {
          email,
          isUsed: false,
          purpose: 'password_reset'
        }
      });

      if (existingOTP && !existingOTP.isExpired()) {
        return {
          success: false,
          message: 'A password reset OTP has already been sent. Please check your email or wait for it to expire.'
        };
      }

      // Generate new OTP
      const otpCode = OTPVerification.generateOTPCode();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Create OTP record
      const otpRecord = await OTPVerification.create({
        email,
        otpCode,
        purpose: 'password_reset',
        isUsed: false,
        expiresAt
      });

      // Send password reset OTP email
      const emailData: PasswordResetEmailData = {
        userName: user.fullName,
        userEmail: user.email,
        otpCode,
        expiresAt
      };

      await this.sendPasswordResetOTPEmail(emailData);

      return {
        success: true,
        otpId: otpRecord.id,
        message: 'Password reset OTP sent successfully to your email address',
        expiresAt
      };
    } catch (error: any) {
      console.error('Error generating password reset OTP:', error);
      return {
        success: false,
        message: `Failed to generate password reset OTP: ${error.message}`
      };
    }
  }

  /**
   * Verify password reset OTP code
   */
  static async verifyPasswordResetOTP(otpCode: string, email: string): Promise<OTPVerificationResult> {
    try {
      const otp = await OTPVerification.findValidOTPByEmail(otpCode, email, 'password_reset');

      if (!otp) {
        return {
          isValid: false,
          message: 'Invalid or expired password reset OTP code'
        };
      }

      // Mark OTP as used
      otp.isUsed = true;
      await otp.save();

      return {
        isValid: true,
        message: 'Password reset OTP verified successfully',
        otpId: otp.id
      };
    } catch (error: any) {
      console.error('Error verifying password reset OTP:', error);
      return {
        isValid: false,
        message: `Failed to verify password reset OTP: ${error.message}`
      };
    }
  }

  /**
   * Send password reset OTP email
   */
  private static async sendPasswordResetOTPEmail(data: PasswordResetEmailData): Promise<boolean> {
    try {
      return await EmailService.sendPasswordResetOTPEmail(data);
    } catch (error: any) {
      console.error('❌ Failed to send password reset OTP email:', error);
      throw new Error(`Failed to send password reset OTP email: ${error.message}`);
    }
  }

  /**
   * Clean up expired OTPs
   */
  static async cleanupExpiredOTPs(): Promise<void> {
    await OTPVerification.cleanupExpiredOTPs();
  }
}
