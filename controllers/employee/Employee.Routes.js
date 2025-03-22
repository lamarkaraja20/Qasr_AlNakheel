const express = require('express');

const router = express.Router();

const multer = require("multer");
const { addEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, changeEmployeeShift, changeEmployeeJop, changeEmployeeStatus, changePassword, getEmployeeFilter, get } = require('./Employee.Controller');
const { logIn } = require('./EmployeeAuth.Controller');
const { verifyTokenAdmin } = require('../../middleware/verifyToken');
const upload = multer();


router.post('/', upload.none(), addEmployee);
router.post('/login', logIn)

router.get('/', getAllEmployees);
router.get('/getById/:id', getEmployeeById);
router.get('/filters/:page/:limit', getEmployeeFilter)

router.put('/:id', updateEmployee);
router.patch('/shift/:id', changeEmployeeShift);
router.patch('status/:id', changeEmployeeStatus);
router.patch('/jop/:id', changeEmployeeJop);
router.patch('/changePassword/:id', changePassword);

router.delete('/:id', deleteEmployee);

module.exports = router;


