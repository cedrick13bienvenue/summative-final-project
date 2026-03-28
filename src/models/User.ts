import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';
import bcrypt from 'bcryptjs';

export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  PHARMACIST = 'pharmacist',
  ADMIN = 'admin'
}

export interface UserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  phone?: string;
  nationalId?: string;
  isActive: boolean;
  password?: string; // Virtual field for password during creation
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'passwordHash' | 'createdAt' | 'updatedAt'> {
  password?: string;
  passwordHash?: string;
}

export interface UserInstance extends User {
  password?: string;
}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: UserRole;
  public fullName!: string;
  public phone!: string;
  public nationalId?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  
  // Virtual field for password during creation
  public password?: string;

  // Instance methods
  public async comparePassword (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
  }

  public async hashPassword (password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash', // THIS IS THE FIX - Map to database column name
    },
    role: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.PATIENT,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'full_name', // Map to database column name
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nationalId: {
      type: DataTypes.STRING(16),
      allowNull: true,
      unique: true,
      field: 'national_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active', // Map to database column name
    },
    password: {
      type: DataTypes.VIRTUAL,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    underscored: true, // THIS IS IMPORTANT - Automatically maps camelCase to snake_case
    hooks: {
      beforeCreate: async (user: User) => {
        const password = (user as any).password;
        if (password) {
          user.passwordHash = await user.hashPassword(password);
        }
      },
      beforeUpdate: async (user: User) => {
        const password = (user as any).password;
        if (password) {
          user.passwordHash = await user.hashPassword(password);
        }
      },
    },
  },
);

export default User;