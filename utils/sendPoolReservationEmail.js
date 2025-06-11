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

export const sendPoolReservationEmail = async (customer, reservationDetails, lang = "en") => {
    const {
        pool,
        num_guests,
        start_time,
        end_time,
        notes,
    } = reservationDetails;

    const startStr = new Date(start_time).toLocaleString(lang === "ar" ? "ar-EG" : "en-US");
    const endStr = end_time
        ? new Date(end_time).toLocaleString(lang === "ar" ? "ar-EG" : "en-US")
        : lang === "ar" ? "غير محدد" : "Not specified";

    const subjectUser = lang === "ar" ? "تأكيد حجز المسبح" : "Pool Reservation Confirmation";
    const subjectAdmin = lang === "ar" ? "تم إجراء حجز مسبح جديد" : "New Pool Reservation";

    const fullName = buildFullName(customer);

    const userHTML = `
    <div style="font-family: Arial, sans-serif; background-color: #f0f8ff; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #4CAF50;">
        <h3 style="color: #4CAF50;">${subjectUser}</h3>
        <p>${lang === "ar" ? "عزيزي" : "Dear"} ${fullName || "Guest"},</p>
        <p>${lang === "ar" ? "تم تأكيد حجزك للمسبح بنجاح." : "Your pool reservation has been successfully confirmed."}</p>
        <ul>
          <li><strong>${lang === "ar" ? "المسبح" : "Pool"}:</strong> ${pool.name[lang] || pool.name.en}</li>
          <li><strong>${lang === "ar" ? "عدد الضيوف" : "Guests"}:</strong> ${num_guests}</li>
          <li><strong>${lang === "ar" ? "وقت البدء" : "Start Time"}:</strong> ${startStr}</li>
          <li><strong>${lang === "ar" ? "وقت الانتهاء" : "End Time"}:</strong> ${endStr}</li>
          ${notes ? `<li><strong>${lang === "ar" ? "ملاحظات" : "Notes"}:</strong> ${notes}</li>` : ""}
        </ul>
        <p>${lang === "ar" ? "شكرًا لاختيارك قصر النخيل." : "Thank you for choosing Qaser Al-Nakheel."}</p>
      </div>
    </div>`;

    const adminHTML = `
    <div style="font-family: Arial, sans-serif; background-color: #fffbe6; padding: 20px;">
      <div style="background: white; border-radius: 10px; padding: 20px; border-left: 5px solid #f39c12;">
        <h3 style="color: #f39c12;">📢 ${subjectAdmin}</h3>
        <p><strong>${lang === "ar" ? "العميل" : "Customer"}:</strong> ${fullName} (${customer.email})</p>
        <p><strong>${lang === "ar" ? "المسبح" : "Pool"}:</strong> ${pool.name[lang] || pool.name.en}</p>
        <p><strong>${lang === "ar" ? "عدد الضيوف" : "Guests"}:</strong> ${num_guests}</p>
        <p><strong>${lang === "ar" ? "وقت البدء" : "Start Time"}:</strong> ${startStr}</p>
        <p><strong>${lang === "ar" ? "وقت الانتهاء" : "End Time"}:</strong> ${endStr}</p>
        ${notes ? `<p><strong>${lang === "ar" ? "ملاحظات" : "Notes"}:</strong> ${notes}</p>` : ""}
        <p>📅 ${lang === "ar" ? "تاريخ الحجز" : "Reservation Date"}: ${new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US")}</p>
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
