const express = require('express');
const { addFacility, createHall, getHalls, getHallById, updateHall, addhallImage, updateMainImage, updateFacility, deleteFacility, deleteHallImage, deleteHall, getHallsNotAllData } = require('./Hall.Controller');
const { uploadFacilityImages, uploadHallImages, addHallImage } = require('../../config/multerConfig');
const router = express.Router();

const multer = require("multer");
const { createHallReservation, cancelReservation, acceptReservation, getReservationsByHall, getReservationsByDate, getAllReservations, deleteReservation, getFutureReservations, getReservationsByHallAndDate, getCustomerHallReservations } = require('./HallReservation.Controller');
const { verifyTokenAdmin, verifyTokenAdminOrReceptionist, verifyTokenUserVerified, verifyAnyoneHasAccount } = require('../../middleware/verifyToken');
const upload = multer();

router.post("/", verifyTokenAdmin, uploadHallImages, createHall)
router.post('/addHallImage/:id', verifyTokenAdmin, addHallImage, addhallImage)
router.post("/addFacility/:id", verifyTokenAdmin, uploadFacilityImages, addFacility)

//Hall Reservation
router.post("/hallReservation/:id", verifyTokenUserVerified, upload.none(), createHallReservation)
router.get("/hallReservations", verifyTokenAdminOrReceptionist, getAllReservations)
router.get("/customerHallReservation/:id", verifyAnyoneHasAccount, getCustomerHallReservations)
router.get("/hallReservationByHall/:id", verifyTokenAdminOrReceptionist, getReservationsByHall)
router.get("/getReservationInDay/:date", verifyAnyoneHasAccount, getReservationsByDate)
router.get("/futureReservations", verifyAnyoneHasAccount, getFutureReservations)
router.get("/get/getReservationsByHallAndDate/:id", verifyAnyoneHasAccount, getReservationsByHallAndDate)
router.patch("/cancelHallReservation/:id", verifyAnyoneHasAccount, cancelReservation)
router.patch("/acceptHallReservation/:id", verifyTokenAdminOrReceptionist, acceptReservation)
router.delete("/deleteReservation/:id", verifyAnyoneHasAccount, deleteReservation)
//

router.get('/', getHalls)
router.get('/get/hallsNameAndId', getHallsNotAllData)
router.get('/:id', getHallById)

router.put('/:id', verifyTokenAdmin, upload.none(), updateHall)
router.put('/updateFacility/:id', verifyTokenAdmin, uploadFacilityImages, updateFacility)
router.patch('/updateMainImage/:id', verifyTokenAdmin, addHallImage, updateMainImage)

router.delete('/deleteFacility/:id', verifyTokenAdmin, deleteFacility)
router.delete('/deleteHallImage/:id', verifyTokenAdmin, deleteHallImage)
router.delete('/:id', verifyTokenAdmin, deleteHall)

module.exports = router;