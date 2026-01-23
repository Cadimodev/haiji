package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/google/uuid"
)

type MockQuerier struct {
	database.Querier // Embed to satisfy interface, only override what we need
	users            map[string]database.User
}

func (m *MockQuerier) GetUserByUsername(ctx context.Context, username string) (database.User, error) {
	for _, u := range m.users {
		if u.Username == username {
			return u, nil
		}
	}
	return database.User{}, errors.New("not found")
}

func (m *MockQuerier) CreateUser(ctx context.Context, arg database.CreateUserParams) (database.User, error) {
	user := database.User{
		ID:             uuid.New(),
		Email:          arg.Email,
		Username:       arg.Username,
		HashedPassword: arg.HashedPassword,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	m.users[arg.Username] = user
	return user, nil
}

// Mock CreateRefreshToken - just return success
func (m *MockQuerier) CreateRefreshToken(ctx context.Context, arg database.CreateRefreshTokenParams) (database.RefreshToken, error) {
	return database.RefreshToken{}, nil
}

func TestAuthService_Login(t *testing.T) {
	mockDB := &MockQuerier{
		users: make(map[string]database.User),
	}

	// We pass nil for dbConn because we aren't using transactions in Login
	// (or we are mocking them out if we did, but Login doesn't use BeginTx)

	authService := NewAuthService(nil, mockDB, "secret", "pepper", "dev")

	// Case 1: User Not Found
	_, _, err := authService.Login(context.Background(), dto.LoginRequest{
		Username: "ghost",
		Password: "password123",
	}, "user-agent", "127.0.0.1")

	if err == nil {
		t.Fatal("Expected error for non-existent user, got nil")
	}
	if err.Error() != "incorrect username or password" {
		t.Errorf("Expected 'incorrect username or password', got '%s'", err.Error())
	}

	// Case 2: Wrong Password
	// We insert a dummy user with a random string as hash. argon2 check will fail.
	mockDB.users["existing"] = database.User{
		ID:             uuid.New(),
		Username:       "existing",
		HashedPassword: "invalid_hash_format",
		Email:          "existing@example.com",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	_, _, err = authService.Login(context.Background(), dto.LoginRequest{
		Username: "existing",
		Password: "password123",
	}, "user-agent", "127.0.0.1")

	if err == nil {
		t.Fatal("Expected error for wrong password, got nil")
	}
	if err.Error() != "incorrect username or password" {
		t.Errorf("Expected 'incorrect username or password', got '%s'", err.Error())
	}
}
