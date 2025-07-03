const express = require('express');
const { initiateMpesaSTKPush, mpesaCallback } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Path: POST /api/payments/mpesa-stk-push
router.post('/mpesa-stk-push', protect, initiateMpesaSTKPush);

// Path: POST /api/payments/stk-notification
router.post('/stk-notification', mpesaCallback);

module.exports = router;