import { createRequire } from "module";
const require = createRequire(import.meta.url);

require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto')
const nodemailer = require('nodemailer');

const { getMessage } = require('../language/messages');

const Customer = require('../../models/Customer.model')
const CustomerMobile = require('../../models/CustomerMobile.model')

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const signUp = async (req, res) => {
    const lang = getLanguage(req);
    const { first_name, last_name, country, city, postal_code, birthdate, email, password, mobileNo } = req.body;

    const existingUser = await Customer.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ message: getMessage("emailExists", lang) });
    }

    if (Array.isArray(mobileNo) && mobileNo.length > 0) {
        const existingMobiles = await CustomerMobile.findAll({
            where: { mobile_no: mobileNo },
            attributes: ["mobile_no"],
        });

        if (existingMobiles.length > 0) {
            return res.status(400).json({
                message: getMessage("mobileExists", lang),
                usedNumbers: existingMobiles.map(m => m.mobile_no)
            });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = await Customer.create({
        first_name,
        last_name,
        country,
        city,
        postal_code,
        birthdate,
        email,
        password: hashedPassword,
        profile_picture: req.file ? req.file.filename : null,
        auth_provider: "email"
    });

    if (Array.isArray(mobileNo) && mobileNo.length > 0) {
        const mobileRecords = mobileNo.map(number => ({
            cust_id: newCustomer.id,
            mobile_no: number
        }));

        await CustomerMobile.bulkCreate(mobileRecords);
    }

    res.status(200).json({ message: getMessage("createUserAccount", lang), user: newCustomer });
}

export const logIn = async (req, res) => {
    const lang = getLanguage(req);
    const { email, password } = req.body;

    const user = await Customer.findOne({ where: { email }, include: { model: CustomerMobile, attributes: ["mobile_no"] } });
    if (!user) return res.status(400).json({ message: getMessage("userNotFound", lang) });

    const mobileNos = user.CustomerMobiles.map(mobile => mobile.mobile_no);
    if (user.auth_provider !== "email" && !user.password) {
        return res.status(400).json({ message: getMessage("notSupported", lang) });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: getMessage("wrongPassword", lang) });

    const accessToken = jwt.sign({ id: user.id, role: 'user', is_verified: user.is_verified }, process.env.JWT_ACCESS_SECRET, { expiresIn: '7d' });

    res.cookie("QasrAlNakheel", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });


    res.status(200).json({
        message: getMessage("login", lang),
        user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            country: user.country,
            city: user.city,
            postal_code: user.postal_code,
            birthdate: user.birthdate,
            role: 'user',
            is_verified: user.is_verified,
            profile_picture: user.profile_picture,
            mobileNos: mobileNos
        }
    });
}

export const getUserData = async (req, res) => {
    const lang = getLanguage(req);
    if (!req.cookies || !req.cookies.QasrAlNakheel) {
        return res.status(401).json({ message: 'Token not found' });
    }

    const token = req.cookies.QasrAlNakheel;
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await Customer.findOne({ where: { id: decoded.id }, include: { model: CustomerMobile, attributes: ["mobile_no"] } });
    if (!user) {
        return res.status(404).json({ message: getMessage("userNotFound", lang) });
    }
    if (!user.role) {
        user.role = "user"
    }
    const mobileNos = user.CustomerMobiles.map(mobile => mobile.mobile_no);
    res.status(200).json({
        message: getMessage("getUser", lang),
        user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            country: user.country,
            city: user.city,
            postal_code: user.postal_code,
            birthdate: user.birthdate,
            role: 'user',
            is_verified: user.is_verified,
            profile_picture: user.profile_picture,
            mobileNos: mobileNos
        }
    });
};



const verificationCodes = {};

export const sendVerificationCode = async (req, res) => {

    const lang = getLanguage(req);
    const { email } = req.body;

    const user = await Customer.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: getMessage("userNotFound", lang) });

    if (user.is_verified) return res.status(400).json({ message: getMessage("alreadyVerified", lang) });

    const otp = crypto.randomInt(100000, 999999).toString();

    verificationCodes[email] = { code: otp, expiresAt: Date.now() + 10 * 60 * 1000 };

    setTimeout(() => {
        delete verificationCodes[email];
    }, 10 * 60 * 1000);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Account Verification Code',
        text: `Your verification code is: ${otp}`
    };

    transporter.sendMail(mailOptions, (error) => {
        if (error) return res.status(500).json({ message: getMessage("errorSendEmail", lang) });
        res.status(200).json({ message: getMessage("sendVerificationCode", lang) });
    });
};


export const verifyAccount = async (req, res) => {
    const lang = getLanguage(req);
    const { email, verification_code } = req.body;

    const user = await Customer.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: getMessage("userNotFound", lang) });

    if (user.is_verified) return res.status(400).json({ message: getMessage("alreadyVerified", lang) });

    if (!verificationCodes[email] || verificationCodes[email].code !== verification_code) {
        return res.status(400).json({ message: getMessage("verificationError", lang) });
    }
    if (Date.now() > verificationCodes[email].expiresAt) {
        delete verificationCodes[email];
        return res.status(400).json({ message: getMessage("expiredVerificationError", lang) });
    }

    user.is_verified = true;
    await user.save();

    delete verificationCodes[email];

    res.status(200).json({ message: getMessage("verifiedSuccessfully", lang) });
};


export const logOut = (req, res) => {
    const lang = getLanguage(req);
    res.clearCookie("QasrAlNakheel", {
        httpOnly: true,
        secure: "production",
        sameSite: "None",
    });
    req.logout(() => {
        req.session.destroy(() => {
            res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
        });
    });
    return res.status(200).json({ message: getMessage("loggedOut", lang) });
};
