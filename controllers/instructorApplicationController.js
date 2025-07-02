// server/controllers/instructorApplicationController.js
const InstructorApplication = require('../models/InstructorApplication');
const User = require('../models/User'); // Ensure User model is imported for role updates

// @desc    Submit a new instructor application
// @route   POST /api/instructor-applications
// @access  Public
exports.submitApplication = async (req, res) => {
    console.log('\n--- Instructor Application Submission (Public) ---');
    const { name, email, phoneNumber, bio, proposedClassIdea } = req.body;
    console.log('  [1] Received data:', { name, email, phoneNumber, bio: bio?.substring(0,50)+'...', proposedClassIdea: proposedClassIdea?.substring(0,50)+'...' });

    try {
        console.log('  [2] Checking for existing pending application for email:', email);
        const existingPendingApplication = await InstructorApplication.findOne({ email, status: 'pending' });

        if (existingPendingApplication) {
            console.log('  [2a] Existing pending application found for this email.');
            return res.status(400).json({
                success: false,
                message: 'You already have a pending application. We will get back to you soon.'
            });
        }

        console.log('  [3] Creating new application document in DB...');
        const application = await InstructorApplication.create({
            name,
            email,
            phoneNumber,
            bio,
            proposedClassIdea
        });
        console.log('  [4] Application document created successfully. ID:', application._id);

        // TODO (Future): Send an email notification to admin/staff

        console.log('  [5] Sending success (201) response to client...');
        res.status(201).json({
            success: true,
            message: 'Application submitted successfully! We will review it and get back to you.',
            data: { id: application._id } // Send minimal data back or full application
        });
        console.log('  [6] Success response sent.');

    } catch (error) {
        console.error('🔴 ERROR during instructor application submission:', error.message);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            console.error('   Validation Errors:', messages);
            return res.status(400).json({ success: false, error: messages });
        }
        // Log the full error for other cases for better debugging
        console.error('   Full Error Object:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting application. Please try again later.'
        });
    }
};


// @desc    Get all instructor applications (for admin/staff)
// @route   GET /api/instructor-applications/admin
// @access  Private/Admin or Private/Staff
exports.getApplications = async (req, res) => {
    console.log('\n--- Admin: Get All Instructor Applications ---');
    try {
        console.log('  [1] Fetching all applications from DB, sorting by submittedAt descending...');
        const applications = await InstructorApplication.find().sort({ submittedAt: -1 });
        console.log(`  [2] Found ${applications.length} applications.`);

        console.log('  [3] Sending success (200) response to client...');
        res.status(200).json({ success: true, count: applications.length, data: applications });
        console.log('  [4] Applications response sent.');
    } catch (error) {
        console.error('🔴 ERROR Admin: Fetching instructor applications:', error.message);
        console.error('   Full Error Object:', error);
        res.status(500).json({ success: false, message: 'Server Error Fetching Applications' });
    }
};


// @desc    Update application status (for admin/staff)
// @route   PUT /api/instructor-applications/admin/:id
// @access  Private/Admin or Private/Staff
exports.updateApplicationStatus = async (req, res) => {
    const applicationId = req.params.id;
    const { status, reviewerNotes } = req.body;

    console.log(`\n--- Admin: Update Application Status for ID: ${applicationId} ---`);
    console.log('  [1] Received request to update status to:', status, 'with Notes:', reviewerNotes || '(none)');

    if (!applicationId) {
        console.log('  [!] Application ID missing in params.');
        return res.status(400).json({ success: false, message: 'Application ID is required.' });
    }
    if (!status) {
        console.log('  [!] Status missing in request body.');
        return res.status(400).json({ success: false, message: 'Status is required to update application.' });
    }


    try {
        console.log(`  [2] Finding application by ID: ${applicationId}...`);
        let application = await InstructorApplication.findById(applicationId);

        if (!application) {
            console.log(`  [2a] Application with ID ${applicationId} not found.`);
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        console.log('  [3] Application found. Current status:', application.status, 'Applicant Email:', application.email);

        // Optional: Prevent re-processing if status isn't changing or already finalized
        // if (application.status === status) {
        //     console.log('  [3a] New status is the same as current. No update needed.');
        //     return res.status(200).json({ success: true, message: 'Status already set.', data: application });
        // }

        application.status = status;
        if (reviewerNotes !== undefined) { // Allow clearing notes with empty string
            application.reviewerNotes = reviewerNotes;
        }
        application.reviewedAt = Date.now();

        if (status === 'approved') {
            console.log('  [4] Status is "approved". Attempting to find/update user role for email:', application.email);
            const userToPromote = await User.findOne({ email: application.email.toLowerCase() }); // Ensure email lookup is case-insensitive
            if (userToPromote) {
                console.log(`  [4a] User found: ${userToPromote.email}, Current role: ${userToPromote.role}`);
                if (userToPromote.role !== 'instructor') {
                    userToPromote.role = 'instructor';
                    await userToPromote.save();
                    console.log(`  [4b] User ${userToPromote.email} successfully promoted to 'instructor'.`);
                    // TODO: Send email notification to the approved instructor
                } else {
                    console.log(`  [4b] User ${userToPromote.email} is already an 'instructor'. No role change needed.`);
                }
            } else {
                console.warn(`  [4c] WARNING: No user account found with email ${application.email} to promote to instructor role.`);
                application.reviewerNotes = (application.reviewerNotes || '') + ` [System Note: User account not found for email ${application.email} during role promotion attempt.]`;
            }
        } else {
            console.log(`  [4] Status is "${status}", no role promotion logic for this status.`);
        }

        console.log('  [5] Saving application updates to DB...');
        const updatedApplication = await application.save();
        console.log('  [6] Application updates saved. ID:', updatedApplication._id, 'New Status:', updatedApplication.status);

        console.log('  [7] Sending success (200) response to client...');
        res.status(200).json({ success: true, data: updatedApplication });
        console.log('  [8] Success response sent.');

    } catch (error) {
        console.error('🔴 ERROR Admin: Updating application status:', error.message);
        console.error('   Full Error Object:', error);
        res.status(500).json({ success: false, message: 'Server Error updating application status' });
    }
};