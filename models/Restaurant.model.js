const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");

const Restaurant = sequelize.define("Restaurant", {
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
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  Opening_hours: {
    type: DataTypes.STRING(100),
  },
  Cuisine_type: {
    type: DataTypes.JSON,
  },
  description: {
    type: DataTypes.JSON,
  },
}, {
  timestamps: false,
});


module.exports = Restaurant;
