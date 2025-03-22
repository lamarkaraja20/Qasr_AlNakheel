const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Restaurant = require("./Restaurant.model");

const RestaurantImages = sequelize.define("RestaurantImages", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    rest_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Restaurant,
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


Restaurant.hasMany(RestaurantImages, { foreignKey: "rest_id", as: "images", onDelete: "CASCADE" });
RestaurantImages.belongsTo(Restaurant, { foreignKey: "rest_id", as: "restaurant" });


module.exports = RestaurantImages;