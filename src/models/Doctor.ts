import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';
import User from './User';

export interface DoctorAttributes {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  licenseNumber?: string;
  specialization?: string;
  hospitalName?: string;
  isVerified: boolean;
  createdAt?: Date;
}

export type DoctorCreationAttributes = Omit<DoctorAttributes, 'id' | 'email' | 'fullName' | 'createdAt'>

class Doctor extends Model<DoctorAttributes, DoctorCreationAttributes> implements DoctorAttributes {
  public id!: string;
  public userId!: string;
  public email!: string;
  public fullName!: string;
  public phone?: string;
  public licenseNumber?: string;
  public specialization?: string;
  public hospitalName?: string;
  public isVerified!: boolean;
  public readonly createdAt!: Date;
}

Doctor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    email: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this as any).user?.email;
      },
    },
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this as any).user?.fullName;
      },
    },
    phone: {
      type: DataTypes.VIRTUAL,
      get() {
        return (this as any).user?.phone;
      },
    },
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'license_number',
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    hospitalName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'hospital_name',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_verified',
    },
  },
  {
    sequelize,
    tableName: 'doctors',
    modelName: 'Doctor',
    underscored: true, // ✅ ADDED THIS
  },
);

Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctor' });

export default Doctor;