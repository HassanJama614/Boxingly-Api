// server/models/InstructorApplication.js
const mongoose = require('mongoose');

const InstructorApplicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        trim: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    phoneNumber: {
        type: String,
        required: [false, 'Phone number is optional but recommended'], // Or true if required
        trim: true,
    },
    bio: { // Experience, why they want to instruct, etc.
        type: String,
        required: [true, 'Please tell us about yourself and your experience'],
        maxlength: 1000,
    },
    proposedClassIdea: { // Optional
        type: String,
        maxlength: 500,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'declined', 'contacted'],
        default: 'pending',
    },
    submittedAt: {
        type: Date,
        default: Date.now,
    },
    reviewedAt: {
        type: Date,
    },
    reviewerNotes: { // Notes from staff
        type: String,
    }
});

module.exports = mongoose.model('InstructorApplication', InstructorApplicationSchema);