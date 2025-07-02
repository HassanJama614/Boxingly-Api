// server/routes/instructorApplicationRoutes.js
const express = require('express');
const {
    submitApplication,         // For users to submit their application
    getApplications,           // For admins/staff to view all applications
    updateApplicationStatus    // For admins/staff to change an application's status
} = require('../controllers/instructorApplicationController'); // Ensure this path is correct

// Import authentication and authorization middleware
// Make sure the path to authMiddleware.js is correct relative to this routes file
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// === PUBLIC ROUTE ===
// Path: POST /api/instructor-applications/
// Allows anyone to submit an application to become an instructor.
router.post('/', submitApplication);

// === ADMIN/STAFF PROTECTED ROUTES ===
// These routes are intended for use by your Staff Dashboard frontend.
// They require the user to be authenticated (logged in) and have an 'admin' or 'staff' role.

// Path: GET /api/instructor-applications/admin
// Fetches all instructor applications for review.
router.get(
    '/admin',
    protect,                       // 1. User must be logged in (valid JWT)
    authorize('admin', 'staff'),   // 2. User's role must be 'admin' OR 'staff'
    getApplications
);

// Path: PUT /api/instructor-applications/admin/:id
// Updates the status (e.g., approve, decline) of a specific application.
// :id in the path will be the MongoDB _id of the InstructorApplication document.
router.put(
    '/admin/:id',
    protect,
    authorize('admin', 'staff'),
    updateApplicationStatus
);

// Optional: Route to get a single application by ID for admin view, if needed later
// router.get(
//     '/admin/:id',
//     protect,
//     authorize('admin', 'staff'),
//     getSingleApplication // You would need to create this 'getSingleApplication' controller function
// );

module.exports = router;
