const express = require('express');
const { uploadFacilityImages, uploadPoolImages, uploadMorePoolImage } = require('../../config/multerConfig');
const router = express.Router();

const multer = require("multer");
const { createPool, getPools, getPoolById, updatePool, addPoolImage, updateMainImage, addFacility, updateFacility, deleteFacility, deletePoolImage, deletePool } = require('./Pool.Controller');
const { createPoolReservation, getReservationsByCustomerId, getReservationsByPoolId, getReservationsByTime, checkIn, checkOut } = require('./PoolReservation.Controller');
const upload = multer();

router.post("/", uploadPoolImages, createPool)
router.post('/addPoolImage/:id', addPoolImage, addPoolImage)
router.post("/addFacility/:id", uploadFacilityImages, addFacility)

//pool reservation
router.post('/createPoolReservation/:id', createPoolReservation)
router.get('/getPoolReservationByCustomerId/:id', getReservationsByCustomerId)
router.get('/getPoolReservationByPoolId/:id', getReservationsByPoolId)
router.get('/getReservationsByTime', getReservationsByTime)
router.patch('/checkIn/:id', checkIn)
router.patch('/checkOut/:id', checkOut)

router.get('/', getPools)
router.get('/:id', getPoolById)

router.put('/:id', upload.none(), updatePool)
router.put('/updateFacility/:id', uploadFacilityImages, updateFacility)
router.patch('/updateMainImage/:id', uploadMorePoolImage, updateMainImage)

router.delete('/deleteFacility/:id', deleteFacility)
router.delete('/deletePoolImage/:id', deletePoolImage)
router.delete('/:id', deletePool)

module.exports = router;