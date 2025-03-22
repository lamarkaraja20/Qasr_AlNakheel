const express = require('express');
const { roomRating, getCustomerById, poolRating, hallRating, deleteCustomer, getAllCustomers, restaurantRating, updateCustomerProfile, changePassword } = require('./Customer.Controller');
const { uploadprofilePicturesImage } = require('../../config/multerConfig');
const router = express.Router();

const multer = require("multer");
const upload = multer();

router.post("/rating/room/:id", upload.none(), roomRating)
router.post("/rating/pool/:id", upload.none(), poolRating)
router.post("/rating/hall/:id", upload.none(), hallRating)
router.post("/rating/restaurant/:id", upload.none(), restaurantRating)

router.get("/:id", getCustomerById)
router.get("/", getAllCustomers)

router.put('/update/:id', uploadprofilePicturesImage, updateCustomerProfile)
router.patch('/update/changePassword/:id', changePassword)

router.delete('/:id', deleteCustomer)

module.exports = router;

//get rating in other controllers