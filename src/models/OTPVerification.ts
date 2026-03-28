import { Model, DataTypes, UUIDV4, Op } from 'sequelize';
import { sequelize } from '../database/config/database';

export interface OTPVerificationAttributes {
  id: string;
  patientId?: string;
  email: string;
  otpCode: string;
  purpose: 'medical_history_access' | 'password_reset';
  isUsed: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type OTPVerificationCreationAttributes = Omit<OTPVerificationAttributes, 'id' | 'createdAt' | 'updatedAt'>;

class OTPVerification extends Model<OTPVerificationAttributes, OTPVerificationCreationAttributes> implements OTPVerificationAttributes {
  public id!: string;
  public patientId?: string;
  public email!: string;
  public otpCode!: string;
  public purpose!: 'medical_history_access' | 'password_reset';
  public isUsed!: boolean;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isValid(): boolean {
    return !this.isExpired() && !this.isUsed;
  }

  public static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public static async cleanupExpiredOTPs(): Promise<void> {
    try {
      await OTPVerification.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });
      console.log('✅ Expired OTPs cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup expired OTPs:', error);
    }
  }

  public static async findValidOTP(otpCode: string, patientId: string): Promise<OTPVerification | null> {
    const otp = await OTPVerification.findOne({
      where: {
        otpCode,
        patientId,
        isUsed: false
      }
    });

    if (!otp || otp.isExpired()) {
      return null;
    }

    return otp;
  }

  public static async findValidOTPByEmail(otpCode: string, email: string, purpose: 'medical_history_access' | 'password_reset'): Promise<OTPVerification | null> {
    const otp = await OTPVerification.findOne({
      where: {
        otpCode,
        email,
        purpose,
        isUsed: false
      }
    });

    if (!otp || otp.isExpired()) {
      return null;
    }

    return otp;
  }
}

OTPVerification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'patient_id',
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    otpCode: {
      type: DataTypes.STRING(6),
      allowNull: false,
      field: 'otp_code',
    },
    purpose: {
      type: DataTypes.ENUM('medical_history_access', 'password_reset'),
      allowNull: false,
      defaultValue: 'medical_history_access',
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_used',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    tableName: 'otp_verifications',
    modelName: 'OTPVerification',
    underscored: true, // ✅ ADDED
    indexes: [
      {
        fields: ['patient_id', 'otp_code'],
        unique: true,
      },
      {
        fields: ['expires_at'],
      },
    ],
  },
);

export default OTPVerification;