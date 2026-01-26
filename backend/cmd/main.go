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
	"github.com/Cadimodev/haiji/backend/internal/game"
	"github.com/Cadimodev/haiji/backend/internal/handlers"
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

	// Initialize dependencies
	dbQueries := database.New(dbConn)
	txManager := database.NewSqlTxManager(dbConn)
	authService := service.NewAuthService(txManager, dbQueries, apiCFG.JWTSecret, string(apiCFG.RefreshPepper), apiCFG.Platform)
	hub := game.NewHub()
	go hub.Run()

	// Initialize handlers
	userHandler := handlers.NewUserHandler(dbQueries, authService, apiCFG)
	authHandler := handlers.NewAuthHandler(dbQueries, authService, apiCFG)
	gameHandler := handlers.NewGameHandler(dbQueries, apiCFG, hub)
	systemHandler := handlers.NewSystemHandler(dbQueries, apiCFG)

	mux := router.New(apiCFG, userHandler, authHandler, gameHandler, systemHandler)

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
