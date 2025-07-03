// server/server.js

// Load environment variables from .env file FIRST
const dotenv = require('dotenv');
dotenv.config();

// Core module imports
const express = require('express');
const cors = require('cors');
const passport = require('passport');

// Local module imports
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const instructorApplicationRoutes = require('./routes/instructorApplicationRoutes');

// Initialize passport configuration
require('./config/passport-setup');

// Connect to MongoDB
connectDB();

// Initialize Express App
const app = express();

// --- CORS Middleware Configuration ---
const allowedOrigins = [
    // Production Frontend Domains
    'https://boxing-website-ten.vercel.app', // Your Main Site Vercel URL
    'https://dashboard-r13ihnohh-hassanjama614s-projects.vercel.app', // Your Staff Dashboard Vercel URL
    // Add any other production domains here

    // Local Development Domains
    'http://localhost:3000',
    'http://localhost:3001'
];

app.use(cors({
    origin: function (requestOrigin, callback) { // The argument is named 'requestOrigin'
        console.log("CORS Check: Request from Origin ->", requestOrigin);

        // Allow requests with no origin (like Postman, mobile apps, server-to-server)
        // Use the correct variable name 'requestOrigin' here.
        if (!requestOrigin) {
            console.log("CORS Check: No origin provided. Allowing.");
            return callback(null, true);
        }

        // Check if the incoming origin is in our allowed list
        if (allowedOrigins.indexOf(requestOrigin) !== -1) {
            console.log("CORS Check: Origin ALLOWED.");
            callback(null, true);
        } else {
            console.error('CORS Check: Origin DENIED ->', requestOrigin);
            callback(new Error('This origin is not allowed by CORS policy.'));
        }
    },
    credentials: true
}));

// --- Body Parser Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Passport Middleware ---
app.use(passport.initialize());

// --- Mount API Routers ---
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/instructor-applications', instructorApplicationRoutes);

// --- Simple Base Route for API Health Check ---
app.get('/', (req, res) => {
    res.send('Boxingly API is alive and running!');
});

// --- Simple Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error("Unhandled Error Caught:", err.stack);
    // If it's the CORS error we just created, send a 403 Forbidden
    if (err.message === 'This origin is not allowed by CORS policy.') {
        return res.status(403).json({ message: err.message });
    }
    res.status(500).json({ message: 'Something broke on the server!', error: err.message });
});

// --- Define Port and Start Listening (Optimized for Render) ---
const PORT = process.env.PORT || 5001;

// Render requires binding to host '0.0.0.0'
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});