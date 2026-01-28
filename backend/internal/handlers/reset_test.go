package handlers

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
)

type MockResetQuerier struct {
	database.Querier
	shouldFail bool
}

func (m *MockResetQuerier) Reset(ctx context.Context) error {
	if m.shouldFail {
		return errors.New("database error")
	}
	return nil
}

func TestSystemHandler_Reset(t *testing.T) {
	// Case 1: Forbidden in non-dev environment
	t.Run("Forbidden in prod", func(t *testing.T) {
		cfg := &config.ApiConfig{Platform: "prod"}
		mockDB := &MockResetQuerier{}
		handler := NewSystemHandler(mockDB, cfg)

		req, _ := http.NewRequest("POST", "/api/reset", nil)
		rr := httptest.NewRecorder()

		handler.Reset(rr, req)

		if rr.Code != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden, got %d", rr.Code)
		}
	})

	// Case 2: Success in dev environment
	t.Run("Success in dev", func(t *testing.T) {
		cfg := &config.ApiConfig{Platform: "dev"}
		mockDB := &MockResetQuerier{}
		handler := NewSystemHandler(mockDB, cfg)

		req, _ := http.NewRequest("POST", "/api/reset", nil)
		rr := httptest.NewRecorder()

		handler.Reset(rr, req)

		if rr.Code != http.StatusOK {
			t.Errorf("Expected 200 OK, got %d", rr.Code)
		}
	})

	// Case 3: Database error handling
	t.Run("Database error", func(t *testing.T) {
		cfg := &config.ApiConfig{Platform: "dev"}
		mockDB := &MockResetQuerier{shouldFail: true}
		handler := NewSystemHandler(mockDB, cfg)

		req, _ := http.NewRequest("POST", "/api/reset", nil)
		rr := httptest.NewRecorder()

		handler.Reset(rr, req)

		if rr.Code != http.StatusInternalServerError {
			t.Errorf("Expected 500 Internal Server Error, got %d", rr.Code)
		}
	})
}
