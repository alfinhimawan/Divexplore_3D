"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const users = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" WHERE email != 'admin@divexplore.id' AND email != 'admin2@divexplore.id'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const consents = users.map(u => ({
      id: uuidv4(),
      user_id: u.id,
      policy_version: "v1.0",
      is_agreed: true,
      agreed_at: lastMonth,
      createdAt: lastMonth,
      updatedAt: lastMonth,
    }));

    if (consents.length > 0) {
      await queryInterface.bulkInsert("UserConsents", consents);
    }

    const auditLogs = [
      {
        id: uuidv4(),
        user_id: null,
        tabel_terdampak: "Vendors",
        data_lama: JSON.stringify({ status_kyc: "pending" }),
        data_baru: JSON.stringify({ status_kyc: "approved" }),
        createdAt: lastMonth,
      }
    ];

    await queryInterface.bulkInsert("AuditLogs", auditLogs);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("AuditLogs", null, {});
    await queryInterface.bulkDelete("UserConsents", null, {});
  }
};
