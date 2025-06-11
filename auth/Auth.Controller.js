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
const Employee = require('../../models/Employee.model')
const EmployeeMobile = require('../../models/EmployeeMobile.model')
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const signUp = async (req, res) => {
    const lang = getLanguage(req);
    const {
        first_name, second_name, third_name, last_name,
        gender, profession, free_text,
        country, city, postal_code, birthdate,
        email, password
    } = req.body;
    
    const existingUser = await Customer.findOne({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ message: getMessage("emailExists", lang) });
    }
    let mobileNo = req.body.mobileNo;
    if (typeof mobileNo === "string") {
        try {
            mobileNo = JSON.parse(mobileNo);
        } catch (err) {
            mobileNo = [];
        }
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
    const imageUrl = req.file?.path || null;

    const newCustomer = await Customer.create({
        first_name,
        second_name,
        third_name,
        last_name,
        gender,
        profession,
        free_text,
        country,
        city,
        postal_code,
        birthdate,
        email,
        password: hashedPassword,
        profile_picture: imageUrl,
        auth_provider: "email"
    });

    if (Array.isArray(mobileNo) && mobileNo.length > 0) {
        const mobileRecords = mobileNo.map(number => ({
            cust_id: newCustomer.id,
            mobile_no: number
        }));

        await CustomerMobile.bulkCreate(mobileRecords);
    }

    res.status(200).json({ message: getMessage("createUserAccount", lang) });
}

export const logIn = async (req, res) => {
    const lang = getLanguage(req);
    const { email, password } = req.body;

    const user = await Customer.findOne({ where: { email }, include: { model: CustomerMobile, attributes: ["mobile_no"] } });
    if (!user) return res.status(400).json({ message: getMessage("userNotFound", lang) });
    if (user.is_deleted) {
        return res.status(400).json({ message: getMessage("userDeleted", lang) });
    }
    if (user.banned) {
        return res.status(400).json({ message: getMessage("bannedUser", lang) });
    }
    const mobileNos = user.CustomerMobiles.map(mobile => mobile.mobile_no);
    if (user.auth_provider !== "email" && !user.password) {
        return res.status(400).json({ message: getMessage("notSupported", lang) });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: getMessage("wrongPassword", lang) });

    const accessToken = jwt.sign({ id: user.id, role: 'user', banned: user.banned, is_verified: user.is_verified }, process.env.JWT_ACCESS_SECRET, { expiresIn: '7d' });

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
            second_name: user.second_name,
            third_name: user.third_name,
            last_name: user.last_name,
            gender: user.gender,
            profession: user.profession,
            free_text: user.free_text,
            email: user.email,
            country: user.country,
            city: user.city,
            postal_code: user.postal_code,
            birthdate: user.birthdate,
            role: 'user',
            banned: user.banned,
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

    if (decoded.role === "user") {
        const user = await Customer.findOne({
            where: { id: decoded.id },
            include: { model: CustomerMobile, attributes: ["mobile_no"] }
        });

        if (user) {
            const mobileNos = user.CustomerMobiles.map(mobile => mobile.mobile_no);
            return res.status(200).json({
                message: getMessage("getUser", lang),
                user: {
                    id: user.id,
                    first_name: user.first_name,
                    second_name: user.second_name,
                    third_name: user.third_name,
                    last_name: user.last_name,
                    gender: user.gender,
                    profession: user.profession,
                    free_text: user.free_text,
                    email: user.email,
                    country: user.country,
                    city: user.city,
                    postal_code: user.postal_code,
                    birthdate: user.birthdate,
                    role: user.role || 'user',
                    banned: user.banned,
                    is_verified: user.is_verified,
                    profile_picture: user.profile_picture,
                    mobileNos: mobileNos
                }
            });
        }
    } else {
        const employee = await Employee.findOne({
            where: { id: decoded.id },
            include: {
                model: EmployeeMobile,
                attributes: ["mobile_no"]
            }
        });

        if (employee) {
            return res.status(200).json({
                message: getMessage("getUser", lang),
                user: {
                    id: employee.id,
                    first_name: employee.first_name,
                    last_name: employee.last_name,
                    email: employee.email,
                    address: employee.address,
                    jop_description: employee.jop_description,
                    hire_date: employee.hire_date,
                    salary: employee.salary,
                    shift: employee.shift,
                    status: employee.status,
                    role: employee.role,
                    hall_id: employee.hall_id,
                    rest_id: employee.rest_id,
                    pool_id: employee.pool_id,
                }
            });
        }
    }
    return res.status(404).json({ message: getMessage("userNotFound", lang) });
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
    res.cookie("QasrAlNakheel", null, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 1,
    });
    req.logout(() => {
        req.session.destroy(() => {
            return res.status(200).json({ message: getMessage("loggedOut", lang) });
        });
    });
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await Customer.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const resetToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_RESET_SECRET,
            { expiresIn: '1h' }
        );

        const resetLink = `https://qaser-al-nakheel2025.onrender.com/logIn/reset-password?token=${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset',
            html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password.</p>`
        };

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error sending email'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Password reset email sent',
            });
        });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
        const user = await Customer.findByPk(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
