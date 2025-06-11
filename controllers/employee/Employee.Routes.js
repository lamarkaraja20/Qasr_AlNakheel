const express = require('express');

const router = express.Router();

const multer = require("multer");
const { addEmployee, getAllEmployees, getEmployeeById, updateEmployee, deleteEmployee, changeEmployeeShift, changeEmployeeJop, changeEmployeeStatus, changePassword, getEmployeeFilter, get } = require('./Employee.Controller');
const { logIn } = require('./EmployeeAuth.Controller');
const { verifyTokenAdmin } = require('../../middleware/verifyToken');
const upload = multer();


router.post('/', upload.none(), verifyTokenAdmin, addEmployee);
router.post('/login', logIn)

router.get('/', verifyTokenAdmin, getAllEmployees);
router.get('/getById/:id', verifyTokenAdmin, getEmployeeById);
router.get('/filters/:page/:limit', verifyTokenAdmin, getEmployeeFilter)

router.put('/:id', verifyTokenAdmin, updateEmployee);
router.patch('/shift/:id', verifyTokenAdmin, changeEmployeeShift);
router.patch('/status/:id', verifyTokenAdmin, changeEmployeeStatus);
router.patch('/jop/:id', verifyTokenAdmin, changeEmployeeJop);
router.patch('/changePassword/:id', verifyTokenAdmin, changePassword);

router.delete('/:id', verifyTokenAdmin, deleteEmployee);

module.exports = router;


