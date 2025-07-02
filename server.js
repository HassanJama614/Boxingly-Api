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
  'https://boxing-website-ten.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'https://boxing-website-l2i05t4ex-hassanjama614s-projects.vercel.app',
  'https://your-staff-dashboard.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

// Your routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/instructor-applications', instructorApplicationRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Boxing Academy API');
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;