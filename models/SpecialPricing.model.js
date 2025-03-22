const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Room = require("./Room.model");

const SpecialPricing = sequelize.define("SpecialPricing", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  room_id:{
    type: DataTypes.UUID,
    references: {
      model: Room,
      key: "id",
    },
    allowNull: false,
  },
  name: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  description: {
    type: DataTypes.JSON,
  },
  start_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfter: new Date().toISOString().split("T")[0],
    },
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterStartDate(value) {
        if (value <= this.start_date) {
          throw new Error("The end date must be after the start date.");
        }
      },
    },
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, { 
  timestamps: false,
});


Room.hasMany(SpecialPricing, { foreignKey: "room_id", onDelete: "CASCADE" });
SpecialPricing.belongsTo(Room, { foreignKey: "room_id" });

module.exports = SpecialPricing;
