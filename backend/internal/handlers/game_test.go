package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/game"
	"github.com/Cadimodev/haiji/backend/internal/middleware"
	"github.com/google/uuid"
)

func TestGameHandler_CreateRoom_Validation(t *testing.T) {
	// Setup
	// We don't need a real DB for validation tests bc it fails before DB calls
	hub := game.NewHub()
	go hub.Run() // Start hub to avoid blocking if we accidentally pass validation
	handler := NewGameHandler(nil, nil, hub)

	tests := []struct {
		name           string
		body           dto.CreateRoomRequest
		userInContext  bool
		expectedStatus int
	}{
		{
			name: "Valid Request",
			body: dto.CreateRoomRequest{
				Duration: 60,
				Groups:   []string{"hiragana"},
			},
			userInContext:  true,
			expectedStatus: http.StatusOK,
		},
		{
			name: "Invalid Duration (Too Short)",
			body: dto.CreateRoomRequest{
				Duration: 10, // Min is 30
				Groups:   []string{"hiragana"},
			},
			userInContext:  true,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Invalid Groups (Empty)",
			body: dto.CreateRoomRequest{
				Duration: 60,
				Groups:   []string{}, // Required min=1
			},
			userInContext:  true,
			expectedStatus: http.StatusBadRequest,
		},
		{
			name: "Unauthorized (No User in Context)",
			body: dto.CreateRoomRequest{
				Duration: 60,
				Groups:   []string{"hiragana"},
			},
			userInContext:  false,
			expectedStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Prepare Request
			bodyBytes, _ := json.Marshal(tt.body)
			req, _ := http.NewRequest("POST", "/api/kana-battle", bytes.NewBuffer(bodyBytes))

			// Add Context
			if tt.userInContext {
				ctx := context.WithValue(req.Context(), middleware.UserIDKey, uuid.New())
				req = req.WithContext(ctx)
			}

			// Execute
			rr := httptest.NewRecorder()
			handler.CreateRoom(rr, req)

			// Assert
			if rr.Code != tt.expectedStatus {
				t.Errorf("CreateRoom() status = %v, want %v", rr.Code, tt.expectedStatus)
			}
		})
	}
}
