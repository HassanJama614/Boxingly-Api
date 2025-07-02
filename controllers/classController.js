// server/controllers/classController.js
const Class = require('../models/Class');
const User = require('../models/User'); // Needed to get instructor name

// @desc    Get all classes (for public display)
// @route   GET /api/classes
// @access  Public
exports.getPublicClasses = async (req, res) => {
    try {
        // If you stored instructorId, you might want to populate instructor details
        // For simplicity, we used instructorName which is denormalized
        const classes = await Class.find({}).sort({ createdAt: -1 }); // Populate if needed
        res.json(classes);
    } catch (error) {
        console.error('Error fetching public classes:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new class
// @route   POST /api/classes/manage (or just POST /api/classes if distinguishing public GET)
// @access  Private (Admin, Staff, Instructor)
exports.createClass = async (req, res) => {
    const { name, description, price, imageUrl } = req.body;
    const instructorId = req.user.id; // Logged-in user is the instructor

    try {
        const instructor = await User.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found.' });
        }

        const newClass = await Class.create({
            name,
            description,
            price,
            imageUrl,
            instructorId,
            instructorName: instructor.name || instructor.username || instructor.email, // Use available instructor identifier
        });
        res.status(201).json(newClass);
    } catch (error) {
        console.error('Error creating class:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error creating class.' });
    }
};

// @desc    Get classes for the logged-in instructor
// @route   GET /api/classes/manage/my-classes
// @access  Private (Instructor)
exports.getMyClasses = async (req, res) => {
    try {
        const classes = await Class.find({ instructorId: req.user.id }).sort({ createdAt: -1 });
        res.json(classes);
    } catch (error) {
        console.error('Error fetching my classes:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single class by ID (for editing by instructor/admin)
// @route   GET /api/classes/manage/:id
// @access  Private (Admin, Staff, Owning Instructor)
exports.getManagedClassById = async (req, res) => {
    try {
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }
        // Authorization: Check if admin/staff or if the logged-in user is the instructor of this class
        if (req.user.role === 'admin' || req.user.role === 'staff' || classDoc.instructorId.toString() === req.user.id) {
            res.json(classDoc);
        } else {
            return res.status(403).json({ message: 'Not authorized to view this class detail' });
        }
    } catch (error) {
        console.error('Error fetching single managed class:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Update a class
// @route   PUT /api/classes/manage/:id
// @access  Private (Admin, Staff, Owning Instructor)
exports.updateClass = async (req, res) => {
    const { name, description, price, imageUrl } = req.body;
    try {
        let classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Authorization: Check if admin/staff or if the logged-in user is the instructor of this class
        if (req.user.role !== 'admin' && req.user.role !== 'staff' && classDoc.instructorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this class' });
        }

        classDoc.name = name || classDoc.name;
        classDoc.description = description || classDoc.description;
        classDoc.price = price || classDoc.price;
        classDoc.imageUrl = imageUrl || classDoc.imageUrl;
        // instructorId and instructorName generally shouldn't change unless reassigning class

        const updatedClass = await classDoc.save();
        res.json(updatedClass);
    } catch (error) {
        console.error('Error updating class:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error updating class.' });
    }
};

// @desc    Delete a class
// @route   DELETE /api/classes/manage/:id
// @access  Private (Admin, Staff, Owning Instructor)
exports.deleteClass = async (req, res) => {
    try {
        const classDoc = await Class.findById(req.params.id);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Authorization check
        if (req.user.role !== 'admin' && req.user.role !== 'staff' && classDoc.instructorId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this class' });
        }

        await classDoc.deleteOne(); // Mongoose v6+
        // For older Mongoose: await classDoc.remove();
        res.json({ message: 'Class removed successfully' });
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).json({ message: 'Server error deleting class.' });
    }
};