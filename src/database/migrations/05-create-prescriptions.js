"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("prescriptions", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      prescription_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      patient_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "patients",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      doctor_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "doctors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      visit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "medical_visits",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      diagnosis: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      doctor_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("pending", "fulfilled", "cancelled"),
        allowNull: false,
        defaultValue: "pending",
      },
      qr_code_hash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
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
    await queryInterface.addIndex("prescriptions", ["prescription_number"]);
    await queryInterface.addIndex("prescriptions", ["patient_id"]);
    await queryInterface.addIndex("prescriptions", ["doctor_id"]);
    await queryInterface.addIndex("prescriptions", ["status"]);
    await queryInterface.addIndex("prescriptions", ["qr_code_hash"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("prescriptions");
  },
};
