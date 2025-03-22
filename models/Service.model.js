const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");

const Service = sequelize.define("Service", {
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
  description: {
    type: DataTypes.JSON,
  },
  image: {
    type: DataTypes.STRING(255),
  },
}, { 
  timestamps: false,
  tableName: "Services",
});


module.exports = Service;
