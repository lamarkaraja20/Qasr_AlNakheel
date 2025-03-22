import { parseAsync } from "json2csv";
import { createRequire } from "module";
import { Op } from "sequelize";
const require = createRequire(import.meta.url);

//require('dotenv').config();
//import Stripe from 'stripe';
//const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const { getMessage } = require('../language/messages');

const Booking = require("../../models/Booking.model");
const CustomerPool = require("../../models/CustomerPool.model");
const CustomerRestaurant = require("../../models/CustomerRestaurant.model");
const HallReservation = require("../../models/HallReservation.model");
const Payment = require("../../models/Payment.model");
const Customer = require("../../models/Customer.model");
const Hall = require("../../models/Hall.model");
const Restaurant = require("../../models/Restaurant.model");
const Room = require("../../models/Room.model");
const Pool = require("../../models/Pool.model")

const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const getUnpaidOrPaidInvoices = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    const payed = req.query.payed || false;
    if (!cust_id) {
        return res.status(400).json({ message: getMessage("customerNotFound", lang) });
    }

    const [bookings, pools, restaurants, halls] = await Promise.all([
        Booking.findAll({
            where: { cust_id, payed },
            include: [{ model: Room }]
        }),
        CustomerPool.findAll({
            where: { customer_id: cust_id, payed },
            include: [{ model: Pool }]
        }),
        CustomerRestaurant.findAll({
            where: { cust_id, payed },
            include: [{ model: Restaurant }]
        }),
        HallReservation.findAll({
            where: { cust_id, payed },
            include: [{ model: Hall }]
        })
    ]);

    const unpaidInvoices = [
        ...bookings.map(booking => ({
            invoice_id: booking.id,
            invoice_type: "Booking",
            amount: Number(booking.total_price),
            details: {
                room: booking.Room,
                num_of_guests: booking.num_of_guests,
                check_in_date: booking.check_in_date,
                check_out_date: booking.check_out_date,
                status: booking.status
            }
        })),
        ...pools.map(pool => ({
            invoice_id: pool.id,
            invoice_type: "CustomerPool",
            amount: Number(pool.total_price),
            details: {
                pool_id: pool.pool_id,
                reservation_time: pool.reservation_time,
                start_time: pool.start_time,
                end_time: pool.end_time,
                duration: pool.duration,
                num_guests: pool.num_guests,
                status: pool.status,
                notes: pool.notes
            }
        })),
        ...restaurants.map(restaurant => ({
            invoice_id: restaurant.id,
            invoice_type: "CustomerRestaurant",
            amount: Number(restaurant.total_price),
            details: {
                restaurant: restaurant.Restaurant,
                reservation_date: restaurant.reservation_date,
                number_of_guests: restaurant.number_of_guests,
                is_walk_in: restaurant.is_walk_in,
                status: restaurant.status
            }
        })),
        ...halls.map(hall => ({
            invoice_id: hall.id,
            invoice_type: "HallReservation",
            amount: Number(hall.total_price),
            details: {
                hall: hall.Hall,
                start_time: hall.start_time,
                end_time: hall.end_time,
                status: hall.status
            }
        }))
    ];

    if (unpaidInvoices.length === 0) {
        if (payed === false) {
            return res.status(404).json({ message: getMessage("noUnpaidInvoices", lang) });
        } else {
            return res.status(200).json({ message: getMessage("noPaidInvoices", lang) });
        }
    }

    res.status(200).json({ unpaidInvoices });
};

export const checkout = async (req, res) => {
    const { amount, token } = req.body;
    try {
        const charge = await stripe.charges.create({
            amount,
            currency: 'usd',
            source: token,
            description: 'Test Payment',
        });

        res.status(200).send({ success: true, charge });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
}

export const payInvoices = async (req, res) => {
    const lang = getLanguage(req);
    const { cust_id, invoices, payment_method } = req.body;

    if (!cust_id || !Array.isArray(invoices) || invoices.length === 0) {
        return res.status(400).json({ message: getMessage("invalidData", lang) });
    }

    const customer = await Customer.findByPk(cust_id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }

    let totalPaymentAmount = 0;

    for (const invoice of invoices) {
        const { invoice_id, invoice_type, amount } = invoice;

        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: getMessage("invalidAmount", lang) });
        }

        totalPaymentAmount += numericAmount;

        let invoiceRecord;
        switch (invoice_type) {
            case "Booking":
                invoiceRecord = await Booking.findOne({ where: { id: invoice_id, cust_id } });
                break;
            case "CustomerPool":
                invoiceRecord = await CustomerPool.findOne({ where: { id: invoice_id, customer_id: cust_id } });
                break;
            case "CustomerRestaurant":
                invoiceRecord = await CustomerRestaurant.findOne({ where: { id: invoice_id, cust_id } });
                break;
            case "HallReservation":
                invoiceRecord = await HallReservation.findOne({ where: { id: invoice_id, cust_id } });
                break;
            default:
                return res.status(400).json({ message: getMessage("invalidInvoiceType", lang) });
        }

        if (!invoiceRecord) {
            return res.status(404).json({ message: getMessage("invoiceNotFound", lang) });
        }

        if (invoiceRecord.payed) {
            return res.status(400).json({ message: getMessage("invoiceAlreadyPaid", lang) });
        }

        switch (invoice_type) {
            case "Booking":
                await Booking.update({ payed: true }, { where: { id: invoice_id, cust_id } });
                break;
            case "CustomerPool":
                await CustomerPool.update({ payed: true }, { where: { id: invoice_id, customer_id: cust_id } });
                break;
            case "CustomerRestaurant":
                await CustomerRestaurant.update({ payed: true }, { where: { id: invoice_id, cust_id } });
                break;
            case "HallReservation":
                await HallReservation.update({ payed: true }, { where: { id: invoice_id, cust_id } });
                break;
        }

        await Payment.create({
            cust_id,
            payment_amount: totalPaymentAmount,
            payment_method,
            invoice_id,
            invoice_type
        });
    }

    res.status(200).json({
        message: getMessage("paymentSuccess", lang),
        totalPaid: totalPaymentAmount
    });
};
/*
export const payInvoices = async (req, res) => {
    const lang = getLanguage(req);
    const { cust_id, invoices, payment_method, token } = req.body;

    if (!cust_id || !Array.isArray(invoices) || invoices.length === 0 || !token) {
        return res.status(400).json({ message: getMessage("invalidData", lang) });
    }

    const customer = await Customer.findByPk(cust_id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }

    let totalPaymentAmount = 0;

    for (const invoice of invoices) {
        const { invoice_id, invoice_type, amount } = invoice;
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: getMessage("invalidAmount", lang) });
        }

        totalPaymentAmount += numericAmount;

        let invoiceRecord;
        switch (invoice_type) {
            case "Booking":
                invoiceRecord = await Booking.findOne({ where: { id: invoice_id, cust_id } });
                break;
            case "CustomerPool":
                invoiceRecord = await CustomerPool.findOne({ where: { id: invoice_id, customer_id: cust_id } });
                break;
            case "CustomerRestaurant":
                invoiceRecord = await CustomerRestaurant.findOne({ where: { id: invoice_id, cust_id } });
                break;
            case "HallReservation":
                invoiceRecord = await HallReservation.findOne({ where: { id: invoice_id, cust_id } });
                break;
            default:
                return res.status(400).json({ message: getMessage("invalidInvoiceType", lang) });
        }

        if (!invoiceRecord) {
            return res.status(404).json({ message: getMessage("invoiceNotFound", lang) });
        }

        if (invoiceRecord.payed) {
            return res.status(400).json({ message: getMessage("invoiceAlreadyPaid", lang) });
        }
    }

    try {
        // معالجة الدفع عبر Stripe
        const charge = await stripe.charges.create({
            amount: Math.round(totalPaymentAmount * 100), // تحويل القيمة إلى سنتات
            currency: 'usd',
            source: token,
            description: 'Payment for Multiple Invoices',
        });

        // تحديث حالة الفواتير بعد نجاح الدفع
        for (const invoice of invoices) {
            const { invoice_id, invoice_type } = invoice;

            switch (invoice_type) {
                case "Booking":
                    await Booking.update({ payed: true }, { where: { id: invoice_id, cust_id } });
                    break;
                case "CustomerPool":
                    await CustomerPool.update({ payed: true }, { where: { id: invoice_id, customer_id: cust_id } });
                    break;
                case "CustomerRestaurant":
                    await CustomerRestaurant.update({ payed: true }, { where: { id: invoice_id, cust_id } });
                    break;
                case "HallReservation":
                    await HallReservation.update({ payed: true }, { where: { id: invoice_id, cust_id } });
                    break;
            }

            // حفظ معلومات الدفع في قاعدة البيانات
            await Payment.create({
                cust_id,
                payment_amount: totalPaymentAmount,
                payment_method,
                invoice_id,
                invoice_type
            });
        }

        res.status(200).json({
            message: getMessage("paymentSuccess", lang),
            totalPaid: totalPaymentAmount,
            charge
        });
    } catch (error) {
        res.status(500).json({ message: getMessage("paymentFailed", lang), error: error.message });
    }
};
*/

export const getTotalUnpaidInvoiceAmount = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;
    if (!cust_id) {
        return res.status(400).json({ message: getMessage("customerNotFound", lang) });
    }

    const [bookings, pools, restaurants, halls] = await Promise.all([
        Booking.findAll({ where: { cust_id, payed: false }, attributes: ['total_price'] }),
        CustomerPool.findAll({ where: { customer_id: cust_id, payed: false }, attributes: ['total_price'] }),
        CustomerRestaurant.findAll({ where: { cust_id, payed: false }, attributes: ['total_price'] }),
        HallReservation.findAll({ where: { cust_id, payed: false }, attributes: ['total_price'] })
    ]);

    const unpaidInvoiceAmounts = [
        bookings.reduce((acc, booking) => acc + Number(booking.total_price), 0),
        pools.reduce((acc, pool) => acc + Number(pool.total_price), 0),
        restaurants.reduce((acc, restaurant) => acc + Number(restaurant.total_price), 0),
        halls.reduce((acc, hall) => acc + Number(hall.total_price), 0)
    ];

    const totalAmount = unpaidInvoiceAmounts.reduce((acc, amount) => acc + amount, 0);
    res.status(200).json({ totalAmount });

};


const getDateRange = (period) => {
    const now = new Date();
    let startDate, endDate = now;

    switch (period) {
        case "daily":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case "monthly":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case "yearly":
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            throw new Error("Invalid period");
    }
    return { startDate, endDate };
};

export const reportPayment = async (req, res) => {
    const lang = getLanguage(req);
    const { period, exportType } = req.query;
    const { startDate, endDate } = getDateRange(period);

    const payments = await Payment.findAll({
        where: {
            payment_date: { [Op.between]: [startDate, endDate] }
        }
    });


    if (exportType === "csv") {
        const csv = await parseAsync(payments.map(p => p.toJSON()));
        res.header("Content-Type", "text/csv");
        return res.attachment("payments_report.csv").send(csv);
    }

    if (payments.length === 0) {
        return res.status(200).json({ message: getMessage("noPaymentsFound", lang) });
    }

    res.status(200).json({ payments });
};

export const reportUnpaidInvoices = async (req, res) => {
    const lang = getLanguage(req);
    const { service, exportType } = req.query;
    if (!service) {
        return res.status(400).json({ message: getMessage("serviceRequired", lang) });
    }

    const models = {
        rooms: Booking,
        pools: CustomerPool,
        restaurants: CustomerRestaurant,
        halls: HallReservation
    };


    const Model = models[service];
    if (!Model) {
        return res.status(400).json({ message: getMessage("invalidServiceType", lang) });
    }

    const unpaidInvoices = await Model.findAll({ where: { payed: false } });

    if (exportType === "csv") {
        const csv = await parseAsync(unpaidInvoices.map(i => i.toJSON()));
        res.header("Content-Type", "text/csv");
        return res.attachment("unpaid_invoices.csv").send(csv);
    }
    if (unpaidInvoices.length === 0) {
        return res.status(200).json({ message: getMessage("noUnpaidInvoices", lang) });
    }

    res.status(200).json({ unpaidInvoices });
};


