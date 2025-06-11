const express = require('express');
const router = express.Router();

const multer = require("multer");
const upload = multer();

const { addService, getAllServices, updateService, deleteService, getServiceById } = require('./Services.Controller.js');

const { uploadServiceImage } = require('../../config/multerConfig.js');
const { verifyTokenAdmin } = require('../../middleware/verifyToken.js');


router.post('/', verifyTokenAdmin, uploadServiceImage, addService);

router.get('/', getAllServices)
router.get('/:id', getServiceById)

router.put('/:id', verifyTokenAdmin, uploadServiceImage, updateService);

router.delete('/:id', verifyTokenAdmin, deleteService)

module.exports = router;


