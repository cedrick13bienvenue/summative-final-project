import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';
import Prescription from './Prescription';

export interface PrescriptionItemAttributes {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  quantity: number;
  instructions: string;
  dispensedQuantity?: number;
  unitPrice?: number;
  batchNumber?: string;
  expiryDate?: Date;
  isDispensed?: boolean;
  createdAt?: Date;
}

export type PrescriptionItemCreationAttributes = Omit<PrescriptionItemAttributes, 'id' | 'createdAt'>

class PrescriptionItem extends Model<PrescriptionItemAttributes, PrescriptionItemCreationAttributes> implements PrescriptionItemAttributes {
  public id!: string;
  public prescriptionId!: string;
  public medicineName!: string;
  public dosage!: string;
  public frequency!: string;
  public quantity!: number;
  public instructions!: string;
  public dispensedQuantity!: number;
  public unitPrice!: number;
  public batchNumber!: string;
  public expiryDate!: Date;
  public isDispensed!: boolean;
  public readonly createdAt!: Date;
}

PrescriptionItem.init(
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
    medicineName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'medicine_name',
    },
    dosage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    dispensedQuantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'dispensed_quantity',
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'unit_price',
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
    isDispensed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_dispensed',
    },
  },
  {
    sequelize,
    tableName: 'prescription_items',
    modelName: 'PrescriptionItem',
    underscored: true, // ✅ ADDED
  },
);

PrescriptionItem.belongsTo(Prescription, { foreignKey: 'prescriptionId', as: 'prescription' });
Prescription.hasMany(PrescriptionItem, { foreignKey: 'prescriptionId', as: 'items' });

export default PrescriptionItem;