"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("otp_verifications", {
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
      email: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      otp_code: {
        type: Sequelize.STRING(6),
        allowNull: false,
      },
      purpose: {
        type: Sequelize.ENUM("medical_history_access"),
        allowNull: false,
        defaultValue: "medical_history_access",
      },
      is_used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      expires_at: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex(
      "otp_verifications",
      ["patient_id", "otp_code"],
      {
        unique: true,
        name: "otp_verifications_patient_otp_unique",
      }
    );

    await queryInterface.addIndex("otp_verifications", ["expires_at"], {
      name: "otp_verifications_expires_at_index",
    });

    await queryInterface.addIndex("otp_verifications", ["patient_id"], {
      name: "otp_verifications_patient_id_index",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("otp_verifications");
  },
};
