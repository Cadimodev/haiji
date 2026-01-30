package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

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
