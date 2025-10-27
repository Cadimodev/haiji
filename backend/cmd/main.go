package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
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

	filepathRoot := os.Getenv("FILEPATH_ROOT")
	if filepathRoot == "" {
		log.Fatal("FILEPATH_ROOT environment variable is not set")
	}

	assetsRoot := os.Getenv("ASSETS_ROOT")
	if assetsRoot == "" {
		log.Fatal("ASSETS_ROOT environment variable is not set")
	}

	mux := http.NewServeMux()

	// API endpoints
	// mux.HandleFunc("/api/login", loginHandler)
	// mux.HandleFunc("/api/competitive", competitiveHandler)

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

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("haiji server running on port: %s\n", port)
	log.Fatal(srv.ListenAndServe())
}
