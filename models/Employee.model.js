const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Hall = require("./Hall.model");
const Restaurant = require("./Restaurant.model");
const Pool = require("./Pool.model");

const Employee = sequelize.define("Employee", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
  },
  jop_description: {
    type: DataTypes.TEXT,
  },
  hire_date: {
    type: DataTypes.DATEONLY,
  },
  salary: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  shift: {
    type: DataTypes.ENUM("Morning", "Evening", "Rotational"),
    allowNull: false,
    defaultValue: "Rotational",
  },
  status: {
    type: DataTypes.ENUM("Active", "Inactive"),
    allowNull: false,
    defaultValue: "Active",
  },
  role: {
    type: DataTypes.ENUM("admin", "employee","reception"),
    allowNull: false,
  },
  hall_id: {
    type: DataTypes.UUID,
    onDelete: "SET NULL",
  },
  rest_id: {
    type: DataTypes.UUID,
    onDelete: "SET NULL",
  },
  pool_id: {
    type: DataTypes.UUID,
    onDelete: "SET NULL",
  },
}, {
  timestamps: false,
});

Employee.belongsTo(Hall, { foreignKey: "hall_id", onDelete: "SET NULL" });
Employee.belongsTo(Restaurant, { foreignKey: "rest_id", onDelete: "SET NULL" });
Employee.belongsTo(Pool, { foreignKey: "pool_id", onDelete: "SET NULL" });

Hall.hasMany(Employee, { foreignKey: "hall_id" });
Restaurant.hasMany(Employee, { foreignKey: "rest_id" });
Pool.hasMany(Employee, { foreignKey: "pool_id" });

module.exports = Employee;