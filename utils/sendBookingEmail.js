import { createRequire } from "module";
const require = createRequire(import.meta.url);
const transporter = require("./mailer");

export const sendBookingEmail = async (customer, bookingDetails, lang = "en") => {
  const {
    roomType,
    num_of_guests,
    check_in_date,
    check_out_date,
    total_price,
  } = bookingDetails;

  const checkInStr = new Date(check_in_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");
  const checkOutStr = new Date(check_out_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US");

  const subjectUser = lang === "ar" ? "تأكيد الحجز - قصر النخيل" : "Booking Confirmation - Qaser Al-Nakheel";
  const subjectAdmin = lang === "ar" ? "تم إجراء حجز جديد" : "New Booking Notification";

  const fullName = buildFullName(customer);

  const userHTML = lang === "ar"
    ? `
    <div style="direction: rtl; font-family: 'Cairo', sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-right: 5px solid #4CAF50;">
        <h3 style="color: #4CAF50;">✅ تأكيد الحجز</h3>
        <p><strong>العميل:</strong> ${fullName || "العميل"} (${customer.email})</p>
        <p><strong>نوع الغرفة:</strong> ${roomType}</p>
        <p><strong>عدد الضيوف:</strong> ${num_of_guests}</p>
        <p><strong>تاريخ الوصول:</strong> ${checkInStr}</p>
        <p><strong>تاريخ المغادرة:</strong> ${checkOutStr}</p>
        <p><strong>السعر الإجمالي:</strong> ${total_price} شيكل</p>
        <p>📅 تاريخ الحجز: ${new Date().toLocaleString("ar-EG")}</p>
        <p style="margin-top: 20px;">شكرًا لاختيارك <strong>قصر النخيل</strong>.</p>
      </div>
    </div>
    `
    : `
    <div style="font-family: Arial, sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #4CAF50;">
        <h3 style="color: #4CAF50;">✅ Booking Confirmed</h3>
        <p><strong>Customer:</strong> ${fullName || "Guest"} (${customer.email})</p>
        <p><strong>Room Type:</strong> ${roomType}</p>
        <p><strong>Guests:</strong> ${num_of_guests}</p>
        <p><strong>Check-in:</strong> ${checkInStr}</p>
        <p><strong>Check-out:</strong> ${checkOutStr}</p>
        <p><strong>Total Price:</strong> ${total_price} NIS</p>
        <p>📅 Booking Date: ${new Date().toLocaleString("en-US")}</p>
        <p style="margin-top: 20px;">Thank you for choosing <strong>Qaser Al-Nakheel</strong>.</p>
      </div>
    </div>
    `;

  const adminHTML = `
  <div style="font-family: Arial, sans-serif; background-color: #fffbe6; padding: 20px;">
    <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #f39c12;">
      <h3 style="color: #f39c12;">📢 New Booking Alert</h3>
      <p><strong>Customer:</strong> ${fullName || "Unknown"} (${customer.email})</p>
      <p><strong>Room Type:</strong> ${roomType}</p>
      <p><strong>Guests:</strong> ${num_of_guests}</p>
      <p><strong>Check-in:</strong> ${checkInStr}</p>
      <p><strong>Check-out:</strong> ${checkOutStr}</p>
      <p><strong>Total Price:</strong> ${total_price} NIS</p>
      <p>📅 Booking Date: ${new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</p>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: `"Qaser Al-Nakheel" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: subjectUser,
    html: userHTML,
  });

  await transporter.sendMail({
    from: `"Qaser Al-Nakheel" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || "admin@example.com",
    subject: subjectAdmin,
    html: adminHTML,
  });
};

const buildFullName = (customer) => {
  const parts = [
    customer.first_name,
    customer.second_name,
    customer.third_name,
    customer.last_name,
  ].filter(Boolean);

  return parts.join(" ");
};

