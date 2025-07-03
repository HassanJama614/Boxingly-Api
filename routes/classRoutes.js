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
router.get('/', getPublicClasses);

// --- Protected Routes for Class Management ---
const manageRouter = express.Router();

manageRouter.post('/', protect, authorize('admin', 'staff', 'instructor'), createClass);
manageRouter.get('/my-classes', protect, authorize('instructor', 'admin', 'staff'), getMyClasses);
manageRouter.get('/:id', protect, getManagedClassById);
manageRouter.put('/:id', protect, updateClass);
manageRouter.delete('/:id', protect, deleteClass);

// Mount the manageRouter under /manage
router.use('/manage', manageRouter);

module.exports = router;