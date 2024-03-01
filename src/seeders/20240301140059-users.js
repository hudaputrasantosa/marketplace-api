"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("members", [
      {
        name: "Huda Putra Santosa",
        role: "admin",
        email: "admin@gmail.com",
        password: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Nini",
        role: "pembeli",
        email: "nini@gmail.com",
        password: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
