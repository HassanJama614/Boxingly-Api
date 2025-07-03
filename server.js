// server/server.js

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');

// Route Files
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const instructorApplicationRoutes = require('./routes/instructorApplicationRoutes');

// Initialize passport config
require('./config/passport-setup');

// Connect to DB
connectDB();

const app = express();

// --- NEW, SIMPLIFIED CORS CONFIGURATION ---
const allowedOrigins = [
    'https://boxing-website-1zpq8c4ql-hassanjama614s-projects.vercel.app', // Main Site
    'https://dashboard-r13ihnohh-hassanjama614s-projects.vercel.app',    // Staff Dashboard
    'http://localhost:3000',
    'http://localhost:3001'
];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true, // Allow cookies/authorization headers
    optionsSuccessStatus: 200 // For legacy browser compatibility with OPTIONS
};

// Use the CORS middleware with these options
app.use(cors(corsOptions));

// Some frameworks/proxies send OPTIONS requests before POST/PUT/DELETE.
// This handles those preflight requests explicitly, ensuring they pass.
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// --- END CORS CONFIGURATION ---


// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Passport Middleware
app.use(passport.initialize());

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/instructor-applications', instructorApplicationRoutes);

// Base Route for Health Check
app.get('/', (req, res) => {
    res.send('Boxingly API is alive and running!');
});

// Simple Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Error Caught:", err.stack);
    res.status(500).json({ message: 'Something broke on the server!', error: err.message });
});

// Define Port and Start Listening (for Render)
const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});