import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);


const Booking = require("../../models/Booking.model")
const RoomPricing = require("../../models/RoomPricing.model")
const Room = require("../../models/Room.model")
const SpecialPricing = require("../../models/SpecialPricing.model")
const Customer = require("../../models/Customer.model")
const RoomType = require("../../models/RoomType.model")

const { sendBookingEmail } = require("../../utils/sendBookingEmail")

const { getMessage } = require("../language/messages")
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");


export const createBooking = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    const { type, num_of_guests, check_in_date, check_out_date, payment_status } = req.body;

    const customer = await Customer.findByPk(cust_id);
    const roomType = await RoomType.findByPk(type)

    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isBeforeToday = checkIn < today;
    if (isBeforeToday) {
        return res.status(400).json({ message: getMessage("earlierDateBook", lang) });
    }

    // ✅ تحقق من أن check_out_date بعد check_in_date
    if (checkOut <= checkIn) {
        return res.status(400).json({ message: getMessage("invalidDateRange", lang) });
    }

    const availableRooms = await Room.findAll({
        where: {
            type,
            isActive: true,
            is_deleted: false,
        }
    });

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
                is_deleted: false,
                [Op.or]: [
                    { check_in_date: { [Op.between]: [check_in_date, check_out_date] } },
                    { check_out_date: { [Op.between]: [check_in_date, check_out_date] } },
                    {
                        check_in_date: { [Op.lte]: check_in_date },
                        check_out_date: { [Op.gte]: check_out_date }
                    },
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

        const normalizedPricingMap = {};
        for (const [key, value] of Object.entries(pricingMap)) {
            normalizedPricingMap[key.toLowerCase()] = value;
        }
        let currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
            const dayOfWeek = currentDate.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

            if (!normalizedPricingMap[dayOfWeek]) {
                return res.status(400).json({ message: getMessage("fixedPriceNotFound", lang) });
            }

            total_price += normalizedPricingMap[dayOfWeek];
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

    if (customer && customer.email) {
        await sendBookingEmail(customer, {
            roomType: roomType.name[lang]|| roomType.name.en,
            num_of_guests,
            check_in_date,
            check_out_date,
            total_price,
        }, lang);
    }

    return res.status(201).json({ message: getMessage("bookingDone", lang), booking: newBooking });
};

export const createBookingByRoomId = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    const { room_id, num_of_guests, check_in_date, check_out_date, payment_status } = req.body;

    const customer = await Customer.findByPk(cust_id);

    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isBeforeToday = checkIn < today;
    if (isBeforeToday) {
        return res.status(400).json({ message: getMessage("earlierDateBook", lang) });
    }

    // ✅ تحقق من أن check_out_date بعد check_in_date
    if (checkOut <= checkIn) {
        return res.status(400).json({ message: getMessage("invalidDateRange", lang) });
    }

    const room = await Room.findByPk(room_id);
    if (!room) {
        return res.status(404).json({ message: getMessage("roomNotFound", lang) });
    }
    if (!room.isActive) {
        return res.status(400).json({ message: getMessage("roomInactive", lang) });
    }

    if (num_of_guests > room.capacity) {
        return res.status(400).json({ message: getMessage("exceedsCapacity", lang) });
    }

    const existingBooking = await Booking.findOne({
        where: {
            room_id: room.id,
            status: "confirmed",
            is_deleted: false,
            [Op.or]: [
                { check_in_date: { [Op.between]: [check_in_date, check_out_date] } },
                { check_out_date: { [Op.between]: [check_in_date, check_out_date] } },
                {
                    check_in_date: { [Op.lte]: check_in_date },
                    check_out_date: { [Op.gte]: check_out_date }
                },
            ],
        },
    });

    if (existingBooking) {
        return res.status(400).json({ message: getMessage("roomNotAvailable", lang) });
    }

    let total_price = 0;
    const specialPricingList = await SpecialPricing.findAll({
        where: {
            room_id: room.id,
            start_date: { [Op.lte]: check_out_date },
            end_date: { [Op.gte]: check_in_date },
        },
    });

    if (specialPricingList.length) {
        let minSpecialPrice = Math.min(...specialPricingList.map(sp => parseFloat(sp.price)));
        total_price = ((checkOut - checkIn) / (1000 * 60 * 60 * 24)) * minSpecialPrice;
    } else {
        const weeklyPricing = await RoomPricing.findAll({ where: { room_id: room.id } });

        if (!weeklyPricing.length) {
            return res.status(400).json({ message: getMessage("roomPriceNotFound", lang) });
        }

        const pricingMap = weeklyPricing.reduce((map, price) => {
            map[price.day_of_week] = parseFloat(price.price);
            return map;
        }, {});

        const normalizedPricingMap = {};
        for (const [key, value] of Object.entries(pricingMap)) {
            normalizedPricingMap[key.toLowerCase()] = value;
        }
        let currentDate = new Date(checkIn);
        while (currentDate < checkOut) {
            const dayOfWeek = currentDate.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

            if (!normalizedPricingMap[dayOfWeek]) {
                return res.status(400).json({ message: getMessage("fixedPriceNotFound", lang) });
            }

            total_price += normalizedPricingMap[dayOfWeek];
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    const newBooking = await Booking.create({
        cust_id,
        room_id: room.id,
        num_of_guests,
        check_in_date,
        check_out_date,
        total_price,
        payment_status,
        status: "confirmed",
    });

    if (customer && customer.email) {
        await sendBookingEmail(customer, {
            roomType: room.type,
            num_of_guests,
            check_in_date,
            check_out_date,
            total_price,
        }, lang);
    }

    return res.status(201).json({ message: getMessage("bookingDone", lang), booking: newBooking });
};

export const getAllBookings = async (req, res) => {
    const lang = getLanguage(req);
    const { status, payed, startDate, endDate } = req.query;

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const whereCondition = {};

    whereCondition.is_deleted = false;
    if (status) {
        whereCondition.status = status;
    }

    if (payed !== undefined) {
        whereCondition.payed = payed === "true";
    }

    if (startDate && endDate) {
        whereCondition.check_in_date = {
            [Op.between]: [new Date(startDate), new Date(endDate)],
        };
    } else if (startDate) {
        whereCondition.check_in_date = {
            [Op.gte]: new Date(startDate),
        };
    }

    const bookings = await Booking.findAndCountAll({
        where: whereCondition,
        limit,
        offset,
        order: [["check_in_date", "DESC"]],
        include: [
            {
                model: Room,
                attributes: ["id", "room_no"]
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
};


export const getBookingsByRoom = async (req, res) => {
    const lang = getLanguage(req);

    const room_id = req.params.id;
    const { status } = req.query;

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const whereCondition = { room_id };
    whereCondition.is_deleted = false;
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

        whereCondition.check_in_date = {
            [Op.between]: [startDate, endDate]
        };
    }
    if (payed === "true") {
        whereCondition.payed = true;
    } else if (payed === "false") {
        whereCondition.payed = false;
    }

    const countBooking = await Booking.count({ where: whereCondition });

    const bookings = await Booking.findAll({
        where: whereCondition,
        limit,
        offset,
        order: [["check_in_date", "DESC"]],
        include: [{
            model: Room,
            attributes: ["id", "room_no"]
        }]
    });

    if (!bookings.length) {
        return res.status(404).json({ message: getMessage("noBookingsFound", lang) });
    }

    res.status(200).json({ countBooking, bookings });
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

    await Booking.update(
        { status: "canceled" },
        { where: { id } }
    );

    const updatedBooking = await Booking.findByPk(id);

    res.status(200).json({
        message: getMessage("bookingCanceled", lang),
        booking: updatedBooking
    });
}


export const deleteBooking = async (req, res) => {
    const lang = getLanguage(req);
    const id = req.params.id;
    const booking = await Booking.findByPk(id);
    if (!booking) {
        return res.status(404).json({ message: getMessage("noBookingsFound", lang) });
    }
    booking.is_deleted = true;
    await booking.save();
    res.status(200).json({ message: getMessage("deleteBooking", lang) });
}