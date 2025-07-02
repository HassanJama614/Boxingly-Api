
const express = require('express');
const { initiateMpesaSTKPush, mpesaCallback } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware'); 
const router = express.Router();


router.post('/mpesa-stk-push', protect, initiateMpesaSTKPush);


router.post('/stk-notification', mpesaCallback); 

module.exports = router;
