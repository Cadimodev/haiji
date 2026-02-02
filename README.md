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

52: ### Option 1: Docker (Recommended)
53: 
54: The easiest way. Just run:
55: ```bash
56: make docker-up
57: ```
58: This will start the database service, migrate the schema automatically, and launch both backend and frontend.
59: 
60: ### Option 2: Manual Setup (Local Development)
61: 
62: #### 1. Backend & Database
63: 1.  Ensure you have `go` and `goose` installed.
64: 2.  Configure your `.env` (copy from `.env.example`).
65: 3.  Start the database (e.g. `docker-compose up db -d`).
66: 4.  Run migrations:
67:     ```bash
68:     make db-up
69:     ```
70: 5.  Run the server:
71:     ```bash
72:     make run
73:     ```
74: 
75: #### 2. Frontend
76: 1.  Navigate to `frontend/`.
77: 2.  Install & Start:
78:     ```bash
79:     npm install && npm start
80:     ```
81: 
82: ## Database Migrations
83: 
84: We use `goose` for schema management. Check the `Makefile` for useful commands:
85: *   `make db-status`: Check migration status.
86: *   `make db-up`: Apply pending migrations.
87: *   `make db-down`: Rollback the last migration.
88: *   `make db-create`: Create a new SQL migration file.
89:

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
| | |
|:---:|:---:|
| **Landing Page** | **Kana Chart** |
| <img src="frontend/src/assets/Screenshots/Landing.png" width="400"> | <img src="frontend/src/assets/Screenshots/ChartPage.png" width="400"> |
| *Home page and mode selection* | *Complete Hiragana & Katakana reference* |
| **Practice Mode** | **Battle Landing** |
| <img src="frontend/src/assets/Screenshots/PracticePage.png" width="400"> | <img src="frontend/src/assets/Screenshots/KanaBattleLandingPage.png" width="400"> |
| *Solo practice session* | *Create or join multiplayer rooms* |
| **Battle Room** | **Kana Battle** |
| <img src="frontend/src/assets/Screenshots/KanaBattleRoom.png" width="400"> | <img src="frontend/src/assets/Screenshots/KanaBattle.png" width="400"> |
| *Lobby waiting for players* | *Real-time competitive match* |
