'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex('patients', ['reference_number']).catch(() => {});
    await queryInterface.removeColumn('patients', 'reference_number');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('patients', 'reference_number', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      after: 'user_id',
    });
  },
};
