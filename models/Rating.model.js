const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Room = require("./Room.model");
const Customer = require("./Customer.model");
const Hall = require("./Hall.model");
const Pool = require("./Pool.model");
const Restaurant = require("./Restaurant.model");

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
  hall_id: {
    type: DataTypes.UUID,
    references: {
      model: "Halls",
      key: "id",
    },
    onDelete: "CASCADE",
  },
  rest_id: {
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
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  }
}, { timestamps: true });

Room.hasMany(Rating, { foreignKey: "room_id" });
Customer.hasMany(Rating, { foreignKey: "customer_id" });

Rating.belongsTo(Room, { foreignKey: "room_id" });
Rating.belongsTo(Customer, { foreignKey: "customer_id" });

Hall.hasMany(Rating, { foreignKey: "hall_id" });
Rating.belongsTo(Hall, { foreignKey: "hall_id" });

Pool.hasMany(Rating, { foreignKey: "pool_id" });
Rating.belongsTo(Pool, { foreignKey: "pool_id" });

Restaurant.hasMany(Rating, { foreignKey: "rest_id" });
Rating.belongsTo(Restaurant, { foreignKey: "rest_id" });

module.exports = Rating;
