.PHONY: all build run test clean docker-up docker-down docker-build vet fmt

# Basic Go Commands
GO_CMD=go
BINARY_NAME=haiji-server

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

fmt:
	@echo "Formatting code..."
	$(GO_CMD) fmt ./backend/...

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
