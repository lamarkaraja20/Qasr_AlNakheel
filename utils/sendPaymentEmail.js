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

export const sendPaymentEmail = async (customer, paymentDetails, lang = "en") => {
    const { payment_method, total_amount, invoice_list } = paymentDetails;
    const fullName = buildFullName(customer);
    const dateStr = new Date().toLocaleString(lang === "ar" ? "ar-EG" : "en-US");

    const subjectUser = lang === "ar" ? "تأكيد الدفع" : "Payment Confirmation";
    const subjectAdmin = lang === "ar" ? "تمت عملية دفع جديدة" : "New Payment Received";

    const invoiceTable = invoice_list.map((inv) => `
      <tr>
        <td style="border:1px solid #ccc; padding:5px">${inv.invoice_id}</td>
        <td style="border:1px solid #ccc; padding:5px">${inv.invoice_type}</td>
        <td style="border:1px solid #ccc; padding:5px">${inv.amount}</td>
      </tr>
    `).join("");

    const tableHTML = `
      <table style="border-collapse:collapse; width:100%; margin-top:10px">
        <thead>
          <tr style="background:#f2f2f2">
            <th style="border:1px solid #ccc; padding:5px">${lang === "ar" ? "رقم الفاتورة" : "Invoice ID"}</th>
            <th style="border:1px solid #ccc; padding:5px">${lang === "ar" ? "نوع" : "Type"}</th>
            <th style="border:1px solid #ccc; padding:5px">${lang === "ar" ? "المبلغ" : "Amount"}</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceTable}
        </tbody>
      </table>`;

    const userHTML = `
    <div style="font-family:Arial,sans-serif;padding:20px;background:#f8f9fa;">
      <div style="background:#fff;border-left:5px solid #27ae60;padding:20px;border-radius:10px">
        <h3 style="color:#27ae60">${subjectUser}</h3>
        <p>${lang === "ar" ? "عزيزي" : "Dear"} ${fullName},</p>
        <p>${lang === "ar" ? "تم استلام دفعتك بنجاح." : "Your payment has been successfully received."}</p>
        <p><strong>${lang === "ar" ? "طريقة الدفع" : "Payment Method"}:</strong> ${payment_method}</p>
        <p><strong>${lang === "ar" ? "إجمالي المبلغ المدفوع" : "Total Paid"}:</strong> ${total_amount}</p>
        ${tableHTML}
        <p>${lang === "ar" ? "شكراً لاستخدامك خدماتنا." : "Thank you for using our services."}</p>
        <p><strong>${lang === "ar" ? "تاريخ العملية" : "Payment Date"}:</strong> ${dateStr}</p>
      </div>
    </div>`;

    const adminHTML = `
    <div style="font-family:Arial,sans-serif;padding:20px;background:#fffbe6;">
      <div style="background:#fff;border-left:5px solid #e67e22;padding:20px;border-radius:10px">
        <h3 style="color:#e67e22">💳 ${subjectAdmin}</h3>
        <p><strong>${lang === "ar" ? "العميل" : "Customer"}:</strong> ${fullName} (${customer.email})</p>
        <p><strong>${lang === "ar" ? "طريقة الدفع" : "Method"}:</strong> ${payment_method}</p>
        <p><strong>${lang === "ar" ? "المبلغ" : "Amount"}:</strong> ${total_amount}</p>
        ${tableHTML}
        <p><strong>${lang === "ar" ? "التاريخ" : "Date"}:</strong> ${dateStr}</p>
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
