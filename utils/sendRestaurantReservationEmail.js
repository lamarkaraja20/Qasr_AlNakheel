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

export const sendRestaurantReservationEmail = async (customer, reservationDetails, lang = "en") => {
    const {
        restaurant,
        number_of_guests,
        reservation_date,
        is_walk_in
    } = reservationDetails;

    const dateStr = new Date(reservation_date).toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

    const subjectUser = lang === "ar" ? "تأكيد حجز المطعم" : "Restaurant Reservation Confirmation";
    const subjectAdmin = lang === "ar" ? "تم إجراء حجز مطعم جديد" : "New Restaurant Reservation";

    const fullName = buildFullName(customer);

    const userHTML = `
    <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #3498db;">
        <h3 style="color: #3498db;">${subjectUser}</h3>
        <p>${lang === "ar" ? "عزيزي" : "Dear"} ${fullName || "Guest"},</p>
        <p>${lang === "ar" ? "تم تأكيد حجزك في المطعم بنجاح." : "Your restaurant reservation has been successfully confirmed."}</p>
        <ul>
          <li><strong>${lang === "ar" ? "المطعم" : "Restaurant"}:</strong> ${restaurant.name[lang] || restaurant.name.en}</li>
          <li><strong>${lang === "ar" ? "عدد الضيوف" : "Guests"}:</strong> ${number_of_guests}</li>
          <li><strong>${lang === "ar" ? "تاريخ الحجز" : "Reservation Date"}:</strong> ${dateStr}</li>
          <li><strong>${lang === "ar" ? "نوع الحجز" : "Type"}:</strong> ${is_walk_in ? (lang === "ar" ? "حجز مباشر" : "Walk-in") : (lang === "ar" ? "حجز مسبق" : "Reservation")}</li>
        </ul>
        <p>${lang === "ar" ? "نحن في انتظارك!" : "We look forward to welcoming you!"}</p>
      </div>
    </div>`;

    const adminHTML = `
    <div style="font-family: Arial, sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #f39c12;">
        <h3 style="color: #f39c12;">📢 ${subjectAdmin}</h3>
        <p><strong>${lang === "ar" ? "العميل" : "Customer"}:</strong> ${fullName} (${customer.email})</p>
        <p><strong>${lang === "ar" ? "المطعم" : "Restaurant"}:</strong> ${restaurant.name[lang] || restaurant.name.en}</p>
        <p><strong>${lang === "ar" ? "عدد الضيوف" : "Guests"}:</strong> ${number_of_guests}</p>
        <p><strong>${lang === "ar" ? "تاريخ الحجز" : "Reservation Date"}:</strong> ${dateStr}</p>
        <p><strong>${lang === "ar" ? "نوع الحجز" : "Type"}:</strong> ${is_walk_in ? (lang === "ar" ? "حجز مباشر" : "Walk-in") : (lang === "ar" ? "حجز مسبق" : "Reservation")}</p>
        <p>📅 ${lang === "ar" ? "تاريخ الإنشاء" : "Created At"}: ${new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</p>
      </div>
    </div>`;

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
