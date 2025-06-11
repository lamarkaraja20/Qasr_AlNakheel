const express = require('express');
const { signUp, logIn, getUserData, logOut, sendVerificationCode, verifyAccount, forgotPassword, resetPassword } = require('./Auth.Controller.js');
const router = express.Router();

const multer = require("multer");
const upload = multer();


const { uploadprofilePicturesImage } = require('../../config/multerConfig.js');

router.post('/', uploadprofilePicturesImage, signUp);
router.post('/login', upload.none(), logIn);
router.post('/logout', logOut);
router.post('/sendVerificationCode', upload.none(), sendVerificationCode);
router.post('/verifyAccount', upload.none(), verifyAccount);
router.post('/forgotPassword', forgotPassword)
router.post('/resetPassword', resetPassword)
router.get('/', getUserData);

module.exports = router;


