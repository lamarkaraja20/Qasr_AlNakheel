const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");
const Employee = require("./Employee.model");

const EmployeeMobile = sequelize.define("EmployeeMobile", {
    emp_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Employee,
      key: "id",
    },
    onDelete: "CASCADE",
  },
  mobile_no: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
}, {
  timestamps: false,
});

Employee.hasMany(EmployeeMobile, { foreignKey: "emp_id", onDelete: "CASCADE" });
EmployeeMobile.belongsTo(Employee, { foreignKey: "emp_id" });

module.exports = EmployeeMobile;
