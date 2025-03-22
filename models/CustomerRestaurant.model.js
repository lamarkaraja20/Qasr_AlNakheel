const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Customer = require("./Customer.model");
const Restaurant = require("./Restaurant.model");

const CustomerRestaurant = sequelize.define("CustomerRestaurant", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  cust_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  rest_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  reservation_date: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: true,
    },
  },
  number_of_guests: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  is_walk_in: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  status: {
    type: DataTypes.ENUM("Pending", "Confirmed", "Cancelled"),
    allowNull: false,
    defaultValue: "Confirmed",
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  timestamps: false,
});

Customer.hasMany(CustomerRestaurant, { foreignKey: "cust_id", onDelete: "CASCADE" });
CustomerRestaurant.belongsTo(Customer, { foreignKey: "cust_id" });

Restaurant.hasMany(CustomerRestaurant, { foreignKey: "rest_id", onDelete: "CASCADE" });
CustomerRestaurant.belongsTo(Restaurant, { foreignKey: "rest_id" });

module.exports = CustomerRestaurant;