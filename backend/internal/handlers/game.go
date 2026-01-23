package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/game"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"
	"github.com/Cadimodev/haiji/backend/internal/middleware"
)

type GameHandler struct {
	db     *database.Queries
	config *config.ApiConfig
	hub    *game.Hub
}

func NewGameHandler(db *database.Queries, cfg *config.ApiConfig, hub *game.Hub) *GameHandler {
	return &GameHandler{
		db:     db,
		config: cfg,
		hub:    hub,
	}
}

func (h *GameHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse body
	var params dto.CreateRoomRequest
	if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if err := utils.ValidateStruct(params); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	code := h.hub.CreateRoom(params.Duration, params.Groups, userID)

	// Return code
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"code": code})
}

func (h *GameHandler) HandleWS(w http.ResponseWriter, r *http.Request) {
	// Auth via Query Param
	tokenString := r.URL.Query().Get("token")
	if tokenString == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID, err := auth.ValidateJWT(tokenString, h.config.JWTSecret)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Retrieve username
	user, err := h.db.GetUserByID(r.Context(), userID)
	username := "Guest"
	if err == nil {
		username = user.Username
	}

	game.ServeWs(h.hub, w, r, userID, username)
}
