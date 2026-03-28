import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';
import User from './User';

export interface PharmacistAttributes {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  licenseNumber?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  isVerified: boolean;
  createdAt?: Date;
}

export type PharmacistCreationAttributes = Omit<PharmacistAttributes, 'id' | 'email' | 'fullName' | 'createdAt'>

class Pharmacist extends Model<PharmacistAttributes, PharmacistCreationAttributes> implements PharmacistAttributes {
  public id!: string;
  public userId!: string;
  public email!: string;
  public fullName!: string;
  public licenseNumber?: string;
  public pharmacyName?: string;
  public pharmacyAddress?: string;
  public isVerified!: boolean;
  public readonly createdAt!: Date;
}

Pharmacist.init(
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
    licenseNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: 'license_number',
    },
    pharmacyName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pharmacy_name',
    },
    pharmacyAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'pharmacy_address',
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
    tableName: 'pharmacists',
    modelName: 'Pharmacist',
    underscored: true, // ✅ ADDED THIS
  },
);

Pharmacist.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Pharmacist, { foreignKey: 'userId', as: 'pharmacist' });

export default Pharmacist;