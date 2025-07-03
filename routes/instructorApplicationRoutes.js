const express = require('express');
const {
    submitApplication,
    getApplications,
    updateApplicationStatus
} = require('../controllers/instructorApplicationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// === PUBLIC ROUTE ===
router.post('/', submitApplication);

// === ADMIN/STAFF PROTECTED ROUTES ===
router.get(
    '/admin',
    protect,
    authorize('admin', 'staff'),
    getApplications
);

router.put(
    '/admin/:id',
    protect,
    authorize('admin', 'staff'),
    updateApplicationStatus
);

module.exports = router;