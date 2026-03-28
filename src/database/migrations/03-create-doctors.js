"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("doctors", {
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
        allowNull: false,
        unique: true,
      },
      specialization: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      hospital_name: {
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.addIndex("doctors", ["license_number"]);
    await queryInterface.addIndex("doctors", ["user_id"]);
    await queryInterface.addIndex("doctors", ["specialization"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("doctors");
  },
};
