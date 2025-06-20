const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const app = express();
const PORT = 8080;

// Create MySQL pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',         // Change this if your MySQL username is different
  password: '',         // Add your MySQL password if you have one
  multipleStatements: true
});

// Run dogwalks.sql on startup
const schema = fs.readFileSync('./part1/dogwalks.sql', 'utf8');
pool.query(schema, (err) => {
  if (err) {
    console.error('Error executing schema SQL:', err);
  } else {
    console.log('Database schema loaded.');
  }
});

// Attach pool to all requests
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Example test route
app.get('/', (req, res) => {
  res.send('API is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
