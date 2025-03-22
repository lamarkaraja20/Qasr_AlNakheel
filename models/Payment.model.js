const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Customer = require("./Customer.model");

const Payment = sequelize.define("Payment", {
  payment_no: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  cust_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Customer,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  payment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01,
    },
  },
  payment_method: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [["cash", "visa card", "paypal"]],
    },
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  invoice_id: { 
    type: DataTypes.UUID,
    allowNull: false,
  },
  invoice_type: { 
    type: DataTypes.ENUM("Booking", "CustomerPool", "CustomerRestaurant", "HallReservation"),
    allowNull: false,
  }
}, { timestamps: false });


Customer.hasMany(Payment, { foreignKey: "cust_id", onDelete: "CASCADE" });
Payment.belongsTo(Customer, { foreignKey: "cust_id" });

module.exports = Payment;
