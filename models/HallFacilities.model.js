const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Hall = require("./Hall.model");

const HallFacilities = sequelize.define("HallFacilities", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  hall_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Hall,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  name: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  description: {
    type: DataTypes.JSON,
  },
  image:{
    type: DataTypes.STRING(255),
  }
}, { 
  timestamps: false,
});


Hall.hasMany(HallFacilities, {
  foreignKey: "hall_id",
  as: "facilities",
  onDelete: "CASCADE",
});

HallFacilities.belongsTo(Hall, {
  foreignKey: "hall_id",
  as: "hall",
});

module.exports = HallFacilities;
