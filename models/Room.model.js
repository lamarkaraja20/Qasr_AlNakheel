const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const RoomType = require("./RoomType.model");

const Room = sequelize.define("Room", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  room_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  type: {
    type: DataTypes.UUID,
    allowNull: false,
    references:{
      model: "RoomTypes",
      key: "id",
    },
    onDelete:"SET NULL",
  },
  capacity: {
    type: DataTypes.INTEGER,
  },
  room_length: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  num_of_baths: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  adult_guests: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  child_guests: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  bed_type: {
    type: DataTypes.JSON,
    allowNull: false,
  },
}, { 
  timestamps: false,
  tableName: "Rooms"
});

Room.belongsTo(RoomType, { foreignKey: 'type' });
RoomType.hasMany(Room, { foreignKey: 'type' });

module.exports = Room;
