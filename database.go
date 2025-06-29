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

// KnowledgeBase represents a knowledge base item in the database
type KnowledgeBase struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	UniqueFileName string    `json:"uniqueFileName"`       // Can be empty for website links
	Type           string    `gorm:"not null" json:"type"` // "Local File" or "Website Link"
	OneLineSummary string    `gorm:"not null" json:"oneLineSummary"`
	FullSummary    string    `gorm:"type:text" json:"fullSummary"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

// MeetingNotes represents meeting notes in the database
type MeetingNotes struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	WorkspaceID uint      `gorm:"uniqueIndex;not null" json:"workspaceId"`
	Text        string    `gorm:"type:text" json:"text"` // Markdown format
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Foreign key relationship
	Workspace Workspace `gorm:"foreignKey:WorkspaceID" json:"workspace,omitempty"`
}

// AIChatMessage represents chat messages in the database
// Added WorkspaceID to associate messages with a workspace
type AIChatMessage struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	WorkspaceID uint      `gorm:"not null" json:"workspaceId"`
	By          string    `gorm:"not null" json:"by"` // "Assistant" or "User"
	Text        string    `gorm:"type:text" json:"text"`
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
	err = DB.AutoMigrate(&Workspace{}, &TranscriptionRecord{}, &KnowledgeBase{}, &MeetingNotes{}, &AIChatMessage{})
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

// Knowledge Base CRUD operations

// CreateKnowledgeBaseItem creates a new knowledge base item
func CreateKnowledgeBaseItem(uniqueFileName, itemType, oneLineSummary, fullSummary string) (*KnowledgeBase, error) {
	knowledgeItem := &KnowledgeBase{
		UniqueFileName: uniqueFileName,
		Type:           itemType,
		OneLineSummary: oneLineSummary,
		FullSummary:    fullSummary,
	}

	result := DB.Create(knowledgeItem)
	if result.Error != nil {
		log.Printf("Failed to create knowledge base item: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("Created knowledge base item: %s", oneLineSummary)
	return knowledgeItem, nil
}

// GetAllKnowledgeBaseItems retrieves all knowledge base items
func GetAllKnowledgeBaseItems() ([]KnowledgeBase, error) {
	var items []KnowledgeBase
	result := DB.Order("created_at DESC").Find(&items)
	if result.Error != nil {
		log.Printf("Failed to get knowledge base items: %v", result.Error)
		return nil, result.Error
	}
	return items, nil
}

// GetKnowledgeBaseItemByID retrieves a knowledge base item by ID
func GetKnowledgeBaseItemByID(id uint) (*KnowledgeBase, error) {
	var item KnowledgeBase
	result := DB.First(&item, id)
	if result.Error != nil {
		log.Printf("Failed to get knowledge base item by ID %d: %v", id, result.Error)
		return nil, result.Error
	}
	return &item, nil
}

// GetKnowledgeBaseItemsByType retrieves knowledge base items by type
func GetKnowledgeBaseItemsByType(itemType string) ([]KnowledgeBase, error) {
	var items []KnowledgeBase
	result := DB.Where("type = ?", itemType).Order("created_at DESC").Find(&items)
	if result.Error != nil {
		log.Printf("Failed to get knowledge base items by type %s: %v", itemType, result.Error)
		return nil, result.Error
	}
	return items, nil
}

// GetKnowledgeBaseItemByUniqueFileName retrieves a knowledge base item by unique file name
func GetKnowledgeBaseItemByUniqueFileName(uniqueFileName string) (*KnowledgeBase, error) {
	var item KnowledgeBase
	result := DB.Where("unique_file_name = ?", uniqueFileName).First(&item)
	if result.Error != nil {
		log.Printf("Failed to get knowledge base item by unique file name %s: %v", uniqueFileName, result.Error)
		return nil, result.Error
	}
	return &item, nil
}

// UpdateKnowledgeBaseItem updates a knowledge base item
func UpdateKnowledgeBaseItem(id uint, uniqueFileName, itemType, oneLineSummary, fullSummary string) (*KnowledgeBase, error) {
	var item KnowledgeBase
	result := DB.First(&item, id)
	if result.Error != nil {
		return nil, result.Error
	}

	item.UniqueFileName = uniqueFileName
	item.Type = itemType
	item.OneLineSummary = oneLineSummary
	item.FullSummary = fullSummary

	result = DB.Save(&item)
	if result.Error != nil {
		log.Printf("Failed to update knowledge base item: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("Updated knowledge base item: %s", oneLineSummary)
	return &item, nil
}

// DeleteKnowledgeBaseItem deletes a knowledge base item
func DeleteKnowledgeBaseItem(id uint) error {
	result := DB.Delete(&KnowledgeBase{}, id)
	if result.Error != nil {
		log.Printf("Failed to delete knowledge base item: %v", result.Error)
		return result.Error
	}
	return nil
}

// SearchKnowledgeBaseItems searches knowledge base items by summary content
func SearchKnowledgeBaseItems(searchTerm string) ([]KnowledgeBase, error) {
	var items []KnowledgeBase
	searchPattern := "%" + searchTerm + "%"
	result := DB.Where("one_line_summary LIKE ? OR full_summary LIKE ?",
		searchPattern, searchPattern).Order("created_at DESC").Find(&items)
	if result.Error != nil {
		log.Printf("Failed to search knowledge base items: %v", result.Error)
		return nil, result.Error
	}
	return items, nil
}

// Meeting Notes CRUD operations

// CreateMeetingNotes creates new meeting notes
func CreateMeetingNotes(workspaceID uint, text string) (*MeetingNotes, error) {
	meetingNotes := &MeetingNotes{
		WorkspaceID: workspaceID,
		Text:        text,
	}

	result := DB.Create(meetingNotes)
	if result.Error != nil {
		log.Printf("Failed to create meeting notes: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("Created meeting notes for workspace %d", workspaceID)
	return meetingNotes, nil
}

// GetMeetingNotesByWorkspace retrieves all meeting notes for a workspace
func GetMeetingNotesByWorkspace(workspaceID uint) ([]MeetingNotes, error) {
	var notes []MeetingNotes
	result := DB.Where("workspace_id = ?", workspaceID).Order("created_at DESC").Find(&notes)
	if result.Error != nil {
		log.Printf("Failed to get meeting notes for workspace %d: %v", workspaceID, result.Error)
		return nil, result.Error
	}
	return notes, nil
}

// GetMeetingNotesByID retrieves meeting notes by ID
func GetMeetingNotesByID(id uint) (*MeetingNotes, error) {
	var notes MeetingNotes
	result := DB.First(&notes, id)
	if result.Error != nil {
		log.Printf("Failed to get meeting notes by ID %d: %v", id, result.Error)
		return nil, result.Error
	}
	return &notes, nil
}

// UpdateMeetingNotes updates meeting notes
func UpdateMeetingNotes(id uint, text string) (*MeetingNotes, error) {
	var notes MeetingNotes
	result := DB.First(&notes, id)
	if result.Error != nil {
		return nil, result.Error
	}

	notes.Text = text

	result = DB.Save(&notes)
	if result.Error != nil {
		log.Printf("Failed to update meeting notes: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("Updated meeting notes ID %d", id)
	return &notes, nil
}

// DeleteMeetingNotes deletes meeting notes
func DeleteMeetingNotes(id uint) error {
	result := DB.Delete(&MeetingNotes{}, id)
	if result.Error != nil {
		log.Printf("Failed to delete meeting notes: %v", result.Error)
		return result.Error
	}
	return nil
}

// DeleteMeetingNotesByWorkspace deletes all meeting notes for a workspace
func DeleteMeetingNotesByWorkspace(workspaceID uint) error {
	result := DB.Where("workspace_id = ?", workspaceID).Delete(&MeetingNotes{})
	if result.Error != nil {
		log.Printf("Failed to delete meeting notes for workspace %d: %v", workspaceID, result.Error)
		return result.Error
	}
	return nil
}

// SearchMeetingNotes searches meeting notes by text content
func SearchMeetingNotes(workspaceID uint, searchTerm string) ([]MeetingNotes, error) {
	var notes []MeetingNotes
	searchPattern := "%" + searchTerm + "%"
	result := DB.Where("workspace_id = ? AND text LIKE ?", workspaceID, searchPattern).
		Order("created_at DESC").Find(&notes)
	if result.Error != nil {
		log.Printf("Failed to search meeting notes: %v", result.Error)
		return nil, result.Error
	}
	return notes, nil
}

// AIChatMessage CRUD operations

// CreateAIChatMessage creates a new AI chat message
func CreateAIChatMessage(workspaceID uint, by, text string) (*AIChatMessage, error) {
	msg := &AIChatMessage{
		WorkspaceID: workspaceID,
		By:          by,
		Text:        text,
	}
	result := DB.Create(msg)
	if result.Error != nil {
		log.Printf("Failed to create AI chat message: %v", result.Error)
		return nil, result.Error
	}
	return msg, nil
}

// GetAIChatMessageByID retrieves an AI chat message by ID
func GetAIChatMessageByID(id uint) (*AIChatMessage, error) {
	var msg AIChatMessage
	result := DB.First(&msg, id)
	if result.Error != nil {
		log.Printf("Failed to get AI chat message by ID %d: %v", id, result.Error)
		return nil, result.Error
	}
	return &msg, nil
}

// GetAllAIChatMessages retrieves all AI chat messages
func GetAllAIChatMessages() ([]AIChatMessage, error) {
	var messages []AIChatMessage
	result := DB.Order("created_at ASC").Find(&messages)
	if result.Error != nil {
		log.Printf("Failed to get AI chat messages: %v", result.Error)
		return nil, result.Error
	}
	return messages, nil
}

// GetAIChatMessagesByWorkspace retrieves all AI chat messages for a workspace
func GetAIChatMessagesByWorkspace(workspaceID uint) ([]AIChatMessage, error) {
	var messages []AIChatMessage
	result := DB.Where("workspace_id = ?", workspaceID).Order("created_at ASC").Find(&messages)
	if result.Error != nil {
		log.Printf("Failed to get AI chat messages for workspace %d: %v", workspaceID, result.Error)
		return nil, result.Error
	}
	return messages, nil
}

// UpdateAIChatMessage updates the workspace, text, or by field of an AI chat message
func UpdateAIChatMessage(id uint, workspaceID uint, by, text string) (*AIChatMessage, error) {
	var msg AIChatMessage
	result := DB.First(&msg, id)
	if result.Error != nil {
		return nil, result.Error
	}
	msg.WorkspaceID = workspaceID
	msg.By = by
	msg.Text = text
	result = DB.Save(&msg)
	if result.Error != nil {
		log.Printf("Failed to update AI chat message: %v", result.Error)
		return nil, result.Error
	}
	return &msg, nil
}

// DeleteAIChatMessage deletes an AI chat message by ID
func DeleteAIChatMessage(id uint) error {
	result := DB.Delete(&AIChatMessage{}, id)
	if result.Error != nil {
		log.Printf("Failed to delete AI chat message: %v", result.Error)
		return result.Error
	}
	return nil
}
