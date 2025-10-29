package config

import "github.com/Cadimodev/haiji/backend/internal/database"

type ApiConfig struct {
	DB           *database.Queries
	JWTSecret    string
	Platform     string
	FilepathRoot string
	AssetsRoot   string
	Port         string
}
