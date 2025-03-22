import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);


const Booking = require("../../models/Booking.model")
const RoomPricing = require("../../models/RoomPricing.model")
const Room = require("../../models/Room.model")
const SpecialPricing = require("../../models/SpecialPricing.model")
const Customer = require("../../models/Customer.model")

const { getMessage } = require("../language/messages")
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");


export const createBooking = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    const { type, num_of_guests, check_in_date, check_out_date, payment_status } = req.body;

    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
        return res.status(400).json({ message: getMessage("earlierDateBook", lang) });
    }

    const availableRooms = await Room.findAll({ where: { type } });
    if (!availableRooms.length) {
        return res.status(404).json({ message: getMessage("roomTypeNotFound", lang) });
    }

    let selectedRoom = null;
    for (const room of availableRooms) {
        if (num_of_guests > room.capacity) continue;

        const existingBooking = await Booking.findOne({
            where: {
                room_id: room.id,
                status: "confirmed",
                [Op.or]: [
                    { check_in_date: { [Op.between]: [check_in_date, check_out_date] } },
                    { check_out_date: { [Op.between]: [check_in_date, check_out_date] } },
                    { check_in_date: { [Op.lte]: check_in_date }, check_out_date: { [Op.gte]: check_out_date } },
                ],
            },
        });

        if (!existingBooking) {
            selectedRoom = room;
            break;
        }
    }

    if (!selectedRoom) {
        return res.status(400).json({ message: getMessage("roomNotAvailable", lang) });
    }

    let total_price = 0;
    const specialPricingList = await SpecialPricing.findAll({
        where: {
            room_id: selectedRoom.id,
            start_date: { [Op.lte]: check_out_date },
            end_date: { [Op.gte]: check_in_date },
        },
    });

    if (specialPricingList.length) {
        let minSpecialPrice = Math.min(...specialPricingList.map(sp => parseFloat(sp.price)));
        total_price = ((checkOut - checkIn) / (1000 * 60 * 60 * 24)) * minSpecialPrice;
    } else {
        const weeklyPricing = await RoomPricing.findAll({ where: { room_id: selectedRoom.id } });

        if (!weeklyPricing.length) {
            return res.status(400).json({ message: getMessage("roomPriceNotFound", lang) });
        }

        const pricingMap = weeklyPricing.reduce((map, price) => {
            map[price.day_of_week] = parseFloat(price.price);
            return map;
        }, {});

        let currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
            const dayOfWeek = currentDate.toLocaleString("en-US", { weekday: "long" });

            if (!pricingMap[dayOfWeek]) {
                return res.status(400).json({ message: getMessage("fixedPriceNotFound", lang) });
            }

            total_price += pricingMap[dayOfWeek];
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    const newBooking = await Booking.create({
        cust_id,
        room_id: selectedRoom.id,
        num_of_guests,
        check_in_date,
        check_out_date,
        total_price,
        payment_status,
        status: "confirmed",
    });

    return res.status(201).json({ message: getMessage("bookingDone", lang), booking: newBooking });
};

export const getAllBookings = async (req, res) => {
    try {
        const lang = getLanguage(req);
        const { status } = req.query;

        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 1;
        const offset = (page - 1) * limit;

        const whereCondition = {};
        if (status) {
            whereCondition.status = status;
        }

        const bookings = await Booking.findAndCountAll({
            where: whereCondition,
            limit,
            offset,
            order: [["check_in_date", "DESC"]],
            include: [
                {
                    model: Room,
                },
                {
                    model: Customer,
                    attributes: ["id", "first_name", "last_name", "email"],
                },
            ],
        });

        if (!bookings.rows.length) {
            return res.status(404).json({ message: getMessage("noBookingsFound", lang) });
        }

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


export const getBookingsByRoom = async (req, res) => {
    const lang = getLanguage(req);

    const room_id = req.params.id;
    const { status } = req.query;

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const whereCondition = { room_id };
    if (status) {
        whereCondition.status = status;
    }

    const countBooking = await Booking.count({ where: whereCondition });

    const bookings = await Booking.findAll({
        where: whereCondition,
        limit,
        offset,
        order: [["check_in_date", "DESC"]],
        include: [{
            model: Customer,
            attributes: ["id", "first_name", "last_name", "email"],
        }]
    });

    if (!bookings.length) {
        return res.status(404).json({ message: getMessage("noBookingsFound", lang) });
    }
    res.status(200).json({ countBooking: countBooking, bookings: bookings });
}

export const getBookingsByCustomer = async (req, res) => {
    const lang = getLanguage(req);

    const cust_id = req.params.id;
    const { status } = req.query;

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const whereCondition = { cust_id };
    if (status) {
        whereCondition.status = status;
    }

    const countBooking = await Booking.count({ where: whereCondition });

    const bookings = await Booking.findAll({
        where: whereCondition,
        limit,
        offset,
        order: [["check_in_date", "DESC"]],
        include: [{
            model: Room,
        }]
    });

    if (!bookings.length) {
        return res.status(404).json({ message: getMessage("noBookingsFound", lang) });
    }
    res.status(200).json({ countBooking: countBooking, bookings: bookings });
}

export const canceledBooking = async (req, res) => {
    const lang = getLanguage(req);
    const id = req.params.id;

    const booking = await Booking.findByPk(id);
    if (!booking) {
        return res.status(404).json({ message: getMessage("noBookingsFound", lang) });
    }

    if (booking.status === "canceled") {
        return res.status(400).json({ message: getMessage("bookingAlreadyCanceled", lang) });
    }

    const [updatedRows, updatedBooking] = await Booking.update(
        { status: "canceled" },
        { where: { id }, returning: true }
    );

    res.status(200).json({
        message: getMessage("bookingCanceled", lang),
        booking: updatedBooking[0]
    });
}


export const deleteBooking = async (req, res) => {
    const lang = getLanguage(req);
    const id = req.params.id;
    const booking = await Booking.findByPk(id);
    if (!booking) {
        return res.status(404).json({ message: getMessage("noBookingsFound", lang) });
    }
    await booking.destroy();
    res.status(204).json({ message: getMessage("deleteBooking", lang) });
}