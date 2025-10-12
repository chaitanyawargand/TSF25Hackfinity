// models/Field.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/db');
const { User } = require('./User');

const Field = sequelize.define('Field', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  boundary: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
}, {
  tableName: 'fields',
  timestamps: true,
});

// Relationship: Field belongs to User
Field.belongsTo(User, { foreignKey: 'ownerId', onDelete: 'CASCADE' });
User.hasMany(Field, { foreignKey: 'ownerId' });

module.exports = { Field };
