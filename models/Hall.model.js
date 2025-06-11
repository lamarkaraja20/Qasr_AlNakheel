const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");

const Hall = sequelize.define("Hall", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  name: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  availability_status: {
    type: DataTypes.ENUM("available", "occupied"),
    defaultValue: "available",
    allowNull: false,
  },
  capacity: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("meeting", "party"),
    allowNull: false,
  },
  price_per_hour: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.JSON,
  },
  length: {
    type: DataTypes.INTEGER,
  },
  width: {
    type: DataTypes.INTEGER,
  },
  suitable_for: {
    type: DataTypes.JSON,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  }
}, {
  timestamps: false,
});


module.exports = Hall;
