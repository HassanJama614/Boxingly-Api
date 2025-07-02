// server/server.js
const express = require('express'); // IMPORT EXPRESS FIRST
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');

// Route Files (can come after core requires)
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const instructorApplicationRoutes = require('./routes/instructorApplicationRoutes');

// Initialize passport configuration
require('./config/passport-setup');

dotenv.config(); // Load environment variables
connectDB();     // Connect to MongoDB

const app = express(); // NOW YOU CAN INITIALIZE THE APP

// --- CORS Middleware Configuration ---
// ... (rest of your server.js code)

// --- CORS Middleware Configuration ---
// OPTION A: Simplest possible for debugging - allow ALL origins temporarily
// console.log("Applying very permissive CORS for debugging...");
// app.use(cors({ credentials: true })); // This allows all origins if no origin option is specified

// OPTION B: Specific Origins (Your previous setup, let's ensure it's robust)
const allowedOrigins = [
    'https://boxing-website-ten.vercel.app/', // Main Boxingly User App (Production)
    'http://localhost:3000', // Main Boxingly User App
    'http://localhost:3001'  // Staff Dashboard App
];

app.use(cors({
    origin: function (requestOrigin, callback) {
        console.log("CORS Check: Request Origin ->", requestOrigin); // LOG THE INCOMING ORIGIN
        if (!requestOrigin || allowedOrigins.indexOf(requestOrigin) !== -1) {
            console.log("CORS Check: Origin ALLOWED.");
            callback(null, true);
        } else {
            console.error('CORS Check: Origin DENIED ->', requestOrigin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// --- Body Parser Middleware ---
// To parse JSON request bodies
app.use(express.json());
// To parse URL-encoded request bodies (e.g., from HTML forms, though less common for APIs)
app.use(express.urlencoded({ extended: false }));

// --- Passport Middleware (for authentication strategies like Google OAuth) ---
app.use(passport.initialize());
// If you were using session-based authentication with Passport (not just JWTs from Google strategy),
// you would also include: app.use(passport.session());

// --- Mount API Routers ---
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/instructor-applications', instructorApplicationRoutes);

// --- Simple Base Route for API (Optional: good for health checks) ---
app.get('/', (req, res) => {
    res.send('Boxingly API is up and running!');
});

// --- Error Handling Middleware (Optional but Recommended) ---
// Example: A simple catch-all for unhandled errors
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err.stack);
    res.status(500).send('Something broke on the server!');
});


// --- Define Port and Start Listening ---
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    // The "MongoDB Connected..." message comes from your connectDB function in db.js
});