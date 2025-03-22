const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Pool = require("./Pool.model");

const PoolFacilities = sequelize.define("PoolFacilities", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
    },
    pool_id: {
        type: DataTypes.UUID,
        allowNull: false,
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
    }
}, {
    timestamps: false,
});


Pool.hasMany(PoolFacilities, {
    foreignKey: "pool_id",
    as: "facilities",
    onDelete: "CASCADE",
});

PoolFacilities.belongsTo(Pool, {
    foreignKey: "pool_id",
    as: "Pool",
});

module.exports = PoolFacilities;