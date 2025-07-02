// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        // required: true, // Name is often good to have, but might come from Google later
    },
    username: {
        type: String,
        unique: true,
        sparse: true, // Allows null/undefined for multiple users if not set, but if set, must be unique
        trim: true,
        lowercase: true, // Store username in lowercase for case-insensitive uniqueness and lookups
        match: [/^[a-zA-Z0-9_]{3,20}$/, 'Username must be 3-20 alphanumeric characters or underscores.'],
        // Not strictly required here, can be set later via profile update
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address'],
        lowercase: true, // Store email in lowercase
    },
    password: {
        type: String,
        required: function() { return !this.googleId; }, // Required only if not a Google sign-in user
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false, // By default, don't return password field in queries
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple nulls if googleId is not set
    },
    profilePictureUrl: {
        type: String,
        default: '/images/default-avatar.png' // Default path relative to client's public folder
    },
    bio: {
        type: String,
        maxlength: [250, 'Bio cannot be more than 250 characters'], // Example max length
        default: ''
    },
    role: {
        type: String,
        enum: ['user', 'instructor', 'staff', 'admin'], // Define possible roles
        default: 'user' // Default role for new users
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // You might add other fields like 'isVerified', 'passwordResetToken', etc. later
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified (or is new)
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false; // If user signed up with Google, password might not exist
    return await bcrypt.compare(enteredPassword, this.password);
};

// Ensure virtual fields or methods don't try to access password if select: false
// (This is generally handled by Mongoose if 'select: false' is respected in queries)

module.exports = mongoose.model('User', UserSchema);