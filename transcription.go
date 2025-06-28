package main

import (
	_ "encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// TranscriptionMessage represents a message from the Chrome extension
type TranscriptionMessage struct {
	Type        string      `json:"type,omitempty"`        // "new_message", "message_update", or "keepalive"
	Text        string      `json:"text"`                  // caption text content
	Speaker     string      `json:"speaker"`               // speaker name or "System"
	Timestamp   string      `json:"timestamp"`             // ISO 8601 timestamp
	Source      string      `json:"source,omitempty"`      // "google-meet"
	MessageType string      `json:"messageType,omitempty"` // "caption_update"
	OldText     string      `json:"oldText,omitempty"`     // previous text (for updates)
	Changes     interface{} `json:"changes,omitempty"`     // diff information (can be object or string)
}

// TranscriptionServer manages the WebSocket server for transcription
type TranscriptionServer struct {
	upgrader websocket.Upgrader
	clients  map[*websocket.Conn]bool
	mutex    sync.RWMutex
	app      *App
}

var transcriptionServer *TranscriptionServer

// InitializeTranscriptionServer starts the WebSocket server on port 8001
func (a *App) InitializeTranscriptionServer() error {
	transcriptionServer = &TranscriptionServer{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Allow connections from Chrome extensions and localhost
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
		clients: make(map[*websocket.Conn]bool),
		app:     a,
	}

	// Create a new HTTP server specifically for transcription
	mux := http.NewServeMux()
	mux.HandleFunc("/", transcriptionServer.handleWebSocket)

	server := &http.Server{
		Addr:    ":8001",
		Handler: mux,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Starting transcription WebSocket server on :8001 (direct connection)")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Transcription server error: %v", err)
		}
	}()

	log.Printf("Transcription WebSocket server initialized on port 8001 (ws://localhost:8001)")
	return nil
}

// handleWebSocket handles incoming WebSocket connections from Chrome extension
func (ts *TranscriptionServer) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Log incoming connection attempt
	log.Printf("WebSocket connection attempt from: %s", r.RemoteAddr)

	conn, err := ts.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error: %v", err)
		return
	}

	// Add client to the map
	ts.mutex.Lock()
	ts.clients[conn] = true
	clientCount := len(ts.clients)
	ts.mutex.Unlock()

	log.Printf("Chrome extension connected to transcription server (total clients: %d)", clientCount)

	// Emit connection event to frontend
	runtime.EventsEmit(ts.app.ctx, "transcriptionExtensionConnected", map[string]interface{}{
		"connected": true,
		"message":   "Chrome extension connected - Ready for live transcription!",
		"clients":   clientCount,
	})

	// Set up connection monitoring
	conn.SetCloseHandler(func(code int, text string) error {
		log.Printf("WebSocket connection closed with code: %d, text: %s", code, text)
		return nil
	})

	// Set ping/pong handlers to keep connection alive
	conn.SetPongHandler(func(appData string) error {
		log.Printf("Received pong from extension")
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	// Set read deadline
	conn.SetReadDeadline(time.Now().Add(60 * time.Second))

	// Remove client when connection closes
	defer func() {
		ts.mutex.Lock()
		delete(ts.clients, conn)
		remainingClients := len(ts.clients)
		ts.mutex.Unlock()

		conn.Close()
		log.Printf("Chrome extension disconnected from transcription server (remaining clients: %d)", remainingClients)

		// Emit disconnection event to frontend
		runtime.EventsEmit(ts.app.ctx, "transcriptionExtensionDisconnected", map[string]interface{}{
			"connected": false,
			"message":   "Chrome extension disconnected",
			"clients":   remainingClients,
		})
	}()

	// Send periodic pings to keep connection alive
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	go func() {
		for {
			select {
			case <-ticker.C:
				if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					log.Printf("Error sending ping: %v", err)
					return
				}
			}
		}
	}()

	// Listen for messages from Chrome extension
	for {
		var message TranscriptionMessage
		err := conn.ReadJSON(&message)
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("Chrome extension disconnected normally: %v", err)
			} else {
				log.Printf("Error reading transcription message: %v", err)
			}
			break
		}

		// Reset read deadline on successful message
		conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		log.Printf("Received transcription message: %s from %s", message.Text, message.Speaker)

		// Forward the transcription message to frontend
		ts.forwardToFrontend(message)
	}
}

// forwardToFrontend sends transcription messages to the React frontend
func (ts *TranscriptionServer) forwardToFrontend(message TranscriptionMessage) {
	switch message.Type {
	case "new_message":
		// Emit new transcription message to frontend
		runtime.EventsEmit(ts.app.ctx, "transcriptionNewMessage", map[string]interface{}{
			"text":        message.Text,
			"speaker":     message.Speaker,
			"timestamp":   message.Timestamp,
			"source":      message.Source,
			"messageType": message.MessageType,
		})

	case "message_update":
		// Emit updated transcription message to frontend
		runtime.EventsEmit(ts.app.ctx, "transcriptionMessageUpdate", map[string]interface{}{
			"text":        message.Text,
			"oldText":     message.OldText,
			"speaker":     message.Speaker,
			"timestamp":   message.Timestamp,
			"source":      message.Source,
			"changes":     message.Changes,
			"messageType": message.MessageType,
		})

	case "keepalive":
		// Log keepalive messages but don't emit to frontend
		log.Printf("Received keepalive message at %s", message.Timestamp)

	case "":
		// Handle system messages (no type field)
		if message.Speaker == "System" {
			runtime.EventsEmit(ts.app.ctx, "transcriptionSystemMessage", map[string]interface{}{
				"text":      message.Text,
				"speaker":   message.Speaker,
				"timestamp": message.Timestamp,
				"source":    message.Source,
			})
		} else {
			// Treat as new message if no type is specified
			runtime.EventsEmit(ts.app.ctx, "transcriptionNewMessage", map[string]interface{}{
				"text":        message.Text,
				"speaker":     message.Speaker,
				"timestamp":   message.Timestamp,
				"source":      message.Source,
				"messageType": message.MessageType,
			})
		}

	default:
		log.Printf("Unknown transcription message type: %s", message.Type)
	}
}

// GetTranscriptionServerStatus returns the status of the transcription server
func (a *App) GetTranscriptionServerStatus() map[string]interface{} {
	if transcriptionServer == nil {
		return map[string]interface{}{
			"running":  false,
			"clients":  0,
			"port":     8001,
			"endpoint": "ws://localhost:8001/ws/transcription",
		}
	}

	transcriptionServer.mutex.RLock()
	clientCount := len(transcriptionServer.clients)
	transcriptionServer.mutex.RUnlock()

	return map[string]interface{}{
		"running":  true,
		"clients":  clientCount,
		"port":     8001,
		"endpoint": "ws://localhost:8001/ws/transcription",
		"message":  "Transcription server ready for Chrome extension connections",
	}
}

// SendTestTranscription sends a test transcription message (for debugging)
func (a *App) SendTestTranscription(speaker, text string) {
	if transcriptionServer == nil {
		log.Printf("Transcription server not initialized")
		return
	}

	testMessage := TranscriptionMessage{
		Type:        "new_message",
		Text:        text,
		Speaker:     speaker,
		Timestamp:   time.Now().Format(time.RFC3339),
		Source:      "test",
		MessageType: "caption_update",
	}

	transcriptionServer.forwardToFrontend(testMessage)
	log.Printf("Sent test transcription: %s from %s", text, speaker)
}
