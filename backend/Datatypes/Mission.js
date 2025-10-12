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
  altitude:{
    type:DataTypes.INTEGER,
    allowNull: false
  },
  speed:{
    type:DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'missions',
  timestamps: true,
});

// Relationship: Mission belongs to Field
Mission.belongsTo(Field, { foreignKey: 'fieldId', onDelete: 'CASCADE' });
Field.hasMany(Mission, { foreignKey: 'fieldId' });

module.exports = { Mission };
