-- +goose Up
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  BYTEA       NOT NULL,               -- HMAC-SHA256
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  user_agent  TEXT,
  ip          INET,

  CONSTRAINT refresh_tokens_expires_after_created
    CHECK (expires_at > created_at),
  CONSTRAINT refresh_tokens_revoked_after_created
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

-- unique tokens
CREATE UNIQUE INDEX IF NOT EXISTS ux_refresh_tokens_token_hash
  ON refresh_tokens(token_hash);

-- better performance when listing active sessions
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_active
  ON refresh_tokens(user_id, expires_at)
  WHERE revoked_at IS NULL;

-- better performance for garbage collection
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expires_at
  ON refresh_tokens(expires_at);

-- better performance for user general searches
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id
  ON refresh_tokens(user_id);

-- +goose Down
DROP INDEX IF EXISTS ix_refresh_tokens_user_id;
DROP INDEX IF EXISTS ix_refresh_tokens_expires_at;
DROP INDEX IF EXISTS ix_refresh_tokens_user_active;
DROP INDEX IF EXISTS ux_refresh_tokens_token_hash;

DROP TABLE IF EXISTS refresh_tokens;
