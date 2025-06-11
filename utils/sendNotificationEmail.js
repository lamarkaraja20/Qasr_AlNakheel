import { createRequire } from "module";
const require = createRequire(import.meta.url);
const transporter = require("./mailer");

const buildFullName = (customer) => {
    const parts = [
        customer.first_name,
        customer.second_name,
        customer.third_name,
        customer.last_name,
    ].filter(Boolean);
    return parts.join(" ");
};

const sendNotificationEmail = async ({ to, subject, html }) => {
    await transporter.sendMail({
        from: `"Qaser Al Nakheel" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
};

export const sendContactMessageEmails = async ({ customer, subject, message, lang }) => {
    const fullName = buildFullName(customer);

    const localizedSubject = lang === "ar" ? "تم استلام رسالتك" : "Your message has been received";
    const adminSubject = lang === "ar" ? "رسالة جديدة من عميل" : "New customer message";

    const userHTML = lang === "ar"
        ? `
    <div style="direction: rtl; font-family: 'Cairo', sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-right: 5px solid #4CAF50;">
        <h3 style="color: #4CAF50;">📩 ${localizedSubject}</h3>
        <p>عزيزي ${fullName}،</p>
        <p>لقد استلمنا رسالتك وسنقوم بالرد عليك قريبًا.</p>
        <hr style="margin: 20px 0;" />
        <p><strong>الموضوع:</strong> ${subject}</p>
        <p><strong>الرسالة:</strong></p>
        <p>${message}</p>
        <p style="margin-top: 20px;">شكرًا لتواصلك معنا في <strong>قصر النخيل</strong>.</p>
      </div>
    </div>
    `
        : `
    <div style="font-family: Arial, sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #4CAF50;">
        <h3 style="color: #4CAF50;">📩 ${localizedSubject}</h3>
        <p>Dear ${fullName},</p>
        <p>We have received your message and will respond shortly.</p>
        <hr style="margin: 20px 0;" />
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p style="margin-top: 20px;">Thank you for contacting <strong>Qaser Al-Nakheel</strong>.</p>
      </div>
    </div>
    `;

    const adminHTML = lang === "ar"
        ? `
    <div style="direction: rtl; font-family: 'Cairo', sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-right: 5px solid #f39c12;">
        <h3 style="color: #f39c12;">📥 ${adminSubject}</h3>
        <p><strong>العميل:</strong> ${fullName}</p>
        <p><strong>البريد الإلكتروني:</strong> ${customer.email}</p>
        <p><strong>الموضوع:</strong> ${subject}</p>
        <p><strong>الرسالة:</strong></p>
        <p>${message}</p>
      </div>
    </div>
    `
        : `
    <div style="font-family: Arial, sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #f39c12;">
        <h3 style="color: #f39c12;">📥 ${adminSubject}</h3>
        <p><strong>Customer:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      </div>
    </div>
    `;

    await sendNotificationEmail({
        to: customer.email,
        subject: localizedSubject,
        html: userHTML,
    });

    await sendNotificationEmail({
        to: process.env.ADMIN_EMAIL,
        subject: adminSubject,
        html: adminHTML,
    });
};
