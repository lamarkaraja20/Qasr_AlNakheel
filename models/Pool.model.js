const { DataTypes } = require('sequelize');
const sequelize = require('../config/dbConnection');

const Pool = sequelize.define('Pool', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.JSON,
        allowNull: false,
    },
    size: {
        type: DataTypes.STRING(200),
    },
    depth: {
        type: DataTypes.STRING(200),
    },
    opening_hours: {
        type: DataTypes.STRING(100),
    },
    status: {
        type: DataTypes.ENUM('available', 'maintenance', 'closed'),
        defaultValue: 'available',
        allowNull: false,
    },
    max_capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    pool_type: {
        type: DataTypes.ENUM('indoor', 'outdoor', 'kids', 'adults'),
        allowNull: false,
    },
    hourly_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    }
}, {
    timestamps: false,
});

module.exports = Pool;