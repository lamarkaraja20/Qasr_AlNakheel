const express = require('express');

const router=express.Router();

const multer = require("multer");
const { createBooking, getAllBookings, getBookingsByCustomer, getBookingsByRoom, canceledBooking, deleteBooking } = require('./Booking.Controller');
const { verifyTokenUserVerified } = require('../../middleware/verifyToken');
const upload = multer();


router.post('/:id', upload.none(), createBooking);

router.get('/', getAllBookings);
router.get('/customerBookings/:id', getBookingsByCustomer);
router.get('/roomBookings/:id', getBookingsByRoom);

router.patch('/cancelBooking/:id', canceledBooking);

router.delete('/deleteBooking/:id', deleteBooking)

module.exports=router;

