// server/routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const {
    registerUser,
    loginUser,
    getUserProfile,
    googleAuthCallback,
    updateUserProfile // Make sure this is imported
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Traditional Authentication
router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', {
        // successRedirect: 'http://localhost:3000/', // Or let the controller handle the response
        failureRedirect: 'http://localhost:3000/signin?error=google_auth_failed', // Redirect to frontend signin page on failure
        session: false // Using JWT, so no session needed from passport
    }),
    googleAuthCallback // Controller handles sending token to frontend
);

// User Profile Routes
router.route('/profile')
    .get(protect, getUserProfile)      // GET to fetch current user's profile
    .put(protect, updateUserProfile);   // PUT to update current user's profile

// Route for frontend to know if login failed via Google (if not using query params on main redirect)
router.get('/login/failed', (req, res) => {
    res.status(401).json({
      success: false,
      message: "Google authentication failed or was cancelled by user.",
    });
});

module.exports = router;