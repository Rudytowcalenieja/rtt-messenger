require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");

const app = express();
app.use(
  cors({ origin: process.env.CORS_ORIGIN || "http://localhost:4200" }),
);
app.use(express.json({ limit: "3mb" }));

const iconsDirectory = path.join(__dirname, "icons");
const sessions = new Map();
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
app.use("/icons", express.static(iconsDirectory));

function requireSession(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = /^Bearer ([a-f0-9]{64})$/.exec(authorization);
  const session = match ? sessions.get(match[1]) : null;

  if (!session || session.expiresAt <= Date.now()) {
    if (match) sessions.delete(match[1]);
    return res.status(401).json({ error: "Authentication required" });
  }

  req.authenticatedUserId = session.userId;
  req.sessionToken = match[1];
  next();
}

function createSession(userId) {
  for (const [token, session] of sessions) {
    if (session.expiresAt <= Date.now()) sessions.delete(token);
  }

  const accessToken = crypto.randomBytes(32).toString("hex");
  sessions.set(accessToken, {
    userId,
    expiresAt: Date.now() + sessionLifetimeMs,
  });
  return accessToken;
}

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
    const accessToken = createSession(rows[0].id);
    res.status(201).json({ ...rows[0], access_token: accessToken });
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

    // Check if the user is an admin
    const { rows: adminRows } = await pool.query(
      "SELECT user_id FROM admin WHERE user_id = $1",
      [user.id],
    );
    const isAdmin = adminRows.length > 0;

    // Remove the password from the response
    delete user.password;
    const accessToken = createSession(user.id);
    res.json({ ...user, access_token: accessToken, is_admin: isAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.delete("/api/session", requireSession, (req, res) => {
  sessions.delete(req.sessionToken);
  res.status(204).end();
});

app.put("/api/users/:id/icon", requireSession, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  if (req.authenticatedUserId !== userId) {
    return res.status(403).json({ error: "Cannot update another user's icon" });
  }

  const image = req.body?.image;
  let imageBuffer = null;
  let extension = null;
  if (image !== null) {
    const match =
      typeof image === "string" &&
      /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(image);
    if (!match) {
      return res.status(400).json({ error: "Invalid profile icon" });
    }

    imageBuffer = Buffer.from(match[2], "base64");
    if (imageBuffer.length === 0 || imageBuffer.length > 2 * 1024 * 1024) {
      return res
        .status(400)
        .json({ error: "Profile icon must be 2 MB or smaller" });
    }
    const isValidImage =
      (match[1] === "png" &&
        imageBuffer
          .subarray(0, 8)
          .equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          )) ||
      (match[1] === "jpeg" &&
        imageBuffer[0] === 0xff &&
        imageBuffer[1] === 0xd8 &&
        imageBuffer[2] === 0xff) ||
      (match[1] === "webp" &&
        imageBuffer.toString("ascii", 0, 4) === "RIFF" &&
        imageBuffer.toString("ascii", 8, 12) === "WEBP");
    if (!isValidImage) {
      return res
        .status(400)
        .json({ error: "Profile icon content does not match its image type" });
    }
    extension = match[1] === "jpeg" ? "jpg" : match[1];
  }

  const filename = imageBuffer
    ? `${crypto.randomBytes(16).toString("hex")}.${extension}`
    : null;
  const iconAddress = filename ? `/icons/${filename}` : null;
  const iconPath = filename ? path.join(iconsDirectory, filename) : null;

  try {
    if (imageBuffer && iconPath) {
      await fs.mkdir(iconsDirectory, { recursive: true });
      await fs.writeFile(iconPath, imageBuffer, { flag: "wx" });
    }

    const { rows } = await pool.query(
      "UPDATE users SET icon_address = $1 WHERE id = $2 RETURNING icon_address",
      [iconAddress, userId],
    );
    if (rows.length === 0) {
      if (iconPath) await fs.unlink(iconPath);
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    if (iconPath) {
      try {
        await fs.unlink(iconPath);
      } catch (cleanupError) {
        if (cleanupError.code !== "ENOENT") console.error(cleanupError);
      }
    }
    console.error(err);
    res.status(500).json({ error: "Could not save profile icon" });
  }
});

app.post("/api/users/:id/isAdmin", requireSession, async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const { rows } = await pool.query(
      "SELECT user_id FROM admin WHERE id = $1",
      [userId],
    );
    res.json({ isAdmin: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not check admin status" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
