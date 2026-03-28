"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add dispensing fields to pharmacy_logs table
    await queryInterface.addColumn("pharmacy_logs", "dispensed_quantity", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "unit_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "total_amount", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "insurance_coverage", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "patient_payment", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "insurance_provider", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "insurance_number", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "insurance_approval_code", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "batch_number", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("pharmacy_logs", "expiry_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    // Update pharmacy_logs action enum to include DISPENSED
    await queryInterface.changeColumn("pharmacy_logs", "action", {
      type: Sequelize.ENUM("scanned", "validated", "dispensed", "fulfilled"),
      allowNull: false,
    });

    // Add inventory tracking fields to prescription_items table
    await queryInterface.addColumn("prescription_items", "dispensed_quantity", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn("prescription_items", "unit_price", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn("prescription_items", "batch_number", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("prescription_items", "expiry_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn("prescription_items", "is_dispensed", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove dispensing fields from pharmacy_logs table
    await queryInterface.removeColumn("pharmacy_logs", "dispensed_quantity");
    await queryInterface.removeColumn("pharmacy_logs", "unit_price");
    await queryInterface.removeColumn("pharmacy_logs", "total_amount");
    await queryInterface.removeColumn("pharmacy_logs", "insurance_coverage");
    await queryInterface.removeColumn("pharmacy_logs", "patient_payment");
    await queryInterface.removeColumn("pharmacy_logs", "insurance_provider");
    await queryInterface.removeColumn("pharmacy_logs", "insurance_number");
    await queryInterface.removeColumn(
      "pharmacy_logs",
      "insurance_approval_code"
    );
    await queryInterface.removeColumn("pharmacy_logs", "batch_number");
    await queryInterface.removeColumn("pharmacy_logs", "expiry_date");

    // Revert pharmacy_logs action enum
    await queryInterface.changeColumn("pharmacy_logs", "action", {
      type: Sequelize.ENUM("scanned", "validated", "fulfilled"),
      allowNull: false,
    });

    // Remove inventory tracking fields from prescription_items table
    await queryInterface.removeColumn(
      "prescription_items",
      "dispensed_quantity"
    );
    await queryInterface.removeColumn("prescription_items", "unit_price");
    await queryInterface.removeColumn("prescription_items", "batch_number");
    await queryInterface.removeColumn("prescription_items", "expiry_date");
    await queryInterface.removeColumn("prescription_items", "is_dispensed");
  },
};
