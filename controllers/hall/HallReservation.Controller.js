import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);

const Sequelize = require("../../config/dbConnection");

const Hall = require("../../models/Hall.model");
const HallReservation = require("../../models/HallReservation.model");
const Customer = require("../../models/Customer.model");

const { getMessage } = require("../language/messages");
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const createHallReservation = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    const { hall_id, start_time, end_time } = req.body;

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (isNaN(startDate) || startDate <= new Date()) {
        return res.status(400).json({ message: getMessage("invalidStartTime", lang) });
    }
    if (isNaN(endDate) || endDate <= startDate) {
        return res.status(400).json({ message: getMessage("invalidEndTime", lang) });
    }

    const hall = await Hall.findByPk(hall_id);
    if (!hall) {
        return res.status(404).json({ message: getMessage("hallNotFound", lang) });
    }

    const overlappingReservations = await HallReservation.findOne({
        where: {
            hall_id,
            status: { [Op.not]: "cancelled" },
            [Op.or]: [
                { start_time: { [Op.lt]: endDate }, end_time: { [Op.gt]: startDate } },
            ],
        },
    });

    if (overlappingReservations) {
        return res.status(400).json({ message: getMessage("hallNotAvailable", lang) });
    }

    const hoursDiff = Math.abs(endDate - startDate) / 36e5;
    const totalPrice = hoursDiff * hall.price_per_hour;

    const hallReservation = await HallReservation.create({
        cust_id,
        hall_id,
        start_time,
        end_time,
        total_price: totalPrice,
    });

    res.status(201).json({ message: getMessage("hallReservationCreated", lang), hallReservation });

};

export const getAllReservations = async (req, res) => {
    const lang = getLanguage(req);
    const reservations = await HallReservation.findAll({
        include: [{
            model: Hall,
            attributes: ["name", "capacity", "price_per_hour"]
        }, {
            model: Customer,
            attributes: ["id", "first_name", "last_name"]
        }],
        order: [["start_time", "ASC"]],
    });
    res.status(200).json({ reservations });
}

export const getCustomerReservations = async (req, res) => {
    const cust_id = req.params.id;

    const reservations = await HallReservation.findAll({
        where: { cust_id },
        include: [{ model: Hall, attributes: ["name", "capacity", "price_per_hour"] },
        {
            model: Customer,
            attributes: ["id", "first_name", "last_name"]
        }],
        order: [["start_time", "ASC"]],
    });

    res.status(200).json({ reservations });
};

export const cancelReservation = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const reservation = await HallReservation.findByPk(id);
    if (!reservation) {
        return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    }

    reservation.status = "cancelled";
    await reservation.save();

    res.status(200).json({ message: getMessage("reservationCancelled", lang) });
};

export const acceptReservation = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const reservation = await HallReservation.findByPk(id);
    if (!reservation) {
        return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    }

    reservation.status = "confirmed";
    await reservation.save();

    res.status(200).json({ message: getMessage("reservationAccepted", lang) });
};

export const getReservationsByHall = async (req, res) => {
    const lang = getLanguage(req);
    const hall_id = req.params.id;

    const reservations = await HallReservation.findAll({
        where: { hall_id },
        include: [{ model: Customer, attributes: ["id", "first_name", "last_name"] }],
        order: [["start_time", "ASC"]],
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

    const reservations = await HallReservation.findAll({
        where: {
            start_time: {
                [Op.between]: [startOfDay, endOfDay],
            },
        },
    });

    res.status(200).json({ reservations });
};

export const deleteReservation = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const reservation = await HallReservation.findByPk(id);
    if (!reservation) {
        return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    }

    await reservation.destroy();
    res.status(200).json({ message: getMessage("reservationDeleted", lang) });
};



export const getFutureReservations = async (req, res) => {
    const lang = getLanguage(req);

    const reservations = await HallReservation.findAll({
        where: {
            start_time: { [Op.gt]: new Date() },
        },
    });

    res.status(200).json({ reservations });
};
