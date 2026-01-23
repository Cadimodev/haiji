package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
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

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {

	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "No refresh cookie found", err)
		return
	}
	refreshTokenHex := cookie.Value

	hash, err := auth.HashPresentedRefreshHex(refreshTokenHex, h.config.RefreshPepper)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Malformed token", err)
		return
	}

	user, err := h.db.GetUserFromRefreshTokenHash(r.Context(), hash)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Invalid or expired refresh token", err)
		return
	}

	accessToken, err := auth.MakeJWT(
		user.ID,
		h.config.JWTSecret,
		time.Hour,
	)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't validate token", err)
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, dto.UserWithTokenResponse{
		UserResponse: dto.UserResponse{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Username:  user.Username,
		},
		Token: accessToken,
	})
}

func (h *AuthHandler) RevokeToken(w http.ResponseWriter, r *http.Request) {

	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		utils.ClearRefreshCookie(w, h.config.Platform != "dev")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	refreshTokenHex := cookie.Value

	hash, err := auth.HashPresentedRefreshHex(refreshTokenHex, h.config.RefreshPepper)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Malformed token", err)
		return
	}

	err = h.db.RevokeRefreshTokenByHash(r.Context(), hash)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't revoke session", err)
		return
	}

	utils.ClearRefreshCookie(w, h.config.Platform != "dev")
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) ValidateToken(w http.ResponseWriter, r *http.Request) {

	token, err := auth.GetBearerToken(r.Header)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't find JWT", err)
		return
	}

	userID, err := auth.ValidateJWT(token, h.config.JWTSecret)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Couldn't validate JWT", err)
		return
	}

	_, err = h.db.GetUserByID(r.Context(), userID)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Invalid user", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
