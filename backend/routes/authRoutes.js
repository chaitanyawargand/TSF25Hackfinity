const express = require('express');
const passport = require('../auth/auth.js');
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {User} =require("../Datatypes/User.js");

// start OAuth login
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// OAuth callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  (req, res) => {
    const userData = {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.displayName
    };

    // Encode user info in URL (or generate JWT token)
    const query = encodeURIComponent(JSON.stringify(userData));
    res.redirect(`http://localhost:5174/oauth-success?user=${query}`);
  }
);


// Logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body; // username stored in email field
  try {
    let user = await User.findOne({ where: { email: username } });

    // User does not exist → create account
    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        email: username,
        displayName: username,
        password: hashedPassword,
      });

      // Generate JWT for newly created user
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || "supersecretkey",
        { expiresIn: "1h" }
      );

      return res.status(201).json({
        message: "User created and logged in successfully",
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      });
    }

    // User exists but has no password → Google OAuth only
    if (!user.password) {
      return res.status(400).json({
        message: "This account is linked with Google Login. Use Google Sign-In.",
      });
    }

    // Compare password for existing user
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
