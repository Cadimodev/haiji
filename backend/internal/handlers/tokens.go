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

	refreshToken, err := auth.GetBearerToken(r.Header)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't find token", err)
	}

	user, err := cfg.DB.GetUserFromRefreshToken(r.Context(), refreshToken)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't get user from refresh token", err)
	}

	accessToken, err := auth.MakeJWT(
		user.ID,
		cfg.JWTSecret,
		time.Hour,
	)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't  validate token", err)
	}

	utils.RespondWithJSON(w, http.StatusOK, response{
		Token: accessToken,
	})
}

func HandlerRevokeToken(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	refreshToken, err := auth.GetBearerToken(r.Header)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't find token", err)
		return
	}

	_, err = cfg.DB.RevokeRefreshToken(r.Context(), refreshToken)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't revoke session", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
