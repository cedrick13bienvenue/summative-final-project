"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add 'scan' value to the pharmacy_logs action enum
    try {
      await queryInterface.sequelize.query(
        "ALTER TYPE \"enum_pharmacy_logs_action\" ADD VALUE 'scan';"
      );
      console.log("✅ Added 'scan' value to pharmacy_logs action enum");
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("✅ Enum value 'scan' already exists, skipping...");
      } else {
        throw error;
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Note: PostgreSQL doesn't easily support removing enum values
    // This is a one-way migration for safety
    console.log(
      "⚠️  Cannot remove enum values in PostgreSQL. Manual cleanup required if needed."
    );
  },
};
