import { createRequire } from "module";
const require = createRequire(import.meta.url);

const Customer = require("../../models/Customer.model")
const Contact = require("../../models/Contact.model")
const transporter = require("../../utils/mailer")

const { sendContactMessageEmails } = require("../../utils/sendNotificationEmail")
const { getMessage } = require("../language/messages")
const getLanguage = (req) => (req.headers["accept-language"] === "ar" ? "ar" : "en");

export const sendMessage = async (req, res) => {
    const lang = getLanguage(req);
    const { cust_id, message, subject } = req.body;

    if (!cust_id || !message || !subject) {
        return res.status(400).json({ error: getMessage("invalidInput", lang) });
    }

    const customer = await Customer.findByPk(cust_id);

    await Contact.create({
        cust_id,
        message,
        subject
    });
    if (customer && customer.email) {
        await sendContactMessageEmails({ customer, subject, message, lang });
    }
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
    whereCondition.is_deleted = false;
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


export const getAllContacts = async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    let whereCondition = {};
    whereCondition.is_deleted = false;
    if (status && (status === 'read' || status === 'unread')) {
        whereCondition.status = status;
    }

    const { count, rows: contacts } = await Contact.findAndCountAll({
        where: whereCondition,
        limit: limit,
        offset: (page - 1) * limit,
        order: [['date', 'DESC']],
        include: [{
            model: Customer,
            attributes: ["id", "first_name", "last_name", "email"]
        }],
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

    message.is_deleted = true;
    await message.save()
    res.status(200).json({ message: getMessage("messageDeleted", lang) })

}

export const sendEmailToCustomer = async (req, res) => {
    const lang = getLanguage(req);
    const customerId = req.params.id;
    const { subject, message } = req.body;

    if (!subject || !message) {
        return res.status(400).json({ message: lang === "ar" ? "يرجى إدخال العنوان والرسالة." : "Please provide subject and message." });
    }

    const customer = await Customer.findByPk(customerId);
    if (!customer) {
        return res.status(404).json({ message: lang === "ar" ? "المستخدم غير موجود" : "Customer not found" });
    }

    const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ");
    const emailHTML = `
  <div style="max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:10px;padding:30px;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;background-color:#f9f9f9;">
    <div style="text-align:center;margin-bottom:20px;">
      <h2 style="color:#2c3e50;">${subject}</h2>
    </div>

    <p style="font-size:16px;color:#333;">${lang === "ar" ? "عزيزي" : "Dear"} <strong>${fullName}</strong>,</p>

    <p style="font-size:15px;line-height:1.6;color:#555;">
      ${message}
    </p>

    <hr style="margin:30px 0;border:none;border-top:1px solid #ddd;" />

    <div style="text-align:center;">
      <p style="font-size:14px;color:#777;">
        ${lang === "ar" ? "مع تحيات فريق" : "Best regards,"}<br/>
        <strong style="color:#16a085;">Qaser Al-Nakheel</strong>
      </p>
    </div>
  </div>
`;

    await transporter.sendMail({
        from: `"Qaser Al-Nakheel" <${process.env.EMAIL_USER}>`,
        to: customer.email,
        subject,
        html: emailHTML,
    });

    res.status(200).json({ message: lang === "ar" ? "تم إرسال الرسالة بنجاح" : "Email sent successfully" });

};