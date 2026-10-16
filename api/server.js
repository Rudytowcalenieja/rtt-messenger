require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

console.log(process.env.DB_USER, process.env.DB_PORT, process.env.DB_PASSWORD);

const app = express();
app.use(cors({ origin: "http://localhost:4200" }));
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/api/users", async (req, res) => {
  const {
    firstname,
    lastname,
    username,
    password,
    date_of_birth,
    email,
    phone_number,
    country,
  } = req.body;

  // NOT NULL columns must be present
  if (
    !firstname ||
    !lastname ||
    !username ||
    !password ||
    !date_of_birth ||
    !email ||
    !country
  ) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users
         (firstname, lastname, username, password, date_of_birth, email, phone_number, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, firstname, lastname, username, email, phone_number, country, date_of_birth`,
      [
        firstname,
        lastname,
        username,
        hash,
        date_of_birth,
        email,
        phone_number || null,
        country,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/users/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM users
       WHERE username = $1 OR email = $1
       ORDER BY CASE WHEN username = $1 THEN 0 ELSE 1 END
       LIMIT 1`,
      [username],
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Remove the password from the response
    delete user.password;
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
