# H a i j i (灰二)

<p align="center">
  <img src="frontend/src/assets/HaijiLogo.jpeg" width="200" alt="Haiji Logo">
</p>

**Haiji** is a modern web application designed for learning and mastering Japanese Kana (Hiragana & Katakana). It features a competitive "Battle Mode" where users can race against each other to identify characters, powered by real-time WebSockets.

The project is built with a clear separation of concerns, featuring a robust Go backend and a responsive React frontend, orchestrated via Docker.

## Key Features

*   **Learn Kana**: Interactive tables and flashcards for Hiragana and Katakana.
*   **Kana Battle**: Real-time multiplayer competition using WebSockets.
*   **User Profiles**: Manage account details and security settings.
*   **Secure Authentication**: robust JWT integration with HttpOnly cookies and refresh token rotation.

## Tech Stack

### Backend
*   **Language**: Go 1.25
*   **Database**: PostgreSQL 15
*   **Routing**: Standard `net/http` serving decoupled handlers with middleware composition
*   **Data Access**: `sqlc` for type-safe SQL queries
*   **Real-time**: `gorilla/websocket`
*   **Validation**: `go-playground/validator`
*   **Security**: Argon2id hashing, JWT, HttpOnly Cookies

### Frontend
*   **Framework**: React 19
*   **Build Tool**: Create React App (react-scripts)
*   **State Management**: React Context API
*   **Styling**: Vanilla CSS (Custom Styles)
*   **Routing**: React Router v6

### Infrastructure
*   **Containerization**: Docker & Docker Compose
*   **Reverse Proxy**: Nginx (serving frontend and proxying API)

## Prerequisites

*   [Docker](https://www.docker.com/) and Docker Compose
*   *Optional (for local dev without Docker)*:
    *   Go 1.25+ (Backend)
    *   Node.js 18+ (Frontend)
    *   PostgreSQL 15 (Database)

## Getting Started

The easiest way to run the project is using Docker Compose.

### Option 1: Docker (Recommended)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Cadimodev/haiji.git
    cd haiji
    ```

2.  **Start the services**:
    ```bash
    docker-compose up --build
    ```

3.  **Access the application**:
    *   Frontend: `http://localhost:80` (or simply `http://localhost`)
    *   Backend API: `http://localhost:8080/api`

### Option 2: Manual Setup (Local Development)

#### Backend
1.  From the project root (where `go.mod` is located).
2.  Copy `.env.example` to `.env` and configure your DB credentials.
3.  Run the server:
    ```bash
    go run ./backend/cmd/main.go
    ```

#### Frontend
1.  Navigate to `frontend/`.
2.  Install dependencies:
    ```bash
    npm install
    # or
    pnpm install
    ```
3.  Start the development server:
    ```bash
    npm start
    ```

## Project Structure

```
haiji/
├── backend/            # Go Backend
│   ├── cmd/            # Entrypoint (main.go)
│   ├── internal/       # Private code (Handlers, Database, Logic)
│   │   ├── database/   # Generated sqlc code & models
│   │   ├── handlers/   # HTTP Handlers
│   │   └── router/     # Route definitions
│   └── sql/            # SQL queries and schemas
├── frontend/           # React Frontend
│   ├── public/         # Static assets
│   └── src/            # Components, Hooks, Context, Pages
├── docker-compose.yml  # Container orchestration
└── go.mod              # Go dependencies
```

## Security Features

*   **HttpOnly Cookies**: Refresh tokens are stored securely to prevent XSS attacks.
*   **Rate Limiting**: Login and Refresh endpoints are rate-limited to prevent brute force.
*   **Input Validation**: Strict struct validation on all incoming requests.

## Screenshots
| Landing Page |
|:---:|
| ![Landing](frontend/src/assets/haiji-fuji.png) |
