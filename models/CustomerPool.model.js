const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Pool = require("./Pool.model");

const CustomerPool = sequelize.define("CustomerPool", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    customer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "Customers",
            key: "id",
        },
        onDelete: "CASCADE",
    },
    pool_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
    },
    reservation_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    start_time: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    end_time: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    num_guests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    status: {
        type: DataTypes.ENUM("reserved", "checked_in", "checked_out", "canceled"),
        defaultValue: "reserved",
    },
    payed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
    }
}, { timestamps: false });

Pool.hasMany(CustomerPool, { foreignKey: "pool_id" });
CustomerPool.belongsTo(Pool, { foreignKey: "pool_id" });

module.exports = CustomerPool;
