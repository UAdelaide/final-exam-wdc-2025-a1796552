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

pool.query(`
  INSERT INTO Users (username, email, password_hash, role) VALUES
    ('alice123', 'alice@example.com', 'hashed123', 'owner'),
    ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
    ('carol123', 'carol@example.com', 'hashed789', 'owner'),
    ('sunny', 'sunny@example.com', 'hashed111', 'owner'),
    ('jakecharles', 'jakecharles@example.com', 'hashed222', 'walker');
`, (err) => {
  if (err) return console.error('Error inserting users:', err);

  pool.query(`
    INSERT INTO Dogs (owner_id, name, size) VALUES
      ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
      ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
      ((SELECT user_id FROM Users WHERE username = 'sunny'), 'Coco', 'small'),
      ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Milo', 'small'),
      ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Buddy', 'medium');
  `, (err) => {
    if (err) return console.error('Error inserting dogs:', err);

    pool.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
        ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Coco'), '2025-06-11 07:30:00', 60, 'Kensington', 'open'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Milo'), '2025-06-11 11:00:00', 20, 'Main Street', 'cancelled'),
        ((SELECT dog_id FROM Dogs WHERE name = 'Buddy'), '2025-06-12 14:15:00', 40, 'Parkside', 'open');
    `, (err) => {
      if (err) return console.error('Error inserting walk requests:', err);
      console.log('✅ Sample data inserted.');
    });
  });
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
