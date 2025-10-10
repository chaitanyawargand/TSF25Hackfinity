const express = require('express');
const passport = require('../auth/auth.js');
const router = express.Router();

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

module.exports = router;
