const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,

    dialectOptions: process.env.NODE_ENV === "production" ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      }
    } : {}
  }
);

sequelize.authenticate()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("Connection error:", err));

module.exports = sequelize;