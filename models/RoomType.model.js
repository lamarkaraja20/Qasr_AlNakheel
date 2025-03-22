const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Room = require("./Room.model");

const RoomType = sequelize.define("RoomType", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    description: {
        type: DataTypes.JSON,
        allowNull: false,
    }
}, {
    timestamps: false,
    tableName: "RoomTypes"
});



module.exports = RoomType;