const express = require('express');
const router = express.Router();

const multer = require("multer");
const { createRestaurant, getRestaurants, getRestaurantById, updateRestaurant, addRestaurantImage, updateMainImage, deleteRestaurantImage, deleteRestaurant } = require('./Restaurant.Controller');
const { uploadRestaurantImages, uploadMoreRestaurantImage } = require('../../config/multerConfig');
const { createRestaurantReservation, getReservationsByRestaurant, getReservationsByDate, deleteReservation, getFutureReservations, acceptRestaurantReservation } = require('./RestaurantReservation.Controller');
const upload = multer();

router.post('/', uploadRestaurantImages, createRestaurant);
router.post('/addRestaurantImage/:id', uploadMoreRestaurantImage, addRestaurantImage)


//RestaurantReservation
router.post("/createRestaurantReservation/:id", createRestaurantReservation);
router.get("/reservationsByRestaurant/:id", getReservationsByRestaurant);
router.get("/reservations/date/:date", getReservationsByDate);
router.get("/reservations/future", getFutureReservations);
router.patch("/acceptReservation/:id", acceptRestaurantReservation);
router.delete("/reservation/:id", deleteReservation);
//

router.get('/', getRestaurants)
router.get('/:id', getRestaurantById)

router.put('/:id', upload.none(), updateRestaurant)
router.patch('/updateMainImage/:id', uploadMoreRestaurantImage, updateMainImage)

router.delete('/deleteRestaurantImage/:id', deleteRestaurantImage)
router.delete('/:id', deleteRestaurant)

module.exports = router;