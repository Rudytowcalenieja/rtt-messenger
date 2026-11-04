CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  country TEXT NOT NULL,
  icon_address TEXT
);
