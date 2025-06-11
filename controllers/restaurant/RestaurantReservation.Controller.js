import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);


const CustomerRestaurant = require("../../models/CustomerRestaurant.model");
const Restaurant = require("../../models/Restaurant.model");
const Customer = require("../../models/Customer.model");
const RestaurantImages = require("../../models/RestaurantImages.model");
const { getMessage } = require("../language/messages");
const { sendRestaurantReservationEmail } = require("../../utils/sendRestaurantReservationEmail");

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const createRestaurantReservation = async (req, res) => {
    const lang = getLanguage(req);
    const customer_id = req.params.id;
    const { rest_id, reservation_date, number_of_guests, is_walk_in } = req.body;

    const reservationTime = new Date();
    const reservationDate = new Date(reservation_date);
    if (isNaN(reservationDate) || reservationDate <= reservationTime) {
        return res.status(400).json({ message: getMessage("invalidreservationDate", lang) });
    }

    const restaurant = await Restaurant.findByPk(rest_id);
    if (!restaurant) return res.status(404).json({ message: getMessage("restaurantsNotFound", lang) });

    const minTime = new Date(reservationDate);
    minTime.setHours(minTime.getHours() - 1);

    const maxTime = new Date(reservationDate);
    maxTime.setHours(maxTime.getHours() + 1);

    const existingReservations = await CustomerRestaurant.findAll({
        where: {
            rest_id,
            status: { [Op.in]: ["Pending", "Confirmed"] },
            reservation_date: { [Op.between]: [minTime, maxTime] }
        }
    });

    const totalGuests = existingReservations.reduce((sum, res) => sum + res.number_of_guests, 0);
    if (totalGuests + number_of_guests > restaurant.capacity) {
        return res.status(400).json({ message: getMessage("restaurantFull", lang) });
    }

    const reservation = await CustomerRestaurant.create({
        cust_id: customer_id,
        rest_id,
        reservation_date: reservationDate,
        number_of_guests,
        is_walk_in,
        status: "Confirmed"
    });

    const customer = await Customer.findByPk(customer_id);
    if (customer) {
        await sendRestaurantReservationEmail(customer, { ...reservation.dataValues, restaurant }, lang);
    }

    res.status(201).json({ message: getMessage("addedReservation", lang), reservation });
};

export const cancelRestaurantReservation = async (req, res) => {
    const lang = getLanguage(req);
    const reservation = await CustomerRestaurant.findByPk(req.params.id);

    if (!reservation) return res.status(404).json({ message: getMessage("reservationNotFound", lang) });

    const now = new Date();
    const reservationDate = new Date(reservation.reservation_date);
    if ((reservationDate - now) / (1000 * 60 * 60) < 2) {
        return res.status(400).json({ message: getMessage("cannotCancelLate", lang) });
    }

    await reservation.update({ status: "Cancelled" });
    res.status(200).json({ message: getMessage("canceledReservation", lang) });
};

export const getReservationsByCustomerId = async (req, res) => {
    const cust_id = req.params.id;
    const reservations = await CustomerRestaurant.findAll({ where: { cust_id, is_deleted: false } });
    res.status(200).json(reservations);
};

export const getRestaurantReservationsByCustomer = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    const { status, date, payed } = req.query;

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const whereCondition = {
        cust_id,
        is_deleted: false,
    };

    if (status) {
        whereCondition.status = status;
    }
    if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        whereCondition.reservation_date = {
            [Op.between]: [startDate, endDate]
        };
    }
    if (payed === "true") {
        whereCondition.payed = true;
    } else if (payed === "false") {
        whereCondition.payed = false;
    }

    const count = await CustomerRestaurant.count({ where: whereCondition });

    const reservations = await CustomerRestaurant.findAll({
        where: whereCondition,
        limit,
        offset,
        order: [["reservation_date", "DESC"]],
        include: [
            {
                model: Restaurant,
                attributes: ["id", "name", "Opening_hours"],
            },
        ],
    });

    if (!reservations.length) {
        return res.status(404).json({ message: getMessage("noReservationsFound", lang) });
    }

    res.status(200).json({ count, reservations });
};

export const getReservationsByRestaurant = async (req, res) => {
    const lang = getLanguage(req);
    const rest_id = req.params.id;

    const reservations = await CustomerRestaurant.findAll({
        where: { rest_id, is_deleted: false },
        include: [{ model: Customer, attributes: ["id", "first_name", "last_name"] }],
        order: [["reservation_date", "ASC"]],
    });

    res.status(200).json({ reservations });
};


export const getReservationsByTime = async (req, res) => {
    const { date, after, before } = req.query;
    let whereClause = {};
    whereClause.is_deleted = false;

    if (date) {
        whereClause.reservation_date = {
            [Op.between]: [new Date(date + "T00:00:00.000Z"), new Date(date + "T23:59:59.000Z")]
        };
    }
    if (after) {
        whereClause.reservation_date = { ...whereClause.reservation_date, [Op.gte]: new Date(after) };
    }
    if (before) {
        whereClause.reservation_date = { ...whereClause.reservation_date, [Op.lte]: new Date(before) };
    }
    const reservations = await CustomerRestaurant.findAll({ where: whereClause });
    res.status(200).json(reservations);
};

export const acceptRestaurantReservation = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const reservation = await CustomerRestaurant.findByPk(id);
    if (!reservation) {
        return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    }

    await reservation.update({ status: "Confirmed" });

    res.status(200).json({ message: getMessage("reservationAccepted", lang), reservation });
};

export const deleteReservation = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const reservation = await CustomerRestaurant.findByPk(id);
    if (!reservation) {
        return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    }

    reservation.is_deleted = true;
    await reservation.save();
    res.status(200).json({ message: getMessage("reservationDeleted", lang) });
};

export const getFutureReservations = async (req, res) => {
    const reservations = await CustomerRestaurant.findAll({
        where: {
            reservation_date: { [Op.gt]: new Date() },
            is_deleted: false,
        },
    });

    res.status(200).json({ reservations });
};

export const getReservationsByDate = async (req, res) => {
    const lang = getLanguage(req);
    const { date } = req.params;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await CustomerRestaurant.findAll({
        where: {
            is_deleted: false,
            reservation_date: {
                [Op.between]: [startOfDay, endOfDay],
            },
        },
    });

    res.status(200).json({ reservations });
};

export const getAllRestaurantReservations = async (req, res) => {
    const lang = getLanguage(req);
    const {
        rest_id,
        status,
        payed,
        reservation_date,
        start_time,
        end_time,
        limit = 10,
        page = 1,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereCondition = {};
    whereCondition.is_deleted = false;

    if (rest_id) {
        whereCondition.rest_id = rest_id;
    }

    if (status) {
        whereCondition.status = status;
    }

    if (payed !== undefined) {
        whereCondition.payed = payed === "true";
    }

    // الفلترة بالتاريخ الكامل أو حسب يوم واحد
    if (start_time && end_time) {
        whereCondition.reservation_date = {
            [Op.between]: [new Date(start_time), new Date(end_time)],
        };
    } else if (reservation_date) {
        const date = new Date(reservation_date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        whereCondition.reservation_date = {
            [Op.between]: [startOfDay, endOfDay],
        };
    }

    const reservations = await CustomerRestaurant.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset,
        order: [["reservation_date", "ASC"]],
        include: [
            {
                model: Restaurant,
                attributes: ["id", "name"]
            },
            {
                model: Customer,
                attributes: ["id", "first_name", "last_name"]
            }
        ]
    });

    if (!reservations.rows.length) {
        return res.status(404).json({ message: getMessage("noReservationsFound", lang) });
    }

    return res.status(200).json({
        total: reservations.count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: reservations.rows
    });
};