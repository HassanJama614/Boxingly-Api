// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path if your models folder is different relative to middleware
require('dotenv').config();

// Protect routes - checks for valid JWT and attaches user to req
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token (id is in the payload)
            // We select '-password' to ensure the hashed password is not attached to req.user
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                // This case could happen if the user was deleted after the token was issued
                return res.status(401).json({ message: 'Not authorized, user not found with this token' });
            }

            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            console.error('Token verification failed:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Not authorized, token failed (invalid signature)' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Not authorized, token expired' });
            }
            // For other errors during token verification
            return res.status(401).json({ message: 'Not authorized, token processing error' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Authorize based on user role(s)
// Example usage: authorize('admin') or authorize('admin', 'staff')
const authorize = (...roles) => {
    return (req, res, next) => {
        // req.user should be populated by the 'protect' middleware before this runs
        if (!req.user || !req.user.role) {
            // This implies 'protect' middleware might not have run or user document has no role
            return res.status(403).json({ message: 'User role not found, authorization denied' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ // 403 Forbidden
                message: `User role '${req.user.role}' is not authorized to access this route. Allowed roles: ${roles.join(', ')}.`
            });
        }
        next(); // User has one of the required roles, proceed
    };
};

module.exports = { protect, authorize };