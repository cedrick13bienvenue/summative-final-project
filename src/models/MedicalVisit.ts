import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';
import Patient from './Patient';
import Doctor from './Doctor';

export enum VisitType {
  CONSULTATION = 'consultation',
  EMERGENCY = 'emergency',
  FOLLOWUP = 'followup'
}

export interface MedicalVisitAttributes {
  id: string;
  patientId: string;
  doctorId: string;
  visitDate: Date;
  visitType: VisitType;
  chiefComplaint: string;
  symptoms?: string;
  diagnosis?: string;
  treatmentNotes?: string;
  recommendations?: string;
  createdAt?: Date;
}

export type MedicalVisitCreationAttributes = Omit<MedicalVisitAttributes, 'id' | 'createdAt'>

class MedicalVisit extends Model<MedicalVisitAttributes, MedicalVisitCreationAttributes> implements MedicalVisitAttributes {
  public id!: string;
  public patientId!: string;
  public doctorId!: string;
  public visitDate!: Date;
  public visitType!: VisitType;
  public chiefComplaint!: string;
  public symptoms!: string;
  public diagnosis!: string;
  public treatmentNotes!: string;
  public recommendations!: string;
  public readonly createdAt!: Date;
}

MedicalVisit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
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
    visitDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'visit_date',
    },
    visitType: {
      type: DataTypes.ENUM(...Object.values(VisitType)),
      allowNull: false,
      defaultValue: VisitType.CONSULTATION,
      field: 'visit_type',
    },
    chiefComplaint: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'chief_complaint',
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    treatmentNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'treatment_notes',
    },
    recommendations: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'medical_visits',
    modelName: 'MedicalVisit',
    underscored: true, // ✅ ADDED
  },
);

MedicalVisit.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
MedicalVisit.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Patient.hasMany(MedicalVisit, { foreignKey: 'patientId', as: 'visits' });
Doctor.hasMany(MedicalVisit, { foreignKey: 'doctorId', as: 'visits' });

export default MedicalVisit;