package handlers

import (
	"bytes"
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
	RegisterFn     func(ctx context.Context, params dto.CreateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	LoginFn        func(ctx context.Context, params dto.LoginRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	UpdateUserFn   func(ctx context.Context, userID uuid.UUID, params dto.UpdateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error)
	RefreshTokenFn func(ctx context.Context, refreshTokenHex string) (dto.UserWithTokenResponse, string, error)
	RevokeTokenFn  func(ctx context.Context, refreshTokenHex string) error
	GetUserFn      func(ctx context.Context, userID uuid.UUID) (dto.UserResponse, error)
}

func (m *MockAuthService) Register(ctx context.Context, params dto.CreateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	if m.RegisterFn != nil {
		return m.RegisterFn(ctx, params, userAgent, ip)
	}
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) Login(ctx context.Context, params dto.LoginRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	if m.LoginFn != nil {
		return m.LoginFn(ctx, params, userAgent, ip)
	}
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) UpdateUser(ctx context.Context, userID uuid.UUID, params dto.UpdateUserRequest, userAgent string, ip string) (dto.UserWithTokenResponse, string, error) {
	if m.UpdateUserFn != nil {
		return m.UpdateUserFn(ctx, userID, params, userAgent, ip)
	}
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) RefreshToken(ctx context.Context, refreshTokenHex string) (dto.UserWithTokenResponse, string, error) {
	if m.RefreshTokenFn != nil {
		return m.RefreshTokenFn(ctx, refreshTokenHex)
	}
	return dto.UserWithTokenResponse{}, "", nil
}

func (m *MockAuthService) RevokeToken(ctx context.Context, refreshTokenHex string) error {
	if m.RevokeTokenFn != nil {
		return m.RevokeTokenFn(ctx, refreshTokenHex)
	}
	return nil
}

func (m *MockAuthService) GetUser(ctx context.Context, userID uuid.UUID) (dto.UserResponse, error) {
	if m.GetUserFn != nil {
		return m.GetUserFn(ctx, userID)
	}
	return dto.UserResponse{}, nil
}

type MockQuerier struct {
	database.Querier
	users         map[string]database.User
	refreshTokens map[string]database.RefreshToken
}

// Stub implementation for MockQuerier as it is still required by interface
func (m *MockQuerier) GetUserByID(ctx context.Context, id uuid.UUID) (database.User, error) {
	return database.User{}, nil
}

// --- Tests ---

func TestAuthHandler_Login_Validation(t *testing.T) {
	// Setup
	mockDB := &MockQuerier{}
	mockAuthService := &MockAuthService{}
	cfg := &config.ApiConfig{}

	handler := NewAuthHandler(mockDB, mockAuthService, cfg)

	// Case: Invalid Input (Empty fields)
	// We send an empty JSON object, which should fail the "required" validation
	jsonBody := `{"username": "", "password": ""}`
	req, _ := http.NewRequest("POST", "/api/login", bytes.NewBufferString(jsonBody))
	rr := httptest.NewRecorder()

	handler.Login(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 Bad Request for invalid input, got %d. Body: %s", rr.Code, rr.Body.String())
	}
}

func TestAuthHandler_RefreshToken(t *testing.T) {
	// Setup
	mockDB := &MockQuerier{}
	mockAuthService := &MockAuthService{}
	cfg := &config.ApiConfig{
		JWTSecret:     "secret",
		RefreshPepper: []byte("pepper"),
		Platform:      "dev",
	}

	handler := NewAuthHandler(mockDB, mockAuthService, cfg)

	rawToken := "valid_token"

	// Case 1: Success
	mockAuthService.RefreshTokenFn = func(ctx context.Context, refreshTokenHex string) (dto.UserWithTokenResponse, string, error) {
		if refreshTokenHex != rawToken {
			return dto.UserWithTokenResponse{}, "", errors.New("invalid token")
		}
		return dto.UserWithTokenResponse{
			Token: "new_access_token",
		}, "", nil
	}

	req, _ := http.NewRequest("POST", "/api/refresh", nil)
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

	// Case 3: Invalid Token (Service Error)
	mockAuthService.RefreshTokenFn = func(ctx context.Context, refreshTokenHex string) (dto.UserWithTokenResponse, string, error) {
		return dto.UserWithTokenResponse{}, "", errors.New("invalid or expired refresh token")
	}

	req3, _ := http.NewRequest("POST", "/api/refresh", nil)
	req3.AddCookie(&http.Cookie{
		Name:  "refresh_token",
		Value: "invalid_token",
	})
	rr3 := httptest.NewRecorder()

	handler.RefreshToken(rr3, req3)

	if rr3.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for invalid token, got %d", rr3.Code)
	}
}

func TestAuthHandler_RevokeToken(t *testing.T) {
	// Setup
	mockDB := &MockQuerier{}
	mockAuthService := &MockAuthService{}
	cfg := &config.ApiConfig{
		JWTSecret:     "secret",
		RefreshPepper: []byte("pepper"),
		Platform:      "dev",
	}

	handler := NewAuthHandler(mockDB, mockAuthService, cfg)

	rawToken := "valid_token"

	// Case: Success
	revoked := false
	mockAuthService.RevokeTokenFn = func(ctx context.Context, refreshTokenHex string) error {
		if refreshTokenHex == rawToken {
			revoked = true
			return nil
		}
		return errors.New("not found")
	}

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
	if !revoked {
		t.Errorf("Expected service RevokeToken to be called")
	}
}

func TestAuthHandler_ValidateToken(t *testing.T) {
	// Setup
	mockDB := &MockQuerier{}
	mockAuthService := &MockAuthService{}
	cfg := &config.ApiConfig{
		JWTSecret:     "secret_for_validation",
		RefreshPepper: []byte("pepper"),
		Platform:      "dev",
	}

	handler := NewAuthHandler(mockDB, mockAuthService, cfg)

	// Generate a valid JWT
	userID := uuid.New()
	validToken, _ := auth.MakeJWT(userID, cfg.JWTSecret, time.Hour)

	// Case 1: Valid Token & User Exists
	mockAuthService.GetUserFn = func(ctx context.Context, id uuid.UUID) (dto.UserResponse, error) {
		if id == userID {
			return dto.UserResponse{ID: userID}, nil
		}
		return dto.UserResponse{}, errors.New("not found")
	}

	req, _ := http.NewRequest("GET", "/api/validate-token", nil)
	req.Header.Set("Authorization", "Bearer "+validToken)
	rr := httptest.NewRecorder()

	handler.ValidateToken(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for valid token, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	// Case 2: Missing Header
	req2, _ := http.NewRequest("GET", "/api/validate-token", nil)
	rr2 := httptest.NewRecorder()

	handler.ValidateToken(rr2, req2)

	if rr2.Code != http.StatusBadRequest {
		t.Errorf("Expected 400 BadRequest for missing header, got %d", rr2.Code)
	}

	// Case 3: Invalid Token Signature
	faketoken, _ := auth.MakeJWT(userID, "wrong_secret", time.Hour)
	req3, _ := http.NewRequest("GET", "/api/validate-token", nil)
	req3.Header.Set("Authorization", "Bearer "+faketoken)
	rr3 := httptest.NewRecorder()

	handler.ValidateToken(rr3, req3)

	if rr3.Code != http.StatusUnauthorized {
		t.Errorf("Expected 401 Unauthorized for invalid signature, got %d", rr3.Code)
	}
}
