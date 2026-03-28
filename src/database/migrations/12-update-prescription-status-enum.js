"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, we need to alter the enum type to include the new values
    // PostgreSQL requires us to add values one by one
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_prescriptions_status" ADD VALUE IF NOT EXISTS 'scanned';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_prescriptions_status" ADD VALUE IF NOT EXISTS 'validated';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_prescriptions_status" ADD VALUE IF NOT EXISTS 'dispensed';
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_prescriptions_status" ADD VALUE IF NOT EXISTS 'rejected';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum type and updating all references
    // For safety, we'll leave the rollback empty and document this limitation
    console.log(
      "Warning: Cannot remove enum values in PostgreSQL. Manual intervention required if rollback is needed."
    );
  },
};
