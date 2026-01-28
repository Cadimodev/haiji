package dto

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

type CreateUserRequest struct {
	Password string `json:"password" validate:"required,min=8"`
	Email    string `json:"email" validate:"required,email"`
	Username string `json:"username" validate:"required,alphanum,min=3"`
}

func (r *CreateUserRequest) Sanitize() {
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
	r.Username = strings.TrimSpace(r.Username)
}

type UpdateUserRequest struct {
	NewPassword string `json:"newpassword" validate:"required,min=8"`
	OldPassword string `json:"oldpassword" validate:"required"`
	Email       string `json:"email" validate:"required,email"`
	Username    string `json:"username" validate:"required,alphanum,min=3"`
}

func (r *UpdateUserRequest) Sanitize() {
	r.Email = strings.ToLower(strings.TrimSpace(r.Email))
	r.Username = strings.TrimSpace(r.Username)
}

type LoginRequest struct {
	Password string `json:"password" validate:"required"`
	Username string `json:"username" validate:"required"`
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
