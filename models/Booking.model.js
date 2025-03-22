const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Room = require("./Room.model");
const Customer = require("./Customer.model");

const Booking = sequelize.define("Booking", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  num_of_guests: {
    type: DataTypes.INTEGER,
  },
  check_in_date: {
    type: DataTypes.DATE,
  },
  check_out_date: {
    type: DataTypes.DATE,
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
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [["confirmed", "canceled", "pending"]],
    },
    defaultValue:"confirmed"
  },
}, { timestamps: false });

Room.hasMany(Booking, { foreignKey: "room_id" });
Booking.belongsTo(Room, { foreignKey: "room_id" });

Customer.hasMany(Booking, { foreignKey: "cust_id" });
Booking.belongsTo(Customer, { foreignKey: "cust_id" });

module.exports = Booking;
