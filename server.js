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

// =======================================================
// === CORRECT ORDER: INITIALIZE APP FIRST ===
const app = express();
// =======================================================

// --- CORS Middleware Configuration ---
const allowedOrigins = [
    // Production Frontend Domains
    'https://boxing-website-ten.vercel.app', // Your Main Site
    'https://dashboard-alpha-weld-61.vercel.app',    // Your Staff Dashboard

    // Local Development Domains
    'http://localhost:3000',
    'http://localhost:3001'
];

const corsOptions = {
    origin: function (requestOrigin, callback) {
        if (!requestOrigin || allowedOrigins.indexOf(requestOrigin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('This origin is not allowed by CORS policy.'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200 // For legacy browser compatibility
};

// Use the CORS middleware with these options
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));
// --- END CORS CONFIGURATION ---


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
    if (err.message.includes('CORS')) { // More robust check
        return res.status(403).json({ message: 'Not allowed by CORS' });
    }
    res.status(500).json({ message: 'Something broke on the server!', error: err.message });
});

// --- Define Port and Start Listening (Optimized for Render) ---
const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});