package handlers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/google/uuid"
)

// --- Mocks ---

type MockAuthService struct {
	// Add fields if we need to mock Login/Register responses
}

func (m *MockAuthService) Register(ctx context.Context, params dto.CreateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) Login(ctx context.Context, params dto.LoginRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	return dto.UserWithTokenResponse{}, "", nil
}

type MockQuerier struct {
	database.Querier
	users         map[string]database.User
	refreshTokens map[string]database.RefreshToken
}

func (m *MockQuerier) GetUserFromRefreshTokenHash(ctx context.Context, tokenHash []byte) (database.User, error) {
	for _, rt := range m.refreshTokens {
		// In a real mock we'd compare hashes properly or map by hash.
		// For simplicity, let's assume the map key IS the hash string for this test.
		if string(rt.TokenHash) == string(tokenHash) {
			// Found token, now find user
			for _, u := range m.users {
				if u.ID == rt.UserID {
					return u, nil
				}
			}
		}
	}
	return database.User{}, errors.New("not found")
}

func (m *MockQuerier) RevokeRefreshTokenByHash(ctx context.Context, tokenHash []byte) error {
	// verify it exists
	key := string(tokenHash)
	if _, ok := m.refreshTokens[key]; ok {
		// "Revoke" it
		delete(m.refreshTokens, key)
		return nil
	}
	return nil // Idempotent or error depending on requirements, usually update returns nil if no rows updated but sqlc might differ.
	// Actually sqlc Exec returns error only on DB failure.
}

func (m *MockQuerier) GetUserByID(ctx context.Context, id uuid.UUID) (database.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return database.User{}, errors.New("not found")
}

// --- Tests ---

func TestAuthHandler_RefreshToken(t *testing.T) {
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

	handler := NewAuthHandler(mockDB, mockAuthService, cfg)

	// Prepare Data
	userID := uuid.New()
	user := database.User{
		ID:        userID,
		Email:     "test@example.com",
		Username:  "tester",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	mockDB.users[userID.String()] = user

	rawToken := "a1b2c3d4e5f6"
	hash, _ := auth.HashPresentedRefreshHex(rawToken, cfg.RefreshPepper)

	mockDB.refreshTokens[string(hash)] = database.RefreshToken{
		UserID:    userID,
		TokenHash: hash, // In real DB this is []byte, mock handles it
	}

	// Case 1: Success
	req, _ := http.NewRequest("POST", "/api/refresh", nil)
	// Add Cookie
	req.AddCookie(&http.Cookie{
		Name:  "refresh_token",
		Value: rawToken,
	})
	rr := httptest.NewRecorder()

	handler.RefreshToken(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected 200 OK, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	// Case 2: No Cookie
	req2, _ := http.NewRequest("POST", "/api/refresh", nil)
	rr2 := httptest.NewRecorder()

	handler.RefreshToken(rr2, req2)

	if rr2.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for missing cookie, got %d", rr2.Code)
	}

	// Case 3: Invalid Token (Not in DB)
	req3, _ := http.NewRequest("POST", "/api/refresh", nil)
	req3.AddCookie(&http.Cookie{
		Name:  "refresh_token",
		Value: "1234567890abcdef", // Valid hex, but not in DB
	})
	rr3 := httptest.NewRecorder()

	handler.RefreshToken(rr3, req3)

	if rr3.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for invalid token, got %d", rr3.Code)
	}
}

func TestAuthHandler_RevokeToken(t *testing.T) {
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

	handler := NewAuthHandler(mockDB, mockAuthService, cfg)

	rawToken := "112233445566"
	hash, _ := auth.HashPresentedRefreshHex(rawToken, cfg.RefreshPepper)

	// Add to DB
	mockDB.refreshTokens[string(hash)] = database.RefreshToken{
		TokenHash: hash,
	}

	// Request
	req, _ := http.NewRequest("POST", "/api/revoke", nil)
	req.AddCookie(&http.Cookie{
		Name:  "refresh_token",
		Value: rawToken,
	})
	rr := httptest.NewRecorder()

	handler.RevokeToken(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Errorf("Expected 204 No Content, got %d", rr.Code)
	}

	// Verify it's gone from DB
	if _, ok := mockDB.refreshTokens[string(hash)]; ok {
		t.Error("Token should have been removed/revoked from mock DB")
	}
}
