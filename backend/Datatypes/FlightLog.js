// models/FlightLog.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/db');
const { Mission } = require('./Mission');

const FlightLog = sequelize.define('FlightLog', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  telemetry: {
    type: DataTypes.JSONB, // {lat, lon, alt, speed, battery,prediction}
    allowNull: false,
  },
}, {
  tableName: 'flight_logs',
  timestamps: true,
});


FlightLog.belongsTo(Mission, { foreignKey: 'missionId', onDelete: 'CASCADE' });
Mission.hasMany(FlightLog, { foreignKey: 'missionId' });

module.exports = { FlightLog };
