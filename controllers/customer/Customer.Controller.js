import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);

const bcrypt = require('bcryptjs');
import { deleteImageFromCloudinary } from "../../config/helpers/cloudinary.mjs";


const Customer = require("../../models/Customer.model");
const Booking = require("../../models/Booking.model");
const CustomerMobile = require("../../models/CustomerMobile.model");
const Contact = require("../../models/Contact.model");
const Rating = require("../../models/Rating.model");
const CustomerPool = require("../../models/CustomerPool.model");
const HallReservation = require("../../models/HallReservation.model");
const CustomerRestaurant = require("../../models/CustomerRestaurant.model");

const { getMessage } = require("../language/messages");

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const getCustomerById = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const customer = await Customer.findOne({
        where: { id: id, is_deleted: false },
        attributes: [
            "id",
            "first_name",
            "second_name",
            "third_name",
            "last_name",
            "gender",
            "profession",
            "free_text",
            "email",
            "country",
            "city",
            "postal_code",
            "birthdate",
            "profile_picture",
            "banned"
        ],
        include: [
            { model: Booking },
            { model: CustomerMobile },
            { model: Contact },
            { model: Rating },
            { model: CustomerPool },
            { model: HallReservation },
            { model: CustomerRestaurant }
        ]

    });
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }
    res.status(200).json(customer);
}

export const getAllCustomers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const {
        search = '',
        is_verified,
        country,
        city
    } = req.query;

    const whereClause = {};

    // Search by name or email
    if (search) {
        whereClause[Op.or] = [
            { first_name: { [Op.iLike]: `%${search}%` } },
            { last_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
        ];
    }

    // Filters
    if (is_verified) {
        whereClause.is_verified = is_verified === 'true';
    }

    if (country) {
        whereClause.country = { [Op.iLike]: `%${country}%` };
    }

    if (city) {
        whereClause.city = { [Op.iLike]: `%${city}%` };
    }
    const { rows, count } = await Customer.findAndCountAll({
        where: whereClause,
        include: [
            { model: CustomerMobile }
        ],
        limit,
        offset,
        order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
        data: rows,
        total: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
    });
}

export const updateCustomerProfile = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const {
        first_name,
        second_name,
        third_name,
        last_name,
        country,
        city,
        postal_code,
        birthdate,
        gender,
        profession,
        free_text
    } = req.body;

    const newProfilePicture = req.file ? req.file.path : null;

    const customer = await Customer.findByPk(id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("userNotFound", lang) });
    }

    if (newProfilePicture) {
        if (customer.profile_picture) {
            await deleteImageFromCloudinary(customer.profile_picture);
        }
        customer.profile_picture = newProfilePicture;
    }

    await customer.update({
        first_name: first_name || customer.first_name,
        second_name: second_name || customer.second_name,
        third_name: third_name || customer.third_name,
        last_name: last_name || customer.last_name,
        country: country || customer.country,
        city: city || customer.city,
        postal_code: postal_code || customer.postal_code,
        birthdate: birthdate || customer.birthdate,
        gender: gender || customer.gender,
        profession: profession || customer.profession,
        free_text: free_text || customer.free_text,
        profile_picture: customer.profile_picture,
    });

    res.status(200).json({ message: getMessage("profileUpdated", lang), user: customer });
};

export const banUser = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;
    const customer = await Customer.findByPk(id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("userNotFound", lang) });
    }
    const newStatus = !customer.banned;
    await customer.update({ banned: newStatus });

    const actionMessage = newStatus
        ? getMessage("userBanned", lang)
        : getMessage("userUnbanned", lang);

    res.status(200).json({
        message: actionMessage,
        user: {
            id: customer.id,
            banned: newStatus,
        }
    });
}

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

    if (customer.profile_picture) {
        await deleteImageFromCloudinary(customer.profile_picture);
    }

    customer.is_deleted = true;
    await customer.save();
    res.status(204).json({ message: getMessage("customerDeleted", lang) });
}
