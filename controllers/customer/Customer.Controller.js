import { createRequire } from "module";
const require = createRequire(import.meta.url);

const bcrypt = require('bcryptjs');
const fs = require("fs");
import { fileURLToPath } from "url";

const path = require("path");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const Customer = require("../../models/Customer.model");
const Booking = require("../../models/Booking.model");
const CustomerMobile = require("../../models/CustomerMobile.model");
const Contact = require("../../models/Contact.model");
const Rating = require("../../models/Rating.model");
const CustomerPool = require("../../models/CustomerPool.model");
const HallReservation = require("../../models/HallReservation.model");

const { getMessage } = require("../language/messages");

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const getCustomerById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const customer = await Customer.findOne({
        where: { id },
        include: [
            { model: Booking },
            { model: CustomerMobile },
            { model: Contact },
            { model: Rating },
            { model: CustomerPool },
            { model: HallReservation },
        ]

    });
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }
    res.status(200).json(customer);
}

export const getAllCustomers = async (req, res) => {
    const lang = getLanguage(req);
    const customers = await Customer.findAll({
        include: [
            { model: CustomerMobile },
        ]
    });
    if (!customers) {
        return res.status(404).json({ message: getMessage("customersNotFound", lang) });
    }
    res.status(200).json(customers);
}

export const updateCustomerProfile = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const { first_name, last_name, country, city, postal_code, birthdate } = req.body;
    const profile_picture = req.file ? req.file.filename : null;

    const customer = await Customer.findByPk(id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("userNotFound", lang) });
    }

    const imagePath = path.join(__dirname, "../../uploads/profilePictures", customer.profile_picture);
    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }

    await customer.update({
        first_name: first_name || customer.first_name,
        last_name: last_name || customer.last_name,
        country: country || customer.country,
        city: city || customer.city,
        postal_code: postal_code || customer.postal_code,
        birthdate: birthdate || customer.birthdate,
        profile_picture: profile_picture || customer.profile_picture,
    });

    res.status(200).json({ message: getMessage("profileUpdated", lang), user: customer });
};

export const changePassword = async (req, res) => {
    const lang = getLanguage(req);
    const customer_id = req.params.id;
    const { currentPassword, newPassword } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("userNotFound", lang) });
    }
    if (customer.auth_provider !== "email") {
        return res.status(404).json({ message: getMessage("noPasswordSet", lang) });
    }

    const isMatch = await bcrypt.compare(currentPassword, customer.password);
    if (!isMatch) {
        return res.status(401).json({ message: getMessage("incorrectPassword", lang) });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await customer.update({ password: hashedPassword });
    res.status(200).json({ message: getMessage("passwordChanged", lang) })
}


export const roomRating = async (req, res) => {
    const lang = getLanguage(req);
    const customer_id = req.params.id;
    const { room_id, rating, comment } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }

    let existingRating = await Rating.findOne({ where: { customer_id, room_id } });

    if (existingRating) {
        await Rating.update(
            { rating, comment },
            { where: { customer_id, room_id } }
        );
        return res.status(200).json({ message: getMessage("ratingUpdated", lang) });
    }

    await Rating.create({ customer_id, room_id, rating, comment });
    return res.status(201).json({ message: getMessage("ratingDone", lang) });
}

export const poolRating = async (req, res) => {
    const lang = getLanguage(req);
    const customer_id = req.params.id;
    const { pool_id, rating, comment } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }

    let existingRating = await Rating.findOne({ where: { customer_id, pool_id } });

    if (existingRating) {
        await Rating.update(
            { rating, comment },
            { where: { customer_id, pool_id } }
        );
        return res.status(200).json({ message: getMessage("ratingUpdated", lang) });
    }

    await Rating.create({ customer_id, pool_id, rating, comment });
    return res.status(201).json({ message: getMessage("ratingDone", lang) });
}

export const hallRating = async (req, res) => {
    const lang = getLanguage(req);
    const customer_id = req.params.id;
    const { hall_id, rating, comment } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }

    let existingRating = await Rating.findOne({ where: { customer_id, hall_id } });

    if (existingRating) {
        await Rating.update(
            { rating, comment },
            { where: { customer_id, hall_id } }
        );
        return res.status(200).json({ message: getMessage("ratingUpdated", lang) });
    }

    await Rating.create({ customer_id, hall_id, rating, comment });
    return res.status(201).json({ message: getMessage("ratingDone", lang) });
}

export const restaurantRating = async (req, res) => {
    const lang = getLanguage(req);
    const customer_id = req.params.id;
    const { rest_id, rating, comment } = req.body;

    const customer = await Customer.findByPk(customer_id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }

    let existingRating = await Rating.findOne({ where: { customer_id, rest_id } });

    if (existingRating) {
        await Rating.update(
            { rating, comment },
            { where: { customer_id, rest_id } }
        );
        return res.status(200).json({ message: getMessage("ratingUpdated", lang) });
    }

    await Rating.create({ customer_id, rest_id, rating, comment });
    return res.status(201).json({ message: getMessage("ratingDone", lang) });
}

export const deleteCustomer = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }

    await Customer.destroy({ where: { id } });
    res.status(204).json({ message: getMessage("customerDeleted", lang) });
}