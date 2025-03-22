const sequelize = require('./dbConnection');
const Customer = require('../models/Customer.model')
const CustomerMobile=require('../models/CustomerMobile.model')
const Payment = require('../models/Payment.model')
const Employee = require('../models/Employee.model')
const EmployeeMobile = require('../models/EmployeeMobile.model')
const RoomType = require('../models/RoomType.model');
const Room = require('../models/Room.model')
const RoomImage = require('../models/RoomImage.model')
const RoomPricing = require('../models/RoomPricing.model')
const SpecialPricing = require('../models/SpecialPricing.model')
const Booking = require('../models/Booking.model')
const Rating = require('../models/Rating.model')
const Hall = require('../models/Hall.model')
const HallFacilities = require('../models/HallFacilities.model')
const HallImages = require('../models/HallImages.model')
const Service = require('../models/Service.model')
const RoomService =require('../models/RoomService.model')
const Restaurant = require('../models/Restaurant.model')
const CustomerRestaurant = require('../models/CustomerRestaurant.model')
const Pool = require('../models/Pool.model')
const Contact = require('../models/Contact.model')
const CustomerPool = require('../models/CustomerPool.model')
const PoolImages = require('../models/PoolImages.model')
const PoolFacilities= require('../models/PoolFacilities.model')
const HallReservation = require('../models/HallReservation.model')
const RestaurantImages=require('../models/RestaurantImages.model')

sequelize.sync({ alter: true })
  .then(() => console.log("✅ Database synchronized successfully"))
  .catch(err => console.error("❌ Sync error:", err));

module.exports = sequelize;
