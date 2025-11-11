-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  email            TEXT NOT NULL,
  username         TEXT NOT NULL,
  hashed_password  TEXT NOT NULL
);

ALTER TABLE users
  ADD CONSTRAINT users_username_len CHECK (char_length(username) >= 3),
  ADD CONSTRAINT users_password_not_empty CHECK (char_length(hashed_password) > 0);

ALTER TABLE users
  ADD CONSTRAINT users_username_key UNIQUE (username);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
  ON users (LOWER(email));

-- +goose Down
DROP INDEX IF EXISTS users_email_lower_idx;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_username_key,
  DROP CONSTRAINT IF EXISTS users_password_not_empty,
  DROP CONSTRAINT IF EXISTS users_username_len;

DROP TABLE IF EXISTS users;
