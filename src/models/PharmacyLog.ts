import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';
import Prescription from './Prescription';
import User from './User';

export enum PharmacyAction {
  SCAN = 'scan',
  SCANNED = 'scanned',
  VALIDATED = 'validated',
  DISPENSED = 'dispensed',
  FULFILLED = 'fulfilled'
}

export interface PharmacyLogAttributes {
  id: string;
  prescriptionId: string;
  pharmacistId: string;
  action: PharmacyAction;
  notes?: string;
  actionTimestamp: Date;
  dispensedQuantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  insuranceCoverage?: number;
  patientPayment?: number;
  insuranceProvider?: string;
  insuranceNumber?: string;
  insuranceApprovalCode?: string;
  batchNumber?: string;
  expiryDate?: Date;
  createdAt?: Date;
}

export type PharmacyLogCreationAttributes = Omit<PharmacyLogAttributes, 'id' | 'actionTimestamp' | 'createdAt'>

class PharmacyLog extends Model<PharmacyLogAttributes, PharmacyLogCreationAttributes> implements PharmacyLogAttributes {
  public id!: string;
  public prescriptionId!: string;
  public pharmacistId!: string;
  public action!: PharmacyAction;
  public notes!: string;
  public actionTimestamp!: Date;
  public dispensedQuantity!: number;
  public unitPrice!: number;
  public totalAmount!: number;
  public insuranceCoverage!: number;
  public patientPayment!: number;
  public insuranceProvider!: string;
  public insuranceNumber!: string;
  public insuranceApprovalCode!: string;
  public batchNumber!: string;
  public expiryDate!: Date;
  public readonly createdAt!: Date;
}

PharmacyLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
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
    pharmacistId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'pharmacist_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.ENUM(...Object.values(PharmacyAction)),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actionTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'action_timestamp',
    },
    dispensedQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'dispensed_quantity',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'unit_price',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'total_amount',
    },
    insuranceCoverage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'insurance_coverage',
    },
    patientPayment: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'patient_payment',
    },
    insuranceProvider: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'insurance_provider',
    },
    insuranceNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'insurance_number',
    },
    insuranceApprovalCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'insurance_approval_code',
    },
    batchNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'batch_number',
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'expiry_date',
    },
  },
  {
    sequelize,
    tableName: 'pharmacy_logs',
    modelName: 'PharmacyLog',
    underscored: true, // ✅ ADDED
  },
);

PharmacyLog.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
PharmacyLog.belongsTo(User, { foreignKey: 'pharmacistId', as: 'pharmacist' });
Prescription.hasMany(PharmacyLog, { foreignKey: 'prescriptionId', as: 'pharmacyLogs' });
User.hasMany(PharmacyLog, { foreignKey: 'pharmacistId', as: 'pharmacyLogs' });

export default PharmacyLog;