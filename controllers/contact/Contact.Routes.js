const express = require('express');

const router=express.Router();

const multer = require("multer");
const { sendMessage, getAllContacts, getCustomerMessages, deleteCustomerMessage, markAsRead } = require('./Contact.Controller');
const upload = multer();


router.post('/', upload.none(), sendMessage);

router.get('/', getAllContacts);
router.get('/customerContacts/:id', getCustomerMessages);

router.patch('/makeMessageRead/:id',markAsRead)

router.delete('/:id', deleteCustomerMessage);

module.exports=router;

