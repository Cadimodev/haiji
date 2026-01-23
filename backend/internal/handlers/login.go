package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/dto"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"
)

func HandlerLogin(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

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

	response, refreshToken, err := cfg.AuthService.Login(r.Context(), params, userAgent, ipStr)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	utils.SetRefreshCookie(w, refreshToken, cfg.Platform != "dev")

	utils.RespondWithJSON(w, http.StatusOK, response)
}
