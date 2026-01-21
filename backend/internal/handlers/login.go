package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"
	"github.com/Cadimodev/haiji/backend/internal/sessions"
)

func HandlerLogin(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	type parameters struct {
		Password string `json:"password"`
		Username string `json:"username"`
	}
	type response struct {
		User
		Token string `json:"token"`
	}

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Couldn't decode parameters", err)
		return
	}

	user, err := cfg.DB.GetUserByUsername(r.Context(), params.Username)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Incorrect username or password", err)
		return
	}

	result, err := auth.CheckPasswordHash(params.Password, user.HashedPassword)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Incorrect username or password", err)
		return
	}
	if !result {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Incorrect username or password", nil)
		return
	}

	accessToken, err := auth.MakeJWT(
		user.ID,
		cfg.JWTSecret,
		time.Hour,
	)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't create access JWT", err)
		return
	}

	ip, userAgent := utils.GetClientInfo(r)

	refreshToken, err := sessions.IssueRefreshToken(r.Context(), cfg.DB, user.ID, userAgent, ip, 60*24*time.Hour, cfg.RefreshPepper)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't save refresh token", err)
		return
	}

	utils.SetRefreshCookie(w, refreshToken, cfg.Platform != "dev")

	utils.RespondWithJSON(w, http.StatusOK, response{
		User: User{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Username:  user.Username,
		},
		Token: accessToken,
	})
}
