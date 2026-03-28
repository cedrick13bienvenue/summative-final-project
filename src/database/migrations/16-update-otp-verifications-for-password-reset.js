"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, add the new enum value to the existing enum type (if it doesn't exist)
    try {
      await queryInterface.sequelize.query(
        "ALTER TYPE \"enum_otp_verifications_purpose\" ADD VALUE 'password_reset';"
      );
    } catch (error) {
      if (error.message.includes("already exists")) {
        console.log("Enum value password_reset already exists, skipping...");
      } else {
        throw error;
      }
    }

    // Drop the existing foreign key constraint first
    await queryInterface.removeConstraint(
      "otp_verifications",
      "otp_verifications_patient_id_fkey"
    );

    // Make patient_id nullable to support password reset OTPs
    await queryInterface.changeColumn("otp_verifications", "patient_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });

    // Re-add the foreign key constraint
    await queryInterface.addConstraint("otp_verifications", {
      fields: ["patient_id"],
      type: "foreign key",
      name: "otp_verifications_patient_id_fkey",
      references: {
        table: "patients",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Add new indexes for password reset functionality
    await queryInterface.addIndex("otp_verifications", ["email", "purpose"], {
      name: "otp_verifications_email_purpose_index",
    });

    await queryInterface.addIndex(
      "otp_verifications",
      ["email", "otp_code", "purpose"],
      {
        unique: true,
        name: "otp_verifications_email_otp_purpose_unique",
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new indexes
    await queryInterface.removeIndex(
      "otp_verifications",
      "otp_verifications_email_purpose_index"
    );
    await queryInterface.removeIndex(
      "otp_verifications",
      "otp_verifications_email_otp_purpose_unique"
    );

    // Drop the foreign key constraint first
    await queryInterface.removeConstraint(
      "otp_verifications",
      "otp_verifications_patient_id_fkey"
    );

    // Make patient_id not nullable again
    await queryInterface.changeColumn("otp_verifications", "patient_id", {
      type: Sequelize.UUID,
      allowNull: false,
    });

    // Re-add the foreign key constraint
    await queryInterface.addConstraint("otp_verifications", {
      fields: ["patient_id"],
      type: "foreign key",
      name: "otp_verifications_patient_id_fkey",
      references: {
        table: "patients",
        field: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum type and updating all references
    // For now, we'll leave the enum value in place
    console.log(
      "Note: password_reset enum value remains in database for safety"
    );
  },
};
