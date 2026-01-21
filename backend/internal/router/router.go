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
	"github.com/rs/cors"
)

func New(apiCFG *config.ApiConfig) http.Handler {
	// Rate limiters
	loginLimiter := middleware.NewRateLimiter(5, time.Minute)
	refreshLimiter := middleware.NewRateLimiter(60, time.Minute)
	authMiddleware := middleware.AuthMiddleware(apiCFG)

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
	mux.Handle("PUT /api/users", authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerUserUpdate(apiCFG, w, r)
	})))
	mux.Handle("GET /api/user-profile", authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerUserProfile(apiCFG, w, r)
	})))
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

	mux.Handle("POST /api/kana-battle", authMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := middleware.GetUserIDFromContext(r.Context())
		if !ok {
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
	})))

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		// Auth via Query Param
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

		// Retrieve username
		user, err := apiCFG.DB.GetUserByID(r.Context(), userID)
		username := "Guest"
		if err == nil {
			username = user.Username
		}

		game.ServeWs(hub, w, r, userID, username)
	})

	// CORS configuration
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{apiCFG.CorsAllowedOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		Debug:            apiCFG.Platform == "dev",
	})

	return c.Handler(mux)
}
