package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/handlers"

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
	mux.HandleFunc("POST /api/login", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerLogin(&apiCFG, w, r)
	})
	mux.HandleFunc("POST /api/refresh-token", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerRefreshToken(&apiCFG, w, r)
	})
	mux.HandleFunc("POST /api/revoke-token", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerRevokeToken(&apiCFG, w, r)
	})
	mux.HandleFunc("GET /api/validate-token", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerValidateToken(&apiCFG, w, r)
	})

	// DEV endpoints
	mux.HandleFunc("POST /admin/reset", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandlerReset(&apiCFG, w, r)
	})

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("haiji server running on port: %s\n", port)
	log.Fatal(srv.ListenAndServe())
}
