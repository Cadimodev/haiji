package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"
	"github.com/Cadimodev/haiji/backend/internal/sessions"
	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
}

func HandlerUserCreate(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	type parameters struct {
		Password string `json:"password"`
		Email    string `json:"email"`
		Username string `json:"username"`
	}
	type response struct {
		User
		Token        string `json:"token"`
		RefreshToken string `json:"refresh_token"`
	}

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	email := strings.ToLower(strings.TrimSpace(params.Email))
	username := strings.TrimSpace(params.Username)
	if email == "" || username == "" || params.Password == "" {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Missing or invalid fields", nil)
		return
	}

	hashedPass, err := auth.HashPassword(params.Password)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't hash password", err)
		return
	}

	user, err := cfg.DB.CreateUser(r.Context(), database.CreateUserParams{
		Email:          email,
		HashedPassword: hashedPass,
		Username:       username,
	})
	if err != nil {
		if database.IsUnique(err) {
			utils.RespondWithErrorJSON(w, http.StatusConflict, "Email or username already in use", nil)
			return
		}
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't create user", err)
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

	refreshToken, err := sessions.IssueRefreshToken(r.Context(), cfg.DB, user.ID, userAgent, ip, 60*24*time.Hour)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't save refresh token", err)
		return
	}

	utils.RespondWithJSON(w, http.StatusCreated, response{
		User: User{
			ID:        user.ID,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Username:  user.Username,
		},
		Token:        accessToken,
		RefreshToken: refreshToken,
	})
}

func HandlerUserUpdate(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	type parameters struct {
		NewPassword string `json:"newpassword"`
		OldPassword string `json:"oldpassword"`
		Email       string `json:"email"`
		Username    string `json:"username"`
	}
	type response struct {
		User
		Token        string `json:"token"`
		RefreshToken string `json:"refresh_token"`
	}

	// Auth JWT
	token, err := auth.GetBearerToken(r.Header)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Couldn't find JWT", err)
		return
	}
	userID, err := auth.ValidateJWT(token, cfg.JWTSecret)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Couldn't validate JWT", err)
		return
	}

	// Parse body
	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	err = decoder.Decode(&params)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	email := strings.ToLower(strings.TrimSpace(params.Email))
	username := strings.TrimSpace(params.Username)
	if email == "" || username == "" || params.NewPassword == "" {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Missing or invalid fields", nil)
		return
	}

	// Verify current pass
	user, err := cfg.DB.GetUserByID(r.Context(), userID)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Incorrect username or password", err)
		return
	}

	result, err := auth.CheckPasswordHash(params.OldPassword, user.HashedPassword)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Incorrect username or password", err)
		return
	}
	if !result {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Incorrect username or password", err)
		return
	}

	// Hash new pass
	hashedPassword, err := auth.HashPassword(params.NewPassword)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't hash password", err)
		return
	}

	// Update user
	user, err = cfg.DB.UpdateUser(r.Context(), database.UpdateUserParams{
		ID:             userID,
		Email:          strings.ToLower(strings.TrimSpace(params.Email)),
		HashedPassword: hashedPassword,
		Username:       params.Username,
	})
	if err != nil {
		if database.IsUnique(err) {
			utils.RespondWithErrorJSON(w, http.StatusConflict, "Email or username already in use", nil)
			return
		}
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't update user", err)
		return
	}

	// Revoke & generate new tokens
	ip, userAgent := utils.GetClientInfo(r)
	newAccess, newRefresh, err := sessions.RevokeAllAndIssueNewSession(
		r.Context(), cfg.DB, userID, userAgent, ip,
		60*24*time.Hour,          // refresh TTL
		cfg.JWTSecret, time.Hour, // access TTL
	)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't rotate session", err)
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, response{
		User: User{
			ID:        user.ID,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Email:     user.Email,
			Username:  user.Username,
		},
		Token:        newAccess,
		RefreshToken: newRefresh,
	})
}

func HandlerUserProfile(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	type response struct {
		User
	}

	token, err := auth.GetBearerToken(r.Header)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Couldn't find JWT", err)
		return
	}

	userID, err := auth.ValidateJWT(token, cfg.JWTSecret)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Couldn't validate JWT", err)
		return
	}

	user, err := cfg.DB.GetUserByID(r.Context(), userID)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Invalid user", err)
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, response{
		User: User{
			ID:        user.ID,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Email:     user.Email,
			Username:  user.Username,
		},
	})
}
