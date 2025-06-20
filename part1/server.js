const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const app = express();
const PORT = 8080;

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  multipleStatements: true
});

const schema = fs.readFileSync('./dogwalks.sql', 'utf8');
pool.query(schema, (err) => {
  if (err) {
    console.error('Error executing schema SQL:', err);
  } else {
    console.log('Database schema loaded.');
  }
});

app.use((req, res, next) => {
  req.pool = pool;
  next();
});

app.get('/', (req, res) => {
  res.send('API is running.');
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
