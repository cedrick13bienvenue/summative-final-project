import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';
import Patient from './Patient';
import Doctor from './Doctor';
import MedicalVisit from './MedicalVisit';

export enum PrescriptionStatus {
  PENDING = 'pending',
  SCANNED = 'scanned',
  VALIDATED = 'validated',
  DISPENSED = 'dispensed',
  REJECTED = 'rejected',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled'
}

export interface PrescriptionAttributes {
  id: string;
  prescriptionNumber?: string;
  patientId: string;
  doctorId: string;
  visitId: string;
  diagnosis?: string;
  doctorNotes?: string;
  status: PrescriptionStatus;
  qrCodeHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PrescriptionCreationAttributes = Omit<PrescriptionAttributes, 'id' | 'createdAt' | 'updatedAt'>

class Prescription extends Model<PrescriptionAttributes, PrescriptionCreationAttributes> implements PrescriptionAttributes {
  public id!: string;
  public prescriptionNumber?: string;
  public patientId!: string;
  public doctorId!: string;
  public visitId!: string;
  public diagnosis!: string;
  public doctorNotes!: string;
  public status!: PrescriptionStatus;
  public qrCodeHash!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static generatePrescriptionNumber (): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RX-${year}${month}${day}-${random}`;
  }
}

Prescription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    prescriptionNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'prescription_number',
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'patient_id',
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'doctor_id',
      references: {
        model: 'doctors',
        key: 'id',
      },
    },
    visitId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'visit_id',
      references: {
        model: 'medical_visits',
        key: 'id',
      },
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    doctorNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'doctor_notes',
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PrescriptionStatus)),
      allowNull: false,
      defaultValue: PrescriptionStatus.PENDING,
    },
    qrCodeHash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'qr_code_hash',
    },
  },
  {
    sequelize,
    tableName: 'prescriptions',
    modelName: 'Prescription',
    underscored: true, // ✅ ADDED
    hooks: {
      beforeCreate: (prescription: Prescription) => {
        if (!prescription.prescriptionNumber) {
          prescription.prescriptionNumber = Prescription.generatePrescriptionNumber();
        }
      },
    },
  },
);

Prescription.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Prescription.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Prescription.belongsTo(MedicalVisit, { foreignKey: 'visitId', as: 'visit' });
Patient.hasMany(Prescription, { foreignKey: 'patientId', as: 'prescriptions' });
Doctor.hasMany(Prescription, { foreignKey: 'doctorId', as: 'prescriptions' });
MedicalVisit.hasMany(Prescription, { foreignKey: 'visitId', as: 'prescriptions' });

export default Prescription;