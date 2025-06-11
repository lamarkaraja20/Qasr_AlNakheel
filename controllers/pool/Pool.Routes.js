const express = require('express');
const { uploadFacilityImages, uploadPoolImages, uploadMorePoolImage } = require('../../config/multerConfig');
const router = express.Router();

const multer = require("multer");
const { createPool, getPools, getPoolById, updatePool, addPoolImage, updateMainImage, addFacility, updateFacility, deleteFacility, deletePoolImage, deletePool, getPoolsName } = require('./Pool.Controller');
const { createPoolReservation, getReservationsByPoolId, getReservationsByTime, checkIn, checkOut, getPoolReservationsByCustomer, cancelReservation, getAllPoolReservations, deletePoolReservation } = require('./PoolReservation.Controller');
const { verifyTokenAdmin, verifyTokenAdminOrReceptionist, verifyTokenUserVerified, verifyAnyoneHasAccount } = require('../../middleware/verifyToken');
const upload = multer();

router.post("/", verifyTokenAdmin, uploadPoolImages, createPool)
router.post('/addPoolImage/:id', verifyTokenAdmin, uploadMorePoolImage, addPoolImage)
router.post("/addFacility/:id", verifyTokenAdmin, uploadFacilityImages, addFacility)

//pool reservation
router.post('/createPoolReservation/:id', verifyTokenUserVerified, createPoolReservation)
router.get('/get/AllPoolReservations', verifyTokenAdminOrReceptionist, getAllPoolReservations)
router.get('/getPoolReservationByCustomerId/:id', verifyAnyoneHasAccount, getPoolReservationsByCustomer)
router.get('/getPoolReservationByPoolId/:id', verifyTokenAdminOrReceptionist, getReservationsByPoolId)
router.get('/getReservationsByTime', verifyAnyoneHasAccount, getReservationsByTime)
router.patch('/checkIn/:id', verifyTokenAdminOrReceptionist, checkIn)
router.patch('/checkOut/:id', verifyTokenAdminOrReceptionist, checkOut)
router.patch('/cancelPoolReservation/:id', verifyAnyoneHasAccount, cancelReservation)
router.delete('/deleteReservation/:id', verifyAnyoneHasAccount, deletePoolReservation)


router.get('/', getPools)
router.get('/get/PoolsName', getPoolsName)
router.get('/:id', getPoolById)

router.put('/:id', verifyTokenAdmin, upload.none(), updatePool)
router.put('/updateFacility/:id', verifyTokenAdmin, uploadFacilityImages, updateFacility)
router.patch('/updateMainImage/:id', verifyTokenAdmin, uploadMorePoolImage, updateMainImage)

router.delete('/deleteFacility/:id', verifyTokenAdmin, deleteFacility)
router.delete('/deletePoolImage/:id', verifyTokenAdmin, deletePoolImage)
router.delete('/:id', verifyTokenAdmin, deletePool)

module.exports = router;