import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);

const Hall = require("../../models/Hall.model");
const HallReservation = require("../../models/HallReservation.model");
const Customer = require("../../models/Customer.model");

const { sendHallReservationEmail } = require("../../utils/sendHallReservations");
const { getMessage } = require("../language/messages");
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const createHallReservation = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    const { hall_id, start_time, end_time, details } = req.body;

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);


    const now = new Date();
    const nowUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        0
    ));

    if (isNaN(startDate) || startDate <= nowUTC) {
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
            is_deleted: false,
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
        details,
        total_price: totalPrice,
    });
    const customer = await Customer.findByPk(cust_id);
    if (customer) {
        await sendHallReservationEmail(customer, { hall, ...hallReservation.dataValues }, lang);
    }

    res.status(201).json({ message: getMessage("hallReservationCreated", lang), hallReservation });

};

export const getAllReservations = async (req, res) => {
    const lang = getLanguage(req);
    const {
        hall_id,
        status,
        payed,
        start_time,
        end_time,
        limit = 10,
        page = 1,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereCondition = {};
    whereCondition.is_deleted = false;

    if (hall_id) {
        whereCondition.hall_id = hall_id;
    }

    if (status) {
        whereCondition.status = status;
    }

    if (payed !== undefined) {
        whereCondition.payed = payed === "true";
    }

    if (start_time && end_time) {
        whereCondition.start_time = {
            [Op.between]: [new Date(start_time), new Date(end_time)],
        };
    } else if (start_time) {
        // جلب الحجوزات التي تبدأ في نفس اليوم فقط
        const date = new Date(start_time);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        whereCondition.start_time = {
            [Op.between]: [startOfDay, endOfDay],
        };
    }

    const reservations = await HallReservation.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset,
        order: [["start_time", "ASC"]],
        include: [
            {
                model: Hall,
                attributes: ["id", "name", "price_per_hour"]
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
}

export const getCustomerReservations = async (req, res) => {
    const cust_id = req.params.id;
    const { date, status, payed } = req.query;
    const whereClause = {
        cust_id,
        is_deleted: false,
    };
    if (status) {
        whereClause.status = status;
    }
    if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        whereClause.start_time = {
            [Op.between]: [startDate, endDate]
        };
    }

    if (payed === "true") {
        whereClause.payed = true;
    } else if (payed === "false") {
        whereClause.payed = false;
    }

    const reservations = await HallReservation.findAll({
        where: whereClause,
        include: [
            {
                model: Hall,
                attributes: ["name", "capacity", "price_per_hour"]
            },
            {
                model: Customer,
                attributes: ["id", "first_name", "last_name"]
            }
        ],
        order: [["start_time", "ASC"]],
    });
    if (!reservations.length) {
        return res.status(404).json({ message: getMessage("noReservationsFound", lang) });
    }

    res.status(200).json({ reservations });
};

export const getCustomerHallReservations = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;

    const { date, status, payed } = req.query;

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

        whereCondition.start_time = {
            [Op.between]: [startDate, endDate]
        };
    }

    if (payed === "true") {
        whereCondition.payed = true;
    } else if (payed === "false") {
        whereCondition.payed = false;
    }

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    if (status) {
        whereCondition.status = status;
    }

    const count = await HallReservation.count({ where: whereCondition });

    const reservations = await HallReservation.findAll({
        where: whereCondition,
        limit,
        offset,
        order: [["start_time", "ASC"]],
        include: [
            {
                model: Hall,
                attributes: ["name", "price_per_hour"]
            }
        ]
    });

    if (!reservations.length) {
        return res.status(404).json({ message: getMessage("noReservationsFound", lang) });
    }

    res.status(200).json({ count, reservations });
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
        where: { hall_id, is_deleted: false },
        include: [{ model: Customer, attributes: ["id", "first_name", "last_name"] }],
        order: [["start_time", "ASC"]],
    });

    res.status(200).json({ reservations });
};

export const getReservationsByHallAndDate = async (req, res) => {
    try {
        const hall_id = req.params.id;
        const { date } = req.query;
        const startOfDay = new Date(`${date}T00:00:00Z`);
        const endOfDay = new Date(`${date}T23:59:59Z`);

        const reservations = await HallReservation.findAll({
            where: {
                hall_id,
                is_deleted: false,
                start_time: { [Op.gte]: startOfDay },
                end_time: { [Op.lte]: endOfDay },
            },
            include: [{ model: Customer, attributes: ["id", "first_name", "last_name"] }],
            order: [["start_time", "ASC"]],
        });

        res.status(200).json({ reservations });
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ message: "Something went wrong." });
    }
}

export const getReservationsByDate = async (req, res) => {
    const lang = getLanguage(req);
    const { date } = req.params;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await HallReservation.findAll({
        where: {
            is_deleted: false,
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
            is_deleted: false,
            start_time: { [Op.gt]: new Date() },
        },
    });

    res.status(200).json({ reservations });
};
