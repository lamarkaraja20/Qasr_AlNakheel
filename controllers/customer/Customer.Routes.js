const express = require('express');
const { roomRating, getCustomerById, poolRating, hallRating, deleteCustomer, getAllCustomers, restaurantRating, updateCustomerProfile, changePassword, banUser } = require('./Customer.Controller');
const { uploadprofilePicturesImage } = require('../../config/multerConfig');
const router = express.Router();

const multer = require("multer");
const { verifyTokenAdmin, verifyTokenUserVerified, verifyAnyoneHasAccount } = require('../../middleware/verifyToken');
const upload = multer();

router.post("/rating/room/:id", verifyTokenUserVerified, upload.none(), roomRating)
router.post("/rating/pool/:id", verifyTokenUserVerified, upload.none(), poolRating)
router.post("/rating/hall/:id", verifyTokenUserVerified, upload.none(), hallRating)
router.post("/rating/restaurant/:id", verifyTokenUserVerified, upload.none(), restaurantRating)

router.get("/:id", verifyAnyoneHasAccount, getCustomerById)
router.get("/", verifyTokenAdmin, getAllCustomers)

router.put('/update/:id', uploadprofilePicturesImage, updateCustomerProfile)
router.patch('/update/changePassword/:id', verifyAnyoneHasAccount, changePassword)
router.patch('/banUser/:id', verifyTokenAdmin, banUser)

router.delete('/:id', verifyTokenAdmin, deleteCustomer)

module.exports = router;

//get rating in other controllers