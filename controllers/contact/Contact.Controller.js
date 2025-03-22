import { createRequire } from "module";
const require = createRequire(import.meta.url);

const Customer = require("../../models/Customer.model")
const Contact = require("../../models/Contact.model")

const { getMessage } = require("../language/messages")
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const sendMessage = async (req, res) => {
    const lang = getLanguage(req);
    const { cust_id, message, subject } = req.body;

    if (!cust_id || !message || !subject) {
        return res.status(400).json({ error: getMessage("invalidInput", lang) });
    }

    await Contact.create({
        cust_id, 
        message, 
        subject 
    });

    res.status(200).json({ message: getMessage("messageSent", lang) })
}

export const getCustomerMessages = async (req, res) => {
    const lang = getLanguage(req);
    const cust_id = req.params.id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const customer = await Customer.findByPk(cust_id);
    if (!customer) {
        return res.status(404).json({ message: getMessage("customerNotFound", lang) });
    }

    let whereCondition = { cust_id };
    if (status && (status === 'read' || status === 'unread')) {
        whereCondition.status = status;
    }

    const { count, rows: messages } = await Contact.findAndCountAll({
        where: whereCondition,
        limit: limit,
        offset: (page - 1) * limit,
        order: [['date', 'DESC']],
    });

    res.status(200).json({
        totalMessages: count,
        totalPages: Math.ceil(count / limit),
        messages
    });
};


export const getAllContacts= async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let whereCondition = {};
    if (status && (status === 'read' || status === 'unread')) {
        whereCondition.status = status;
    }

    const { count, rows: contacts } = await Contact.findAndCountAll({
        where: whereCondition,
        limit: limit,
        offset: (page - 1) * limit,
        order: [['date', 'DESC']],
    });

    res.status(200).json({
        totalContacts: count,
        totalPages: Math.ceil(count / limit),
        contacts
    });
}

export const markAsRead = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const message = await Contact.findByPk(id);
    if (!message) {
        return res.status(404).json({ message: getMessage("messageNotFound", lang) })
    }

    await message.update({ status: 'read' });

    res.status(200).json({ message: getMessage("messageMarkedAsRead", lang) })
 
}

export const deleteCustomerMessage = async (req, res) => {
    const lang = getLanguage(req);
    const { id } = req.params;

    const message = await Contact.findByPk(id);
    if (!message) {
        return res.status(404).json({ message: getMessage("messageNotFound", lang) })
    }

    await message.destroy()
    res.status(200).json({ message: getMessage("messageDeleted", lang) })

}