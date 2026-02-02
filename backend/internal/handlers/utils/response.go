package utils

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

func RespondWithErrorJSON(w http.ResponseWriter, code int, msg string, err error) {
	if err != nil {
		slog.Error("Responding with error", "code", code, "message", msg, "error", err)
	} else if code > 499 {
		slog.Error("Responding with 5XX error", "code", code, "message", msg)
	}
	type errorResponse struct {
		Error string `json:"error"`
	}
	RespondWithJSON(w, code, errorResponse{
		Error: msg,
	})
}

func RespondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	dat, err := json.Marshal(payload)
	if err != nil {
		slog.Error("Error marshalling JSON", "error", err)
		w.WriteHeader(500)
		return
	}
	w.WriteHeader(code)
	w.Write(dat)
}
