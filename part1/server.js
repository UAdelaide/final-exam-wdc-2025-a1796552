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

function insertSampleData() {
  pool.query(`
    INSERT INTO Users (username, email, password_hash, role) VALUES
      ('alice123', 'alice@example.com', 'hashed123', 'owner'),
      ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
      ('carol123', 'carol@example.com', 'hashed789', 'owner'),
      ('sunny', 'sunny@example.com', 'hashed111', 'owner'),
      ('jakecharles', 'jakecharles@example.com', 'hashed222', 'walker')
  `, (err) => {
    if (err) return console.error('Error inserting users:', err);

    pool.query(`
      INSERT INTO Dogs (owner_id, name, size) VALUES
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'sunny'), 'Coco', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Milo', 'small'),
        ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Buddy', 'medium')
    `, (err) => {
      if (err) return console.error('Error inserting dogs:', err);

      pool.query(`
        INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
          ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
          ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
          ((SELECT dog_id FROM Dogs WHERE name = 'Coco'), '2025-06-11 07:30:00', 60, 'Kensington', 'open'),
          ((SELECT dog_id FROM Dogs WHERE name = 'Milo'), '2025-06-11 11:00:00', 20, 'Main Street', 'cancelled'),
          ((SELECT dog_id FROM Dogs WHERE name = 'Buddy'), '2025-06-12 14:15:00', 40, 'Parkside', 'open')
      `, (err) => {
        if (err) return console.error('Error inserting walk requests:', err);
        console.log('Sample data inserted');
      });
    });
  });
}

const schema = fs.readFileSync('./dogwalks.sql', 'utf8');
pool.query(schema, (err) => {
  if (err) {
    console.error('Error executing schema SQL:', err);
  } else {
    console.log('Database schema loaded.');
    insertSampleData();
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

app.get('/api/walkrequests/open', (req, res) => {
  const query = `
    SELECT
      WalkRequests.request_id,
      Dogs.name AS dog_name,
      WalkRequests.requested_time,
      WalkRequests.duration_minutes,
      WalkRequests.location,
      Users.username AS owner_username
    FROM WalkRequests
    JOIN Dogs ON WalkRequests.dog_id = Dogs.dog_id
    JOIN Users ON Dogs.owner_id = Users.user_id
    WHERE WalkRequests.status = 'open';
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

app.get('/api/walkers/summary', (req, res) => {
  const query = `
    SELECT
      Users.username AS walker_username,
      COUNT(WalkRatings.rating_id) AS total_ratings,
      ROUND(AVG(WalkRatings.rating), 1) AS average_rating,
      COUNT(CASE WHEN WalkRequests.status = 'completed' THEN 1 END) AS completed_walks
    FROM Users
    LEFT JOIN WalkRatings ON Users.user_id = WalkRatings.walker_id
    LEFT JOIN WalkRequests ON WalkRequests.request_id = WalkRatings.request_id
    WHERE Users.role = 'walker'
    GROUP BY Users.user_id;
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
