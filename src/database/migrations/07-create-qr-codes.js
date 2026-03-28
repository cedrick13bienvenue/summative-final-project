"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("qr_codes", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      qr_hash: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      prescription_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "prescriptions",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      encrypted_data: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      scan_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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
    await queryInterface.addIndex("qr_codes", ["qr_hash"]);
    await queryInterface.addIndex("qr_codes", ["prescription_id"]);
    await queryInterface.addIndex("qr_codes", ["expires_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("qr_codes");
  },
};
