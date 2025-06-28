package main

import (
	_ "bufio"
	"context"
	_ "encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) CheckLocalOllamaInstallation() bool {
	_, err := exec.LookPath("ollama")
	return err == nil
}

func (a *App) IsOllamaRunning() (bool, error) {
	resp, err := http.Get("http://localhost:11434")
	if err != nil {
		return false, nil // Not running, but not an error for our purposes
	}
	defer resp.Body.Close()
	return true, nil
}

func (a *App) StartOllamaServer() error {
	cmd := exec.Command("ollama", "serve")
	return cmd.Start()
}

func (a *App) CheckGraniteInstallation() bool {
	cmd := exec.Command("ollama", "list")
	output, err := cmd.Output()
	if err != nil {
		return false
	}
	log.Println("output:", string(output))
	return strings.Contains(string(output), "granite3.3:8b")
}

func (a *App) DownloadGraniteModel() error {
	cmd := exec.Command("ollama", "pull", "granite3.3:8b")

	// Create temporary files for stdout and stderr
	stdoutFile, err := os.CreateTemp("", "ollama_stdout_*.log")
	if err != nil {
		return fmt.Errorf("failed to create stdout temp file: %v", err)
	}
	defer os.Remove(stdoutFile.Name())
	defer stdoutFile.Close()

	stderrFile, err := os.CreateTemp("", "ollama_stderr_*.log")
	if err != nil {
		return fmt.Errorf("failed to create stderr temp file: %v", err)
	}
	defer os.Remove(stderrFile.Name())
	defer stderrFile.Close()

	cmd.Stdout = stdoutFile
	cmd.Stderr = stderrFile

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start command: %v", err)
	}

	// Monitor stderr file for progress updates
	go func() {
		for {
			// Seek to beginning of file and read all content
			stderrFile.Seek(0, 0)
			content, err := io.ReadAll(stderrFile)
			if err != nil {
				log.Printf("Error reading stderr file: %v", err)
				return
			}

			if len(content) > 0 {
				lines := strings.Split(string(content), "\n")
				for _, line := range lines {
					if strings.TrimSpace(line) != "" {
						parsed := parseGraniteProgress(line)
						if parsed != nil {
							runtime.EventsEmit(a.ctx, "graniteDownloadProgress", parsed)
							//log.Println("Progress:", parsed)
						}
					}
				}
			}

			// Check if process is still running
			if cmd.ProcessState != nil && cmd.ProcessState.Exited() {
				break
			}

			time.Sleep(500 * time.Millisecond) // Check every 500ms
		}
	}()

	err = cmd.Wait()
	if err != nil {
		return fmt.Errorf("failed to download granite model: %v", err)
	}
	runtime.EventsEmit(a.ctx, "graniteDownloadProgress", map[string]interface{}{"done": true, "message": "Granite model downloaded successfully."})
	return nil
}

func parseGraniteProgress(line string) map[string]interface{} {
	// Remove carriage returns and clear line ANSI escape sequences
	cleaned := strings.ReplaceAll(line, "\x1b[2K", "") // clear line ANSI escape
	cleaned = strings.ReplaceAll(cleaned, "\r", "")
	cleaned = strings.ReplaceAll(cleaned, "\n", " ")
	//log.Println("[parseGraniteProgress] cleaned:", cleaned)
	// Ignore non-progress lines (e.g., pulling manifest, preparing layers, etc.)
	if strings.Contains(cleaned, "manifest") || strings.Contains(cleaned, "preparing") || strings.Contains(cleaned, "waiting") {
		//log.Println("[parseGraniteProgress] ignored (manifest/preparing/waiting):", cleaned)
		return nil
	}
	// Example line:
	// 25/06/28 10:45:18 pulling 77bcee066a76:  20% ▕███               ▏ 999 MB/4.9 GB   25 MB/s   2m36s
	// Look for the percentage and data pattern specifically
	re := regexp.MustCompile(`(\d+)%.*?(\d+(?:\.\d+)?)\s+(MB|GB)/(\d+(?:\.\d+)?)\s+(GB|MB)\s+(\d+(?:\.\d+)?)\s+(MB/s|GB/s)\s+(\d+[a-zA-Z]*(?:\d+[a-zA-Z]*)?)`)
	matches := re.FindStringSubmatch(cleaned)
	if len(matches) >= 8 {
		currentSize := matches[2]
		currentUnit := matches[3]
		totalSize := matches[4]
		totalUnit := matches[5]
		speed := matches[6] + " " + matches[7]
		timeLeft := matches[8]

		// Clean up the timeLeft field to remove any trailing unnecessary text
		timeLeft = regexp.MustCompile(`^(\d+[a-zA-Z]*(?:\d+[a-zA-Z]*)?)`).FindString(timeLeft)

		// Convert to consistent units (MB)
		currentMB := currentSize
		if currentUnit == "GB" {
			if val, err := strconv.ParseFloat(currentSize, 64); err == nil {
				currentMB = fmt.Sprintf("%.1f", val*1024)
			}
		}

		totalGB := totalSize
		if totalUnit == "MB" {
			if val, err := strconv.ParseFloat(totalSize, 64); err == nil {
				totalGB = fmt.Sprintf("%.1f", val/1024)
			}
		}

		return map[string]interface{}{
			"percentage": matches[1],
			"currentMB":  currentMB,
			"totalGB":    totalGB,
			"speed":      speed,
			"timeLeft":   timeLeft,
		}
	}
	log.Println("[parseGraniteProgress] not matched:", cleaned)
	return nil
}

// Database methods for workspaces
func (a *App) CreateWorkspace(title, description string) (*Workspace, error) {
	return CreateWorkspace(title, description)
}

func (a *App) GetAllWorkspaces() ([]Workspace, error) {
	return GetAllWorkspaces()
}

func (a *App) GetWorkspaceByID(id uint) (*Workspace, error) {
	return GetWorkspaceByID(id)
}

func (a *App) UpdateWorkspace(id uint, title, description string) (*Workspace, error) {
	return UpdateWorkspace(id, title, description)
}

func (a *App) UpdateWorkspaceLastOpen(id uint) error {
	return UpdateWorkspaceLastOpen(id)
}

func (a *App) DeleteWorkspace(id uint) error {
	return DeleteWorkspace(id)
}

// Transcription database methods
func (a *App) CreateTranscriptionMessage(messageID string, workspaceID uint, text, speaker, source, messageType string, timestamp time.Time) (*TranscriptionRecord, error) {
	return CreateTranscriptionMessage(messageID, workspaceID, text, speaker, source, messageType, timestamp)
}

func (a *App) GetTranscriptionMessagesByWorkspace(workspaceID uint) ([]TranscriptionRecord, error) {
	return GetTranscriptionMessagesByWorkspace(workspaceID)
}

func (a *App) GetTranscriptionMessageByID(id uint) (*TranscriptionRecord, error) {
	return GetTranscriptionMessageByID(id)
}

func (a *App) GetTranscriptionMessageByMessageID(messageID string) (*TranscriptionRecord, error) {
	return GetTranscriptionMessageByMessageID(messageID)
}

func (a *App) UpdateTranscriptionMessage(messageID string, text, speaker string, timestamp time.Time) (*TranscriptionRecord, error) {
	return UpdateTranscriptionMessage(messageID, text, speaker, timestamp)
}

func (a *App) DeleteTranscriptionMessage(id uint) error {
	return DeleteTranscriptionMessage(id)
}

func (a *App) DeleteTranscriptionMessagesByWorkspace(workspaceID uint) error {
	return DeleteTranscriptionMessagesByWorkspace(workspaceID)
}

func (a *App) GetTranscriptionMessagesByDateRange(workspaceID uint, startTime, endTime time.Time) ([]TranscriptionRecord, error) {
	return GetTranscriptionMessagesByDateRange(workspaceID, startTime, endTime)
}

// File dialog methods
func (a *App) OpenMultipleFilesDialog() ([]string, error) {
	options := runtime.OpenDialogOptions{
		Title: "Select Files for Knowledge Base",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Document Files",
				Pattern:     "*.pdf;*.docx;*.txt",
			},
			{
				DisplayName: "PDF Files",
				Pattern:     "*.pdf",
			},
			{
				DisplayName: "Word Documents",
				Pattern:     "*.docx",
			},
			{
				DisplayName: "Text Files",
				Pattern:     "*.txt",
			},
			{
				DisplayName: "All Files",
				Pattern:     "*",
			},
		},
		ShowHiddenFiles:            false,
		TreatPackagesAsDirectories: false,
	}

	filePaths, err := runtime.OpenMultipleFilesDialog(a.ctx, options)
	if err != nil {
		log.Printf("Error opening file dialog: %v", err)
		return nil, err
	}

	log.Printf("Selected files: %v", filePaths)
	return filePaths, nil
}

// MoveFilesToYumesession copies a list of files to the yumesession directory and returns the filenames
func (a *App) MoveFilesToYumesession(filePaths []string) ([]string, error) {
	destDir := "yumesession/knowledge_base"
	if err := os.MkdirAll(destDir, 0755); err != nil {
		log.Printf("Error creating directory %s: %v", destDir, err)
		return nil, fmt.Errorf("failed to create destination directory: %w", err)
	}

	var copiedFiles []string

	for _, sourcePath := range filePaths {
		fileName := filepath.Base(sourcePath)
		destPath := filepath.Join(destDir, fileName)

		log.Printf("Copying file from %s to %s", sourcePath, destPath)

		// Open source file
		sourceFile, err := os.Open(sourcePath)
		if err != nil {
			log.Printf("Error opening source file %s: %v", sourcePath, err)
			return nil, fmt.Errorf("failed to open source file %s: %w", sourcePath, err)
		}
		defer sourceFile.Close()

		// Create destination file
		destFile, err := os.Create(destPath)
		if err != nil {
			log.Printf("Error creating destination file %s: %v", destPath, err)
			return nil, fmt.Errorf("failed to create destination file %s: %w", destPath, err)
		}
		defer destFile.Close()

		// Copy the file contents
		_, err = io.Copy(destFile, sourceFile)
		if err != nil {
			log.Printf("Error copying file %s: %v", sourcePath, err)
			return nil, fmt.Errorf("failed to copy file %s: %w", sourcePath, err)
		}

		// Add the filename to the list of successfully copied files
		copiedFiles = append(copiedFiles, fileName)
	}

	log.Printf("Successfully copied %d files to %s", len(filePaths), destDir)
	return copiedFiles, nil
}

func (a *App) OpenAndGetPDFData(pdfFilePath string) ([]byte, error) {
	// If path doesn't start with "/", make it relative to current working directory
	if !strings.HasPrefix(pdfFilePath, "/") {
		pwd, err := os.Getwd()
		if err != nil {
			log.Printf("Error getting current working directory: %v", err)
			return nil, fmt.Errorf("failed to get current working directory: %w", err)
		}
		pdfFilePath = filepath.Join(pwd, pdfFilePath)
	}

	return ioutil.ReadFile(pdfFilePath)
}

// Knowledge Base methods
func (a *App) CreateKnowledgeBaseItem(uniqueFileName, itemType, oneLineSummary, fullSummary string) (*KnowledgeBase, error) {
	return CreateKnowledgeBaseItem(uniqueFileName, itemType, oneLineSummary, fullSummary)
}

func (a *App) GetAllKnowledgeBaseItems() ([]KnowledgeBase, error) {
	return GetAllKnowledgeBaseItems()
}

func (a *App) GetKnowledgeBaseItemByID(id uint) (*KnowledgeBase, error) {
	return GetKnowledgeBaseItemByID(id)
}

func (a *App) GetKnowledgeBaseItemsByType(itemType string) ([]KnowledgeBase, error) {
	return GetKnowledgeBaseItemsByType(itemType)
}

func (a *App) GetKnowledgeBaseItemByUniqueFileName(uniqueFileName string) (*KnowledgeBase, error) {
	return GetKnowledgeBaseItemByUniqueFileName(uniqueFileName)
}

func (a *App) UpdateKnowledgeBaseItem(id uint, uniqueFileName, itemType, oneLineSummary, fullSummary string) (*KnowledgeBase, error) {
	return UpdateKnowledgeBaseItem(id, uniqueFileName, itemType, oneLineSummary, fullSummary)
}

func (a *App) DeleteKnowledgeBaseItem(id uint) error {
	return DeleteKnowledgeBaseItem(id)
}

func (a *App) SearchKnowledgeBaseItems(searchTerm string) ([]KnowledgeBase, error) {
	return SearchKnowledgeBaseItems(searchTerm)
}
