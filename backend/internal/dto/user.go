package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreateUserRequest struct {
	Password string `json:"password" validate:"required,min=8"`
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,alphanum,min=3"`
}

type UpdateUserRequest struct {
	NewPassword string `json:"newpassword" validate:"required,min=8"`
	OldPassword string `json:"oldpassword" validate:"required"`
	Email       string `json:"email" validate:"required,email"`
	Username    string `json:"username" validate:"required,alphanum,min=3"`
}

type LoginRequest struct {
	Password string `json:"password"`
	Username string `json:"username"`
}

type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
}

type UserWithTokenResponse struct {
	UserResponse
	Token string `json:"token"`
}
