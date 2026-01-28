package game

import (
	"encoding/json"
	"log"
	"time"

	"github.com/google/uuid"
)

type GameState string

const (
	StateWaiting  GameState = "WAITING"
	StatePlaying  GameState = "PLAYING"
	StateFinished GameState = "FINISHED"
)

type Player struct {
	UserID   uuid.UUID `json:"userId"`
	Username string    `json:"username"`
	Score    int       `json:"score"`
}

type Room struct {
	Code      string
	Hub       *Hub
	Clients   map[*Client]bool
	Broadcast chan []byte

	// Game Config
	Duration int      // seconds
	Groups   []string // kana groups

	// State
	State   GameState
	EndTime time.Time
	Players map[uuid.UUID]*Player
	HostID  uuid.UUID

	// Lifecycle
	register     chan *Client
	unregister   chan *Client
	stopGame     chan bool
	timeFinished chan bool
	action       chan func() // Closure pattern for actions
}

type RoomValues struct {
	Clients int
	Players map[uuid.UUID]*Player
	State   GameState
}

func NewRoom(code string, hub *Hub, duration int, groups []string, hostID uuid.UUID) *Room {
	return &Room{
		Code:         code,
		Hub:          hub,
		Clients:      make(map[*Client]bool),
		Broadcast:    make(chan []byte),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		Duration:     duration,
		Groups:       groups,
		State:        StateWaiting,
		Players:      make(map[uuid.UUID]*Player),
		stopGame:     make(chan bool),
		timeFinished: make(chan bool),
		action:       make(chan func()),
		HostID:       hostID,
	}
}

func (r *Room) Run() {
	defer func() {
		// Cleanup when room dies
		r.Hub.closeRoom(r.Code)
		log.Printf("Room %s loop terminated and closed", r.Code)
	}()

	// Grace period: allow room to stay alive for 30 seconds if empty
	// (e.g. waiting for host to join, or during page refresh)
	shutdownTimer := time.NewTimer(30 * time.Second)

	for {
		select {
		case client := <-r.register:
			// Client joined, stop the shutdown timer
			if !shutdownTimer.Stop() {
				select {
				case <-shutdownTimer.C:
				default:
				}
			}

			r.Clients[client] = true
			log.Printf("Room %s registered client %s. Total clients: %d", r.Code, client.Username, len(r.Clients))
			// Add to players list if not exists (reconnection logci could be here)
			if _, exists := r.Players[client.UserID]; !exists {
				r.Players[client.UserID] = &Player{
					UserID:   client.UserID,
					Username: client.Username,
					Score:    0,
				}
			}
			client.Room = r
			r.broadcastRoomState()

		case client := <-r.unregister:
			if _, ok := r.Clients[client]; ok {
				delete(r.Clients, client)
				client.Room = nil

				// If in lobby (WAITING), remove from player list so UI updates
				if r.State == StateWaiting {
					delete(r.Players, client.UserID)
				}

				r.broadcastRoomState()

				// If empty, reset timer to wait for reconnection
				if len(r.Clients) == 0 {
					log.Printf("Room %s is empty. Waiting 30s grace period...", r.Code)
					shutdownTimer.Reset(30 * time.Second)
				}
			}

		case message := <-r.Broadcast:
			r.broadcastToClients(message)

		case <-r.timeFinished:
			if r.State != StatePlaying {
				continue
			}
			r.State = StateFinished
			log.Printf("Game in room %s finished. Broadcasting results.", r.Code)
			msg := map[string]interface{}{
				"type":    "GAME_OVER",
				"players": r.Players,
			}
			data, err := json.Marshal(msg)
			if err == nil {
				r.broadcastToClients(data)
			}

		case <-shutdownTimer.C:
			log.Printf("Room %s grace period expired. Shutting down.", r.Code)
			return

		case <-r.stopGame:
			return

		case action := <-r.action:
			action()
		}
	}
}

// GetValues allows safe inspection of room state
func (r *Room) GetValues() RoomValues {
	// Use the action channel to request state safely from the loop
	ch := make(chan RoomValues)

	action := func() {
		// Deep copy players
		playersCopy := make(map[uuid.UUID]*Player)
		for k, v := range r.Players {
			p := *v
			playersCopy[k] = &p
		}

		ch <- RoomValues{
			Clients: len(r.Clients),
			Players: playersCopy,
			State:   r.State,
		}
	}

	select {
	case r.action <- action:
		return <-ch
	case <-time.After(100 * time.Millisecond):
		return RoomValues{} // Timeout or closed
	}
}

func (r *Room) startGame() {
	if r.State != StateWaiting {
		return
	}
	r.State = StatePlaying
	r.EndTime = time.Now().Add(time.Duration(r.Duration) * time.Second)

	// Notify clients
	msg := map[string]interface{}{
		"type":    "GAME_STARTED",
		"endTime": r.EndTime,
	}
	data, err := json.Marshal(msg)
	if err == nil {
		r.broadcastToClients(data)
	}

	// Start timer to end game
	go func() {
		time.Sleep(time.Duration(r.Duration) * time.Second)
		r.finishGame()
	}()
}

func (r *Room) finishGame() {
	// Signal Run loop to finish game safely
	select {
	case r.timeFinished <- true:
	default:
	}
}

func (r *Room) handleRoomMessage(client *Client, msg []byte) {
	var payload struct {
		Type string `json:"type"`
		// For submit score
		Score int `json:"score"`
	}
	if err := json.Unmarshal(msg, &payload); err != nil {
		return
	}

	// Send closure to be executed in Run loop
	action := func() {
		switch payload.Type {
		case "START_GAME":
			// Only host can start
			if client.UserID != r.HostID {
				return
			}
			r.startGame()

		case "SUBMIT_SCORE":
			if r.State == StatePlaying {
				// Sanity Check: Prevent negative or unrealistic scores
				if payload.Score < 0 || payload.Score > 9999 {
					log.Printf("Potential hack attempt in room %s: User %s submitted invalid score %d", r.Code, client.UserID, payload.Score)
					return
				}

				if p, ok := r.Players[client.UserID]; ok {
					p.Score = payload.Score // Or increment? Trusting client for now (within limits).
					// Broadcast score update?
					r.broadcastScores()
				}
			}
		}
	}

	select {
	case r.action <- action:
	case <-time.After(100 * time.Millisecond):
		log.Println("Timeout sending action to room loop")
	}
}

func (r *Room) broadcastRoomState() {
	log.Printf("Broadcasting ROOM_STATE for room %s to %d clients", r.Code, len(r.Clients))
	msg := map[string]interface{}{
		"type":    "ROOM_STATE",
		"state":   r.State,
		"players": r.Players,
		"hostId":  r.HostID,
		"config": map[string]interface{}{
			"duration": r.Duration,
			"groups":   r.Groups,
		},
	}
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshalling room state:", err)
		return
	}
	r.broadcastToClients(data)
}

func (r *Room) broadcastScores() {
	msg := map[string]interface{}{
		"type":    "SCORE_UPDATE",
		"players": r.Players,
	}
	data, err := json.Marshal(msg)
	if err != nil {
		log.Println("Error marshalling scores:", err)
		return
	}
	r.broadcastToClients(data)
}

func (r *Room) broadcastToClients(message []byte) {
	for client := range r.Clients {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(r.Clients, client)
		}
	}
}
