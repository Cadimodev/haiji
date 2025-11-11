package database

import (
	"errors"

	"github.com/lib/pq"
)

func IsUniqueViolation(err error) (bool, string) {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) && string(pqErr.Code) == "23505" {
		return true, pqErr.Constraint
	}
	return false, ""
}

// Versión booleana si la prefieres
func IsUnique(err error) bool {
	ok, _ := IsUniqueViolation(err)
	return ok
}
