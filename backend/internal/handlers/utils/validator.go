package utils

import (
	"fmt"
	"strings"

	"github.com/go-playground/validator/v10"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
}

func ValidateStruct(s interface{}) error {
	err := validate.Struct(s)
	if err != nil {
		if _, ok := err.(*validator.InvalidValidationError); ok {
			return err
		}

		var errors []string
		for _, err := range err.(validator.ValidationErrors) {
			switch err.Tag() {
			case "required":
				errors = append(errors, fmt.Sprintf("%s is required", err.Field()))
			case "email":
				errors = append(errors, fmt.Sprintf("%s must be a valid email", err.Field()))
			case "min":
				errors = append(errors, fmt.Sprintf("%s must be at least %s characters", err.Field(), err.Param()))
			case "alphanum":
				errors = append(errors, fmt.Sprintf("%s must contain only letters and numbers", err.Field()))
			default:
				errors = append(errors, fmt.Sprintf("%s is invalid", err.Field()))
			}
		}
		return fmt.Errorf("%s", strings.Join(errors, ", "))
	}
	return nil
}
