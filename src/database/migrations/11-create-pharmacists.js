"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("pharmacists", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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
      license_number: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
      },
      pharmacy_name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      pharmacy_address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
    await queryInterface.addIndex("pharmacists", ["license_number"]);
    await queryInterface.addIndex("pharmacists", ["user_id"]);
    await queryInterface.addIndex("pharmacists", ["pharmacy_name"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("pharmacists");
  },
};
