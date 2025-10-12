const express = require('express');
const session = require('express-session');
const passport = require('./auth/auth.js');
const cors = require("cors");
const authRoutes = require('./routes/authRoutes.js');
const createNewField = require ('./routes/createNewField.js');
const createNewFlightLog= require("./routes/createNewFlightLog.js")
const getFields = require('./routes/getFields.js')
const createNewMission = require("./routes/createNewMission.js")
const app = express();



app.use(express.json());

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);
app.use('/newfield',createNewField);
app.use('/getfields',getFields);
app.use('/newflightlog',createNewFlightLog);
app.use('/newMission',createNewMission);

app.listen(4000,()=>{
  console.log(`HTTP server running on port 4000`);
})