const express = require('express');
const session = require('express-session');
const passport = require('./auth/auth.js');
const authRoutes = require('./routes/authRoutes.js');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);

app.listen(4000, () => console.log('Server running on 4000'));
