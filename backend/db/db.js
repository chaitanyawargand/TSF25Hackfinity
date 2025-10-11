const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    await sequelize.sync({ alter: true });
    console.log('✅ Tables synced successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
})();

module.exports = { sequelize};
