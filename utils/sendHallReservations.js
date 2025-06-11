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

export const sendHallReservationEmail = async (customer, reservationDetails, lang = "en") => {
    const { hall, start_time, end_time, total_price } = reservationDetails;

    const fullName = buildFullName(customer);
    const start = new Date(start_time).toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
    const end = new Date(end_time).toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

    const subjectUser = lang === "ar" ? "تأكيد حجز القاعة - قصر النخيل" : "Hall Booking Confirmation - Qaser Al-Nakheel";
    const subjectAdmin = lang === "ar" ? "تم حجز قاعة جديدة" : "New Hall Booking Notification";

    const userHTML = lang === "ar"
        ? `
    <div style="direction: rtl; font-family: 'Cairo', sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-right: 5px solid #4CAF50;">
        <h3 style="color: #4CAF50;">✅ تم تأكيد حجز القاعة</h3>
        <p>عزيزي ${fullName}،</p>
        <p>لقد تم تأكيد حجزك بنجاح. تفاصيل الحجز:</p>
        <ul>
          <li><strong>اسم القاعة:</strong> ${hall.name.ar}</li>
          <li><strong>وقت البداية:</strong> ${start}</li>
          <li><strong>وقت النهاية:</strong> ${end}</li>
          <li><strong>السعر الإجمالي:</strong> ${total_price} شيكل</li>
        </ul>
        <p>شكرًا لاختيارك قصر النخيل.</p>
      </div>
    </div>
    `
        : `
    <div style="font-family: Arial, sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #4CAF50;">
        <h3 style="color: #4CAF50;">✅ Hall Booking Confirmed</h3>
        <p>Dear ${fullName},</p>
        <p>Your hall booking has been successfully confirmed. Details:</p>
        <ul>
          <li><strong>Hall Name:</strong> ${hall.name.en}</li>
          <li><strong>Start Time:</strong> ${start}</li>
          <li><strong>End Time:</strong> ${end}</li>
          <li><strong>Total Price:</strong> ${total_price} NIS</li>
        </ul>
        <p>Thank you for choosing Qaser Al-Nakheel.</p>
      </div>
    </div>
    `;

    const adminHTML = `
    <div style="font-family: Arial, sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #f39c12;">
        <h3 style="color: #f39c12;">📢 ${lang === "ar" ? "إشعار بحجز قاعة" : "New Hall Booking Alert"}</h3>
        <p><strong>${lang === "ar" ? "العميل" : "Customer"}:</strong> ${fullName} (${customer.email})</p>
        <p><strong>${lang === "ar" ? "اسم القاعة" : "Hall Name"}:</strong> ${hall.name[lang] || hall.name.en}</p>
        <p><strong>${lang === "ar" ? "وقت البداية" : "Start Time"}:</strong> ${start}</p>
        <p><strong>${lang === "ar" ? "وقت النهاية" : "End Time"}:</strong> ${end}</p>
        <p><strong>${lang === "ar" ? "السعر الإجمالي" : "Total Price"}:</strong> ${total_price} NIS</p>
        <p>📅 ${lang === "ar" ? "تاريخ الحجز" : "Reservation Date"}: ${new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</p>
      </div>
    </div>
  `;

    await sendNotificationEmail({
        to: customer.email,
        subject: subjectUser,
        html: userHTML,
    });

    await sendNotificationEmail({
        to: process.env.ADMIN_EMAIL,
        subject: subjectAdmin,
        html: adminHTML,
    });
};
