require('express-async-errors');
const express = require("express");
const bodyparser = require('body-parser');
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const cors = require("cors");
const path = require("path");

const auth = require("./controllers/auth/Auth.Routes");
const googleAuth = require("./controllers/auth/Google.Controller");
const facebookAuth = require("./controllers/auth/Facebook.Controller");
const employee = require("./controllers/employee/Employee.Routes");
const service = require("./controllers/services/Services.Routes");
const room = require("./controllers/room/Room.Routes");
const booking = require("./controllers/booking/Booking.Routes")
const contact = require("./controllers/contact/Contact.Routes")
const hall = require("./controllers/hall/Hall.Routes");
const pool = require("./controllers/pool/Pool.Routes");
const restaurant = require("./controllers/restaurant/Restaurant.Routes");
const customer = require("./controllers/customer/Customer.Routes");
const payment = require("./controllers/payment/Payment.Routes");
const general = require("./controllers/general/General.Routes");

require('./config/sync');

require("dotenv").config();

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 3000;


const corsSettings = {
  origin: process.env.FRONTEND_URL || `http://localhost:5173`,
  methods: "GET,PUT,POST,DELETE,PATCH",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsSettings));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyparser.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// activate `passport`
app.use(passport.initialize());
app.use(passport.session());


app.use("/api/auth", auth);
app.use("/auth", googleAuth);
app.use("/auth", facebookAuth);

app.use("/api/employee", employee);
app.use("/api/services", service)
app.use("/api/room", room)
app.use("/api/booking", booking)
app.use("/api/contact", contact)
app.use("/api/halls", hall)
app.use("/api/pools", pool)
app.use("/api/restaurants", restaurant)
app.use("/api/customers", customer)
app.use("/api/payment", payment)
app.use("/api/general", general)

app.get("/", (req, res) => {
  res.send("Hello, Backend is running!");
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});