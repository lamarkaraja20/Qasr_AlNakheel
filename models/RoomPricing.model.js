const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Room = require("./Room.model");

const RoomPricing = sequelize.define("RoomPricing", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  day_of_week: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]],
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
});

Room.hasMany(RoomPricing, { foreignKey: "room_id", onDelete: "CASCADE" });
RoomPricing.belongsTo(Room, { foreignKey: "room_id" });

module.exports = RoomPricing;
