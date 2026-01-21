package dto

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
