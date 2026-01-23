package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"
	"github.com/Cadimodev/haiji/backend/internal/service"
)

type AuthHandler struct {
	db          *database.Queries
	authService service.AuthService
	config      *config.ApiConfig
}

func NewAuthHandler(db *database.Queries, authService service.AuthService, cfg *config.ApiConfig) *AuthHandler {
	return &AuthHandler{
		db:          db,
		authService: authService,
		config:      cfg,
	}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {

	decoder := json.NewDecoder(r.Body)
	params := dto.LoginRequest{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't decode parameters", err)
		return
	}

	ip, userAgent := utils.GetClientInfo(r)
	ipStr := ""
	if ip != nil {
		ipStr = ip.String()
	}

	response, refreshToken, err := h.authService.Login(r.Context(), params, userAgent, ipStr)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	utils.SetRefreshCookie(w, refreshToken, h.config.Platform != "dev")

	utils.RespondWithJSON(w, http.StatusOK, response)
}
