const express = require('express');
const router = express.Router();

const multer = require("multer");
const { createRestaurant, getRestaurants, getRestaurantById, updateRestaurant, addRestaurantImage, updateMainImage, deleteRestaurantImage, deleteRestaurant } = require('./Restaurant.Controller');
const { uploadRestaurantImages, uploadMoreRestaurantImage } = require('../../config/multerConfig');
const { createRestaurantReservation, getReservationsByRestaurant, getReservationsByDate, deleteReservation, getFutureReservations, acceptRestaurantReservation, getRestaurantReservationsByCustomer, cancelRestaurantReservation, getAllRestaurantReservations } = require('./RestaurantReservation.Controller');
const { verifyTokenAdmin, verifyTokenAdminOrReceptionist, verifyTokenUserVerified, verifyAnyoneHasAccount } = require('../../middleware/verifyToken');
const upload = multer();

router.post('/', verifyTokenAdmin, uploadRestaurantImages, createRestaurant);
router.post('/addRestaurantImage/:id', verifyTokenAdmin, uploadMoreRestaurantImage, addRestaurantImage)


//RestaurantReservation
router.post("/createRestaurantReservation/:id", verifyTokenUserVerified, createRestaurantReservation);
router.get("/get/allReservationWithFilter", verifyTokenAdminOrReceptionist, getAllRestaurantReservations)
router.get("/reservationsByRestaurant/:id", verifyTokenAdminOrReceptionist, getReservationsByRestaurant);
router.get("/get/ReservationsCustomer/:id", verifyAnyoneHasAccount, getRestaurantReservationsByCustomer)
router.get("/reservations/date/:date", verifyTokenAdminOrReceptionist, getReservationsByDate);
router.get("/reservations/future", verifyTokenAdminOrReceptionist, getFutureReservations);
router.patch("/acceptReservation/:id", verifyTokenAdminOrReceptionist, acceptRestaurantReservation);
router.patch("/cancelRestaurantReservation/:id", verifyAnyoneHasAccount, cancelRestaurantReservation)
router.delete("/reservation/:id", verifyAnyoneHasAccount, deleteReservation);
//

router.get('/', getRestaurants)
router.get('/:id', getRestaurantById)

router.put('/:id', verifyTokenAdmin, upload.none(), updateRestaurant)
router.patch('/updateMainImage/:id', verifyTokenAdmin, uploadMoreRestaurantImage, updateMainImage)

router.delete('/deleteRestaurantImage/:id', verifyTokenAdmin, deleteRestaurantImage)
router.delete('/:id', verifyTokenAdmin, deleteRestaurant)

module.exports = router;