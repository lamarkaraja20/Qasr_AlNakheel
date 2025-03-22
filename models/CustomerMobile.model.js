const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Customer = require("./Customer.model");

const CustomerMobile = sequelize.define("CustomerMobile", {
  cust_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Customer,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  mobile_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: false,
});

Customer.hasMany(CustomerMobile, { foreignKey: "cust_id", onDelete: "CASCADE" });
CustomerMobile.belongsTo(Customer, { foreignKey: "cust_id" });

module.exports = CustomerMobile;
