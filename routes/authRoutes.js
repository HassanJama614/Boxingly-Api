// server/routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const {
    registerUser,
    loginUser,
    getUserProfile,
    googleAuthCallback,
    updateUserProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router(); // <<< THIS WAS MISSING from the start of your auth routes block

// Traditional Authentication
router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: 'http://localhost:3000/signin?error=google_auth_failed',
        session: false
    }),
    googleAuthCallback
);

// User Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// Route for frontend to know if login failed via Google
router.get('/login/failed', (req, res) => {
    res.status(401).json({
      success: false,
      message: "Google authentication failed or was cancelled by user.",
    });
});

module.exports = router;