.PHONY: all build run test clean docker-up docker-down docker-build vet fmt

# Basic Go Commands
GO_CMD=go
BINARY_NAME=haiji-server

# Dynamic variables
DB_URL ?= $(shell grep DB_URL .env | cut -d '=' -f2)

all: test build

# Development
run:
	@echo "Running backend locally..."
	$(GO_CMD) run ./backend/cmd/main.go

# Build
build: build-backend build-frontend

build-backend:
	@echo "Building backend..."
	mkdir -p bin
	$(GO_CMD) build -o bin/$(BINARY_NAME) -v ./backend/cmd/main.go

build-frontend:
	@echo "Building frontend..."
	cd frontend && npm run build

# Testing & Quality
test: test-backend test-frontend

test-backend:
	@echo "Running backend tests..."
	$(GO_CMD) test -v -race ./backend/...

test-frontend:
	@echo "Running frontend tests..."
	cd frontend && CI=true npm test

vet:
	@echo "Running static analysis (go vet)..."
	$(GO_CMD) vet ./backend/...

lint:
	@echo "Running linter..."
	@if command -v golangci-lint >/dev/null; then \
		golangci-lint run ./backend/...; \
	else \
		echo "golangci-lint not installed. Running go vet instead..."; \
		$(GO_CMD) vet ./backend/...; \
	fi

fmt:
	@echo "Formatting code..."
	$(GO_CMD) fmt ./backend/...
fmt:
	@echo "Formatting code..."
	$(GO_CMD) fmt ./backend/...

# Database Migrations
db-status:
	@echo "Checking migration status..."
	@if [ -z "$(DB_URL)" ]; then echo "Error: DB_URL not set in .env"; exit 1; fi
	cd backend/sql/schema && goose postgres "$(DB_URL)" status

db-up:
	@echo "Running migrations up..."
	@if [ -z "$(DB_URL)" ]; then echo "Error: DB_URL not set in .env"; exit 1; fi
	cd backend/sql/schema && goose postgres "$(DB_URL)" up

db-down:
	@echo "Rolling back migration..."
	@if [ -z "$(DB_URL)" ]; then echo "Error: DB_URL not set in .env"; exit 1; fi
	cd backend/sql/schema && goose postgres "$(DB_URL)" down

db-create:
	@echo "Creating new migration..."
	@read -p "Enter migration name: " name; \
	cd backend/sql/schema && goose create $$name sql

# Docker Composition
docker-up:
	@echo "Starting services with Docker Compose..."
	docker-compose up -d

docker-down:
	@echo "Stopping services..."
	docker-compose down

docker-build:
	@echo "Rebuilding and starting services..."
	docker-compose up --build -d

docker-logs:
	docker-compose logs -f

# Frontend Helpers
install-frontend:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

run-frontend:
	@echo "Starting frontend dev server..."
	cd frontend && npm start
