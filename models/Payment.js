// server/models/Payment.js
const mongoose = require('mongoose'); // <<< THIS LINE WAS MISSING

const PaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    mpesaCheckoutRequestID: { // From M-Pesa after STK push initiation
        type: String,
        unique: true,
        sparse: true,
    },
    mpesaMerchantRequestID: { 
        type: String,
        unique: true,
        sparse: true,
    },
    mpesaReceiptNumber: { 
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
    },
    mpesaCallbackData: { 
        type: Object,
    },
    createdAt:{
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

PaymentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
