const express = require('express');

const router = express.Router();

const { getUnpaidOrPaidInvoices, payInvoices, getTotalUnpaidInvoiceAmount, reportPayment, reportUnpaidInvoices, checkout, getUnpaidOrPaidInvoicesForAll, getUnpaidOrPaidInvoicesForhalls, getUnpaidOrPaidInvoicesForpools, getUnpaidOrPaidInvoicesForbookings, getUnpaidOrPaidInvoicesForrestaurants } = require('./Payment.Controller');


router.post('/payInvoices', payInvoices)
//router.post('/payInvoices', payInvoices)

router.get('/getUnpaidOrPaidInvoices/:id', getUnpaidOrPaidInvoices)
router.get("/getTotalUnpaidInvoiceAmount/:id", getTotalUnpaidInvoiceAmount)
router.get("/reportPayment", reportPayment)
router.get("/reportUnpaidInvoices", reportUnpaidInvoices)

router.get('/', getUnpaidOrPaidInvoicesForAll)
router.get('/hallsInvoices', getUnpaidOrPaidInvoicesForhalls)
router.get('/poolsInvoices', getUnpaidOrPaidInvoicesForpools)
router.get('/bookingsInvoices', getUnpaidOrPaidInvoicesForbookings)
router.get('/restaurantsInvoices', getUnpaidOrPaidInvoicesForrestaurants)

module.exports = router;


