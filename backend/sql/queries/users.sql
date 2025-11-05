-- name: CreateUser :one
INSERT INTO users (id, created_at, updated_at, email, hashed_password, username)
VALUES (
    gen_random_uuid(),
    NOW(),
    NOW(),
    $1,
    $2,
    $3
)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1;

-- name: GetUserByUsername :one
SELECT * FROM users
WHERE username = $1;

-- name: UpdateUser :one
UPDATE users SET email = $2, hashed_password = $3, username = $4, updated_at = NOW()
WHERE id = $1
RETURNING *;