// server/routes/classRoutes.js
const express = require('express');
const {
    getPublicClasses,
    createClass,
    getMyClasses,
    getManagedClassById,
    updateClass,
    deleteClass
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// --- Public Route ---
router.get('/', getPublicClasses); // GET /api/classes - for anyone to see classes

// --- Protected Routes for Class Management (Admins, Staff, Instructors) ---
const manageRouter = express.Router(); // Create a sub-router for /manage path

manageRouter.post('/', protect, authorize('admin', 'staff', 'instructor'), createClass);
manageRouter.get('/my-classes', protect, authorize('instructor', 'admin', 'staff'), getMyClasses); // Instructors see theirs, admin/staff might see all here too or via separate admin route
manageRouter.get('/:id', protect, getManagedClassById); // Authorization within controller
manageRouter.put('/:id', protect, updateClass);       // Authorization within controller
manageRouter.delete('/:id', protect, deleteClass);   // Authorization within controller

// Mount the manageRouter under /manage
router.use('/manage', manageRouter); // All routes in manageRouter will be prefixed with /api/classes/manage

module.exports = router;