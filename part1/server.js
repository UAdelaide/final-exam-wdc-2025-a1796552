/* eslint-disable no-shadow */
const express = require('express');
const mysql = require('mysql2');
const fs = require('fs');
const app = express();
const PORT = 8080;

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'DogWalkService',
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

app.get('/api/dogs', (req, res) => {
  const query = `
    SELECT
      Dogs.name AS dog_name,
      Dogs.size AS size,
      Users.username AS owner_username
    FROM Dogs
    JOIN Users ON Dogs.owner_id = Users.user_id;
  `;

  try {
    req.pool.getConnection((err, connection) => {
      if (err) {
        res.status(500).json({ error: 'Database connection failed' });
        return;
      }

      connection.query(query, (err, results) => {
        connection.release();

        if (err) {
          res.status(500).json({ error: 'Query failed' });
        } else {
          res.json(results);
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
