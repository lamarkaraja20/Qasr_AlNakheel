const express = require('express');

const router=express.Router();

const multer = require("multer");
const { sendMessage, getAllContacts, getCustomerMessages, deleteCustomerMessage, markAsRead, sendEmailToCustomer } = require('./Contact.Controller');
const { verifyAnyoneHasAccount, verifyTokenAdmin, verifyTokenAdminOrReceptionist } = require('../../middleware/verifyToken');
const upload = multer();


router.post('/', upload.none(), verifyAnyoneHasAccount, sendMessage);
router.post('/sendEmailToCustomer/:id', verifyTokenAdminOrReceptionist, upload.none(), sendEmailToCustomer);

router.get('/', verifyTokenAdmin, getAllContacts);
router.get('/customerContacts/:id', verifyAnyoneHasAccount, getCustomerMessages);

router.patch('/makeMessageRead/:id',verifyTokenAdminOrReceptionist,markAsRead)

router.delete('/:id', verifyAnyoneHasAccount, deleteCustomerMessage);

module.exports=router;

