const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');
const Customer = require('./Customer.model');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  cust_id: {
    type: DataTypes.UUID,
    allowNull: false,
  }, subject: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('unread', 'read'),
    defaultValue: 'unread'
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  timestamps: false,
  tableName: 'contacts'
});

Customer.hasMany(Contact, { foreignKey: "cust_id", onDelete: "CASCADE" });
Contact.belongsTo(Customer, { foreignKey: "cust_id" });

module.exports = Contact;
