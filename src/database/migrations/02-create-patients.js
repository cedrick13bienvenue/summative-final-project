"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("patients", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      reference_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      full_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      date_of_birth: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM("male", "female", "other"),
        allowNull: false,
      },
      insurance_provider: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      insurance_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      allergies: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      existing_conditions: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: [],
      },
      emergency_contact: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      emergency_phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex("patients", ["reference_number"]);
    await queryInterface.addIndex("patients", ["user_id"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("patients");
  },
};
