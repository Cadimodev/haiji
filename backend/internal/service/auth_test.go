package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/google/uuid"
)

// MockTxManager just runs the function immediately
type MockTxManager struct {
	db database.Querier
}

func (m *MockTxManager) ExecTx(ctx context.Context, fn func(database.Querier) error) error {
	return fn(m.db)
}

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
	// Check for existing username
	if _, exists := m.users[arg.Username]; exists {
		return database.User{}, errors.New("duplicate key value violates unique constraint \"users_username_key\"")
	}

	// Check for existing email (iterate map since it's keyed by username)
	for _, u := range m.users {
		if u.Email == arg.Email {
			return database.User{}, errors.New("duplicate key value violates unique constraint \"users_email_key\"")
		}
	}

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

// Mock IssueRefreshToken - needed for Register
func (m *MockQuerier) CreateRefreshToken(ctx context.Context, arg database.CreateRefreshTokenParams) (database.RefreshToken, error) {
	return database.RefreshToken{
		TokenHash: arg.TokenHash,
		UserID:    arg.UserID,
		ExpiresAt: arg.ExpiresAt,
		CreatedAt: time.Now(),
	}, nil
}

func TestAuthService_Login(t *testing.T) {
	mockDB := &MockQuerier{
		users: make(map[string]database.User),
	}
	mockTx := &MockTxManager{db: mockDB}

	authService := NewAuthService(mockTx, mockDB, "secret", "pepper", "dev")

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

	// Case 3: Success
	// We generate a REAL hash for a known password so auth.CheckPasswordHash works.
	password := "correct_horse_battery_staple"
	validHash, _ := auth.HashPassword(password)

	mockDB.users["valid_user"] = database.User{
		ID:             uuid.New(),
		Username:       "valid_user",
		HashedPassword: validHash,
		Email:          "valid@example.com",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	resp, refreshToken, err := authService.Login(context.Background(), dto.LoginRequest{
		Username: "valid_user",
		Password: password,
	}, "user-agent", "127.0.0.1")

	if err != nil {
		t.Fatalf("Expected success, got error: %s", err)
	}
	if resp.Token == "" {
		t.Error("Expected access token, got empty string")
	}
	if refreshToken == "" {
		t.Error("Expected refresh token, got empty string")
	}
	if resp.UserResponse.Username != "valid_user" {
		t.Errorf("Expected username 'valid_user', got '%s'", resp.UserResponse.Username)
	}
}

func TestAuthService_Register(t *testing.T) {
	mockDB := &MockQuerier{
		users: make(map[string]database.User),
	}
	mockTx := &MockTxManager{db: mockDB}

	// Pre-populate a user for duplicate checks
	existingUser := database.User{
		ID:             uuid.New(),
		Username:       "existing_user",
		Email:          "existing@example.com",
		HashedPassword: "hash",
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	mockDB.users["existing_user"] = existingUser

	authService := NewAuthService(mockTx, mockDB, "secret", "pepper", "dev")

	// Case 1: Success
	resp, refreshToken, err := authService.Register(context.Background(), dto.CreateUserRequest{
		Username: "new_user",
		Email:    "new@example.com",
		Password: "secure_password",
	}, "ua", "127.0.0.1")

	if err != nil {
		t.Fatalf("Expected success, got error: %s", err)
	}
	if resp.Token == "" {
		t.Error("Expected access token")
	}
	if refreshToken == "" {
		t.Error("Expected refresh token")
	}
	if resp.UserResponse.Username != "new_user" {
		t.Errorf("Expected username 'new_user', got '%s'", resp.UserResponse.Username)
	}

	// Case 2: Duplicate Username
	_, _, err = authService.Register(context.Background(), dto.CreateUserRequest{
		Username: "existing_user",
		Email:    "other@example.com",
		Password: "password",
	}, "ua", "127.0.0.1")

	if err == nil {
		t.Error("Expected error for duplicate username, got nil")
	} else if err.Error() != "duplicate key value violates unique constraint \"users_username_key\"" {
		t.Errorf("Unexpected error msg: %s", err.Error())
	}

	// Case 3: Duplicate Email
	_, _, err = authService.Register(context.Background(), dto.CreateUserRequest{
		Username: "different_user",
		Email:    "existing@example.com", // Same as existingUser
		Password: "password",
	}, "ua", "127.0.0.1")

	if err == nil {
		t.Error("Expected error for duplicate email, got nil")
	} else if err.Error() != "duplicate key value violates unique constraint \"users_email_key\"" {
		t.Errorf("Unexpected error msg: %s", err.Error())
	}
}
