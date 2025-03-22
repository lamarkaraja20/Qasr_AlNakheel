const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Room = require("./Room.model");
const Service = require("./Service.model");

const RoomService = sequelize.define("RoomService", {
  id:{
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  room_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Room,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  service_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, { 
  timestamps: false,
  tableName: "RoomServices",
});

Room.belongsToMany(Service, { through: RoomService, foreignKey: "room_id", otherKey: "service_id" });

module.exports = RoomService;
