package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/auth"
	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/game"
	"github.com/Cadimodev/haiji/backend/internal/handlers"
	"github.com/Cadimodev/haiji/backend/internal/middleware"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {

	fmt.Println("Starting haiji server...")

	godotenv.Load(".env")

	platform := os.Getenv("PLATFORM")
	if platform == "" {
		log.Fatal("PLATFORM environment variable is not set")
	}

	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT environment variable is not set")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is not set")
	}

	refreshPepper := os.Getenv("REFRESH_PEPPER")
	if refreshPepper == "" {
		log.Fatal("REFRESH_PEPPER environment variable is not set")
	}

	filepathRoot := os.Getenv("FILEPATH_ROOT")
	if filepathRoot == "" {
		log.Fatal("FILEPATH_ROOT environment variable is not set")
	}

	assetsRoot := os.Getenv("ASSETS_ROOT")
	if assetsRoot == "" {
		log.Fatal("ASSETS_ROOT environment variable is not set")
	}

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL environment variable is not set")
	}

	dbConn, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening database: %s", err)
	}
	dbQueries := database.New(dbConn)

	apiCFG := config.ApiConfig{
		DB:            dbQueries,
		JWTSecret:     jwtSecret,
		Platform:      platform,
		FilepathRoot:  filepathRoot,
		AssetsRoot:    assetsRoot,
		Port:          port,
		RefreshPepper: []byte(refreshPepper),
	}

	// Rate limiters
	loginLimiter := middleware.NewRateLimiter(5, time.Minute)
	refreshLimiter := middleware.NewRateLimiter(60, time.Minute)

	mux := http.NewServeMux()

	// Static assets
	staticFS := http.FileServer(http.Dir(filepathRoot))
	mux.Handle("/static/", staticFS)
	mux.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(assetsRoot))))

	// SPA React fallback
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(filepathRoot, r.URL.Path)
		if _, err := os.Stat(path); err == nil && r.URL.Path != "/" {
			staticFS.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(filepathRoot, "index.html"))
	})

	// API endpoints
	mux.HandleFunc("POST /api/users", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerUserCreate(&apiCFG, w, r)
	})
	mux.HandleFunc("PUT /api/users", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerUserUpdate(&apiCFG, w, r)
	})
	mux.HandleFunc("GET /api/user-profile", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerUserProfile(&apiCFG, w, r)
	})
	mux.Handle("POST /api/login",
		loginLimiter.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			handlers.HandlerLogin(&apiCFG, w, r)
		})),
	)
	mux.Handle("POST /api/refresh-token",
		refreshLimiter.Middleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			handlers.HandlerRefreshToken(&apiCFG, w, r)
		})),
	)
	mux.HandleFunc("POST /api/revoke-token", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerRevokeToken(&apiCFG, w, r)
	})
	mux.HandleFunc("GET /api/validate-token", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerValidateToken(&apiCFG, w, r)
	})

	// DEV endpoints
	if platform == "dev" {
		mux.HandleFunc("POST /admin/reset", func(w http.ResponseWriter, r *http.Request) {
			handlers.HandlerReset(&apiCFG, w, r)
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

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("haiji server running on port: %s\n", port)
	log.Fatal(srv.ListenAndServe())
}
