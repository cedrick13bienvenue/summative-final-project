"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create new enum type with 'dispensed' value
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_pharmacy_logs_action_new AS ENUM ('scanned', 'validated', 'dispensed', 'fulfilled');
    `);

    // Update the column to use the new enum type
    await queryInterface.sequelize.query(`
      ALTER TABLE pharmacy_logs 
      ALTER COLUMN action TYPE enum_pharmacy_logs_action_new 
      USING action::text::enum_pharmacy_logs_action_new;
    `);

    // Drop the old enum type
    await queryInterface.sequelize.query(`
      DROP TYPE enum_pharmacy_logs_action;
    `);

    // Rename the new enum type to the original name
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_pharmacy_logs_action_new RENAME TO enum_pharmacy_logs_action;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert back to original enum
    await queryInterface.sequelize.query(`
      CREATE TYPE enum_pharmacy_logs_action_old AS ENUM ('scanned', 'validated', 'fulfilled');
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE pharmacy_logs 
      ALTER COLUMN action TYPE enum_pharmacy_logs_action_old 
      USING action::text::enum_pharmacy_logs_action_old;
    `);

    await queryInterface.sequelize.query(`
      DROP TYPE enum_pharmacy_logs_action;
    `);

    await queryInterface.sequelize.query(`
      ALTER TYPE enum_pharmacy_logs_action_old RENAME TO enum_pharmacy_logs_action;
    `);
  },
};
