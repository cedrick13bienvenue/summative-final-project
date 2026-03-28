"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("medical_visits", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      visit_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      visit_type: {
        type: Sequelize.ENUM("consultation", "emergency", "followup"),
        allowNull: false,
        defaultValue: "consultation",
      },
      chief_complaint: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      symptoms: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      diagnosis: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      treatment_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      recommendations: {
        type: Sequelize.TEXT,
        allowNull: true,
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
    await queryInterface.addIndex("medical_visits", ["patient_id"]);
    await queryInterface.addIndex("medical_visits", ["doctor_id"]);
    await queryInterface.addIndex("medical_visits", ["visit_date"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("medical_visits");
  },
};
