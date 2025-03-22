const express = require('express');

const router = express.Router();

const { getUnpaidOrPaidInvoices, payInvoices, getTotalUnpaidInvoiceAmount, reportPayment, reportUnpaidInvoices, checkout } = require('./Payment.Controller');


router.post('/payInvoices', payInvoices)
//router.post('/payInvoices', payInvoices)

router.get('/getUnpaidOrPaidInvoices/:id', getUnpaidOrPaidInvoices)
router.get("/getTotalUnpaidInvoiceAmount/:id", getTotalUnpaidInvoiceAmount)
router.get("/reportPayment", reportPayment)
router.get("/reportUnpaidInvoices", reportUnpaidInvoices)


module.exports = router;


