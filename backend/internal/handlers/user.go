package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"
	"github.com/Cadimodev/haiji/backend/internal/middleware"
	"github.com/Cadimodev/haiji/backend/internal/service"
)

type UserHandler struct {
	db          database.Querier
	authService service.AuthService
	config      *config.ApiConfig
}

func NewUserHandler(db database.Querier, authService service.AuthService, cfg *config.ApiConfig) *UserHandler {
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

	if err := utils.ValidateStruct(params); err != nil {
		utils.RespondWithErrorJSON(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	ip, userAgent := utils.GetClientInfo(r)
	ipStr := ""
	if ip != nil {
		ipStr = ip.String()
	}

	response, newRefresh, err := h.authService.UpdateUser(r.Context(), userID, params, userAgent, ipStr)
	if err != nil {
		if database.IsUnique(err) {
			utils.RespondWithErrorJSON(w, http.StatusConflict, "Email or username already in use", nil)
			return
		}
		if err.Error() == "incorrect username or password" {
			utils.RespondWithErrorJSON(w, http.StatusUnauthorized, err.Error(), nil)
			return
		}
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't update user", err)
		return
	}

	utils.SetRefreshCookie(w, newRefresh, h.config.Platform != "dev")

	utils.RespondWithJSON(w, http.StatusOK, response)
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {

	userID, ok := middleware.GetUserIDFromContext(r.Context())
	if !ok {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	userResponse, err := h.authService.GetUser(r.Context(), userID)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, "Invalid user", err)
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, userResponse)
}
