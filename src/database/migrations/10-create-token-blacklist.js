"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("token_blacklist", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      token: {
        type: Sequelize.TEXT,
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

    // Add indexes for better performance
    await queryInterface.addIndex("token_blacklist", ["token"], {
      unique: true,
      name: "token_blacklist_token_unique",
    });

    await queryInterface.addIndex("token_blacklist", ["user_id"], {
      name: "token_blacklist_user_id_index",
    });

    await queryInterface.addIndex("token_blacklist", ["expires_at"], {
      name: "token_blacklist_expires_at_index",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("token_blacklist");
  },
};
