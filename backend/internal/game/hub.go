package game

import (
	"encoding/json"
	"log"
	"strings"
	"sync"

	"github.com/google/uuid"
)

type Hub struct {
	// Registered clients (connected, but maybe not in a room yet, or implicitly in a lobby?)
	// Registered clients (connected, but maybe not in a room yet, or implicitly in a lobby?)
	clients map[*Client]bool

	// Mutex for rooms map
	mu sync.RWMutex

	// Rooms map: roomCode -> Room
	rooms map[string]*Room

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]*Room),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			// Optionally send a welcome message or lobby state
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				if client.Room != nil {
					client.Room.unregister <- client
				}
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
				}
			}
		}
	}
}

func (h *Hub) handleMessage(c *Client, msg []byte) {
	// Basic Parsing to route message
	// If command is Create/Join, Hub handles it.
	// If command is Game related, pass to Room.

	var base struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(msg, &base); err != nil {
		log.Println("Invalid JSON:", err)
		return
	}
	log.Printf("Hub received message type: %s from user %s", base.Type, c.Username)

	switch base.Type {
	case "CREATE_ROOM":
		h.handleCreateRoom(c, msg)
	case "JOIN_ROOM":
		h.handleJoinRoom(c, msg)
	default:
		// Forward to room
		if c.Room != nil {
			c.Room.handleRoomMessage(c, msg)
		}
	}
}

func (h *Hub) CreateRoom(duration int, groups []string, hostID uuid.UUID) string {
	// Generate simple 6-char code
	code := uuid.New().String()[:6]
	code = strings.ToUpper(code)
	room := NewRoom(code, h, duration, groups, hostID)
	h.mu.Lock()
	h.rooms[code] = room
	h.mu.Unlock()
	go room.Run()
	return code
}

func (h *Hub) handleCreateRoom(c *Client, msg []byte) {
	var payload struct {
		Duration int      `json:"duration"`
		Groups   []string `json:"groups"`
	}
	if err := json.Unmarshal(msg, &payload); err != nil {
		return
	}

	code := h.CreateRoom(payload.Duration, payload.Groups, c.UserID)

	// We need to notify the client of the code, or just join them?
	// In WS-only flow, we'd Autojoin.
	// But since we are moving to HTTP creation, this WS method might become redundant
	// or just an alternative. We keep it for now but relay the join.
	// or just an alternative. We keep it for now but relay the join.
	h.mu.RLock()
	r, ok := h.rooms[code]
	h.mu.RUnlock()
	if ok {
		log.Printf("Auto-joining creator %s to room %s", c.Username, code)
		r.register <- c
	} else {
		log.Printf("Room %s created but not found for auto-join", code)
	}
}

func (h *Hub) handleJoinRoom(c *Client, msg []byte) {
	var payload struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(msg, &payload); err != nil {
		return
	}

	h.mu.RLock()
	room, ok := h.rooms[payload.Code]
	h.mu.RUnlock()

	if !ok {
		log.Printf("Room %s not found for join request from %s", payload.Code, c.Username)
		// Send error?
		c.Send <- []byte(`{"type":"ERROR", "message":"Room not found"}`)
		return
	}

	if room.State != StateWaiting {
		c.Send <- []byte(`{"type":"ERROR", "message":"Game already in progress"}`)
		return
	}

	log.Printf("Joining client %s to room %s", c.Username, payload.Code)
	room.register <- c
}

func (h *Hub) closeRoom(code string) {
	h.mu.Lock()
	delete(h.rooms, code)
	h.mu.Unlock()
}
