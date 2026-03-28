import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { sequelize } from '../database/config/database';

export interface TokenBlacklistAttributes {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TokenBlacklistCreationAttributes {
  token: string;
  userId: string;
  expiresAt: Date;
}

class TokenBlacklist extends Model<TokenBlacklistAttributes, TokenBlacklistCreationAttributes> implements TokenBlacklistAttributes {
  public id!: string;
  public token!: string;
  public userId!: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistedToken = await this.findOne({
      where: { token },
    });
    return !!blacklistedToken;
  }

  public static async blacklistToken(token: string, userId: string, expiresAt: Date): Promise<void> {
    await this.create({
      token,
      userId,
      expiresAt,
    });
  }

  public static async cleanupExpiredTokens(): Promise<void> {
    const { Op } = require('sequelize');
    await this.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });
  }
}

TokenBlacklist.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
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
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    tableName: 'token_blacklist',
    modelName: 'TokenBlacklist',
    underscored: true, // ✅ ADDED THIS
  }
);

export default TokenBlacklist;