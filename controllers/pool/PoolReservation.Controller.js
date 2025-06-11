import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);


const CustomerPool = require("../../models/CustomerPool.model");
const Pool = require("../../models/Pool.model");
const Customer = require("../../models/Customer.model");
const { getMessage } = require("../language/messages");
const { sendPoolReservationEmail } = require("../../utils/sendPoolReservationEmail");

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const createPoolReservation = async (req, res) => {
    const lang = getLanguage(req);
    const customer_id = req.params.id;
    const { pool_id, start_time, end_time, num_guests, notes } = req.body;

    const reservation_time = new Date(); // وقت إنشاء الحجز
    const startDate = new Date(start_time);
    if (isNaN(startDate) || startDate <= reservation_time) {
        return res.status(400).json({ message: getMessage("invalidStartTime", lang) });
    }

    let endDate = end_time ? new Date(end_time) : null;
    if (endDate && endDate <= startDate) {
        return res.status(400).json({ message: getMessage("invalidEndTime", lang) });
    }

    const pool = await Pool.findByPk(pool_id);
    if (!pool) return res.status(404).json({ message: getMessage("poolNotFound", lang) });

    const existingReservations = await CustomerPool.findAll({
        where: {
            pool_id,
            status: { [Op.in]: ["reserved", "checked_in"] },
            [Op.or]: [
                { start_time: { [Op.between]: [start_time, end_time || new Date()] } },
                { end_time: { [Op.between]: [start_time, end_time || new Date()] } },
                { start_time: { [Op.lte]: start_time }, end_time: { [Op.gte]: end_time || new Date() } }
            ]
        }
    });

    const totalGuests = existingReservations.reduce((sum, res) => sum + res.num_guests, 0);
    if (totalGuests + num_guests > pool.max_capacity) {
        return res.status(400).json({ message: getMessage("poolFull", lang) });
    }

    const reservation = await CustomerPool.create({
        customer_id,
        pool_id,
        reservation_time,
        start_time,
        end_time,
        num_guests,
        status: "reserved",
        notes
    });

    const customer = await Customer.findByPk(customer_id);
    if (customer) {
        await sendPoolReservationEmail(customer, { ...reservation.dataValues, pool }, lang);
    }

    res.status(201).json({ message: getMessage("addedReservation", lang), reservation });
};

export const deletePoolReservation = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const reservation = await CustomerPool.findByPk(id);
    if (!reservation) {
        return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    }
    reservation.is_deleted = true;
    await reservation.save();
    return res.status(200).json({ message: getMessage("reservationDeleted", lang) });
};

export const cancelReservation = async (req, res) => {
    const lang = getLanguage(req);
    const reservation = await CustomerPool.findByPk(req.params.id);

    if (!reservation) return res.status(404).json({ message: getMessage("reservationNotFound", lang) });

    const now = new Date();
    const checkInTime = new Date(reservation.check_in);
    if ((checkInTime - now) / (1000 * 60 * 60) < 2) {
        return res.status(400).json({ message: getMessage("cannotCancelLate", lang) });
    }

    await reservation.update({ status: "canceled" });
    res.status(200).json({ message: getMessage("canceledReservation", lang) });
};

export const checkIn = async (req, res) => {
    const lang = getLanguage(req);
    const reservation = await CustomerPool.findByPk(req.params.id);

    if (!reservation) return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    if (["checked_in", "checked_out", "canceled"].includes(reservation.status)) {
        return res.status(400).json({ message: getMessage("invalidCheckIn", lang) });
    }

    const currentTime = new Date();
    const reservationStartTime = new Date(reservation.start_time);

    if (currentTime < reservationStartTime && (reservationStartTime - currentTime) > 60 * 60 * 1000) {
        return res.status(400).json({ message: getMessage("checkInTooEarly", lang) });
    }

    await reservation.update({ status: "checked_in", start_time: currentTime });
    res.status(200).json({ message: getMessage("checkedInSuccessfully", lang) });
};

export const checkOut = async (req, res) => {
    const lang = getLanguage(req);
    const reservation = await CustomerPool.findByPk(req.params.id);

    if (!reservation) return res.status(404).json({ message: getMessage("reservationNotFound", lang) });
    if (reservation.status !== "checked_in") {
        return res.status(400).json({ message: getMessage("invalidCheckOut", lang) });
    }

    const pool = await Pool.findByPk(reservation.pool_id);
    const endDate = new Date();
    const duration = Math.round((endDate - new Date(reservation.start_time)) / (1000 * 60));
    const total_price = ((Math.ceil(duration / 60)) * (pool.hourly_rate * reservation.num_guests)).toFixed(2);

    await reservation.update({
        end_time: endDate,
        duration: Math.ceil(duration / 60),
        total_price,
        status: "checked_out"
    });

    res.status(200).json({ message: getMessage("checkedOut", lang), reservation });
};

export const getAllPoolReservations = async (req, res) => {
    const lang = getLanguage(req);
    const {
        pool_id,
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

    if (pool_id) {
        whereCondition.pool_id = pool_id;
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
        const date = new Date(start_time);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        whereCondition.start_time = {
            [Op.between]: [startOfDay, endOfDay],
        };
    }

    const reservations = await CustomerPool.findAndCountAll({
        where: whereCondition,
        limit: parseInt(limit),
        offset,
        order: [["start_time", "ASC"]],
        include: [
            {
                model: Pool,
                attributes: ["id", "name", "hourly_rate"]
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

export const getReservationsByCustomerId = async (req, res) => {
    const cust_id = req.params.id;
    const { date, status, payed } = req.query;
    const whereClause = {
        customer_id: cust_id,
        is_deleted: false,
    };

    if (date) {
        const startOfDay = new Date(date + "T00:00:00.000Z");
        const endOfDay = new Date(date + "T23:59:59.999Z");

        whereClause.start_time = {
            [Op.between]: [startOfDay, endOfDay],
        };
    }
    if (status) {
        whereClause.status = status;
    }
    if (payed !== undefined) {
        whereClause.payed = payed === 'true';
    }

    const reservations = await CustomerPool.findAll({
        where: whereClause,
        include: [
            {
                model: Pool,
                attributes: ["name", "location", "price_per_hour"],
            },
            {
                model: Customer,
                attributes: ["id", "first_name", "last_name"]
            }
        ],
        order: [["start_time", "ASC"]],
    });
    res.status(200).json(reservations);
};

export const getPoolReservationsByCustomer = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    const { date, status, payed } = req.query;



    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const whereCondition = { customer_id: cust_id };
    whereCondition.is_deleted = false;
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

    const count = await CustomerPool.count({ where: whereCondition });

    const reservations = await CustomerPool.findAll({
        where: whereCondition,
        limit,
        offset,
        order: [["reservation_time", "DESC"]],
        include: [{ model: Pool, attributes: ["id", "name", "opening_hours"] }]
    });

    if (!reservations.length) {
        return res.status(404).json({ message: getMessage("noReservationsFound", lang) });
    }

    res.status(200).json({ count, reservations });
};

export const getReservationsByPoolId = async (req, res) => {
    const pool_id = req.params.id;
    const reservations = await CustomerPool.findAll({ where: { pool_id, is_deleted: false } });
    res.status(200).json(reservations);
};

export const getReservationsByTime = async (req, res) => {
    const { date, after, before } = req.query;
    let whereClause = {};
    whereClause.is_deleted = false;

    if (date) {
        whereClause.start_time = {
            [Op.between]: [new Date(date + "T00:00:00.000Z"), new Date(date + "T23:59:59.000Z")]
        };
    }
    if (after) {
        whereClause.start_time = { ...whereClause.start_time, [Op.gte]: new Date(after) };
    }
    if (before) {
        whereClause.end_time = { [Op.lte]: new Date(before) };
    }
    const reservations = await CustomerPool.findAll({ where: whereClause });
    res.status(200).json(reservations);
};

