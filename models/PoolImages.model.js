const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Pool = require("./Pool.model");

const PoolImages = sequelize.define("PoolImages", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    pool_id: {
        type: DataTypes.UUID,
        allowNull: false,
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


Pool.hasMany(PoolImages, { foreignKey: "pool_id", as: "images", onDelete: "CASCADE" });
PoolImages.belongsTo(Pool, { foreignKey: "pool_id", as: "pool" });


module.exports = PoolImages;
