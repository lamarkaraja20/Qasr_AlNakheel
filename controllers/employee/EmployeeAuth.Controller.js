import { createRequire } from "module";
const require = createRequire(import.meta.url);

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { getMessage } = require('../language/messages');

const Employee = require("../../models/Employee.model");
const EmployeeMobile = require("../../models/EmployeeMobile.model");

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const logIn = async (req, res) => {
    const lang = getLanguage(req);
    const { email, password } = req.body;

    const user = await Employee.findOne({ where: { email }, include: { model: EmployeeMobile, attributes: ["mobile_no"] } });
    if (!user) return res.status(400).json({ message: getMessage("employeeNotFound", lang) });

    const mobileNos = user.EmployeeMobiles.map(mobile => mobile.mobile_no);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: getMessage("wrongPassword", lang) });
    console.log(process.env.JWT_ACCESS_SECRET)
    const accessToken = jwt.sign({
            id: user.id,
            role: user.role,
            is_verified: user.is_verified
        },process.env.JWT_ACCESS_SECRET,{
            expiresIn: '24h'
        });

    res.cookie("QasrAlNakheel", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
    });


    res.status(200).json({
        message: getMessage("employeeLogedIn", lang),
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            jop_description: user.jop_description,
            hire_date: user.hire_date,
            salary: user.salary,
            shift: user.shift,
            status: user.status,
            role: user.role,
            mobileNos: mobileNos,
            hall_id: user.hall_id,
            rest_id: user.rest_id,
            pool_id: user.pool_id,
        }
    });
}