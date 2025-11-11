-- name: CreateRefreshToken :one
INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetActiveRefreshTokenByToken :one
SELECT * FROM refresh_tokens
WHERE token = $1
  AND revoked_at IS NULL
  AND now() < expires_at
LIMIT 1;

-- name: RevokeRefreshTokenByID :exec
UPDATE refresh_tokens SET revoked_at = now()
WHERE id = $1 AND revoked_at IS NULL;

-- name: RevokeAllRefreshTokensForUser :exec
UPDATE refresh_tokens SET revoked_at = now()
WHERE user_id = $1 AND revoked_at IS NULL;

-- name: GetUserFromRefreshToken :one
SELECT u.*
FROM refresh_tokens rt
JOIN users u ON u.id = rt.user_id
WHERE rt.token = $1
  AND rt.revoked_at IS NULL
  AND now() < rt.expires_at
LIMIT 1;

-- name: RevokeRefreshToken :exec
UPDATE refresh_tokens
SET revoked_at = now()
WHERE token = $1
  AND revoked_at IS NULL;