package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/handlers/utils"
	"github.com/google/uuid"
)

type User struct {
	ID        uuid.UUID `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Email     string    `json:"email"`
}

func HandlerUserCreate(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	type parameters struct {
		Password string `json:"password"`
		Email    string `json:"email"`
	}
	type response struct {
		User
	}

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	err := decoder.Decode(&params)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't decode user", err)
	}

	hashedPass, err := auth.HashPassword(params.Password)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't hash password", err)
	}

	user, err := cfg.DB.CreateUser(r.Context(), database.CreateUserParams{
		Email:          params.Email,
		HashedPassword: hashedPass,
	})
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't create user", err)
	}

	utils.RespondWithJSON(w, http.StatusCreated, response{
		User: User{
			ID:        user.ID,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Email:     user.Email,
		},
	})
}

func HandlerUserUpdate(cfg *config.ApiConfig, w http.ResponseWriter, r *http.Request) {

	type parameters struct {
		Password string `json:"password"`
		Email    string `json:"email"`
	}
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

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	err = decoder.Decode(&params)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't decode parameters", err)
		return
	}

	hashedPassword, err := auth.HashPassword(params.Password)
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't hash password", err)
		return
	}

	user, err := cfg.DB.UpdateUser(r.Context(), database.UpdateUserParams{
		ID:             userID,
		Email:          params.Email,
		HashedPassword: hashedPassword,
	})
	if err != nil {
		utils.RespondWithErrorJSON(w, http.StatusInternalServerError, "Couldn't update user", err)
		return
	}

	utils.RespondWithJSON(w, http.StatusOK, response{
		User: User{
			ID:        user.ID,
			CreatedAt: user.CreatedAt,
			UpdatedAt: user.UpdatedAt,
			Email:     user.Email,
		},
	})

}
