"use strict";

const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash("admin123!@#", 12);

    await queryInterface.bulkInsert("users", [
      {
        id: uuidv4(),
        email: "admin@medconnect.com",
        password_hash: hashedPassword,
        role: "admin",
        full_name: "System Administrator",
        phone: "+250788000000",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      "users",
      {
        email: "admin@medconnect.com",
      },
      {}
    );
  },
};
