const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Room = require("./Room.model");

const RoomImage = sequelize.define("RoomImage", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  image_name_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  main: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: false,
});

Room.hasMany(RoomImage, { foreignKey: "room_id", onDelete: "CASCADE" });
RoomImage.belongsTo(Room, { foreignKey: "room_id" });

module.exports = RoomImage;
