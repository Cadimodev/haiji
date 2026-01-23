package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Cadimodev/haiji/backend/internal/config"
	"github.com/Cadimodev/haiji/backend/internal/database"
	"github.com/Cadimodev/haiji/backend/internal/router"
	"github.com/Cadimodev/haiji/backend/internal/service"

	_ "github.com/lib/pq"
)

func main() {
	fmt.Println("Starting haiji server...")

	apiCFG, err := config.Load()
	if err != nil {
		log.Fatalf("Error loading config: %s", err)
	}

	dbConn, err := sql.Open("postgres", apiCFG.DBURL)
	if err != nil {
		log.Fatalf("Error opening database: %s", err)
	}
	// Inject the DB query interface into the config
	apiCFG.DB = database.New(dbConn)
	apiCFG.AuthService = service.NewAuthService(apiCFG.DB, apiCFG.JWTSecret, string(apiCFG.RefreshPepper), apiCFG.Platform)

	mux := router.New(apiCFG)

	srv := &http.Server{
		Addr:    ":" + apiCFG.Port,
		Handler: mux,
	}

	// Run server in a goroutine
	go func() {
		log.Printf("haiji server running on port: %s\n", apiCFG.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Wait for interrupt signal using channel for graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}

	log.Println("Server exiting")
}
