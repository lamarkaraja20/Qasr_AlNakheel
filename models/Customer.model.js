const { DataTypes } = require("sequelize");
const sequelize = require("../config/dbConnection");

const Customer = sequelize.define("Customer", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  second_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  third_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM("male", "female"),
    allowNull: true,
  },
  profession: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  free_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(50),
  },
  city: {
    type: DataTypes.STRING(50),
  },
  postal_code: {
    type: DataTypes.STRING(20),
  },
  birthdate: {
    type: DataTypes.DATE,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(200),
  },
  google_id: {
    type: DataTypes.STRING(100),
    unique: true,
  },
  facebook_id: {
    type: DataTypes.STRING(100),
    unique: true,
  },
  auth_provider: {
    type: DataTypes.STRING(20),
    defaultValue: "email",
    validate: {
      isIn: [["email", "google", "facebook"]],
    },
  },
  profile_picture: {
    type: DataTypes.STRING(255),
  },
  banned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  }
}, { timestamps: false });

module.exports = Customer;
