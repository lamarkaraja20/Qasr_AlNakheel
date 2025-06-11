const express = require('express');
const { getDashboardDetails, getAboutStatistics, getSomeDataForUser, getAllworkPlaces } = require('./General.Controller');
const { verifyTokenAdminOrReceptionist } = require('../../middleware/verifyToken');

const router = express.Router();


router.get('/', verifyTokenAdminOrReceptionist, getDashboardDetails);
router.get('/about/statistics', getAboutStatistics)
router.get('/get/SomeDataForUser/:id', getSomeDataForUser)
router.get('/getAllworkPlaces', getAllworkPlaces)
module.exports = router;