// server/models/Class.js
const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a class name'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    price: {
        type: Number,
        required: [true, 'Please add a price'],
    },
    imageUrl: {
        type: String,
        required: [true, 'Please add an image URL'],
    },
    // REMOVE OLD instructor string if it existed:
    // instructor: {
    //     type: String,
    //     required: [true, 'Please assign an instructor'],
    // },
    // ADD instructorId linked to User model
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This links to your User model
        required: true, // A class must have an instructor
    },
    // To easily fetch instructor details with the class later:
    instructorName: { // Denormalized for easier display, set when class is created/updated
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Class', ClassSchema);
