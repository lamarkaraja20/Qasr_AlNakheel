const express = require('express');
const { getDashboardDetails } = require('./General.Controller');

const router = express.Router();


router.get('/', getDashboardDetails);

module.exports = router;