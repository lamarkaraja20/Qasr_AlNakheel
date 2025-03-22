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
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  price_per_hour: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  description: {
    type: DataTypes.JSON,
  },
}, { 
  timestamps: false,
});


module.exports = Hall;
