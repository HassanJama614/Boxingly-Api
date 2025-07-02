// server/controllers/authController.js
const User = require("../models/User"); // Ensure path is correct
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token expires in 30 days
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  const { name, email, password, username } = req.body;

  try {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    if (username) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return res
          .status(400)
          .json({
            message:
              "Username must be 3-20 alphanumeric characters or underscores.",
          });
      }
      const usernameExists = await User.findOne({
        username: username.toLowerCase(),
      }); // Check lowercase for case-insensitivity if desired
      if (usernameExists) {
        return res.status(400).json({ message: "Username already taken." });
      }
    } else {
      // Optional: Make username mandatory at signup
      // return res.status(400).json({ message: 'Username is required.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      username: username ? username.toLowerCase() : undefined, // Store lowercase username for consistency
      // profilePictureUrl and bio will use defaults from the User model
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    if (error.code === 11000) {
      // MongoDB duplicate key error
      if (error.keyPattern && error.keyPattern.username) {
        return res
          .status(400)
          .json({ message: "Username already taken (database conflict)." });
      } else if (error.keyPattern && error.keyPattern.email) {
        return res
          .status(400)
          .json({ message: "Email already registered (database conflict)." });
      }
    }
    console.error("Error during user registration:", error);
    res
      .status(500)
      .json({
        message: "Server error during registration",
        error: error.message,
      });
  }
};

// @desc    Auth user & get token (Sign In)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log(`LOGIN CONTROLLER: Attempting login for email: ${email}`); // Log incoming email

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    ); // Select password

    if (!user) {
      console.log(
        "LOGIN CONTROLLER: User not found for email:",
        email.toLowerCase()
      );
      return res.status(401).json({ message: "Invalid email or password" });
    }
    console.log(
      "LOGIN CONTROLLER: User found:",
      user.email,
      "- Role:",
      user.role
    );

    const isMatch = await user.matchPassword(password);
    console.log(
      "LOGIN CONTROLLER: Password match result for",
      user.email,
      ":",
      isMatch
    );

    if (isMatch) {
      console.log(
        "LOGIN CONTROLLER: Password matched for",
        user.email,
        ". Sending token."
      );
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profilePictureUrl: user.profilePictureUrl,
        bio: user.bio,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      console.log(
        "LOGIN CONTROLLER: Password DID NOT match for user:",
        user.email
      );
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("LOGIN CONTROLLER: Error during login:", error);
    res
      .status(500)
      .json({ message: "Server error during login", error: error.message });
  }
};

// @desc    Google OAuth authentication / callback
// @route   GET /api/auth/google/callback
// @access  Public (after redirect from Google)
exports.googleAuthCallback = (req, res) => {
  // req.user is populated by passport.authenticate
  if (!req.user) {
    // This case should ideally be handled by passport's failureRedirect
    console.error("Google auth callback - req.user not found");
    return res.redirect(
      "http://localhost:3000/signin?error=google_auth_failed"
    ); // Redirect to frontend with error
  }

  const token = generateToken(req.user._id);
  const userPayload = {
    _id: req.user._id,
    name: req.user.name,
    username: req.user.username,
    email: req.user.email,
    profilePictureUrl: req.user.profilePictureUrl,
    bio: req.user.bio,
  };

  // Send token and user data back to frontend via postMessage to opener window
  res.status(200).send(`
        <script>
            if (window.opener) {
                window.opener.postMessage({
                    type: 'GOOGLE_AUTH_SUCCESS',
                    payload: {
                        token: '${token}',
                        user: ${JSON.stringify(userPayload)}
                    }
                }, '*'); // IMPORTANT: Specify targetOrigin in production instead of '*'
                window.close();
            } else {
                // Fallback if popup wasn't opened by window.open or if opener is gone
                // This is harder to handle directly. You might redirect to a page that sets localStorage.
                // For now, logging this server-side indicates an issue with the popup flow.
                console.warn("Google OAuth: window.opener not available in callback.");
                document.body.innerHTML = "Authentication successful. Please close this window and return to the application. If you are not redirected, please check your main application window.";
            }
        </script>
    `);
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Not authorized" });
  }
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      googleId: user.googleId,
      profilePictureUrl: user.profilePictureUrl,
      bio: user.bio,
    });
  } catch (error) {
    console.error("Error fetching user profile from DB:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      name,
      username,
      bio,
      profilePictureUrl /*, password - if allowing here */,
    } = req.body;

    // Update fields if they are provided in the request body
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profilePictureUrl !== undefined)
      user.profilePictureUrl = profilePictureUrl;

    if (
      username !== undefined &&
      username.toLowerCase() !== (user.username || "").toLowerCase()
    ) {
      const normalizedUsername = username.toLowerCase();
      if (normalizedUsername !== "") {
        // Only validate and check for duplicates if setting a non-empty username
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(normalizedUsername)) {
          return res
            .status(400)
            .json({
              message:
                "Username must be 3-20 alphanumeric characters or underscores.",
            });
        }
        const usernameExists = await User.findOne({
          username: normalizedUsername,
        });
        if (
          usernameExists &&
          usernameExists._id.toString() !== user._id.toString()
        ) {
          return res.status(400).json({ message: "Username already taken." });
        }
        user.username = normalizedUsername;
      } else {
        user.username = undefined; // Allow clearing username if model supports it (sparse index)
      }
    }

    // if (password) { // Optional password update handling
    //     user.password = password;
    // }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      profilePictureUrl: updatedUser.profilePictureUrl,
      bio: updatedUser.bio,
      token: generateToken(updatedUser._id), // Return new token with updated info potential
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
      return res
        .status(400)
        .json({ message: "Username already taken (database conflict)." });
    }
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({
        message: "Server error while updating profile.",
        error: error.message,
      });
  }
};

// Other auth functions like Google redirect initiation etc., should be here if not already.
// Ensure you have the `passport.authenticate('google', ...)` calls within your routes for the /google endpoint.
