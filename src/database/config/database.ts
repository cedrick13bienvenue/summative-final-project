import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env['NODE_ENV'] === 'production';

export const sequelize = new Sequelize(
  process.env['DB_NAME'] || 'medconnect_db',
  process.env['DB_USER'] || 'postgres',
  process.env['DB_PASSWORD'] || 'password',
  {
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    dialect: 'postgres',
    logging: false,
    dialectOptions: isProduction ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 5000, // Reduced timeout so it doesn't hang the server
      idle: 10000,
    },
  },
);

export const connectDatabase = async (): Promise<void> => {
  // We authenticate but the error is caught in server.ts
  await sequelize.authenticate();
  console.log('✅ Database connection established successfully');
};

export default sequelize;