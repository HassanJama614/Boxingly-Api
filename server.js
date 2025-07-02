const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const passport = require('passport');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const instructorApplicationRoutes = require('./routes/instructorApplicationRoutes');

require('./config/passport-setup');

dotenv.config();
connectDB();

const app = express();

const allowedOrigins = [
    'http://localhost:3000', // Your main site local dev
    'http://localhost:3001', // Your staff dashboard local dev
    // === ADD YOUR DEPLOYED FRONTEND URL(S) HERE ===
    'https://boxing-website-l2i05t4ex-hassanjama614s-projects.vercel.app',
    'https://your-staff-dashboard.vercel.app' // Add the staff dashboard URL here too when you deploy it
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
        if (!origin) return callback(null, true);
        // Check if the incoming origin is in our allowed list
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true // Important for sending/receiving cookies or auth headers
}));

// ==========================================================
// === REMOVE OR COMMENT OUT THE app.listen() BLOCK BELOW ===
// ==========================================================


const port = process.env.PORT || 5001;
const hostname = '127.0.0.1';

app.get('/', (req, res) => {
    res.send('Welcome to the Boxing Academy API');
});

app.listen(port, () => {
    console.log(`Server is running on http://${hostname}:${port}`);
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${port}`);
});


// ====================================================
// === ADD THIS LINE TO EXPORT THE APP FOR VERCEL ===
// ====================================================
module.exports = app;