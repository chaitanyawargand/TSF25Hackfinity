// models/Mission.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/db');
const { Field } = require('./Field');

const Mission = sequelize.define('Mission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  waypoints: {
    type: DataTypes.JSONB, // array of {lat, lon, alt, speed}
    allowNull: false,
  },
}, {
  tableName: 'missions',
  timestamps: true,
});

// Relationship: Mission belongs to Field
Mission.belongsTo(Field, { foreignKey: 'fieldId', onDelete: 'CASCADE' });
Field.hasMany(Mission, { foreignKey: 'fieldId' });

module.exports = { Mission };
