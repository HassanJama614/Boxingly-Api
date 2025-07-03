// server/server.js -> CORS Configuration Section

const allowedOrigins = [
    // Production Frontend Domains
    'https://boxing-website-ten.vercel.app', // Your Main Site (from previous errors)
    'https://dashboard-alpha-weld-61.vercel.app',    // <<< YOUR NEW STAFF DASHBOARD URL

    // Local Development Domains
    'http://localhost:3000',
    'http://localhost:3001'
];

const corsOptions = {
    origin: function (requestOrigin, callback) {
        console.log("CORS Check: Request from Origin ->", requestOrigin); // For debugging on Render logs
        // Allow requests with no origin OR if origin is in the allowed list
        if (!requestOrigin || allowedOrigins.indexOf(requestOrigin) !== -1) {
            console.log("CORS Check: Origin ALLOWED.");
            callback(null, true);
        } else {
            console.error('CORS Check: Origin DENIED ->', requestOrigin);
            callback(new Error('This origin is not allowed by CORS policy.'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200 // For legacy browser compatibility
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests for all routes


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