package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"
	"github.com/Cadimodev/haiji/backend/internal/middleware"
	"github.com/Cadimodev/haiji/backend/internal/service"
	"github.com/Cadimodev/haiji/backend/internal/sessions"
)

type UserHandler struct {
	db          *database.Queries
	authService service.AuthService
	config      *config.ApiConfig // Keep config for non-service things like Platform/JWTSecret if needed
}

func NewUserHandler(db *database.Queries, authService service.AuthService, cfg *config.ApiConfig) *UserHandler {
	return &UserHandler{
		db:          db,
		authService: authService,
		config:      cfg,
	}
}

func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {

	decoder := json.NewDecoder(r.Body)
	params := dto.CreateUserRequest{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	if err := utils.ValidateStruct(params); err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	ip, userAgent := utils.GetClientInfo(r)
	ipStr := ""
	if ip != nil {
		ipStr = ip.String()
	}

	response, refreshToken, err := h.authService.Register(r.Context(), params, userAgent, ipStr)
	if err != nil {
		if database.IsUnique(err) {
			utils.RespondWithErrorJSON(w, http.StatusConflict, "Email or username already in use", nil)
			return
		}
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't create user", err)
		return
	}

	utils.SetRefreshCookie(w, refreshToken, h.config.Platform != "dev")

	utils.RespondWithJSON(w, http.StatusCreated, response)
}

func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {

	// Auth JWT
	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// Parse body
	decoder := json.NewDecoder(r.Body)
	params := dto.UpdateUserRequest{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, "Invalid JSON", err)
		return
	}

	params.Email = strings.ToLower(strings.TrimSpace(params.Email))
	params.Username = strings.TrimSpace(params.Username)
	email := params.Email

	// Verify current pass
	user, err := h.db.GetUserByID(r.Context(), userID)
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
	user, err = h.db.UpdateUser(r.Context(), database.UpdateUserParams{
		ID:             userID,
		Email:          email,
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
	newAccess, newRefresh, err := sessions.RevokeAllAndIssueNewSession(r.Context(), h.db, userID, userAgent, ip, 60*24*time.Hour, h.config.JWTSecret, time.Hour, h.config.RefreshPepper)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't rotate session", err)
		return
	}

	utils.SetRefreshCookie(w, newRefresh, h.config.Platform != "dev")

	utils.RespondWithJSON(w, http.StatusOK, dto.UserWithTokenResponse{
		UserResponse: dto.UserResponse{
			ID:        user.ID,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Email:     user.Email,
			Username:  user.Username,
		},
		Token: newAccess,
	})
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	user, err := h.db.GetUserByID(r.Context(), userID)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Invalid user", err)
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, dto.UserResponse{
		ID:        user.ID,
		CreatedAt: user.CreatedAt,
		UpdatedAt: user.UpdatedAt,
		Email:     user.Email,
		Username:  user.Username,
	})
}
