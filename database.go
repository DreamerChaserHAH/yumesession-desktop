package main

import (
	"log"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Workspace represents a workspace in the database
type Workspace struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Title        string    `gorm:"not null" json:"title"`
	Description  string    `json:"description"`
	LastOpenTime time.Time `json:"lastOpenTime"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

// TranscriptionRecord represents a transcription message in the database
type TranscriptionRecord struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	MessageID   string    `gorm:"uniqueIndex;not null" json:"messageId"`
	WorkspaceID uint      `gorm:"not null" json:"workspaceId"`
	Text        string    `gorm:"not null" json:"text"`
	Speaker     string    `gorm:"not null" json:"speaker"`
	Timestamp   time.Time `gorm:"not null" json:"timestamp"`
	Source      string    `json:"source"`
	MessageType string    `json:"messageType"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Foreign key relationship
	Workspace Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// InitDatabase initializes the database connection and creates tables
func InitDatabase() error {
	var err error

	// Open SQLite database (creates file if it doesn't exist)
	DB, err = gorm.Open(sqlite.Open("yumesession/yumesession.db"), &gorm.Config{})
	if err != nil {
		log.Printf("Failed to connect to database: %v", err)
		return err
	}

	// Auto-migrate the schema (creates tables if they don't exist)
	err = DB.AutoMigrate(&Workspace{}, &TranscriptionRecord{})
	if err != nil {
		log.Printf("Failed to migrate database: %v", err)
		return err
	}

	log.Println("Database initialized successfully")
	return nil
}

// CreateWorkspace creates a new workspace
func CreateWorkspace(title, description string) (*Workspace, error) {
	workspace := &Workspace{
		Title:        title,
		Description:  description,
		LastOpenTime: time.Now(),
	}

	result := DB.Create(workspace)
	if result.Error != nil {
		log.Printf("Failed to create workspace: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("Created workspace: %s", workspace.Title)
	return workspace, nil
}

// GetAllWorkspaces retrieves all workspaces
func GetAllWorkspaces() ([]Workspace, error) {
	var workspaces []Workspace
	result := DB.Find(&workspaces)
	if result.Error != nil {
		log.Printf("Failed to get workspaces: %v", result.Error)
		return nil, result.Error
	}
	return workspaces, nil
}

// GetWorkspaceByID retrieves a workspace by ID
func GetWorkspaceByID(id uint) (*Workspace, error) {
	var workspace Workspace
	result := DB.First(&workspace, id)
	if result.Error != nil {
		log.Printf("Failed to get workspace by ID %d: %v", id, result.Error)
		return nil, result.Error
	}
	return &workspace, nil
}

// UpdateWorkspaceLastOpen updates the last open time of a workspace
func UpdateWorkspaceLastOpen(id uint) error {
	result := DB.Model(&Workspace{}).Where("id = ?", id).Update("last_open_time", time.Now())
	if result.Error != nil {
		log.Printf("Failed to update workspace last open time: %v", result.Error)
		return result.Error
	}
	return nil
}

// UpdateWorkspace updates a workspace
func UpdateWorkspace(id uint, title, description string) (*Workspace, error) {
	var workspace Workspace
	result := DB.First(&workspace, id)
	if result.Error != nil {
		return nil, result.Error
	}

	workspace.Title = title
	workspace.Description = description

	result = DB.Save(&workspace)
	if result.Error != nil {
		log.Printf("Failed to update workspace: %v", result.Error)
		return nil, result.Error
	}

	return &workspace, nil
}

// DeleteWorkspace deletes a workspace
func DeleteWorkspace(id uint) error {
	result := DB.Delete(&Workspace{}, id)
	if result.Error != nil {
		log.Printf("Failed to delete workspace: %v", result.Error)
		return result.Error
	}
	return nil
}

// Transcription message CRUD operations

// CreateTranscriptionMessage creates a new transcription message
func CreateTranscriptionMessage(messageID string, workspaceID uint, text, speaker, source, messageType string, timestamp time.Time) (*TranscriptionRecord, error) {
	transcriptionMsg := &TranscriptionRecord{
		MessageID:   messageID,
		WorkspaceID: workspaceID,
		Text:        text,
		Speaker:     speaker,
		Timestamp:   timestamp,
		Source:      source,
		MessageType: messageType,
	}

	result := DB.Create(transcriptionMsg)
	if result.Error != nil {
		log.Printf("Failed to create transcription message: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("Created transcription message from %s: %s", speaker, text)
	return transcriptionMsg, nil
}

// GetTranscriptionMessagesByWorkspace retrieves all transcription messages for a workspace
func GetTranscriptionMessagesByWorkspace(workspaceID uint) ([]TranscriptionRecord, error) {
	var messages []TranscriptionRecord
	result := DB.Where("workspace_id = ?", workspaceID).Order("timestamp ASC").Find(&messages)
	if result.Error != nil {
		log.Printf("Failed to get transcription messages for workspace %d: %v", workspaceID, result.Error)
		return nil, result.Error
	}
	return messages, nil
}

// GetTranscriptionMessageByID retrieves a transcription message by database ID
func GetTranscriptionMessageByID(id uint) (*TranscriptionRecord, error) {
	var message TranscriptionRecord
	result := DB.First(&message, id)
	if result.Error != nil {
		log.Printf("Failed to get transcription message by ID %d: %v", id, result.Error)
		return nil, result.Error
	}
	return &message, nil
}

// GetTranscriptionMessageByMessageID retrieves a transcription message by message ID
func GetTranscriptionMessageByMessageID(messageID string) (*TranscriptionRecord, error) {
	var message TranscriptionRecord
	result := DB.Where("message_id = ?", messageID).First(&message)
	if result.Error != nil {
		log.Printf("Failed to get transcription message by message ID %s: %v", messageID, result.Error)
		return nil, result.Error
	}
	return &message, nil
}

// UpdateTranscriptionMessage updates a transcription message
func UpdateTranscriptionMessage(messageID string, text, speaker string, timestamp time.Time) (*TranscriptionRecord, error) {
	var message TranscriptionRecord
	result := DB.Where("message_id = ?", messageID).First(&message)
	if result.Error != nil {
		return nil, result.Error
	}

	message.Text = text
	message.Speaker = speaker
	message.Timestamp = timestamp

	result = DB.Save(&message)
	if result.Error != nil {
		log.Printf("Failed to update transcription message: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("Updated transcription message %s: %s", messageID, text)
	return &message, nil
}

// DeleteTranscriptionMessage deletes a transcription message
func DeleteTranscriptionMessage(id uint) error {
	result := DB.Delete(&TranscriptionRecord{}, id)
	if result.Error != nil {
		log.Printf("Failed to delete transcription message: %v", result.Error)
		return result.Error
	}
	return nil
}

// DeleteTranscriptionMessagesByWorkspace deletes all transcription messages for a workspace
func DeleteTranscriptionMessagesByWorkspace(workspaceID uint) error {
	result := DB.Where("workspace_id = ?", workspaceID).Delete(&TranscriptionRecord{})
	if result.Error != nil {
		log.Printf("Failed to delete transcription messages for workspace %d: %v", workspaceID, result.Error)
		return result.Error
	}
	return nil
}

// GetTranscriptionMessagesByDateRange retrieves transcription messages within a date range
func GetTranscriptionMessagesByDateRange(workspaceID uint, startTime, endTime time.Time) ([]TranscriptionRecord, error) {
	var messages []TranscriptionRecord
	result := DB.Where("workspace_id = ? AND timestamp BETWEEN ? AND ?", workspaceID, startTime, endTime).
		Order("timestamp ASC").Find(&messages)
	if result.Error != nil {
		log.Printf("Failed to get transcription messages by date range: %v", result.Error)
		return nil, result.Error
	}
	return messages, nil
}
