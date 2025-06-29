package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ChatMessage represents a chat message
type ChatMessage struct {
	Role    string `json:"role"` // "user" or "assistant"
	Content string `json:"content"`
}

// ChatRequest represents the request payload for chat WebSocket
// Removed WorkspaceID, as WebSocket should not use WorkspaceID. Only the method should handle workspace context.
type ChatRequest struct {
	Message      string `json:"message"`
	SystemPrompt string `json:"system_prompt"`
}

// WebSocketResponse represents different types of WebSocket responses
type WebSocketResponse struct {
	Type    string `json:"type"`    // "start", "token", "complete", "error", "info"
	Content string `json:"content"` // For token type
	Message string `json:"message"` // For other types
	Done    bool   `json:"done"`    // For token type
}

// WebSocket connection manager
type WebSocketManager struct {
	conn        *websocket.Conn
	isConnected bool
	mutex       sync.Mutex
	app         *App
}

var wsManager *WebSocketManager

// InitializeWebSocket initializes the WebSocket connection
func (a *App) InitializeWebSocket() error {
	if wsManager != nil {
		wsManager.Close()
	}

	wsManager = &WebSocketManager{
		app: a,
	}

	return wsManager.Connect()
}

// Connect establishes WebSocket connection
func (wm *WebSocketManager) Connect() error {
	wm.mutex.Lock()
	defer wm.mutex.Unlock()

	// Check if Python backend is running first
	resp, err := http.Get("http://localhost:8000/")
	if err != nil {
		return fmt.Errorf("Python backend not accessible at localhost:8000. Please ensure your Python server is running. Error: %v", err)
	}
	resp.Body.Close()

	// Connect to WebSocket
	u := url.URL{Scheme: "ws", Host: "localhost:8000", Path: "/ws/chat"}
	log.Printf("Attempting to connect to WebSocket: %s", u.String())

	dialer := websocket.Dialer{
		HandshakeTimeout: 30 * time.Second,
	}

	conn, resp, err := dialer.Dial(u.String(), nil)
	if err != nil {
		if resp != nil {
			log.Printf("WebSocket handshake failed with status: %d", resp.StatusCode)
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			log.Printf("Response body: %s", string(body))
			return fmt.Errorf("WebSocket connection failed (status %d): %v", resp.StatusCode, err)
		}
		return fmt.Errorf("failed to connect to WebSocket at %s: %v", u.String(), err)
	}

	wm.conn = conn
	wm.isConnected = true

	log.Printf("WebSocket connected successfully")

	// Emit connection status to frontend
	runtime.EventsEmit(wm.app.ctx, "websocketConnected", map[string]interface{}{
		"connected": true,
		"message":   "Connected - Ready for real-time chat!",
	})

	// Start listening for messages
	go func() {
		if wm.conn != nil {
			wm.listen()
		} else {
			log.Printf("WebSocket connection is nil, cannot start listen goroutine")
		}
	}()

	// Start keepalive goroutine
	go func() {
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for wm.isConnected {
			wm.mutex.Lock()
			if wm.conn != nil {
				if err := wm.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
					log.Printf("WebSocket keepalive ping failed: %v", err)
				}
			}
			wm.mutex.Unlock()
			<-ticker.C
		}
	}()

	return nil
}

// listen handles incoming WebSocket messages
func (wm *WebSocketManager) listen() {
	defer func() {
		wm.mutex.Lock()
		wm.isConnected = false
		if wm.conn != nil {
			wm.conn.Close()
		}
		wm.mutex.Unlock()

		log.Printf("WebSocket connection closed")

		// Emit disconnection status to frontend
		runtime.EventsEmit(wm.app.ctx, "websocketDisconnected", map[string]interface{}{
			"connected": false,
			"message":   "Disconnected - Attempting to reconnect...",
		})

		// Attempt to reconnect after 3 seconds
		time.Sleep(3 * time.Second)
		if wm != nil {
			wm.Connect()
		}
	}()

	// Set up ping/pong handlers
	wm.conn.SetPongHandler(func(string) error {
		log.Printf("Received pong from server")
		return nil
	})

	// Set read timeout
	wm.conn.SetReadDeadline(time.Now().Add(60 * time.Second))

	for {
		// Read message from WebSocket
		messageType, message, err := wm.conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("WebSocket closed normally: %v", err)
			} else {
				log.Printf("WebSocket read error: %v", err)
				runtime.EventsEmit(wm.app.ctx, "chatStreamError", map[string]interface{}{
					"error": fmt.Sprintf("Connection error: %v", err),
				})
			}
			return
		}

		// Handle ping messages
		if messageType == websocket.PingMessage {
			wm.conn.WriteMessage(websocket.PongMessage, nil)
			continue
		}

		// Only process text messages
		if messageType != websocket.TextMessage {
			continue
		}

		log.Printf("Received WebSocket message: %s", string(message))

		// Parse the WebSocket response
		var wsResponse WebSocketResponse
		if err := json.Unmarshal(message, &wsResponse); err != nil {
			log.Printf("Failed to parse WebSocket response: %v", err)
			continue
		}

		// Reset read timeout on successful message
		wm.conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		// Handle different response types
		switch wsResponse.Type {
		case "start":
			runtime.EventsEmit(wm.app.ctx, "chatStreamStart", map[string]interface{}{
				"message": wsResponse.Message,
			})

		case "token":
			runtime.EventsEmit(wm.app.ctx, "chatStreamChunk", map[string]interface{}{
				"token": wsResponse.Content,
				"done":  wsResponse.Done,
			})

		case "complete":
			runtime.EventsEmit(wm.app.ctx, "chatStreamDone", map[string]interface{}{
				"done":    true,
				"message": wsResponse.Message,
			})

		case "error":
			runtime.EventsEmit(wm.app.ctx, "chatStreamError", map[string]interface{}{
				"error": wsResponse.Message,
			})

		case "info":
			runtime.EventsEmit(wm.app.ctx, "chatStreamInfo", map[string]interface{}{
				"message": wsResponse.Message,
			})

		default:
			log.Printf("Unknown WebSocket response type: %s", wsResponse.Type)
		}
	}
}

// SendMessage sends a message through the existing WebSocket connection
// Now includes transcription, chat_history, and meeting_notes in the payload
func (wm *WebSocketManager) SendMessage(workspaceID uint, message string, systemPrompt string) error {
	wm.mutex.Lock()
	defer wm.mutex.Unlock()

	if !wm.isConnected || wm.conn == nil {
		return fmt.Errorf("WebSocket not connected")
	}

	// Fetch additional context for the workspace
	transcriptions, _ := GetTranscriptionMessagesByWorkspace(workspaceID)
	chatHistory, _ := GetAIChatMessagesByWorkspace(workspaceID)
	meetingNotesList, _ := GetMeetingNotesByWorkspace(workspaceID)
	var meetingNotes string
	if len(meetingNotesList) > 0 {
		meetingNotes = meetingNotesList[0].Text
	}

	// Prepare the payload
	payload := map[string]interface{}{
		"message":       message,
		"system_prompt": systemPrompt,
		"transcription": transcriptions,
		"chat-history":  chatHistory,
		"meeting-notes": meetingNotes,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal chat request: %v", err)
	}

	err = wm.conn.WriteMessage(websocket.TextMessage, jsonData)
	if err != nil {
		wm.isConnected = false
		return fmt.Errorf("failed to send WebSocket message: %v", err)
	}

	log.Printf("Message sent to WebSocket: %s", string(jsonData))
	return nil
}

// Close closes the WebSocket connection
func (wm *WebSocketManager) Close() {
	wm.mutex.Lock()
	defer wm.mutex.Unlock()

	wm.isConnected = false
	if wm.conn != nil {
		wm.conn.Close()
		wm.conn = nil
	}
}

func (a *App) DisconnectWebSocket() {
	if wsManager != nil {
		wsManager.Close()
		wsManager = nil
		log.Println("WebSocket disconnected")
	} else {
		log.Println("No WebSocket connection to disconnect")
	}
}

// SendChatMessage sends a message through the existing WebSocket connection, now with workspaceID
func (a *App) SendChatMessage(workspaceID uint, message string, systemPrompt string) error {
	if wsManager == nil {
		return fmt.Errorf("WebSocket not initialized. Call InitializeWebSocket first")
	}
	return wsManager.SendMessage(workspaceID, message, systemPrompt)
}

// SendSimpleChatMessage is a convenience method for sending a single user message
func (a *App) SendSimpleChatMessage(workspaceID uint, userMessage string) error {
	return a.SendChatMessage(workspaceID, userMessage, "You are a helpful AI assistant.")
}

// SendChatWithSystemPrompt sends a message with a custom system prompt
func (a *App) SendChatWithSystemPrompt(workspaceID uint, userMessage string, systemPrompt string) error {
	return a.SendChatMessage(workspaceID, userMessage, systemPrompt)
}

// MarkdownAgentRequest represents the request payload for markdown agent WebSocket
type MarkdownAgentRequest struct {
	Message string `json:"message"`
}

// MarkdownAgentResponse represents the markdown agent WebSocket response
type MarkdownAgentResponse struct {
	Type    string `json:"type"`    // "start", "token", "complete", "error", "info"
	Content string `json:"content"` // For token type
	Message string `json:"message"` // For start, complete, error, info types
	Model   string `json:"model"`   // Model used (for token type)
	Done    bool   `json:"done"`    // For token type to indicate completion
}

// Markdown Agent WebSocket connection manager
type MarkdownAgentWebSocketManager struct {
	conn        *websocket.Conn
	isConnected bool
	mutex       sync.Mutex
	app         *App
}

var markdownWsManager *MarkdownAgentWebSocketManager

// Connect establishes markdown agent WebSocket connection
func (mwm *MarkdownAgentWebSocketManager) Connect() error {
	mwm.mutex.Lock()
	defer mwm.mutex.Unlock()

	// Check if Python backend is running first
	resp, err := http.Get("http://localhost:8000/")
	if err != nil {
		return fmt.Errorf("Python backend not accessible at localhost:8000. Please ensure your Python server is running. Error: %v", err)
	}
	resp.Body.Close()

	// Connect to markdown agent WebSocket
	u := url.URL{Scheme: "ws", Host: "localhost:8000", Path: "/ws/markdown_agent"}
	log.Printf("Attempting to connect to Markdown Agent WebSocket: %s", u.String())

	dialer := websocket.Dialer{
		HandshakeTimeout: 30 * time.Second,
	}

	conn, resp, err := dialer.Dial(u.String(), nil)
	if err != nil {
		if resp != nil {
			log.Printf("Markdown Agent WebSocket handshake failed with status: %d", resp.StatusCode)
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			log.Printf("Response body: %s", string(body))
			return fmt.Errorf("Markdown Agent WebSocket connection failed (status %d): %v", resp.StatusCode, err)
		}
		return fmt.Errorf("failed to connect to Markdown Agent WebSocket at %s: %v", u.String(), err)
	}

	mwm.conn = conn
	mwm.isConnected = true

	log.Printf("Markdown Agent WebSocket connected successfully")

	// Emit connection status to frontend
	runtime.EventsEmit(mwm.app.ctx, "markdownAgentWebSocketConnected", map[string]interface{}{
		"connected": true,
		"message":   "Markdown Agent Connected - Ready for meeting notes assistance!",
	})

	// Start listening for messages
	go mwm.listen()

	return nil
}

// listen handles incoming markdown agent WebSocket messages
func (mwm *MarkdownAgentWebSocketManager) listen() {
	defer func() {
		mwm.mutex.Lock()
		mwm.isConnected = false
		if mwm.conn != nil {
			mwm.conn.Close()
		}
		mwm.mutex.Unlock()

		log.Printf("Markdown Agent WebSocket connection closed")

		// Emit disconnection status to frontend
		runtime.EventsEmit(mwm.app.ctx, "markdownAgentWebSocketDisconnected", map[string]interface{}{
			"connected": false,
			"message":   "Markdown Agent Disconnected - Attempting to reconnect...",
		})

		// Attempt to reconnect after 3 seconds
		time.Sleep(3 * time.Second)
		if mwm != nil {
			mwm.Connect()
		}
	}()

	// Set up ping/pong handlers
	mwm.conn.SetPongHandler(func(string) error {
		log.Printf("Received pong from markdown agent server")
		return nil
	})

	// Set read timeout
	mwm.conn.SetReadDeadline(time.Now().Add(60 * time.Second))

	for {
		// Read message from WebSocket
		messageType, message, err := mwm.conn.ReadMessage()
		if err != nil {
			if websocket.IsCloseError(err, websocket.CloseNormalClosure, websocket.CloseGoingAway) {
				log.Printf("Markdown Agent WebSocket closed normally: %v", err)
			} else {
				log.Printf("Markdown Agent WebSocket read error: %v", err)
				runtime.EventsEmit(mwm.app.ctx, "markdownAgentError", map[string]interface{}{
					"error": fmt.Sprintf("Connection error: %v", err),
				})
			}
			return
		}

		// Handle ping messages
		if messageType == websocket.PingMessage {
			mwm.conn.WriteMessage(websocket.PongMessage, nil)
			continue
		}

		// Only process text messages
		if messageType != websocket.TextMessage {
			continue
		}

		log.Printf("Received Markdown Agent WebSocket message: %s", string(message))

		// Parse the WebSocket response
		var agentResponse MarkdownAgentResponse
		if err := json.Unmarshal(message, &agentResponse); err != nil {
			log.Printf("Failed to parse Markdown Agent WebSocket response: %v", err)
			continue
		}

		// Reset read timeout on successful message
		mwm.conn.SetReadDeadline(time.Now().Add(60 * time.Second))

		// Handle different response types for streaming markdown agent
		switch agentResponse.Type {
		case "start":
			runtime.EventsEmit(mwm.app.ctx, "markdownAgentStreamStart", map[string]interface{}{
				"message": agentResponse.Message,
			})

		case "token":
			runtime.EventsEmit(mwm.app.ctx, "markdownAgentStreamChunk", map[string]interface{}{
				"token": agentResponse.Content,
				"done":  agentResponse.Done,
				"model": agentResponse.Model,
			})

		case "complete":
			runtime.EventsEmit(mwm.app.ctx, "markdownAgentStreamDone", map[string]interface{}{
				"done":    true,
				"message": agentResponse.Message,
			})

		case "info":
			runtime.EventsEmit(mwm.app.ctx, "markdownAgentStreamInfo", map[string]interface{}{
				"message": agentResponse.Message,
			})

		case "error":
			runtime.EventsEmit(mwm.app.ctx, "markdownAgentError", map[string]interface{}{
				"error": agentResponse.Message,
			})

		default:
			log.Printf("Unknown Markdown Agent WebSocket response type: %s", agentResponse.Type)
		}
	}
}

// SendMessage sends a message through the markdown agent WebSocket connection
func (mwm *MarkdownAgentWebSocketManager) SendMessage(message string) error {
	mwm.mutex.Lock()
	defer mwm.mutex.Unlock()

	if !mwm.isConnected || mwm.conn == nil {
		return fmt.Errorf("Markdown Agent WebSocket not connected")
	}

	agentRequest := MarkdownAgentRequest{
		Message: message,
	}

	jsonData, err := json.Marshal(agentRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal markdown agent request: %v", err)
	}

	err = mwm.conn.WriteMessage(websocket.TextMessage, jsonData)
	if err != nil {
		mwm.isConnected = false
		return fmt.Errorf("failed to send Markdown Agent WebSocket message: %v", err)
	}

	log.Printf("Message sent to Markdown Agent WebSocket: %s", string(jsonData))
	return nil
}

// Close closes the markdown agent WebSocket connection
func (mwm *MarkdownAgentWebSocketManager) Close() {
	mwm.mutex.Lock()
	defer mwm.mutex.Unlock()

	mwm.isConnected = false
	if mwm.conn != nil {
		mwm.conn.Close()
		mwm.conn = nil
	}
}

// Expose WebSocket initialization and closing to the frontend
func (a *App) InitializeWebSocketFrontend() error {
	return a.InitializeWebSocket()
}

func (a *App) CloseWebSocketFrontend() {
	if wsManager != nil {
		wsManager.Close()
		wsManager = nil
	}
}
