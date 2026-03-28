"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Make doctor fields nullable
    await queryInterface.changeColumn("doctors", "license_number", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    await queryInterface.changeColumn("doctors", "specialization", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.changeColumn("doctors", "hospital_name", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to not null
    await queryInterface.changeColumn("doctors", "license_number", {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    });

    await queryInterface.changeColumn("doctors", "specialization", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn("doctors", "hospital_name", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
