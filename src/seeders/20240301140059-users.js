"use strict";

const bcrypt = require("bcryptjs/dist/bcrypt");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert("members", [
      {
        name: "Huda Putra Santosa",
        role: "admin",
        email: "admin@gmail.com",
        password: bcrypt.hash("admin1234", 8),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: "Nini",
        role: "pembeli",
        email: "nini@gmail.com",
        password: bcrypt.hash("nini1234", 8),
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
