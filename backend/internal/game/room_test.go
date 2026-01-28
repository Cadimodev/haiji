package game

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/google/uuid"
)

// MockClient simplifies client interaction for testing channels
func newMockClient(hub *Hub, id uuid.UUID, username string) *Client {
	return &Client{
		Hub:      hub,
		UserID:   id,
		Username: username,
		Send:     make(chan []byte, 100), // Buffered to avoid blocking in tests
	}
}

func TestRoom_Lifecycle(t *testing.T) {
	hub := NewHub()
	hostID := uuid.New()
	room := NewRoom("TEST01", hub, 60, []string{"hiragana"}, hostID)

	// Run room in goroutine
	go room.Run()

	// 1. Join Client
	c1 := newMockClient(hub, hostID, "HostUser")
	room.register <- c1

	// Wait for processing
	time.Sleep(50 * time.Millisecond)

	if len(room.Clients) != 1 {
		t.Fatalf("Expected 1 client, got %d", len(room.Clients))
	}
	if _, ok := room.Players[hostID]; !ok {
		t.Error("Player should be in Players map")
	}

	// 2. Client receives ROOM_STATE
	select {
	case msg := <-c1.Send:
		var parsed map[string]interface{}
		json.Unmarshal(msg, &parsed)
		if parsed["type"] != "ROOM_STATE" {
			t.Errorf("Expected ROOM_STATE, got %v", parsed["type"])
		}
	case <-time.After(100 * time.Millisecond):
		t.Error("Timeout waiting for ROOM_STATE")
	}

	// 3. Leave Client
	room.unregister <- c1
	time.Sleep(50 * time.Millisecond)

	if len(room.Clients) != 0 {
		t.Errorf("Expected 0 clients after unregister, got %d", len(room.Clients))
	}
	if len(room.Players) != 0 {
		t.Error("Players map should be empty in WAITING state")
	}

	// 4. Room Cleanup (Grace period test would be slow, skipping here)
	room.stopGame <- true
}

func TestRoom_StartGame(t *testing.T) {
	hub := NewHub()
	hostID := uuid.New()
	room := NewRoom("TEST02", hub, 60, []string{"cat1"}, hostID)
	go room.Run()
	defer func() { room.stopGame <- true }()

	c1 := newMockClient(hub, hostID, "HostUser")
	room.register <- c1
	time.Sleep(10 * time.Millisecond) // Drain ROOM_STATE
	<-c1.Send

	// 1. Non-host tries to start
	c2 := newMockClient(hub, uuid.New(), "GuestUser")
	room.register <- c2
	time.Sleep(10 * time.Millisecond) // Drain ROOM_STATE for c2
	<-c2.Send

	startMsg, _ := json.Marshal(map[string]interface{}{"type": "START_GAME"})
	room.handleRoomMessage(c2, startMsg)

	if room.State != StateWaiting {
		t.Errorf("Game should not start from non-host request")
	}

	// 2. Host starts game
	room.handleRoomMessage(c1, startMsg)
	time.Sleep(10 * time.Millisecond)

	if room.State != StatePlaying {
		t.Errorf("Game should be in PLAYING state, got %v", room.State)
	}

	// 3. Verify Broadcast
	foundStart := false
	timeout := time.After(100 * time.Millisecond)

	for !foundStart {
		select {
		case msg := <-c1.Send:
			var parsed map[string]interface{}
			json.Unmarshal(msg, &parsed)
			if parsed["type"] == "GAME_STARTED" {
				foundStart = true
			}
		case <-timeout:
			t.Fatal("Timeout waiting for GAME_STARTED")
		}
	}
}

func TestRoom_ScoreUpdate(t *testing.T) {
	hub := NewHub()
	hostID := uuid.New()
	// Short duration to test finishGame quickly if needed, but here we just test scoring
	room := NewRoom("TEST03", hub, 10, []string{"group1"}, hostID)
	room.State = StatePlaying // Force playing state

	pID := uuid.New()
	room.Players[pID] = &Player{UserID: pID, Username: "P1", Score: 0}

	// Create mock client associated with player
	c1 := newMockClient(hub, pID, "P1")
	room.Clients[c1] = true
	c1.Room = room // important for handleRoomMessage if we used it fully, but we call method directly

	// Run loop to handle broadcast channel
	go room.Run()
	defer func() { room.stopGame <- true }()

	// Send Score Update
	scoreMsg, _ := json.Marshal(map[string]interface{}{
		"type":  "SUBMIT_SCORE",
		"score": 100,
	})

	// Simulate the Hub routing the message to the room
	room.handleRoomMessage(c1, scoreMsg)

	time.Sleep(10 * time.Millisecond)

	// Check State
	if room.Players[pID].Score != 100 {
		t.Errorf("Expected score 100, got %d", room.Players[pID].Score)
	}

	// Check Broadcast
	select {
	case msg := <-c1.Send:
		var parsed map[string]interface{}
		json.Unmarshal(msg, &parsed)
		if parsed["type"] != "SCORE_UPDATE" {
			t.Errorf("Expected SCORE_UPDATE, got %v", parsed["type"])
		}
	case <-time.After(50 * time.Millisecond):
		t.Error("Did not receive SCORE_UPDATE")
	}
}
