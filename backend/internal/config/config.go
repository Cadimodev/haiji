package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type ApiConfig struct {
	JWTSecret     string
	Platform      string
	FilepathRoot  string
	AssetsRoot    string
	Port          string
	RefreshPepper []byte

	DBURL             string
	CorsAllowedOrigin string
}

func Load() (*ApiConfig, error) {
	godotenv.Load(".env")

	port := os.Getenv("PORT")
	jwtSecret := os.Getenv("JWT_SECRET")
	refreshPepper := os.Getenv("REFRESH_PEPPER")
	platform := os.Getenv("PLATFORM")
	filepathRoot := os.Getenv("FILEPATH_ROOT")
	assetsRoot := os.Getenv("ASSETS_ROOT")
	dbURL := os.Getenv("DB_URL")
	corsAllowedOrigin := os.Getenv("CORS_ALLOWED_ORIGIN")

	if platform == "" {
		return nil, fmt.Errorf("PLATFORM environment variable is not set")
	}
	if port == "" {
		return nil, fmt.Errorf("PORT environment variable is not set")
	}
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable is not set")
	}
	if refreshPepper == "" {
		return nil, fmt.Errorf("REFRESH_PEPPER environment variable is not set")
	}
	if filepathRoot == "" {
		return nil, fmt.Errorf("FILEPATH_ROOT environment variable is not set")
	}
	if assetsRoot == "" {
		return nil, fmt.Errorf("ASSETS_ROOT environment variable is not set")
	}
	if dbURL == "" {
		return nil, fmt.Errorf("DB_URL environment variable is not set")
	}
	if corsAllowedOrigin == "" {
		return nil, fmt.Errorf("CORS_ALLOWED_ORIGIN environment variable is not set")
	}

	return &ApiConfig{
		JWTSecret:     jwtSecret,
		Platform:      platform,
		FilepathRoot:  filepathRoot,
		AssetsRoot:    assetsRoot,
		Port:          port,
		RefreshPepper: []byte(refreshPepper),

		DBURL:             dbURL,
		CorsAllowedOrigin: corsAllowedOrigin,
	}, nil
}
