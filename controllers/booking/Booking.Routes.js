const express = require('express');

const router = express.Router();

const multer = require("multer");
const { createBooking, getAllBookings, getBookingsByCustomer, getBookingsByRoom, canceledBooking, deleteBooking, createBookingByRoomId } = require('./Booking.Controller');
const { verifyTokenUserVerified, verifyTokenAdmin, verifyTokenAdminOrReceptionist, verifyAnyoneHasAccount } = require('../../middleware/verifyToken');
const upload = multer();


router.post('/:id', verifyTokenUserVerified, upload.none(), createBooking);
router.post('/roomBooking/:id', verifyTokenUserVerified, upload.none(), createBookingByRoomId);

router.get('/', verifyTokenAdminOrReceptionist, getAllBookings);
router.get('/customerBookings/:id', getBookingsByCustomer);
router.get('/roomBookings/:id', verifyTokenAdmin, getBookingsByRoom);

router.patch('/cancelBooking/:id', verifyAnyoneHasAccount, canceledBooking);

router.delete('/deleteBooking/:id', verifyAnyoneHasAccount, deleteBooking)

module.exports = router;

