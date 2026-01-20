package router

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/game"
	"github.com/Cadimodev/haiji/backend/internal/handlers"
	"github.com/Cadimodev/haiji/backend/internal/middleware"
)

func New(apiCFG *config.ApiConfig) *http.ServeMux {
	// Rate limiters
	loginLimiter := middleware.NewRateLimiter(5, time.Minute)
	refreshLimiter := middleware.NewRateLimiter(60, time.Minute)

	mux := http.NewServeMux()

	// Static assets
	staticFS := http.FileServer(http.Dir(apiCFG.FilepathRoot))
	mux.Handle("/static/", staticFS)
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(apiCFG.AssetsRoot))))

	// SPA React fallback
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(apiCFG.FilepathRoot, r.URL.Path)
		if _, err := os.Stat(path); err == nil && r.URL.Path != "/" {
			staticFS.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(apiCFG.FilepathRoot, "index.html"))
	})

	// API endpoints
	mux.HandleFunc("POST /api/users", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerUserCreate(apiCFG, w, r)
	})
	mux.HandleFunc("PUT /api/users", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerUserUpdate(apiCFG, w, r)
	})
	mux.HandleFunc("GET /api/user-profile", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerUserProfile(apiCFG, w, r)
	})
	mux.Handle("POST /api/login",
		loginLimiter.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			handlers.HandlerLogin(apiCFG, w, r)
		})),
	)
	mux.Handle("POST /api/refresh-token",
		refreshLimiter.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			handlers.HandlerRefreshToken(apiCFG, w, r)
		})),
	)
	mux.HandleFunc("POST /api/revoke-token", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerRevokeToken(apiCFG, w, r)
	})
	mux.HandleFunc("GET /api/validate-token", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerValidateToken(apiCFG, w, r)
	})

	// DEV endpoints
	if apiCFG.Platform == "dev" {
		mux.HandleFunc("POST /admin/reset", func(w http.ResponseWriter, r *http.Request) {
			handlers.HandlerReset(apiCFG, w, r)
		})
	}

	// Websocket
	hub := game.NewHub()
	go hub.Run()

	mux.HandleFunc("POST /api/kana-battle", func(w http.ResponseWriter, r *http.Request) {
		// Authenticate
		tokenString := r.Header.Get("Authorization")
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}
		userID, err := auth.ValidateJWT(tokenString, apiCFG.JWTSecret)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Parse body
		type req struct {
			Duration int      `json:"duration"`
			Groups   []string `json:"groups"`
		}
		var params req
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		code := hub.CreateRoom(params.Duration, params.Groups, userID)

		// Return code
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"code": code})
	})

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// Auth via Query Param (standard for WS)
		tokenString := r.URL.Query().Get("token")
		if tokenString == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := auth.ValidateJWT(tokenString, apiCFG.JWTSecret)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Retrieve username (optional, but good for display)
		user, err := apiCFG.DB.GetUserByID(r.Context(), userID)
		username := "Guest"
		if err == nil {
			username = user.Username
		}

		game.ServeWs(hub, w, r, userID, username)
	})

	return mux
}
