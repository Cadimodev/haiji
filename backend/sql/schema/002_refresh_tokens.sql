-- +goose Up
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  user_agent TEXT,
  ip         INET
);

ALTER TABLE refresh_tokens
  ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_idx    ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_expires_idx ON refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS refresh_tokens_not_revoked_idx
  ON refresh_tokens(user_id)
  WHERE revoked_at IS NULL;

-- +goose Down
DROP INDEX IF EXISTS refresh_tokens_not_revoked_idx;
DROP INDEX IF EXISTS refresh_tokens_expires_idx;
DROP INDEX IF EXISTS refresh_tokens_user_idx;

ALTER TABLE refresh_tokens
  DROP CONSTRAINT IF EXISTS refresh_tokens_token_key;

DROP TABLE IF EXISTS refresh_tokens;
