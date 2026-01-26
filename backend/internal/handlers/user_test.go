package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/middleware"
	"github.com/google/uuid"
)

// Extend MockQuerier for User Ops
func (m *MockQuerier) UpdateUser(ctx context.Context, arg database.UpdateUserParams) (database.User, error) {
	u, ok := m.users[arg.ID.String()]
	if !ok {
		return database.User{}, sql.ErrNoRows
	}

	u.Email = arg.Email
	u.Username = arg.Username
	u.HashedPassword = arg.HashedPassword
	u.UpdatedAt = time.Now()

	m.users[arg.ID.String()] = u
	return u, nil
}

func (m *MockQuerier) RevokeAllRefreshTokensForUser(ctx context.Context, userID uuid.UUID) error {
	// In mock, iterate and delete matching
	for k, rt := range m.refreshTokens {
		if rt.UserID == userID {
			delete(m.refreshTokens, k)
		}
	}
	return nil
}

func (m *MockQuerier) CreateRefreshToken(ctx context.Context, arg database.CreateRefreshTokenParams) (database.RefreshToken, error) {
	// Simple mock implementation
	rt := database.RefreshToken{
		TokenHash: arg.TokenHash,
		UserID:    arg.UserID,
		ExpiresAt: arg.ExpiresAt,
		CreatedAt: time.Now(),
	}
	// We might not need to store it for this specific test unless we verify it exists,
	// but let's store it to be safe and consistent.
	m.refreshTokens[string(arg.TokenHash)] = rt
	return rt, nil
}

func TestUserHandler_Update(t *testing.T) {
	// Setup
	mockDB := &MockQuerier{
		users:         make(map[string]database.User),
		refreshTokens: make(map[string]database.RefreshToken),
	}
	mockAuthService := &MockAuthService{}
	cfg := &config.ApiConfig{
		JWTSecret:     "secret",
		RefreshPepper: []byte("pepper"),
		Platform:      "dev",
	}

	handler := NewUserHandler(mockDB, mockAuthService, cfg)

	// Prepare User
	userID := uuid.New()
	oldPass := "old_password"
	oldHash, _ := auth.HashPassword(oldPass)

	user := database.User{
		ID:             userID,
		Email:          "old@example.com",
		Username:       "old_user",
		HashedPassword: oldHash,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}
	mockDB.users[userID.String()] = user

	// Case 1: Success
	newPass := "new_password"
	reqBody := dto.UpdateUserRequest{
		Email:       "new@example.com",
		Username:    "new_user",
		OldPassword: oldPass,
		NewPassword: newPass,
	}
	bodyBytes, _ := json.Marshal(reqBody)

	req, _ := http.NewRequest("PUT", "/api/user", bytes.NewBuffer(bodyBytes))
	// Mock Middleware Context
	ctx := context.WithValue(req.Context(), middleware.UserIDKey, userID)
	req = req.WithContext(ctx)

	rr := httptest.NewRecorder()

	handler.Update(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	// Verify DB Update
	updatedUser := mockDB.users[userID.String()]
	if updatedUser.Email != "new@example.com" {
		t.Errorf("Expected email to be updated")
	}
	match, _ := auth.CheckPasswordHash(newPass, updatedUser.HashedPassword)
	if !match {
		t.Errorf("Expected password to be updated")
	}

	// Case 2: Wrong Old Password
	reqBody2 := dto.UpdateUserRequest{
		Email:       "new@example.com",
		Username:    "new_user",
		OldPassword: "wrong_password",
		NewPassword: newPass,
	}
	bodyBytes2, _ := json.Marshal(reqBody2)

	req2, _ := http.NewRequest("PUT", "/api/user", bytes.NewBuffer(bodyBytes2))
	ctx2 := context.WithValue(req2.Context(), middleware.UserIDKey, userID)
	req2 = req2.WithContext(ctx2)

	rr2 := httptest.NewRecorder()

	handler.Update(rr2, req2)

	if rr2.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for wrong old pass, got %d", rr2.Code)
	}
}
