const express = require('express');
// Added for session storing
const session = require('express-session')
const path = require('path');
require('dotenv').config();

const app = express();

// Added for session storing
app.use(session({
  secret: 'dog-secret',
  resave: false,
  saveUninitialized: false
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');

app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;