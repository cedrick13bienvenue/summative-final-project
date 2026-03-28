import { Sequelize } from 'sequelize';

// Test database helper for integration tests
export const createTestDatabase = (): Sequelize => {
  return new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:', // In-memory database for tests
    logging: false, // Disable SQL logging during tests
  });
};

export const setupTestDatabase = async (sequelize: Sequelize) => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true }); // Recreate tables for each test
};

export const teardownTestDatabase = async (sequelize: Sequelize) => {
  await sequelize.close();
};