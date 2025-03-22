const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Room = require("./Room.model");
const Customer = require("./Customer.model");

const Rating = sequelize.define("Rating", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  room_id: {
    type: DataTypes.UUID,
    references: {
      model: Room,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  pool_id: {
    type: DataTypes.UUID,
    references: {
      model: "Pools",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  hall_id:{
    type: DataTypes.UUID,
    references: {
      model: "Halls",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  rest_id:{
    type: DataTypes.UUID,
    references: {
      model: "Restaurants",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  customer_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Customer,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, { timestamps: true });

Room.hasMany(Rating, { foreignKey: "room_id" });
Customer.hasMany(Rating, { foreignKey: "customer_id" });
Rating.belongsTo(Room, { foreignKey: "room_id" });
Rating.belongsTo(Customer, { foreignKey: "customer_id" });

module.exports = Rating;
