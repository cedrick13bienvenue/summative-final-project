'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'national_id', {
      type: Sequelize.STRING(16),
      allowNull: true,
      unique: true,
      after: 'phone',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'national_id');
  },
};
