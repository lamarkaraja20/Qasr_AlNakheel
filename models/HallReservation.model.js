const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");

const Hall = require("./Hall.model");
const Customer = require("./Customer.model");

const HallReservation = sequelize.define("HallReservation", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    cust_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Customer,
            key: "id",
        },
        onDelete: "CASCADE",
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
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
        defaultValue: "confirmed",
        allowNull: false,
    },
    payed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    timestamps: false,
})

Hall.hasMany(HallReservation, { foreignKey: "hall_id" });
Customer.hasMany(HallReservation, { foreignKey: "cust_id" });

HallReservation.belongsTo(Hall, { foreignKey: "hall_id" });
HallReservation.belongsTo(Customer, { foreignKey: "cust_id" });

module.exports = HallReservation;