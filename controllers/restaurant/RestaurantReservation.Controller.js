import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);


const CustomerRestaurant = require("../../models/CustomerRestaurant.model");
const Restaurant = require("../../models/Restaurant.model");
const Customer = require("../../models/Customer.model");
const RestaurantImages = require("../../models/RestaurantImages.model");
const { getMessage } = require("../language/messages");

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
    minTime.setMinutes(minTime.getMinutes() - 15);
    const maxTime = new Date(reservationDate);
    maxTime.setMinutes(maxTime.getMinutes() + 15);

    const existingReservations = await CustomerRestaurant.findAll({
        where: {
            rest_id,
            status: { [Op.in]: ["Pending", "Confirmed"] },
            reservation_date: { [Op.between]: [minTime, maxTime] }
        }
    });
    /*
        const existingReservations = await CustomerRestaurant.findAll({
            where: {
                rest_id,
                status: { [Op.in]: ["Pending", "Confirmed"] },
                reservation_date: reservationDate
            }
        });
    */
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
        status: "Pending"
    });

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
    const reservations = await CustomerRestaurant.findAll({ where: { cust_id } });
    res.status(200).json(reservations);
};

export const getReservationsByRestaurant = async (req, res) => {
    const lang = getLanguage(req);
    const rest_id = req.params.id;

    const reservations = await CustomerRestaurant.findAll({
        where: { rest_id },
        include: [{ model: Customer, attributes: ["id", "first_name", "last_name"] }],
        order: [["reservation_date", "ASC"]],
    });

    res.status(200).json({ reservations });
};


export const getReservationsByTime = async (req, res) => {
    const { date, after, before } = req.query;
    let whereClause = {};

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

    res.status(200).json({ message: getMessage("reservationAccepted", lang),reservation });
};

export const deleteReservation = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const reservation = await CustomerRestaurant.findByPk(id);
    if (!reservation) {
        return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    }

    await reservation.destroy();
    res.status(200).json({ message: getMessage("reservationDeleted", lang) });
};

export const getFutureReservations = async (req, res) => {
    const reservations = await CustomerRestaurant.findAll({
        where: {
            reservation_date: { [Op.gt]: new Date() },
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
            reservation_date: {
                [Op.between]: [startOfDay, endOfDay],
            },
        },
    });

    res.status(200).json({ reservations });
};