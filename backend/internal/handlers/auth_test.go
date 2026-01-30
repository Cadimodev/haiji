package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/google/uuid"
)

func TestAuthHandler_Login(t *testing.T) {
	// Setup
	mockService := &MockAuthService{}
	cfg := &config.ApiConfig{
		Platform: "dev",
	}
	// We pass nil for db because the handler logic we are testing mainly delegates to authService
	handler := NewAuthHandler(nil, mockService, cfg)

	t.Run("Success", func(t *testing.T) {
		// Mock behavior
		expectedUser := dto.UserWithTokenResponse{
			UserResponse: dto.UserResponse{
				ID:       uuid.New(),
				Username: "testuser",
				Email:    "test@example.com",
			},
			Token: "valid_jwt_token",
		}
		expectedRefresh := "valid_refresh_token"

		mockService.LoginFunc = func(ctx context.Context, params dto.LoginRequest, userAgent, ip string) (dto.UserWithTokenResponse, string, error) {
			if params.Username != "testuser" || params.Password != "password123" {
				return dto.UserWithTokenResponse{}, "", errors.New("unexpected params")
			}
			return expectedUser, expectedRefresh, nil
		}

		// Request
		reqBody := map[string]string{
			"username": "testuser",
			"password": "password123",
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		// Execute
		handler.Login(w, req)

		// Assertions
		resp := w.Result()
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}

		// Check JSON Body
		var respBody dto.UserWithTokenResponse
		json.NewDecoder(resp.Body).Decode(&respBody)
		if respBody.Token != expectedUser.Token {
			t.Errorf("Expected token %s, got %s", expectedUser.Token, respBody.Token)
		}

		// Check Cookie
		cookies := resp.Cookies()
		foundRefresh := false
		for _, c := range cookies {
			if c.Name == "refresh_token" {
				foundRefresh = true
				if c.Value != expectedRefresh {
					t.Errorf("Expected refresh cookie %s, got %s", expectedRefresh, c.Value)
				}
				if !c.HttpOnly {
					t.Error("Expected Refresh cookie to be HttpOnly")
				}
			}
		}
		if !foundRefresh {
			t.Error("Expected refresh_token cookie to be set")
		}
	})

	t.Run("Invalid Input", func(t *testing.T) {
		// Request with missing password
		reqBody := map[string]string{
			"username": "testuser",
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		// Execute
		handler.Login(w, req)

		// Assertions
		resp := w.Result()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected status 400 for invalid input, got %d", resp.StatusCode)
		}
	})

	t.Run("Service Unauthorized", func(t *testing.T) {
		// Mock behavior
		mockService.LoginFunc = func(ctx context.Context, params dto.LoginRequest, userAgent, ip string) (dto.UserWithTokenResponse, string, error) {
			return dto.UserWithTokenResponse{}, "", errors.New("incorrect username or password")
		}

		// Request
		reqBody := map[string]string{
			"username": "wronguser",
			"password": "wrongpassword",
		}
		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest("POST", "/api/login", bytes.NewBuffer(body))
		w := httptest.NewRecorder()

		// Execute
		handler.Login(w, req)

		// Assertions
		resp := w.Result()
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Expected status 401 for unauthorized, got %d", resp.StatusCode)
		}
	})
}

func TestAuthHandler_RefreshToken(t *testing.T) {
	// Setup
	mockService := &MockAuthService{}
	cfg := &config.ApiConfig{Platform: "dev"}
	handler := NewAuthHandler(nil, mockService, cfg)

	t.Run("Success", func(t *testing.T) {
		expectedUser := dto.UserWithTokenResponse{
			UserResponse: dto.UserResponse{Username: "testuser"},
			Token:        "new_access_token",
		}
		mockService.RefreshTokenFunc = func(ctx context.Context, hex string) (dto.UserWithTokenResponse, string, error) {
			if hex != "valid_refresh_hex" {
				return dto.UserWithTokenResponse{}, "", errors.New("invalid token")
			}
			return expectedUser, "", nil // empty string = no rotation
		}

		req, _ := http.NewRequest("POST", "/api/refresh-token", nil)
		req.AddCookie(&http.Cookie{Name: "refresh_token", Value: "valid_refresh_hex"})
		w := httptest.NewRecorder()

		handler.RefreshToken(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("Expected 200, got %d", w.Code)
		}
		var resp dto.UserWithTokenResponse
		json.NewDecoder(w.Body).Decode(&resp)
		if resp.Token != "new_access_token" {
			t.Errorf("Expected token new_access_token, got %s", resp.Token)
		}
	})

	t.Run("No Cookie", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/refresh-token", nil)
		w := httptest.NewRecorder()

		handler.RefreshToken(w, req)

		if w.Code != http.StatusUnauthorized {
			t.Errorf("Expected 401, got %d", w.Code)
		}
	})
}

func TestAuthHandler_RevokeToken(t *testing.T) {
	mockService := &MockAuthService{}
	cfg := &config.ApiConfig{Platform: "dev"}
	handler := NewAuthHandler(nil, mockService, cfg)

	t.Run("Success", func(t *testing.T) {
		mockService.RevokeTokenFunc = func(ctx context.Context, hex string) error {
			if hex != "valid_refresh_hex" {
				return errors.New("invalid token")
			}
			return nil
		}

		req, _ := http.NewRequest("POST", "/api/revoke-token", nil)
		req.AddCookie(&http.Cookie{Name: "refresh_token", Value: "valid_refresh_hex"})
		w := httptest.NewRecorder()

		handler.RevokeToken(w, req)

		if w.Code != http.StatusNoContent {
			t.Errorf("Expected 204, got %d", w.Code)
		}
		// Verify cookie cleared
		cleared := false
		for _, c := range w.Result().Cookies() {
			if c.Name == "refresh_token" && c.Expires.Before(time.Now()) {
				cleared = true
			}
		}
		if !cleared {
			t.Error("Expected refresh_token cookie to be cleared")
		}
	})

	t.Run("No Cookie (Idempotent)", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/api/revoke-token", nil)
		w := httptest.NewRecorder()

		handler.RevokeToken(w, req)

		// Handler logic: if no cookie, just return 204
		if w.Code != http.StatusNoContent {
			t.Errorf("Expected 204, got %d", w.Code)
		}
	})
}
