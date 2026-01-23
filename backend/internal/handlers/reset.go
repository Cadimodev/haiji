package handlers

import (
	"net/http"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
)

type SystemHandler struct {
	db     *database.Queries
	config *config.ApiConfig
}

func NewSystemHandler(db *database.Queries, cfg *config.ApiConfig) *SystemHandler {
	return &SystemHandler{
		db:     db,
		config: cfg,
	}
}

func (h *SystemHandler) Reset(w http.ResponseWriter, r *http.Request) {
	if h.config.Platform != "dev" {
		w.WriteHeader(http.StatusForbidden)
		w.Write([]byte("Reset is only allowed in dev environment"))
		return
	}

	err := h.db.Reset(r.Context())
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Failed to reset datbase: " + err.Error()))
		return
	}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Database reset to initial state"))
}
