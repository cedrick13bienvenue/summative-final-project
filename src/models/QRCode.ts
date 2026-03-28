import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';
import Prescription from './Prescription';

export interface QRCodeAttributes {
  id: string;
  qrHash: string;
  prescriptionId: string;
  encryptedData: string;
  expiresAt: Date;
  isUsed: boolean;
  scanCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type QRCodeCreationAttributes = Omit<QRCodeAttributes, 'id' | 'scanCount' | 'createdAt'>

class QRCode extends Model<QRCodeAttributes, QRCodeCreationAttributes> implements QRCodeAttributes {
  public id!: string;
  public qrHash!: string;
  public prescriptionId!: string;
  public encryptedData!: string;
  public expiresAt!: Date;
  public isUsed!: boolean;
  public scanCount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public isExpired (): boolean {
    return new Date() > this.expiresAt;
  }

  public markAsUsed (): void {
    this.isUsed = true;
    this.scanCount += 1;
  }
}

QRCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    qrHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'qr_hash',
    },
    prescriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'prescription_id',
      references: {
        model: 'prescriptions',
        key: 'id',
      },
    },
    encryptedData: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'encrypted_data',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_used',
    },
    scanCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'scan_count',
    },
  },
  {
    sequelize,
    tableName: 'qr_codes',
    modelName: 'QRCode',
    underscored: true, // ✅ ADDED
  },
);

QRCode.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
Prescription.hasOne(QRCode, { foreignKey: 'prescriptionId', as: 'qrCode' });

export default QRCode;
