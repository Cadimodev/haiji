package handlers

import (
	"net/http"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"

	"github.com/Cadimodev/haiji/backend/internal/config"
)

func HandlerRefreshToken(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	type response struct {
		Token string `json:"token"`
	}

	refreshTokenHex, err := auth.GetBearerToken(r.Header)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't find token", err)
		return
	}

	hash, err := auth.HashPresentedRefreshHex(refreshTokenHex, cfg.RefreshPepper)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Malformed token", err)
		return
	}

	user, err := cfg.DB.GetUserFromRefreshTokenHash(r.Context(), hash)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Invalid or expired refresh token", err)
		return
	}

	accessToken, err := auth.MakeJWT(
		user.ID,
		cfg.JWTSecret,
		time.Hour,
	)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't validate token", err)
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, response{
		Token: accessToken,
	})
}

func HandlerRevokeToken(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	refreshTokenHex, err := auth.GetBearerToken(r.Header)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't find token", err)
		return
	}

	hash, err := auth.HashPresentedRefreshHex(refreshTokenHex, cfg.RefreshPepper)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Malformed token", err)
		return
	}

	err = cfg.DB.RevokeRefreshTokenByHash(r.Context(), hash)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't revoke session", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func HandlerValidateToken(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	token, err := auth.GetBearerToken(r.Header)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't find JWT", err)
		return
	}

	userID, err := auth.ValidateJWT(token, cfg.JWTSecret)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Couldn't validate JWT", err)
		return
	}

	_, err = cfg.DB.GetUserByID(r.Context(), userID)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Invalid user", err)
		return
	}

	w.WriteHeader(http.StatusOK)
}
