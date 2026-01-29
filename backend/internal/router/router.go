package router

import (
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/handlers"
	"github.com/Cadimodev/haiji/backend/internal/middleware"
	"github.com/rs/cors"
)

func New(
	apiCFG *config.ApiConfig,
	userHandler *handlers.UserHandler,
	authHandler *handlers.AuthHandler,
	gameHandler *handlers.GameHandler,
	systemHandler *handlers.SystemHandler,
) http.Handler {

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
	mux.HandleFunc("POST /api/users", userHandler.Create)
	mux.Handle("PUT /api/users", authMiddleware(http.HandlerFunc(userHandler.Update)))
	mux.Handle("GET /api/user-profile", authMiddleware(http.HandlerFunc(userHandler.GetProfile)))

	mux.Handle("POST /api/login", loginLimiter.Middleware(http.HandlerFunc(authHandler.Login)))
	mux.Handle("POST /api/refresh-token", refreshLimiter.Middleware(http.HandlerFunc(authHandler.RefreshToken)))
	mux.HandleFunc("POST /api/revoke-token", authHandler.RevokeToken)
	mux.HandleFunc("GET /api/validate-token", authHandler.ValidateToken)

	// Game Endpoints
	mux.Handle("POST /api/kana-battle", authMiddleware(http.HandlerFunc(gameHandler.CreateRoom)))
	mux.HandleFunc("/api/ws", gameHandler.HandleWS)

	// DEV endpoints
	if apiCFG.Platform == "dev" {
		mux.HandleFunc("POST /admin/reset", systemHandler.Reset)
	}

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
