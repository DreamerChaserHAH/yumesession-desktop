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
	err = DB.AutoMigrate(&Workspace{})
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
