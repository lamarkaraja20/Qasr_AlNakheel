const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Hall = require("./Hall.model");

const HallImages = sequelize.define("HallImages", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
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


Hall.hasMany(HallImages, { foreignKey: "hall_id", as: "images", onDelete: "CASCADE" });
HallImages.belongsTo(Hall, { foreignKey: "hall_id", as: "hall" });


module.exports = HallImages;
